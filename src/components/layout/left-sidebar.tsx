'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  UserPlus,
  Fingerprint,
  Users,
  AlertTriangle,
  Tablet,
  RefreshCw,
  MapPin,
  UsersRound,
  FileText,
  Link2,
  History,
  FileOutput,
  UserCog,
  Map,
  HardDrive,
  Settings,
  Plug,
  Shield,
  Database,
  Activity,
  ChevronDown,
  ChevronRight,
  Key,
  Lock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: {
    count: number;
    variant: 'default' | 'warning' | 'error' | 'success';
  };
}

const navigationSections: NavSection[] = [
  {
    title: 'Core Operations',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, href: '/' },
      { id: 'registration', label: 'Voter Registration', icon: <UserPlus className="h-4 w-4" />, href: '/registration', badge: { count: 127, variant: 'warning' } },
      { id: 'deduplication', label: 'Biometric Deduplication', icon: <Fingerprint className="h-4 w-4" />, href: '/deduplication', badge: { count: 3421, variant: 'warning' } },
      { id: 'registry', label: 'Voter Registry', icon: <Users className="h-4 w-4" />, href: '/registry' },
      { id: 'exceptions', label: 'Exceptions & Appeals', icon: <AlertTriangle className="h-4 w-4" />, href: '/exceptions', badge: { count: 891, variant: 'error' } },
    ],
  },
  {
    title: 'Field Operations',
    items: [
      { id: 'kits', label: 'Registration Kits', icon: <Tablet className="h-4 w-4" />, href: '/kits', badge: { count: 234, variant: 'error' } },
      { id: 'sync', label: 'Sync Status', icon: <RefreshCw className="h-4 w-4" />, href: '/sync' },
      { id: 'gps', label: 'GPS Coverage', icon: <MapPin className="h-4 w-4" />, href: '/gps' },
      { id: 'teams', label: 'Field Teams', icon: <UsersRound className="h-4 w-4" />, href: '/teams' },
    ],
  },
  {
    title: 'Audit & Compliance',
    items: [
      { id: 'audit', label: 'Audit Logs', icon: <FileText className="h-4 w-4" />, href: '/audit' },
      { id: 'custody', label: 'Chain of Custody', icon: <Link2 className="h-4 w-4" />, href: '/custody' },
      { id: 'history', label: 'Registration History', icon: <History className="h-4 w-4" />, href: '/history' },
      { id: 'export', label: 'Evidence Export', icon: <FileOutput className="h-4 w-4" />, href: '/export' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { id: 'admin-dashboard', label: 'Admin Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, href: '/admin' },
      { id: 'users', label: 'User Management', icon: <UserCog className="h-4 w-4" />, href: '/admin/users', badge: { count: 23, variant: 'warning' } },
      { id: 'approvals', label: 'Approval Workflows', icon: <Shield className="h-4 w-4" />, href: '/admin/approvals', badge: { count: 3, variant: 'warning' } },
      { id: 'sessions', label: 'Active Sessions', icon: <Activity className="h-4 w-4" />, href: '/admin/sessions' },
      { id: 'roles', label: 'Role Management', icon: <Shield className="h-4 w-4" />, href: '/admin/roles' },
      { id: 'permissions', label: 'Permission Matrix', icon: <Key className="h-4 w-4" />, href: '/admin/permissions' },
      { id: 'security', label: 'Security Settings', icon: <Lock className="h-4 w-4" />, href: '/admin/security' },
      { id: 'wards', label: 'Geographic Units', icon: <Map className="h-4 w-4" />, href: '/admin/wards' },
      { id: 'device-registry', label: 'Device Registry', icon: <Fingerprint className="h-4 w-4" />, href: '/admin/device-registry', badge: { count: 1247, variant: 'default' } },
      { id: 'devices', label: 'Device Management', icon: <HardDrive className="h-4 w-4" />, href: '/admin/devices' },
      { id: 'exports', label: 'Data Exports', icon: <FileOutput className="h-4 w-4" />, href: '/admin/exports' },
      { id: 'audit-logs', label: 'Audit Logs', icon: <FileText className="h-4 w-4" />, href: '/admin/audit-logs' },
      { id: 'config', label: 'Configuration', icon: <Settings className="h-4 w-4" />, href: '/admin/config' },
    ],
  },
  {
    title: 'System',
    items: [
      { id: 'integrations', label: 'Integrations (EVS/ECS)', icon: <Plug className="h-4 w-4" />, href: '/system/integrations' },
      { id: 'security', label: 'Security & Keys', icon: <Shield className="h-4 w-4" />, href: '/system/security' },
      { id: 'backup', label: 'Backups & Recovery', icon: <Database className="h-4 w-4" />, href: '/system/backup' },
      { id: 'health', label: 'System Health', icon: <Activity className="h-4 w-4" />, href: '/system/health' },
    ],
  },
];

function getBadgeClass(variant: 'default' | 'warning' | 'error' | 'success') {
  switch (variant) {
    case 'success': return 'bg-emerald-600 text-white hover:bg-emerald-600';
    case 'warning': return 'bg-amber-500 text-white hover:bg-amber-500';
    case 'error': return 'bg-red-600 text-white hover:bg-red-600';
    default: return 'bg-slate-600 text-white hover:bg-slate-600';
  }
}

export function LeftSidebar() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<string[]>(navigationSections.map(s => s.title));

  const toggleSection = (title: string) => {
    setOpenSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  return (
    <div className="flex h-full w-60 flex-col border-r border-slate-700 bg-slate-900">
      {/* Logo and Header */}
      <div className="flex h-14 items-center gap-3 border-b border-slate-700 px-3">
        <div className="flex h-9 w-9 items-center justify-center rounded bg-emerald-700">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white">PNGEC-BRS</span>
          <span className="text-[9px] text-slate-400">Biometric Registration</span>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-3">
          {navigationSections.map((section) => (
            <div key={section.title}>
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                className="flex w-full items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300"
              >
                {section.title}
                {openSections.includes(section.title) ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
              {openSections.includes(section.title) && (
                <div className="mt-1 space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={cn(
                          'flex items-center justify-between rounded px-2 py-1.5 text-[13px] transition-colors',
                          isActive
                            ? 'bg-emerald-700/20 text-emerald-400'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn(isActive ? 'text-emerald-400' : 'text-slate-400')}>{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <Badge className={cn('h-4 min-w-[18px] justify-center px-1 text-[9px] font-medium', getBadgeClass(item.badge.variant))}>
                            {item.badge.count > 999 ? `${(item.badge.count / 1000).toFixed(1)}k` : item.badge.count}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-slate-700 p-3">
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>System Online</span>
        </div>
        <div className="mt-1 text-[9px] text-slate-600">v2.1.4 | 2027 General Election</div>
      </div>
    </div>
  );
}
