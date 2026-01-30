'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  UserPlus,
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
  MoreHorizontal,
  RefreshCw,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  getVoterRegistrations,
  createVoterRegistration,
  approveVoter,
  rejectVoter,
  deleteVoterRegistration,
  getProvinces,
  getDistricts,
  generateVoterId,
  type VoterRegistration,
  type Province,
  type District,
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
    case 'draft':
      return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Draft</Badge>;
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

export default function VoterRegistrationPage() {
  const [registrations, setRegistrations] = useState<VoterRegistration[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVoter, setSelectedVoter] = useState<VoterRegistration | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    date_of_birth: '',
    gender: 'male' as 'male' | 'female',
    province_id: '',
    district_id: '',
    village_locality: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [registrationsData, provincesData] = await Promise.all([
        getVoterRegistrations({ limit: 100 }),
        getProvinces(),
      ]);
      setRegistrations(registrationsData);
      setProvinces(provincesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (formData.province_id) {
      getDistricts(formData.province_id).then(setDistricts);
    } else {
      setDistricts([]);
    }
  }, [formData.province_id]);

  const totalCount = registrations.length;
  const pendingCount = registrations.filter(r => r.status === 'pending_review').length;
  const approvedCount = registrations.filter(r => r.status === 'approved').length;
  const exceptionCount = registrations.filter(r => r.status === 'exception' || r.status === 'rejected').length;

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch =
      reg.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.voter_id.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedTab === 'all') return matchesSearch;
    if (selectedTab === 'pending') return matchesSearch && reg.status === 'pending_review';
    if (selectedTab === 'approved') return matchesSearch && reg.status === 'approved';
    if (selectedTab === 'rejected') return matchesSearch && (reg.status === 'rejected' || reg.status === 'exception');
    return matchesSearch;
  });

  const handleCreateVoter = async () => {
    if (!formData.first_name || !formData.last_name || !formData.date_of_birth) return;

    setIsSubmitting(true);
    try {
      const province = provinces.find(p => p.id === formData.province_id);
      const voterId = generateVoterId(province?.code || 'PNG');

      const newVoter = await createVoterRegistration({
        voter_id: voterId,
        first_name: formData.first_name,
        last_name: formData.last_name,
        middle_name: formData.middle_name || undefined,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        province_id: formData.province_id || undefined,
        district_id: formData.district_id || undefined,
        village_locality: formData.village_locality || undefined,
      });

      if (newVoter) {
        setRegistrations([newVoter, ...registrations]);
        setIsCreateDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating voter:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveVoter = async (voter: VoterRegistration) => {
    try {
      const updated = await approveVoter(voter.id);
      if (updated) {
        setRegistrations(registrations.map(r => r.id === voter.id ? updated : r));
      }
    } catch (error) {
      console.error('Error approving voter:', error);
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
      }
    } catch (error) {
      console.error('Error rejecting voter:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVoter = async () => {
    if (!selectedVoter) return;

    setIsSubmitting(true);
    try {
      await deleteVoterRegistration(selectedVoter.id);
      setRegistrations(registrations.filter(r => r.id !== selectedVoter.id));
      setIsDeleteDialogOpen(false);
      setSelectedVoter(null);
    } catch (error) {
      console.error('Error deleting voter:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      middle_name: '',
      date_of_birth: '',
      gender: 'male',
      province_id: '',
      district_id: '',
      village_locality: '',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Voter Registration</h2>
          <p className="text-sm text-slate-500">
            Manage and review voter registrations from field operations
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
          <Button
            size="sm"
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
          >
            <UserPlus className="h-4 w-4" />
            New Registration
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Registrations</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{totalCount.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-emerald-100 p-2">
                <UserPlus className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Pending Review</p>
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
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Exceptions</p>
                <p className="mt-1 text-2xl font-bold text-red-600">{exceptionCount}</p>
              </div>
              <div className="rounded-lg bg-red-100 p-2">
                <XCircle className="h-5 w-5 text-red-600" />
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
            placeholder="Search by name or voter ID..."
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
          <TabsTrigger value="all" className="text-xs">All ({totalCount})</TabsTrigger>
          <TabsTrigger value="pending" className="text-xs">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="approved" className="text-xs">Approved ({approvedCount})</TabsTrigger>
          <TabsTrigger value="rejected" className="text-xs">Rejected ({exceptionCount})</TabsTrigger>
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
                  <UserPlus className="h-12 w-12 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">No registrations found</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Voter ID</th>
                      <th>Name</th>
                      <th>Province</th>
                      <th>Registration Date</th>
                      <th>Status</th>
                      <th>Dedup Status</th>
                      <th>Biometrics</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.map((reg) => (
                      <tr key={reg.id} className="group">
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
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                <MoreHorizontal className="h-4 w-4" />
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
                                  <DropdownMenuItem onClick={() => handleApproveVoter(reg)}>
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
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedVoter(reg);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
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

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>New Voter Registration</DialogTitle>
            <DialogDescription>Enter the voter's information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date_of_birth">Date of Birth *</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value as 'male' | 'female' })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="province">Province</Label>
                <Select
                  value={formData.province_id}
                  onValueChange={(value) => setFormData({ ...formData, province_id: value, district_id: '' })}
                >
                  <SelectTrigger><SelectValue placeholder="Select province" /></SelectTrigger>
                  <SelectContent>
                    {provinces.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="district">District</Label>
                <Select
                  value={formData.district_id}
                  onValueChange={(value) => setFormData({ ...formData, district_id: value })}
                  disabled={!formData.province_id}
                >
                  <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                  <SelectContent>
                    {districts.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="village">Village/Locality</Label>
              <Input
                id="village"
                value={formData.village_locality}
                onChange={(e) => setFormData({ ...formData, village_locality: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateVoter}
              disabled={isSubmitting || !formData.first_name || !formData.last_name || !formData.date_of_birth}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Voter Details</DialogTitle>
            <DialogDescription>{selectedVoter?.voter_id}</DialogDescription>
          </DialogHeader>
          {selectedVoter && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Full Name</Label>
                  <p className="font-medium">{selectedVoter.first_name} {selectedVoter.last_name}</p>
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
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Reject Registration</DialogTitle>
            <DialogDescription>Provide a reason for rejection.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reject_reason">Reason *</Label>
              <Input
                id="reject_reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleRejectVoter}
              disabled={isSubmitting || !rejectReason}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Rejecting...</> : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Registration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedVoter?.first_name} {selectedVoter?.last_name}'s registration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVoter} className="bg-red-600 hover:bg-red-700">
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
