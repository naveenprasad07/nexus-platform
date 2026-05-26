import { Component, OnInit, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize, catchError, of } from 'rxjs';
import { RecordApiService, UserApiService } from '../../core/services/api.service';
import { RecordItem, User } from '../../core/models';

interface DialogData {
  mode: 'create' | 'edit';
  record?: RecordItem;
}

@Component({
  selector: 'nx-record-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="dialog-title-row">
          <mat-icon class="dialog-icon">{{ data.mode === 'create' ? 'add_circle' : 'edit' }}</mat-icon>
          <h2 class="dialog-title">{{ data.mode === 'create' ? 'Create Record' : 'Edit Record' }}</h2>
        </div>
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="dialog-form">

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" placeholder="Record title">
          <mat-error *ngIf="f['title'].errors?.['required']">Title is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3" placeholder="Describe the task..."></textarea>
          <mat-error *ngIf="f['description'].errors?.['required']">Description is required</mat-error>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              <mat-option *ngFor="let s of statuses" [value]="s">{{ s | titlecase }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Priority</mat-label>
            <mat-select formControlName="priority">
              <mat-option *ngFor="let p of priorities" [value]="p">{{ p | titlecase }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Assigned To</mat-label>
            <mat-select formControlName="assignedTo">
              <mat-option *ngFor="let u of users()" [value]="u._id">
                {{ u.firstName }} {{ u.lastName }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="f['assignedTo'].errors?.['required']">Required</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Category</mat-label>
            <mat-select formControlName="category">
              <mat-option *ngFor="let c of categories" [value]="c">{{ c | titlecase }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Estimated Hours</mat-label>
            <input matInput type="number" formControlName="estimatedHours" min="0">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Due Date</mat-label>
            <input matInput type="date" formControlName="dueDate">
          </mat-form-field>
        </div>

        <div class="error-msg" *ngIf="serverError()">
          <mat-icon>error</mat-icon> {{ serverError() }}
        </div>

        <div class="dialog-actions">
          <button mat-stroked-button type="button" (click)="close()">Cancel</button>
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || isSaving()">
            <mat-spinner *ngIf="isSaving()" diameter="16"></mat-spinner>
            <span>{{ isSaving() ? 'Saving...' : (data.mode === 'create' ? 'Create' : 'Update') }}</span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .dialog-container { padding: 0; }
    .dialog-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px 0; margin-bottom: 20px;
    }
    .dialog-title-row { display: flex; align-items: center; gap: 12px; }
    .dialog-icon { color: var(--color-primary-400); }
    .dialog-title { font-size: 18px; font-weight: 600; margin: 0; color: var(--color-text-primary); }
    .dialog-form { padding: 0 24px 24px; display: flex; flex-direction: column; gap: 4px; }
    .full-width { width: 100%; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
    .error-msg {
      display: flex; align-items: center; gap: 8px;
      color: var(--color-error); font-size: 13px;
      background: rgba(239,68,68,0.08); padding: 8px 12px;
      border-radius: var(--radius-sm); border: 1px solid rgba(239,68,68,0.2);
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    @media (max-width: 480px) { .form-row { grid-template-columns: 1fr; } }
  `],
})
export class RecordDialogComponent implements OnInit {
  form!: FormGroup;
  isSaving   = signal(false);
  serverError = signal('');
  users       = signal<User[]>([]);

  readonly statuses   = ['active', 'pending', 'completed', 'cancelled'];
  readonly priorities = ['low', 'medium', 'high', 'critical'];
  readonly categories = ['development', 'design', 'research', 'testing', 'deployment', 'maintenance', 'documentation'];

  constructor(
    private fb: FormBuilder,
    private recordApi: RecordApiService,
    private userApi: UserApiService,
    private dialogRef: MatDialogRef<RecordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadUsers();
  }

  get f() { return this.form.controls; }

  private buildForm(): void {
    const r = this.data.record;
    this.form = this.fb.group({
      title:          [r?.title ?? '', [Validators.required, Validators.maxLength(200)]],
      description:    [r?.description ?? '', [Validators.required]],
      status:         [r?.status ?? 'pending'],
      priority:       [r?.priority ?? 'medium'],
      assignedTo:     [r?.assignedTo?._id ?? '', Validators.required],
      category:       [r?.metadata?.category ?? 'development'],
      estimatedHours: [r?.metadata?.estimatedHours ?? 0, [Validators.min(0)]],
      dueDate:        [r?.dueDate ? new Date(r.dueDate).toISOString().split('T')[0] : ''],
    });
  }

  private loadUsers(): void {
    this.userApi.getAll({ limit: 100 })
      .pipe(catchError(() => of({ data: [], meta: null as any })))
      .subscribe(({ data }) => this.users.set(data));
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSaving()) return;
    this.isSaving.set(true);
    this.serverError.set('');

    const val = this.form.value;
    const payload = {
      title: val.title, description: val.description,
      status: val.status, priority: val.priority,
      assignedTo: val.assignedTo,
      dueDate: val.dueDate || undefined,
      metadata: { estimatedHours: val.estimatedHours, category: val.category },
    };

    const req$ = this.data.mode === 'create'
      ? this.recordApi.create(payload)
      : this.recordApi.update(this.data.record!._id, payload);

    req$.pipe(
      catchError((err) => {
        this.serverError.set(err?.error?.message || 'An error occurred');
        return of(null);
      }),
      finalize(() => this.isSaving.set(false)),
    ).subscribe((result) => { if (result) this.dialogRef.close(true); });
  }

  close(): void { this.dialogRef.close(false); }
}
