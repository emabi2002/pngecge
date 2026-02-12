'use client';

import { useState } from 'react';
import {
  Plug,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Settings,
  Key,
  Globe,
  Database,
  Clock,
  ArrowRight,
  ArrowLeftRight,
  Activity,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// Integration endpoints
const integrations = [
  {
    id: 'evs-api',
    name: 'Electoral Verification System (EVS)',
    description: 'Real-time voter eligibility verification and roll lookup',
    endpoint: 'https://evs.pngec.gov.pg/api/v2',
    status: 'connected',
    lastSync: new Date('2026-01-25T10:30:00'),
    uptime: 99.95,
    latency: 145,
    requestsToday: 45231,
    errorRate: 0.02,
    version: 'v2.1.0',
    authMethod: 'OAuth 2.0 + mTLS',
  },
  {
    id: 'ecs-api',
    name: 'Electoral Counting System (ECS)',
    description: 'Voter roll export and polling place data synchronization',
    endpoint: 'https://ecs.pngec.gov.pg/api/v1',
    status: 'connected',
    lastSync: new Date('2026-01-25T06:00:00'),
    uptime: 99.88,
    latency: 234,
    requestsToday: 12847,
    errorRate: 0.05,
    version: 'v1.8.2',
    authMethod: 'API Key + IP Whitelist',
  },
  {
    id: 'nid-api',
    name: 'National ID Registry',
    description: 'Identity verification against national ID database',
    endpoint: 'https://nid.gov.pg/verify/api',
    status: 'degraded',
    lastSync: new Date('2026-01-25T09:45:00'),
    uptime: 97.5,
    latency: 890,
    requestsToday: 8934,
    errorRate: 2.3,
    version: 'v3.0.1',
    authMethod: 'SAML 2.0',
    issue: 'High latency detected - investigating',
  },
  {
    id: 'biometric-engine',
    name: 'ABIS Biometric Engine',
    description: 'Automated Biometric Identification System for deduplication',
    endpoint: 'https://abis.pngec.gov.pg/api',
    status: 'connected',
    lastSync: new Date('2026-01-25T10:45:00'),
    uptime: 99.99,
    latency: 1250,
    requestsToday: 3421,
    errorRate: 0.01,
    version: 'v4.2.0',
    authMethod: 'mTLS + JWT',
  },
  {
    id: 'sms-gateway',
    name: 'SMS Notification Gateway',
    description: 'Voter registration confirmation SMS delivery',
    endpoint: 'https://sms.digicel.pg/api',
    status: 'connected',
    lastSync: new Date('2026-01-25T10:50:00'),
    uptime: 99.2,
    latency: 320,
    requestsToday: 15678,
    errorRate: 0.8,
    version: 'v2.0.0',
    authMethod: 'API Key',
  },
  {
    id: 'audit-archive',
    name: 'Audit Archive System',
    description: 'Long-term audit log archival and retrieval',
    endpoint: 'https://archive.pngec.gov.pg/api',
    status: 'maintenance',
    lastSync: new Date('2026-01-24T23:00:00'),
    uptime: 98.5,
    latency: 0,
    requestsToday: 0,
    errorRate: 0,
    version: 'v1.5.0',
    authMethod: 'Service Account',
    issue: 'Scheduled maintenance until 12:00',
  },
];

// API Logs
const recentApiCalls = [
  { id: 1, endpoint: 'EVS', method: 'POST', path: '/verify', status: 200, latency: 142, time: '10:51:23' },
  { id: 2, endpoint: 'ABIS', method: 'POST', path: '/dedup/match', status: 200, latency: 1180, time: '10:51:20' },
  { id: 3, endpoint: 'NID', method: 'GET', path: '/lookup', status: 504, latency: 5000, time: '10:51:15' },
  { id: 4, endpoint: 'SMS', method: 'POST', path: '/send', status: 200, latency: 298, time: '10:51:12' },
  { id: 5, endpoint: 'ECS', method: 'PUT', path: '/sync/batch', status: 200, latency: 456, time: '10:51:08' },
];

function getStatusBadge(status: string) {
  switch (status) {
    case 'connected':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Connected</Badge>;
    case 'degraded':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Degraded</Badge>;
    case 'disconnected':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Disconnected</Badge>;
    case 'maintenance':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Maintenance</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'connected':
      return <CheckCircle className="h-5 w-5 text-emerald-500" />;
    case 'degraded':
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    case 'disconnected':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'maintenance':
      return <Settings className="h-5 w-5 text-blue-500" />;
    default:
      return <Plug className="h-5 w-5 text-slate-400" />;
  }
}

export default function IntegrationsPage() {
  const connectedCount = integrations.filter((i) => i.status === 'connected').length;
  const degradedCount = integrations.filter((i) => i.status === 'degraded').length;
  const maintenanceCount = integrations.filter((i) => i.status === 'maintenance').length;

  const totalRequests = integrations.reduce((sum, i) => sum + i.requestsToday, 0);
  const avgLatency = Math.round(
    integrations.filter((i) => i.status !== 'maintenance').reduce((sum, i) => sum + i.latency, 0) /
      integrations.filter((i) => i.status !== 'maintenance').length
  );

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">System Integrations</h2>
          <p className="text-sm text-slate-500">
            Manage EVS, ECS, and external API connections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <RefreshCw className="h-4 w-4" />
            Test All Connections
          </Button>
          <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
            <Plug className="h-4 w-4" />
            Add Integration
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total APIs</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{integrations.length}</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-2">
                <Plug className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Connected</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{connectedCount}</p>
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
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Requests Today</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{totalRequests.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Avg Latency</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{avgLatency}ms</p>
          </CardContent>
        </Card>
      </div>

      {/* Integration Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <Card
            key={integration.id}
            className={cn(
              'border-slate-200',
              integration.status === 'degraded' && 'border-amber-200',
              integration.status === 'disconnected' && 'border-red-200',
              integration.status === 'maintenance' && 'border-blue-200'
            )}
          >
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'rounded-lg p-2',
                      integration.status === 'connected' && 'bg-emerald-100',
                      integration.status === 'degraded' && 'bg-amber-100',
                      integration.status === 'disconnected' && 'bg-red-100',
                      integration.status === 'maintenance' && 'bg-blue-100'
                    )}
                  >
                    {getStatusIcon(integration.status)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{integration.name}</h3>
                    <p className="text-xs text-slate-500">{integration.description}</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="mt-3 flex items-center gap-2">
                {getStatusBadge(integration.status)}
                <Badge variant="outline" className="text-xs">{integration.version}</Badge>
              </div>

              {/* Issue Banner */}
              {integration.issue && (
                <div className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-700">
                  <AlertTriangle className="mr-1 inline h-3 w-3" />
                  {integration.issue}
                </div>
              )}

              {/* Metrics */}
              {integration.status !== 'maintenance' && (
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Uptime</p>
                    <p className="font-semibold text-slate-900">{integration.uptime}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Latency</p>
                    <p className={cn(
                      'font-semibold',
                      integration.latency < 500 ? 'text-emerald-600' : 'text-amber-600'
                    )}>
                      {integration.latency}ms
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Requests</p>
                    <p className="font-semibold text-slate-900">{integration.requestsToday.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Error Rate</p>
                    <p className={cn(
                      'font-semibold',
                      integration.errorRate < 1 ? 'text-emerald-600' : 'text-red-600'
                    )}>
                      {integration.errorRate}%
                    </p>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Shield className="h-3 w-3" />
                  {integration.authMethod}
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  <Settings className="mr-1 h-3 w-3" />
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent API Activity */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-semibold">
            <span>Recent API Activity</span>
            <Badge variant="outline" className="gap-1.5">
              <Activity className="h-3 w-3" />
              Live
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Endpoint</th>
                <th>Method</th>
                <th>Path</th>
                <th>Status</th>
                <th>Latency</th>
              </tr>
            </thead>
            <tbody>
              {recentApiCalls.map((call) => (
                <tr key={call.id}>
                  <td className="font-mono text-xs text-slate-500">{call.time}</td>
                  <td className="font-medium text-slate-900">{call.endpoint}</td>
                  <td>
                    <Badge variant="outline" className="font-mono text-xs">{call.method}</Badge>
                  </td>
                  <td className="font-mono text-xs text-slate-600">{call.path}</td>
                  <td>
                    <Badge
                      className={cn(
                        'text-xs',
                        call.status < 300 && 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
                        call.status >= 300 && call.status < 500 && 'bg-amber-100 text-amber-700 hover:bg-amber-100',
                        call.status >= 500 && 'bg-red-100 text-red-700 hover:bg-red-100'
                      )}
                    >
                      {call.status}
                    </Badge>
                  </td>
                  <td className={cn(
                    'text-sm font-medium',
                    call.latency < 500 ? 'text-emerald-600' : call.latency < 2000 ? 'text-amber-600' : 'text-red-600'
                  )}>
                    {call.latency}ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
