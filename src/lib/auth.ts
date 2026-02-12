'use client';

import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

// User roles for PNGEC-BRS
export type UserRole =
  | 'registration_officer'
  | 'supervisor'
  | 'provincial_ro'
  | 'national_admin'
  | 'ict_security';

export interface BRSUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  provinceId?: string;
  provinceName?: string;
  clearanceLevel: number;
  isActive: boolean;
  mfaEnabled: boolean;
  lastLogin?: Date;
}

// Role permissions
export const rolePermissions: Record<UserRole, string[]> = {
  registration_officer: [
    'registration:create',
    'registration:view',
    'kits:view',
    'sync:view',
  ],
  supervisor: [
    'registration:create',
    'registration:view',
    'registration:approve',
    'exceptions:review',
    'dedup:review',
    'kits:view',
    'kits:manage',
    'sync:view',
    'teams:view',
  ],
  provincial_ro: [
    'registration:view',
    'registration:approve',
    'exceptions:review',
    'exceptions:override',
    'dedup:review',
    'kits:view',
    'kits:manage',
    'sync:view',
    'teams:manage',
    'audit:view',
    'reports:generate',
    'export:create',
  ],
  national_admin: [
    'registration:view',
    'registration:approve',
    'exceptions:review',
    'exceptions:override',
    'dedup:review',
    'kits:view',
    'kits:manage',
    'sync:view',
    'teams:manage',
    'audit:view',
    'reports:generate',
    'export:create',
    'users:view',
    'users:manage',
    'config:view',
    'system:view',
  ],
  ict_security: [
    'registration:view',
    'audit:view',
    'audit:full',
    'reports:generate',
    'export:create',
    'users:view',
    'users:manage',
    'config:view',
    'config:manage',
    'security:manage',
    'system:view',
    'system:manage',
    'integrations:manage',
    'backup:manage',
  ],
};

// Role display names
export const roleDisplayNames: Record<UserRole, string> = {
  registration_officer: 'Registration Officer',
  supervisor: 'Supervisor',
  provincial_ro: 'Provincial Returning Officer',
  national_admin: 'National Administrator',
  ict_security: 'ICT Security Administrator',
};

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<{
  user: User | null;
  session: Session | null;
  error: Error | null;
}> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return {
    user: data.user,
    session: data.session,
    error: error as Error | null,
  };
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.signOut();
  return { error: error as Error | null };
}

/**
 * Get the current session
 */
export async function getSession(): Promise<{
  session: Session | null;
  error: Error | null;
}> {
  const { data, error } = await supabase.auth.getSession();
  return {
    session: data.session,
    error: error as Error | null,
  };
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * Get the current BRS user profile
 */
export async function getBRSUserProfile(): Promise<BRSUser | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  // Fetch the user profile from the users table
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      full_name,
      role,
      province_id,
      clearance_level,
      is_active,
      mfa_enabled,
      last_login,
      provinces (
        name
      )
    `)
    .eq('auth_id', user.id)
    .single();

  if (error || !data) {
    // Return a default profile for development
    return {
      id: user.id,
      email: user.email || '',
      fullName: user.user_metadata?.full_name || 'Demo User',
      role: 'national_admin',
      clearanceLevel: 5,
      isActive: true,
      mfaEnabled: false,
    };
  }

  // Cast data to expected shape
  const userData = data as unknown as {
    id: string;
    email: string;
    full_name: string;
    role: string;
    province_id?: string;
    clearance_level: number;
    is_active: boolean;
    mfa_enabled: boolean;
    last_login?: string;
    provinces?: { name: string } | null;
  };

  return {
    id: userData.id,
    email: userData.email,
    fullName: userData.full_name,
    role: userData.role as UserRole,
    provinceId: userData.province_id,
    provinceName: userData.provinces?.name,
    clearanceLevel: userData.clearance_level,
    isActive: userData.is_active,
    mfaEnabled: userData.mfa_enabled,
    lastLogin: userData.last_login ? new Date(userData.last_login) : undefined,
  };
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = rolePermissions[role];
  return permissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: string[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: string[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Get sidebar items based on user role
 */
export function getAccessibleModules(role: UserRole): string[] {
  const permissions = rolePermissions[role];
  const modules: string[] = ['dashboard'];

  if (permissions.some(p => p.startsWith('registration:'))) {
    modules.push('registration', 'registry');
  }

  if (hasPermission(role, 'dedup:review')) {
    modules.push('deduplication');
  }

  if (hasPermission(role, 'exceptions:review')) {
    modules.push('exceptions');
  }

  if (permissions.some(p => p.startsWith('kits:'))) {
    modules.push('kits');
  }

  if (hasPermission(role, 'sync:view')) {
    modules.push('sync', 'gps');
  }

  if (permissions.some(p => p.startsWith('teams:'))) {
    modules.push('teams');
  }

  if (permissions.some(p => p.startsWith('audit:'))) {
    modules.push('audit', 'custody', 'history');
  }

  if (hasPermission(role, 'export:create')) {
    modules.push('export');
  }

  if (permissions.some(p => p.startsWith('users:'))) {
    modules.push('users', 'wards');
  }

  if (permissions.some(p => p.startsWith('config:'))) {
    modules.push('devices', 'config');
  }

  if (permissions.some(p => p.startsWith('system:') || p.startsWith('integrations:') || p.startsWith('security:') || p.startsWith('backup:'))) {
    modules.push('integrations', 'security', 'backup', 'health');
  }

  return modules;
}

/**
 * Listen for auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return subscription;
}

/**
 * Request password reset
 */
export async function resetPassword(email: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { error: error as Error | null };
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { error: error as Error | null };
}

/**
 * Update user profile
 */
export async function updateUserProfile(data: {
  fullName?: string;
  email?: string;
}): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.updateUser({
    email: data.email,
    data: { full_name: data.fullName },
  });
  return { error: error as Error | null };
}
