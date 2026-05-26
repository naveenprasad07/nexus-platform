import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, LoginPayload, AuthTokens, ApiResponse } from '../models';

const TOKEN_KEY   = 'nx_access_token';
const REFRESH_KEY = 'nx_refresh_token';
const USER_KEY    = 'nx_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // ── Signals ──────────────────────────────────────────────────────────────
  private _user   = signal<User | null>(this.loadUser());
  private _tokens = signal<AuthTokens | null>(this.loadTokens());

  readonly user          = this._user.asReadonly();
  readonly tokens        = this._tokens.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user() && !!this._tokens()?.accessToken);
  readonly isAdmin         = computed(() => this._user()?.role === 'admin');
  readonly currentUserId   = computed(() => this._user()?._id ?? null);

  constructor(private http: HttpClient, private router: Router) {}

  // ── Auth Methods ──────────────────────────────────────────────────────────

  login(payload: LoginPayload): Observable<{ user: User; tokens: AuthTokens }> {
    return this.http
      .post<ApiResponse<{ user: User; tokens: AuthTokens }>>(`${this.apiUrl}/login`, payload)
      .pipe(
        map((res) => res.data!),
        tap(({ user, tokens }) => this.persist(user, tokens)),
        catchError((err) => throwError(() => err))
      );
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({ error: () => {} });
    this.clear();
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<AuthTokens> {
    const refreshToken = this._tokens()?.refreshToken;
    if (!refreshToken) return throwError(() => new Error('No refresh token'));

    return this.http
      .post<ApiResponse<{ tokens: AuthTokens }>>(`${this.apiUrl}/refresh`, { refreshToken })
      .pipe(
        map((res) => res.data!.tokens),
        tap((tokens) => {
          this._tokens.set(tokens);
          localStorage.setItem(TOKEN_KEY,   tokens.accessToken);
          localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
        })
      );
  }

  fetchMe(): Observable<User> {
    return this.http
      .get<ApiResponse<{ user: User }>>(`${this.apiUrl}/me`)
      .pipe(
        map((res) => res.data!.user),
        tap((user) => {
          this._user.set(user);
          localStorage.setItem(USER_KEY, JSON.stringify(user));
        })
      );
  }

  getAccessToken(): string | null {
    return this._tokens()?.accessToken ?? localStorage.getItem(TOKEN_KEY);
  }

  // ── Persistence ───────────────────────────────────────────────────────────

  private persist(user: User, tokens: AuthTokens): void {
    this._user.set(user);
    this._tokens.set(tokens);
    localStorage.setItem(USER_KEY,    JSON.stringify(user));
    localStorage.setItem(TOKEN_KEY,   tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  }

  private clear(): void {
    this._user.set(null);
    this._tokens.set(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }

  private loadUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  private loadTokens(): AuthTokens | null {
    const access  = localStorage.getItem(TOKEN_KEY);
    const refresh = localStorage.getItem(REFRESH_KEY);
    if (!access || !refresh) return null;
    return { accessToken: access, refreshToken: refresh, expiresIn: 0 };
  }
}
