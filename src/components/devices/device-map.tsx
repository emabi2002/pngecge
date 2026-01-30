'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  MapPin,
  Layers,
  Filter,
  ZoomIn,
  ZoomOut,
  Locate,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  WifiOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DeviceDeployment, HealthStatus } from '@/lib/device-service';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

interface DeviceLocation {
  device_uid: string;
  asset_tag?: string;
  vendor_serial_number: string;
  model: string;
  device_type: string;
  health_status: HealthStatus;
  province: string;
  district: string;
  polling_site_name: string;
  station_id?: string;
  gps_lat: number;
  gps_lng: number;
  gps_accuracy_m?: number;
  last_seen_at?: string;
  deployment_status: string;
}

interface DeviceMapProps {
  devices: DeviceLocation[];
  onDeviceSelect?: (device: DeviceLocation) => void;
  className?: string;
}

const HEALTH_COLORS: Record<HealthStatus, string> = {
  OK: '#22c55e',
  WARN: '#f59e0b',
  FAIL: '#ef4444',
  UNKNOWN: '#94a3b8',
  OFFLINE: '#64748b',
};

const PROVINCE_CENTERS: Record<string, [number, number]> = {
  'National Capital District': [-9.4438, 147.1803],
  'Eastern Highlands': [-6.0733, 145.3858],
  'Western Highlands': [-5.8598, 144.2578],
  'Morobe': [-6.7282, 147.0095],
  'East Sepik': [-3.8634, 143.0476],
  'Central Province': [-8.7621, 147.1497],
  'Enga': [-5.2916, 143.5841],
  'Southern Highlands': [-6.0893, 143.5283],
  'Western Province': [-7.2988, 141.3025],
  'Gulf': [-7.4131, 144.2287],
};

// PNG center coordinates
const PNG_CENTER: [number, number] = [-6.0, 147.0];
const DEFAULT_ZOOM = 6;

export function DeviceMap({ devices, onDeviceSelect, className }: DeviceMapProps) {
  const [mapReady, setMapReady] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedHealth, setSelectedHealth] = useState<string>('all');
  const [showClusters, setShowClusters] = useState(true);

  useEffect(() => {
    setMapReady(true);
  }, []);

  // Filter devices
  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesProvince = selectedProvince === 'all' || device.province === selectedProvince;
      const matchesHealth = selectedHealth === 'all' || device.health_status === selectedHealth;
      return matchesProvince && matchesHealth && device.gps_lat && device.gps_lng;
    });
  }, [devices, selectedProvince, selectedHealth]);

  // Group devices by province for stats
  const provinceStats = useMemo(() => {
    const stats: Record<string, { total: number; healthy: number; warning: number; failing: number; offline: number }> = {};

    devices.forEach((device) => {
      if (!stats[device.province]) {
        stats[device.province] = { total: 0, healthy: 0, warning: 0, failing: 0, offline: 0 };
      }
      stats[device.province].total++;
      if (device.health_status === 'OK') stats[device.province].healthy++;
      if (device.health_status === 'WARN') stats[device.province].warning++;
      if (device.health_status === 'FAIL') stats[device.province].failing++;
      if (device.health_status === 'OFFLINE') stats[device.province].offline++;
    });

    return stats;
  }, [devices]);

  const provinces = useMemo(() => {
    return [...new Set(devices.map((d) => d.province))].sort();
  }, [devices]);

  const getMarkerColor = (health: HealthStatus): string => {
    return HEALTH_COLORS[health] || HEALTH_COLORS.UNKNOWN;
  };

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

  if (!mapReady) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 rounded-lg ${className}`} style={{ height: 500 }}>
        <div className="text-center text-slate-500">
          <MapPin className="h-12 w-12 mx-auto mb-2 animate-pulse" />
          <p>Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Map Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select value={selectedProvince} onValueChange={setSelectedProvince}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Provinces" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Provinces</SelectItem>
            {provinces.map((province) => (
              <SelectItem key={province} value={province}>
                {province} ({provinceStats[province]?.total || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedHealth} onValueChange={setSelectedHealth}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Health" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Health</SelectItem>
            <SelectItem value="OK">Healthy</SelectItem>
            <SelectItem value="WARN">Warning</SelectItem>
            <SelectItem value="FAIL">Failed</SelectItem>
            <SelectItem value="OFFLINE">Offline</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 ml-auto">
          <Badge variant="outline" className="gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            {filteredDevices.filter(d => d.health_status === 'OK').length} Healthy
          </Badge>
          <Badge variant="outline" className="gap-1">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            {filteredDevices.filter(d => d.health_status === 'WARN').length} Warning
          </Badge>
          <Badge variant="outline" className="gap-1">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            {filteredDevices.filter(d => d.health_status === 'FAIL').length} Failed
          </Badge>
          <Badge variant="outline" className="gap-1">
            <div className="h-2 w-2 rounded-full bg-slate-500" />
            {filteredDevices.filter(d => d.health_status === 'OFFLINE').length} Offline
          </Badge>
        </div>
      </div>

      {/* Map Container */}
      <div className="rounded-lg overflow-hidden border border-slate-200" style={{ height: 500 }}>
        <MapContainer
          center={PNG_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {filteredDevices.map((device) => (
            <CircleMarker
              key={device.device_uid}
              center={[device.gps_lat, device.gps_lng]}
              radius={8}
              pathOptions={{
                color: getMarkerColor(device.health_status),
                fillColor: getMarkerColor(device.health_status),
                fillOpacity: 0.8,
                weight: 2,
              }}
              eventHandlers={{
                click: () => onDeviceSelect?.(device),
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <div className="font-semibold text-slate-900 mb-1">
                    {device.asset_tag || device.vendor_serial_number}
                  </div>
                  <div className="text-sm text-slate-600 mb-2">{device.model}</div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Status:</span>
                      <Badge
                        className="text-xs"
                        style={{
                          backgroundColor: `${getMarkerColor(device.health_status)}20`,
                          color: getMarkerColor(device.health_status),
                        }}
                      >
                        {device.health_status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Site:</span>
                      <span className="font-medium">{device.polling_site_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Province:</span>
                      <span>{device.province}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">District:</span>
                      <span>{device.district}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Last Seen:</span>
                      <span>{formatRelativeTime(device.last_seen_at)}</span>
                    </div>
                    {device.gps_accuracy_m && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">GPS Accuracy:</span>
                        <span>{device.gps_accuracy_m.toFixed(1)}m</span>
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => onDeviceSelect?.(device)}
                  >
                    View Details
                  </Button>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Province Summary */}
      <div className="mt-4 grid gap-3 md:grid-cols-3 lg:grid-cols-5">
        {Object.entries(provinceStats).slice(0, 5).map(([province, stats]) => (
          <Card key={province} className="border-slate-200">
            <CardContent className="p-3">
              <div className="font-medium text-sm text-slate-900 mb-2 truncate">{province}</div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{stats.total} devices</span>
                <div className="flex gap-1">
                  {stats.healthy > 0 && (
                    <span className="flex items-center gap-0.5 text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      {stats.healthy}
                    </span>
                  )}
                  {stats.warning > 0 && (
                    <span className="flex items-center gap-0.5 text-amber-600">
                      <AlertTriangle className="h-3 w-3" />
                      {stats.warning}
                    </span>
                  )}
                  {stats.failing > 0 && (
                    <span className="flex items-center gap-0.5 text-red-600">
                      <XCircle className="h-3 w-3" />
                      {stats.failing}
                    </span>
                  )}
                  {stats.offline > 0 && (
                    <span className="flex items-center gap-0.5 text-slate-500">
                      <WifiOff className="h-3 w-3" />
                      {stats.offline}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
