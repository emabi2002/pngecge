'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Tablet,
  Plus,
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  Eye,
  Edit,
  MapPin,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Wifi,
  WifiOff,
  Download,
  Upload,
  Settings,
  Fingerprint,
  Camera,
  ScanEye,
  HardDrive,
  Package,
  Wrench,
  Trash2,
  QrCode,
  Map,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Radio,
  Zap,
  X,
  CheckSquare,
  Square,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useToast } from '@/hooks/use-toast';
import {
  type Device,
  type DeviceStats,
  type DeviceStatus,
  type DeviceType,
  type HealthStatus,
  type Connectivity,
  type PaginatedDevices,
  getDevicesPaginated,
  getDeviceStats,
  registerDevice,
  updateDevice,
  deployDevice,
  bulkImportDevices,
  getActiveDeployments,
} from '@/lib/device-service';
import { useDeviceRealtime, type DeviceChangeEvent } from '@/hooks/use-device-realtime';
import { useDebounce } from '@/hooks/use-debounce';
import dynamic from 'next/dynamic';
import { DeviceImport } from '@/components/devices/device-import';
import { DeviceQRCode, BatchQRCode } from '@/components/devices/device-qr-code';
import { DeviceMaintenance, DeviceMaintenancePanel } from '@/components/devices/device-maintenance';
import { DeviceHealthDashboard } from '@/components/devices/device-health-dashboard';

// Dynamically import the map component to avoid SSR issues
const DeviceMap = dynamic(
  () => import('@/components/devices/device-map').then((mod) => mod.DeviceMap),
  { ssr: false, loading: () => <div className="h-[500px] bg-slate-100 rounded-lg flex items-center justify-center">Loading map...</div> }
);

// Status configuration
const STATUS_CONFIG: Record<DeviceStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  NEW_UNREGISTERED: { label: 'New', color: 'bg-blue-100 text-blue-700', icon: Plus },
  REGISTERED_IN_INVENTORY: { label: 'In Inventory', color: 'bg-slate-100 text-slate-700', icon: Package },
  ALLOCATED_TO_REGION: { label: 'Allocated', color: 'bg-purple-100 text-purple-700', icon: MapPin },
  DEPLOYED_TO_SITE: { label: 'Deployed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  IN_MAINTENANCE: { label: 'Maintenance', color: 'bg-amber-100 text-amber-700', icon: Wrench },
  IN_REPAIR: { label: 'Repair', color: 'bg-orange-100 text-orange-700', icon: Settings },
  RETIRED: { label: 'Retired', color: 'bg-slate-100 text-slate-500', icon: XCircle },
  LOST: { label: 'Lost', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  STOLEN: { label: 'Stolen', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  DECOMMISSIONED: { label: 'Decommissioned', color: 'bg-slate-100 text-slate-400', icon: Trash2 },
};

const HEALTH_CONFIG: Record<HealthStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  OK: { label: 'Healthy', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  WARN: { label: 'Warning', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  FAIL: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: XCircle },
  UNKNOWN: { label: 'Unknown', color: 'bg-slate-100 text-slate-500', icon: Clock },
  OFFLINE: { label: 'Offline', color: 'bg-slate-100 text-slate-700', icon: WifiOff },
};

const DEVICE_TYPE_CONFIG: Record<DeviceType, { label: string; icon: typeof Fingerprint }> = {
  fingerprint: { label: 'Fingerprint', icon: Fingerprint },
  face: { label: 'Face', icon: Camera },
  iris: { label: 'Iris', icon: ScanEye },
  multi: { label: 'Multi-modal', icon: HardDrive },
  card_reader: { label: 'Card Reader', icon: HardDrive },
  signature_pad: { label: 'Signature Pad', icon: Edit },
};

// Default stats for when database is empty
const DEFAULT_STATS: DeviceStats = {
  total: 0,
  byStatus: {
    NEW_UNREGISTERED: 0,
    REGISTERED_IN_INVENTORY: 0,
    ALLOCATED_TO_REGION: 0,
    DEPLOYED_TO_SITE: 0,
    IN_MAINTENANCE: 0,
    IN_REPAIR: 0,
    RETIRED: 0,
    LOST: 0,
    STOLEN: 0,
    DECOMMISSIONED: 0,
  },
  byHealth: {
    OK: 0,
    WARN: 0,
    FAIL: 0,
    UNKNOWN: 0,
    OFFLINE: 0,
  },
  byType: {
    fingerprint: 0,
    face: 0,
    iris: 0,
    multi: 0,
    card_reader: 0,
    signature_pad: 0,
  },
  byProvince: {},
  deployed: 0,
  offline24h: 0,
  inMaintenance: 0,
  warrantyExpiringSoon: 0,
};

// Province list for PNG
const PROVINCES = [
  { code: 'ncd', name: 'National Capital District' },
  { code: 'ehp', name: 'Eastern Highlands' },
  { code: 'whp', name: 'Western Highlands' },
  { code: 'morobe', name: 'Morobe' },
  { code: 'esp', name: 'East Sepik' },
  { code: 'wsp', name: 'West Sepik' },
  { code: 'madang', name: 'Madang' },
  { code: 'enbr', name: 'East New Britain' },
  { code: 'wnbr', name: 'West New Britain' },
  { code: 'central', name: 'Central' },
  { code: 'gulf', name: 'Gulf' },
  { code: 'oro', name: 'Northern (Oro)' },
  { code: 'milne', name: 'Milne Bay' },
  { code: 'shp', name: 'Southern Highlands' },
  { code: 'enga', name: 'Enga' },
  { code: 'jiwaka', name: 'Jiwaka' },
  { code: 'hela', name: 'Hela' },
  { code: 'new_ireland', name: 'New Ireland' },
  { code: 'manus', name: 'Manus' },
  { code: 'bougainville', name: 'Autonomous Region of Bougainville' },
  { code: 'western', name: 'Western' },
  { code: 'chimbu', name: 'Chimbu' },
];

// New device form interface
interface NewDeviceForm {
  vendor_serial_number: string;
  asset_tag: string;
  vendor_name: string;
  model: string;
  device_type: DeviceType;
  connectivity: Connectivity;
  firmware_version: string;
  notes: string;
}

// Deploy form interface
interface DeployForm {
  province: string;
  district: string;
  polling_site_name: string;
  station_id: string;
  gps_lat: string;
  gps_lng: string;
  custodian_name: string;
  deployment_purpose: string;
}

export default function DeviceRegistryPage() {
  const { toast } = useToast();

  // Data state
  const [devices, setDevices] = useState<Device[]>([]);
  const [stats, setStats] = useState<DeviceStats>(DEFAULT_STATS);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [retrieving, setRetrieving] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 400); // Debounce search by 400ms
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [provinceFilter, setProvinceFilter] = useState<string>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Selection state for bulk operations
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Dialog state
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isQRCodeDialogOpen, setIsQRCodeDialogOpen] = useState(false);
  const [isBatchQRDialogOpen, setIsBatchQRDialogOpen] = useState(false);
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);
  const [isRetrieveDialogOpen, setIsRetrieveDialogOpen] = useState(false);
  const [selectedDevicesForBatch, setSelectedDevicesForBatch] = useState<Device[]>([]);

  // Form state for new device
  const [newDeviceForm, setNewDeviceForm] = useState<NewDeviceForm>({
    vendor_serial_number: '',
    asset_tag: '',
    vendor_name: '',
    model: '',
    device_type: 'fingerprint',
    connectivity: 'usb',
    firmware_version: '',
    notes: '',
  });

  // Form state for deployment
  const [deployForm, setDeployForm] = useState<DeployForm>({
    province: '',
    district: '',
    polling_site_name: '',
    station_id: '',
    gps_lat: '',
    gps_lng: '',
    custodian_name: '',
    deployment_purpose: '2027 National General Election',
  });

  // Form state for editing device
  const [editDeviceForm, setEditDeviceForm] = useState<{
    asset_tag: string;
    vendor_name: string;
    model: string;
    device_type: DeviceType;
    connectivity: Connectivity;
    firmware_version: string;
    status: DeviceStatus;
    notes: string;
  }>({
    asset_tag: '',
    vendor_name: '',
    model: '',
    device_type: 'fingerprint',
    connectivity: 'usb',
    firmware_version: '',
    status: 'REGISTERED_IN_INVENTORY',
    notes: '',
  });

  // Form state for retrieve device
  const [retrieveForm, setRetrieveForm] = useState<{
    condition: string;
    notes: string;
  }>({
    condition: 'good',
    notes: '',
  });

  // Real-time subscription handlers
  const handleRealtimeInsert = useCallback((device: Device) => {
    console.log('🆕 New device added:', device.vendor_serial_number);
    // Refresh to get updated list and counts
    setTotalCount((prev) => prev + 1);
    // Add to current list if on first page
    if (currentPage === 1) {
      setDevices((prev) => [device, ...prev.slice(0, pageSize - 1)]);
    }
    toast({
      title: 'New Device Registered',
      description: `${device.asset_tag || device.vendor_serial_number} was added to the registry.`,
    });
  }, [currentPage, pageSize, toast]);

  const handleRealtimeUpdate = useCallback((device: Device, oldDevice: Device) => {
    console.log('📝 Device updated:', device.vendor_serial_number);
    // Update the device in the list
    setDevices((prev) =>
      prev.map((d) => d.device_uid === device.device_uid ? device : d)
    );
    // Check if status changed
    if (device.status !== oldDevice.status) {
      toast({
        title: 'Device Status Changed',
        description: `${device.asset_tag || device.vendor_serial_number} is now ${device.status.replace(/_/g, ' ').toLowerCase()}.`,
      });
    } else if (device.last_health_status !== oldDevice.last_health_status) {
      toast({
        title: 'Device Health Updated',
        description: `${device.asset_tag || device.vendor_serial_number} health: ${device.last_health_status}.`,
        variant: device.last_health_status === 'FAIL' ? 'destructive' : 'default',
      });
    }
  }, [toast]);

  const handleRealtimeDelete = useCallback((device: Device) => {
    console.log('🗑️ Device removed:', device.vendor_serial_number);
    // Remove from list
    setDevices((prev) => prev.filter((d) => d.device_uid !== device.device_uid));
    setTotalCount((prev) => Math.max(0, prev - 1));
    toast({
      title: 'Device Removed',
      description: `${device.asset_tag || device.vendor_serial_number} was removed from the registry.`,
      variant: 'destructive',
    });
  }, [toast]);

  // Real-time subscription hook
  const { isConnected: realtimeConnected, eventCount: realtimeEventCount, reconnect: reconnectRealtime } = useDeviceRealtime({
    onInsert: handleRealtimeInsert,
    onUpdate: handleRealtimeUpdate,
    onDelete: handleRealtimeDelete,
    enabled: true,
  });

  // Fetch devices and stats from Supabase
  const fetchData = useCallback(async (showRefreshing = false, resetPage = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      }

      const page = resetPage ? 1 : currentPage;
      if (resetPage) {
        setCurrentPage(1);
      }

      // Fetch devices and stats in parallel
      const [paginatedData, statsData] = await Promise.all([
        getDevicesPaginated({
          status: statusFilter !== 'all' ? statusFilter as DeviceStatus : undefined,
          device_type: typeFilter !== 'all' ? typeFilter as DeviceType : undefined,
          health_status: healthFilter !== 'all' ? healthFilter as HealthStatus : undefined,
          province: provinceFilter !== 'all' ? provinceFilter : undefined,
          search: debouncedSearch || undefined,
          page,
          pageSize,
        }),
        getDeviceStats(),
      ]);

      setDevices(paginatedData.devices);
      setTotalCount(paginatedData.totalCount);
      setTotalPages(paginatedData.totalPages);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching device data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load device data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, typeFilter, healthFilter, provinceFilter, debouncedSearch, currentPage, pageSize, toast]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, typeFilter, healthFilter, provinceFilter, debouncedSearch, pageSize]);

  // Handle refresh button click
  const handleRefresh = () => {
    fetchData(true);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: string) => {
    setPageSize(parseInt(newSize, 10));
    setCurrentPage(1);
  };

  // Handle device registration
  const handleRegisterDevice = async () => {
    if (!newDeviceForm.vendor_serial_number || !newDeviceForm.vendor_name || !newDeviceForm.model) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields (Serial Number, Vendor, Model)',
        variant: 'destructive',
      });
      return;
    }

    try {
      setRegistering(true);

      await registerDevice({
        vendor_serial_number: newDeviceForm.vendor_serial_number,
        vendor_name: newDeviceForm.vendor_name,
        model: newDeviceForm.model,
        device_type: newDeviceForm.device_type,
        connectivity: newDeviceForm.connectivity,
        asset_tag: newDeviceForm.asset_tag || undefined,
        firmware_version: newDeviceForm.firmware_version || undefined,
        notes: newDeviceForm.notes || undefined,
        status: 'REGISTERED_IN_INVENTORY',
        last_health_status: 'UNKNOWN',
      });

      toast({
        title: 'Device Registered',
        description: `Device ${newDeviceForm.vendor_serial_number} has been added to the registry.`,
      });

      // Reset form and close dialog
      setNewDeviceForm({
        vendor_serial_number: '',
        asset_tag: '',
        vendor_name: '',
        model: '',
        device_type: 'fingerprint',
        connectivity: 'usb',
        firmware_version: '',
        notes: '',
      });
      setIsRegisterDialogOpen(false);

      // Refresh data
      fetchData(true);
    } catch (error) {
      console.error('Error registering device:', error);
      toast({
        title: 'Registration Failed',
        description: (error as Error).message || 'Failed to register device. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRegistering(false);
    }
  };

  // Handle device deployment
  const handleDeployDevice = async () => {
    if (!selectedDevice) return;

    if (!deployForm.province || !deployForm.polling_site_name || !deployForm.custodian_name) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields (Province, Polling Site, Custodian)',
        variant: 'destructive',
      });
      return;
    }

    try {
      setDeploying(true);

      const provinceName = PROVINCES.find(p => p.code === deployForm.province)?.name || deployForm.province;

      await deployDevice({
        device_uid: selectedDevice.device_uid,
        province: provinceName,
        district: deployForm.district,
        polling_site_name: deployForm.polling_site_name,
        station_id: deployForm.station_id || undefined,
        gps_lat: deployForm.gps_lat ? parseFloat(deployForm.gps_lat) : undefined,
        gps_lng: deployForm.gps_lng ? parseFloat(deployForm.gps_lng) : undefined,
        gps_capture_method: 'MANUAL_ENTRY',
        deployment_date: new Date().toISOString(),
        deployment_purpose: deployForm.deployment_purpose,
        deployment_status: 'ACTIVE',
      });

      // Also update the device with custodian info
      await updateDevice(selectedDevice.device_uid, {
        current_custodian_name: deployForm.custodian_name,
      });

      toast({
        title: 'Device Deployed',
        description: `Device has been deployed to ${deployForm.polling_site_name}.`,
      });

      // Reset form and close dialog
      setDeployForm({
        province: '',
        district: '',
        polling_site_name: '',
        station_id: '',
        gps_lat: '',
        gps_lng: '',
        custodian_name: '',
        deployment_purpose: '2027 National General Election',
      });
      setIsDeployDialogOpen(false);
      setSelectedDevice(null);

      // Refresh data
      fetchData(true);
    } catch (error) {
      console.error('Error deploying device:', error);
      toast({
        title: 'Deployment Failed',
        description: (error as Error).message || 'Failed to deploy device. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeploying(false);
    }
  };

  // Handle opening edit dialog - populate form with selected device
  const handleOpenEditDialog = (device: Device) => {
    setSelectedDevice(device);
    setEditDeviceForm({
      asset_tag: device.asset_tag || '',
      vendor_name: device.vendor_name,
      model: device.model,
      device_type: device.device_type,
      connectivity: device.connectivity,
      firmware_version: device.firmware_version || '',
      status: device.status,
      notes: device.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  // Handle device edit
  const handleEditDevice = async () => {
    if (!selectedDevice) return;

    if (!editDeviceForm.vendor_name || !editDeviceForm.model) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields (Vendor, Model)',
        variant: 'destructive',
      });
      return;
    }

    try {
      setEditing(true);

      await updateDevice(selectedDevice.device_uid, {
        asset_tag: editDeviceForm.asset_tag || undefined,
        vendor_name: editDeviceForm.vendor_name,
        model: editDeviceForm.model,
        device_type: editDeviceForm.device_type,
        connectivity: editDeviceForm.connectivity,
        firmware_version: editDeviceForm.firmware_version || undefined,
        status: editDeviceForm.status,
        notes: editDeviceForm.notes || undefined,
      });

      toast({
        title: 'Device Updated',
        description: `Device ${selectedDevice.asset_tag || selectedDevice.vendor_serial_number} has been updated.`,
      });

      // Close dialog and reset
      setIsEditDialogOpen(false);
      setSelectedDevice(null);

      // Refresh data
      fetchData(true);
    } catch (error) {
      console.error('Error updating device:', error);
      toast({
        title: 'Update Failed',
        description: (error as Error).message || 'Failed to update device. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setEditing(false);
    }
  };

  // Handle device retrieve
  const handleRetrieveDevice = async () => {
    if (!selectedDevice) return;

    try {
      setRetrieving(true);

      // Update device status back to inventory
      await updateDevice(selectedDevice.device_uid, {
        status: 'REGISTERED_IN_INVENTORY',
        current_province: undefined,
        current_district: undefined,
        current_station_id: undefined,
        current_custodian_id: undefined,
        current_custodian_name: undefined,
        notes: `Retrieved on ${new Date().toLocaleDateString()}. Condition: ${retrieveForm.condition}. ${retrieveForm.notes}`,
      });

      toast({
        title: 'Device Retrieved',
        description: `Device ${selectedDevice.asset_tag || selectedDevice.vendor_serial_number} has been returned to inventory.`,
      });

      // Reset form and close dialog
      setRetrieveForm({ condition: 'good', notes: '' });
      setIsRetrieveDialogOpen(false);
      setSelectedDevice(null);

      // Refresh data
      fetchData(true);
    } catch (error) {
      console.error('Error retrieving device:', error);
      toast({
        title: 'Retrieve Failed',
        description: (error as Error).message || 'Failed to retrieve device. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRetrieving(false);
    }
  };

  // Handle bulk import
  const handleBulkImport = async (importedDevices: any[]) => {
    try {
      const devicesToImport = importedDevices.map((d) => ({
        vendor_serial_number: d.vendor_serial_number,
        vendor_name: d.vendor_name,
        model: d.model,
        device_type: d.device_type as DeviceType,
        connectivity: (d.connectivity || 'usb') as Connectivity,
        firmware_version: d.firmware_version,
        asset_tag: d.asset_tag,
        purchase_batch_id: d.purchase_batch_id,
        warranty_expiry: d.warranty_expiry,
        notes: d.notes,
        status: 'REGISTERED_IN_INVENTORY' as DeviceStatus,
        last_health_status: 'UNKNOWN' as HealthStatus,
      }));

      const result = await bulkImportDevices(devicesToImport);

      // Refresh data after import
      fetchData(true);

      return result;
    } catch (error) {
      console.error('Error during bulk import:', error);
      throw error;
    }
  };

  // Handle export
  const handleExport = () => {
    // Create CSV content
    const headers = ['Asset Tag', 'Serial Number', 'Vendor', 'Model', 'Type', 'Status', 'Health', 'Province', 'District', 'Custodian', 'Last Seen'];
    const rows = devices.map(d => [
      d.asset_tag || '',
      d.vendor_serial_number,
      d.vendor_name,
      d.model,
      d.device_type,
      d.status,
      d.last_health_status,
      d.current_province || '',
      d.current_district || '',
      d.current_custodian_name || '',
      d.last_seen_at || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `device-registry-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: `Exported ${devices.length} devices to CSV.`,
    });
  };

  // Selection handlers for bulk operations
  const handleSelectDevice = (deviceId: string, checked: boolean) => {
    setSelectedDeviceIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(deviceId);
      } else {
        newSet.delete(deviceId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(devices.map((d) => d.device_uid));
      setSelectedDeviceIds(allIds);
      setIsAllSelected(true);
    } else {
      setSelectedDeviceIds(new Set());
      setIsAllSelected(false);
    }
  };

  const clearSelection = () => {
    setSelectedDeviceIds(new Set());
    setIsAllSelected(false);
  };

  // Get selected devices as array
  const selectedDevices = devices.filter((d) => selectedDeviceIds.has(d.device_uid));

  // Bulk export selected devices
  const handleBulkExport = () => {
    if (selectedDevices.length === 0) return;

    const headers = ['Asset Tag', 'Serial Number', 'Vendor', 'Model', 'Type', 'Status', 'Health', 'Province', 'District', 'Custodian', 'Last Seen'];
    const rows = selectedDevices.map(d => [
      d.asset_tag || '',
      d.vendor_serial_number,
      d.vendor_name,
      d.model,
      d.device_type,
      d.status,
      d.last_health_status,
      d.current_province || '',
      d.current_district || '',
      d.current_custodian_name || '',
      d.last_seen_at || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected-devices-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: `Exported ${selectedDevices.length} selected devices to CSV.`,
    });
  };

  // Bulk print QR codes
  const handleBulkPrintQR = () => {
    if (selectedDevices.length === 0) return;
    setSelectedDevicesForBatch(selectedDevices);
    setIsBatchQRDialogOpen(true);
  };

  // Bulk status update
  const handleBulkStatusUpdate = async (newStatus: DeviceStatus) => {
    if (selectedDevices.length === 0) return;

    try {
      setBulkActionLoading(true);

      // Update all selected devices
      const updatePromises = selectedDevices.map((device) =>
        updateDevice(device.device_uid, { status: newStatus })
      );

      await Promise.all(updatePromises);

      toast({
        title: 'Bulk Update Complete',
        description: `Updated ${selectedDevices.length} devices to ${STATUS_CONFIG[newStatus].label}.`,
      });

      // Clear selection and refresh
      clearSelection();
      fetchData(true);
    } catch (error) {
      console.error('Error during bulk update:', error);
      toast({
        title: 'Bulk Update Failed',
        description: 'Some devices could not be updated. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Bulk send to maintenance
  const handleBulkMaintenance = async () => {
    if (selectedDevices.length === 0) return;

    try {
      setBulkActionLoading(true);

      const updatePromises = selectedDevices.map((device) =>
        updateDevice(device.device_uid, {
          status: 'IN_MAINTENANCE',
          notes: `Sent to maintenance on ${new Date().toLocaleDateString()} via bulk action.`,
        })
      );

      await Promise.all(updatePromises);

      toast({
        title: 'Devices Sent to Maintenance',
        description: `${selectedDevices.length} devices have been sent to maintenance.`,
      });

      clearSelection();
      fetchData(true);
    } catch (error) {
      console.error('Error during bulk maintenance:', error);
      toast({
        title: 'Operation Failed',
        description: 'Some devices could not be updated. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Map data for deployed devices
  const mapDevices = devices
    .filter((d) => d.status === 'DEPLOYED_TO_SITE' && d.current_province)
    .map((d) => ({
      device_uid: d.device_uid,
      asset_tag: d.asset_tag,
      vendor_serial_number: d.vendor_serial_number,
      model: d.model,
      device_type: d.device_type,
      health_status: d.last_health_status,
      province: d.current_province!,
      district: d.current_district!,
      polling_site_name: d.current_station_id || 'Unknown Site',
      station_id: d.current_station_id,
      gps_lat: -6.0 + Math.random() * 4, // Will be replaced with real GPS when available
      gps_lng: 143.0 + Math.random() * 8,
      gps_accuracy_m: 10 + Math.random() * 50,
      last_seen_at: d.last_seen_at,
      deployment_status: 'ACTIVE',
    }));

  // Use server-filtered devices directly (pagination is handled server-side)
  // Local filtering is still available for instant feedback on current page
  const filteredDevices = devices;

  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getHealthTrend = (device: Device) => {
    const errorRate = device.total_capture_count > 0
      ? (device.total_error_count / device.total_capture_count) * 100
      : 0;
    if (errorRate < 1) return { trend: 'up', color: 'text-green-600' };
    if (errorRate < 5) return { trend: 'stable', color: 'text-amber-600' };
    return { trend: 'down', color: 'text-red-600' };
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Device Registry</h1>
            <p className="text-slate-500">National biometric device inventory and deployment tracking</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-slate-200 rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <span className="ml-2 text-slate-500">Loading device registry...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Device Registry</h1>
            {/* Real-time connection indicator */}
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                realtimeConnected
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
              onClick={reconnectRealtime}
              title={realtimeConnected ? 'Real-time updates active. Click to reconnect.' : 'Connecting... Click to retry.'}
            >
              {realtimeConnected ? (
                <>
                  <Radio className="h-3 w-3 animate-pulse" />
                  <span>Live</span>
                  {realtimeEventCount > 0 && (
                    <span className="ml-1 bg-emerald-600 text-white px-1.5 rounded-full text-[10px]">
                      {realtimeEventCount}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Radio className="h-3 w-3" />
                  <span>Connecting...</span>
                </>
              )}
            </div>
          </div>
          <p className="text-slate-500">National biometric device inventory and deployment tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import Devices
          </Button>
          <Button variant="outline" onClick={() => {
            setSelectedDevicesForBatch(devices.slice(0, 5));
            setIsBatchQRDialogOpen(true);
          }}>
            <QrCode className="mr-2 h-4 w-4" />
            Print QR Codes
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setIsRegisterDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Register Device
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Devices</p>
                <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
              </div>
              <Tablet className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Deployed</p>
                <p className="text-2xl font-bold text-green-700">{stats.deployed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className={stats.offline24h > 200 ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Offline 24h</p>
                <p className="text-2xl font-bold text-red-600">{stats.offline24h}</p>
              </div>
              <WifiOff className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card className={stats.inMaintenance > 40 ? 'border-amber-200 bg-amber-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">In Maintenance</p>
                <p className="text-2xl font-bold text-amber-600">{stats.inMaintenance}</p>
              </div>
              <Wrench className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Warranty Expiring</p>
                <p className="text-2xl font-bold">{stats.warrantyExpiringSoon}</p>
              </div>
              <Clock className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="inventory" className="gap-1.5">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="deployments" className="gap-1.5">
            <MapPin className="h-4 w-4" />
            Deployments
          </TabsTrigger>
          <TabsTrigger value="health-dashboard" className="gap-1.5">
            <Activity className="h-4 w-4" />
            Health Dashboard
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-1.5">
            <Wrench className="h-4 w-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="map" className="gap-1.5">
            <Map className="h-4 w-4" />
            Map View
          </TabsTrigger>
        </TabsList>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="mt-4 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search by serial, asset tag, model..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(DEVICE_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={healthFilter} onValueChange={setHealthFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Health" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Health</SelectItem>
                    {Object.entries(HEALTH_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Province" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Provinces</SelectItem>
                    {PROVINCES.map((province) => (
                      <SelectItem key={province.code} value={province.name}>{province.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setHealthFilter('all');
                    setProvinceFilter('all');
                    setSearchQuery('');
                  }}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Device Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3 w-12">
                        <Checkbox
                          checked={isAllSelected || (devices.length > 0 && selectedDeviceIds.size === devices.length)}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all devices"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Device</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Health</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Last Seen</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Captures</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredDevices.map((device) => {
                      const StatusConfig = STATUS_CONFIG[device.status];
                      const HealthConfig = HEALTH_CONFIG[device.last_health_status];
                      const TypeConfig = DEVICE_TYPE_CONFIG[device.device_type];
                      const StatusIcon = StatusConfig.icon;
                      const HealthIcon = HealthConfig.icon;
                      const TypeIcon = TypeConfig.icon;
                      const trend = getHealthTrend(device);

                      const isSelected = selectedDeviceIds.has(device.device_uid);

                      return (
                        <tr
                          key={device.device_uid}
                          className={`hover:bg-slate-50 ${isSelected ? 'bg-emerald-50' : ''}`}
                        >
                          <td className="px-4 py-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleSelectDevice(device.device_uid, checked as boolean)}
                              aria-label={`Select ${device.asset_tag || device.vendor_serial_number}`}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-slate-900">{device.asset_tag || device.vendor_serial_number}</p>
                              <p className="text-sm text-slate-500">{device.vendor_name} {device.model}</p>
                              <p className="text-xs text-slate-400 font-mono">{device.vendor_serial_number}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <TypeIcon className="h-4 w-4 text-slate-400" />
                              <span className="text-sm">{TypeConfig.label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={StatusConfig.color}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {StatusConfig.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {device.current_province ? (
                              <div>
                                <p className="text-sm text-slate-900">{device.current_province}</p>
                                <p className="text-xs text-slate-500">{device.current_district}</p>
                                {device.current_station_id && (
                                  <p className="text-xs text-slate-400">{device.current_station_id}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">Not assigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={HealthConfig.color}>
                              <HealthIcon className="mr-1 h-3 w-3" />
                              {HealthConfig.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {device.last_seen_at && new Date(device.last_seen_at) > new Date(Date.now() - 3600000) ? (
                                <Wifi className="h-3 w-3 text-green-500" />
                              ) : (
                                <WifiOff className="h-3 w-3 text-slate-400" />
                              )}
                              <span className="text-sm text-slate-600">
                                {formatRelativeTime(device.last_seen_at)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {device.total_capture_count.toLocaleString()}
                              </span>
                              {trend.trend === 'up' && <TrendingUp className={`h-4 w-4 ${trend.color}`} />}
                              {trend.trend === 'down' && <TrendingDown className={`h-4 w-4 ${trend.color}`} />}
                            </div>
                            <p className="text-xs text-slate-400">
                              {device.total_error_count} errors
                            </p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedDevice(device);
                                  setIsViewDialogOpen(true);
                                }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleOpenEditDialog(device)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Device
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Activity className="mr-2 h-4 w-4" />
                                  Run Diagnostics
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDevice(device);
                                    setIsQRCodeDialogOpen(true);
                                  }}
                                >
                                  <QrCode className="mr-2 h-4 w-4" />
                                  Print QR Code
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {device.status === 'REGISTERED_IN_INVENTORY' && (
                                  <DropdownMenuItem
                                    className="text-emerald-600"
                                    onClick={() => {
                                      setSelectedDevice(device);
                                      setIsDeployDialogOpen(true);
                                    }}
                                  >
                                    <MapPin className="mr-2 h-4 w-4" />
                                    Deploy Device
                                  </DropdownMenuItem>
                                )}
                                {device.status === 'DEPLOYED_TO_SITE' && (
                                  <DropdownMenuItem
                                    className="text-amber-600"
                                    onClick={() => {
                                      setSelectedDevice(device);
                                      setRetrieveForm({ condition: 'good', notes: '' });
                                      setIsRetrieveDialogOpen(true);
                                    }}
                                  >
                                    <Package className="mr-2 h-4 w-4" />
                                    Retrieve Device
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-amber-600"
                                  onClick={() => {
                                    setSelectedDevice(device);
                                    setIsMaintenanceDialogOpen(true);
                                  }}
                                >
                                  <Wrench className="mr-2 h-4 w-4" />
                                  Send to Maintenance
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredDevices.length === 0 && !loading && (
                <div className="p-8 text-center text-slate-500">
                  {devices.length === 0 ? (
                    <div>
                      <Tablet className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                      <p className="text-lg font-medium">No devices in registry</p>
                      <p className="text-sm">Register your first device or import devices from CSV.</p>
                      <div className="mt-4 flex justify-center gap-2">
                        <Button onClick={() => setIsRegisterDialogOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Register Device
                        </Button>
                        <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                          <Upload className="mr-2 h-4 w-4" />
                          Import CSV
                        </Button>
                      </div>
                    </div>
                  ) : (
                    'No devices found matching your criteria.'
                  )}
                </div>
              )}

              {/* Pagination */}
              {totalCount > 0 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span>Rows per page:</span>
                      <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                        <SelectTrigger className="h-8 w-[70px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <span className="text-sm text-slate-500">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount.toLocaleString()} devices
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1 || refreshing}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || refreshing}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1 mx-2">
                      {totalPages <= 7 ? (
                        // Show all pages if 7 or less
                        [...Array(totalPages)].map((_, i) => (
                          <Button
                            key={i + 1}
                            variant={currentPage === i + 1 ? 'default' : 'outline'}
                            size="sm"
                            className={`h-8 w-8 ${currentPage === i + 1 ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                            onClick={() => handlePageChange(i + 1)}
                            disabled={refreshing}
                          >
                            {i + 1}
                          </Button>
                        ))
                      ) : (
                        // Show smart pagination for many pages
                        <>
                          <Button
                            variant={currentPage === 1 ? 'default' : 'outline'}
                            size="sm"
                            className={`h-8 w-8 ${currentPage === 1 ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                            onClick={() => handlePageChange(1)}
                            disabled={refreshing}
                          >
                            1
                          </Button>

                          {currentPage > 3 && (
                            <span className="px-2 text-slate-400">...</span>
                          )}

                          {currentPage > 2 && currentPage < totalPages - 1 && (
                            <>
                              {currentPage > 2 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8"
                                  onClick={() => handlePageChange(currentPage - 1)}
                                  disabled={refreshing}
                                >
                                  {currentPage - 1}
                                </Button>
                              )}
                              <Button
                                variant="default"
                                size="sm"
                                className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700"
                                disabled={refreshing}
                              >
                                {currentPage}
                              </Button>
                              {currentPage < totalPages - 1 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8"
                                  onClick={() => handlePageChange(currentPage + 1)}
                                  disabled={refreshing}
                                >
                                  {currentPage + 1}
                                </Button>
                              )}
                            </>
                          )}

                          {currentPage === 2 && (
                            <Button
                              variant="default"
                              size="sm"
                              className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700"
                              disabled={refreshing}
                            >
                              2
                            </Button>
                          )}

                          {currentPage === totalPages - 1 && (
                            <Button
                              variant="default"
                              size="sm"
                              className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700"
                              disabled={refreshing}
                            >
                              {totalPages - 1}
                            </Button>
                          )}

                          {currentPage < totalPages - 2 && (
                            <span className="px-2 text-slate-400">...</span>
                          )}

                          <Button
                            variant={currentPage === totalPages ? 'default' : 'outline'}
                            size="sm"
                            className={`h-8 w-8 ${currentPage === totalPages ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                            onClick={() => handlePageChange(totalPages)}
                            disabled={refreshing}
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || refreshing}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages || refreshing}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deployments Tab */}
        <TabsContent value="deployments" className="mt-4">
          <div className="space-y-4">
            {/* Deployment Status Summary */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Ready for Deployment</p>
                      <p className="text-2xl font-semibold">{filteredDevices.filter(d => d.status === 'ALLOCATED_TO_REGION').length}</p>
                    </div>
                    <Package className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">In Maintenance</p>
                      <p className="text-2xl font-semibold">{filteredDevices.filter(d => d.status === 'IN_MAINTENANCE' || d.status === 'IN_REPAIR').length}</p>
                    </div>
                    <Wrench className="h-8 w-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Active Deployments</p>
                      <p className="text-2xl font-semibold">{filteredDevices.filter(d => d.status === 'DEPLOYED_TO_SITE').length}</p>
                    </div>
                    <MapPin className="h-8 w-8 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Retired/Lost</p>
                      <p className="text-2xl font-semibold">{filteredDevices.filter(d => d.status === 'RETIRED' || d.status === 'LOST' || d.status === 'STOLEN').length}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Devices Ready for Deployment */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Devices Ready for Deployment</CardTitle>
                    <CardDescription>Allocated devices awaiting deployment to field locations</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (selectedDeviceIds.size === 0) {
                        toast({
                          title: 'No devices selected',
                          description: 'Please select devices from the Inventory tab first',
                          variant: 'destructive',
                        });
                      } else {
                        // Open bulk allocation dialog
                        setIsBulkActionOpen(true);
                      }
                    }}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Bulk Allocate
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {filteredDevices.filter(d => d.status === 'ALLOCATED_TO_REGION').map((device) => (
                    <div key={device.device_uid} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center h-10 w-10 rounded bg-blue-100">
                          <Tablet className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{device.asset_tag}</p>
                          <p className="text-sm text-slate-500">{device.model} • {device.vendor_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                          {device.current_province || 'Unassigned'}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <MapPin className="h-4 w-4 mr-1" />
                          Deploy
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredDevices.filter(d => d.status === 'ALLOCATED_TO_REGION').length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                      <Package className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                      <p className="text-lg font-medium">No devices ready for deployment</p>
                      <p className="text-sm">Allocate devices from the Inventory tab to prepare for deployment.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Active Deployments */}
            <Card>
              <CardHeader>
                <CardTitle>Active Deployments</CardTitle>
                <CardDescription>Devices currently deployed to field locations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredDevices.filter(d => d.status === 'DEPLOYED_TO_SITE').map((device) => (
                    <Card key={device.device_uid} className="border-slate-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium">{device.asset_tag}</p>
                            <p className="text-sm text-slate-500">{device.model}</p>
                          </div>
                          <Badge className={HEALTH_CONFIG[device.last_health_status].color}>
                            {HEALTH_CONFIG[device.last_health_status].label}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <span>{device.current_province}, {device.current_district}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <HardDrive className="h-4 w-4 text-slate-400" />
                            <span>{device.current_station_id}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span>Last seen: {formatRelativeTime(device.last_seen_at)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredDevices.filter(d => d.status === 'DEPLOYED_TO_SITE').length === 0 && (
                    <div className="col-span-full p-8 text-center text-slate-500">
                      <MapPin className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                      <p className="text-lg font-medium">No active deployments</p>
                      <p className="text-sm">Deploy devices from the ready list above.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Deployment Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Deployment Activity</CardTitle>
                <CardDescription>Latest deployment and retrieval actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredDevices
                    .filter(d => d.status === 'DEPLOYED_TO_SITE' || d.status === 'ALLOCATED_TO_REGION' || d.status === 'IN_MAINTENANCE')
                    .slice(0, 5)
                    .map((device) => (
                      <div key={device.device_uid} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center h-8 w-8 rounded ${
                            device.status === 'DEPLOYED_TO_SITE' ? 'bg-emerald-100' :
                            device.status === 'ALLOCATED_TO_REGION' ? 'bg-blue-100' : 'bg-amber-100'
                          }`}>
                            {device.status === 'DEPLOYED_TO_SITE' ? (
                              <MapPin className="h-4 w-4 text-emerald-600" />
                            ) : device.status === 'ALLOCATED_TO_REGION' ? (
                              <Package className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Wrench className="h-4 w-4 text-amber-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{device.asset_tag}</p>
                            <p className="text-sm text-slate-500">
                              {device.status === 'DEPLOYED_TO_SITE' ? 'Deployed' :
                               device.status === 'ALLOCATED_TO_REGION' ? 'Allocated' : 'In maintenance'} • {device.current_province || 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400">{formatRelativeTime(device.updated_at)}</p>
                      </div>
                    ))}
                  {filteredDevices.filter(d => d.status === 'DEPLOYED_TO_SITE' || d.status === 'ALLOCATED_TO_REGION' || d.status === 'IN_MAINTENANCE').length === 0 && (
                    <div className="p-6 text-center text-slate-500">
                      <Activity className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                      <p className="text-sm">No recent deployment activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Health Dashboard Tab */}
        <TabsContent value="health-dashboard" className="mt-4">
          <DeviceHealthDashboard />
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="mt-4">
          <DeviceMaintenancePanel />
        </TabsContent>

        {/* Map Tab */}
        <TabsContent value="map" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Device Deployment Map</CardTitle>
              <CardDescription>Geographic distribution of deployed devices across Papua New Guinea</CardDescription>
            </CardHeader>
            <CardContent>
              <DeviceMap
                devices={mapDevices}
                onDeviceSelect={(device) => {
                  const fullDevice = devices.find((d) => d.device_uid === device.device_uid);
                  if (fullDevice) {
                    setSelectedDevice(fullDevice);
                    setIsViewDialogOpen(true);
                  }
                }}
                className="mb-4"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Device Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Device Details</DialogTitle>
            <DialogDescription>
              {selectedDevice?.asset_tag || selectedDevice?.vendor_serial_number}
            </DialogDescription>
          </DialogHeader>

          {selectedDevice && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Vendor</p>
                  <p className="font-medium">{selectedDevice.vendor_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Model</p>
                  <p className="font-medium">{selectedDevice.model}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Serial Number</p>
                  <p className="font-medium font-mono">{selectedDevice.vendor_serial_number}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Asset Tag</p>
                  <p className="font-medium">{selectedDevice.asset_tag || 'Not assigned'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Firmware Version</p>
                  <p className="font-medium">{selectedDevice.firmware_version || 'Unknown'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Device Type</p>
                  <p className="font-medium">{DEVICE_TYPE_CONFIG[selectedDevice.device_type].label}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Status</p>
                  <Badge className={STATUS_CONFIG[selectedDevice.status].color}>
                    {STATUS_CONFIG[selectedDevice.status].label}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Health</p>
                  <Badge className={HEALTH_CONFIG[selectedDevice.last_health_status].color}>
                    {HEALTH_CONFIG[selectedDevice.last_health_status].label}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Location</p>
                  <p className="font-medium">
                    {selectedDevice.current_province ?
                      `${selectedDevice.current_province}, ${selectedDevice.current_district}` :
                      'Not assigned'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Custodian</p>
                  <p className="font-medium">{selectedDevice.current_custodian_name || 'Not assigned'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-600">
                    {selectedDevice.total_capture_count.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">Total Captures</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    {selectedDevice.total_error_count}
                  </p>
                  <p className="text-xs text-slate-500">Errors</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold">
                    {selectedDevice.total_capture_count > 0
                      ? ((1 - selectedDevice.total_error_count / selectedDevice.total_capture_count) * 100).toFixed(1)
                      : 0}%
                  </p>
                  <p className="text-xs text-slate-500">Success Rate</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Activity className="mr-2 h-4 w-4" />
              Run Diagnostics
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Register Device Dialog */}
      <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Register New Device</DialogTitle>
            <DialogDescription>
              Add a new biometric device to the national registry
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Serial Number *</Label>
                <Input
                  placeholder="e.g., FP-2024-001234"
                  value={newDeviceForm.vendor_serial_number}
                  onChange={(e) => setNewDeviceForm(prev => ({ ...prev, vendor_serial_number: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Asset Tag</Label>
                <Input
                  placeholder="e.g., PNGEC-FP-0001"
                  value={newDeviceForm.asset_tag}
                  onChange={(e) => setNewDeviceForm(prev => ({ ...prev, asset_tag: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor *</Label>
                <Select
                  value={newDeviceForm.vendor_name}
                  onValueChange={(value) => setNewDeviceForm(prev => ({ ...prev, vendor_name: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Suprema">Suprema</SelectItem>
                    <SelectItem value="Crossmatch">Crossmatch</SelectItem>
                    <SelectItem value="HID Global">HID Global</SelectItem>
                    <SelectItem value="IrisGuard">IrisGuard</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Model *</Label>
                <Input
                  placeholder="e.g., BioMini Plus 2"
                  value={newDeviceForm.model}
                  onChange={(e) => setNewDeviceForm(prev => ({ ...prev, model: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Device Type *</Label>
                <Select
                  value={newDeviceForm.device_type}
                  onValueChange={(value) => setNewDeviceForm(prev => ({ ...prev, device_type: value as DeviceType }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DEVICE_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Connectivity</Label>
                <Select
                  value={newDeviceForm.connectivity}
                  onValueChange={(value) => setNewDeviceForm(prev => ({ ...prev, connectivity: value as Connectivity }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usb">USB</SelectItem>
                    <SelectItem value="wireless">Wireless</SelectItem>
                    <SelectItem value="bluetooth">Bluetooth</SelectItem>
                    <SelectItem value="ethernet">Ethernet</SelectItem>
                    <SelectItem value="both">Multiple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Firmware Version</Label>
              <Input
                placeholder="e.g., 2.1.4"
                value={newDeviceForm.firmware_version}
                onChange={(e) => setNewDeviceForm(prev => ({ ...prev, firmware_version: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes about this device..."
                rows={3}
                value={newDeviceForm.notes}
                onChange={(e) => setNewDeviceForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRegisterDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleRegisterDevice}
              disabled={registering}
            >
              {registering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register Device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deploy Device Dialog */}
      <Dialog open={isDeployDialogOpen} onOpenChange={setIsDeployDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Deploy Device</DialogTitle>
            <DialogDescription>
              Deploy {selectedDevice?.asset_tag || selectedDevice?.vendor_serial_number} to a field location
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Province *</Label>
                <Select
                  value={deployForm.province}
                  onValueChange={(value) => setDeployForm(prev => ({ ...prev, province: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCES.map((province) => (
                      <SelectItem key={province.code} value={province.code}>{province.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>District</Label>
                <Input
                  placeholder="Enter district name"
                  value={deployForm.district}
                  onChange={(e) => setDeployForm(prev => ({ ...prev, district: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Polling Site Name *</Label>
              <Input
                placeholder="e.g., Asaro Primary School"
                value={deployForm.polling_site_name}
                onChange={(e) => setDeployForm(prev => ({ ...prev, polling_site_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Station ID</Label>
              <Input
                placeholder="e.g., EHP-GOR-001"
                value={deployForm.station_id}
                onChange={(e) => setDeployForm(prev => ({ ...prev, station_id: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>GPS Latitude</Label>
                <Input
                  placeholder="-6.0733"
                  type="number"
                  step="any"
                  value={deployForm.gps_lat}
                  onChange={(e) => setDeployForm(prev => ({ ...prev, gps_lat: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>GPS Longitude</Label>
                <Input
                  placeholder="145.3858"
                  type="number"
                  step="any"
                  value={deployForm.gps_lng}
                  onChange={(e) => setDeployForm(prev => ({ ...prev, gps_lng: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <MapPin className="mr-2 h-4 w-4" />
                Capture GPS
              </Button>
              <Button variant="outline" className="flex-1">
                <Map className="mr-2 h-4 w-4" />
                Select on Map
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Custodian Name *</Label>
              <Input
                placeholder="Person responsible for this device"
                value={deployForm.custodian_name}
                onChange={(e) => setDeployForm(prev => ({ ...prev, custodian_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Deployment Purpose</Label>
              <Input
                placeholder="e.g., 2027 National General Election"
                value={deployForm.deployment_purpose}
                onChange={(e) => setDeployForm(prev => ({ ...prev, deployment_purpose: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeployDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleDeployDevice}
              disabled={deploying}
            >
              {deploying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <MapPin className="mr-2 h-4 w-4" />
              Deploy Device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Device Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>
              Update device information for {selectedDevice?.asset_tag || selectedDevice?.vendor_serial_number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Serial Number</Label>
                <Input
                  value={selectedDevice?.vendor_serial_number || ''}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-400">Serial number cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label>Asset Tag</Label>
                <Input
                  placeholder="e.g., PNGEC-FP-0001"
                  value={editDeviceForm.asset_tag}
                  onChange={(e) => setEditDeviceForm(prev => ({ ...prev, asset_tag: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor *</Label>
                <Select
                  value={editDeviceForm.vendor_name}
                  onValueChange={(value) => setEditDeviceForm(prev => ({ ...prev, vendor_name: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Suprema">Suprema</SelectItem>
                    <SelectItem value="Crossmatch">Crossmatch</SelectItem>
                    <SelectItem value="HID Global">HID Global</SelectItem>
                    <SelectItem value="IrisGuard">IrisGuard</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Model *</Label>
                <Input
                  placeholder="e.g., BioMini Plus 2"
                  value={editDeviceForm.model}
                  onChange={(e) => setEditDeviceForm(prev => ({ ...prev, model: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Device Type</Label>
                <Select
                  value={editDeviceForm.device_type}
                  onValueChange={(value) => setEditDeviceForm(prev => ({ ...prev, device_type: value as DeviceType }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DEVICE_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Connectivity</Label>
                <Select
                  value={editDeviceForm.connectivity}
                  onValueChange={(value) => setEditDeviceForm(prev => ({ ...prev, connectivity: value as Connectivity }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usb">USB</SelectItem>
                    <SelectItem value="wireless">Wireless</SelectItem>
                    <SelectItem value="bluetooth">Bluetooth</SelectItem>
                    <SelectItem value="ethernet">Ethernet</SelectItem>
                    <SelectItem value="both">Multiple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Firmware Version</Label>
                <Input
                  placeholder="e.g., 2.1.4"
                  value={editDeviceForm.firmware_version}
                  onChange={(e) => setEditDeviceForm(prev => ({ ...prev, firmware_version: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editDeviceForm.status}
                  onValueChange={(value) => setEditDeviceForm(prev => ({ ...prev, status: value as DeviceStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes about this device..."
                rows={3}
                value={editDeviceForm.notes}
                onChange={(e) => setEditDeviceForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleEditDevice}
              disabled={editing}
            >
              {editing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Retrieve Device Dialog */}
      <Dialog open={isRetrieveDialogOpen} onOpenChange={setIsRetrieveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Retrieve Device
            </DialogTitle>
            <DialogDescription>
              Return {selectedDevice?.asset_tag || selectedDevice?.vendor_serial_number} to inventory
            </DialogDescription>
          </DialogHeader>

          {selectedDevice && (
            <div className="space-y-4 mt-4">
              <Card className="bg-slate-50">
                <CardContent className="p-3">
                  <div className="text-sm space-y-1">
                    <p><strong>Device:</strong> {selectedDevice.asset_tag}</p>
                    <p><strong>Serial:</strong> {selectedDevice.vendor_serial_number}</p>
                    <p><strong>Currently at:</strong> {selectedDevice.current_province}, {selectedDevice.current_district}</p>
                    <p><strong>Station:</strong> {selectedDevice.current_station_id || 'N/A'}</p>
                    <p><strong>Custodian:</strong> {selectedDevice.current_custodian_name || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label>Device Condition *</Label>
                <Select
                  value={retrieveForm.condition}
                  onValueChange={(value) => setRetrieveForm(prev => ({ ...prev, condition: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Good - Fully operational</SelectItem>
                    <SelectItem value="fair">Fair - Minor issues</SelectItem>
                    <SelectItem value="poor">Poor - Needs repair</SelectItem>
                    <SelectItem value="damaged">Damaged - Not operational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Retrieval Notes</Label>
                <Textarea
                  placeholder="Any notes about the device condition or retrieval..."
                  rows={3}
                  value={retrieveForm.notes}
                  onChange={(e) => setRetrieveForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRetrieveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              onClick={handleRetrieveDevice}
              disabled={retrieving}
            >
              {retrieving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Package className="mr-2 h-4 w-4" />
              Retrieve Device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Device Import Dialog */}
      <DeviceImport
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImport={handleBulkImport}
      />

      {/* Single Device QR Code Dialog */}
      {selectedDevice && (
        <DeviceQRCode
          device={selectedDevice}
          isOpen={isQRCodeDialogOpen}
          onClose={() => {
            setIsQRCodeDialogOpen(false);
            setSelectedDevice(null);
          }}
        />
      )}

      {/* Batch QR Code Dialog */}
      <BatchQRCode
        devices={selectedDevicesForBatch}
        isOpen={isBatchQRDialogOpen}
        onClose={() => {
          setIsBatchQRDialogOpen(false);
          setSelectedDevicesForBatch([]);
        }}
      />

      {/* Device Maintenance Dialog */}
      <DeviceMaintenance
        device={selectedDevice || undefined}
        isOpen={isMaintenanceDialogOpen}
        onClose={() => {
          setIsMaintenanceDialogOpen(false);
          setSelectedDevice(null);
        }}
      />

      {/* Floating Bulk Action Bar */}
      {selectedDeviceIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Card className="shadow-xl border-emerald-200 bg-white">
            <CardContent className="p-3">
              <div className="flex items-center gap-4">
                {/* Selection info */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 rounded-lg">
                  <CheckSquare className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">
                    {selectedDeviceIds.size} device{selectedDeviceIds.size > 1 ? 's' : ''} selected
                  </span>
                </div>

                {/* Separator */}
                <div className="h-8 w-px bg-slate-200" />

                {/* Bulk actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkExport}
                    disabled={bulkActionLoading}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    Export
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkPrintQR}
                    disabled={bulkActionLoading}
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    Print QR
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={bulkActionLoading}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Change Status
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center">
                      <DropdownMenuItem onClick={() => handleBulkStatusUpdate('REGISTERED_IN_INVENTORY')}>
                        <Package className="mr-2 h-4 w-4 text-slate-600" />
                        Move to Inventory
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStatusUpdate('ALLOCATED_TO_REGION')}>
                        <MapPin className="mr-2 h-4 w-4 text-purple-600" />
                        Allocate to Region
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleBulkStatusUpdate('RETIRED')}>
                        <XCircle className="mr-2 h-4 w-4 text-slate-500" />
                        Retire
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-amber-600 border-amber-200 hover:bg-amber-50"
                    onClick={handleBulkMaintenance}
                    disabled={bulkActionLoading}
                  >
                    {bulkActionLoading ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Wrench className="h-4 w-4 mr-1" />
                    )}
                    Maintenance
                  </Button>
                </div>

                {/* Separator */}
                <div className="h-8 w-px bg-slate-200" />

                {/* Clear selection */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
