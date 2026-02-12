'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import {
  Bell,
  RefreshCw,
  UserPlus,
  Search,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Wifi,
  WifiOff,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { NotificationBell } from './notification-bell';

// Contextual sub-menus based on current module
const contextualMenus: Record<string, { label: string; href: string }[]> = {
  '/': [
    { label: 'Overview', href: '/' },
    { label: 'Real-time Stats', href: '/?tab=realtime' },
    { label: 'Provincial Summary', href: '/?tab=provincial' },
    { label: 'Alerts', href: '/?tab=alerts' },
  ],
  '/registration': [
    { label: 'New Registration', href: '/registration/new' },
    { label: 'Registration Review', href: '/registration/review' },
    { label: 'Photo Roll Preview', href: '/registration/photos' },
    { label: 'ID Card Output', href: '/registration/cards' },
  ],
  '/deduplication': [
    { label: 'Dedup Dashboard', href: '/deduplication' },
    { label: 'Pending Matches', href: '/deduplication/pending' },
    { label: 'Manual Review', href: '/deduplication/review' },
    { label: 'Confirmed Duplicates', href: '/deduplication/confirmed' },
  ],
  '/registry': [
    { label: 'Search Voters', href: '/registry' },
    { label: 'By Province', href: '/registry/province' },
    { label: 'By Ward', href: '/registry/ward' },
    { label: 'Export Data', href: '/registry/export' },
  ],
  '/exceptions': [
    { label: 'Open Exceptions', href: '/exceptions' },
    { label: 'Under Review', href: '/exceptions/review' },
    { label: 'Approved', href: '/exceptions/approved' },
    { label: 'Appeals', href: '/exceptions/appeals' },
  ],
  '/kits': [
    { label: 'Active Devices', href: '/kits' },
    { label: 'Offline Devices', href: '/kits/offline' },
    { label: 'Last Sync', href: '/kits/sync' },
    { label: 'Device Logs', href: '/kits/logs' },
    { label: 'Assign Kits', href: '/kits/assign' },
  ],
  '/sync': [
    { label: 'Sync Overview', href: '/sync' },
    { label: 'Pending Uploads', href: '/sync/pending' },
    { label: 'Failed Syncs', href: '/sync/failed' },
    { label: 'Sync History', href: '/sync/history' },
  ],
  '/audit': [
    { label: 'Recent Activity', href: '/audit' },
    { label: 'By User', href: '/audit/user' },
    { label: 'By Action', href: '/audit/action' },
    { label: 'Export Logs', href: '/audit/export' },
  ],
};

function getModuleTitle(pathname: string): string {
  if (pathname === '/') return 'Dashboard';
  if (pathname.startsWith('/registration')) return 'Voter Registration';
  if (pathname.startsWith('/deduplication')) return 'Biometric Deduplication';
  if (pathname.startsWith('/registry')) return 'Voter Registry';
  if (pathname.startsWith('/exceptions')) return 'Exceptions & Appeals';
  if (pathname.startsWith('/kits')) return 'Registration Kits';
  if (pathname.startsWith('/sync')) return 'Sync Status';
  if (pathname.startsWith('/gps')) return 'GPS Coverage';
  if (pathname.startsWith('/teams')) return 'Field Teams';
  if (pathname.startsWith('/audit')) return 'Audit Logs';
  if (pathname.startsWith('/custody')) return 'Chain of Custody';
  if (pathname.startsWith('/history')) return 'Registration History';
  if (pathname.startsWith('/export')) return 'Evidence Export';
  if (pathname.startsWith('/admin/users')) return 'Users & Roles';
  if (pathname.startsWith('/admin/wards')) return 'Wards & Locations';
  if (pathname.startsWith('/admin/devices')) return 'Device Management';
  if (pathname.startsWith('/admin/config')) return 'Configuration';
  if (pathname.startsWith('/system/integrations')) return 'Integrations';
  if (pathname.startsWith('/system/security')) return 'Security & Keys';
  if (pathname.startsWith('/system/backup')) return 'Backups & Recovery';
  if (pathname.startsWith('/system/health')) return 'System Health';
  return 'PNGEC-BRS';
}

function getContextualMenu(pathname: string) {
  // Find the matching base path
  const basePaths = Object.keys(contextualMenus).sort((a, b) => b.length - a.length);
  for (const basePath of basePaths) {
    if (pathname === basePath || (basePath !== '/' && pathname.startsWith(basePath))) {
      return contextualMenus[basePath];
    }
  }
  return contextualMenus['/'];
}

function getRoleName(role: string | undefined): string {
  if (!role) return 'User';
  const roleNames: Record<string, string> = {
    registration_officer: 'Registration Officer',
    supervisor: 'Supervisor',
    provincial_ro: 'Provincial RO',
    national_admin: 'National Admin',
    ict_security: 'ICT Security',
  };
  return roleNames[role] || role;
}

export function TopNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [systemStatus] = useState<'online' | 'offline' | 'degraded'>('online');
  const [isSigningOut, setIsSigningOut] = useState(false);
  const moduleTitle = getModuleTitle(pathname);
  const contextualMenu = getContextualMenu(pathname);

  // Get user display info
  const userName = user?.full_name || user?.email?.split('@')[0] || 'User';
  const userRole = user?.role || 'registration_officer';
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const clearanceLevel = user?.clearance_level || 1;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
      router.push('/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
      {/* Left: Module Title & Contextual Menu */}
      <div className="flex items-center gap-6">
        <h1 className="text-lg font-semibold text-slate-900">{moduleTitle}</h1>

        {/* Contextual Sub-Menu */}
        <nav className="hidden items-center gap-1 md:flex">
          {contextualMenu.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: Status, Search, Actions, User */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Search voters, devices..."
            className="h-8 w-64 bg-slate-50 pl-8 text-sm"
          />
        </div>

        {/* System Status */}
        <div className={cn(
          'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
          systemStatus === 'online' && 'bg-emerald-50 text-emerald-700',
          systemStatus === 'offline' && 'bg-red-50 text-red-700',
          systemStatus === 'degraded' && 'bg-amber-50 text-amber-700',
        )}>
          {systemStatus === 'online' && <Wifi className="h-3 w-3" />}
          {systemStatus === 'offline' && <WifiOff className="h-3 w-3" />}
          {systemStatus === 'degraded' && <AlertCircle className="h-3 w-3" />}
          <span className="capitalize">{systemStatus}</span>
        </div>

        {/* Sync Status */}
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
          <RefreshCw className="h-3.5 w-3.5 text-emerald-600" />
          <span className="hidden sm:inline">97.3% Synced</span>
        </Button>

        {/* Quick Actions */}
        <Button
          size="sm"
          className="h-8 gap-1.5 bg-emerald-600 text-xs hover:bg-emerald-700"
          onClick={() => router.push('/registration/new')}
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New Registration</span>
        </Button>

        {/* Notifications */}
        <NotificationBell userId={user?.id} />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 gap-2 px-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-slate-200 text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start text-left lg:flex">
                <span className="text-xs font-medium">{userName}</span>
                <span className="text-[10px] text-slate-500">{getRoleName(userRole)}</span>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="p-2">
              <p className="font-medium">{userName}</p>
              <p className="text-xs text-slate-500">{getRoleName(userRole)}</p>
              <p className="mt-1 text-[10px] text-slate-400">Clearance Level: {clearanceLevel}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 cursor-pointer"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isSigningOut ? 'Signing Out...' : 'Sign Out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
