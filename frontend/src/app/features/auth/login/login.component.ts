import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRippleModule } from '@angular/material/core';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserRole } from '../../../core/models';

@Component({
  selector: 'nx-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatSelectModule, MatIconModule, MatProgressSpinnerModule, MatRippleModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  form!: FormGroup;
  isLoading = signal(false);
  showPassword = signal(false);
  loginError = signal('');

  readonly roles: { value: UserRole; label: string; icon: string }[] = [
    { value: 'user',  label: 'General User', icon: 'person' },
    { value: 'admin', label: 'Administrator', icon: 'admin_panel_settings' },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      userId:   ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role:     ['user', Validators.required],
    });
  }

  get f() { return this.form.controls; }

  onSubmit(): void {
    if (this.form.invalid || this.isLoading()) return;

    this.loginError.set('');
    this.isLoading.set(true);

    this.authService
      .login(this.form.value)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ user }) => {
          this.toast.success(`Welcome back, ${user.firstName}!`);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          const msg = err?.error?.message || 'Invalid credentials. Please try again.';
          this.loginError.set(msg);
        },
      });
  }

  fillDemo(role: UserRole): void {
    if (role === 'admin') {
      this.form.patchValue({ userId: 'admin', password: 'Admin@123', role: 'admin' });
    } else {
      this.form.patchValue({ userId: 'john.doe', password: 'User@123', role: 'user' });
    }
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }
}
