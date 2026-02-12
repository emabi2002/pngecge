'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  WifiOff,
  TrendingUp,
  TrendingDown,
  Clock,
  Thermometer,
  Cpu,
  HardDrive,
  Zap,
  RefreshCw,
  Bell,
  BellOff,
  Settings,
  Download,
  Filter,
  Search,
  Eye,
  Wrench,
  Loader2,
  Radio,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  type HealthStatus,
  type DeviceHealthMetrics,
  type HealthAlert,
  getDeviceHealthMetrics,
  getHealthAlerts,
  getHealthSummary,
} from '@/lib/device-service';
import { useDeviceRealtime } from '@/hooks/use-device-realtime';

const HEALTH_CONFIG: Record<HealthStatus, { label: string; color: string; bgColor: string }> = {
  OK: { label: 'Healthy', color: 'text-green-600', bgColor: 'bg-green-100' },
  WARN: { label: 'Warning', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  FAIL: { label: 'Failed', color: 'text-red-600', bgColor: 'bg-red-100' },
  UNKNOWN: { label: 'Unknown', color: 'text-slate-500', bgColor: 'bg-slate-100' },
  OFFLINE: { label: 'Offline', color: 'text-slate-700', bgColor: 'bg-slate-200' },
};

const ALERT_CONFIG = {
  CRITICAL: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  WARNING: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle },
  INFO: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Activity },
};

export function DeviceHealthDashboard() {
  const { toast } = useToast();

  // Data state
  const [metrics, setMetrics] = useState<DeviceHealthMetrics[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());

  // Loading state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter state
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Fetch data from Supabase
  const fetchData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      }

      const [metricsData, alertsData] = await Promise.all([
        getDeviceHealthMetrics(),
        getHealthAlerts(),
      ]);

      setMetrics(metricsData);
      setAlerts(alertsData);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching health data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load health data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time subscription for device updates
  const { isConnected: realtimeConnected } = useDeviceRealtime({
    onUpdate: (device) => {
      // Update metrics if this device is in the list
      setMetrics((prev) =>
        prev.map((m) => {
          if (m.device_uid === device.device_uid) {
            return {
              ...m,
              health_status: device.last_health_status,
              last_seen: device.last_seen_at || m.last_seen,
            };
          }
          return m;
        })
      );
    },
    enabled: true,
  });

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  // Summary stats
  const stats = useMemo(() => {
    const total = metrics.length;
    const healthy = metrics.filter((m) => m.health_status === 'OK').length;
    const warning = metrics.filter((m) => m.health_status === 'WARN').length;
    const failing = metrics.filter((m) => m.health_status === 'FAIL').length;
    const offline = metrics.filter((m) => m.health_status === 'OFFLINE').length;

    const avgSuccessRate = total > 0
      ? metrics.reduce((acc, m) => acc + m.capture_success_rate, 0) / total
      : 0;
    const totalCapturesToday = metrics.reduce((acc, m) => acc + m.total_captures_today, 0);
    const totalErrorsToday = metrics.reduce((acc, m) => acc + m.errors_today, 0);

    return { total, healthy, warning, failing, offline, avgSuccessRate, totalCapturesToday, totalErrorsToday };
  }, [metrics]);

  const filteredMetrics = useMemo(() => {
    if (healthFilter === 'all') return metrics;
    return metrics.filter((m) => m.health_status === healthFilter);
  }, [metrics, healthFilter]);

  const activeAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const isAcknowledged = acknowledgedAlerts.has(a.alert_id) || a.acknowledged;
      return showAcknowledged || !isAcknowledged;
    });
  }, [alerts, showAcknowledged, acknowledgedAlerts]);

  const criticalAlerts = alerts.filter(
    (a) => a.alert_type === 'CRITICAL' && !acknowledgedAlerts.has(a.alert_id) && !a.acknowledged
  ).length;

  const handleAcknowledgeAlert = (alertId: string) => {
    setAcknowledgedAlerts((prev) => new Set([...prev, alertId]));
    toast({ title: 'Alert Acknowledged' });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getMetricColor = (value: number, thresholds: { good: number; warn: number }) => {
    if (value >= thresholds.good) return 'text-green-600';
    if (value >= thresholds.warn) return 'text-amber-600';
    return 'text-red-600';
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-slate-200 rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <span className="ml-2 text-slate-500">Loading health dashboard...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with alerts banner */}
      {criticalAlerts > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-red-800">{criticalAlerts} Critical Alert{criticalAlerts > 1 ? 's' : ''}</p>
                <p className="text-sm text-red-600">Immediate attention required</p>
              </div>
            </div>
            <Button variant="destructive" size="sm">
              View Alerts
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Fleet Health</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.total > 0 ? ((stats.healthy / stats.total) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-xs text-slate-400">
                  {stats.healthy} of {stats.total} devices healthy
                </p>
              </div>
              <div className="h-16 w-16 relative">
                <svg className="transform -rotate-90 w-16 h-16">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-slate-200"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={175.93}
                    strokeDashoffset={stats.total > 0 ? 175.93 * (1 - stats.healthy / stats.total) : 175.93}
                    className="text-green-500"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Avg Success Rate</p>
                <p className={`text-2xl font-bold ${getMetricColor(stats.avgSuccessRate, { good: 95, warn: 85 })}`}>
                  {stats.avgSuccessRate.toFixed(1)}%
                </p>
              </div>
              {stats.avgSuccessRate >= 95 ? (
                <TrendingUp className="h-8 w-8 text-green-400" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-400" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Captures Today</p>
                <p className="text-2xl font-bold">{stats.totalCapturesToday.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className={stats.totalErrorsToday > 10 ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Errors Today</p>
                <p className={`text-2xl font-bold ${stats.totalErrorsToday > 10 ? 'text-red-600' : ''}`}>
                  {stats.totalErrorsToday}
                </p>
              </div>
              <XCircle className={`h-8 w-8 ${stats.totalErrorsToday > 10 ? 'text-red-400' : 'text-slate-400'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <div className="grid gap-4 md:grid-cols-5">
        {(['OK', 'WARN', 'FAIL', 'OFFLINE', 'UNKNOWN'] as HealthStatus[]).map((status) => {
          const count = metrics.filter((m) => m.health_status === status).length;
          const config = HEALTH_CONFIG[status];
          return (
            <Card
              key={status}
              className={`cursor-pointer transition-all ${healthFilter === status ? 'ring-2 ring-emerald-500' : 'hover:border-slate-300'}`}
              onClick={() => setHealthFilter(healthFilter === status ? 'all' : status)}
            >
              <CardContent className="p-3 text-center">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${config.bgColor} mb-2`}>
                  <span className={`text-lg font-bold ${config.color}`}>{count}</span>
                </div>
                <p className="text-sm font-medium text-slate-700">{config.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="devices">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="devices" className="gap-1">
              <HardDrive className="h-4 w-4" />
              Device Health
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-1">
              <Bell className="h-4 w-4" />
              Alerts
              {criticalAlerts > 0 && (
                <Badge className="ml-1 bg-red-500 text-white h-5 min-w-[20px]">{criticalAlerts}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-4">
            {/* Real-time indicator */}
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
              realtimeConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}>
              <Radio className={`h-3 w-3 ${realtimeConnected ? 'animate-pulse' : ''}`} />
              <span>{realtimeConnected ? 'Live' : 'Connecting...'}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="h-4 w-4" />
              Last updated: {formatRelativeTime(lastRefresh.toISOString())}
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
              <Label htmlFor="auto-refresh" className="text-sm">Auto-refresh</Label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Devices Tab */}
        <TabsContent value="devices">
          <Card>
            <CardContent className="p-0">
              {filteredMetrics.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <HardDrive className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-lg font-medium">No deployed devices</p>
                  <p className="text-sm">Deploy devices to see their health metrics here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Device</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Success Rate</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Captures</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Sensor</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Temp</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Memory</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Last Seen</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredMetrics.map((device) => {
                        const config = HEALTH_CONFIG[device.health_status];
                        return (
                          <tr key={device.device_uid} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium">{device.asset_tag || device.vendor_serial}</p>
                                <p className="text-xs text-slate-500">{device.model}</p>
                                <p className="text-xs text-slate-400">{device.province}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={`${config.bgColor} ${config.color}`}>
                                {config.label}
                              </Badge>
                              {device.trend === 'degrading' && (
                                <TrendingDown className="inline ml-1 h-4 w-4 text-red-500" />
                              )}
                              {device.trend === 'improving' && (
                                <TrendingUp className="inline ml-1 h-4 w-4 text-green-500" />
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16">
                                  <Progress
                                    value={device.capture_success_rate}
                                    className="h-2"
                                  />
                                </div>
                                <span className={`text-sm font-medium ${getMetricColor(device.capture_success_rate, { good: 95, warn: 85 })}`}>
                                  {device.capture_success_rate.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-medium">{device.total_captures_today}</span>
                              {device.errors_today > 0 && (
                                <span className="text-red-500 text-sm ml-1">({device.errors_today} err)</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {device.sensor_quality ? (
                                <div className="flex items-center gap-1">
                                  <Zap className={`h-4 w-4 ${device.sensor_quality >= 80 ? 'text-green-500' : device.sensor_quality >= 60 ? 'text-amber-500' : 'text-red-500'}`} />
                                  <span className="text-sm">{device.sensor_quality}%</span>
                                </div>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {device.temperature_c ? (
                                <div className="flex items-center gap-1">
                                  <Thermometer className={`h-4 w-4 ${device.temperature_c < 40 ? 'text-green-500' : device.temperature_c < 50 ? 'text-amber-500' : 'text-red-500'}`} />
                                  <span className="text-sm">{device.temperature_c}°C</span>
                                </div>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {device.memory_usage_percent ? (
                                <div className="flex items-center gap-1">
                                  <Cpu className={`h-4 w-4 ${device.memory_usage_percent < 70 ? 'text-green-500' : device.memory_usage_percent < 85 ? 'text-amber-500' : 'text-red-500'}`} />
                                  <span className="text-sm">{device.memory_usage_percent}%</span>
                                </div>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-slate-600">{formatRelativeTime(device.last_seen)}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Wrench className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Health Alerts</CardTitle>
                <div className="flex items-center gap-2">
                  <Switch
                    id="show-ack"
                    checked={showAcknowledged}
                    onCheckedChange={setShowAcknowledged}
                  />
                  <Label htmlFor="show-ack" className="text-sm">Show acknowledged</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeAlerts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <BellOff className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                    <p>No active alerts</p>
                    <p className="text-sm text-slate-400">All devices are operating normally</p>
                  </div>
                ) : (
                  activeAlerts.map((alert) => {
                    const config = ALERT_CONFIG[alert.alert_type];
                    const Icon = config.icon;
                    const isAcknowledged = acknowledgedAlerts.has(alert.alert_id) || alert.acknowledged;
                    return (
                      <div
                        key={alert.alert_id}
                        className={`p-4 rounded-lg border ${config.color} ${isAcknowledged ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <Icon className="h-5 w-5 mt-0.5" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{alert.device_name}</span>
                                <span className="text-xs text-slate-500">{formatRelativeTime(alert.created_at)}</span>
                              </div>
                              <p className="text-sm mt-1">{alert.message}</p>
                              {alert.metric && (
                                <p className="text-xs mt-1 opacity-75">
                                  {alert.metric}: {alert.value} (threshold: {alert.threshold})
                                </p>
                              )}
                              {isAcknowledged && (
                                <p className="text-xs mt-2 italic">
                                  Acknowledged {alert.acknowledged_by ? `by ${alert.acknowledged_by}` : ''}
                                  {alert.acknowledged_at && ` ${formatRelativeTime(alert.acknowledged_at)}`}
                                </p>
                              )}
                            </div>
                          </div>
                          {!isAcknowledged && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAcknowledgeAlert(alert.alert_id)}
                            >
                              Acknowledge
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
