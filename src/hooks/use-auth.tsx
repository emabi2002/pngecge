'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import {
  signIn as authSignIn,
  signOut as authSignOut,
  getSession,
  getCurrentUser,
  getBRSUserProfile,
  onAuthStateChange,
  hasPermission,
  hasAnyPermission,
  getAccessibleModules,
  type BRSUser,
  type UserRole,
} from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  brsUser: BRSUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  checkPermission: (permission: string) => boolean;
  checkAnyPermission: (permissions: string[]) => boolean;
  accessibleModules: string[];
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [brsUser, setBrsUser] = useState<BRSUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const { session: currentSession } = await getSession();
      setSession(currentSession);

      if (currentSession) {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        const profile = await getBRSUserProfile();
        setBrsUser(profile);
      } else {
        setUser(null);
        setBrsUser(null);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();

    const subscription = onAuthStateChange(async (event, newSession) => {
      setSession(newSession);

      if (newSession) {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        const profile = await getBRSUserProfile();
        setBrsUser(profile);
      } else {
        setUser(null);
        setBrsUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await authSignIn(email, password);

    if (!result.error && result.user) {
      setUser(result.user);
      setSession(result.session);

      const profile = await getBRSUserProfile();
      setBrsUser(profile);
    }

    return { error: result.error };
  }, []);

  const signOut = useCallback(async () => {
    const result = await authSignOut();

    if (!result.error) {
      setUser(null);
      setSession(null);
      setBrsUser(null);
    }

    return result;
  }, []);

  const checkPermission = useCallback((permission: string) => {
    if (!brsUser) return false;
    return hasPermission(brsUser.role, permission);
  }, [brsUser]);

  const checkAnyPermission = useCallback((permissions: string[]) => {
    if (!brsUser) return false;
    return hasAnyPermission(brsUser.role, permissions);
  }, [brsUser]);

  const accessibleModules = brsUser
    ? getAccessibleModules(brsUser.role)
    : [];

  const value: AuthContextType = {
    user,
    brsUser,
    session,
    isLoading,
    isAuthenticated: !!session,
    signIn,
    signOut,
    checkPermission,
    checkAnyPermission,
    accessibleModules,
    refresh: loadUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

/**
 * Hook for checking if user has a specific permission
 */
export function usePermission(permission: string): boolean {
  const { checkPermission, isLoading } = useAuth();

  if (isLoading) return false;

  return checkPermission(permission);
}

/**
 * Hook for checking if user has any of the specified permissions
 */
export function useAnyPermission(permissions: string[]): boolean {
  const { checkAnyPermission, isLoading } = useAuth();

  if (isLoading) return false;

  return checkAnyPermission(permissions);
}

/**
 * Hook for getting the user's role
 */
export function useUserRole(): UserRole | null {
  const { brsUser } = useAuth();
  return brsUser?.role || null;
}

/**
 * Hook for getting accessible modules
 */
export function useAccessibleModules(): string[] {
  const { accessibleModules } = useAuth();
  return accessibleModules;
}

// For development/demo mode - mock user
export const DEMO_USER: BRSUser = {
  id: 'demo-user-001',
  email: 'admin@pngec.gov.pg',
  fullName: 'Demo Administrator',
  role: 'national_admin',
  clearanceLevel: 5,
  isActive: true,
  mfaEnabled: false,
};

/**
 * Hook for demo mode - returns a mock authenticated user
 */
export function useDemoAuth() {
  return {
    user: null,
    brsUser: DEMO_USER,
    session: null,
    isLoading: false,
    isAuthenticated: true,
    signIn: async () => ({ error: null }),
    signOut: async () => ({ error: null }),
    checkPermission: (permission: string) => hasPermission(DEMO_USER.role, permission),
    checkAnyPermission: (permissions: string[]) => hasAnyPermission(DEMO_USER.role, permissions),
    accessibleModules: getAccessibleModules(DEMO_USER.role),
    refresh: async () => {},
  };
}
