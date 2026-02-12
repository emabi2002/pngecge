'use client';

import { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Shield,
  Key,
  FileText,
  Download,
  RefreshCw,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Check,
  X,
  ChevronRight,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { useToast } from '@/hooks/use-toast';
import {
  notifyUserApproved,
  notifyUserRejected,
  notifyRoleChanged,
  notifyExportApproved,
  notifyExportRejected,
} from '@/lib/notification-service';

type RequestType = 'user_creation' | 'role_change' | 'permission_grant' | 'data_export' | 'bulk_operation';
type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';

interface ApprovalRequest {
  id: string;
  request_type: RequestType;
  requestor_id: string;
  requestor_name: string;
  requestor_email: string;
  requestor_role: string;
  target_user_id?: string;
  target_user_name?: string;
  requested_changes: Record<string, unknown>;
  justification: string;
  status: RequestStatus;
  approver_role_required: string;
  approved_by?: string;
  approver_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  expires_at: string;
  created_at: string;
}

const REQUEST_TYPE_CONFIG: Record<RequestType, { label: string; icon: typeof User; color: string }> = {
  user_creation: { label: 'New User', icon: User, color: 'bg-blue-100 text-blue-700' },
  role_change: { label: 'Role Change', icon: Shield, color: 'bg-purple-100 text-purple-700' },
  permission_grant: { label: 'Permission Grant', icon: Key, color: 'bg-amber-100 text-amber-700' },
  data_export: { label: 'Data Export', icon: Download, color: 'bg-green-100 text-green-700' },
  bulk_operation: { label: 'Bulk Operation', icon: FileText, color: 'bg-red-100 text-red-700' },
};

const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'bg-slate-100 text-slate-700', icon: XCircle },
  expired: { label: 'Expired', color: 'bg-slate-100 text-slate-500', icon: Clock },
};

export default function ApprovalWorkflowsPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  // Dialog states
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    // Simulated data
    const mockRequests: ApprovalRequest[] = [
      {
        id: 'req-1',
        request_type: 'user_creation',
        requestor_id: 'user-2',
        requestor_name: 'Mary Tani',
        requestor_email: 'mary.tani@pngec.gov.pg',
        requestor_role: 'Provincial Administrator',
        target_user_name: 'Peter Wai',
        requested_changes: {
          email: 'peter.wai@pngec.gov.pg',
          full_name: 'Peter Wai',
          role: 'Registration Officer',
          province: 'Eastern Highlands',
        },
        justification: 'New registration officer needed for Eastern Highlands province to support the upcoming voter registration drive.',
        status: 'pending',
        approver_role_required: 'national_admin',
        expires_at: new Date(Date.now() + 86400000 * 5).toISOString(),
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'req-2',
        request_type: 'role_change',
        requestor_id: 'user-3',
        requestor_name: 'John Kewa',
        requestor_email: 'admin@pngec.gov.pg',
        requestor_role: 'National Administrator',
        target_user_id: 'user-5',
        target_user_name: 'James Nao',
        requested_changes: {
          current_role: 'Registration Officer',
          new_role: 'Ward Supervisor',
          reason: 'Promotion based on performance',
        },
        justification: 'James has consistently exceeded registration targets and demonstrated leadership capabilities. Recommending promotion to Ward Supervisor.',
        status: 'pending',
        approver_role_required: 'super_admin',
        expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'req-3',
        request_type: 'data_export',
        requestor_id: 'user-8',
        requestor_name: 'Sarah Kila',
        requestor_email: 'sarah.kila@pngec.gov.pg',
        requestor_role: 'Auditor',
        requested_changes: {
          export_type: 'Voter Registration Report',
          date_range: '2024-01-01 to 2024-06-30',
          provinces: ['National Capital District', 'Central Province'],
          format: 'PDF and CSV',
        },
        justification: 'Required for quarterly audit report submission to the Electoral Commissioner.',
        status: 'pending',
        approver_role_required: 'national_admin',
        expires_at: new Date(Date.now() + 86400000 * 3).toISOString(),
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'req-4',
        request_type: 'permission_grant',
        requestor_id: 'user-2',
        requestor_name: 'Mary Tani',
        requestor_email: 'mary.tani@pngec.gov.pg',
        requestor_role: 'Provincial Administrator',
        target_user_id: 'user-6',
        target_user_name: 'Anna Kopa',
        requested_changes: {
          permissions: ['deduplication.approve', 'exceptions.approve'],
          duration: 'Permanent',
        },
        justification: 'Anna needs approval permissions to handle deduplication cases during my leave period.',
        status: 'approved',
        approver_role_required: 'national_admin',
        approved_by: 'user-1',
        approver_name: 'Super Admin',
        approved_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        expires_at: new Date(Date.now() + 86400000 * 5).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: 'req-5',
        request_type: 'bulk_operation',
        requestor_id: 'user-3',
        requestor_name: 'John Kewa',
        requestor_email: 'admin@pngec.gov.pg',
        requestor_role: 'National Administrator',
        requested_changes: {
          operation: 'Bulk User Deactivation',
          affected_users: 45,
          reason: 'Contract expiration',
        },
        justification: 'Deactivating temporary registration officers whose contracts have expired after the registration drive.',
        status: 'rejected',
        approver_role_required: 'super_admin',
        approved_by: 'user-1',
        approver_name: 'Super Admin',
        approved_at: new Date(Date.now() - 86400000).toISOString(),
        rejection_reason: 'Please provide individual user list for review before bulk deactivation.',
        expires_at: new Date(Date.now() - 86400000).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      },
    ];
    setRequests(mockRequests);
    setLoading(false);
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch =
      request.requestor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.target_user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.justification.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || request.request_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  const handleApprove = async () => {
    if (!selectedRequest) return;

    const updatedRequests = requests.map(r =>
      r.id === selectedRequest.id
        ? {
            ...r,
            status: 'approved' as RequestStatus,
            approved_by: 'current-user',
            approver_name: 'Current User',
            approved_at: new Date().toISOString(),
          }
        : r
    );

    setRequests(updatedRequests);
    setIsApproveDialogOpen(false);

    // Send notifications based on request type
    try {
      switch (selectedRequest.request_type) {
        case 'user_creation':
          await notifyUserApproved({
            id: selectedRequest.target_user_id || '',
            email: String(selectedRequest.requested_changes.email || selectedRequest.requestor_email),
            full_name: selectedRequest.target_user_name || String(selectedRequest.requested_changes.full_name || ''),
            role_name: String(selectedRequest.requested_changes.role || ''),
            clearance_level: Number(selectedRequest.requested_changes.clearance_level || 1),
            approved_by: 'Current User',
          });
          break;
        case 'role_change':
          await notifyRoleChanged({
            id: selectedRequest.target_user_id || '',
            email: selectedRequest.requestor_email,
            full_name: selectedRequest.target_user_name || '',
            previous_role: String(selectedRequest.requested_changes.current_role || ''),
            new_role: String(selectedRequest.requested_changes.new_role || ''),
            new_clearance_level: Number(selectedRequest.requested_changes.new_clearance_level || 1),
            changed_by: 'Current User',
          });
          break;
        case 'data_export':
          await notifyExportApproved({
            requestor_id: selectedRequest.requestor_id,
            requestor_email: selectedRequest.requestor_email,
            requestor_name: selectedRequest.requestor_name,
            export_type: String(selectedRequest.requested_changes.export_type || ''),
            export_scope: String(selectedRequest.requested_changes.provinces || selectedRequest.requested_changes.scope || ''),
            export_format: String(selectedRequest.requested_changes.format || ''),
            approved_by: 'Current User',
          });
          break;
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }

    setSelectedRequest(null);

    toast({
      title: 'Request Approved',
      description: `The ${REQUEST_TYPE_CONFIG[selectedRequest.request_type].label.toLowerCase()} request has been approved. Notification sent.`,
    });
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason) return;

    const updatedRequests = requests.map(r =>
      r.id === selectedRequest.id
        ? {
            ...r,
            status: 'rejected' as RequestStatus,
            approved_by: 'current-user',
            approver_name: 'Current User',
            approved_at: new Date().toISOString(),
            rejection_reason: rejectionReason,
          }
        : r
    );

    setRequests(updatedRequests);
    setIsRejectDialogOpen(false);

    // Send rejection notifications
    try {
      switch (selectedRequest.request_type) {
        case 'user_creation':
          await notifyUserRejected({
            email: String(selectedRequest.requested_changes.email || selectedRequest.requestor_email),
            full_name: selectedRequest.target_user_name || String(selectedRequest.requested_changes.full_name || ''),
            rejection_reason: rejectionReason,
          });
          break;
        case 'data_export':
          await notifyExportRejected({
            requestor_email: selectedRequest.requestor_email,
            requestor_name: selectedRequest.requestor_name,
            rejection_reason: rejectionReason,
          });
          break;
        default:
          // For other request types, we could add more specific notifications
          break;
      }
    } catch (error) {
      console.error('Failed to send rejection notification:', error);
    }

    setSelectedRequest(null);
    setRejectionReason('');

    toast({
      title: 'Request Rejected',
      description: `The ${REQUEST_TYPE_CONFIG[selectedRequest.request_type].label.toLowerCase()} request has been rejected. Notification sent.`,
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

  const getExpiryStatus = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const diffDays = Math.ceil((expires.getTime() - now.getTime()) / 86400000);

    if (diffDays < 0) return { text: 'Expired', color: 'text-red-600' };
    if (diffDays <= 1) return { text: 'Expires today', color: 'text-amber-600' };
    if (diffDays <= 3) return { text: `${diffDays} days left`, color: 'text-amber-600' };
    return { text: `${diffDays} days left`, color: 'text-slate-500' };
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderRequestDetails = (request: ApprovalRequest) => {
    const changes = request.requested_changes;

    return (
      <div className="space-y-2 text-sm">
        {Object.entries(changes).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}</span>
            <span className="font-medium">
              {Array.isArray(value) ? value.join(', ') : String(value)}
            </span>
          </div>
        ))}
      </div>
    );
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
          <h1 className="text-2xl font-bold text-slate-900">Approval Workflows</h1>
          <p className="text-slate-500">Review and manage approval requests</p>
        </div>
        <Button variant="outline" onClick={loadRequests}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={pendingCount > 0 ? 'border-amber-200 bg-amber-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending</p>
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
                <p className="text-sm text-slate-500">Approved</p>
                <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
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
              <ClipboardCheck className="h-8 w-8 text-slate-400" />
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
                placeholder="Search requests..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Request Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="user_creation">New User</SelectItem>
                <SelectItem value="role_change">Role Change</SelectItem>
                <SelectItem value="permission_grant">Permission Grant</SelectItem>
                <SelectItem value="data_export">Data Export</SelectItem>
                <SelectItem value="bulk_operation">Bulk Operation</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map(request => {
          const TypeConfig = REQUEST_TYPE_CONFIG[request.request_type];
          const StatusConfig = STATUS_CONFIG[request.status];
          const TypeIcon = TypeConfig.icon;
          const StatusIcon = StatusConfig.icon;
          const expiryStatus = getExpiryStatus(request.expires_at);

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
                        <Badge className={TypeConfig.color}>{TypeConfig.label}</Badge>
                        <Badge className={StatusConfig.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {StatusConfig.label}
                        </Badge>
                        {request.status === 'pending' && (
                          <span className={`text-xs ${expiryStatus.color}`}>
                            {expiryStatus.text}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                        <span>Requested by <strong>{request.requestor_name}</strong></span>
                        {request.target_user_name && (
                          <>
                            <ChevronRight className="h-4 w-4" />
                            <span>for <strong>{request.target_user_name}</strong></span>
                          </>
                        )}
                        <span className="text-slate-400">|</span>
                        <span className="text-slate-400">{formatRelativeTime(request.created_at)}</span>
                      </div>

                      <p className="text-sm text-slate-600 line-clamp-2">
                        {request.justification}
                      </p>

                      {request.status === 'rejected' && request.rejection_reason && (
                        <div className="mt-2 p-2 rounded bg-red-50 border border-red-100">
                          <p className="text-xs text-red-600">
                            <strong>Rejection reason:</strong> {request.rejection_reason}
                          </p>
                        </div>
                      )}

                      {request.status === 'approved' && (
                        <p className="mt-2 text-xs text-green-600">
                          Approved by {request.approver_name} on {formatDate(request.approved_at!)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {request.status === 'pending' && (
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
                          <X className="mr-1 h-4 w-4" />
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
                          <Check className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                      </>
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
              No approval requests found matching your criteria.
            </CardContent>
          </Card>
        )}
      </div>

      {/* View Request Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              Full details of the approval request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <Badge className={REQUEST_TYPE_CONFIG[selectedRequest.request_type].color}>
                  {REQUEST_TYPE_CONFIG[selectedRequest.request_type].label}
                </Badge>
                <Badge className={STATUS_CONFIG[selectedRequest.status].color}>
                  {STATUS_CONFIG[selectedRequest.status].label}
                </Badge>
              </div>

              <div className="p-4 rounded-lg bg-slate-50">
                <h4 className="text-sm font-medium mb-2">Requestor</h4>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{getInitials(selectedRequest.requestor_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedRequest.requestor_name}</p>
                    <p className="text-sm text-slate-500">{selectedRequest.requestor_role}</p>
                  </div>
                </div>
              </div>

              {selectedRequest.target_user_name && (
                <div className="p-4 rounded-lg bg-slate-50">
                  <h4 className="text-sm font-medium mb-2">Target User</h4>
                  <p className="font-medium">{selectedRequest.target_user_name}</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium mb-2">Requested Changes</h4>
                <div className="p-3 rounded-lg border">
                  {renderRequestDetails(selectedRequest)}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Justification</h4>
                <p className="text-sm text-slate-600 p-3 rounded-lg bg-slate-50">
                  {selectedRequest.justification}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Submitted</p>
                  <p className="font-medium">{formatDate(selectedRequest.created_at)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Expires</p>
                  <p className="font-medium">{formatDate(selectedRequest.expires_at)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Required Approver</p>
                  <p className="font-medium capitalize">{selectedRequest.approver_role_required.replace(/_/g, ' ')}</p>
                </div>
                {selectedRequest.approved_by && (
                  <div>
                    <p className="text-slate-500">
                      {selectedRequest.status === 'approved' ? 'Approved By' : 'Rejected By'}
                    </p>
                    <p className="font-medium">{selectedRequest.approver_name}</p>
                  </div>
                )}
              </div>

              {selectedRequest.rejection_reason && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                  <h4 className="text-sm font-medium text-red-800 mb-1">Rejection Reason</h4>
                  <p className="text-sm text-red-600">{selectedRequest.rejection_reason}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {selectedRequest?.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  className="text-red-600"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    setIsRejectDialogOpen(true);
                  }}
                >
                  Reject
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    setIsApproveDialogOpen(true);
                  }}
                >
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Approve Request
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this {REQUEST_TYPE_CONFIG[selectedRequest?.request_type || 'user_creation'].label.toLowerCase()} request
              from {selectedRequest?.requestor_name}?
              {selectedRequest?.target_user_name && (
                <span> This will affect user: <strong>{selectedRequest.target_user_name}</strong></span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleApprove}
            >
              Approve Request
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
              Reject Request
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request. This will be visible to the requestor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="rejection_reason">Rejection Reason *</Label>
              <Textarea
                id="rejection_reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter the reason for rejection..."
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
