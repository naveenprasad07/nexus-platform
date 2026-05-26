import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, catchError, finalize, of } from 'rxjs';
import { UserApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { User, QueryParams, PaginationMeta } from '../../core/models';
import { UserDialogComponent } from './user-dialog.component';

@Component({
  selector: 'nx-admin',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatMenuModule,
    MatTooltipModule, MatDialogModule, MatChipsModule,
    MatProgressBarModule, MatSlideToggleModule,
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit, OnDestroy {
  users      = signal<User[]>([]);
  meta       = signal<PaginationMeta | null>(null);
  isLoading  = signal(true);
  error      = signal('');
  stats      = signal<{ total: number; active: number; admins: number } | null>(null);

  searchCtrl = new FormControl('');
  roleCtrl   = new FormControl('');

  query: QueryParams = { page: 1, limit: 10, sort: 'createdAt', order: 'desc' };

  displayedColumns = ['user', 'userId', 'role', 'department', 'status', 'lastLogin', 'actions'];

  currentUserId = computed(() => this.authService.currentUserId());

  private destroy$ = new Subject<void>();

  constructor(
    private userApi: UserApiService,
    readonly authService: AuthService,
    private toast: ToastService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadStats();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch(): void {
    this.searchCtrl.valueChanges.pipe(
      debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$),
    ).subscribe((val) => {
      this.query = { ...this.query, search: val ?? '', page: 1 };
      this.loadUsers();
    });
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.error.set('');

    const q: QueryParams = { ...this.query };
    if (this.roleCtrl.value) (q as any).role = this.roleCtrl.value;

    this.userApi.getAll(q).pipe(
      catchError((err) => {
        this.error.set(err?.error?.message || 'Failed to load users');
        return of({ data: [], meta: null as any });
      }),
      finalize(() => this.isLoading.set(false)),
    ).subscribe(({ data, meta }) => {
      this.users.set(data);
      this.meta.set(meta);
    });
  }

  loadStats(): void {
    this.userApi.getStats().pipe(catchError(() => of(null)))
      .subscribe((s) => { if (s) this.stats.set(s); });
  }

  onPageChange(e: PageEvent): void {
    this.query = { ...this.query, page: e.pageIndex + 1, limit: e.pageSize };
    this.loadUsers();
  }

  onFilterChange(): void {
    this.query = { ...this.query, page: 1 };
    this.loadUsers();
  }

  openCreate(): void {
    const ref = this.dialog.open(UserDialogComponent, {
      width: '520px', maxWidth: '95vw',
      data: { mode: 'create' }, panelClass: 'nx-dialog',
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) { this.loadUsers(); this.loadStats(); this.toast.success('User created'); }
    });
  }

  openEdit(user: User): void {
    const ref = this.dialog.open(UserDialogComponent, {
      width: '520px', maxWidth: '95vw',
      data: { mode: 'edit', user }, panelClass: 'nx-dialog',
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) { this.loadUsers(); this.toast.success('User updated'); }
    });
  }

  toggleActive(user: User): void {
    this.userApi.update(user._id, { isActive: !user.isActive }).pipe(
      catchError((err) => { this.toast.error(err?.error?.message || 'Failed'); return of(null); }),
    ).subscribe((u) => {
      if (u) {
        this.users.update((list) => list.map((x) => x._id === u._id ? u : x));
        this.toast.success(`User ${u.isActive ? 'activated' : 'deactivated'}`);
      }
    });
  }

  changeRole(user: User, role: 'admin' | 'user'): void {
    if (user.role === role) return;
    this.userApi.update(user._id, { role }).pipe(
      catchError((err) => { this.toast.error(err?.error?.message || 'Failed'); return of(null); }),
    ).subscribe((u) => {
      if (u) {
        this.users.update((list) => list.map((x) => x._id === u._id ? u : x));
        this.toast.success(`Role updated to ${role}`);
      }
    });
  }

  deleteUser(user: User): void {
    if (user._id === this.currentUserId()) { this.toast.error("You can't delete yourself"); return; }
    if (!confirm(`Delete user "${user.firstName} ${user.lastName}"? This cannot be undone.`)) return;

    this.userApi.delete(user._id).pipe(
      catchError((err) => { this.toast.error(err?.error?.message || 'Delete failed'); return of(null); }),
    ).subscribe(() => {
      this.loadUsers();
      this.loadStats();
      this.toast.success('User deleted');
    });
  }

  trackByUser(_: number, u: User): string { return u._id; }
}
