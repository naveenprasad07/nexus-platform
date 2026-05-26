import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse, PaginatedResult, QueryParams,
  User, CreateUserPayload, UpdateUserPayload,
  RecordItem, CreateRecordPayload, UpdateRecordPayload,
  DashboardAnalytics, ActivityLog,
} from '../models';

// ─── Helper ───────────────────────────────────────────────────────────────────

const buildParams = (query: QueryParams = {}): HttpParams => {
  let params = new HttpParams();
  Object.entries(query).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      params = params.set(key, String(val));
    }
  });
  return params;
};

// ─── User Service ──────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private base = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAll(query: QueryParams = {}): Observable<PaginatedResult<User>> {
    return this.http
      .get<ApiResponse<User[]>>(this.base, { params: buildParams(query) })
      .pipe(map((res) => ({ data: res.data!, meta: res.meta! })));
  }

  getById(id: string): Observable<User> {
    return this.http
      .get<ApiResponse<{ user: User }>>(`${this.base}/${id}`)
      .pipe(map((res) => res.data!.user));
  }

  create(payload: CreateUserPayload): Observable<User> {
    return this.http
      .post<ApiResponse<{ user: User }>>(this.base, payload)
      .pipe(map((res) => res.data!.user));
  }

  update(id: string, payload: UpdateUserPayload): Observable<User> {
    return this.http
      .put<ApiResponse<{ user: User }>>(`${this.base}/${id}`, payload)
      .pipe(map((res) => res.data!.user));
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse>(`${this.base}/${id}`)
      .pipe(map(() => void 0));
  }

  getStats(): Observable<{ total: number; active: number; admins: number }> {
    return this.http
      .get<ApiResponse<{ total: number; active: number; admins: number }>>(`${this.base}/stats`)
      .pipe(map((res) => res.data!));
  }
}

// ─── Record Service ────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class RecordApiService {
  private base = `${environment.apiUrl}/records`;

  constructor(private http: HttpClient) {}

  getAll(query: QueryParams = {}): Observable<PaginatedResult<RecordItem>> {
    return this.http
      .get<ApiResponse<RecordItem[]>>(this.base, { params: buildParams(query) })
      .pipe(map((res) => ({ data: res.data!, meta: res.meta! })));
  }

  getById(id: string): Observable<RecordItem> {
    return this.http
      .get<ApiResponse<{ record: RecordItem }>>(`${this.base}/${id}`)
      .pipe(map((res) => res.data!.record));
  }

  create(payload: CreateRecordPayload): Observable<RecordItem> {
    return this.http
      .post<ApiResponse<{ record: RecordItem }>>(this.base, payload)
      .pipe(map((res) => res.data!.record));
  }

  update(id: string, payload: UpdateRecordPayload): Observable<RecordItem> {
    return this.http
      .put<ApiResponse<{ record: RecordItem }>>(`${this.base}/${id}`, payload)
      .pipe(map((res) => res.data!.record));
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse>(`${this.base}/${id}`)
      .pipe(map(() => void 0));
  }
}

// ─── Dashboard Service ─────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private base = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getAnalytics(): Observable<DashboardAnalytics> {
    return this.http
      .get<ApiResponse<DashboardAnalytics>>(`${this.base}/analytics`)
      .pipe(map((res) => res.data!));
  }

  getActivityLogs(): Observable<ActivityLog[]> {
    return this.http
      .get<ApiResponse<ActivityLog[]>>(`${this.base}/activity`)
      .pipe(map((res) => res.data!));
  }
}
