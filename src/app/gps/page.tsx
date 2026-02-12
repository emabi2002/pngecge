'use client';

import { useState } from 'react';
import {
  MapPin,
  Navigation,
  Satellite,
  AlertTriangle,
  CheckCircle,
  Clock,
  Map,
  Target,
  Crosshair,
  Layers,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { CoverageMapDynamic } from '@/components/maps/dynamic-map';

// Mock GPS data by province
const provinceCoverage = [
  { province: 'NCD', fullName: 'National Capital District', coverage: 99.2, registrations: 287654, avgAccuracy: 4.2, status: 'excellent' },
  { province: 'Eastern Highlands', fullName: 'Eastern Highlands', coverage: 94.5, registrations: 412847, avgAccuracy: 8.5, status: 'good' },
  { province: 'Western Highlands', fullName: 'Western Highlands', coverage: 92.1, registrations: 389421, avgAccuracy: 12.3, status: 'good' },
  { province: 'Morobe', fullName: 'Morobe', coverage: 88.7, registrations: 456123, avgAccuracy: 15.2, status: 'moderate' },
  { province: 'East Sepik', fullName: 'East Sepik', coverage: 78.3, registrations: 234567, avgAccuracy: 22.8, status: 'poor' },
  { province: 'Enga', fullName: 'Enga', coverage: 91.4, registrations: 198765, avgAccuracy: 9.8, status: 'good' },
  { province: 'Simbu', fullName: 'Simbu', coverage: 85.2, registrations: 176543, avgAccuracy: 14.5, status: 'moderate' },
  { province: 'Southern Highlands', fullName: 'Southern Highlands', coverage: 82.6, registrations: 312456, avgAccuracy: 18.3, status: 'moderate' },
];

// Mock recent GPS captures
const recentCaptures = [
  { id: 'gps-001', voterId: 'PNG-2027-4521896', lat: -6.0821, lng: 145.3861, accuracy: 5, timestamp: new Date('2026-01-25T10:45:00'), ward: 'Asaro 1', province: 'Eastern Highlands', status: 'verified' },
  { id: 'gps-002', voterId: 'PNG-2027-4521897', lat: -3.5536, lng: 143.6314, accuracy: 8, timestamp: new Date('2026-01-25T10:42:00'), ward: 'Kairiru', province: 'East Sepik', status: 'verified' },
  { id: 'gps-003', voterId: 'PNG-2027-4521898', lat: -5.4897, lng: 143.7189, accuracy: 25, timestamp: new Date('2026-01-25T10:40:00'), ward: 'Wabag Town', province: 'Enga', status: 'low_accuracy' },
  { id: 'gps-004', voterId: 'PNG-2027-4521899', lat: -5.8567, lng: 144.2341, accuracy: 3, timestamp: new Date('2026-01-25T10:38:00'), ward: 'Kagamuga', province: 'Western Highlands', status: 'verified' },
  { id: 'gps-005', voterId: 'PNG-2027-4521900', lat: -5.8678, lng: 142.7654, accuracy: 150, timestamp: new Date('2026-01-25T10:35:00'), ward: 'Tari Town', province: 'Southern Highlands', status: 'out_of_bounds' },
];

function getStatusBadge(status: string) {
  switch (status) {
    case 'excellent':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Excellent</Badge>;
    case 'good':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Good</Badge>;
    case 'moderate':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Moderate</Badge>;
    case 'poor':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Poor</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getAccuracyColor(accuracy: number) {
  if (accuracy <= 10) return 'text-emerald-600';
  if (accuracy <= 25) return 'text-amber-600';
  return 'text-red-600';
}

function getCaptureStatusBadge(status: string) {
  switch (status) {
    case 'verified':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Verified</Badge>;
    case 'low_accuracy':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Low Accuracy</Badge>;
    case 'out_of_bounds':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Out of Bounds</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function GPSCoveragePage() {
  const [selectedProvince, setSelectedProvince] = useState<string | undefined>(undefined);
  const [showRegistrationPoints, setShowRegistrationPoints] = useState(true);
  const [showProvinceCenters, setShowProvinceCenters] = useState(true);
  const [activeTab, setActiveTab] = useState('map');

  const totalRegistrations = provinceCoverage.reduce((sum, p) => sum + p.registrations, 0);
  const avgCoverage = provinceCoverage.reduce((sum, p) => sum + p.coverage, 0) / provinceCoverage.length;
  const avgAccuracy = provinceCoverage.reduce((sum, p) => sum + p.avgAccuracy, 0) / provinceCoverage.length;

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">GPS Coverage</h2>
          <p className="text-sm text-slate-500">
            Monitor GPS capture accuracy and coverage across all provinces
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <Satellite className="h-3 w-3" />
            GPS Active
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Live
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">GPS Coverage</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{avgCoverage.toFixed(1)}%</p>
              </div>
              <div className="rounded-lg bg-emerald-100 p-2">
                <MapPin className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Avg Accuracy</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">{avgAccuracy.toFixed(1)}m</p>
              </div>
              <div className="rounded-lg bg-blue-100 p-2">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Captures</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{totalRegistrations.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-2">
                <Navigation className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Low Accuracy</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">2,341</p>
              </div>
              <div className="rounded-lg bg-amber-100 p-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="map" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="map" className="gap-1.5 text-xs">
            <Map className="h-3.5 w-3.5" />
            Interactive Map
          </TabsTrigger>
          <TabsTrigger value="provinces" className="gap-1.5 text-xs">
            <Layers className="h-3.5 w-3.5" />
            Province View
          </TabsTrigger>
          <TabsTrigger value="captures" className="gap-1.5 text-xs">
            <Crosshair className="h-3.5 w-3.5" />
            Recent Captures
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-4">
            {/* Map */}
            <div className="lg:col-span-3">
              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm font-semibold">
                    <span>Coverage Map - Papua New Guinea</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={showRegistrationPoints ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setShowRegistrationPoints(!showRegistrationPoints)}
                      >
                        <MapPin className="mr-1 h-3 w-3" />
                        Points
                      </Button>
                      <Button
                        variant={showProvinceCenters ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setShowProvinceCenters(!showProvinceCenters)}
                      >
                        <Target className="mr-1 h-3 w-3" />
                        Coverage
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CoverageMapDynamic
                    selectedProvince={selectedProvince}
                    showRegistrationPoints={showRegistrationPoints}
                    showProvinceCenters={showProvinceCenters}
                    height="500px"
                  />

                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-emerald-500" />
                      <span className="text-slate-600">High Accuracy (&lt;10m)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-amber-500" />
                      <span className="text-slate-600">Medium (10-25m)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <span className="text-slate-600">Low (&gt;25m)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-full border-2 border-emerald-500 bg-emerald-500/20" />
                      <span className="text-slate-600">Province Coverage &gt;90%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Province Filter */}
            <div>
              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm font-semibold">
                    <span>Filter by Province</span>
                    {selectedProvince && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => setSelectedProvince(undefined)}
                      >
                        Clear
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {provinceCoverage.map((prov) => (
                    <button
                      key={prov.province}
                      type="button"
                      onClick={() => setSelectedProvince(
                        selectedProvince === prov.fullName ? undefined : prov.fullName
                      )}
                      className={cn(
                        'w-full rounded-lg border p-3 text-left transition-colors',
                        selectedProvince === prov.fullName
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:bg-slate-50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900">{prov.province}</span>
                        {getStatusBadge(prov.status)}
                      </div>
                      <div className="mt-2">
                        <Progress value={prov.coverage} className="h-1.5" />
                        <div className="mt-1 flex justify-between text-xs text-slate-500">
                          <span>{prov.coverage}%</span>
                          <span>{prov.avgAccuracy}m avg</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="provinces" className="mt-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Coverage by Province</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {provinceCoverage.map((prov) => (
                  <div key={prov.province} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{prov.province}</span>
                      {getStatusBadge(prov.status)}
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Coverage</span>
                        <span className="font-semibold">{prov.coverage}%</span>
                      </div>
                      <Progress value={prov.coverage} className="mt-1 h-2" />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-slate-500">Registrations</p>
                        <p className="font-semibold text-slate-900">{prov.registrations.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Avg Accuracy</p>
                        <p className={cn('font-semibold', getAccuracyColor(prov.avgAccuracy))}>
                          {prov.avgAccuracy}m
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="captures" className="mt-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Recent GPS Captures</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Voter ID</th>
                    <th>Coordinates</th>
                    <th>Accuracy</th>
                    <th>Province / Ward</th>
                    <th>Timestamp</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCaptures.map((capture) => (
                    <tr key={capture.id}>
                      <td className="font-mono text-sm">{capture.voterId}</td>
                      <td>
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <Crosshair className="h-3 w-3 text-slate-400" />
                          {capture.lat.toFixed(4)}, {capture.lng.toFixed(4)}
                        </div>
                      </td>
                      <td>
                        <span className={cn('font-semibold', getAccuracyColor(capture.accuracy))}>
                          {capture.accuracy}m
                        </span>
                      </td>
                      <td>
                        <div>
                          <p className="text-sm text-slate-900">{capture.province}</p>
                          <p className="text-xs text-slate-500">{capture.ward}</p>
                        </div>
                      </td>
                      <td className="text-sm text-slate-500">{capture.timestamp.toLocaleTimeString()}</td>
                      <td>{getCaptureStatusBadge(capture.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
