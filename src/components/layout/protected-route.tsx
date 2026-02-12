'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

// Full-page loading skeleton
function AuthLoadingState() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-emerald-200"></div>
          <div className="absolute left-0 top-0 h-16 w-16 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-lg font-semibold text-slate-700">PNGEC-BRS</span>
          <span className="text-sm text-slate-500">Loading authentication...</span>
        </div>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect while still loading
    if (loading) return;

    // If not authenticated, redirect to login
    if (!user) {
      // Store the intended destination for post-login redirect
      const returnUrl = encodeURIComponent(pathname);
      router.replace(`/login?returnUrl=${returnUrl}`);
      return;
    }

    // Check for required role if specified
    if (requiredRole && user.role !== requiredRole) {
      // User doesn't have required role - redirect to dashboard
      router.replace('/');
    }
  }, [user, loading, router, pathname, requiredRole]);

  // Show loading state while checking authentication
  if (loading) {
    return <AuthLoadingState />;
  }

  // Don't render children if not authenticated
  if (!user) {
    return <AuthLoadingState />;
  }

  // Don't render if role doesn't match
  if (requiredRole && user.role !== requiredRole) {
    return <AuthLoadingState />;
  }

  // Render the protected content
  return <>{children}</>;
}

export default ProtectedRoute;
