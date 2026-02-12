'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Clock,
  User,
  Tablet,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Shield,
  Database,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { getAuditLogs, type AuditLog } from '@/lib/data-service';

function getCategoryIcon(category: string) {
  switch (category) {
    case 'registration':
      return <User className="h-4 w-4" />;
    case 'biometric':
      return <Shield className="h-4 w-4" />;
    case 'sync':
      return <RefreshCw className="h-4 w-4" />;
    case 'dedup':
      return <Database className="h-4 w-4" />;
    case 'exception':
      return <AlertTriangle className="h-4 w-4" />;
    case 'security':
      return <Shield className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

function getCategoryBadge(category: string) {
  switch (category) {
    case 'registration':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Registration</Badge>;
    case 'biometric':
      return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Biometric</Badge>;
    case 'sync':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Sync</Badge>;
    case 'dedup':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Dedup</Badge>;
    case 'exception':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Exception</Badge>;
    case 'security':
      return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Security</Badge>;
    default:
      return <Badge variant="outline">{category || 'General'}</Badge>;
  }
}

function getActionBadge(action: string) {
  if (action.includes('CREATED') || action.includes('CREATE')) {
    return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Create</Badge>;
  }
  if (action.includes('UPDATED') || action.includes('UPDATE') || action.includes('APPROVED')) {
    return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Update</Badge>;
  }
  if (action.includes('DELETED') || action.includes('DELETE') || action.includes('REJECTED')) {
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Delete</Badge>;
  }
  if (action.includes('COMPLETED') || action.includes('SYNCED')) {
    return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Complete</Badge>;
  }
  return <Badge variant="outline">{action}</Badge>;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs({ limit: 200 });
      setLogs(data);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load audit logs.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const registrationLogs = logs.filter(l => l.category === 'registration');
  const securityLogs = logs.filter(l => l.category === 'security' || l.entity_type === 'user');
  const syncLogs = logs.filter(l => l.category === 'sync');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.action_label || log.action).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_id.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedTab === 'all') return matchesSearch;
    if (selectedTab === 'registration') return matchesSearch && log.category === 'registration';
    if (selectedTab === 'security') return matchesSearch && (log.category === 'security' || log.entity_type === 'user');
    if (selectedTab === 'sync') return matchesSearch && log.category === 'sync';
    return matchesSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Audit Logs</h2>
          <p className="text-sm text-slate-500">
            Complete audit trail of all system activities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Events</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{logs.length}</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-2">
                <FileText className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Registrations</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">{registrationLogs.length}</p>
              </div>
              <div className="rounded-lg bg-blue-100 p-2">
                <User className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Sync Events</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{syncLogs.length}</p>
              </div>
              <div className="rounded-lg bg-emerald-100 p-2">
                <RefreshCw className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Security</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">{securityLogs.length}</p>
              </div>
              <div className="rounded-lg bg-amber-100 p-2">
                <Shield className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Search by action, description, or entity ID..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setSelectedTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="all" className="text-xs">All ({logs.length})</TabsTrigger>
          <TabsTrigger value="registration" className="text-xs">Registration ({registrationLogs.length})</TabsTrigger>
          <TabsTrigger value="sync" className="text-xs">Sync ({syncLogs.length})</TabsTrigger>
          <TabsTrigger value="security" className="text-xs">Security ({securityLogs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          <Card className="border-slate-200">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">No audit logs found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-slate-50">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 rounded-lg bg-slate-100 p-2 text-slate-600">
                          {getCategoryIcon(log.category || 'general')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-slate-900">
                              {log.action_label || log.action}
                            </p>
                            {getCategoryBadge(log.category || 'general')}
                            {getActionBadge(log.action)}
                          </div>
                          {log.description && (
                            <p className="text-sm text-slate-600 mb-2">{log.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {log.user?.full_name || log.user_id || 'System'}
                            </span>
                            <span className="font-mono text-slate-400">
                              {log.entity_type}: {log.entity_id}
                            </span>
                          </div>
                          {(log.old_value || log.new_value) && (
                            <div className="mt-2 flex gap-4 text-xs">
                              {log.old_value && (
                                <span className="text-red-600">
                                  Old: {JSON.stringify(log.old_value)}
                                </span>
                              )}
                              {log.new_value && (
                                <span className="text-emerald-600">
                                  New: {JSON.stringify(log.new_value)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-xs text-slate-400 truncate max-w-[120px]" title={log.signature_hash}>
                            {log.signature_hash.substring(0, 16)}...
                          </p>
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
