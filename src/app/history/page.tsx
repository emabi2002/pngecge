'use client';

import { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  User,
  Clock,
  FileText,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Mock registration history data
const registrationHistory = [
  {
    id: 'hist-001',
    voterId: 'PNG-2027-4521896',
    voterName: 'Michael Toroama',
    province: 'Eastern Highlands',
    ward: 'Asaro 1',
    events: [
      { action: 'Created', timestamp: new Date('2026-01-24T09:15:00'), by: 'OP-EHP-042', device: 'DEV-EHP-001', status: 'success' },
      { action: 'Biometrics Captured', timestamp: new Date('2026-01-24T09:18:00'), by: 'OP-EHP-042', device: 'DEV-EHP-001', details: '4 fingerprints, facial photo', status: 'success' },
      { action: 'GPS Recorded', timestamp: new Date('2026-01-24T09:19:00'), by: 'System', device: 'DEV-EHP-001', details: '-6.0821, 145.3861 (5m accuracy)', status: 'success' },
      { action: 'Synced to Server', timestamp: new Date('2026-01-24T10:30:00'), by: 'System', device: 'DEV-EHP-001', status: 'success' },
      { action: 'Dedup Check Passed', timestamp: new Date('2026-01-24T11:00:00'), by: 'System', details: 'No matches found', status: 'success' },
      { action: 'Approved', timestamp: new Date('2026-01-24T14:30:00'), by: 'SUP-EHP-003', details: 'Auto-approved - all checks passed', status: 'success' },
    ],
  },
  {
    id: 'hist-002',
    voterId: 'PNG-2027-4521898',
    voterName: 'Peter Ipatas',
    province: 'Enga',
    ward: 'Wabag Town',
    events: [
      { action: 'Created', timestamp: new Date('2026-01-24T11:45:00'), by: 'OP-ENG-008', device: 'DEV-ENG-007', status: 'success' },
      { action: 'Biometrics Captured', timestamp: new Date('2026-01-24T11:48:00'), by: 'OP-ENG-008', device: 'DEV-ENG-007', details: '4 fingerprints, facial photo', status: 'success' },
      { action: 'Synced to Server', timestamp: new Date('2026-01-24T14:00:00'), by: 'System', device: 'DEV-ENG-007', status: 'success' },
      { action: 'Dedup Match Detected', timestamp: new Date('2026-01-24T14:30:00'), by: 'System', details: '94.7% match with PNG-2027-3287456', status: 'warning' },
      { action: 'Under Review', timestamp: new Date('2026-01-24T14:31:00'), by: 'System', details: 'Flagged for manual review', status: 'pending' },
    ],
  },
  {
    id: 'hist-003',
    voterId: 'PNG-2027-4521789',
    voterName: 'Mary Kula',
    province: 'Western Highlands',
    ward: 'Kagamuga',
    events: [
      { action: 'Created', timestamp: new Date('2026-01-23T08:30:00'), by: 'OP-WHP-015', device: 'DEV-WHP-002', status: 'success' },
      { action: 'Biometrics Captured', timestamp: new Date('2026-01-23T08:35:00'), by: 'OP-WHP-015', device: 'DEV-WHP-002', details: '2 fingerprints only - worn fingers', status: 'warning' },
      { action: 'Exception Created', timestamp: new Date('2026-01-23T08:36:00'), by: 'OP-WHP-015', device: 'DEV-WHP-002', details: 'Worn fingerprints - agricultural worker', status: 'warning' },
      { action: 'Synced to Server', timestamp: new Date('2026-01-23T12:00:00'), by: 'System', device: 'DEV-WHP-002', status: 'success' },
      { action: 'Exception Reviewed', timestamp: new Date('2026-01-23T14:00:00'), by: 'SUP-WHP-003', details: 'Under supervisor review', status: 'pending' },
      { action: 'Exception Approved', timestamp: new Date('2026-01-23T14:45:00'), by: 'SUP-WHP-003', details: 'Override approved - alternative biometrics captured', status: 'success' },
      { action: 'Registration Approved', timestamp: new Date('2026-01-23T14:46:00'), by: 'SUP-WHP-003', status: 'success' },
    ],
  },
];

function getStatusIcon(status: string) {
  switch (status) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-blue-500" />;
    default:
      return <RefreshCw className="h-4 w-4 text-slate-400" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'success':
      return 'bg-emerald-100 border-emerald-200';
    case 'warning':
      return 'bg-amber-100 border-amber-200';
    case 'error':
      return 'bg-red-100 border-red-200';
    case 'pending':
      return 'bg-blue-100 border-blue-200';
    default:
      return 'bg-slate-100 border-slate-200';
  }
}

export default function RegistrationHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<typeof registrationHistory[0] | null>(null);

  const filteredHistory = registrationHistory.filter((record) =>
    record.voterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.voterId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.province.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Registration History</h2>
          <p className="text-sm text-slate-500">
            View complete registration lifecycle and modification history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            Export History
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Records</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">4,827,341</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-2">
                <History className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Today's Updates</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">12,847</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Status Changes</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">3,421</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Modifications</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">891</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* History List */}
        <div className="lg:col-span-2">
          {/* Search */}
          <div className="mb-4 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder="Search by voter ID, name, or province..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Calendar className="h-4 w-4" />
              Date Range
            </Button>
          </div>

          {/* Records */}
          <Card className="border-slate-200">
            <CardContent className="divide-y divide-slate-100 p-0">
              {filteredHistory.map((record) => (
                <div
                  key={record.id}
                  className={cn(
                    'cursor-pointer p-4 transition-colors hover:bg-slate-50',
                    selectedRecord?.id === record.id && 'bg-emerald-50'
                  )}
                  onClick={() => setSelectedRecord(record)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{record.voterName}</p>
                        <Badge variant="outline" className="font-mono text-xs">{record.voterId}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {record.province} - {record.ward}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        <span>{record.events.length} events</span>
                        <span>|</span>
                        <span>Last: {record.events[record.events.length - 1].action}</span>
                        <span>|</span>
                        <span>{record.events[record.events.length - 1].timestamp.toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {record.events.some(e => e.status === 'pending') && (
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Pending</Badge>
                      )}
                      {record.events.some(e => e.status === 'warning') && !record.events.some(e => e.status === 'pending') && (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Has Warnings</Badge>
                      )}
                      {!record.events.some(e => e.status === 'pending') && !record.events.some(e => e.status === 'warning') && (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Complete</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Timeline Panel */}
        <div>
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Event Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedRecord ? (
                <div className="space-y-4">
                  {/* Voter Info */}
                  <div className="rounded-lg bg-slate-50 p-4">
                    <h4 className="font-medium text-slate-900">{selectedRecord.voterName}</h4>
                    <p className="font-mono text-xs text-slate-500">{selectedRecord.voterId}</p>
                    <p className="mt-1 text-sm text-slate-600">{selectedRecord.province} - {selectedRecord.ward}</p>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-3">
                    {selectedRecord.events.map((event, index) => (
                      <div key={index} className="relative flex gap-3">
                        {/* Timeline line */}
                        {index < selectedRecord.events.length - 1 && (
                          <div className="absolute left-[11px] top-6 h-full w-0.5 bg-slate-200" />
                        )}
                        {/* Event icon */}
                        <div className={cn(
                          'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                          getStatusColor(event.status)
                        )}>
                          {getStatusIcon(event.status)}
                        </div>
                        {/* Event content */}
                        <div className="flex-1 pb-3">
                          <p className="text-sm font-medium text-slate-900">{event.action}</p>
                          {event.details && (
                            <p className="text-xs text-slate-600">{event.details}</p>
                          )}
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>{event.timestamp.toLocaleString()}</span>
                            {event.by && (
                              <>
                                <span>|</span>
                                <span>By: {event.by}</span>
                              </>
                            )}
                            {event.device && (
                              <>
                                <span>|</span>
                                <span>{event.device}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-2">
                    <Button variant="outline" className="w-full gap-1.5 text-xs">
                      <Eye className="h-4 w-4" />
                      View Full Details
                    </Button>
                    <Button variant="outline" className="w-full gap-1.5 text-xs">
                      <Download className="h-4 w-4" />
                      Export Timeline
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-slate-500">
                  Select a record to view timeline
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
