'use client';

import { usePathname } from 'next/navigation';
import { LeftSidebar } from './left-sidebar';
import { TopNavigation } from './top-navigation';
import { ProtectedRoute } from './protected-route';
import { useAuth } from '@/lib/auth-context';

interface AppLayoutProps {
  children: React.ReactNode;
}

// Pages that don't require authentication
const PUBLIC_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password'];

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { loading } = useAuth();

  // Check if current path is a public route
  const isPublicRoute = PUBLIC_PATHS.some(path => pathname.startsWith(path));

  // For public routes, render without layout chrome
  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-slate-50">
        {children}
      </div>
    );
  }

  // Show a minimal loading state for initial auth check on protected routes
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-emerald-200"></div>
            <div className="absolute left-0 top-0 h-16 w-16 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-semibold text-slate-700">PNGEC-BRS</span>
            <span className="text-sm text-slate-500">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // For protected routes, wrap with ProtectedRoute and show full layout
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        {/* Left Sidebar - Persistent Navigation */}
        <LeftSidebar />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top Navigation - Contextual */}
          <TopNavigation />

          {/* Page Content */}
          <main className="flex-1 overflow-auto p-4">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
