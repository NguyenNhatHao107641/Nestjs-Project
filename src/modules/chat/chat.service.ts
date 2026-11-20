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

    // Lấy danh sách phòng khả dụng làm ngữ cảnh cho AI / fallback
    const rooms = await this.roomModel
      .find({ status: RoomStatus.AVAILABLE })
      .select('name roomType pricePerNight capacity address amenities rating totalReviews')
      .limit(20)
      .lean()
      .exec();

    // Chế độ không có API key: trả lời rule-based từ DB để widget vẫn chạy được
    if (!apiKey) {
      return { reply: this.localReply(message, rooms) };
    }

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
    
// Danh sach model thu tu uu tien: model chinh (env) -> cac model fallback
    const primary = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    const fallbacks = ['gemini-3.8-flash', 'gemini-3.5-flash-lite'];
    const models = [primary, ...fallbacks].filter((m, i, arr) => arr.indexOf(m) === i);

    let res: Response | null = null;
    let lastErr = '';
    let usedModel = primary;

    outer: for (const model of models) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      res = null;
      lastErr = '';
      for (let attempt = 0; attempt < 2; attempt++) {
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
          lastErr = 'Khong the ket noi toi Gemini.';
          res = null;
          break;
        }

        if (res.ok) {
          usedModel = model;
          break outer;
        }

        const text = await res.text().catch(() => '');
        lastErr = `Gemini loi (${res.status}) [${model}]: ${text.slice(0, 200)}`;
        // Thu model khac neu qua tai / khong ton tai / loi server
        if (res.status === 404 || res.status === 429 || res.status === 503 || res.status >= 500) {
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
          res = null;
          continue;
        }
        // Loi khac (400/401/403) -> dung ngay
        break outer;
      }
    }

    if (!res || !res.ok) {
      // Tat ca model deu that bai (qua tai / khong ton tai): fallback sang che do co ban
      // de chat van tra loi duoc thay vi bao loi.
      const base = this.localReply(message, rooms);
      return { reply: base + '\n\n(Luu y: AI Gemini dang qua tai/khong kha dung, dang tra loi o che do co ban.)' };
    }

    const data: any = await res.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('')?.trim() ||
      'Xin loi, toi chua the tra loi luc nay. Vui long thu lai.';

    return { reply };
  }

  /**
   * Trả lời rule-based khi chưa có GEMINI_API_KEY — dùng dữ liệu phòng trong DB,
   * khớp từ khóa địa điểm / giá / số khách / tiện ích để widget luôn chạy được.
   */
  private localReply(message: string, rooms: any[]): string {
    const m = (message || '').toLowerCase();
    const fmt = (n: number) => (n || 0).toLocaleString('vi-VN') + 'đ';

    // Số khách
    const guestMatch = m.match(/(\d+)\s*(khách|người|nguoi)/);
    const guests = guestMatch ? parseInt(guestMatch[1], 10) : null;

    // Ngân sách: "dưới 500k", "tầm 1 triệu", "1.000.000"
    let maxPrice: number | null = null;
    const priceMatch = m.match(/(\d+(?:[.,]\d+)?)\s*(triệu|trien|nghìn|ngàn|tr|k)(?![a-zà-ỹ])/);
    if (priceMatch) {
      const val = parseFloat(priceMatch[1].replace(',', '.'));
      const unit = priceMatch[2];
      if (unit === 'k' || unit === 'nghìn' || unit === 'ngàn') maxPrice = val * 1000;
      else if (unit === 'tr' || unit === 'triệu' || unit === 'trien') maxPrice = val * 1000000;
    }
    if (/dưới|duoi|tối đa|toi da|<=/.test(m)) {
      // giữ maxPrice nếu đã parse được
    }

    // Địa điểm: khớp city của phòng
    const cities = Array.from(new Set(rooms.map((r) => (r.address?.city || '').trim()).filter(Boolean)));
    const city = cities.find((c) => m.includes(c.toLowerCase())) || null;

    // Tiện ích
    const amenityKeywords = ['wifi', 'hồ bơi', 'ho boi', 'bể bơi', 'bep', 'bếp', 'điều hòa', 'dieu hoa', 'máy lạnh', 'may lanh', 'ban công', 'ban cong', 'parking', 'đậu xe', 'dau xe'];
    const wantAmenity = amenityKeywords.find((a) => m.includes(a));

    let candidates = rooms.slice();
    if (city) candidates = candidates.filter((r) => (r.address?.city || '').toLowerCase() === city.toLowerCase());
    if (guests) candidates = candidates.filter((r) => (r.capacity || 0) >= guests);
    if (maxPrice) candidates = candidates.filter((r) => (r.pricePerNight || 0) <= maxPrice!);
    if (wantAmenity) {
      candidates = candidates.filter((r) =>
        (r.amenities || []).some((a: string) => a.toLowerCase().includes(wantAmenity)),
      );
    }

    // Sắp xếp theo rating giảm dần
    candidates.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

    if (candidates.length === 0) {
      // Gợi ý nới điều kiện
      const fallback = rooms.slice().sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 3);
      if (fallback.length === 0) {
        return 'Hiện chưa có phòng khả dụng trong hệ thống. Bạn có thể xem danh sách trên trang chủ StayNest nhé.';
      }
      const list = fallback
        .map((r) => `• ${r.name} — ${r.address?.city || 'Việt Nam'} | ${fmt(r.pricePerNight)}/đêm | sức chứa ${r.capacity} khách | ★ ${r.rating ?? 5}`)
        .join('\n');
      return `Tôi chưa tìm thấy phòng khớp chính xác yêu cầu của bạn. Dưới đây là một số phòng nổi bật:\n${list}\n\nBạn có thể nới điều kiện (địa điểm, giá, số khách) để tôi tư vấn chính xác hơn.`;
    }

    const top = candidates.slice(0, 3);
    const list = top
      .map((r) => `• ${r.name} — ${r.address?.city || 'Việt Nam'} | ${fmt(r.pricePerNight)}/đêm | sức chứa ${r.capacity} khách | ★ ${r.rating ?? 5} (${r.totalReviews ?? 0} đánh giá)`)
      .join('\n');

    let intro = 'Dựa trên yêu cầu của bạn, đây là các phòng phù hợp:';
    if (city) intro = `Các phòng phù hợp tại ${city}:`;
    if (guests && city) intro = `Phòng phù hợp cho ${guests} khách tại ${city}:`;

    let note = '';
    if (top.length < candidates.length) note = `\n\n(Còn ${candidates.length - top.length} phòng khác cũng khớp — bạn có thể lọc thêm trên trang chủ.)`;
    if (!process.env.GEMINI_API_KEY) {
      note += '\n\n(Lưu ý: chat đang chạy ở chế độ cơ bản. Thêm GEMINI_API_KEY vào .env để bật AI tư vấn nâng cao.)';
    }

    return `${intro}\n${list}${note}`;
  }
}