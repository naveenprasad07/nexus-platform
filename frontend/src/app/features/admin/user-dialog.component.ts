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
import { UserApiService } from '../../core/services/api.service';
import { User } from '../../core/models';

interface DialogData { mode: 'create' | 'edit'; user?: User; }

@Component({
  selector: 'nx-user-dialog',
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
          <mat-icon class="dialog-icon">{{ data.mode === 'create' ? 'person_add' : 'manage_accounts' }}</mat-icon>
          <h2 class="dialog-title">{{ data.mode === 'create' ? 'Add New User' : 'Edit User' }}</h2>
        </div>
        <button mat-icon-button (click)="close()"><mat-icon>close</mat-icon></button>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="dialog-form">

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>First Name</mat-label>
            <input matInput formControlName="firstName">
            <mat-error *ngIf="f['firstName'].errors?.['required']">Required</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Last Name</mat-label>
            <input matInput formControlName="lastName">
            <mat-error *ngIf="f['lastName'].errors?.['required']">Required</mat-error>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>User ID</mat-label>
          <input matInput formControlName="userId" [readonly]="data.mode === 'edit'">
          <mat-error *ngIf="f['userId'].errors?.['required']">Required</mat-error>
          <mat-error *ngIf="f['userId'].errors?.['pattern']">Letters, numbers, underscores, dots, hyphens only</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email">
          <mat-error *ngIf="f['email'].errors?.['required']">Required</mat-error>
          <mat-error *ngIf="f['email'].errors?.['email']">Valid email required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" *ngIf="data.mode === 'create'">
          <mat-label>Password</mat-label>
          <input matInput formControlName="password" type="password">
          <mat-error *ngIf="f['password'].errors?.['required']">Required</mat-error>
          <mat-error *ngIf="f['password'].errors?.['minlength']">Min 8 characters</mat-error>
          <mat-error *ngIf="f['password'].errors?.['pattern']">Must include uppercase, lowercase, and number</mat-error>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Role</mat-label>
            <mat-select formControlName="role">
              <mat-option value="user">General User</mat-option>
              <mat-option value="admin">Admin</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Department</mat-label>
            <mat-select formControlName="department">
              <mat-option *ngFor="let d of departments" [value]="d">{{ d }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="error-msg" *ngIf="serverError()">
          <mat-icon>error</mat-icon> {{ serverError() }}
        </div>

        <div class="dialog-actions">
          <button mat-stroked-button type="button" (click)="close()">Cancel</button>
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || isSaving()">
            <mat-spinner *ngIf="isSaving()" diameter="16"></mat-spinner>
            <span>{{ isSaving() ? 'Saving...' : (data.mode === 'create' ? 'Create User' : 'Update') }}</span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .dialog-container { padding: 0; }
    .dialog-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; margin-bottom: 20px; }
    .dialog-title-row { display: flex; align-items: center; gap: 12px; }
    .dialog-icon { color: var(--color-primary-400); }
    .dialog-title { font-size: 18px; font-weight: 600; margin: 0; color: var(--color-text-primary); }
    .dialog-form { padding: 0 24px 24px; display: flex; flex-direction: column; gap: 4px; }
    .full-width { width: 100%; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
    .error-msg { display: flex; align-items: center; gap: 8px; color: var(--color-error); font-size: 13px; background: rgba(239,68,68,0.08); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid rgba(239,68,68,0.2); mat-icon { font-size: 16px; width: 16px; height: 16px; } }
    @media (max-width: 480px) { .form-row { grid-template-columns: 1fr; } }
  `],
})
export class UserDialogComponent implements OnInit {
  form!: FormGroup;
  isSaving    = signal(false);
  serverError = signal('');

  readonly departments = ['Engineering', 'Design', 'Product', 'DevOps', 'QA', 'Marketing', 'Data Science', 'Operations'];

  constructor(
    private fb: FormBuilder,
    private userApi: UserApiService,
    private dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {}

  ngOnInit(): void { this.buildForm(); }
  get f() { return this.form.controls; }

  private buildForm(): void {
    const u = this.data.user;
    const isEdit = this.data.mode === 'edit';

    this.form = this.fb.group({
      firstName:  [u?.firstName ?? '', Validators.required],
      lastName:   [u?.lastName  ?? '', Validators.required],
      userId:     [u?.userId    ?? '', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_.-]+$/)]],
      email:      [u?.email     ?? '', [Validators.required, Validators.email]],
      role:       [u?.role      ?? 'user'],
      department: [u?.department ?? 'Engineering'],
      ...(!isEdit && {
        password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)]],
      }),
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSaving()) return;
    this.isSaving.set(true); this.serverError.set('');

    const val = this.form.value;
    const req$ = this.data.mode === 'create'
      ? this.userApi.create(val)
      : this.userApi.update(this.data.user!._id, {
          firstName: val.firstName, lastName: val.lastName,
          role: val.role, department: val.department,
        });

    req$.pipe(
      catchError((err) => { this.serverError.set(err?.error?.message || 'An error occurred'); return of(null); }),
      finalize(() => this.isSaving.set(false)),
    ).subscribe((result) => { if (result) this.dialogRef.close(true); });
  }

  close(): void { this.dialogRef.close(false); }
}
