'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Search,
  Download,
  Printer,
  RefreshCw,
  Loader2,
  User,
  MapPin,
  QrCode,
  CheckCircle,
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  getVoterRegistrations,
  getProvinces,
  type VoterRegistration,
  type Province,
} from '@/lib/data-service';

type ViewMode = 'preview' | 'list';

export default function IDCardOutputPage() {
  const [registrations, setRegistrations] = useState<VoterRegistration[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('approved');
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const { toast } = useToast();

  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
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
        description: 'Failed to load voter data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const approvedVoters = registrations.filter(r => r.status === 'approved');
  const cardsWithPhotos = approvedVoters.filter(r => r.facial_image_id);
  const cardsReady = cardsWithPhotos.length;
  const cardsPending = approvedVoters.filter(r => !r.facial_image_id).length;

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch =
      reg.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.voter_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProvince = provinceFilter === 'all' || reg.province_id === provinceFilter;
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;

    return matchesSearch && matchesProvince && matchesStatus;
  });

  const toggleCardSelection = (cardId: string) => {
    const newSelection = new Set(selectedCardIds);
    if (newSelection.has(cardId)) {
      newSelection.delete(cardId);
    } else {
      newSelection.add(cardId);
    }
    setSelectedCardIds(newSelection);
    setIsAllSelected(newSelection.size === filteredRegistrations.length && filteredRegistrations.length > 0);
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCardIds(new Set());
      setIsAllSelected(false);
    } else {
      const allIds = new Set(filteredRegistrations.map(r => r.id));
      setSelectedCardIds(allIds);
      setIsAllSelected(true);
    }
  };

  const handlePrintCards = () => {
    const count = selectedCardIds.size > 0 ? selectedCardIds.size : filteredRegistrations.length;
    toast({
      title: 'Printing ID Cards',
      description: `Preparing to print ${count} ID cards...`,
    });
    window.print();
  };

  const handleExportCards = () => {
    const count = selectedCardIds.size > 0 ? selectedCardIds.size : filteredRegistrations.length;
    toast({
      title: 'Exporting ID Cards',
      description: `Exporting ${count} ID cards to PDF...`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Voter ID Card Output</h2>
          <p className="text-sm text-slate-500">
            Generate and print voter identification cards
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportCards}>
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
          <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={handlePrintCards}>
            <Printer className="h-4 w-4" />
            Print Cards
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Approved</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{approvedVoters.length}</p>
              </div>
              <div className="rounded-lg bg-blue-100 p-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Cards Ready</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{cardsReady}</p>
              </div>
              <div className="rounded-lg bg-emerald-100 p-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Pending Photo</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">{cardsPending}</p>
              </div>
              <div className="rounded-lg bg-amber-100 p-2">
                <User className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Selected</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">{selectedCardIds.size}</p>
              </div>
              <div className="rounded-lg bg-blue-100 p-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved Only</SelectItem>
                <SelectItem value="pending_review">Pending</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 border-l pl-4">
              <Button
                variant={viewMode === 'preview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('preview')}
              >
                <Grid3x3 className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="mr-2 h-4 w-4" />
                List
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selection Bar */}
      {selectedCardIds.size > 0 && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox checked={isAllSelected} onCheckedChange={toggleSelectAll} />
                <p className="font-medium text-emerald-900">
                  {selectedCardIds.size} card{selectedCardIds.size > 1 ? 's' : ''} selected
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedCardIds(new Set());
                    setIsAllSelected(false);
                  }}
                >
                  Clear Selection
                </Button>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handlePrintCards}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ID Cards Display */}
      <Card>
        <CardHeader>
          <CardTitle>Voter ID Cards ({filteredRegistrations.length})</CardTitle>
          <CardDescription>
            {viewMode === 'preview' ? 'Card preview mode - Click print to generate cards' : 'List view of voter cards'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="h-12 w-12 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">No voters found</p>
            </div>
          ) : viewMode === 'preview' ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRegistrations.map((reg) => (
                <div
                  key={reg.id}
                  className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                    selectedCardIds.has(reg.id)
                      ? 'border-emerald-500 shadow-lg'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="absolute top-2 right-2 z-10">
                    <Checkbox
                      checked={selectedCardIds.has(reg.id)}
                      onCheckedChange={() => toggleCardSelection(reg.id)}
                    />
                  </div>

                  {/* ID Card */}
                  <div className="aspect-[1.6/1] bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 p-4 text-white">
                    <div className="flex h-full flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold">PAPUA NEW GUINEA</p>
                            <p className="text-xs">Electoral Commission</p>
                          </div>
                          <div className="rounded bg-white/20 px-2 py-1">
                            <p className="text-[10px] font-medium">VOTER ID</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex h-24 w-20 items-center justify-center rounded bg-white/90">
                          <User className="h-12 w-12 text-slate-400" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div>
                            <p className="text-[10px] font-medium opacity-80">NAME</p>
                            <p className="text-sm font-bold leading-tight">
                              {reg.first_name} {reg.last_name}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-medium opacity-80">VOTER ID</p>
                            <p className="font-mono text-xs font-semibold">{reg.voter_id}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <p className="opacity-80">DOB</p>
                              <p className="font-semibold">{reg.date_of_birth}</p>
                            </div>
                            <div>
                              <p className="opacity-80">GENDER</p>
                              <p className="font-semibold uppercase">{reg.gender[0]}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px]">
                        <div>
                          <p className="opacity-80">PROVINCE</p>
                          <p className="font-semibold">{reg.province?.name || 'N/A'}</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-white/90">
                          <QrCode className="h-6 w-6 text-slate-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-10">
                    <Checkbox checked={isAllSelected} onCheckedChange={toggleSelectAll} />
                  </th>
                  <th>Voter ID</th>
                  <th>Name</th>
                  <th>DOB</th>
                  <th>Province</th>
                  <th>Status</th>
                  <th>Photo</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((reg) => (
                  <tr key={reg.id}>
                    <td>
                      <Checkbox
                        checked={selectedCardIds.has(reg.id)}
                        onCheckedChange={() => toggleCardSelection(reg.id)}
                      />
                    </td>
                    <td>
                      <span className="font-mono text-sm">{reg.voter_id}</span>
                    </td>
                    <td>
                      <p className="font-medium">
                        {reg.first_name} {reg.middle_name} {reg.last_name}
                      </p>
                    </td>
                    <td>{reg.date_of_birth}</td>
                    <td>{reg.province?.name || 'N/A'}</td>
                    <td>
                      <Badge
                        className={
                          reg.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }
                      >
                        {reg.status}
                      </Badge>
                    </td>
                    <td>
                      {reg.facial_image_id ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <User className="h-4 w-4 text-slate-400" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
