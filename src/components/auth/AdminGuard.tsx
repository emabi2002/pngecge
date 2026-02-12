'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getUserPermissions, canAccessPage, type UserPermissions } from '@/lib/rbac';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AdminGuardProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  minRoleLevel?: number;
}

export function AdminGuard({ children, requiredPermissions, minRoleLevel }: AdminGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    async function checkPermissions() {
      if (authLoading) return;

      if (!user) {
        router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
        return;
      }

      try {
        const userPermissions = await getUserPermissions(user.id);
        setPermissions(userPermissions);

        // Check page access
        if (!canAccessPage(userPermissions, pathname)) {
          setAccessDenied(true);
        }

        // Check specific permissions if required
        if (requiredPermissions && userPermissions) {
          const hasRequired = requiredPermissions.some(p => 
            userPermissions.permissions.includes(p) || userPermissions.roleLevel >= 10
          );
          if (!hasRequired) {
            setAccessDenied(true);
          }
        }

        // Check minimum role level
        if (minRoleLevel && userPermissions && userPermissions.roleLevel < minRoleLevel) {
          setAccessDenied(true);
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
      } finally {
        setLoading(false);
      }
    }

    checkPermissions();
  }, [user, authLoading, pathname, requiredPermissions, minRoleLevel, router]);

  if (authLoading || loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-2 text-sm text-slate-500">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex h-96 items-center justify-center p-6">
        <Card className="max-w-md border-red-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-red-800">Access Denied</CardTitle>
                <CardDescription>
                  You do not have permission to access this page
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Your current role ({permissions?.roleName || 'Unknown'}) does not have the 
              required permissions to access this administrative function.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => router.push('/admin')}
              >
                Admin Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

export function usePermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPermissions() {
      if (!user) {
        setPermissions(null);
        setLoading(false);
        return;
      }

      try {
        const userPermissions = await getUserPermissions(user.id);
        setPermissions(userPermissions);
      } catch (error) {
        console.error('Error loading permissions:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPermissions();
  }, [user]);

  return { permissions, loading };
}
