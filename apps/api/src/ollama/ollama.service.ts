import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable()
export class OllamaService {
  private baseUrl: string;

  constructor(private http: HttpService) {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  }

  // Listar modelos disponibles
  async listModels(): Promise<any> {
    try {
      const response = await this.http.axiosRef.get(`${this.baseUrl}/api/tags`);
      return response.data;
    } catch (error) {
      throw new HttpException(
        `Error fetching models: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // Generar completions (chat)
  async generate(prompt: string, model: string, options: any = {}): Promise<any> {
    try {
      const response = await this.http.axiosRef.post(`${this.baseUrl}/api/generate`, {
        model,
        prompt,
        ...options,
      });
      return response.data;
    } catch (error) {
      throw new HttpException(
        `Error generating: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // Chat completions
  async chat(messages: any[], model: string, options: any = {}): Promise<any> {
    try {
      const response = await this.http.axiosRef.post(`${this.baseUrl}/api/chat`, {
        model,
        messages,
        ...options,
      });
      return response.data;
    } catch (error) {
      throw new HttpException(
        `Error in chat: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // Verificar estado de Ollama
  async health(): Promise<{ status: string; models: number }> {
    try {
      const models = await this.listModels();
      return {
        status: 'connected',
        models: models.models?.length || 0,
      };
    } catch {
      return {
        status: 'disconnected',
        models: 0,
      };
    }
  }
}