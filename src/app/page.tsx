'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Tablet,
  RefreshCw,
  AlertTriangle,
  Fingerprint,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  getSystemStats,
  getProvinceStats,
  getDevices,
  getDedupMatches,
  getExceptions,
  getRecentActivity,
  type SystemStats,
  type Device,
  type DedupMatch,
  type Exception,
} from '@/lib/data-service';

// Stat card component
function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  variant = 'default',
  loading = false,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  loading?: boolean;
}) {
  const iconBgColors = {
    default: 'bg-slate-100 text-slate-600',
    success: 'bg-emerald-100 text-emerald-600',
    warning: 'bg-amber-100 text-amber-600',
    error: 'bg-red-100 text-red-600',
  };

  return (
    <Card className="border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
            {loading ? (
              <Loader2 className="mt-2 h-6 w-6 animate-spin text-slate-400" />
            ) : (
              <>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </p>
                {trendLabel && (
                  <div className="mt-1 flex items-center gap-1 text-xs">
                    {trend === 'up' && <ArrowUpRight className="h-3 w-3 text-emerald-500" />}
                    {trend === 'down' && <ArrowDownRight className="h-3 w-3 text-red-500" />}
                    <span className={cn(
                      trend === 'up' && 'text-emerald-600',
                      trend === 'down' && 'text-red-600',
                      trend === 'neutral' && 'text-slate-500'
                    )}>
                      {trendLabel}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
          <div className={cn('rounded-lg p-2', iconBgColors[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Device status component
function DeviceStatusPanel({ devices, stats, loading }: { devices: Device[]; stats: SystemStats; loading: boolean }) {
  const onlineCount = devices.filter(d => d.status === 'online').length;
  const offlineCount = devices.filter(d => d.status === 'offline').length;
  const degradedCount = devices.filter(d => d.status === 'degraded').length;
  const total = devices.length || 1;

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-semibold">
          <span>Device Status</span>
          <Badge variant="outline" className="text-xs">Live</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-sm text-slate-600">Online</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">{onlineCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-sm text-slate-600">Offline</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">{offlineCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-sm text-slate-600">Degraded</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">{degradedCount}</span>
            </div>
            <div className="pt-2">
              <Progress value={(onlineCount / total) * 100} className="h-2" />
              <p className="mt-1 text-xs text-slate-500">
                {((onlineCount / total) * 100).toFixed(1)}% operational
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Recent activity panel
function RecentActivityPanel({ activity, loading }: { activity: { time: string; action: string; location: string; count: number }[]; loading: boolean }) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-semibold">
          <span>Recent Activity</span>
          <Button variant="link" size="sm" className="h-auto p-0 text-xs text-emerald-600">
            View All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : activity.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {activity.slice(0, 6).map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <span className="shrink-0 text-xs text-slate-400">{item.time}</span>
                <div className="flex-1">
                  <p className="text-sm text-slate-700">{item.action}</p>
                  <p className="text-xs text-slate-500">
                    {item.location} {item.count > 1 && `(${item.count.toLocaleString()} records)`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Province stats panel
function ProvinceStatsPanel({ provinceStats, loading }: { provinceStats: { province: string; code: string; registered: number; target: number; syncRate: number }[]; loading: boolean }) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-semibold">
          <span>Registration by Province</span>
          <Button variant="link" size="sm" className="h-auto p-0 text-xs text-emerald-600">
            View All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : provinceStats.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">No province data available</p>
        ) : (
          <div className="space-y-3">
            {provinceStats.slice(0, 6).map((prov, index) => {
              const percentage = prov.target > 0 ? (prov.registered / prov.target) * 100 : 0;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{prov.province}</span>
                    <span className="font-medium text-slate-900">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Progress value={percentage} className="h-1.5 flex-1" />
                    <span className="shrink-0 text-xs text-slate-500">
                      {prov.registered} registered
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Dedup queue panel
function DedupQueuePanel({ matches, stats, loading }: { matches: DedupMatch[]; stats: SystemStats; loading: boolean }) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-semibold">
          <span>Deduplication Queue</span>
          <Badge className="bg-amber-500 text-white hover:bg-amber-500">{stats.pending_dedup}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : matches.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">No pending matches</p>
        ) : (
          <div className="space-y-3">
            {matches.slice(0, 3).map((match) => (
              <div key={match.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Fingerprint className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-900">
                        {match.match_score}% Match
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {match.match_type} biometric match
                    </p>
                  </div>
                  <Badge className={cn(
                    'text-xs',
                    match.status === 'pending_review' && 'bg-amber-100 text-amber-700 hover:bg-amber-100',
                    match.status === 'confirmed_match' && 'bg-red-100 text-red-700 hover:bg-red-100',
                    match.status === 'false_positive' && 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                  )}>
                    {match.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
        <Button variant="outline" size="sm" className="mt-3 w-full text-xs">
          View All Pending Reviews
        </Button>
      </CardContent>
    </Card>
  );
}

// Exceptions panel
function ExceptionsPanel({ exceptions, stats, loading }: { exceptions: Exception[]; stats: SystemStats; loading: boolean }) {
  const exceptionsByType = {
    missing_fingerprint: exceptions.filter(e => e.exception_type === 'missing_fingerprint').length,
    worn_fingerprint: exceptions.filter(e => e.exception_type === 'worn_fingerprint').length,
    disability_accommodation: exceptions.filter(e => e.exception_type === 'disability_accommodation').length,
    other: exceptions.filter(e => !['missing_fingerprint', 'worn_fingerprint', 'disability_accommodation'].includes(e.exception_type)).length,
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-semibold">
          <span>Open Exceptions</span>
          <Badge className="bg-red-600 text-white hover:bg-red-600">{stats.exceptions_open}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Missing Fingerprint</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{exceptionsByType.missing_fingerprint}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Worn Fingerprint</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{exceptionsByType.worn_fingerprint}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Disability Accom.</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{exceptionsByType.disability_accommodation}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Other</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{exceptionsByType.other}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="mt-3 w-full text-xs">
              Review Exceptions
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Sync status panel
function SyncStatusPanel({ stats, loading }: { stats: SystemStats; loading: boolean }) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-semibold">
          <span>Sync Status</span>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-500">Live</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Sync Completion</span>
                <span className="font-semibold text-emerald-600">{stats.sync_completion_rate.toFixed(1)}%</span>
              </div>
              <Progress value={stats.sync_completion_rate} className="mt-2 h-2" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg bg-slate-50 p-3">
                <RefreshCw className="mx-auto h-4 w-4 text-amber-500" />
                <p className="mt-1 text-lg font-semibold text-slate-900">{stats.pending_sync.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Pending</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <CheckCircle className="mx-auto h-4 w-4 text-emerald-500" />
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {(stats.total_registrations - stats.pending_sync).toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">Synced</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState<string>('--:--:--');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats>({
    total_registrations: 0,
    pending_sync: 0,
    pending_dedup: 0,
    active_devices: 0,
    offline_devices: 0,
    exceptions_open: 0,
    duplicates_detected: 0,
    sync_completion_rate: 0,
  });
  const [provinceStats, setProvinceStats] = useState<{ province: string; code: string; registered: number; target: number; syncRate: number }[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [matches, setMatches] = useState<DedupMatch[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [activity, setActivity] = useState<{ time: string; action: string; location: string; count: number }[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, provinceData, devicesData, matchesData, exceptionsData, activityData] = await Promise.all([
        getSystemStats(),
        getProvinceStats(),
        getDevices(),
        getDedupMatches({ limit: 10, status: 'pending_review' }),
        getExceptions({ limit: 50 }),
        getRecentActivity(10),
      ]);

      setStats(statsData);
      setProvinceStats(provinceData);
      setDevices(devicesData);
      setMatches(matchesData);
      setExceptions(exceptionsData);
      setActivity(activityData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header with date */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Command Center</h2>
          <p className="text-sm text-slate-500">
            2027 National General Election | Biometric Registration Overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <Clock className="h-3 w-3" />
            Last updated: {currentTime}
          </Badge>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Registrations"
          value={stats.total_registrations}
          icon={Users}
          trend="up"
          trendLabel="From database"
          variant="success"
          loading={loading}
        />
        <StatCard
          title="Active Devices"
          value={stats.active_devices}
          icon={Tablet}
          trend="down"
          trendLabel={`${stats.offline_devices} offline`}
          variant="default"
          loading={loading}
        />
        <StatCard
          title="Pending Dedup"
          value={stats.pending_dedup}
          icon={Fingerprint}
          trend="neutral"
          trendLabel="Requires review"
          variant="warning"
          loading={loading}
        />
        <StatCard
          title="Open Exceptions"
          value={stats.exceptions_open}
          icon={AlertTriangle}
          trend="up"
          trendLabel="Needs attention"
          variant="error"
          loading={loading}
        />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Tabs for different views */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-slate-100">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="provinces" className="text-xs">Provincial</TabsTrigger>
              <TabsTrigger value="dedup" className="text-xs">Deduplication</TabsTrigger>
              <TabsTrigger value="sync" className="text-xs">Sync Status</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <ProvinceStatsPanel provinceStats={provinceStats} loading={loading} />
                <DeviceStatusPanel devices={devices} stats={stats} loading={loading} />
              </div>
            </TabsContent>
            <TabsContent value="provinces" className="mt-4">
              <Card className="border-slate-200">
                <CardContent className="p-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                  ) : provinceStats.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500">No province data available</p>
                  ) : (
                    <div className="space-y-3">
                      {provinceStats.map((prov, index) => {
                        const percentage = prov.target > 0 ? (prov.registered / prov.target) * 100 : 0;
                        return (
                          <div key={index} className="flex items-center gap-4">
                            <div className="w-40 shrink-0">
                              <span className="text-sm font-medium text-slate-700">{prov.province}</span>
                            </div>
                            <div className="flex-1">
                              <Progress value={percentage} className="h-2" />
                            </div>
                            <div className="w-20 text-right">
                              <span className="text-sm font-semibold text-slate-900">{percentage.toFixed(1)}%</span>
                            </div>
                            <div className="w-24 text-right">
                              <span className="text-xs text-slate-500">{prov.registered.toLocaleString()}</span>
                            </div>
                            <Badge className={cn(
                              'w-16 justify-center text-xs',
                              prov.syncRate >= 95 && 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
                              prov.syncRate >= 90 && prov.syncRate < 95 && 'bg-amber-100 text-amber-700 hover:bg-amber-100',
                              prov.syncRate < 90 && 'bg-red-100 text-red-700 hover:bg-red-100'
                            )}>
                              {prov.syncRate.toFixed(0)}%
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="dedup" className="mt-4">
              <DedupQueuePanel matches={matches} stats={stats} loading={loading} />
            </TabsContent>
            <TabsContent value="sync" className="mt-4">
              <SyncStatusPanel stats={stats} loading={loading} />
            </TabsContent>
          </Tabs>

          {/* Recent Activity */}
          <RecentActivityPanel activity={activity} loading={loading} />
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <SyncStatusPanel stats={stats} loading={loading} />
          <ExceptionsPanel exceptions={exceptions} stats={stats} loading={loading} />
          <DedupQueuePanel matches={matches} stats={stats} loading={loading} />
        </div>
      </div>
    </div>
  );
}
