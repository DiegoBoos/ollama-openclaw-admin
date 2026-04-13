import { IsString, IsOptional, IsObject, MaxLength, IsNumber, Min, Max } from 'class-validator';

/**
 * DTO for /ollama/generate endpoint
 * Validates prompt generation requests
 */
export class GenerateDto {
  @IsString()
  @MaxLength(50000, { message: 'Prompt exceeds maximum length of 50000 characters' })
  prompt: string;

  @IsString()
  @MaxLength(100, { message: 'Model name exceeds maximum length' })
  model: string;

  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4)
  num_predict?: number;
}

/**
 * DTO for /ollama/chat endpoint
 * Validates chat completion requests
 */
export class ChatDto {
  @IsString()
  @MaxLength(100, { message: 'Model name exceeds maximum length' })
  model: string;

  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  num_ctx?: number;
}

/**
 * Message structure validation
 */
export class ChatMessage {
  @IsString()
  role: 'system' | 'user' | 'assistant';

  @IsString()
  @MaxLength(50000, { message: 'Message content exceeds maximum length' })
  content: string;
}