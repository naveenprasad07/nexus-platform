import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'nx-shell',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet,
    MatIconModule, MatButtonModule, MatTooltipModule,
    SidebarComponent,
  ],
  template: `
    <div class="app-shell">
      <nx-sidebar [collapsed]="sidebarCollapsed()" />

      <div class="shell-main">
        <!-- Topbar -->
        <header class="topbar">
          <button
            mat-icon-button
            class="collapse-btn"
            (click)="toggleSidebar()"
            [matTooltip]="sidebarCollapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
          >
            <mat-icon>{{ sidebarCollapsed() ? 'menu' : 'menu_open' }}</mat-icon>
          </button>

          <div class="topbar-right">
            <div class="env-badge">Development</div>
            <div class="topbar-user">
              <span class="user-greeting">{{ greeting }},</span>
              <strong>{{ authService.user()?.firstName }}</strong>
            </div>
            <div class="topbar-avatar">
              {{ authService.user()?.firstName?.charAt(0) }}{{ authService.user()?.lastName?.charAt(0) }}
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="shell-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent {
  sidebarCollapsed = signal(false);

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  constructor(readonly authService: AuthService) {}

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }
}
