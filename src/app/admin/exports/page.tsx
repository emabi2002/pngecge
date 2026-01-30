'use client';

import { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  Database,
  Shield,
  CheckCircle,
  Clock,
  Loader2,
  AlertTriangle,
  Lock,
  Send,
  ClipboardCheck,
  XCircle,
  Filter,
  Search,
  RefreshCw,
  Eye,
  ChevronRight,
  Calendar,
  Users,
  MapPin,
  FileSpreadsheet,
  MoreVertical,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

type ExportType = 'voter_register' | 'biometric_data' | 'audit_logs' | 'user_data' | 'dedup_report' | 'statistics';
type ExportStatus = 'pending_approval' | 'approved' | 'rejected' | 'generating' | 'completed' | 'failed' | 'expired';
type SensitivityLevel = 'public' | 'internal' | 'confidential' | 'restricted';

interface ExportRequest {
  id: string;
  export_type: ExportType;
  title: string;
  description: string;
  sensitivity: SensitivityLevel;
  scope: {
    provinces?: string[];
    districts?: string[];
    date_from?: string;
    date_to?: string;
  };
  format: 'csv' | 'pdf' | 'excel' | 'json';
  status: ExportStatus;
  requires_approval: boolean;
  requestor_id: string;
  requestor_name: string;
  justification?: string;
  approved_by?: string;
  approver_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  file_url?: string;
  file_size?: string;
  record_count?: number;
  progress?: number;
  expires_at?: string;
  created_at: string;
}

const EXPORT_TYPES: Record<ExportType, { label: string; icon: typeof FileText; color: string; sensitivity: SensitivityLevel; requiresApproval: boolean }> = {
  voter_register: { label: 'Voter Register', icon: Users, color: 'bg-blue-100 text-blue-700', sensitivity: 'confidential', requiresApproval: true },
  biometric_data: { label: 'Biometric Data', icon: Shield, color: 'bg-red-100 text-red-700', sensitivity: 'restricted', requiresApproval: true },
  audit_logs: { label: 'Audit Logs', icon: FileText, color: 'bg-amber-100 text-amber-700', sensitivity: 'internal', requiresApproval: true },
  user_data: { label: 'User Data', icon: Users, color: 'bg-purple-100 text-purple-700', sensitivity: 'confidential', requiresApproval: true },
  dedup_report: { label: 'Deduplication Report', icon: Database, color: 'bg-green-100 text-green-700', sensitivity: 'internal', requiresApproval: false },
  statistics: { label: 'Statistics Report', icon: FileSpreadsheet, color: 'bg-slate-100 text-slate-700', sensitivity: 'public', requiresApproval: false },
};

const SENSITIVITY_CONFIG: Record<SensitivityLevel, { label: string; color: string; icon: typeof Shield }> = {
  public: { label: 'Public', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  internal: { label: 'Internal', color: 'bg-blue-100 text-blue-700', icon: Shield },
  confidential: { label: 'Confidential', color: 'bg-amber-100 text-amber-700', icon: Lock },
  restricted: { label: 'Restricted', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
};

const STATUS_CONFIG: Record<ExportStatus, { label: string; color: string }> = {
  pending_approval: { label: 'Pending Approval', color: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
  generating: { label: 'Generating', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700' },
  expired: { label: 'Expired', color: 'bg-slate-100 text-slate-500' },
};

const PROVINCES = [
  'National Capital District', 'Central Province', 'Gulf Province', 'Western Province',
  'Milne Bay Province', 'Oro Province', 'Southern Highlands Province', 'Eastern Highlands Province',
  'Western Highlands Province', 'Simbu Province', 'Enga Province', 'Jiwaka Province',
  'Hela Province', 'Morobe Province', 'Madang Province', 'East Sepik Province',
  'West Sepik Province', 'Manus Province', 'New Ireland Province', 'East New Britain Province',
  'West New Britain Province', 'Autonomous Region of Bougainville',
];

export default function AdminExportsPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ExportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ExportRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    export_type: '' as ExportType | '',
    title: '',
    description: '',
    format: 'csv' as 'csv' | 'pdf' | 'excel' | 'json',
    provinces: [] as string[],
    date_from: '',
    date_to: '',
    justification: '',
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    // Simulated data
    const mockRequests: ExportRequest[] = [
      {
        id: 'exp-1',
        export_type: 'voter_register',
        title: 'NCD Voter Register Q1 2026',
        description: 'Complete voter register for National Capital District for audit purposes',
        sensitivity: 'confidential',
        scope: { provinces: ['National Capital District'], date_from: '2026-01-01', date_to: '2026-03-31' },
        format: 'csv',
        status: 'pending_approval',
        requires_approval: true,
        requestor_id: 'user-2',
        requestor_name: 'Mary Tani',
        justification: 'Required for quarterly audit report submission to the Electoral Commissioner.',
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'exp-2',
        export_type: 'audit_logs',
        title: 'System Audit Logs - January 2026',
        description: 'Complete audit trail for system activities during January 2026',
        sensitivity: 'internal',
        scope: { date_from: '2026-01-01', date_to: '2026-01-31' },
        format: 'json',
        status: 'approved',
        requires_approval: true,
        requestor_id: 'user-3',
        requestor_name: 'John Kewa',
        justification: 'Security review and compliance check.',
        approved_by: 'user-1',
        approver_name: 'Super Admin',
        approved_at: new Date(Date.now() - 7200000).toISOString(),
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'exp-3',
        export_type: 'statistics',
        title: 'Registration Statistics Report',
        description: 'Summary statistics of voter registrations by province',
        sensitivity: 'public',
        scope: { provinces: PROVINCES.slice(0, 5) },
        format: 'pdf',
        status: 'completed',
        requires_approval: false,
        requestor_id: 'user-2',
        requestor_name: 'Mary Tani',
        file_url: '/exports/statistics-report.pdf',
        file_size: '2.4 MB',
        record_count: 1250000,
        created_at: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: 'exp-4',
        export_type: 'biometric_data',
        title: 'Biometric Export - EHP',
        description: 'Biometric data export for Eastern Highlands Province verification',
        sensitivity: 'restricted',
        scope: { provinces: ['Eastern Highlands Province'] },
        format: 'json',
        status: 'rejected',
        requires_approval: true,
        requestor_id: 'user-5',
        requestor_name: 'James Nao',
        justification: 'Need for external verification system integration.',
        approved_by: 'user-1',
        approver_name: 'Super Admin',
        approved_at: new Date(Date.now() - 43200000).toISOString(),
        rejection_reason: 'Biometric data cannot be exported to external systems. Please use the internal verification API instead.',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'exp-5',
        export_type: 'dedup_report',
        title: 'Deduplication Analysis Report',
        description: 'Analysis of duplicate detection results for review',
        sensitivity: 'internal',
        scope: { date_from: '2026-01-01', date_to: '2026-01-28' },
        format: 'excel',
        status: 'generating',
        requires_approval: false,
        requestor_id: 'user-3',
        requestor_name: 'John Kewa',
        progress: 67,
        created_at: new Date(Date.now() - 1800000).toISOString(),
      },
    ];
    setRequests(mockRequests);
    setLoading(false);
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch =
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.requestor_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesType = typeFilter === 'all' || request.export_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const pendingCount = requests.filter(r => r.status === 'pending_approval').length;
  const completedCount = requests.filter(r => r.status === 'completed').length;
  const generatingCount = requests.filter(r => r.status === 'generating').length;

  const resetForm = () => {
    setFormData({
      export_type: '',
      title: '',
      description: '',
      format: 'csv',
      provinces: [],
      date_from: '',
      date_to: '',
      justification: '',
    });
  };

  const handleCreate = async () => {
    if (!formData.export_type || !formData.title) {
      toast({
        title: 'Validation Error',
        description: 'Export type and title are required.',
        variant: 'destructive',
      });
      return;
    }

    const exportType = EXPORT_TYPES[formData.export_type as ExportType];
    const requiresApproval = exportType.requiresApproval;

    const newRequest: ExportRequest = {
      id: `exp-${Date.now()}`,
      export_type: formData.export_type as ExportType,
      title: formData.title,
      description: formData.description,
      sensitivity: exportType.sensitivity,
      scope: {
        provinces: formData.provinces.length > 0 ? formData.provinces : undefined,
        date_from: formData.date_from || undefined,
        date_to: formData.date_to || undefined,
      },
      format: formData.format,
      status: requiresApproval ? 'pending_approval' : 'generating',
      requires_approval: requiresApproval,
      requestor_id: 'current-user',
      requestor_name: 'Current User',
      justification: formData.justification || undefined,
      progress: requiresApproval ? undefined : 0,
      created_at: new Date().toISOString(),
    };

    setRequests([newRequest, ...requests]);
    setIsCreateDialogOpen(false);
    resetForm();

    toast({
      title: requiresApproval ? 'Export Request Submitted' : 'Export Started',
      description: requiresApproval
        ? 'Your export request has been submitted for approval.'
        : 'Your export is being generated.',
    });
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    const updatedRequests = requests.map(r =>
      r.id === selectedRequest.id
        ? {
            ...r,
            status: 'generating' as ExportStatus,
            approved_by: 'current-user',
            approver_name: 'Current User',
            approved_at: new Date().toISOString(),
            progress: 0,
          }
        : r
    );

    setRequests(updatedRequests);
    setIsApproveDialogOpen(false);
    setSelectedRequest(null);

    toast({
      title: 'Export Approved',
      description: 'The export request has been approved and generation has started.',
    });
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason) return;

    const updatedRequests = requests.map(r =>
      r.id === selectedRequest.id
        ? {
            ...r,
            status: 'rejected' as ExportStatus,
            approved_by: 'current-user',
            approver_name: 'Current User',
            approved_at: new Date().toISOString(),
            rejection_reason: rejectionReason,
          }
        : r
    );

    setRequests(updatedRequests);
    setIsRejectDialogOpen(false);
    setSelectedRequest(null);
    setRejectionReason('');

    toast({
      title: 'Export Rejected',
      description: 'The export request has been rejected.',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
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
          <h1 className="text-2xl font-bold text-slate-900">Data Exports</h1>
          <p className="text-slate-500">Request and manage data exports with approval workflow</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadRequests}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            New Export Request
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={pendingCount > 0 ? 'border-amber-200 bg-amber-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending Approval</p>
                <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Generating</p>
                <p className="text-2xl font-bold text-purple-600">{generatingCount}</p>
              </div>
              <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Requests</p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
              <Database className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search exports..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Export Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(EXPORT_TYPES).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="generating">Generating</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Export Requests List */}
      <div className="space-y-4">
        {filteredRequests.map(request => {
          const TypeConfig = EXPORT_TYPES[request.export_type];
          const SensitivityConfig = SENSITIVITY_CONFIG[request.sensitivity];
          const TypeIcon = TypeConfig.icon;
          const SensitivityIcon = SensitivityConfig.icon;

          return (
            <Card key={request.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${TypeConfig.color.split(' ')[0]}`}>
                      <TypeIcon className={`h-6 w-6 ${TypeConfig.color.split(' ')[1]}`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-slate-900">{request.title}</h3>
                        <Badge className={STATUS_CONFIG[request.status].color}>
                          {STATUS_CONFIG[request.status].label}
                        </Badge>
                        <Badge className={SensitivityConfig.color}>
                          <SensitivityIcon className="mr-1 h-3 w-3" />
                          {SensitivityConfig.label}
                        </Badge>
                      </div>

                      <p className="text-sm text-slate-600 mb-2">{request.description}</p>

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>By {request.requestor_name}</span>
                        <span>{formatRelativeTime(request.created_at)}</span>
                        <span className="uppercase">{request.format}</span>
                        {request.scope.provinces && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {request.scope.provinces.length} province(s)
                          </span>
                        )}
                      </div>

                      {request.status === 'generating' && request.progress !== undefined && (
                        <div className="mt-3">
                          <Progress value={request.progress} className="h-2 w-64" />
                          <p className="mt-1 text-xs text-slate-500">{request.progress}% complete</p>
                        </div>
                      )}

                      {request.status === 'completed' && (
                        <div className="mt-2 flex items-center gap-4 text-xs">
                          {request.file_size && <span className="text-slate-500">Size: {request.file_size}</span>}
                          {request.record_count && <span className="text-slate-500">{request.record_count.toLocaleString()} records</span>}
                        </div>
                      )}

                      {request.status === 'rejected' && request.rejection_reason && (
                        <div className="mt-2 p-2 rounded bg-red-50 border border-red-100">
                          <p className="text-xs text-red-600">
                            <strong>Rejection reason:</strong> {request.rejection_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {request.status === 'pending_approval' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsRejectDialogOpen(true);
                          }}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsApproveDialogOpen(true);
                          }}
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                      </>
                    )}
                    {request.status === 'completed' && (
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                        <Download className="mr-1 h-4 w-4" />
                        Download
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedRequest(request);
                          setIsViewDialogOpen(true);
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredRequests.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-slate-500">
              No export requests found matching your criteria.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Security Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex items-start gap-3 p-4">
          <Shield className="h-5 w-5 text-amber-600" />
          <div>
            <h4 className="font-semibold text-amber-800">Data Export Security</h4>
            <p className="mt-1 text-sm text-amber-700">
              All data exports are logged in the audit trail. Confidential and restricted exports require
              approval from authorized administrators. Downloaded files are encrypted and watermarked.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Create Export Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Export Request</DialogTitle>
            <DialogDescription>
              Request a data export. Sensitive exports require approval.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Export Type *</Label>
              <Select
                value={formData.export_type}
                onValueChange={(value) => setFormData({ ...formData, export_type: value as ExportType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select export type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXPORT_TYPES).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span>{val.label}</span>
                        <Badge className={SENSITIVITY_CONFIG[val.sensitivity].color} variant="outline">
                          {SENSITIVITY_CONFIG[val.sensitivity].label}
                        </Badge>
                        {val.requiresApproval && (
                          <Badge variant="outline" className="text-amber-600">
                            Approval Required
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., NCD Voter Register Q1 2026"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the purpose of this export..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Format</Label>
                <Select
                  value={formData.format}
                  onValueChange={(value) => setFormData({ ...formData, format: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Province Filter</Label>
                <Select
                  value={formData.provinces.length === 0 ? 'all' : formData.provinces[0]}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    provinces: value === 'all' ? [] : [value]
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All provinces" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Provinces</SelectItem>
                    {PROVINCES.map(prov => (
                      <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_from">Date From</Label>
                <Input
                  id="date_from"
                  type="date"
                  value={formData.date_from}
                  onChange={(e) => setFormData({ ...formData, date_from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_to">Date To</Label>
                <Input
                  id="date_to"
                  type="date"
                  value={formData.date_to}
                  onChange={(e) => setFormData({ ...formData, date_to: e.target.value })}
                />
              </div>
            </div>

            {formData.export_type && EXPORT_TYPES[formData.export_type as ExportType]?.requiresApproval && (
              <div className="space-y-2">
                <Label htmlFor="justification">Justification *</Label>
                <Textarea
                  id="justification"
                  value={formData.justification}
                  onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                  placeholder="Explain why you need this export..."
                  rows={3}
                />
                <p className="text-xs text-amber-600">
                  This export type requires approval. Provide a clear justification.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleCreate}
            >
              <Send className="mr-2 h-4 w-4" />
              {formData.export_type && EXPORT_TYPES[formData.export_type as ExportType]?.requiresApproval
                ? 'Submit for Approval'
                : 'Start Export'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Export Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Export Details</DialogTitle>
            <DialogDescription>
              Full details of the export request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <Badge className={EXPORT_TYPES[selectedRequest.export_type].color}>
                  {EXPORT_TYPES[selectedRequest.export_type].label}
                </Badge>
                <Badge className={STATUS_CONFIG[selectedRequest.status].color}>
                  {STATUS_CONFIG[selectedRequest.status].label}
                </Badge>
                <Badge className={SENSITIVITY_CONFIG[selectedRequest.sensitivity].color}>
                  {SENSITIVITY_CONFIG[selectedRequest.sensitivity].label}
                </Badge>
              </div>

              <div>
                <h3 className="font-medium text-slate-900">{selectedRequest.title}</h3>
                <p className="text-sm text-slate-600 mt-1">{selectedRequest.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Requested By</p>
                  <p className="font-medium">{selectedRequest.requestor_name}</p>
                </div>
                <div>
                  <p className="text-slate-500">Format</p>
                  <p className="font-medium uppercase">{selectedRequest.format}</p>
                </div>
                <div>
                  <p className="text-slate-500">Submitted</p>
                  <p className="font-medium">{formatDate(selectedRequest.created_at)}</p>
                </div>
                {selectedRequest.approved_at && (
                  <div>
                    <p className="text-slate-500">
                      {selectedRequest.status === 'rejected' ? 'Rejected At' : 'Approved At'}
                    </p>
                    <p className="font-medium">{formatDate(selectedRequest.approved_at)}</p>
                  </div>
                )}
              </div>

              {selectedRequest.scope.provinces && selectedRequest.scope.provinces.length > 0 && (
                <div>
                  <p className="text-sm text-slate-500">Provinces</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedRequest.scope.provinces.map(prov => (
                      <Badge key={prov} variant="outline">{prov}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedRequest.justification && (
                <div className="p-3 rounded-lg bg-slate-50">
                  <p className="text-sm text-slate-500 mb-1">Justification</p>
                  <p className="text-sm">{selectedRequest.justification}</p>
                </div>
              )}

              {selectedRequest.rejection_reason && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                  <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-600">{selectedRequest.rejection_reason}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {selectedRequest?.status === 'completed' && (
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Approve Export Request
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this export request?
              {selectedRequest && (
                <div className="mt-2 p-3 rounded-lg bg-slate-50">
                  <p className="font-medium text-slate-900">{selectedRequest.title}</p>
                  <p className="text-sm text-slate-600">{selectedRequest.description}</p>
                  <Badge className={SENSITIVITY_CONFIG[selectedRequest.sensitivity].color} variant="outline">
                    {SENSITIVITY_CONFIG[selectedRequest.sensitivity].label}
                  </Badge>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleApprove}
            >
              Approve & Start Export
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Reject Export Request
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this export request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="rejection_reason">Rejection Reason *</Label>
              <Textarea
                id="rejection_reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this export request is being rejected..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => {
              setIsRejectDialogOpen(false);
              setRejectionReason('');
            }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
