import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private config: MatSnackBarConfig = {
    duration: 4000,
    horizontalPosition: 'right',
    verticalPosition: 'top',
  };

  constructor(private snackBar: MatSnackBar) {}

  success(message: string): void {
    this.snackBar.open(message, '✕', { ...this.config, panelClass: ['success-snack'] });
  }

  error(message: string): void {
    this.snackBar.open(message, '✕', { ...this.config, duration: 6000, panelClass: ['error-snack'] });
  }

  info(message: string): void {
    this.snackBar.open(message, '✕', { ...this.config, panelClass: ['info-snack'] });
  }

  warn(message: string): void {
    this.snackBar.open(message, '✕', { ...this.config, panelClass: ['warn-snack'] });
  }
}
