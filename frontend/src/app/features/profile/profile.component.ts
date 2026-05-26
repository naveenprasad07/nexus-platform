import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { finalize, catchError, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'nx-profile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatIconModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatDividerModule, MatProgressSpinnerModule,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent {
  user    = computed(() => this.authService.user());
  isAdmin = computed(() => this.authService.isAdmin());
  isSaving = signal(false);

  form = this.fb.group({
    firstName:  [this.authService.user()?.firstName ?? '', Validators.required],
    lastName:   [this.authService.user()?.lastName  ?? '', Validators.required],
    department: [this.authService.user()?.department ?? ''],
  });

  readonly infoItems = computed(() => [
    { label: 'User ID',     value: this.user()?.userId,     icon: 'badge' },
    { label: 'Email',       value: this.user()?.email,      icon: 'email' },
    { label: 'Role',        value: this.user()?.role,       icon: 'admin_panel_settings' },
    { label: 'Department',  value: this.user()?.department, icon: 'business' },
    { label: 'Member since',value: this.user()?.createdAt
        ? new Date(this.user()!.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : '',
      icon: 'calendar_today' },
    { label: 'Last login',  value: this.user()?.lastLogin
        ? new Date(this.user()!.lastLogin!).toLocaleString()
        : 'First session',
      icon: 'login' },
  ]);

  constructor(
    readonly authService: AuthService,
    private userApi: UserApiService,
    private toast: ToastService,
    private fb: FormBuilder,
  ) {}

  onSave(): void {
    if (this.form.invalid || this.isSaving()) return;
    this.isSaving.set(true);

    this.userApi.update(this.user()!._id, this.form.value as any).pipe(
      catchError((err) => { this.toast.error(err?.error?.message || 'Update failed'); return of(null); }),
      finalize(() => this.isSaving.set(false)),
    ).subscribe((u) => {
      if (u) {
        this.authService.fetchMe().subscribe();
        this.toast.success('Profile updated');
      }
    });
  }

  initials = computed(() =>
    `${this.user()?.firstName?.charAt(0) ?? ''}${this.user()?.lastName?.charAt(0) ?? ''}`
  );
}
