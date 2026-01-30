'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with webpack/next.js
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const greenIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const yellowIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const redIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

// Registration point data
export interface RegistrationPoint {
  id: string;
  voterId: string;
  lat: number;
  lng: number;
  accuracy: number;
  ward: string;
  province: string;
  timestamp: Date;
  status: 'verified' | 'low_accuracy' | 'out_of_bounds';
}

// Province center coordinates for PNG
export interface ProvinceCenter {
  code: string;
  name: string;
  lat: number;
  lng: number;
  registrations: number;
  coverage: number;
}

// Mock registration points across PNG
const mockRegistrationPoints: RegistrationPoint[] = [
  // Eastern Highlands
  { id: 'gps-001', voterId: 'PNG-2027-4521896', lat: -6.0821, lng: 145.3861, accuracy: 5, ward: 'Asaro 1', province: 'Eastern Highlands', timestamp: new Date('2026-01-25T10:45:00'), status: 'verified' },
  { id: 'gps-002', voterId: 'PNG-2027-4521897', lat: -6.0734, lng: 145.3912, accuracy: 8, ward: 'Asaro 2', province: 'Eastern Highlands', timestamp: new Date('2026-01-25T10:42:00'), status: 'verified' },
  { id: 'gps-003', voterId: 'PNG-2027-4521898', lat: -6.0456, lng: 145.4123, accuracy: 12, ward: 'Goroka Town', province: 'Eastern Highlands', timestamp: new Date('2026-01-25T10:40:00'), status: 'verified' },
  { id: 'gps-004', voterId: 'PNG-2027-4521899', lat: -6.0912, lng: 145.3567, accuracy: 25, ward: 'Gahuku', province: 'Eastern Highlands', timestamp: new Date('2026-01-25T10:38:00'), status: 'low_accuracy' },

  // NCD (Port Moresby)
  { id: 'gps-005', voterId: 'PNG-2027-4522001', lat: -9.4438, lng: 147.1803, accuracy: 3, ward: 'Moresby North', province: 'NCD', timestamp: new Date('2026-01-25T09:30:00'), status: 'verified' },
  { id: 'gps-006', voterId: 'PNG-2027-4522002', lat: -9.4567, lng: 147.1923, accuracy: 4, ward: 'Moresby South', province: 'NCD', timestamp: new Date('2026-01-25T09:28:00'), status: 'verified' },
  { id: 'gps-007', voterId: 'PNG-2027-4522003', lat: -9.4234, lng: 147.1456, accuracy: 6, ward: 'Moresby NW', province: 'NCD', timestamp: new Date('2026-01-25T09:25:00'), status: 'verified' },

  // Western Highlands
  { id: 'gps-008', voterId: 'PNG-2027-4522101', lat: -5.8567, lng: 144.2341, accuracy: 10, ward: 'Kagamuga', province: 'Western Highlands', timestamp: new Date('2026-01-25T08:30:00'), status: 'verified' },
  { id: 'gps-009', voterId: 'PNG-2027-4522102', lat: -5.8234, lng: 144.2567, accuracy: 15, ward: 'Hagen Central', province: 'Western Highlands', timestamp: new Date('2026-01-25T08:28:00'), status: 'verified' },
  { id: 'gps-010', voterId: 'PNG-2027-4522103', lat: -5.8789, lng: 144.2123, accuracy: 28, ward: 'Mul-Baiyer', province: 'Western Highlands', timestamp: new Date('2026-01-25T08:25:00'), status: 'low_accuracy' },

  // Enga
  { id: 'gps-011', voterId: 'PNG-2027-4522201', lat: -5.4897, lng: 143.7189, accuracy: 7, ward: 'Wabag Town', province: 'Enga', timestamp: new Date('2026-01-25T07:30:00'), status: 'verified' },
  { id: 'gps-012', voterId: 'PNG-2027-4522202', lat: -5.5123, lng: 143.6890, accuracy: 45, ward: 'Kandep', province: 'Enga', timestamp: new Date('2026-01-25T07:28:00'), status: 'low_accuracy' },

  // East Sepik
  { id: 'gps-013', voterId: 'PNG-2027-4522301', lat: -3.5536, lng: 143.6314, accuracy: 8, ward: 'Kairiru', province: 'East Sepik', timestamp: new Date('2026-01-25T06:30:00'), status: 'verified' },
  { id: 'gps-014', voterId: 'PNG-2027-4522302', lat: -3.5678, lng: 143.6567, accuracy: 150, ward: 'Wewak Town', province: 'East Sepik', timestamp: new Date('2026-01-25T06:28:00'), status: 'out_of_bounds' },

  // Morobe
  { id: 'gps-015', voterId: 'PNG-2027-4522401', lat: -6.7319, lng: 147.0012, accuracy: 5, ward: 'Lae Urban', province: 'Morobe', timestamp: new Date('2026-01-25T05:30:00'), status: 'verified' },
  { id: 'gps-016', voterId: 'PNG-2027-4522402', lat: -6.7456, lng: 146.9890, accuracy: 9, ward: 'Huon Gulf', province: 'Morobe', timestamp: new Date('2026-01-25T05:28:00'), status: 'verified' },

  // Southern Highlands
  { id: 'gps-017', voterId: 'PNG-2027-4522501', lat: -5.8678, lng: 142.7654, accuracy: 12, ward: 'Tari Town', province: 'Southern Highlands', timestamp: new Date('2026-01-25T04:30:00'), status: 'verified' },
  { id: 'gps-018', voterId: 'PNG-2027-4522502', lat: -5.8234, lng: 142.7890, accuracy: 18, ward: 'Mendi', province: 'Southern Highlands', timestamp: new Date('2026-01-25T04:28:00'), status: 'verified' },
];

// Province centers with registration data
const provinceCenters: ProvinceCenter[] = [
  { code: 'NCD', name: 'National Capital District', lat: -9.4438, lng: 147.1803, registrations: 287654, coverage: 99.2 },
  { code: 'EHP', name: 'Eastern Highlands', lat: -6.0821, lng: 145.3861, registrations: 412847, coverage: 94.5 },
  { code: 'WHP', name: 'Western Highlands', lat: -5.8567, lng: 144.2341, registrations: 389421, coverage: 92.1 },
  { code: 'MOR', name: 'Morobe', lat: -6.7319, lng: 147.0012, registrations: 456123, coverage: 88.7 },
  { code: 'ESP', name: 'East Sepik', lat: -3.5536, lng: 143.6314, registrations: 234567, coverage: 78.3 },
  { code: 'ENG', name: 'Enga', lat: -5.4897, lng: 143.7189, registrations: 198765, coverage: 91.4 },
  { code: 'SIM', name: 'Simbu', lat: -6.0234, lng: 144.9678, registrations: 176543, coverage: 85.2 },
  { code: 'SHP', name: 'Southern Highlands', lat: -5.8678, lng: 142.7654, registrations: 312456, coverage: 82.6 },
];

function getMarkerIcon(status: string, accuracy: number) {
  if (status === 'out_of_bounds') return redIcon;
  if (accuracy <= 10) return greenIcon;
  if (accuracy <= 25) return yellowIcon;
  return redIcon;
}

function getAccuracyColor(accuracy: number): string {
  if (accuracy <= 10) return '#10b981'; // green
  if (accuracy <= 25) return '#f59e0b'; // amber
  return '#ef4444'; // red
}

// Component to fit map bounds
function FitBounds({ points }: { points: RegistrationPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, points]);

  return null;
}

interface CoverageMapProps {
  selectedProvince?: string;
  showRegistrationPoints?: boolean;
  showProvinceCenters?: boolean;
  height?: string;
}

export function CoverageMap({
  selectedProvince,
  showRegistrationPoints = true,
  showProvinceCenters = true,
  height = '500px',
}: CoverageMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center rounded-lg bg-slate-100"
      >
        <div className="text-sm text-slate-500">Loading map...</div>
      </div>
    );
  }

  // Filter points by province if selected
  const filteredPoints = selectedProvince
    ? mockRegistrationPoints.filter(p => p.province === selectedProvince)
    : mockRegistrationPoints;

  const filteredCenters = selectedProvince
    ? provinceCenters.filter(p => p.name === selectedProvince)
    : provinceCenters;

  // Center of PNG
  const center: [number, number] = selectedProvince
    ? [filteredCenters[0]?.lat || -6.0, filteredCenters[0]?.lng || 145.0]
    : [-6.0, 145.0];

  const zoom = selectedProvince ? 10 : 6;

  return (
    <div style={{ height }} className="rounded-lg overflow-hidden border border-slate-200">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {!selectedProvince && <FitBounds points={filteredPoints} />}

        {/* Province centers with coverage circles */}
        {showProvinceCenters && filteredCenters.map((province) => (
          <Circle
            key={province.code}
            center={[province.lat, province.lng]}
            radius={50000} // 50km radius
            pathOptions={{
              color: province.coverage >= 90 ? '#10b981' : province.coverage >= 80 ? '#f59e0b' : '#ef4444',
              fillColor: province.coverage >= 90 ? '#10b981' : province.coverage >= 80 ? '#f59e0b' : '#ef4444',
              fillOpacity: 0.2,
              weight: 2,
            }}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-semibold text-slate-900">{province.name}</h3>
                <div className="mt-2 space-y-1 text-sm">
                  <p><span className="text-slate-500">Registrations:</span> <span className="font-medium">{province.registrations.toLocaleString()}</span></p>
                  <p><span className="text-slate-500">Coverage:</span> <span className="font-medium">{province.coverage}%</span></p>
                </div>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Registration points */}
        {showRegistrationPoints && filteredPoints.map((point) => (
          <Marker
            key={point.id}
            position={[point.lat, point.lng]}
            icon={getMarkerIcon(point.status, point.accuracy)}
          >
            <Popup>
              <div className="min-w-[220px]">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">{point.ward}</h3>
                  <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                    point.status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                    point.status === 'low_accuracy' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {point.status === 'verified' ? 'Verified' : point.status === 'low_accuracy' ? 'Low Accuracy' : 'Out of Bounds'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{point.province}</p>
                <div className="mt-2 space-y-1 text-sm">
                  <p><span className="text-slate-500">Voter ID:</span> <span className="font-mono text-xs">{point.voterId}</span></p>
                  <p><span className="text-slate-500">Accuracy:</span> <span className="font-medium" style={{ color: getAccuracyColor(point.accuracy) }}>{point.accuracy}m</span></p>
                  <p><span className="text-slate-500">Coordinates:</span> <span className="font-mono text-xs">{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</span></p>
                  <p><span className="text-slate-500">Time:</span> <span className="text-xs">{point.timestamp.toLocaleTimeString()}</span></p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Accuracy circles for each point */}
        {showRegistrationPoints && filteredPoints.map((point) => (
          <Circle
            key={`accuracy-${point.id}`}
            center={[point.lat, point.lng]}
            radius={point.accuracy}
            pathOptions={{
              color: getAccuracyColor(point.accuracy),
              fillColor: getAccuracyColor(point.accuracy),
              fillOpacity: 0.15,
              weight: 1,
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
}

export { mockRegistrationPoints, provinceCenters };
