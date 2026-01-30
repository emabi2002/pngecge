import { supabase } from '@/lib/supabase';

export interface UserPermissions {
  userId: string;
  roleId: string;
  roleName: string;
  roleLevel: number;
  permissions: string[];
}

// Cache for user permissions
const permissionsCache = new Map<string, { data: UserPermissions; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getUserPermissions(userId: string): Promise<UserPermissions | null> {
  // Check cache
  const cached = permissionsCache.get(userId);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  try {
    // Get user's role
    const { data: user, error: userError } = await supabase
      .from('admin_users')
      .select(`
        id,
        role_id,
        role:roles(id, name, level, code)
      `)
      .eq('auth_id', userId)
      .single();

    if (userError || !user || !user.role) {
      return null;
    }

    // Get role permissions
    const { data: rolePermissions, error: permError } = await supabase
      .from('role_permissions')
      .select(`
        permission:permissions(module, action)
      `)
      .eq('role_id', user.role_id);

    if (permError) {
      console.error('Error fetching permissions:', permError);
      return null;
    }

    const permissions = (rolePermissions || [])
      .map((rp: unknown) => 
        (rp as { permission: { module: string; action: string } | null }).permission ? `${(rp as { permission: { module: string; action: string } }).permission.module}.${(rp as { permission: { module: string; action: string } }).permission.action}` : null
      )
      .filter(Boolean) as string[];

    const userPermissions: UserPermissions = {
      userId,
      roleId: user.role_id,
      roleName: (user.role as unknown as { name: string }).name,
      roleLevel: (user.role as unknown as { level: number }).level,
      permissions,
    };

    // Cache the result
    permissionsCache.set(userId, {
      data: userPermissions,
      expiry: Date.now() + CACHE_TTL,
    });

    return userPermissions;
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return null;
  }
}

export function hasPermission(userPermissions: UserPermissions | null, permission: string): boolean {
  if (!userPermissions) return false;
  
  // Super admin (level 10) has all permissions
  if (userPermissions.roleLevel >= 10) return true;
  
  return userPermissions.permissions.includes(permission);
}

export function hasAnyPermission(userPermissions: UserPermissions | null, permissions: string[]): boolean {
  if (!userPermissions) return false;
  if (userPermissions.roleLevel >= 10) return true;
  
  return permissions.some(p => userPermissions.permissions.includes(p));
}

export function hasAllPermissions(userPermissions: UserPermissions | null, permissions: string[]): boolean {
  if (!userPermissions) return false;
  if (userPermissions.roleLevel >= 10) return true;
  
  return permissions.every(p => userPermissions.permissions.includes(p));
}

export function hasMinRoleLevel(userPermissions: UserPermissions | null, minLevel: number): boolean {
  if (!userPermissions) return false;
  return userPermissions.roleLevel >= minLevel;
}

// Clear cache for a specific user (call after role changes)
export function clearPermissionsCache(userId?: string) {
  if (userId) {
    permissionsCache.delete(userId);
  } else {
    permissionsCache.clear();
  }
}

// Permission constants for type safety
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  
  // User Management
  USERS_VIEW: 'admin_users.view',
  USERS_CREATE: 'admin_users.create',
  USERS_EDIT: 'admin_users.edit',
  USERS_DELETE: 'admin_users.delete',
  USERS_APPROVE: 'admin_users.approve',
  
  // Roles
  ROLES_VIEW: 'admin_roles.view',
  ROLES_MANAGE: 'admin_roles.manage',
  
  // Permissions
  PERMISSIONS_VIEW: 'admin_permissions.view',
  PERMISSIONS_MANAGE: 'admin_permissions.manage',
  
  // Audit
  AUDIT_VIEW: 'audit.view',
  AUDIT_EXPORT: 'audit.export',
  
  // Export
  EXPORT_VIEW: 'export.view',
  EXPORT_CREATE: 'export.create',
  EXPORT_APPROVE: 'export.approve',
  
  // Registration
  REGISTRATION_VIEW: 'registration.view',
  REGISTRATION_CREATE: 'registration.create',
  REGISTRATION_EDIT: 'registration.edit',
  
  // System
  SYSTEM_CONFIG: 'admin_config.manage',
  SYSTEM_SECURITY: 'system_security.manage',
} as const;

// Role level requirements for admin pages
export const ADMIN_PAGE_REQUIREMENTS: Record<string, { minLevel: number; permissions: string[] }> = {
  '/admin': { minLevel: 1, permissions: ['dashboard.view'] },
  '/admin/users': { minLevel: 5, permissions: ['admin_users.view'] },
  '/admin/roles': { minLevel: 7, permissions: ['admin_roles.view'] },
  '/admin/permissions': { minLevel: 9, permissions: ['admin_permissions.view'] },
  '/admin/security': { minLevel: 9, permissions: ['system_security.view'] },
  '/admin/sessions': { minLevel: 7, permissions: ['admin_users.view'] },
  '/admin/approvals': { minLevel: 5, permissions: ['admin_users.approve'] },
  '/admin/exports': { minLevel: 3, permissions: ['export.view'] },
  '/admin/audit-logs': { minLevel: 3, permissions: ['audit.view'] },
  '/admin/wards': { minLevel: 5, permissions: ['admin_wards.view'] },
  '/admin/devices': { minLevel: 5, permissions: ['admin_devices.view'] },
  '/admin/config': { minLevel: 9, permissions: ['admin_config.view'] },
};

export function canAccessPage(userPermissions: UserPermissions | null, pathname: string): boolean {
  const requirements = ADMIN_PAGE_REQUIREMENTS[pathname];
  
  if (!requirements) {
    // No specific requirements, check if user has any admin role
    return hasMinRoleLevel(userPermissions, 1);
  }
  
  return (
    hasMinRoleLevel(userPermissions, requirements.minLevel) ||
    hasAnyPermission(userPermissions, requirements.permissions)
  );
}
