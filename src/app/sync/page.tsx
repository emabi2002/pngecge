'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  Wifi,
  AlertTriangle,
  Tablet,
  Loader2,
  Play,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  getSyncBatches,
  startSyncBatch,
  retrySyncBatch,
  type SyncBatch,
} from '@/lib/data-service';

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Completed</Badge>;
    case 'in_progress':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">In Progress</Badge>;
    case 'pending':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending</Badge>;
    case 'failed':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Failed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case 'in_progress':
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-amber-500" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-slate-400" />;
  }
}

export default function SyncStatusPage() {
  const [batches, setBatches] = useState<SyncBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSyncBatches({ limit: 100 });
      setBatches(data);
    } catch (error) {
      console.error('Error loading sync batches:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sync batches.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completedCount = batches.filter(b => b.status === 'completed').length;
  const inProgressCount = batches.filter(b => b.status === 'in_progress').length;
  const pendingCount = batches.filter(b => b.status === 'pending').length;
  const failedCount = batches.filter(b => b.status === 'failed').length;

  const totalRecords = batches.reduce((sum, b) => sum + (b.record_count || 0), 0);

  const filteredBatches = batches.filter((batch) => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'completed') return batch.status === 'completed';
    if (selectedTab === 'active') return batch.status === 'in_progress' || batch.status === 'pending';
    if (selectedTab === 'failed') return batch.status === 'failed';
    return true;
  });

  const handleStartSync = async (batch: SyncBatch) => {
    try {
      const updated = await startSyncBatch(batch.id);
      if (updated) {
        setBatches(batches.map(b => b.id === batch.id ? updated : b));
        toast({
          title: 'Sync Started',
          description: `Batch ${batch.batch_id} is now syncing.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start sync batch.',
        variant: 'destructive',
      });
    }
  };

  const handleRetrySync = async (batch: SyncBatch) => {
    try {
      const updated = await retrySyncBatch(batch.id);
      if (updated) {
        setBatches(batches.map(b => b.id === batch.id ? updated : b));
        toast({
          title: 'Retry Queued',
          description: `Batch ${batch.batch_id} has been queued for retry.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to retry sync batch.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Sync Status</h2>
          <p className="text-sm text-slate-500">
            Monitor data synchronization from field devices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Batches</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{batches.length}</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-2">
                <Upload className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Completed</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{completedCount}</p>
              </div>
              <div className="rounded-lg bg-emerald-100 p-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">In Progress</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">{inProgressCount}</p>
              </div>
              <div className="rounded-lg bg-blue-100 p-2">
                <RefreshCw className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Pending</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">{pendingCount}</p>
              </div>
              <div className="rounded-lg bg-amber-100 p-2">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Failed</p>
                <p className="mt-1 text-2xl font-bold text-red-600">{failedCount}</p>
              </div>
              <div className="rounded-lg bg-red-100 p-2">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Records Synced</p>
              <p className="text-2xl font-bold text-slate-900">{totalRecords.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Success Rate</p>
              <p className="text-2xl font-bold text-emerald-600">
                {batches.length > 0 ? Math.round((completedCount / batches.length) * 100) : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="w-full" onValueChange={setSelectedTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="all" className="text-xs">All ({batches.length})</TabsTrigger>
          <TabsTrigger value="active" className="text-xs">Active ({inProgressCount + pendingCount})</TabsTrigger>
          <TabsTrigger value="completed" className="text-xs">Completed ({completedCount})</TabsTrigger>
          <TabsTrigger value="failed" className="text-xs">Failed ({failedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          <Card className="border-slate-200">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              ) : filteredBatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Upload className="h-12 w-12 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">No sync batches found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredBatches.map((batch) => (
                    <div key={batch.id} className="p-4 hover:bg-slate-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">{getStatusIcon(batch.status)}</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-900">{batch.batch_id}</p>
                              {getStatusBadge(batch.status)}
                            </div>
                            <div className="mt-1 flex items-center gap-4 text-sm text-slate-500">
                              {batch.device && (
                                <span className="flex items-center gap-1">
                                  <Tablet className="h-3 w-3" />
                                  {batch.device.device_name}
                                </span>
                              )}
                              <span>{batch.record_count || 0} records</span>
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              {batch.queued_at && (
                                <span>Queued: {new Date(batch.queued_at).toLocaleString()}</span>
                              )}
                              {batch.completed_at && (
                                <span className="ml-4">Completed: {new Date(batch.completed_at).toLocaleString()}</span>
                              )}
                            </div>
                            {batch.error_message && (
                              <div className="mt-2 flex items-center gap-1 text-sm text-red-600">
                                <AlertTriangle className="h-3 w-3" />
                                {batch.error_message}
                              </div>
                            )}
                            {batch.status === 'in_progress' && (
                              <div className="mt-2 flex items-center gap-2">
                                <Progress value={batch.progress} className="w-32 h-2" />
                                <span className="text-sm text-slate-500">{batch.progress}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {batch.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => handleStartSync(batch)}
                            >
                              <Play className="h-3 w-3" />
                              Start
                            </Button>
                          )}
                          {batch.status === 'failed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => handleRetrySync(batch)}
                            >
                              <RotateCcw className="h-3 w-3" />
                              Retry
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
