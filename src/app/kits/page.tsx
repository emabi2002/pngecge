'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Tablet,
  Search,
  Filter,
  RefreshCw,
  Battery,
  HardDrive,
  MapPin,
  Wifi,
  WifiOff,
  AlertCircle,
  Clock,
  User,
  MoreHorizontal,
  Plus,
  Loader2,
  Trash2,
  Edit,
  Settings,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
import {
  getDevices,
  createDevice,
  updateDevice,
  updateDeviceStatus,
  deleteDevice,
  generateDeviceId,
  type Device,
} from '@/lib/data-service';

function getStatusBadge(status: string) {
  switch (status) {
    case 'online':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Online</Badge>;
    case 'offline':
      return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Offline</Badge>;
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
      return <WifiOff className="h-4 w-4 text-slate-400" />;
    case 'degraded':
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    case 'maintenance':
      return <Settings className="h-4 w-4 text-blue-500" />;
    default:
      return <WifiOff className="h-4 w-4 text-slate-400" />;
  }
}

function getBatteryColor(level: number) {
  if (level > 60) return 'text-emerald-600';
  if (level > 30) return 'text-amber-600';
  return 'text-red-600';
}

export default function RegistrationKitsPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    device_id: '',
    device_name: '',
    model: '',
    serial_number: '',
    status: 'offline' as Device['status'],
    battery_level: 100,
    storage_used_gb: 0,
    storage_total_gb: 128,
    gps_enabled: true,
    firmware_version: '2.1.4',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDevices();
      setDevices(data);
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onlineCount = devices.filter(d => d.status === 'online').length;
  const offlineCount = devices.filter(d => d.status === 'offline').length;
  const degradedCount = devices.filter(d => d.status === 'degraded' || d.status === 'maintenance').length;

  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      device.device_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.device_id.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedTab === 'all') return matchesSearch;
    if (selectedTab === 'online') return matchesSearch && device.status === 'online';
    if (selectedTab === 'offline') return matchesSearch && device.status === 'offline';
    if (selectedTab === 'issues') return matchesSearch && (device.status === 'degraded' || device.status === 'maintenance');
    return matchesSearch;
  });

  const handleCreateDevice = async () => {
    if (!formData.device_id || !formData.device_name) return;

    setIsSubmitting(true);
    try {
      const newDevice = await createDevice({
        device_id: formData.device_id,
        device_name: formData.device_name,
        model: formData.model || undefined,
        serial_number: formData.serial_number || undefined,
        status: formData.status,
        battery_level: formData.battery_level,
        storage_used_gb: formData.storage_used_gb,
        storage_total_gb: formData.storage_total_gb,
        gps_enabled: formData.gps_enabled,
        firmware_version: formData.firmware_version,
      });

      if (newDevice) {
        setDevices([newDevice, ...devices]);
        setIsCreateDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating device:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDevice = async () => {
    if (!selectedDevice) return;

    setIsSubmitting(true);
    try {
      const updated = await updateDevice(selectedDevice.id, {
        device_name: formData.device_name,
        model: formData.model || undefined,
        status: formData.status,
        battery_level: formData.battery_level,
        storage_used_gb: formData.storage_used_gb,
        gps_enabled: formData.gps_enabled,
        firmware_version: formData.firmware_version,
      });

      if (updated) {
        setDevices(devices.map(d => d.id === selectedDevice.id ? updated : d));
        setIsEditDialogOpen(false);
        setSelectedDevice(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error updating device:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDevice = async () => {
    if (!selectedDevice) return;

    setIsSubmitting(true);
    try {
      await deleteDevice(selectedDevice.id);
      setDevices(devices.filter(d => d.id !== selectedDevice.id));
      setIsDeleteDialogOpen(false);
      setSelectedDevice(null);
    } catch (error) {
      console.error('Error deleting device:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (device: Device, newStatus: Device['status']) => {
    try {
      const updated = await updateDeviceStatus(device.id, newStatus);
      if (updated) {
        setDevices(devices.map(d => d.id === device.id ? updated : d));
      }
    } catch (error) {
      console.error('Error updating device status:', error);
    }
  };

  const openEditDialog = (device: Device) => {
    setSelectedDevice(device);
    setFormData({
      device_id: device.device_id,
      device_name: device.device_name,
      model: device.model || '',
      serial_number: device.serial_number || '',
      status: device.status,
      battery_level: device.battery_level || 100,
      storage_used_gb: device.storage_used_gb || 0,
      storage_total_gb: device.storage_total_gb || 128,
      gps_enabled: device.gps_enabled ?? true,
      firmware_version: device.firmware_version || '2.1.4',
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      device_id: '',
      device_name: '',
      model: '',
      serial_number: '',
      status: 'offline',
      battery_level: 100,
      storage_used_gb: 0,
      storage_total_gb: 128,
      gps_enabled: true,
      firmware_version: '2.1.4',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Registration Kits</h2>
          <p className="text-sm text-slate-500">
            Monitor and manage field registration devices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => {
              resetForm();
              setFormData(prev => ({
                ...prev,
                device_id: generateDeviceId('NEW', devices.length + 1),
              }));
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add Device
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Devices</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{devices.length}</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-2">
                <Tablet className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Online</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{onlineCount}</p>
              </div>
              <div className="rounded-lg bg-emerald-100 p-2">
                <Wifi className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Offline</p>
                <p className="mt-1 text-2xl font-bold text-slate-600">{offlineCount}</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-2">
                <WifiOff className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Issues</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">{degradedCount}</p>
              </div>
              <div className="rounded-lg bg-amber-100 p-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
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
            placeholder="Search by device name or ID..."
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
          <TabsTrigger value="all" className="text-xs">All ({devices.length})</TabsTrigger>
          <TabsTrigger value="online" className="text-xs">Online ({onlineCount})</TabsTrigger>
          <TabsTrigger value="offline" className="text-xs">Offline ({offlineCount})</TabsTrigger>
          <TabsTrigger value="issues" className="text-xs">Issues ({degradedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          <Card className="border-slate-200">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              ) : filteredDevices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Tablet className="h-12 w-12 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">No devices found</p>
                </div>
              ) : (
                <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredDevices.map((device) => (
                    <div key={device.id} className="rounded-lg border border-slate-200 p-4 hover:border-slate-300">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(device.status)}
                          <div>
                            <p className="font-medium text-slate-900">{device.device_name}</p>
                            <p className="text-xs text-slate-500">{device.device_id}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(device)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleStatusChange(device, 'online')}>
                              <Wifi className="mr-2 h-4 w-4 text-emerald-600" />
                              Set Online
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(device, 'offline')}>
                              <WifiOff className="mr-2 h-4 w-4" />
                              Set Offline
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(device, 'maintenance')}>
                              <Settings className="mr-2 h-4 w-4 text-blue-600" />
                              Maintenance Mode
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setSelectedDevice(device);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Status</span>
                          {getStatusBadge(device.status)}
                        </div>
                        {device.battery_level !== undefined && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1 text-slate-500">
                              <Battery className="h-3 w-3" /> Battery
                            </span>
                            <span className={`font-medium ${getBatteryColor(device.battery_level)}`}>
                              {device.battery_level}%
                            </span>
                          </div>
                        )}
                        {device.storage_used_gb !== undefined && device.storage_total_gb && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1 text-slate-500">
                              <HardDrive className="h-3 w-3" /> Storage
                            </span>
                            <span className="font-medium">
                              {device.storage_used_gb}/{device.storage_total_gb} GB
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1 text-slate-500">
                            <MapPin className="h-3 w-3" /> GPS
                          </span>
                          <span className={device.gps_enabled ? 'text-emerald-600' : 'text-slate-400'}>
                            {device.gps_enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        {device.last_sync && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1 text-slate-500">
                              <Clock className="h-3 w-3" /> Last Sync
                            </span>
                            <span className="text-slate-600">
                              {new Date(device.last_sync).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Registrations</span>
                          <span className="font-medium text-slate-900">
                            {(device.registration_count || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Device</DialogTitle>
            <DialogDescription>Register a new field registration device.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="device_id">Device ID *</Label>
                <Input
                  id="device_id"
                  value={formData.device_id}
                  onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="device_name">Device Name *</Label>
                <Input
                  id="device_name"
                  value={formData.device_name}
                  onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="serial">Serial Number</Label>
                <Input
                  id="serial"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as Device['status'] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="degraded">Degraded</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="firmware">Firmware Version</Label>
                <Input
                  id="firmware"
                  value={formData.firmware_version}
                  onChange={(e) => setFormData({ ...formData, firmware_version: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateDevice}
              disabled={isSubmitting || !formData.device_id || !formData.device_name}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Add Device'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>Update device information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_device_name">Device Name *</Label>
              <Input
                id="edit_device_name"
                value={formData.device_name}
                onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_model">Model</Label>
                <Input
                  id="edit_model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as Device['status'] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="degraded">Degraded</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_battery">Battery Level (%)</Label>
                <Input
                  id="edit_battery"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.battery_level}
                  onChange={(e) => setFormData({ ...formData, battery_level: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_firmware">Firmware</Label>
                <Input
                  id="edit_firmware"
                  value={formData.firmware_version}
                  onChange={(e) => setFormData({ ...formData, firmware_version: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleUpdateDevice}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Device?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {selectedDevice?.device_name} from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDevice} className="bg-red-600 hover:bg-red-700">
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
