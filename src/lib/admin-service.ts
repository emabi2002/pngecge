import { supabase } from '@/lib/supabase';

// Types
export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  level: number;
  is_system_role: boolean;
  is_active: boolean;
  color: string;
  icon: string;
  created_at: string;
  permissions_count?: number;
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  name: string;
  description?: string;
  is_sensitive: boolean;
  requires_mfa: boolean;
}

export interface AdminUser {
  id: string;
  auth_id?: string;
  email: string;
  full_name: string;
  phone?: string;
  employee_id?: string;
  national_id?: string;
  role_id?: string;
  role?: Role;
  clearance_level: number;
  status: 'active' | 'inactive' | 'suspended' | 'pending_approval' | 'locked';
  is_active: boolean;
  mfa_enabled: boolean;
  mfa_method?: string;
  assigned_province_id?: string;
  assigned_district_id?: string;
  department?: string;
  position?: string;
  last_login_at?: string;
  created_at: string;
  created_by?: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  user?: AdminUser;
  ip_address: string;
  user_agent: string;
  device_type: string;
  browser?: string;
  os?: string;
  location?: { city?: string; country?: string };
  started_at: string;
  last_activity_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  action: string;
  category: string;
  entity_type?: string;
  entity_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  status: 'success' | 'failure' | 'warning';
  error_message?: string;
  metadata?: Record<string, unknown>;
}

export interface ApprovalRequest {
  id: string;
  request_type: string;
  requestor_id: string;
  requestor?: AdminUser;
  target_user_id?: string;
  target_user?: AdminUser;
  requested_changes: Record<string, unknown>;
  justification?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';
  approver_role_required?: string;
  approved_by?: string;
  approver?: AdminUser;
  approved_at?: string;
  rejection_reason?: string;
  expires_at?: string;
  created_at: string;
}

export interface GeographicUnit {
  id: string;
  code: string;
  name: string;
  level: 'national' | 'regional' | 'provincial' | 'district' | 'llg' | 'ward';
  parent_id?: string;
  parent?: GeographicUnit;
  population?: number;
  registered_voters: number;
  is_active: boolean;
  children_count?: number;
  created_at: string;
}

// ============================================
// ROLES
// ============================================

export async function getRoles(): Promise<Role[]> {
  
  
  const { data: roles, error } = await supabase
    .from('roles')
    .select('*')
    .order('level', { ascending: false });

  if (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }

  // Get permissions count for each role
  const { data: permCounts } = await supabase
    .from('role_permissions')
    .select('role_id');

  const countsMap = (permCounts || []).reduce((acc: Record<string, number>, rp: { role_id: string }) => {
    acc[rp.role_id] = (acc[rp.role_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (roles || []).map((role: Role) => ({
    ...role,
    permissions_count: countsMap[role.id] || 0,
  }));
}

export async function createRole(role: Partial<Role>): Promise<Role> {
  
  
  const { data, error } = await supabase
    .from('roles')
    .insert([role])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRole(id: string, updates: Partial<Role>): Promise<Role> {
  
  
  const { data, error } = await supabase
    .from('roles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRole(id: string): Promise<void> {
  
  
  const { error } = await supabase
    .from('roles')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================
// PERMISSIONS
// ============================================

export async function getPermissions(): Promise<Permission[]> {
  
  
  const { data, error } = await supabase
    .from('permissions')
    .select('*')
    .order('module')
    .order('action');

  if (error) throw error;
  return data || [];
}

export async function getRolePermissions(roleId: string): Promise<string[]> {
  
  
  const { data, error } = await supabase
    .from('role_permissions')
    .select('permission_id')
    .eq('role_id', roleId);

  if (error) throw error;
  return (data || []).map((rp: { permission_id: string }) => rp.permission_id);
}

export async function setRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
  
  
  // Remove existing permissions
  await supabase
    .from('role_permissions')
    .delete()
    .eq('role_id', roleId);

  // Add new permissions
  if (permissionIds.length > 0) {
    const { error } = await supabase
      .from('role_permissions')
      .insert(permissionIds.map(pid => ({
        role_id: roleId,
        permission_id: pid,
      })));

    if (error) throw error;
  }
}

// ============================================
// ADMIN USERS
// ============================================

export async function getAdminUsers(): Promise<AdminUser[]> {
  
  
  const { data, error } = await supabase
    .from('admin_users')
    .select(`
      *,
      role:roles(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching admin users:', error);
    throw error;
  }

  return data || [];
}

export async function getAdminUser(id: string): Promise<AdminUser | null> {
  
  
  const { data, error } = await supabase
    .from('admin_users')
    .select(`
      *,
      role:roles(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

export async function createAdminUser(user: Partial<AdminUser>): Promise<AdminUser> {
  
  
  const { data, error } = await supabase
    .from('admin_users')
    .insert([{
      ...user,
      status: 'pending_approval',
      is_active: false,
    }])
    .select(`
      *,
      role:roles(*)
    `)
    .single();

  if (error) throw error;

  // Create approval request
  await supabase
    .from('approval_requests')
    .insert([{
      request_type: 'user_creation',
      requestor_id: user.created_by,
      target_user_id: data.id,
      requested_changes: {
        email: user.email,
        full_name: user.full_name,
        role_id: user.role_id,
      },
      justification: 'New user registration',
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }]);

  return data;
}

export async function updateAdminUser(id: string, updates: Partial<AdminUser>): Promise<AdminUser> {
  
  
  const { data, error } = await supabase
    .from('admin_users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      role:roles(*)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserStatus(id: string, status: AdminUser['status']): Promise<void> {
  
  
  const isActive = status === 'active';
  
  const { error } = await supabase
    .from('admin_users')
    .update({
      status,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteAdminUser(id: string): Promise<void> {
  
  
  const { error } = await supabase
    .from('admin_users')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================
// USER SESSIONS
// ============================================

export async function getActiveSessions(): Promise<UserSession[]> {
  
  
  const { data, error } = await supabase
    .from('user_sessions')
    .select(`
      *,
      user:admin_users(id, full_name, email, role:roles(*))
    `)
    .eq('is_active', true)
    .order('last_activity_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function terminateSession(sessionId: string): Promise<void> {
  
  
  const { error } = await supabase
    .from('user_sessions')
    .update({
      is_active: false,
      terminated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) throw error;
}

export async function terminateAllUserSessions(userId: string): Promise<void> {
  
  
  const { error } = await supabase
    .from('user_sessions')
    .update({
      is_active: false,
      terminated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) throw error;
}

// ============================================
// AUDIT LOGS
// ============================================

export async function getAuditLogs(options?: {
  limit?: number;
  offset?: number;
  userId?: string;
  action?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}): Promise<{ logs: AuditLog[]; total: number }> {
  
  
  let query = supabase
    .from('audit_logs_detailed')
    .select('*', { count: 'exact' });

  if (options?.userId) {
    query = query.eq('user_id', options.userId);
  }
  if (options?.action) {
    query = query.eq('action', options.action);
  }
  if (options?.category) {
    query = query.eq('category', options.category);
  }
  if (options?.status) {
    query = query.eq('status', options.status);
  }
  if (options?.startDate) {
    query = query.gte('timestamp', options.startDate);
  }
  if (options?.endDate) {
    query = query.lte('timestamp', options.endDate);
  }

  query = query
    .order('timestamp', { ascending: false })
    .range(
      options?.offset || 0,
      (options?.offset || 0) + (options?.limit || 50) - 1
    );

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    logs: data || [],
    total: count || 0,
  };
}

export async function createAuditLog(log: Partial<AuditLog>): Promise<void> {
  
  
  const { error } = await supabase
    .from('audit_logs_detailed')
    .insert([{
      ...log,
      timestamp: new Date().toISOString(),
    }]);

  if (error) {
    console.error('Error creating audit log:', error);
  }
}

// ============================================
// APPROVAL REQUESTS
// ============================================

export async function getApprovalRequests(status?: string): Promise<ApprovalRequest[]> {
  
  
  let query = supabase
    .from('approval_requests')
    .select(`
      *,
      requestor:admin_users!requestor_id(id, full_name, email, role:roles(*)),
      target_user:admin_users!target_user_id(id, full_name, email),
      approver:admin_users!approved_by(id, full_name, email)
    `)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function approveRequest(
  requestId: string,
  approverId: string
): Promise<void> {
  
  
  const { data: request, error: fetchError } = await supabase
    .from('approval_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError) throw fetchError;

  // Update approval request
  const { error: updateError } = await supabase
    .from('approval_requests')
    .update({
      status: 'approved',
      approved_by: approverId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (updateError) throw updateError;

  // Handle based on request type
  if (request.request_type === 'user_creation' && request.target_user_id) {
    await updateUserStatus(request.target_user_id, 'active');
  }
}

export async function rejectRequest(
  requestId: string,
  approverId: string,
  reason: string
): Promise<void> {
  
  
  const { error } = await supabase
    .from('approval_requests')
    .update({
      status: 'rejected',
      approved_by: approverId,
      approved_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq('id', requestId);

  if (error) throw error;
}

// ============================================
// GEOGRAPHIC UNITS
// ============================================

export async function getGeographicUnits(level?: string): Promise<GeographicUnit[]> {
  
  
  let query = supabase
    .from('geographic_units')
    .select(`
      *,
      parent:geographic_units!parent_id(id, name, code, level)
    `)
    .order('level')
    .order('name');

  if (level && level !== 'all') {
    query = query.eq('level', level);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Calculate children count
  const childrenCounts = (data || []).reduce((acc: Record<string, number>, unit: { id: string; parent_id?: string }) => {
    if (unit.parent_id) {
      acc[unit.parent_id] = (acc[unit.parent_id] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (data || []).map((unit: GeographicUnit) => ({
    ...unit,
    children_count: childrenCounts[unit.id] || 0,
  }));
}

export async function createGeographicUnit(unit: Partial<GeographicUnit>): Promise<GeographicUnit> {
  
  
  const { data, error } = await supabase
    .from('geographic_units')
    .insert([unit])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateGeographicUnit(id: string, updates: Partial<GeographicUnit>): Promise<GeographicUnit> {
  
  
  const { data, error } = await supabase
    .from('geographic_units')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGeographicUnit(id: string): Promise<void> {
  
  
  const { error } = await supabase
    .from('geographic_units')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================
// SYSTEM CONFIG
// ============================================

export async function getSystemConfig(): Promise<Record<string, string>> {
  
  
  const { data, error } = await supabase
    .from('system_config')
    .select('*');

  if (error) throw error;

  return (data || []).reduce((acc: Record<string, string>, config: { key: string; value: string }) => {
    acc[config.key] = config.value;
    return acc;
  }, {} as Record<string, string>);
}

export async function updateSystemConfig(key: string, value: string): Promise<void> {
  
  
  const { error } = await supabase
    .from('system_config')
    .upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
}

// ============================================
// SECURITY POLICIES
// ============================================

export async function getSecurityPolicy(): Promise<Record<string, unknown> | null> {
  
  
  const { data, error } = await supabase
    .from('security_policies')
    .select('*')
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

export async function updateSecurityPolicy(updates: Record<string, unknown>): Promise<void> {
  
  
  const { error } = await supabase
    .from('security_policies')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('is_active', true);

  if (error) throw error;
}
