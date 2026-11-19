import { Injectable, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room, RoomDocument, RoomStatus } from '../../entities/room.entity.js';

interface HistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class ChatService {
  constructor(@InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>) {}

  async reply(message: string, history: HistoryItem[] = []): Promise<{ reply: string }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Chưa cấu hình GEMINI_API_KEY. Vui lòng thêm vào file .env.',
      );
    }

    // Lấy danh sách phòng khả dụng làm ngữ cảnh cho AI
    const rooms = await this.roomModel
      .find({ status: RoomStatus.AVAILABLE })
      .select('name roomType pricePerNight capacity address amenities rating totalReviews')
      .limit(20)
      .lean()
      .exec();

    const roomContext = rooms
      .map((r: any, i: number) => {
        const addr = r.address ? `${r.address.city || ''}`.trim() : '';
        const amenities = (r.amenities || []).slice(0, 6).join(', ');
        return `${i + 1}. ${r.name} — ${addr} | ${r.roomType} | ${r.pricePerNight?.toLocaleString('vi-VN')}đ/đêm | sức chứa ${r.capacity} khách | tiện ích: ${amenities || '—'} | rating ${r.rating ?? 5}/5 (${r.totalReviews ?? 0} đánh giá)`;
      })
      .join('\n');

    const systemPrompt =
      'Bạn là trợ lý AI thân thiện của website Homestay Booking (đặt phòng homestay/khách sạn). ' +
      'Trả lời bằng tiếng Việt, ngắn gọn, hữu ích. Dùng dữ liệu phòng bên dưới để tư vấn phòng phù hợp với yêu cầu của khách (địa điểm, giá, số khách, tiện ích). ' +
      'Nếu không có phòng phù hợp hoặc không có thông tin, hãy nói rõ và gợi ý khách lọc/tìm trên trang chủ. Không bịa đặt giá hay thông tin không có. ' +
      'Khi gợi ý phòng, nêu tên phòng và giá. Không trả lời các chủ đề ngoài phạm vi đặt phòng du lịch.\n\n' +
      'DANH SÁCH PHÒNG HIỆN CÓ:\n' +
      (roomContext || '(Chưa có phòng khả dụng)');

    // Xây dựng contents cho Gemini (role: user/model)
    const contents: { role: string; parts: { text: string }[] }[] = [];
    // System prompt đưa vào như user message đầu tiên (Gemini 1.5 hỗ trợ systemInstruction, nhưng dùng prepend đơn giản)
    contents.push({ role: 'user', parts: [{ text: systemPrompt }] });
    contents.push({ role: 'model', parts: [{ text: 'Đã hiểu. Tôi sẵn sàng tư vấn.' }] });

    for (const h of history.slice(-8)) {
      contents.push({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      });
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    let res: Response | null = null;
    let lastErr = '';
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
          }),
        });
      } catch {
        throw new ServiceUnavailableException('Không thể kết nối tới Gemini.');
      }

      if (res.ok) break;

      const text = await res.text().catch(() => '');
      lastErr = `Gemini lỗi (${res.status}): ${text.slice(0, 200)}`;
      // Retry on transient high-demand / server errors
      if (res.status === 503 || res.status === 429 || res.status >= 500) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        res = null;
        continue;
      }
      throw new ServiceUnavailableException(lastErr);
    }

    if (!res || !res.ok) {
      throw new ServiceUnavailableException(
        lastErr || 'Gemini đang quá tải, vui lòng thử lại sau.',
      );
    }

    const data: any = await res.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('')?.trim() ||
      'Xin lỗi, tôi chưa thể trả lời lúc này. Vui lòng thử lại.';

    return { reply };
  }
}