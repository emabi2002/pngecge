'use client';

import { useState } from 'react';
import {
  Database,
  Download,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HardDrive,
  Cloud,
  Server,
  RefreshCw,
  Play,
  Pause,
  Calendar,
  Shield,
  FileArchive,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Backup jobs
const backupJobs = [
  {
    id: 'backup-full-daily',
    name: 'Full Database Backup',
    type: 'full',
    schedule: 'Daily at 02:00 UTC',
    lastRun: new Date('2026-01-25T02:00:00'),
    nextRun: new Date('2026-01-26T02:00:00'),
    status: 'completed',
    duration: '45 minutes',
    size: '128.5 GB',
    destination: 'Primary + Offsite',
    retention: '30 days',
  },
  {
    id: 'backup-incr-hourly',
    name: 'Incremental Backup',
    type: 'incremental',
    schedule: 'Hourly',
    lastRun: new Date('2026-01-25T10:00:00'),
    nextRun: new Date('2026-01-25T11:00:00'),
    status: 'completed',
    duration: '3 minutes',
    size: '2.1 GB',
    destination: 'Primary',
    retention: '7 days',
  },
  {
    id: 'backup-biometric',
    name: 'Biometric Templates',
    type: 'full',
    schedule: 'Weekly (Sunday 03:00)',
    lastRun: new Date('2026-01-19T03:00:00'),
    nextRun: new Date('2026-01-26T03:00:00'),
    status: 'completed',
    duration: '2 hours',
    size: '456.2 GB',
    destination: 'Secure Vault',
    retention: '1 year',
  },
  {
    id: 'backup-audit-logs',
    name: 'Audit Logs Archive',
    type: 'archive',
    schedule: 'Monthly (1st at 04:00)',
    lastRun: new Date('2026-01-01T04:00:00'),
    nextRun: new Date('2026-02-01T04:00:00'),
    status: 'completed',
    duration: '30 minutes',
    size: '89.7 GB',
    destination: 'Archive Storage',
    retention: '7 years',
  },
  {
    id: 'backup-config',
    name: 'Configuration Backup',
    type: 'incremental',
    schedule: 'Every 6 hours',
    lastRun: new Date('2026-01-25T06:00:00'),
    nextRun: new Date('2026-01-25T12:00:00'),
    status: 'running',
    progress: 67,
    destination: 'Primary',
    retention: '90 days',
  },
];

// Recent backup history
const backupHistory = [
  { id: 'bh-001', name: 'Full Database Backup', timestamp: new Date('2026-01-25T02:00:00'), status: 'success', size: '128.5 GB', duration: '45m' },
  { id: 'bh-002', name: 'Incremental Backup', timestamp: new Date('2026-01-25T10:00:00'), status: 'success', size: '2.1 GB', duration: '3m' },
  { id: 'bh-003', name: 'Incremental Backup', timestamp: new Date('2026-01-25T09:00:00'), status: 'success', size: '1.8 GB', duration: '2m' },
  { id: 'bh-004', name: 'Incremental Backup', timestamp: new Date('2026-01-25T08:00:00'), status: 'success', size: '2.4 GB', duration: '4m' },
  { id: 'bh-005', name: 'Configuration Backup', timestamp: new Date('2026-01-25T06:00:00'), status: 'success', size: '156 MB', duration: '1m' },
  { id: 'bh-006', name: 'Incremental Backup', timestamp: new Date('2026-01-25T07:00:00'), status: 'failed', size: '-', duration: '-', error: 'Network timeout' },
];

// Recovery points
const recoveryPoints = [
  { id: 'rp-001', timestamp: new Date('2026-01-25T02:00:00'), type: 'Full', size: '128.5 GB', verified: true },
  { id: 'rp-002', timestamp: new Date('2026-01-24T02:00:00'), type: 'Full', size: '127.8 GB', verified: true },
  { id: 'rp-003', timestamp: new Date('2026-01-23T02:00:00'), type: 'Full', size: '126.9 GB', verified: true },
  { id: 'rp-004', timestamp: new Date('2026-01-22T02:00:00'), type: 'Full', size: '125.4 GB', verified: true },
  { id: 'rp-005', timestamp: new Date('2026-01-19T03:00:00'), type: 'Biometric', size: '456.2 GB', verified: true },
];

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
    case 'success':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Completed</Badge>;
    case 'running':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Running</Badge>;
    case 'failed':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Failed</Badge>;
    case 'scheduled':
      return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Scheduled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getTypeBadge(type: string) {
  switch (type) {
    case 'full':
      return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Full</Badge>;
    case 'incremental':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Incremental</Badge>;
    case 'archive':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Archive</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}

export default function BackupsRecoveryPage() {
  const [selectedTab, setSelectedTab] = useState('jobs');

  const completedBackups = backupJobs.filter((j) => j.status === 'completed').length;
  const runningBackups = backupJobs.filter((j) => j.status === 'running').length;
  const totalStorageUsed = '812.5 GB';
  const lastFullBackup = '2 hours ago';

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Backups & Recovery</h2>
          <p className="text-sm text-slate-500">
            Manage data backups, recovery points, and disaster recovery
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <RotateCcw className="h-4 w-4" />
            Restore
          </Button>
          <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
            <Play className="h-4 w-4" />
            Run Backup Now
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Backup Jobs</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{backupJobs.length}</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-2">
                <Database className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Completed</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{completedBackups}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Running</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{runningBackups}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Storage Used</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{totalStorageUsed}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Last Full Backup</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{lastFullBackup}</p>
          </CardContent>
        </Card>
      </div>

      {/* Storage Overview */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Storage Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-blue-100 p-3">
                <Server className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900">Primary Storage</span>
                  <span className="text-sm text-slate-500">412 GB / 1 TB</span>
                </div>
                <Progress value={41.2} className="mt-2 h-2" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-purple-100 p-3">
                <Cloud className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900">Offsite Backup</span>
                  <span className="text-sm text-slate-500">289 GB / 500 GB</span>
                </div>
                <Progress value={57.8} className="mt-2 h-2" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-amber-100 p-3">
                <HardDrive className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900">Archive Vault</span>
                  <span className="text-sm text-slate-500">1.2 TB / 5 TB</span>
                </div>
                <Progress value={24} className="mt-2 h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="jobs" className="w-full" onValueChange={setSelectedTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="jobs" className="text-xs">Backup Jobs ({backupJobs.length})</TabsTrigger>
          <TabsTrigger value="history" className="text-xs">Recent History</TabsTrigger>
          <TabsTrigger value="recovery" className="text-xs">Recovery Points ({recoveryPoints.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="mt-4">
          <Card className="border-slate-200">
            <CardContent className="divide-y divide-slate-100 p-0">
              {backupJobs.map((job) => (
                <div key={job.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'rounded-lg p-2',
                          job.status === 'completed' && 'bg-emerald-100',
                          job.status === 'running' && 'bg-blue-100',
                          job.status === 'failed' && 'bg-red-100'
                        )}
                      >
                        {job.status === 'completed' && <CheckCircle className="h-5 w-5 text-emerald-600" />}
                        {job.status === 'running' && <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />}
                        {job.status === 'failed' && <XCircle className="h-5 w-5 text-red-600" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{job.name}</h3>
                          {getTypeBadge(job.type)}
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{job.schedule}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last: {job.lastRun.toLocaleString()}
                          </div>
                          {job.duration && (
                            <div>Duration: {job.duration}</div>
                          )}
                          {job.size && (
                            <div>Size: {job.size}</div>
                          )}
                          <div>Destination: {job.destination}</div>
                          <div>Retention: {job.retention}</div>
                        </div>

                        {job.status === 'running' && job.progress && (
                          <div className="mt-3 w-64">
                            <Progress value={job.progress} className="h-2" />
                            <p className="mt-1 text-xs text-slate-500">{job.progress}% complete</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(job.status)}
                      <Button variant="ghost" size="sm">
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card className="border-slate-200">
            <CardContent className="p-0">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Backup Name</th>
                    <th>Timestamp</th>
                    <th>Status</th>
                    <th>Size</th>
                    <th>Duration</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {backupHistory.map((backup) => (
                    <tr key={backup.id}>
                      <td className="font-medium text-slate-900">{backup.name}</td>
                      <td className="text-sm text-slate-600">{backup.timestamp.toLocaleString()}</td>
                      <td>
                        {backup.status === 'success' ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm text-emerald-600">Success</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-sm text-red-600">Failed</span>
                          </div>
                        )}
                      </td>
                      <td className="text-sm text-slate-600">{backup.size}</td>
                      <td className="text-sm text-slate-600">{backup.duration}</td>
                      <td>
                        {backup.status === 'success' && (
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recovery" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recoveryPoints.map((point) => (
              <Card key={point.id} className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-emerald-100 p-2">
                        <FileArchive className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{point.type} Backup</p>
                        <p className="text-sm text-slate-500">{point.timestamp.toLocaleString()}</p>
                      </div>
                    </div>
                    {point.verified && (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Size:</span>
                      <span className="font-medium">{point.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">ID:</span>
                      <span className="font-mono text-xs">{point.id}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs">
                      <Shield className="mr-1 h-3 w-3" />
                      Verify
                    </Button>
                    <Button size="sm" className="flex-1 bg-emerald-600 text-xs hover:bg-emerald-700">
                      <RotateCcw className="mr-1 h-3 w-3" />
                      Restore
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Disaster Recovery Info */}
          <Card className="mt-4 border-blue-200 bg-blue-50">
            <CardContent className="flex items-start gap-3 p-4">
              <Shield className="h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <h4 className="font-semibold text-blue-800">Disaster Recovery</h4>
                <p className="mt-1 text-sm text-blue-700">
                  All recovery points are encrypted and replicated to secure offsite locations.
                  Recovery Time Objective (RTO): 4 hours | Recovery Point Objective (RPO): 1 hour.
                  Last DR test: January 15, 2026 - Successful.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
