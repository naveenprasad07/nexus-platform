// ─── User Models ──────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'user';

export interface User {
  _id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  department: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  userId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department: string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  department?: string;
  isActive?: boolean;
}

// ─── Auth Models ──────────────────────────────────────────────────────────────

export interface LoginPayload {
  userId: string;
  password: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ─── Record Models ────────────────────────────────────────────────────────────

export type RecordStatus   = 'active' | 'pending' | 'completed' | 'cancelled';
export type RecordPriority = 'low' | 'medium' | 'high' | 'critical';
export type RecordCategory = 'development' | 'design' | 'research' | 'testing' | 'deployment' | 'maintenance' | 'documentation';

export interface RecordItem {
  _id: string;
  title: string;
  description: string;
  status: RecordStatus;
  priority: RecordPriority;
  assignedTo: User;
  createdBy: User;
  tags: string[];
  dueDate?: string;
  completedAt?: string;
  metadata: {
    estimatedHours: number;
    actualHours?: number;
    category: RecordCategory;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecordPayload {
  title: string;
  description: string;
  status?: RecordStatus;
  priority?: RecordPriority;
  assignedTo: string;
  tags?: string[];
  dueDate?: string;
  metadata: {
    estimatedHours: number;
    category: RecordCategory;
  };
}

export interface UpdateRecordPayload {
  title?: string;
  description?: string;
  status?: RecordStatus;
  priority?: RecordPriority;
  assignedTo?: string;
  tags?: string[];
  dueDate?: string;
  metadata?: {
    estimatedHours?: number;
    actualHours?: number;
    category?: RecordCategory;
  };
}

// ─── API Response Models ──────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  error?: string;
  timestamp: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  status?: string;
  priority?: string;
}

// ─── Dashboard Models ──────────────────────────────────────────────────────────

export interface DashboardAnalytics {
  totalRecords: number;
  activeRecords: number;
  pendingRecords: number;
  completedRecords: number;
  cancelledRecords: number;
  totalUsers: number;
  activeUsers: number;
  recentActivity: ActivityLog[];
  recordsByPriority: { _id: string; count: number }[];
  recordsByStatus:   { _id: string; count: number }[];
  recordsThisWeek: number;
  completionRate: number;
}

export interface ActivityLog {
  _id: string;
  userId: User;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

// ─── UI Models ────────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: UserRole[];
  badge?: number;
  children?: NavItem[];
}

export type AsyncState = 'idle' | 'loading' | 'success' | 'error';

export interface LoadingState {
  state: AsyncState;
  error?: string;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'badge' | 'date' | 'number' | 'actions';
}
