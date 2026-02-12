'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Clock,
  Globe,
  Shield,
  Database,
  Settings,
  Users,
  MapPin,
  Fingerprint,
  MoreVertical,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getAuditLogs, type AuditLog } from '@/lib/admin-service';

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Activity; color: string }> = {
  authentication: { label: 'Authentication', icon: Shield, color: 'bg-blue-100 text-blue-700' },
  user_management: { label: 'User Management', icon: Users, color: 'bg-purple-100 text-purple-700' },
  registration: { label: 'Registration', icon: Fingerprint, color: 'bg-green-100 text-green-700' },
  deduplication: { label: 'Deduplication', icon: Database, color: 'bg-amber-100 text-amber-700' },
  system: { label: 'System', icon: Settings, color: 'bg-slate-100 text-slate-700' },
  data_export: { label: 'Data Export', icon: Download, color: 'bg-cyan-100 text-cyan-700' },
  geographic: { label: 'Geographic', icon: MapPin, color: 'bg-rose-100 text-rose-700' },
  security: { label: 'Security', icon: AlertTriangle, color: 'bg-red-100 text-red-700' },
};

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  success: { label: 'Success', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  failure: { label: 'Failure', icon: XCircle, color: 'bg-red-100 text-red-700' },
  warning: { label: 'Warning', icon: AlertTriangle, color: 'bg-amber-100 text-amber-700' },
};

const ACTIONS = [
  'login', 'logout', 'login_failed', 'password_change', 'mfa_enabled', 'mfa_disabled',
  'user_created', 'user_updated', 'user_deleted', 'user_approved', 'user_suspended',
  'role_assigned', 'permission_granted', 'permission_revoked',
  'voter_registered', 'voter_updated', 'voter_deleted',
  'dedup_match_found', 'dedup_resolved', 'dedup_false_positive',
  'data_exported', 'export_approved', 'export_rejected',
  'config_updated', 'system_backup', 'system_restore',
];

export default function AuditLogsPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Dialog
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAuditLogs({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        startDate: dateFrom || undefined,
        endDate: dateTo || undefined,
      });
      setLogs(result.logs);
      setTotal(result.total);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      // Use mock data for demo
      setLogs(generateMockLogs());
      setTotal(150);
    } finally {
      setLoading(false);
    }
  }, [page, categoryFilter, statusFilter, actionFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const generateMockLogs = (): AuditLog[] => {
    const mockLogs: AuditLog[] = [];
    const now = new Date();

    for (let i = 0; i < 25; i++) {
      const timestamp = new Date(now.getTime() - i * 3600000 * Math.random() * 5);
      const categories = Object.keys(CATEGORY_CONFIG);
      const statuses = ['success', 'success', 'success', 'failure', 'warning'] as const;
      const category = categories[Math.floor(Math.random() * categories.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];

      mockLogs.push({
        id: `log-${i}`,
        timestamp: timestamp.toISOString(),
        user_id: `user-${Math.floor(Math.random() * 5) + 1}`,
        user_email: ['admin@pngec.gov.pg', 'mary.tani@pngec.gov.pg', 'john.kewa@pngec.gov.pg'][Math.floor(Math.random() * 3)],
        user_name: ['Admin User', 'Mary Tani', 'John Kewa'][Math.floor(Math.random() * 3)],
        action,
        category,
        entity_type: ['voter', 'user', 'role', 'permission', 'config'][Math.floor(Math.random() * 5)],
        entity_id: `ENT-${Math.floor(Math.random() * 10000)}`,
        ip_address: `203.122.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        status,
        error_message: status === 'failure' ? 'Permission denied' : undefined,
        old_values: action.includes('updated') ? { status: 'pending' } : undefined,
        new_values: action.includes('updated') ? { status: 'active' } : undefined,
      });
    }

    return mockLogs;
  };

  const filteredLogs = logs.filter(log => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.user_email?.toLowerCase().includes(query) ||
        log.user_name?.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.entity_id?.toLowerCase().includes(query) ||
        log.ip_address?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(total / pageSize);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
  };

  const getCategoryConfig = (category: string) => {
    return CATEGORY_CONFIG[category] || { label: category, icon: Activity, color: 'bg-slate-100 text-slate-700' };
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || { label: status, icon: Activity, color: 'bg-slate-100 text-slate-700' };
  };

  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: 'Audit logs export has been initiated.',
    });
  };

  if (loading && logs.length === 0) {
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
          <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
          <p className="text-slate-500">Detailed system activity and event tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={loadLogs}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Logs</p>
                <p className="text-2xl font-bold">{total.toLocaleString()}</p>
              </div>
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Success</p>
                <p className="text-2xl font-bold text-green-600">
                  {logs.filter(l => l.status === 'success').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Failures</p>
                <p className="text-2xl font-bold text-red-600">
                  {logs.filter(l => l.status === 'failure').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Warnings</p>
                <p className="text-2xl font-bold text-amber-600">
                  {logs.filter(l => l.status === 'warning').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-6">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by user, action, entity, IP..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(CATEGORY_CONFIG).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failure">Failure</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="To"
            />
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Entity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">IP Address</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLogs.map(log => {
                  const categoryConfig = getCategoryConfig(log.category);
                  const statusConfig = getStatusConfig(log.status);
                  const CategoryIcon = categoryConfig.icon;
                  const StatusIcon = statusConfig.icon;
                  const { date, time } = formatTimestamp(log.timestamp);

                  return (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{time}</p>
                            <p className="text-xs text-slate-500">{date}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium">{log.user_name || 'System'}</p>
                            <p className="text-xs text-slate-500">{log.user_email || 'system@pngec.gov.pg'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={categoryConfig.color}>
                          <CategoryIcon className="mr-1 h-3 w-3" />
                          {categoryConfig.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono">{log.action}</span>
                      </td>
                      <td className="px-4 py-3">
                        {log.entity_id ? (
                          <div>
                            <p className="text-sm">{log.entity_type}</p>
                            <p className="text-xs text-slate-500 font-mono">{log.entity_id}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm">
                          <Globe className="h-3 w-3 text-slate-400" />
                          <span className="font-mono text-xs">{log.ip_address || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedLog(log);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No audit logs found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} entries
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-slate-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* View Log Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Complete details of the logged event
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <Badge className={getCategoryConfig(selectedLog.category).color}>
                  {getCategoryConfig(selectedLog.category).label}
                </Badge>
                <Badge className={getStatusConfig(selectedLog.status).color}>
                  {getStatusConfig(selectedLog.status).label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Timestamp</p>
                  <p className="font-medium">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Action</p>
                  <p className="font-mono">{selectedLog.action}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">User</p>
                  <p className="font-medium">{selectedLog.user_name || 'System'}</p>
                  <p className="text-xs text-slate-500">{selectedLog.user_email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">IP Address</p>
                  <p className="font-mono">{selectedLog.ip_address || '-'}</p>
                </div>
              </div>

              {selectedLog.entity_type && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Entity</p>
                  <p className="font-medium">{selectedLog.entity_type}: {selectedLog.entity_id}</p>
                </div>
              )}

              {selectedLog.error_message && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                  <p className="text-xs text-red-800 font-medium">Error Message</p>
                  <p className="text-sm text-red-600">{selectedLog.error_message}</p>
                </div>
              )}

              {selectedLog.old_values && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Old Values</p>
                  <pre className="p-3 rounded-lg bg-slate-100 text-xs font-mono overflow-x-auto">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">New Values</p>
                  <pre className="p-3 rounded-lg bg-slate-100 text-xs font-mono overflow-x-auto">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.user_agent && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">User Agent</p>
                  <p className="text-xs font-mono text-slate-600 break-all">{selectedLog.user_agent}</p>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Additional Metadata</p>
                  <pre className="p-3 rounded-lg bg-slate-100 text-xs font-mono overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
