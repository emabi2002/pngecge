-- ============================================
-- PNGEC-BRS Administrative Module Schema
-- Comprehensive Role-Based Access Control (RBAC)
-- ============================================

-- ============================================
-- ROLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 10),
  is_system_role BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  color VARCHAR(20) DEFAULT '#64748b',
  icon VARCHAR(50) DEFAULT 'User',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- PERMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_sensitive BOOLEAN DEFAULT FALSE,
  requires_mfa BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module, action)
);

-- ============================================
-- ROLE PERMISSIONS (Junction Table)
-- ============================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  conditions JSONB,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),
  UNIQUE(role_id, permission_id)
);

-- ============================================
-- GEOGRAPHIC UNITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS geographic_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  level VARCHAR(20) NOT NULL CHECK (level IN ('national', 'regional', 'provincial', 'district', 'llg', 'ward')),
  parent_id UUID REFERENCES geographic_units(id),
  population INTEGER,
  registered_voters INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ADMIN USERS TABLE (Extended User Profiles)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE REFERENCES auth.users(id),
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(200) NOT NULL,
  phone VARCHAR(50),
  employee_id VARCHAR(50) UNIQUE,
  national_id VARCHAR(50),

  -- Role & Access
  role_id UUID REFERENCES roles(id),
  secondary_roles UUID[],
  clearance_level INTEGER DEFAULT 1 CHECK (clearance_level >= 1 AND clearance_level <= 10),

  -- Geographic Assignment
  geographic_scope JSONB DEFAULT '{"level": "ward"}'::jsonb,
  assigned_province_id UUID REFERENCES geographic_units(id),
  assigned_district_id UUID REFERENCES geographic_units(id),
  assigned_ward_ids UUID[],

  -- Status & Security
  status VARCHAR(30) DEFAULT 'pending_approval' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_approval', 'locked', 'password_expired')),
  is_active BOOLEAN DEFAULT FALSE,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_method VARCHAR(20) CHECK (mfa_method IN ('totp', 'sms', 'email')),
  password_changed_at TIMESTAMPTZ,
  password_expires_at TIMESTAMPTZ,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  last_login_ip INET,

  -- Metadata
  department VARCHAR(100),
  position VARCHAR(100),
  notes TEXT,
  profile_photo_url TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  approved_by UUID,
  approved_at TIMESTAMPTZ
);

-- ============================================
-- USER SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,
  location JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  terminated_by UUID REFERENCES admin_users(id),
  termination_reason TEXT
);

-- ============================================
-- DETAILED AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs_detailed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID,
  user_email VARCHAR(255),
  user_name VARCHAR(200),
  user_role VARCHAR(100),

  action VARCHAR(50) NOT NULL,
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  module VARCHAR(50),

  resource_type VARCHAR(50),
  resource_id UUID,
  resource_name VARCHAR(255),

  details JSONB,
  changes JSONB,

  ip_address INET,
  user_agent TEXT,
  session_id UUID,

  geographic_context JSONB,

  is_sensitive BOOLEAN DEFAULT FALSE,
  requires_review BOOLEAN DEFAULT FALSE,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ
);

-- ============================================
-- SECURITY POLICIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS security_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  password_policy JSONB NOT NULL DEFAULT '{
    "min_length": 12,
    "max_length": 128,
    "require_uppercase": true,
    "require_lowercase": true,
    "require_numbers": true,
    "require_special_chars": true,
    "special_chars_allowed": "!@#$%^&*()_+-=[]{}|;:,.<>?",
    "password_history_count": 5,
    "max_age_days": 90,
    "min_age_days": 1
  }'::jsonb,
  account_policy JSONB NOT NULL DEFAULT '{
    "max_failed_attempts": 5,
    "lockout_duration_minutes": 30,
    "session_timeout_minutes": 480,
    "max_concurrent_sessions": 3,
    "require_mfa_for_roles": ["super_admin", "national_admin"],
    "require_mfa_for_sensitive_actions": true
  }'::jsonb,
  is_default BOOLEAN DEFAULT FALSE,
  applies_to_roles UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- ============================================
-- APPROVAL REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('user_creation', 'role_change', 'permission_grant', 'data_export', 'bulk_operation')),
  requestor_id UUID NOT NULL REFERENCES admin_users(id),
  target_user_id UUID REFERENCES admin_users(id),

  requested_changes JSONB NOT NULL,
  justification TEXT,

  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'expired')),
  approver_role_required VARCHAR(50),

  approved_by UUID REFERENCES admin_users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SYSTEM CONFIGURATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL CHECK (category IN ('general', 'security', 'registration', 'sync', 'notifications', 'integrations')),
  key VARCHAR(100) NOT NULL,
  value JSONB,
  value_type VARCHAR(20) DEFAULT 'string' CHECK (value_type IN ('string', 'number', 'boolean', 'json', 'encrypted')),
  description TEXT,
  is_sensitive BOOLEAN DEFAULT FALSE,
  requires_restart BOOLEAN DEFAULT FALSE,
  last_modified_at TIMESTAMPTZ DEFAULT NOW(),
  last_modified_by UUID,
  UNIQUE(category, key)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON admin_users(status);
CREATE INDEX IF NOT EXISTS idx_admin_users_province ON admin_users(assigned_province_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_auth_id ON admin_users(auth_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

CREATE INDEX IF NOT EXISTS idx_geographic_units_level ON geographic_units(level);
CREATE INDEX IF NOT EXISTS idx_geographic_units_parent ON geographic_units(parent_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs_detailed(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs_detailed(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs_detailed(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs_detailed(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs_detailed(severity);

CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_requestor ON approval_requests(requestor_id);

-- ============================================
-- INSERT DEFAULT ROLES
-- ============================================
INSERT INTO roles (name, code, description, level, is_system_role, is_active, color, icon) VALUES
  ('Super Administrator', 'super_admin', 'Full system access with all permissions. Reserved for system administrators.', 10, TRUE, TRUE, '#dc2626', 'ShieldAlert'),
  ('National Administrator', 'national_admin', 'National level access. Can manage all provinces and system configuration.', 9, TRUE, TRUE, '#ea580c', 'Shield'),
  ('Provincial Administrator', 'provincial_admin', 'Provincial level access. Can manage all districts within assigned province.', 7, TRUE, TRUE, '#ca8a04', 'ShieldCheck'),
  ('District Administrator', 'district_admin', 'District level access. Can manage all wards within assigned district.', 5, TRUE, TRUE, '#16a34a', 'UserCog'),
  ('Ward Supervisor', 'ward_supervisor', 'Ward level access. Supervises registration officers in assigned wards.', 4, TRUE, TRUE, '#0891b2', 'UserCheck'),
  ('Registration Officer', 'registration_officer', 'Field officer. Can perform voter registrations in assigned areas.', 2, TRUE, TRUE, '#2563eb', 'User'),
  ('Data Entry Operator', 'data_entry', 'Limited access for data entry tasks only.', 1, TRUE, TRUE, '#7c3aed', 'Edit'),
  ('Auditor', 'auditor', 'Read-only access for audit and compliance purposes.', 3, TRUE, TRUE, '#db2777', 'Eye'),
  ('Viewer', 'viewer', 'View-only access to selected modules.', 1, TRUE, TRUE, '#64748b', 'EyeOff')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- INSERT DEFAULT PERMISSIONS
-- ============================================
INSERT INTO permissions (module, action, name, description, is_sensitive, requires_mfa) VALUES
  -- Dashboard
  ('dashboard', 'view', 'View Dashboard', 'Access to view dashboard and statistics', FALSE, FALSE),

  -- Registration
  ('registration', 'view', 'View Registrations', 'View voter registration records', FALSE, FALSE),
  ('registration', 'create', 'Create Registration', 'Create new voter registrations', TRUE, FALSE),
  ('registration', 'update', 'Update Registration', 'Modify voter registration records', TRUE, FALSE),
  ('registration', 'delete', 'Delete Registration', 'Delete voter registration records', TRUE, TRUE),
  ('registration', 'approve', 'Approve Registration', 'Approve pending registrations', TRUE, FALSE),
  ('registration', 'export', 'Export Registrations', 'Export registration data', TRUE, TRUE),

  -- Deduplication
  ('deduplication', 'view', 'View Deduplication', 'View duplicate match cases', FALSE, FALSE),
  ('deduplication', 'update', 'Update Deduplication', 'Update duplicate case status', TRUE, FALSE),
  ('deduplication', 'approve', 'Approve Deduplication', 'Approve or reject duplicates', TRUE, FALSE),
  ('deduplication', 'escalate', 'Escalate Deduplication', 'Escalate cases to higher authority', FALSE, FALSE),

  -- Registry
  ('registry', 'view', 'View Registry', 'Search and view voter registry', FALSE, FALSE),
  ('registry', 'update', 'Update Registry', 'Update voter records', TRUE, FALSE),
  ('registry', 'export', 'Export Registry', 'Export voter registry data', TRUE, TRUE),

  -- Exceptions
  ('exceptions', 'view', 'View Exceptions', 'View exception cases', FALSE, FALSE),
  ('exceptions', 'update', 'Update Exceptions', 'Update exception status', TRUE, FALSE),
  ('exceptions', 'approve', 'Approve Exceptions', 'Approve or reject exceptions', TRUE, FALSE),
  ('exceptions', 'escalate', 'Escalate Exceptions', 'Escalate to higher authority', FALSE, FALSE),

  -- Kits
  ('kits', 'view', 'View Kits', 'View registration kits/devices', FALSE, FALSE),
  ('kits', 'create', 'Create Kit', 'Register new devices', FALSE, FALSE),
  ('kits', 'update', 'Update Kit', 'Update device information', FALSE, FALSE),
  ('kits', 'delete', 'Delete Kit', 'Remove devices from system', TRUE, FALSE),
  ('kits', 'assign', 'Assign Kit', 'Assign devices to users/locations', FALSE, FALSE),

  -- Sync
  ('sync', 'view', 'View Sync Status', 'View synchronization status', FALSE, FALSE),
  ('sync', 'manage', 'Manage Sync', 'Manage sync operations', TRUE, FALSE),

  -- GPS
  ('gps', 'view', 'View GPS Coverage', 'View GPS tracking and coverage maps', FALSE, FALSE),

  -- Teams
  ('teams', 'view', 'View Teams', 'View field teams', FALSE, FALSE),
  ('teams', 'create', 'Create Team', 'Create new teams', FALSE, FALSE),
  ('teams', 'update', 'Update Team', 'Update team information', FALSE, FALSE),
  ('teams', 'delete', 'Delete Team', 'Delete teams', TRUE, FALSE),
  ('teams', 'assign', 'Assign Team', 'Assign team members', FALSE, FALSE),

  -- Audit
  ('audit', 'view', 'View Audit Logs', 'View system audit logs', TRUE, FALSE),
  ('audit', 'export', 'Export Audit Logs', 'Export audit log data', TRUE, TRUE),
  ('audit', 'audit', 'Full Audit Access', 'Complete audit functionality', TRUE, TRUE),

  -- Custody
  ('custody', 'view', 'View Custody', 'View chain of custody records', FALSE, FALSE),
  ('custody', 'create', 'Create Custody', 'Create custody records', FALSE, FALSE),
  ('custody', 'update', 'Update Custody', 'Update custody records', FALSE, FALSE),

  -- History
  ('history', 'view', 'View History', 'View registration history', FALSE, FALSE),
  ('history', 'export', 'Export History', 'Export history data', TRUE, TRUE),

  -- Export
  ('export', 'view', 'View Export', 'View export options', FALSE, FALSE),
  ('export', 'export', 'Perform Export', 'Execute data exports', TRUE, TRUE),

  -- Admin Users
  ('admin_users', 'view', 'View Users', 'View system users', TRUE, FALSE),
  ('admin_users', 'create', 'Create User', 'Create new users', TRUE, TRUE),
  ('admin_users', 'update', 'Update User', 'Update user information', TRUE, FALSE),
  ('admin_users', 'delete', 'Delete User', 'Delete users', TRUE, TRUE),
  ('admin_users', 'approve', 'Approve User', 'Approve pending users', TRUE, TRUE),
  ('admin_users', 'assign', 'Assign User', 'Assign user roles and locations', TRUE, FALSE),

  -- Admin Roles
  ('admin_roles', 'view', 'View Roles', 'View system roles', TRUE, FALSE),
  ('admin_roles', 'create', 'Create Role', 'Create new roles', TRUE, TRUE),
  ('admin_roles', 'update', 'Update Role', 'Update role configuration', TRUE, TRUE),
  ('admin_roles', 'delete', 'Delete Role', 'Delete roles', TRUE, TRUE),
  ('admin_roles', 'assign', 'Assign Role Permissions', 'Assign permissions to roles', TRUE, TRUE),

  -- Admin Permissions
  ('admin_permissions', 'view', 'View Permissions', 'View permission matrix', TRUE, FALSE),
  ('admin_permissions', 'update', 'Update Permissions', 'Modify permissions', TRUE, TRUE),
  ('admin_permissions', 'configure', 'Configure Permissions', 'Full permission configuration', TRUE, TRUE),

  -- Admin Wards
  ('admin_wards', 'view', 'View Geographic Units', 'View provinces, districts, wards', FALSE, FALSE),
  ('admin_wards', 'create', 'Create Geographic Unit', 'Create new locations', TRUE, FALSE),
  ('admin_wards', 'update', 'Update Geographic Unit', 'Update location information', TRUE, FALSE),
  ('admin_wards', 'delete', 'Delete Geographic Unit', 'Delete locations', TRUE, TRUE),

  -- Admin Devices
  ('admin_devices', 'view', 'View All Devices', 'View all devices system-wide', FALSE, FALSE),
  ('admin_devices', 'create', 'Create Device', 'Register new devices', FALSE, FALSE),
  ('admin_devices', 'update', 'Update Device', 'Update device information', FALSE, FALSE),
  ('admin_devices', 'delete', 'Delete Device', 'Delete devices', TRUE, FALSE),
  ('admin_devices', 'configure', 'Configure Device', 'Configure device settings', TRUE, FALSE),

  -- Admin Config
  ('admin_config', 'view', 'View Configuration', 'View system configuration', TRUE, FALSE),
  ('admin_config', 'configure', 'Modify Configuration', 'Change system configuration', TRUE, TRUE),

  -- System Health
  ('system_health', 'view', 'View System Health', 'View system health metrics', FALSE, FALSE),
  ('system_health', 'manage', 'Manage System Health', 'Perform system maintenance', TRUE, TRUE),

  -- System Integrations
  ('system_integrations', 'view', 'View Integrations', 'View external integrations', TRUE, FALSE),
  ('system_integrations', 'configure', 'Configure Integrations', 'Modify integration settings', TRUE, TRUE),

  -- System Security
  ('system_security', 'view', 'View Security Settings', 'View security configuration', TRUE, FALSE),
  ('system_security', 'configure', 'Configure Security', 'Modify security settings', TRUE, TRUE),
  ('system_security', 'audit', 'Security Audit', 'Full security audit access', TRUE, TRUE),

  -- System Backup
  ('system_backup', 'view', 'View Backups', 'View backup status', TRUE, FALSE),
  ('system_backup', 'manage', 'Manage Backups', 'Perform backup operations', TRUE, TRUE),
  ('system_backup', 'export', 'Export Backups', 'Export backup data', TRUE, TRUE)
ON CONFLICT (module, action) DO NOTHING;

-- ============================================
-- GRANT PERMISSIONS TO DEFAULT ROLES
-- ============================================

-- Super Admin gets ALL permissions
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT r.id, p.id, NULL
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- National Admin gets most permissions except system_backup manage
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT r.id, p.id, NULL
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'national_admin'
  AND NOT (p.module = 'system_backup' AND p.action IN ('manage', 'export'))
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- INSERT DEFAULT SECURITY POLICY
-- ============================================
INSERT INTO security_policies (name, description, is_default) VALUES
  ('Default Security Policy', 'Standard security policy for all users', TRUE)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- INSERT DEFAULT SYSTEM CONFIG
-- ============================================
INSERT INTO system_config (category, key, value, value_type, description, is_sensitive) VALUES
  ('general', 'system_name', '"PNGEC Biometric Registration System"', 'string', 'System display name', FALSE),
  ('general', 'election_year', '2027', 'number', 'Current election year', FALSE),
  ('general', 'registration_open', 'true', 'boolean', 'Whether registration is currently open', FALSE),
  ('security', 'session_timeout_minutes', '480', 'number', 'Session timeout in minutes', FALSE),
  ('security', 'max_login_attempts', '5', 'number', 'Maximum failed login attempts before lockout', FALSE),
  ('security', 'lockout_duration_minutes', '30', 'number', 'Account lockout duration in minutes', FALSE),
  ('security', 'require_mfa_admin', 'true', 'boolean', 'Require MFA for admin users', FALSE),
  ('registration', 'min_age', '18', 'number', 'Minimum voter age', FALSE),
  ('registration', 'require_biometrics', 'true', 'boolean', 'Require biometric capture', FALSE),
  ('registration', 'photo_required', 'true', 'boolean', 'Require voter photo', FALSE),
  ('sync', 'auto_sync_interval_minutes', '30', 'number', 'Automatic sync interval', FALSE),
  ('sync', 'offline_mode_enabled', 'true', 'boolean', 'Allow offline operation', FALSE),
  ('notifications', 'email_enabled', 'true', 'boolean', 'Enable email notifications', FALSE),
  ('notifications', 'sms_enabled', 'false', 'boolean', 'Enable SMS notifications', FALSE)
ON CONFLICT (category, key) DO NOTHING;

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE geographic_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs_detailed ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Allow authenticated users to read roles
DROP POLICY IF EXISTS "roles_read_policy" ON roles;
CREATE POLICY "roles_read_policy" ON roles FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to read permissions
DROP POLICY IF EXISTS "permissions_read_policy" ON permissions;
CREATE POLICY "permissions_read_policy" ON permissions FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to read role_permissions
DROP POLICY IF EXISTS "role_permissions_read_policy" ON role_permissions;
CREATE POLICY "role_permissions_read_policy" ON role_permissions FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to read geographic_units
DROP POLICY IF EXISTS "geographic_units_read_policy" ON geographic_units;
CREATE POLICY "geographic_units_read_policy" ON geographic_units FOR SELECT TO authenticated USING (true);

-- Allow service role full access for admin operations
DROP POLICY IF EXISTS "admin_users_service_policy" ON admin_users;
CREATE POLICY "admin_users_service_policy" ON admin_users FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "roles_service_policy" ON roles;
CREATE POLICY "roles_service_policy" ON roles FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "permissions_service_policy" ON permissions;
CREATE POLICY "permissions_service_policy" ON permissions FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "role_permissions_service_policy" ON role_permissions;
CREATE POLICY "role_permissions_service_policy" ON role_permissions FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "audit_logs_service_policy" ON audit_logs_detailed;
CREATE POLICY "audit_logs_service_policy" ON audit_logs_detailed FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow authenticated to read their own sessions
DROP POLICY IF EXISTS "user_sessions_own_policy" ON user_sessions;
CREATE POLICY "user_sessions_own_policy" ON user_sessions FOR SELECT TO authenticated
USING (user_id IN (SELECT id FROM admin_users WHERE auth_id = auth.uid()));

-- Allow authenticated to read audit logs (based on permissions)
DROP POLICY IF EXISTS "audit_logs_read_policy" ON audit_logs_detailed;
CREATE POLICY "audit_logs_read_policy" ON audit_logs_detailed FOR SELECT TO authenticated USING (true);

-- Allow authenticated to read system_config (non-sensitive)
DROP POLICY IF EXISTS "system_config_read_policy" ON system_config;
CREATE POLICY "system_config_read_policy" ON system_config FOR SELECT TO authenticated USING (is_sensitive = FALSE);
