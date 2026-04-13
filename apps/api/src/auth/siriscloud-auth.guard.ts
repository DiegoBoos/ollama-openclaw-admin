import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

/**
 * Guard that validates JWT tokens against Siriscloud Auth service.
 * Protects sensitive endpoints (launch, stop, restart).
 */
@Injectable()
export class SiriscloudAuthGuard implements CanActivate {
  private authUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.authUrl = this.configService.get('SIRISCLOUD_AUTH_URL') || '';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.substring(7);

    // Skip validation in development if no auth URL configured
    if (!this.authUrl && process.env.NODE_ENV === 'development') {
      console.warn('[SiriscloudAuthGuard] Skipping auth validation in development');
      return true;
    }

    if (!this.authUrl) {
      throw new UnauthorizedException('Auth service not configured');
    }

    try {
      const response = await this.httpService.axiosRef.post(
        `${this.authUrl}/api/auth/validate`,
        { token },
        { timeout: 5000 },
      );

      if (response.data?.valid === true || response.data?.success === true) {
        // Attach user info to request for later use
        request.user = response.data.user || response.data;
        return true;
      }

      throw new UnauthorizedException('Invalid token');
    } catch (error) {
      if (error.response?.status === 401) {
        throw new UnauthorizedException('Token validation failed');
      }
      throw new UnauthorizedException(`Auth service error: ${error.message}`);
    }
  }
}
