import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OllamaService } from './ollama.service';
import { GenerateDto, ChatDto } from '../dto';

@Controller('ollama')
export class OllamaController {
  constructor(private readonly ollamaService: OllamaService) {}

  @Get('health')
  async health() {
    return this.ollamaService.health();
  }

  @Get('models')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async listModels() {
    return this.ollamaService.listModels();
  }

  @Post('generate')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async generate(@Body() body: GenerateDto) {
    const { prompt, model, options } = body;
    return this.ollamaService.generate(prompt, model, options);
  }

  @Post('chat')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async chat(@Body() body: ChatDto) {
    const { model, options } = body;
    // Note: ChatDto validates structure, service handles messages
    return this.ollamaService.chat(body['messages'] || [], model, options);
  }
}