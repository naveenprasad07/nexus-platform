import { Injectable } from '@angular/core';
import {
  HttpRequest, HttpHandler, HttpEvent,
  HttpInterceptor, HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import {
  catchError, switchMap, filter,
  take, finalize, retryWhen, delay, mergeMap,
} from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getAccessToken();

    const authReq = token ? this.addToken(req, token) : req;

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !req.url.includes('/auth/')) {
          return this.handle401(authReq, next);
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  private handle401(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter((token) => token !== null),
        take(1),
        switchMap((token) => next.handle(this.addToken(req, token!)))
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    return this.authService.refreshToken().pipe(
      switchMap((tokens) => {
        this.refreshTokenSubject.next(tokens.accessToken);
        return next.handle(this.addToken(req, tokens.accessToken));
      }),
      catchError((err) => {
        this.authService.logout();
        return throwError(() => err);
      }),
      finalize(() => { this.isRefreshing = false; })
    );
  }
}

// ─── Retry Interceptor ─────────────────────────────────────────────────────────

@Injectable()
export class RetryInterceptor implements HttpInterceptor {
  private readonly maxRetries = environment.maxRetries;
  private readonly retryDelay = environment.retryDelay;
  private readonly retryStatuses = [0, 503, 502, 504];

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      retryWhen((errors) =>
        errors.pipe(
          mergeMap((error: HttpErrorResponse, attempt) => {
            const shouldRetry =
              attempt < this.maxRetries && this.retryStatuses.includes(error.status);
            if (!shouldRetry) return throwError(() => error);
            const backoffDelay = this.retryDelay * Math.pow(2, attempt);
            return of(error).pipe(delay(backoffDelay));
          })
        )
      )
    );
  }
}
