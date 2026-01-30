'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

// ============================================
// TESTING MODE: Set to true to bypass login
// ============================================
const BYPASS_AUTH_FOR_TESTING = true;

// Mock user for testing (when BYPASS_AUTH_FOR_TESTING is true)
const MOCK_USER: AuthUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@pngec.gov.pg',
  full_name: 'Test Administrator',
  role: 'super_admin',
  province_id: undefined,
  clearance_level: 10,
};

interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  province_id?: string;
  clearance_level?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // If bypassing auth, initialize with mock user
  const [user, setUser] = useState<AuthUser | null>(BYPASS_AUTH_FOR_TESTING ? MOCK_USER : null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(BYPASS_AUTH_FOR_TESTING ? false : true);

  const fetchUserProfile = useCallback(async (authUser: User) => {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();

      if (profile) {
        setUser({
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          province_id: profile.province_id,
          clearance_level: profile.clearance_level,
        });
      } else {
        // Create user profile if it doesn't exist
        const { data: newProfile } = await supabase
          .from('users')
          .insert({
            auth_id: authUser.id,
            email: authUser.email || '',
            full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
            role: 'registration_officer',
            clearance_level: 1,
            is_active: true,
          })
          .select()
          .single();

        if (newProfile) {
          setUser({
            id: newProfile.id,
            email: newProfile.email,
            full_name: newProfile.full_name,
            role: newProfile.role,
            province_id: newProfile.province_id,
            clearance_level: newProfile.clearance_level,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Set basic user info from auth
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || 'User',
      });
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchUserProfile(session.user);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    // Skip auth setup if bypassing for testing
    if (BYPASS_AUTH_FOR_TESTING) {
      console.log('🔓 Auth bypassed for testing - using mock user:', MOCK_USER.email);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error ? new Error(error.message) : null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      return { error: error ? new Error(error.message) : null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    if (BYPASS_AUTH_FOR_TESTING) {
      console.log('🔓 Sign out disabled in test mode');
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, refreshUser }}>
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
