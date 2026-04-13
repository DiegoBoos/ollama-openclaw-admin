import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { pino, Logger } from 'pino';

/**
 * Structured logging middleware with request IDs.
 * Logs all incoming requests with timing and response status.
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger: Logger;

  constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      formatters: {
        level: (label) => ({ level: label }),
      },
      timestamp: () => `,"time":"${new Date().toISOString()}"`,
      base: undefined, // Remove pid/hostname from base
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    // Generate or use existing request ID
    const requestId =
      (req.headers['x-request-id'] as string) ||
      `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Attach to request for downstream use
    (req as any).requestId = requestId;

    // Log request
    this.logger.info({
      msg: 'Incoming request',
      requestId,
      method: req.method,
      url: req.originalUrl,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    // Log response on finish
    res.on('finish', () => {
      const duration = Date.now() - startTime;

      const logData = {
        msg: 'Request completed',
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        contentLength: res.getHeader('content-length'),
      };

      if (res.statusCode >= 400) {
        this.logger.warn(logData);
      } else {
        this.logger.info(logData);
      }
    });

    // Add request ID to response headers
    res.setHeader('x-request-id', requestId);

    next();
  }
}