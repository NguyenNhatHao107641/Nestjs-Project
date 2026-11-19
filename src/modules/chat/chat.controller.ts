import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ChatService } from './chat.service.js';
import { ChatMessageDto } from './dto/chat.dto.js';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  async chat(@Body() dto: ChatMessageDto) {
    return this.chatService.reply(dto.message, dto.history || []);
  }
}