'use client';

import { useState } from 'react';
import {
  Link2,
  Package,
  Truck,
  Building,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Eye,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Mock chain of custody data
const custodyRecords = [
  {
    id: 'COC-2026-001',
    type: 'device',
    itemId: 'DEV-EHP-001',
    itemName: 'Registration Kit - Eastern Highlands 01',
    currentHolder: 'Tom Wari',
    currentLocation: 'Goroka District Office',
    status: 'in_field',
    chain: [
      { action: 'Issued', from: 'PNGEC HQ Warehouse', to: 'Provincial Office EHP', by: 'Admin', date: new Date('2026-01-10T09:00:00'), signature: 'sig-001' },
      { action: 'Received', from: 'Provincial Office EHP', to: 'Provincial Office EHP', by: 'Provincial RO', date: new Date('2026-01-10T14:30:00'), signature: 'sig-002' },
      { action: 'Assigned', from: 'Provincial Office EHP', to: 'Goroka District Office', by: 'Supervisor', date: new Date('2026-01-15T08:00:00'), signature: 'sig-003' },
      { action: 'Deployed', from: 'Goroka District Office', to: 'Field - Asaro Ward', by: 'Tom Wari', date: new Date('2026-01-20T07:30:00'), signature: 'sig-004' },
    ],
  },
  {
    id: 'COC-2026-002',
    type: 'data_package',
    itemId: 'PKG-2026-00123',
    itemName: 'Registration Data Package - Batch 123',
    currentHolder: 'Provincial Server',
    currentLocation: 'EHP Provincial Data Center',
    status: 'transferred',
    chain: [
      { action: 'Created', from: 'DEV-EHP-001', to: 'Device Storage', by: 'System', date: new Date('2026-01-24T16:00:00'), signature: 'sig-010' },
      { action: 'Encrypted', from: 'Device Storage', to: 'Device Secure Store', by: 'System', date: new Date('2026-01-24T16:01:00'), signature: 'sig-011' },
      { action: 'Synced', from: 'Device', to: 'Provincial Server', by: 'Sync Gateway', date: new Date('2026-01-24T18:30:00'), signature: 'sig-012' },
      { action: 'Verified', from: 'Provincial Server', to: 'Provincial Server', by: 'System', date: new Date('2026-01-24T18:31:00'), signature: 'sig-013' },
      { action: 'Replicated', from: 'Provincial Server', to: 'National BRS', by: 'Sync Gateway', date: new Date('2026-01-24T19:00:00'), signature: 'sig-014' },
    ],
  },
  {
    id: 'COC-2026-003',
    type: 'usb_transfer',
    itemId: 'USB-SEALED-045',
    itemName: 'Sealed USB Drive - Offline Transfer',
    currentHolder: 'Security Officer',
    currentLocation: 'In Transit - Helicopter',
    status: 'in_transit',
    chain: [
      { action: 'Prepared', from: 'Field Location', to: 'Sealed Container', by: 'Field Officer', date: new Date('2026-01-25T06:00:00'), signature: 'sig-020' },
      { action: 'Sealed', from: 'Sealed Container', to: 'Security Bag', by: 'Supervisor', date: new Date('2026-01-25T06:15:00'), signature: 'sig-021' },
      { action: 'Dispatched', from: 'Field Base', to: 'Air Transport', by: 'Security Officer', date: new Date('2026-01-25T07:00:00'), signature: 'sig-022' },
    ],
  },
];

function getStatusBadge(status: string) {
  switch (status) {
    case 'in_field':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">In Field</Badge>;
    case 'transferred':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Transferred</Badge>;
    case 'in_transit':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">In Transit</Badge>;
    case 'returned':
      return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Returned</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'device':
      return <Package className="h-4 w-4" />;
    case 'data_package':
      return <Shield className="h-4 w-4" />;
    case 'usb_transfer':
      return <Truck className="h-4 w-4" />;
    default:
      return <Link2 className="h-4 w-4" />;
  }
}

function getTypeBadge(type: string) {
  switch (type) {
    case 'device':
      return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Device</Badge>;
    case 'data_package':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Data Package</Badge>;
    case 'usb_transfer':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">USB Transfer</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}

export default function ChainOfCustodyPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<typeof custodyRecords[0] | null>(null);

  const filteredRecords = custodyRecords.filter((record) =>
    record.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.itemId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Chain of Custody</h2>
          <p className="text-sm text-slate-500">
            Track custody and transfer of devices, data packages, and materials
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Active Custody</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">1,847</p>
              </div>
              <div className="rounded-lg bg-blue-100 p-2">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">In Transit</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">23</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Transfers Today</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">156</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Verified</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">100%</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Custody Records List */}
        <div className="lg:col-span-2">
          {/* Search */}
          <div className="mb-4 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder="Search by ID, item name, or holder..."
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

          {/* Records */}
          <Card className="border-slate-200">
            <CardContent className="divide-y divide-slate-100 p-0">
              {filteredRecords.map((record) => (
                <div
                  key={record.id}
                  className={cn(
                    'cursor-pointer p-4 transition-colors hover:bg-slate-50',
                    selectedRecord?.id === record.id && 'bg-emerald-50'
                  )}
                  onClick={() => setSelectedRecord(record)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'rounded-lg p-2',
                        record.type === 'device' && 'bg-purple-100 text-purple-600',
                        record.type === 'data_package' && 'bg-blue-100 text-blue-600',
                        record.type === 'usb_transfer' && 'bg-amber-100 text-amber-600'
                      )}>
                        {getTypeIcon(record.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">{record.itemName}</p>
                        </div>
                        <p className="font-mono text-xs text-slate-500">{record.id}</p>
                        <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3 text-slate-400" />
                            {record.currentLocation}
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Holder: {record.currentHolder} | {record.chain.length} transfers
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getTypeBadge(record.type)}
                      {getStatusBadge(record.status)}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Chain Details Panel */}
        <div>
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Chain Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedRecord ? (
                <div className="space-y-4">
                  {/* Item Info */}
                  <div className="rounded-lg bg-slate-50 p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Item Information</h4>
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">ID:</span>
                        <span className="font-mono text-xs">{selectedRecord.itemId}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Type:</span>
                        {getTypeBadge(selectedRecord.type)}
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Status:</span>
                        {getStatusBadge(selectedRecord.status)}
                      </div>
                    </div>
                  </div>

                  {/* Chain Timeline */}
                  <div className="rounded-lg border border-slate-200 p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Transfer Chain</h4>
                    <div className="mt-4 space-y-4">
                      {selectedRecord.chain.map((step, index) => (
                        <div key={index} className="relative flex gap-3">
                          {/* Timeline line */}
                          {index < selectedRecord.chain.length - 1 && (
                            <div className="absolute left-[11px] top-6 h-full w-0.5 bg-slate-200" />
                          )}
                          {/* Step icon */}
                          <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                            <CheckCircle className="h-3 w-3 text-emerald-600" />
                          </div>
                          {/* Step content */}
                          <div className="flex-1 pb-4">
                            <p className="text-sm font-medium text-slate-900">{step.action}</p>
                            <p className="text-xs text-slate-600">
                              {step.from} → {step.to}
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                              <span>By: {step.by}</span>
                              <span>|</span>
                              <span>{step.date.toLocaleString()}</span>
                            </div>
                            <p className="mt-1 font-mono text-[10px] text-slate-400">
                              Sig: {step.signature}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full gap-1.5 text-xs">
                      <Eye className="h-4 w-4" />
                      View Full History
                    </Button>
                    <Button variant="outline" className="w-full gap-1.5 text-xs">
                      <Download className="h-4 w-4" />
                      Export Chain Report
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-slate-500">
                  Select a record to view chain details
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
