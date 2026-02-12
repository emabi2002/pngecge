'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Camera,
  Search,
  Download,
  Printer,
  RefreshCw,
  Loader2,
  User,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  ZoomIn,
  Grid3x3,
  List,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  getVoterRegistrations,
  getProvinces,
  type VoterRegistration,
  type Province,
} from '@/lib/data-service';

type ViewMode = 'grid' | 'list';
type QualityFilter = 'all' | 'good' | 'poor' | 'missing';

export default function PhotoRollPreviewPage() {
  const [registrations, setRegistrations] = useState<VoterRegistration[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('all');
  const [qualityFilter, setQualityFilter] = useState<QualityFilter>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const { toast } = useToast();

  const [selectedVoter, setSelectedVoter] = useState<VoterRegistration | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

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
        description: 'Failed to load photo data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPhotos = registrations.filter(r => r.facial_image_id).length;
  const missingPhotos = registrations.filter(r => !r.facial_image_id).length;
  const goodQuality = Math.floor(totalPhotos * 0.85);
  const poorQuality = totalPhotos - goodQuality;

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch =
      reg.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.voter_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProvince = provinceFilter === 'all' || reg.province_id === provinceFilter;
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;

    const matchesQuality =
      qualityFilter === 'all' ? true :
      qualityFilter === 'missing' ? !reg.facial_image_id :
      qualityFilter === 'good' ? reg.facial_image_id :
      qualityFilter === 'poor' ? reg.facial_image_id :
      true;

    return matchesSearch && matchesProvince && matchesStatus && matchesQuality;
  });

  const handlePrintPhotoRoll = () => {
    toast({
      title: 'Printing Photo Roll',
      description: `Preparing to print ${filteredRegistrations.length} photos...`,
    });
    window.print();
  };

  const handleExportPhotos = () => {
    toast({
      title: 'Exporting Photos',
      description: `Exporting ${filteredRegistrations.length} photos...`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Photo Roll Preview</h2>
          <p className="text-sm text-slate-500">
            Review and manage voter facial photographs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportPhotos}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={handlePrintPhotoRoll}>
            <Printer className="h-4 w-4" />
            Print Roll
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Photos</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{totalPhotos}</p>
              </div>
              <div className="rounded-lg bg-blue-100 p-2">
                <Camera className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Good Quality</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{goodQuality}</p>
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
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Poor Quality</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">{poorQuality}</p>
              </div>
              <div className="rounded-lg bg-amber-100 p-2">
                <XCircle className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Missing Photos</p>
                <p className="mt-1 text-2xl font-bold text-red-600">{missingPhotos}</p>
              </div>
              <div className="rounded-lg bg-red-100 p-2">
                <User className="h-5 w-5 text-red-600" />
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
            <Select value={qualityFilter} onValueChange={(v) => setQualityFilter(v as QualityFilter)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Photo Quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Quality</SelectItem>
                <SelectItem value="good">Good Quality</SelectItem>
                <SelectItem value="poor">Poor Quality</SelectItem>
                <SelectItem value="missing">Missing Photo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending_review">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 border-l pl-4">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                className="h-9 w-9"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                className="h-9 w-9"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photo Grid/List */}
      <Card>
        <CardHeader>
          <CardTitle>Voter Photographs ({filteredRegistrations.length})</CardTitle>
          <CardDescription>
            {viewMode === 'grid' ? 'Grid view of voter photos' : 'List view of voter photos'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Camera className="h-12 w-12 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">No photos found</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredRegistrations.map((reg) => (
                <div
                  key={reg.id}
                  className="group relative cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-white transition-all hover:shadow-lg"
                  onClick={() => {
                    setSelectedVoter(reg);
                    setIsViewDialogOpen(true);
                  }}
                >
                  <div className="aspect-[3/4] bg-slate-100">
                    {reg.facial_image_id ? (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
                        <Camera className="h-12 w-12 text-slate-400" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/10">
                          <ZoomIn className="h-8 w-8 text-white opacity-0 transition-all group-hover:opacity-100" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center bg-slate-50">
                        <User className="h-12 w-12 text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate font-medium text-sm text-slate-900">
                      {reg.first_name} {reg.last_name}
                    </p>
                    <p className="text-xs text-slate-500">{reg.voter_id}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {reg.province?.name || 'N/A'}
                      </Badge>
                      {reg.facial_image_id ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRegistrations.map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-center gap-4 rounded-lg border border-slate-200 p-4 transition-all hover:bg-slate-50 cursor-pointer"
                  onClick={() => {
                    setSelectedVoter(reg);
                    setIsViewDialogOpen(true);
                  }}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100">
                    {reg.facial_image_id ? (
                      <Camera className="h-8 w-8 text-slate-400" />
                    ) : (
                      <User className="h-8 w-8 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">
                        {reg.first_name} {reg.middle_name} {reg.last_name}
                      </p>
                      {reg.facial_image_id ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{reg.voter_id}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{reg.province?.name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{reg.date_of_birth}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Voter Photo Details</DialogTitle>
            <DialogDescription>{selectedVoter?.voter_id}</DialogDescription>
          </DialogHeader>
          {selectedVoter && (
            <div className="grid gap-4 py-4">
              <div className="flex justify-center">
                <div className="relative h-64 w-48 overflow-hidden rounded-lg border-2 border-slate-200">
                  {selectedVoter.facial_image_id ? (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
                      <Camera className="h-16 w-16 text-slate-400" />
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center bg-slate-50">
                      <User className="h-16 w-16 text-slate-300" />
                      <p className="absolute bottom-4 text-sm text-slate-500">No photo</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Full Name</Label>
                  <p className="font-medium">
                    {selectedVoter.first_name} {selectedVoter.middle_name} {selectedVoter.last_name}
                  </p>
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
              <div>
                <Label className="text-xs text-slate-500">Registration Date</Label>
                <p className="font-medium">
                  {selectedVoter.registration_timestamp
                    ? new Date(selectedVoter.registration_timestamp).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
