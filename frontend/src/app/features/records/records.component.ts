import {
  Component, OnInit, OnDestroy, signal, computed, ViewChild, AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
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
import {
  Subject, debounceTime, distinctUntilChanged, takeUntil, catchError, finalize, of,
} from 'rxjs';
import { RecordApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { RecordItem, QueryParams, PaginationMeta } from '../../core/models';
import { RecordDialogComponent } from './record-dialog.component';

@Component({
  selector: 'nx-records',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatMenuModule,
    MatTooltipModule, MatDialogModule, MatChipsModule, MatProgressBarModule,
  ],
  templateUrl: './records.component.html',
  styleUrls: ['./records.component.scss'],
})
export class RecordsComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  records    = signal<RecordItem[]>([]);
  meta       = signal<PaginationMeta | null>(null);
  isLoading  = signal(true);
  error      = signal('');

  searchCtrl  = new FormControl('');
  statusCtrl  = new FormControl('');
  priorityCtrl = new FormControl('');

  query: QueryParams = { page: 1, limit: 10, sort: 'createdAt', order: 'desc' };

  isAdmin  = computed(() => this.authService.isAdmin());
  displayedColumns = computed(() => {
    const base = ['title', 'status', 'priority', 'assignedTo', 'dueDate', 'category', 'actions'];
    return base;
  });

  readonly statuses  = ['active', 'pending', 'completed', 'cancelled'];
  readonly priorities = ['low', 'medium', 'high', 'critical'];

  private destroy$ = new Subject<void>();

  constructor(
    private recordApi: RecordApiService,
    readonly authService: AuthService,
    private toast: ToastService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadRecords();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch(): void {
    this.searchCtrl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe((val) => {
      this.query = { ...this.query, search: val ?? '', page: 1 };
      this.loadRecords();
    });
  }

  loadRecords(): void {
    this.isLoading.set(true);
    this.error.set('');

    const q: QueryParams = {
      ...this.query,
      status:   this.statusCtrl.value   || undefined,
      priority: this.priorityCtrl.value || undefined,
    };

    this.recordApi.getAll(q).pipe(
      catchError((err) => {
        this.error.set(err?.error?.message || 'Failed to load records');
        return of({ data: [], meta: null as any });
      }),
      finalize(() => this.isLoading.set(false)),
    ).subscribe(({ data, meta }) => {
      this.records.set(data);
      this.meta.set(meta);
    });
  }

  onPageChange(e: PageEvent): void {
    this.query = { ...this.query, page: e.pageIndex + 1, limit: e.pageSize };
    this.loadRecords();
  }

  onSortChange(s: Sort): void {
    this.query = {
      ...this.query,
      sort:  s.active || 'createdAt',
      order: (s.direction || 'desc') as 'asc' | 'desc',
      page:  1,
    };
    this.loadRecords();
  }

  onFilterChange(): void {
    this.query = { ...this.query, page: 1 };
    this.loadRecords();
  }

  clearFilters(): void {
    this.searchCtrl.setValue('');
    this.statusCtrl.setValue('');
    this.priorityCtrl.setValue('');
    this.query = { page: 1, limit: 10, sort: 'createdAt', order: 'desc' };
    this.loadRecords();
  }

  openCreate(): void {
    const ref = this.dialog.open(RecordDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: { mode: 'create' },
      panelClass: 'nx-dialog',
    });
    ref.afterClosed().subscribe((result) => {
      if (result) { this.loadRecords(); this.toast.success('Record created successfully'); }
    });
  }

  openEdit(record: RecordItem): void {
    const ref = this.dialog.open(RecordDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: { mode: 'edit', record },
      panelClass: 'nx-dialog',
    });
    ref.afterClosed().subscribe((result) => {
      if (result) { this.loadRecords(); this.toast.success('Record updated'); }
    });
  }

  deleteRecord(record: RecordItem): void {
    if (!confirm(`Delete "${record.title}"?`)) return;
    this.recordApi.delete(record._id).pipe(
      catchError((err) => { this.toast.error(err?.error?.message || 'Delete failed'); return of(null); }),
    ).subscribe((res) => {
      if (res !== null || true) { this.loadRecords(); this.toast.success('Record deleted'); }
    });
  }

  exportCsv(): void {
    const headers = ['Title', 'Status', 'Priority', 'Assigned To', 'Category', 'Due Date'];
    const rows = this.records().map((r) => [
      `"${r.title}"`,
      r.status,
      r.priority,
      `${r.assignedTo?.firstName} ${r.assignedTo?.lastName}`,
      r.metadata.category,
      r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'records.csv'; a.click();
    URL.revokeObjectURL(url);
    this.toast.success('Exported to CSV');
  }

  trackByRecord(_: number, r: RecordItem): string { return r._id; }
}
