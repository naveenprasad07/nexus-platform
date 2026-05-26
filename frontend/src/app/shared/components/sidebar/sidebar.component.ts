import { Component, signal, computed, Input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { AuthService } from '../../../core/services/auth.service';
import { NavItem } from '../../../core/models';

@Component({
  selector: 'nx-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule, MatRippleModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  @Input() collapsed = false;

  user = computed(() => this.authService.user());
  isAdmin = computed(() => this.authService.isAdmin());

  readonly navItems: NavItem[] = [
    { label: 'Dashboard',   icon: 'dashboard',           route: '/dashboard' },
    { label: 'Records',     icon: 'table_chart',         route: '/records'   },
    { label: 'Admin',       icon: 'admin_panel_settings',route: '/admin', roles: ['admin'] },
    { label: 'Profile',     icon: 'account_circle',      route: '/profile'   },
  ];

  get visibleItems(): NavItem[] {
    return this.navItems.filter(
      (item) => !item.roles || item.roles.includes(this.user()?.role ?? 'user')
    );
  }

  constructor(private authService: AuthService, private router: Router) {}

  logout(): void {
    this.authService.logout();
  }
}
