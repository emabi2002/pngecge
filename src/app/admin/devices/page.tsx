'use client';

import { useState } from 'react';
import {
  HardDrive,
  Search,
  Filter,
  Plus,
  Settings,
  RefreshCw,
  Download,
  Upload,
  Wifi,
  WifiOff,
  AlertTriangle,
  Battery,
  MapPin,
  User,
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  Power,
  Key,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Extended device management data
const managedDevices = [
  {
    id: 'DEV-NCD-001',
    deviceName: 'NCD Registration Kit 01',
    model: 'BRS-3000 Pro',
    serialNumber: 'SGT8-NCD-001',
    imei: '356789012345678',
    assignedProvince: 'NCD',
    assignedWard: 'Moresby North-East',
    assignedOperator: 'Janet Ravu',
    operatorId: 'OP-NCD-012',
    status: 'online',
    lastSync: new Date('2026-01-25T10:45:00'),
    lastLocation: { lat: -9.4438, lng: 147.1803 },
    batteryLevel: 85,
    storageUsed: 12.4,
    storageTotal: 128,
    gpsEnabled: true,
    firmwareVersion: '2.1.4',
    securityPatchDate: '2026-01-15',
    registrationCount: 847,
    certificateExpiry: new Date('2027-06-15'),
    enrolled: new Date('2025-08-10'),
  },
  {
    id: 'DEV-EHP-001',
    deviceName: 'EHP Registration Kit 01',
    model: 'BRS-3000 Pro',
    serialNumber: 'SGT8-EHP-001',
    imei: '356789012345679',
    assignedProvince: 'Eastern Highlands',
    assignedWard: 'Asaro 1',
    assignedOperator: 'Tom Wari',
    operatorId: 'OP-EHP-042',
    status: 'online',
    lastSync: new Date('2026-01-25T09:30:00'),
    lastLocation: { lat: -6.0821, lng: 145.3861 },
    batteryLevel: 72,
    storageUsed: 18.7,
    storageTotal: 128,
    gpsEnabled: true,
    firmwareVersion: '2.1.4',
    securityPatchDate: '2026-01-15',
    registrationCount: 1245,
    certificateExpiry: new Date('2027-06-15'),
    enrolled: new Date('2025-07-22'),
  },
  {
    id: 'DEV-ESP-003',
    deviceName: 'ESP Registration Kit 03',
    model: 'BRS-2000',
    serialNumber: 'SGT7-ESP-003',
    imei: '356789012345680',
    assignedProvince: 'East Sepik',
    assignedWard: 'Kairiru',
    assignedOperator: 'David Sana',
    operatorId: 'OP-ESP-015',
    status: 'offline',
    lastSync: new Date('2026-01-24T18:20:00'),
    lastLocation: { lat: -3.5536, lng: 143.6314 },
    batteryLevel: 15,
    storageUsed: 45.2,
    storageTotal: 64,
    gpsEnabled: true,
    firmwareVersion: '2.1.3',
    securityPatchDate: '2025-12-20',
    registrationCount: 523,
    certificateExpiry: new Date('2027-06-15'),
    enrolled: new Date('2025-06-15'),
  },
  {
    id: 'DEV-WHP-002',
    deviceName: 'WHP Registration Kit 02',
    model: 'BRS-3000 Pro',
    serialNumber: 'SGT8-WHP-002',
    imei: '356789012345681',
    assignedProvince: 'Western Highlands',
    assignedWard: 'Kagamuga',
    assignedOperator: 'Lucy Kuman',
    operatorId: 'OP-WHP-023',
    status: 'degraded',
    lastSync: new Date('2026-01-25T08:15:00'),
    lastLocation: { lat: -5.8567, lng: 144.2341 },
    batteryLevel: 45,
    storageUsed: 89.3,
    storageTotal: 128,
    gpsEnabled: false,
    firmwareVersion: '2.1.2',
    securityPatchDate: '2025-11-30',
    registrationCount: 2103,
    certificateExpiry: new Date('2027-06-15'),
    enrolled: new Date('2025-05-20'),
  },
  {
    id: 'DEV-MOR-005',
    deviceName: 'MOR Registration Kit 05',
    model: 'BRS-3000 Pro',
    serialNumber: 'SGT8-MOR-005',
    imei: '356789012345682',
    assignedProvince: 'Morobe',
    assignedWard: 'Lae Urban',
    assignedOperator: 'Unassigned',
    operatorId: null,
    status: 'maintenance',
    lastSync: new Date('2026-01-20T14:00:00'),
    lastLocation: { lat: -6.7319, lng: 147.0012 },
    batteryLevel: 0,
    storageUsed: 0,
    storageTotal: 128,
    gpsEnabled: true,
    firmwareVersion: '2.1.1',
    securityPatchDate: '2025-10-15',
    registrationCount: 1876,
    certificateExpiry: new Date('2027-06-15'),
    enrolled: new Date('2025-04-10'),
  },
];

function getStatusBadge(status: string) {
  switch (status) {
    case 'online':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Online</Badge>;
    case 'offline':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Offline</Badge>;
    case 'degraded':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Degraded</Badge>;
    case 'maintenance':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Maintenance</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'online':
      return <Wifi className="h-4 w-4 text-emerald-500" />;
    case 'offline':
      return <WifiOff className="h-4 w-4 text-red-500" />;
    case 'degraded':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'maintenance':
      return <Settings className="h-4 w-4 text-blue-500" />;
    default:
      return <HardDrive className="h-4 w-4 text-slate-400" />;
  }
}

export default function DeviceManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedDevice, setSelectedDevice] = useState<typeof managedDevices[0] | null>(null);

  const onlineCount = managedDevices.filter(d => d.status === 'online').length;
  const offlineCount = managedDevices.filter(d => d.status === 'offline').length;
  const degradedCount = managedDevices.filter(d => d.status === 'degraded').length;
  const maintenanceCount = managedDevices.filter(d => d.status === 'maintenance').length;

  const filteredDevices = managedDevices.filter((device) => {
    const matchesSearch =
      device.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.assignedWard.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.assignedOperator.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedTab === 'all') return matchesSearch;
    return matchesSearch && device.status === selectedTab;
  });

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Device Management</h2>
          <p className="text-sm text-slate-500">
            Configure, monitor, and manage registration devices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Upload className="h-4 w-4" />
            Push Update
          </Button>
          <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" />
            Enroll Device
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Devices</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{managedDevices.length}</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-2">
                <HardDrive className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Online</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{onlineCount}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Offline</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{offlineCount}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Degraded</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{degradedCount}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Maintenance</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{maintenanceCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Device List */}
        <div className="lg:col-span-2">
          {/* Search and Filter */}
          <div className="mb-4 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder="Search by ID, name, ward, or operator..."
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

          {/* Tabs */}
          <Tabs defaultValue="all" className="w-full" onValueChange={setSelectedTab}>
            <TabsList className="bg-slate-100">
              <TabsTrigger value="all" className="text-xs">All ({managedDevices.length})</TabsTrigger>
              <TabsTrigger value="online" className="text-xs">Online ({onlineCount})</TabsTrigger>
              <TabsTrigger value="offline" className="text-xs">Offline ({offlineCount})</TabsTrigger>
              <TabsTrigger value="maintenance" className="text-xs">Maintenance ({maintenanceCount})</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-4">
              <Card className="border-slate-200">
                <CardContent className="p-0">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Device</th>
                        <th>Location</th>
                        <th>Operator</th>
                        <th>Status</th>
                        <th>Battery</th>
                        <th>Storage</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDevices.map((device) => (
                        <tr
                          key={device.id}
                          className={cn(
                            'cursor-pointer group',
                            selectedDevice?.id === device.id && 'bg-emerald-50'
                          )}
                          onClick={() => setSelectedDevice(device)}
                        >
                          <td>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(device.status)}
                              <div>
                                <p className="font-medium text-slate-900">{device.deviceName}</p>
                                <p className="font-mono text-xs text-slate-500">{device.id}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <p className="text-sm text-slate-900">{device.assignedProvince}</p>
                              <p className="text-xs text-slate-500">{device.assignedWard}</p>
                            </div>
                          </td>
                          <td className="text-sm text-slate-600">{device.assignedOperator}</td>
                          <td>{getStatusBadge(device.status)}</td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <Battery className={cn(
                                'h-4 w-4',
                                device.batteryLevel >= 50 && 'text-emerald-500',
                                device.batteryLevel >= 20 && device.batteryLevel < 50 && 'text-amber-500',
                                device.batteryLevel < 20 && 'text-red-500'
                              )} />
                              <span className="text-sm">{device.batteryLevel}%</span>
                            </div>
                          </td>
                          <td>
                            <div className="w-20">
                              <Progress value={(device.storageUsed / device.storageTotal) * 100} className="h-1.5" />
                              <p className="mt-0.5 text-xs text-slate-500">
                                {device.storageUsed.toFixed(0)}GB / {device.storageTotal}GB
                              </p>
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
                                <DropdownMenuItem>
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Force Sync
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Device
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <User className="mr-2 h-4 w-4" />
                                  Reassign Operator
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Key className="mr-2 h-4 w-4" />
                                  Rotate Certificate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Power className="mr-2 h-4 w-4" />
                                  Remote Lock
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Decommission
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Device Details Panel */}
        <div>
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Device Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDevice ? (
                <div className="space-y-4">
                  {/* Device Info */}
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedDevice.status)}
                      <h4 className="font-medium text-slate-900">{selectedDevice.deviceName}</h4>
                    </div>
                    <p className="font-mono text-xs text-slate-500">{selectedDevice.id}</p>
                    <div className="mt-2">{getStatusBadge(selectedDevice.status)}</div>
                  </div>

                  {/* Hardware Info */}
                  <div className="rounded-lg border border-slate-200 p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Hardware</h4>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Model:</span>
                        <span className="font-medium">{selectedDevice.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Serial:</span>
                        <span className="font-mono text-xs">{selectedDevice.serialNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">IMEI:</span>
                        <span className="font-mono text-xs">{selectedDevice.imei}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Firmware:</span>
                        <span className="font-medium">{selectedDevice.firmwareVersion}</span>
                      </div>
                    </div>
                  </div>

                  {/* Assignment */}
                  <div className="rounded-lg border border-slate-200 p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Assignment</h4>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Province:</span>
                        <span className="font-medium">{selectedDevice.assignedProvince}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ward:</span>
                        <span className="font-medium">{selectedDevice.assignedWard}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Operator:</span>
                        <span className="font-medium">{selectedDevice.assignedOperator}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Enrolled:</span>
                        <span className="font-medium">{selectedDevice.enrolled.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Security */}
                  <div className="rounded-lg border border-slate-200 p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Security</h4>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Security Patch:</span>
                        <span className="font-medium">{selectedDevice.securityPatchDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Certificate Expiry:</span>
                        <span className="font-medium">{selectedDevice.certificateExpiry.toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">GPS Enabled:</span>
                        <span className={cn(
                          'font-medium',
                          selectedDevice.gpsEnabled ? 'text-emerald-600' : 'text-red-600'
                        )}>
                          {selectedDevice.gpsEnabled ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Statistics</h4>
                    <div className="mt-2 text-center">
                      <p className="text-3xl font-bold text-emerald-700">{selectedDevice.registrationCount.toLocaleString()}</p>
                      <p className="text-sm text-emerald-600">Total Registrations</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full gap-1.5 text-xs">
                      <RefreshCw className="h-4 w-4" />
                      Force Sync Now
                    </Button>
                    <Button variant="outline" className="w-full gap-1.5 text-xs">
                      <Download className="h-4 w-4" />
                      Download Logs
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-slate-500">
                  Select a device to view details
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
