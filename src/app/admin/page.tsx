'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Shield,
  Key,
  MapPin,
  Settings,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserPlus,
  ShieldCheck,
  Lock,
  FileText,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface AdminStats {
  total_users: number;
  active_users: number;
  pending_approvals: number;
  active_sessions: number;
  roles_count: number;
  recent_security_events: number;
}

interface RecentActivity {
  id: string;
  action: string;
  user: string;
  time: string;
  severity: 'info' | 'warning' | 'critical';
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({
    total_users: 0,
    active_users: 0,
    pending_approvals: 0,
    active_sessions: 0,
    roles_count: 0,
    recent_security_events: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated data - replace with actual API calls
    setStats({
      total_users: 1247,
      active_users: 1089,
      pending_approvals: 23,
      active_sessions: 456,
      roles_count: 9,
      recent_security_events: 3,
    });

    setRecentActivity([
      { id: '1', action: 'User created', user: 'John Kewa', time: '5 minutes ago', severity: 'info' },
      { id: '2', action: 'Role permissions updated', user: 'Admin System', time: '12 minutes ago', severity: 'warning' },
      { id: '3', action: 'Failed login attempt', user: 'unknown@email.com', time: '25 minutes ago', severity: 'critical' },
      { id: '4', action: 'User approved', user: 'Mary Tani', time: '1 hour ago', severity: 'info' },
      { id: '5', action: 'Password policy changed', user: 'Super Admin', time: '2 hours ago', severity: 'warning' },
    ]);

    setLoading(false);
  }, []);

  const adminModules = [
    {
      title: 'User Management',
      description: 'Create, edit, and manage system users',
      icon: Users,
      href: '/admin/users',
      color: 'bg-blue-500',
      stats: `${stats.active_users} active users`,
    },
    {
      title: 'Role Management',
      description: 'Configure roles and access levels',
      icon: Shield,
      href: '/admin/roles',
      color: 'bg-orange-500',
      stats: `${stats.roles_count} roles defined`,
    },
    {
      title: 'Permission Matrix',
      description: 'Fine-grained permission control',
      icon: Key,
      href: '/admin/permissions',
      color: 'bg-purple-500',
      stats: '78 permissions',
    },
    {
      title: 'Geographic Units',
      description: 'Manage provinces, districts, and wards',
      icon: MapPin,
      href: '/admin/wards',
      color: 'bg-green-500',
      stats: '22 provinces, 89 districts',
    },
    {
      title: 'Security Settings',
      description: 'Password policies and security config',
      icon: Lock,
      href: '/admin/security',
      color: 'bg-red-500',
      stats: 'Last updated 2 days ago',
    },
    {
      title: 'Audit Logs',
      description: 'View detailed activity logs',
      icon: FileText,
      href: '/admin/audit',
      color: 'bg-slate-500',
      stats: '12,456 entries today',
    },
    {
      title: 'Active Sessions',
      description: 'Monitor and manage user sessions',
      icon: Activity,
      href: '/admin/sessions',
      color: 'bg-cyan-500',
      stats: `${stats.active_sessions} active now`,
    },
    {
      title: 'System Configuration',
      description: 'Global system settings',
      icon: Settings,
      href: '/admin/config',
      color: 'bg-amber-500',
      stats: '32 config options',
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'warning': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <Clock className="h-4 w-4 text-amber-500" />;
      default: return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Administration</h1>
          <p className="text-slate-500">Manage users, roles, permissions, and system configuration</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/audit">
              <FileText className="mr-2 h-4 w-4" />
              View Audit Logs
            </Link>
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
            <Link href="/admin/users/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Users</p>
                <p className="text-2xl font-bold">{stats.total_users.toLocaleString()}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600">+12% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Users</p>
                <p className="text-2xl font-bold">{stats.active_users.toLocaleString()}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <ShieldCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2">
              <Progress value={(stats.active_users / stats.total_users) * 100} className="h-2" />
              <p className="mt-1 text-xs text-slate-500">
                {((stats.active_users / stats.total_users) * 100).toFixed(1)}% of total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className={stats.pending_approvals > 0 ? 'border-amber-200 bg-amber-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending Approvals</p>
                <p className="text-2xl font-bold">{stats.pending_approvals}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${stats.pending_approvals > 0 ? 'bg-amber-100' : 'bg-slate-100'}`}>
                <Clock className={`h-6 w-6 ${stats.pending_approvals > 0 ? 'text-amber-600' : 'text-slate-600'}`} />
              </div>
            </div>
            {stats.pending_approvals > 0 && (
              <Button variant="link" className="mt-2 h-auto p-0 text-xs text-amber-600" asChild>
                <Link href="/admin/approvals">Review pending approvals</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className={stats.recent_security_events > 0 ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Security Events (24h)</p>
                <p className="text-2xl font-bold">{stats.recent_security_events}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${stats.recent_security_events > 0 ? 'bg-red-100' : 'bg-slate-100'}`}>
                <AlertTriangle className={`h-6 w-6 ${stats.recent_security_events > 0 ? 'text-red-600' : 'text-slate-600'}`} />
              </div>
            </div>
            {stats.recent_security_events > 0 && (
              <Button variant="link" className="mt-2 h-auto p-0 text-xs text-red-600" asChild>
                <Link href="/admin/security-events">View security events</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Admin Modules */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Administration Modules</CardTitle>
              <CardDescription>Quick access to all administrative functions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {adminModules.map((module) => (
                  <Link key={module.href} href={module.href}>
                    <div className="group flex items-start gap-4 rounded-lg border border-slate-200 p-4 transition-all hover:border-emerald-300 hover:bg-emerald-50">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${module.color}`}>
                        <module.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-900 group-hover:text-emerald-700">
                          {module.title}
                        </h3>
                        <p className="text-sm text-slate-500">{module.description}</p>
                        <p className="mt-1 text-xs text-slate-400">{module.stats}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest administrative actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className={`flex items-start gap-3 rounded-lg border p-3 ${getSeverityColor(activity.severity)}`}
                  >
                    {getSeverityIcon(activity.severity)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs opacity-75">by {activity.user}</p>
                      <p className="text-xs opacity-50">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="mt-4 w-full" asChild>
                <Link href="/admin/audit">View All Activity</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Role Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>User Distribution by Role</CardTitle>
          <CardDescription>Overview of users across different roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { role: 'Super Admin', count: 3, color: 'bg-red-500', percentage: 0.2 },
              { role: 'National Admin', count: 12, color: 'bg-orange-500', percentage: 1 },
              { role: 'Provincial Admin', count: 44, color: 'bg-amber-500', percentage: 3.5 },
              { role: 'District Admin', count: 178, color: 'bg-green-500', percentage: 14.3 },
              { role: 'Ward Supervisor', count: 356, color: 'bg-cyan-500', percentage: 28.5 },
              { role: 'Registration Officer', count: 598, color: 'bg-blue-500', percentage: 47.9 },
              { role: 'Data Entry', count: 45, color: 'bg-purple-500', percentage: 3.6 },
              { role: 'Auditor', count: 8, color: 'bg-pink-500', percentage: 0.6 },
              { role: 'Viewer', count: 3, color: 'bg-slate-500', percentage: 0.2 },
            ].map((item) => (
              <div key={item.role} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${item.color}`} />
                  <span className="text-sm font-medium text-slate-700">{item.role}</span>
                </div>
                <p className="mt-1 text-2xl font-bold text-slate-900">{item.count}</p>
                <p className="text-xs text-slate-500">{item.percentage}% of total</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
