'use client';

import {
  Activity,
  Server,
  Database,
  HardDrive,
  Cpu,
  MemoryStick,
  Wifi,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// Mock system health data
const services = [
  { name: 'Core BRS API', status: 'operational', uptime: 99.99, responseTime: 45, lastCheck: new Date() },
  { name: 'Biometric Engine', status: 'operational', uptime: 99.95, responseTime: 120, lastCheck: new Date() },
  { name: 'Deduplication Service', status: 'operational', uptime: 99.92, responseTime: 850, lastCheck: new Date() },
  { name: 'Sync Gateway', status: 'operational', uptime: 99.88, responseTime: 65, lastCheck: new Date() },
  { name: 'Database Primary', status: 'operational', uptime: 99.99, responseTime: 12, lastCheck: new Date() },
  { name: 'Database Replica', status: 'operational', uptime: 99.99, responseTime: 15, lastCheck: new Date() },
  { name: 'File Storage', status: 'degraded', uptime: 98.5, responseTime: 350, lastCheck: new Date() },
  { name: 'Audit Logger', status: 'operational', uptime: 99.99, responseTime: 8, lastCheck: new Date() },
];

const serverMetrics = {
  cpu: { usage: 45, cores: 32 },
  memory: { used: 78, total: 256 },
  disk: { used: 2.4, total: 10 },
  network: { in: 125, out: 89 },
};

const recentIncidents = [
  {
    id: 'INC-001',
    title: 'File Storage Latency',
    status: 'investigating',
    severity: 'warning',
    startedAt: new Date('2026-01-25T09:30:00'),
    description: 'Increased latency on file storage operations',
  },
  {
    id: 'INC-002',
    title: 'Dedup Queue Backlog',
    status: 'resolved',
    severity: 'minor',
    startedAt: new Date('2026-01-24T14:00:00'),
    resolvedAt: new Date('2026-01-24T15:30:00'),
    description: 'Temporary backlog in deduplication queue',
  },
];

function getStatusIcon(status: string) {
  switch (status) {
    case 'operational':
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case 'degraded':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'down':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Activity className="h-4 w-4 text-slate-400" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'operational':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Operational</Badge>;
    case 'degraded':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Degraded</Badge>;
    case 'down':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Down</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case 'critical':
      return <Badge className="bg-red-600 text-white hover:bg-red-600">Critical</Badge>;
    case 'warning':
      return <Badge className="bg-amber-500 text-white hover:bg-amber-500">Warning</Badge>;
    case 'minor':
      return <Badge className="bg-blue-500 text-white hover:bg-blue-500">Minor</Badge>;
    default:
      return <Badge variant="outline">{severity}</Badge>;
  }
}

function getIncidentStatusBadge(status: string) {
  switch (status) {
    case 'investigating':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Investigating</Badge>;
    case 'identified':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Identified</Badge>;
    case 'monitoring':
      return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Monitoring</Badge>;
    case 'resolved':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Resolved</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function SystemHealthPage() {
  const operationalCount = services.filter(s => s.status === 'operational').length;
  const degradedCount = services.filter(s => s.status === 'degraded').length;
  const downCount = services.filter(s => s.status === 'down').length;

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">System Health</h2>
          <p className="text-sm text-slate-500">
            Monitor system performance and service status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            All Systems Operational
          </Badge>
          <Button variant="outline" size="sm" className="gap-1.5">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">System Status</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">Healthy</p>
              </div>
              <div className="rounded-lg bg-emerald-100 p-2">
                <Shield className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Operational</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{operationalCount}/{services.length}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Degraded</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{degradedCount}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Down</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{downCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Server Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">CPU Usage</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{serverMetrics.cpu.usage}%</p>
            <Progress value={serverMetrics.cpu.usage} className="mt-2 h-2" />
            <p className="mt-1 text-xs text-slate-500">{serverMetrics.cpu.cores} cores</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MemoryStick className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Memory</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{serverMetrics.memory.used}GB</p>
            <Progress value={(serverMetrics.memory.used / serverMetrics.memory.total) * 100} className="mt-2 h-2" />
            <p className="mt-1 text-xs text-slate-500">of {serverMetrics.memory.total}GB</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Storage</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{serverMetrics.disk.used}TB</p>
            <Progress value={(serverMetrics.disk.used / serverMetrics.disk.total) * 100} className="mt-2 h-2" />
            <p className="mt-1 text-xs text-slate-500">of {serverMetrics.disk.total}TB</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Network</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{serverMetrics.network.in} Mbps</p>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>In: {serverMetrics.network.in} Mbps</span>
              <span>Out: {serverMetrics.network.out} Mbps</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Services Status */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Service Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {services.map((service) => (
              <div
                key={service.name}
                className={cn(
                  'flex items-center justify-between rounded-lg border p-3',
                  service.status === 'degraded' && 'border-amber-200 bg-amber-50',
                  service.status === 'down' && 'border-red-200 bg-red-50',
                  service.status === 'operational' && 'border-slate-200'
                )}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <p className="font-medium text-slate-900">{service.name}</p>
                    <p className="text-xs text-slate-500">
                      Uptime: {service.uptime}% | Response: {service.responseTime}ms
                    </p>
                  </div>
                </div>
                {getStatusBadge(service.status)}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Recent Incidents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentIncidents.map((incident) => (
              <div key={incident.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{incident.title}</p>
                      {getSeverityBadge(incident.severity)}
                    </div>
                    <p className="font-mono text-xs text-slate-500">{incident.id}</p>
                  </div>
                  {getIncidentStatusBadge(incident.status)}
                </div>
                <p className="mt-2 text-sm text-slate-600">{incident.description}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Started: {incident.startedAt.toLocaleString()}
                  </div>
                  {incident.resolvedAt && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Resolved: {incident.resolvedAt.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {recentIncidents.length === 0 && (
              <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                No recent incidents
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
