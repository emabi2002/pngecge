'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Camera,
  Fingerprint,
  MapPin,
  AlertCircle,
  RefreshCw,
  Loader2,
  FileText,
  Users,
  CheckSquare,
  Square,
  ChevronDown,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  getVoterRegistrations,
  approveVoter,
  rejectVoter,
  getProvinces,
  type VoterRegistration,
  type Province,
} from '@/lib/data-service';

function getStatusBadge(status: string) {
  switch (status) {
    case 'approved':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Approved</Badge>;
    case 'pending_review':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending Review</Badge>;
    case 'rejected':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Rejected</Badge>;
    case 'exception':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Exception</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getDedupBadge(status: string) {
  switch (status) {
    case 'unique':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Unique</Badge>;
    case 'pending':
      return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Pending</Badge>;
    case 'potential_duplicate':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Potential Dup</Badge>;
    case 'confirmed_duplicate':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Duplicate</Badge>;
    case 'exception_approved':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Exception OK</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function RegistrationReviewPage() {
  const [registrations, setRegistrations] = useState<VoterRegistration[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('pending');
  const [provinceFilter, setProvinceFilter] = useState('all');
  const [dedupFilter, setDedupFilter] = useState('all');
  const { toast } = useToast();

  const [selectedVoter, setSelectedVoter] = useState<VoterRegistration | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isBulkApproveDialogOpen, setIsBulkApproveDialogOpen] = useState(false);
  const [isBulkRejectDialogOpen, setIsBulkRejectDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  // Bulk selection state
  const [selectedVoterIds, setSelectedVoterIds] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [registrationsData, provincesData] = await Promise.all([
        getVoterRegistrations({ limit: 500 }),
        getProvinces(),
      ]);
      setRegistrations(registrationsData);
      setProvinces(provincesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load registration data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingRegistrations = registrations.filter(r => r.status === 'pending_review');
  const approvedCount = registrations.filter(r => r.status === 'approved').length;
  const rejectedCount = registrations.filter(r => r.status === 'rejected' || r.status === 'exception').length;
  const duplicateAlerts = registrations.filter(r => r.dedup_status === 'potential_duplicate' || r.dedup_status === 'confirmed_duplicate').length;

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch =
      reg.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.voter_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProvince = provinceFilter === 'all' || reg.province_id === provinceFilter;
    const matchesDedup = dedupFilter === 'all' || reg.dedup_status === dedupFilter;

    if (selectedTab === 'pending') {
      return matchesSearch && matchesProvince && matchesDedup && reg.status === 'pending_review';
    }
    if (selectedTab === 'approved') {
      return matchesSearch && matchesProvince && matchesDedup && reg.status === 'approved';
    }
    if (selectedTab === 'rejected') {
      return matchesSearch && matchesProvince && matchesDedup && (reg.status === 'rejected' || reg.status === 'exception');
    }
    if (selectedTab === 'duplicates') {
      return matchesSearch && matchesProvince && (reg.dedup_status === 'potential_duplicate' || reg.dedup_status === 'confirmed_duplicate');
    }
    return matchesSearch && matchesProvince && matchesDedup;
  });

  const toggleVoterSelection = (voterId: string) => {
    const newSelection = new Set(selectedVoterIds);
    if (newSelection.has(voterId)) {
      newSelection.delete(voterId);
    } else {
      newSelection.add(voterId);
    }
    setSelectedVoterIds(newSelection);
    setIsAllSelected(newSelection.size === filteredRegistrations.length && filteredRegistrations.length > 0);
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedVoterIds(new Set());
      setIsAllSelected(false);
    } else {
      const allIds = new Set(filteredRegistrations.map(r => r.id));
      setSelectedVoterIds(allIds);
      setIsAllSelected(true);
    }
  };

  const handleApproveVoter = async () => {
    if (!selectedVoter) return;

    setIsSubmitting(true);
    try {
      const updated = await approveVoter(selectedVoter.id);
      if (updated) {
        setRegistrations(registrations.map(r => r.id === selectedVoter.id ? updated : r));
        setIsApproveDialogOpen(false);
        setSelectedVoter(null);
        setApprovalNotes('');
        toast({
          title: 'Registration Approved',
          description: `${selectedVoter.first_name} ${selectedVoter.last_name} has been approved`,
        });
      }
    } catch (error) {
      console.error('Error approving voter:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve registration',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectVoter = async () => {
    if (!selectedVoter || !rejectReason) return;

    setIsSubmitting(true);
    try {
      const updated = await rejectVoter(selectedVoter.id, rejectReason);
      if (updated) {
        setRegistrations(registrations.map(r => r.id === selectedVoter.id ? updated : r));
        setIsRejectDialogOpen(false);
        setSelectedVoter(null);
        setRejectReason('');
        toast({
          title: 'Registration Rejected',
          description: `${selectedVoter.first_name} ${selectedVoter.last_name} has been rejected`,
        });
      }
    } catch (error) {
      console.error('Error rejecting voter:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject registration',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkApprove = async () => {
    setIsSubmitting(true);
    try {
      let successCount = 0;
      for (const voterId of selectedVoterIds) {
        try {
          await approveVoter(voterId);
          successCount++;
        } catch (error) {
          console.error(`Error approving voter ${voterId}:`, error);
        }
      }
      await loadData();
      setSelectedVoterIds(new Set());
      setIsAllSelected(false);
      setIsBulkApproveDialogOpen(false);
      toast({
        title: 'Bulk Approval Complete',
        description: `${successCount} of ${selectedVoterIds.size} registrations approved`,
      });
    } catch (error) {
      console.error('Error in bulk approval:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete bulk approval',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkReject = async () => {
    if (!rejectReason) return;

    setIsSubmitting(true);
    try {
      let successCount = 0;
      for (const voterId of selectedVoterIds) {
        try {
          await rejectVoter(voterId, rejectReason);
          successCount++;
        } catch (error) {
          console.error(`Error rejecting voter ${voterId}:`, error);
        }
      }
      await loadData();
      setSelectedVoterIds(new Set());
      setIsAllSelected(false);
      setIsBulkRejectDialogOpen(false);
      setRejectReason('');
      toast({
        title: 'Bulk Rejection Complete',
        description: `${successCount} of ${selectedVoterIds.size} registrations rejected`,
      });
    } catch (error) {
      console.error('Error in bulk rejection:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete bulk rejection',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Registration Review</h2>
          <p className="text-sm text-slate-500">
            Review and approve pending voter registrations
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

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Pending Review</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">{pendingRegistrations.length}</p>
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
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Approved</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{approvedCount}</p>
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
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Rejected</p>
                <p className="mt-1 text-2xl font-bold text-red-600">{rejectedCount}</p>
              </div>
              <div className="rounded-lg bg-red-100 p-2">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Duplicate Alerts</p>
                <p className="mt-1 text-2xl font-bold text-orange-600">{duplicateAlerts}</p>
              </div>
              <div className="rounded-lg bg-orange-100 p-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
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
                type="search"
                placeholder="Search by name or voter ID..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={provinceFilter} onValueChange={setProvinceFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Provinces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Provinces</SelectItem>
                {provinces.map((province) => (
                  <SelectItem key={province.id} value={province.id}>
                    {province.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dedupFilter} onValueChange={setDedupFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Dedup Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="unique">Unique</SelectItem>
                <SelectItem value="pending">Pending Check</SelectItem>
                <SelectItem value="potential_duplicate">Potential Duplicate</SelectItem>
                <SelectItem value="confirmed_duplicate">Confirmed Duplicate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedVoterIds.size > 0 && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckSquare className="h-5 w-5 text-emerald-600" />
                <p className="font-medium text-emerald-900">
                  {selectedVoterIds.size} registration{selectedVoterIds.size > 1 ? 's' : ''} selected
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedVoterIds(new Set());
                    setIsAllSelected(false);
                  }}
                >
                  Clear Selection
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setIsBulkApproveDialogOpen(true)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve Selected
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setIsBulkRejectDialogOpen(true)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="pending" className="w-full" onValueChange={setSelectedTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="pending" className="text-xs">
            Pending ({pendingRegistrations.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="text-xs">
            Approved ({approvedCount})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="text-xs">
            Rejected ({rejectedCount})
          </TabsTrigger>
          <TabsTrigger value="duplicates" className="text-xs">
            Duplicates ({duplicateAlerts})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          <Card className="border-slate-200">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              ) : filteredRegistrations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <UserCheck className="h-12 w-12 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">No registrations found</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="w-10">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
                      <th>Voter ID</th>
                      <th>Name</th>
                      <th>Province</th>
                      <th>Registration Date</th>
                      <th>Status</th>
                      <th>Dedup</th>
                      <th>Biometrics</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.map((reg) => (
                      <tr key={reg.id} className="group">
                        <td>
                          <Checkbox
                            checked={selectedVoterIds.has(reg.id)}
                            onCheckedChange={() => toggleVoterSelection(reg.id)}
                          />
                        </td>
                        <td>
                          <span className="font-mono text-sm text-slate-900">{reg.voter_id}</span>
                        </td>
                        <td>
                          <div>
                            <p className="font-medium text-slate-900">
                              {reg.first_name} {reg.middle_name || ''} {reg.last_name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {reg.gender === 'male' ? 'M' : 'F'} | DOB: {reg.date_of_birth}
                            </p>
                          </div>
                        </td>
                        <td>
                          <div>
                            <p className="text-sm text-slate-900">{reg.province?.name || 'N/A'}</p>
                            <p className="text-xs text-slate-500">{reg.village_locality || ''}</p>
                          </div>
                        </td>
                        <td>
                          <div>
                            <p className="text-sm text-slate-900">
                              {reg.registration_timestamp
                                ? new Date(reg.registration_timestamp).toLocaleDateString()
                                : 'N/A'}
                            </p>
                          </div>
                        </td>
                        <td>{getStatusBadge(reg.status)}</td>
                        <td>{getDedupBadge(reg.dedup_status)}</td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <div className={`flex h-6 w-6 items-center justify-center rounded ${
                              reg.facial_image_id ? 'bg-emerald-100' : 'bg-slate-100'
                            }`}>
                              <Camera className={`h-3 w-3 ${
                                reg.facial_image_id ? 'text-emerald-600' : 'text-slate-400'
                              }`} />
                            </div>
                            <div className={`flex h-6 w-6 items-center justify-center rounded ${
                              reg.has_fingerprints ? 'bg-emerald-100' : 'bg-slate-100'
                            }`}>
                              <Fingerprint className={`h-3 w-3 ${
                                reg.has_fingerprints ? 'text-emerald-600' : 'text-slate-400'
                              }`} />
                            </div>
                            <div className={`flex h-6 w-6 items-center justify-center rounded ${
                              reg.gps_latitude ? 'bg-emerald-100' : 'bg-slate-100'
                            }`}>
                              <MapPin className={`h-3 w-3 ${
                                reg.gps_latitude ? 'text-emerald-600' : 'text-slate-400'
                              }`} />
                            </div>
                          </div>
                        </td>
                        <td>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedVoter(reg);
                                setIsViewDialogOpen(true);
                              }}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {reg.status === 'pending_review' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedVoter(reg);
                                    setIsApproveDialogOpen(true);
                                  }}>
                                    <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedVoter(reg);
                                    setIsRejectDialogOpen(true);
                                  }}>
                                    <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Voter Registration Details</DialogTitle>
            <DialogDescription>{selectedVoter?.voter_id}</DialogDescription>
          </DialogHeader>
          {selectedVoter && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Full Name</Label>
                  <p className="font-medium">{selectedVoter.first_name} {selectedVoter.middle_name} {selectedVoter.last_name}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Gender</Label>
                  <p className="font-medium capitalize">{selectedVoter.gender}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Date of Birth</Label>
                  <p className="font-medium">{selectedVoter.date_of_birth}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Province</Label>
                  <p className="font-medium">{selectedVoter.province?.name || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedVoter.status)}</div>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Dedup Status</Label>
                  <div className="mt-1">{getDedupBadge(selectedVoter.dedup_status)}</div>
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-500">GPS Coordinates</Label>
                <p className="font-medium font-mono text-sm">
                  {selectedVoter.gps_latitude && selectedVoter.gps_longitude
                    ? `${selectedVoter.gps_latitude}, ${selectedVoter.gps_longitude}`
                    : 'Not captured'}
                </p>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Biometric Data</Label>
                <div className="mt-2 flex gap-4">
                  <div className="flex items-center gap-2">
                    <Camera className={`h-4 w-4 ${selectedVoter.facial_image_id ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="text-sm">{selectedVoter.facial_image_id ? 'Photo' : 'No photo'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Fingerprint className={`h-4 w-4 ${selectedVoter.has_fingerprints ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="text-sm">{selectedVoter.has_fingerprints ? 'Fingerprints' : 'No fingerprints'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
            {selectedVoter?.status === 'pending_review' && (
              <>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    setIsApproveDialogOpen(true);
                  }}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    setIsRejectDialogOpen(true);
                  }}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Approve Registration</DialogTitle>
            <DialogDescription>
              Confirm approval for {selectedVoter?.first_name} {selectedVoter?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="approval_notes">Notes (Optional)</Label>
              <Textarea
                id="approval_notes"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add any approval notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleApproveVoter}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Approving...</> : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Reject Registration</DialogTitle>
            <DialogDescription>Provide a reason for rejection</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reject_reason">Reason *</Label>
              <Textarea
                id="reject_reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleRejectVoter}
              disabled={isSubmitting || !rejectReason}
              variant="destructive"
            >
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Rejecting...</> : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Approve Dialog */}
      <Dialog open={isBulkApproveDialogOpen} onOpenChange={setIsBulkApproveDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Bulk Approve Registrations</DialogTitle>
            <DialogDescription>
              Approve {selectedVoterIds.size} registration{selectedVoterIds.size > 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-amber-50 p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-900">Bulk Approval</p>
                <p className="text-sm text-amber-700">
                  This will approve all selected registrations. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkApproveDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleBulkApprove}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Approving...</> : `Approve ${selectedVoterIds.size}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reject Dialog */}
      <Dialog open={isBulkRejectDialogOpen} onOpenChange={setIsBulkRejectDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Bulk Reject Registrations</DialogTitle>
            <DialogDescription>
              Reject {selectedVoterIds.size} registration{selectedVoterIds.size > 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="bulk_reject_reason">Reason *</Label>
              <Textarea
                id="bulk_reject_reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason for all selected..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkRejectDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleBulkReject}
              disabled={isSubmitting || !rejectReason}
              variant="destructive"
            >
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Rejecting...</> : `Reject ${selectedVoterIds.size}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
