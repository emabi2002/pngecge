'use client';

import { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  Eye,
  MapPin,
  Calendar,
  Fingerprint,
  Camera,
  CheckCircle,
  Printer,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { provinceStats } from '@/lib/mock-data';

// Mock voter data for registry
const registeredVoters = [
  {
    id: 'PNG-2027-4521896',
    firstName: 'Michael',
    lastName: 'Toroama',
    middleName: 'K.',
    dateOfBirth: '1985-03-15',
    gender: 'Male',
    province: 'Eastern Highlands',
    district: 'Goroka',
    llg: 'Gahuku',
    ward: 'Asaro 1',
    pollingPlace: 'Asaro Primary School',
    registeredDate: '2026-01-24',
    status: 'verified',
    biometrics: { facial: true, fingerprint: true, gps: true },
  },
  {
    id: 'PNG-2027-4521897',
    firstName: 'Mary',
    lastName: 'Somare',
    middleName: '',
    dateOfBirth: '1990-07-22',
    gender: 'Female',
    province: 'East Sepik',
    district: 'Wewak',
    llg: 'Wewak Islands',
    ward: 'Kairiru',
    pollingPlace: 'Kairiru Health Center',
    registeredDate: '2026-01-24',
    status: 'verified',
    biometrics: { facial: true, fingerprint: true, gps: true },
  },
  {
    id: 'PNG-2027-4521898',
    firstName: 'Peter',
    lastName: 'Ipatas',
    middleName: 'K.',
    dateOfBirth: '1978-11-08',
    gender: 'Male',
    province: 'Enga',
    district: 'Wabag',
    llg: 'Wabag Urban',
    ward: 'Wabag Town',
    pollingPlace: 'Wabag Secondary School',
    registeredDate: '2026-01-24',
    status: 'pending_dedup',
    biometrics: { facial: true, fingerprint: true, gps: true },
  },
  {
    id: 'PNG-2027-4521899',
    firstName: 'Sarah',
    lastName: 'Kuman',
    middleName: 'L.',
    dateOfBirth: '1992-05-18',
    gender: 'Female',
    province: 'Western Highlands',
    district: 'Hagen',
    llg: 'Kagamuga',
    ward: 'Kagamuga',
    pollingPlace: 'Kagamuga Primary School',
    registeredDate: '2026-01-25',
    status: 'verified',
    biometrics: { facial: true, fingerprint: true, gps: true },
  },
  {
    id: 'PNG-2027-4521900',
    firstName: 'James',
    lastName: 'Marape',
    middleName: '',
    dateOfBirth: '1970-04-24',
    gender: 'Male',
    province: 'Southern Highlands',
    district: 'Tari-Pori',
    llg: 'Tari Urban',
    ward: 'Tari Town',
    pollingPlace: 'Tari District Office',
    registeredDate: '2026-01-25',
    status: 'verified',
    biometrics: { facial: true, fingerprint: true, gps: true },
  },
];

function getStatusBadge(status: string) {
  switch (status) {
    case 'verified':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Verified</Badge>;
    case 'pending_dedup':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending Dedup</Badge>;
    case 'duplicate':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Duplicate</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function VoterRegistryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVoter, setSelectedVoter] = useState<typeof registeredVoters[0] | null>(null);

  const filteredVoters = registeredVoters.filter((voter) => {
    return (
      voter.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voter.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voter.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voter.province.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voter.ward.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalRegistered = provinceStats.reduce((sum, p) => sum + p.registered, 0);
  const totalTarget = provinceStats.reduce((sum, p) => sum + p.target, 0);

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Voter Registry</h2>
          <p className="text-sm text-slate-500">
            Search and browse the national voter registry
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Printer className="h-4 w-4" />
            Print Roll
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Registered</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{totalRegistered.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-emerald-100 p-2">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <div className="mt-3">
              <Progress value={(totalRegistered / totalTarget) * 100} className="h-2" />
              <p className="mt-1 text-xs text-slate-500">
                {((totalRegistered / totalTarget) * 100).toFixed(1)}% of target ({totalTarget.toLocaleString()})
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Verified</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">2,456,789</p>
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
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Provinces</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">22</p>
              </div>
              <div className="rounded-lg bg-blue-100 p-2">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Polling Places</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">11,842</p>
              </div>
              <div className="rounded-lg bg-purple-100 p-2">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Search and List */}
        <div className="lg:col-span-2">
          {/* Search */}
          <div className="mb-4 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder="Search by name, voter ID, province, or ward..."
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

          {/* Voter List */}
          <Card className="border-slate-200">
            <CardContent className="p-0">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Voter ID</th>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Biometrics</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVoters.map((voter) => (
                    <tr
                      key={voter.id}
                      className={cn(
                        'cursor-pointer',
                        selectedVoter?.id === voter.id && 'bg-emerald-50'
                      )}
                      onClick={() => setSelectedVoter(voter)}
                    >
                      <td>
                        <span className="font-mono text-sm text-slate-900">{voter.id}</span>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-slate-900">
                            {voter.firstName} {voter.middleName} {voter.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{voter.gender} | DOB: {voter.dateOfBirth}</p>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="text-sm text-slate-900">{voter.province}</p>
                          <p className="text-xs text-slate-500">{voter.ward}</p>
                        </div>
                      </td>
                      <td>{getStatusBadge(voter.status)}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          {voter.biometrics.facial && (
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-100">
                              <Camera className="h-3 w-3 text-emerald-600" />
                            </div>
                          )}
                          {voter.biometrics.fingerprint && (
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-100">
                              <Fingerprint className="h-3 w-3 text-emerald-600" />
                            </div>
                          )}
                          {voter.biometrics.gps && (
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-100">
                              <MapPin className="h-3 w-3 text-emerald-600" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Voter Details Panel */}
        <div>
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Voter Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedVoter ? (
                <div className="space-y-4">
                  {/* Photo Placeholder */}
                  <div className="flex justify-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-200">
                      <Camera className="h-8 w-8 text-slate-400" />
                    </div>
                  </div>

                  {/* Name and ID */}
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-slate-900">
                      {selectedVoter.firstName} {selectedVoter.middleName} {selectedVoter.lastName}
                    </h3>
                    <p className="font-mono text-sm text-slate-500">{selectedVoter.id}</p>
                    <div className="mt-2">{getStatusBadge(selectedVoter.status)}</div>
                  </div>

                  {/* Personal Info */}
                  <div className="rounded-lg bg-slate-50 p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Personal Information</h4>
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Date of Birth:</span>
                        <span className="font-medium">{selectedVoter.dateOfBirth}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Gender:</span>
                        <span className="font-medium">{selectedVoter.gender}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Registered:</span>
                        <span className="font-medium">{selectedVoter.registeredDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className="rounded-lg border border-slate-200 p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Electoral Location</h4>
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Province:</span>
                        <span className="font-medium">{selectedVoter.province}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">District:</span>
                        <span className="font-medium">{selectedVoter.district}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">LLG:</span>
                        <span className="font-medium">{selectedVoter.llg}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Ward:</span>
                        <span className="font-medium">{selectedVoter.ward}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Polling Place:</span>
                        <span className="font-medium text-right">{selectedVoter.pollingPlace}</span>
                      </div>
                    </div>
                  </div>

                  {/* Biometrics */}
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Biometrics Captured</h4>
                    <div className="mt-3 flex justify-center gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                          <Camera className="h-5 w-5 text-emerald-600" />
                        </div>
                        <span className="mt-1 text-xs text-slate-600">Facial</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                          <Fingerprint className="h-5 w-5 text-emerald-600" />
                        </div>
                        <span className="mt-1 text-xs text-slate-600">Fingerprint</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                          <MapPin className="h-5 w-5 text-emerald-600" />
                        </div>
                        <span className="mt-1 text-xs text-slate-600">GPS</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full gap-1.5 text-xs">
                      <Printer className="h-4 w-4" />
                      Print ID Card
                    </Button>
                    <Button variant="outline" className="w-full gap-1.5 text-xs">
                      <Download className="h-4 w-4" />
                      Export Record
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-slate-500">
                  Select a voter to view details
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
