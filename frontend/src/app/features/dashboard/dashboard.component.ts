import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, finalize, of } from 'rxjs';
import { DashboardApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardAnalytics, ActivityLog } from '../../core/models';

interface StatCard {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  change?: number;
  route?: string;
}

@Component({
  selector: 'nx-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatIconModule, MatButtonModule, MatProgressBarModule, MatTooltipModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  analytics = signal<DashboardAnalytics | null>(null);
  isLoading  = signal(true);
  error      = signal('');

  user    = computed(() => this.authService.user());
  isAdmin = computed(() => this.authService.isAdmin());

  statCards = computed<StatCard[]>(() => {
    const a = this.analytics();
    if (!a) return [];
    const cards: StatCard[] = [
      {
        label: 'Total Records', value: a.totalRecords,
        icon: 'table_chart', color: 'indigo', route: '/records',
      },
      {
        label: 'Active Tasks', value: a.activeRecords,
        icon: 'play_circle', color: 'green',
      },
      {
        label: 'Pending Review', value: a.pendingRecords,
        icon: 'pending', color: 'amber',
      },
      {
        label: 'Completed', value: a.completedRecords,
        icon: 'check_circle', color: 'violet',
      },
    ];

    if (this.isAdmin()) {
      cards.push(
        {
          label: 'Total Users', value: a.totalUsers,
          icon: 'group', color: 'blue', route: '/admin',
        },
        {
          label: 'Completion Rate', value: `${a.completionRate}%`,
          icon: 'analytics', color: 'teal',
        }
      );
    }

    return cards;
  });

  constructor(
    private dashboardApi: DashboardApiService,
    readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.isLoading.set(true);
    this.error.set('');

    this.dashboardApi
      .getAnalytics()
      .pipe(
        catchError((err) => {
          this.error.set(err?.error?.message || 'Failed to load analytics');
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((data) => {
        if (data) this.analytics.set(data);
      });
  }

  getActionLabel(action: string): string {
    const map: Record<string, string> = {
      LOGIN:         'Signed in',
      LOGOUT:        'Signed out',
      CREATE_USER:   'Created user',
      UPDATE_USER:   'Updated user',
      DELETE_USER:   'Deleted user',
      CREATE_RECORD: 'Created record',
      UPDATE_RECORD: 'Updated record',
      DELETE_RECORD: 'Deleted record',
      LOGIN_FAILED:  'Failed login attempt',
    };
    return map[action] ?? action;
  }

  getActionIcon(action: string): string {
    const map: Record<string, string> = {
      LOGIN:         'login',
      LOGOUT:        'logout',
      CREATE_USER:   'person_add',
      UPDATE_USER:   'edit',
      DELETE_USER:   'person_remove',
      CREATE_RECORD: 'add_circle',
      UPDATE_RECORD: 'update',
      DELETE_RECORD: 'delete',
      LOGIN_FAILED:  'error',
    };
    return map[action] ?? 'info';
  }

  getPriorityWidth(count: number, max: number): number {
    return max > 0 ? Math.round((count / max) * 100) : 0;
  }

  get maxPriorityCount(): number {
    const priorities = this.analytics()?.recordsByPriority ?? [];
    return Math.max(...priorities.map((p) => p.count), 1);
  }

  trackByLog(_: number, log: ActivityLog): string { return log._id; }
}
