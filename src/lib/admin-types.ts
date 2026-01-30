// ============================================
// PNGEC-BRS Administrative Module Types
// Comprehensive Role-Based Access Control (RBAC)
// ============================================

// ============================================
// ROLE DEFINITIONS
// ============================================

export type RoleLevel =
  | 'super_admin'      // Full system access, can modify anything
  | 'national_admin'   // National level access, manages all provinces
  | 'provincial_admin' // Provincial level, manages districts within province
  | 'district_admin'   // District level, manages wards within district
  | 'ward_supervisor'  // Ward level, supervises registration officers
  | 'registration_officer' // Field level, performs registrations
  | 'data_entry'       // Limited access, data entry only
  | 'auditor'          // Read-only access for audit purposes
  | 'viewer';          // View-only access

export interface Role {
  id: string;
  name: string;
  code: RoleLevel;
  description: string;
  level: number; // 1-10, higher = more authority
  is_system_role: boolean; // Cannot be deleted if true
  is_active: boolean;
  color: string; // For UI display
  icon: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  permissions: RolePermission[];
  user_count?: number;
}

// ============================================
// PERMISSION DEFINITIONS
// ============================================

export type ModuleName =
  | 'dashboard'
  | 'registration'
  | 'deduplication'
  | 'registry'
  | 'exceptions'
  | 'kits'
  | 'sync'
  | 'gps'
  | 'teams'
  | 'audit'
  | 'custody'
  | 'history'
  | 'export'
  | 'admin_users'
  | 'admin_roles'
  | 'admin_permissions'
  | 'admin_wards'
  | 'admin_devices'
  | 'admin_config'
  | 'system_health'
  | 'system_integrations'
  | 'system_security'
  | 'system_backup';

export type ActionType =
  | 'view'      // Can view/read data
  | 'create'    // Can create new records
  | 'update'    // Can modify existing records
  | 'delete'    // Can delete records
  | 'approve'   // Can approve/reject items
  | 'export'    // Can export data
  | 'import'    // Can import data
  | 'assign'    // Can assign items to others
  | 'escalate'  // Can escalate issues
  | 'configure' // Can modify settings
  | 'audit'     // Can view audit logs
  | 'manage';   // Full management access

export interface Permission {
  id: string;
  module: ModuleName;
  action: ActionType;
  name: string;
  description: string;
  is_sensitive: boolean; // Requires additional approval
  requires_mfa: boolean; // Requires MFA to execute
  created_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  permission?: Permission;
  granted_at: string;
  granted_by: string;
  conditions?: PermissionCondition;
}

export interface TimeRestriction {
  start_time: string;
  end_time: string;
  days_of_week: number[];
  timezone: string;
}

export interface PermissionCondition {
  geographic_scope?: GeographicScope;
  time_restricted?: TimeRestriction;
  ip_restricted?: string[];
  max_records_per_day?: number;
  requires_approval?: boolean;
  approval_role?: string;
}

// ============================================
// GEOGRAPHIC ACCESS CONTROL
// ============================================

export type GeographicLevel =
  | 'national'
  | 'regional'
  | 'provincial'
  | 'district'
  | 'llg' // Local Level Government
  | 'ward';

export interface GeographicScope {
  level: GeographicLevel;
  region_ids?: string[];
  province_ids?: string[];
  district_ids?: string[];
  llg_ids?: string[];
  ward_ids?: string[];
}

export interface GeographicUnit {
  id: string;
  code: string;
  name: string;
  level: GeographicLevel;
  parent_id?: string;
  parent?: GeographicUnit;
  children?: GeographicUnit[];
  population?: number;
  registered_voters?: number;
  is_active: boolean;
}

// ============================================
// USER MANAGEMENT
// ============================================

export type UserStatus =
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'pending_approval'
  | 'locked'
  | 'password_expired';

export interface AdminUser {
  id: string;
  auth_id?: string;
  email: string;
  full_name: string;
  phone?: string;
  employee_id?: string;
  national_id?: string;

  // Role & Access
  role_id: string;
  role?: Role;
  secondary_roles?: string[]; // Additional roles
  clearance_level: number; // 1-10

  // Geographic Assignment
  geographic_scope: GeographicScope;
  assigned_province_id?: string;
  assigned_district_id?: string;
  assigned_ward_ids?: string[];

  // Status & Security
  status: UserStatus;
  is_active: boolean;
  mfa_enabled: boolean;
  mfa_method?: 'totp' | 'sms' | 'email';
  password_changed_at?: string;
  password_expires_at?: string;
  failed_login_attempts: number;
  locked_until?: string;
  last_login_at?: string;
  last_login_ip?: string;

  // Audit
  created_at: string;
  updated_at: string;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;

  // Metadata
  department?: string;
  position?: string;
  notes?: string;
  profile_photo_url?: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  user?: AdminUser;
  session_token: string;
  ip_address: string;
  user_agent: string;
  device_info?: DeviceInfo;
  location?: SessionLocation;
  started_at: string;
  last_activity_at: string;
  expires_at: string;
  is_active: boolean;
  terminated_by?: string;
  termination_reason?: string;
}

export interface DeviceInfo {
  device_type: 'desktop' | 'tablet' | 'mobile' | 'unknown';
  browser: string;
  os: string;
  is_trusted: boolean;
}

export interface SessionLocation {
  country: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

// ============================================
// AUDIT & LOGGING
// ============================================

export type AuditAction =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'password_change'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'user_suspended'
  | 'user_activated'
  | 'role_assigned'
  | 'role_revoked'
  | 'permission_granted'
  | 'permission_revoked'
  | 'record_created'
  | 'record_updated'
  | 'record_deleted'
  | 'record_viewed'
  | 'record_exported'
  | 'bulk_operation'
  | 'config_changed'
  | 'system_access'
  | 'security_event';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  user_role?: string;

  action: AuditAction;
  severity: AuditSeverity;
  module: ModuleName;

  resource_type?: string;
  resource_id?: string;
  resource_name?: string;

  details: Record<string, unknown>;
  changes?: {
    field: string;
    old_value: unknown;
    new_value: unknown;
  }[];

  ip_address?: string;
  user_agent?: string;
  session_id?: string;

  geographic_context?: {
    province?: string;
    district?: string;
    ward?: string;
  };

  is_sensitive: boolean;
  requires_review: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
}

// ============================================
// SECURITY POLICIES
// ============================================

export interface PasswordPolicy {
  min_length: number;
  max_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_special_chars: boolean;
  special_chars_allowed: string;
  password_history_count: number; // Cannot reuse last N passwords
  max_age_days: number;
  min_age_days: number; // Minimum time before can change again
}

export interface AccountPolicy {
  max_failed_attempts: number;
  lockout_duration_minutes: number;
  session_timeout_minutes: number;
  max_concurrent_sessions: number;
  require_mfa_for_roles: RoleLevel[];
  require_mfa_for_sensitive_actions: boolean;
  allowed_ip_ranges?: string[];
  blocked_ip_ranges?: string[];
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  password_policy: PasswordPolicy;
  account_policy: AccountPolicy;
  is_default: boolean;
  applies_to_roles: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
}

// ============================================
// APPROVAL WORKFLOWS
// ============================================

export type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'expired';

export interface ApprovalRequest {
  id: string;
  request_type: 'user_creation' | 'role_change' | 'permission_grant' | 'data_export' | 'bulk_operation';
  requestor_id: string;
  requestor?: AdminUser;

  target_user_id?: string;
  target_user?: AdminUser;

  requested_changes: Record<string, unknown>;
  justification: string;

  status: ApprovalStatus;
  approver_role_required: RoleLevel;

  approved_by?: string;
  approver?: AdminUser;
  approved_at?: string;
  rejection_reason?: string;

  expires_at: string;
  created_at: string;
}

// ============================================
// SYSTEM CONFIGURATION
// ============================================

export interface SystemConfig {
  id: string;
  category: 'general' | 'security' | 'registration' | 'sync' | 'notifications' | 'integrations';
  key: string;
  value: unknown;
  value_type: 'string' | 'number' | 'boolean' | 'json' | 'encrypted';
  description: string;
  is_sensitive: boolean;
  requires_restart: boolean;
  last_modified_at: string;
  last_modified_by: string;
}

// ============================================
// PERMISSION MATRIX HELPERS
// ============================================

export interface PermissionMatrixCell {
  module: ModuleName;
  action: ActionType;
  granted: boolean;
  permission_id?: string;
  conditions?: PermissionCondition;
}

export interface PermissionMatrix {
  role_id: string;
  role_name: string;
  cells: PermissionMatrixCell[];
}

// Module metadata for UI
export interface ModuleInfo {
  name: ModuleName;
  display_name: string;
  description: string;
  icon: string;
  category: 'core' | 'operations' | 'admin' | 'system';
  available_actions: ActionType[];
  is_sensitive: boolean;
}

// All available modules with their metadata
export const MODULE_INFO: ModuleInfo[] = [
  // Core Modules
  { name: 'dashboard', display_name: 'Dashboard', description: 'System overview and statistics', icon: 'LayoutDashboard', category: 'core', available_actions: ['view'], is_sensitive: false },
  { name: 'registration', display_name: 'Voter Registration', description: 'Register new voters', icon: 'UserPlus', category: 'core', available_actions: ['view', 'create', 'update', 'delete', 'approve', 'export'], is_sensitive: true },
  { name: 'deduplication', display_name: 'Deduplication', description: 'Review duplicate matches', icon: 'Users', category: 'core', available_actions: ['view', 'update', 'approve', 'escalate'], is_sensitive: true },
  { name: 'registry', display_name: 'Voter Registry', description: 'Search and view voter records', icon: 'Database', category: 'core', available_actions: ['view', 'update', 'export'], is_sensitive: true },
  { name: 'exceptions', display_name: 'Exceptions', description: 'Handle registration exceptions', icon: 'AlertTriangle', category: 'core', available_actions: ['view', 'update', 'approve', 'escalate'], is_sensitive: true },

  // Operations Modules
  { name: 'kits', display_name: 'Registration Kits', description: 'Manage registration devices', icon: 'Tablet', category: 'operations', available_actions: ['view', 'create', 'update', 'delete', 'assign'], is_sensitive: false },
  { name: 'sync', display_name: 'Sync Status', description: 'Monitor data synchronization', icon: 'RefreshCw', category: 'operations', available_actions: ['view', 'manage'], is_sensitive: false },
  { name: 'gps', display_name: 'GPS Coverage', description: 'Track field team locations', icon: 'MapPin', category: 'operations', available_actions: ['view'], is_sensitive: false },
  { name: 'teams', display_name: 'Field Teams', description: 'Manage field teams', icon: 'Users', category: 'operations', available_actions: ['view', 'create', 'update', 'delete', 'assign'], is_sensitive: false },
  { name: 'audit', display_name: 'Audit Logs', description: 'View system audit logs', icon: 'FileText', category: 'operations', available_actions: ['view', 'export', 'audit'], is_sensitive: true },
  { name: 'custody', display_name: 'Chain of Custody', description: 'Track device custody', icon: 'Link', category: 'operations', available_actions: ['view', 'create', 'update'], is_sensitive: false },
  { name: 'history', display_name: 'Registration History', description: 'View registration history', icon: 'History', category: 'operations', available_actions: ['view', 'export'], is_sensitive: true },
  { name: 'export', display_name: 'Evidence Export', description: 'Export data and evidence', icon: 'Download', category: 'operations', available_actions: ['view', 'export'], is_sensitive: true },

  // Admin Modules
  { name: 'admin_users', display_name: 'User Management', description: 'Manage system users', icon: 'UserCog', category: 'admin', available_actions: ['view', 'create', 'update', 'delete', 'approve', 'assign'], is_sensitive: true },
  { name: 'admin_roles', display_name: 'Role Management', description: 'Manage roles and permissions', icon: 'Shield', category: 'admin', available_actions: ['view', 'create', 'update', 'delete', 'assign'], is_sensitive: true },
  { name: 'admin_permissions', display_name: 'Permission Matrix', description: 'Configure permissions', icon: 'Key', category: 'admin', available_actions: ['view', 'update', 'configure'], is_sensitive: true },
  { name: 'admin_wards', display_name: 'Geographic Units', description: 'Manage provinces, districts, wards', icon: 'Map', category: 'admin', available_actions: ['view', 'create', 'update', 'delete'], is_sensitive: false },
  { name: 'admin_devices', display_name: 'Device Management', description: 'Manage all devices', icon: 'Smartphone', category: 'admin', available_actions: ['view', 'create', 'update', 'delete', 'configure'], is_sensitive: false },
  { name: 'admin_config', display_name: 'Configuration', description: 'System configuration', icon: 'Settings', category: 'admin', available_actions: ['view', 'configure'], is_sensitive: true },

  // System Modules
  { name: 'system_health', display_name: 'System Health', description: 'Monitor system health', icon: 'Activity', category: 'system', available_actions: ['view', 'manage'], is_sensitive: false },
  { name: 'system_integrations', display_name: 'Integrations', description: 'Manage external integrations', icon: 'Plug', category: 'system', available_actions: ['view', 'configure'], is_sensitive: true },
  { name: 'system_security', display_name: 'Security Settings', description: 'Security configuration', icon: 'Lock', category: 'system', available_actions: ['view', 'configure', 'audit'], is_sensitive: true },
  { name: 'system_backup', display_name: 'Backups', description: 'Backup and recovery', icon: 'HardDrive', category: 'system', available_actions: ['view', 'manage', 'export'], is_sensitive: true },
];

// Default role configurations
export const DEFAULT_ROLES: Partial<Role>[] = [
  {
    name: 'Super Administrator',
    code: 'super_admin',
    description: 'Full system access with all permissions. Reserved for system administrators.',
    level: 10,
    is_system_role: true,
    color: '#dc2626',
    icon: 'ShieldAlert',
  },
  {
    name: 'National Administrator',
    code: 'national_admin',
    description: 'National level access. Can manage all provinces and system configuration.',
    level: 9,
    is_system_role: true,
    color: '#ea580c',
    icon: 'Shield',
  },
  {
    name: 'Provincial Administrator',
    code: 'provincial_admin',
    description: 'Provincial level access. Can manage all districts within assigned province.',
    level: 7,
    is_system_role: true,
    color: '#ca8a04',
    icon: 'ShieldCheck',
  },
  {
    name: 'District Administrator',
    code: 'district_admin',
    description: 'District level access. Can manage all wards within assigned district.',
    level: 5,
    is_system_role: true,
    color: '#16a34a',
    icon: 'UserCog',
  },
  {
    name: 'Ward Supervisor',
    code: 'ward_supervisor',
    description: 'Ward level access. Supervises registration officers in assigned wards.',
    level: 4,
    is_system_role: true,
    color: '#0891b2',
    icon: 'UserCheck',
  },
  {
    name: 'Registration Officer',
    code: 'registration_officer',
    description: 'Field officer. Can perform voter registrations in assigned areas.',
    level: 2,
    is_system_role: true,
    color: '#2563eb',
    icon: 'User',
  },
  {
    name: 'Data Entry Operator',
    code: 'data_entry',
    description: 'Limited access for data entry tasks only.',
    level: 1,
    is_system_role: true,
    color: '#7c3aed',
    icon: 'Edit',
  },
  {
    name: 'Auditor',
    code: 'auditor',
    description: 'Read-only access for audit and compliance purposes.',
    level: 3,
    is_system_role: true,
    color: '#db2777',
    icon: 'Eye',
  },
  {
    name: 'Viewer',
    code: 'viewer',
    description: 'View-only access to selected modules.',
    level: 1,
    is_system_role: true,
    color: '#64748b',
    icon: 'EyeOff',
  },
];
