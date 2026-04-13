import { Injectable, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Sanitizes a model name to prevent shell injection.
 * Only allows alphanumeric characters, hyphens, underscores, dots, and slashes.
 */
function sanitizeModelName(model: string | undefined): string | undefined {
  if (!model) return undefined;
  // Remove any characters that could be used for shell injection
  const sanitized = model.replace(/[^a-zA-Z0-9._\-\/]/g, '');
  if (sanitized !== model) {
    throw new BadRequestException('Invalid model name: contains forbidden characters');
  }
  return sanitized;
}

@Injectable()
export class OpenclawService {
  private gatewayUrl = 'http://127.0.0.1:18789';

  async status(): Promise<any> {
    try {
      const { stdout } = await execAsync('openclaw status --json 2>/dev/null');
      return JSON.parse(stdout);
    } catch (error) {
      throw new HttpException(
        `Error getting OpenClaw status: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async launch(model?: string): Promise<any> {
    try {
      // Sanitize model name to prevent shell injection
      const safeModel = sanitizeModelName(model);
      
      const cmd = safeModel 
        ? `ollama launch openclaw --model "${safeModel}" --yes` 
        : 'ollama launch openclaw';
      await execAsync(cmd);
      return { success: true, message: 'OpenClaw launched' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new HttpException(
        `Error launching OpenClaw: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async stop(): Promise<any> {
    try {
      await execAsync('openclaw gateway stop');
      return { success: true, message: 'OpenClaw gateway stopped' };
    } catch (error) {
      throw new HttpException(
        `Error stopping OpenClaw: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async restart(): Promise<any> {
    try {
      await execAsync('openclaw gateway restart');
      return { success: true, message: 'OpenClaw gateway restarted' };
    } catch (error) {
      throw new HttpException(
        `Error restarting OpenClaw: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async listAgents(): Promise<any> {
    try {
      const { stdout } = await execAsync('openclaw sessions list --json 2>/dev/null');
      return JSON.parse(stdout);
    } catch (error) {
      throw new HttpException(
        `Error listing agents: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async logs(tail = 50): Promise<any> {
    try {
      const { stdout } = await execAsync(`openclaw logs --tail ${tail}`);
      return { logs: stdout };
    } catch (error) {
      throw new HttpException(
        `Error getting logs: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}