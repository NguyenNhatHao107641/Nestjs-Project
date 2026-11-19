import { IsString, IsOptional, IsArray, MaxLength } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  @MaxLength(2000)
  message!: string;

  @IsOptional()
  @IsArray()
  history?: { role: 'user' | 'assistant'; content: string }[];
}