import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

/**
 * Global timeout interceptor.
 * Prevents requests from hanging indefinitely.
 *
 * Default timeout: 30 seconds
 * Can be overridden per-route via request context.
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(private readonly timeoutMs: number = 30000) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Allow per-request timeout override via header
    const request = context.switchToHttp().getRequest();
    const customTimeout = request.headers?.['x-request-timeout'];

    const timeoutValue = customTimeout
      ? Math.min(parseInt(customTimeout, 10), 60000) // Max 60s
      : this.timeoutMs;

    return next.handle().pipe(
      timeout(timeoutValue),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(
            () =>
              new RequestTimeoutException(
                `Request timed out after ${timeoutValue}ms`,
              ),
          );
        }
        return throwError(() => err);
      }),
    );
  }
}