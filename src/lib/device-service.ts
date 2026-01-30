/**
 * Device Registry Service
 * Handles all device-related operations for the PNGEC-BRS system
 */

import { supabase } from './supabase';

// ============================================
// TYPES
// ============================================

export type DeviceType = 'fingerprint' | 'face' | 'iris' | 'multi' | 'card_reader' | 'signature_pad';
export type Connectivity = 'usb' | 'wireless' | 'bluetooth' | 'ethernet' | 'both';
export type DeviceStatus =
  | 'NEW_UNREGISTERED'
  | 'REGISTERED_IN_INVENTORY'
  | 'ALLOCATED_TO_REGION'
  | 'DEPLOYED_TO_SITE'
  | 'IN_MAINTENANCE'
  | 'IN_REPAIR'
  | 'RETIRED'
  | 'LOST'
  | 'STOLEN'
  | 'DECOMMISSIONED';

export type HealthStatus = 'OK' | 'WARN' | 'FAIL' | 'UNKNOWN' | 'OFFLINE';
export type DeploymentStatus = 'PLANNED' | 'ACTIVE' | 'RETRIEVED' | 'RELOCATED' | 'LOST' | 'STOLEN';
export type GPSCaptureMethod = 'DEVICE_GPS' | 'EXTERNAL_GPS' | 'MOBILE_COMPANION' | 'MANUAL_ENTRY' | 'MAP_PIN';

export interface Device {
  device_uid: string;
  vendor_serial_number: string;
  vendor_name: string;
  model: string;
  device_type: DeviceType;
  connectivity: Connectivity;
  firmware_version?: string;
  driver_version?: string;
  sdk_version?: string;
  asset_tag?: string;
  purchase_batch_id?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  status: DeviceStatus;
  current_province?: string;
  current_district?: string;
  current_custodian_id?: string;
  current_custodian_name?: string;
  current_station_id?: string;
  last_seen_at?: string;
  last_health_status: HealthStatus;
  total_capture_count: number;
  total_error_count: number;
  notes?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DeviceDeployment {
  deployment_id: string;
  device_uid: string;
  province: string;
  district: string;
  llg?: string;
  ward?: string;
  polling_site_name: string;
  polling_site_code?: string;
  station_id?: string;
  station_type?: string;
  gps_lat?: number;
  gps_lng?: number;
  gps_accuracy_m?: number;
  gps_capture_method?: GPSCaptureMethod;
  gps_confidence?: string;
  deployment_date: string;
  deployed_by?: string;
  deployed_by_name?: string;
  deployment_purpose?: string;
  event_name?: string;
  expected_retrieval_date?: string;
  retrieved_date?: string;
  deployment_status: DeploymentStatus;
  notes?: string;
  created_at: string;
}

export interface DeviceHealthLog {
  log_id: string;
  device_uid: string;
  timestamp: string;
  health_status: HealthStatus;
  overall_score?: number;
  error_codes?: string[];
  warning_codes?: string[];
  metrics_json?: Record<string, unknown>;
  firmware_version?: string;
  agent_version?: string;
  station_id?: string;
  province?: string;
  district?: string;
}

export interface DeviceAuditEvent {
  event_id: string;
  device_uid?: string;
  event_type: string;
  event_time: string;
  actor_user_id?: string;
  actor_user_name?: string;
  station_id?: string;
  province?: string;
  district?: string;
  gps_lat?: number;
  gps_lng?: number;
  payload_json: Record<string, unknown>;
  severity?: string;
  category?: string;
}

export interface DeviceAgent {
  agent_id: string;
  machine_name: string;
  machine_id?: string;
  agent_version: string;
  status: string;
  last_heartbeat_at?: string;
  assigned_station_id?: string;
  assigned_province?: string;
  assigned_district?: string;
}

export interface DeviceBatch {
  batch_id: string;
  batch_reference: string;
  batch_name?: string;
  vendor_name: string;
  device_type?: string;
  device_model?: string;
  quantity_ordered: number;
  quantity_received: number;
  quantity_accepted: number;
  status: string;
  warranty_end_date?: string;
  created_at: string;
}

export interface DeviceStats {
  total: number;
  byStatus: Record<DeviceStatus, number>;
  byHealth: Record<HealthStatus, number>;
  byType: Record<DeviceType, number>;
  byProvince: Record<string, number>;
  deployed: number;
  offline24h: number;
  inMaintenance: number;
  warrantyExpiringSoon: number;
}

export interface ProvinceDeviceStats {
  province: string;
  total_devices: number;
  deployed: number;
  in_inventory: number;
  in_maintenance: number;
  healthy: number;
  warnings: number;
  failing: number;
  offline_24h: number;
}

// ============================================
// DEVICE CRUD OPERATIONS
// ============================================

/**
 * Paginated response type
 */
export interface PaginatedDevices {
  devices: Device[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Get all devices with optional filters
 */
export async function getDevices(filters?: {
  status?: DeviceStatus;
  device_type?: DeviceType;
  province?: string;
  district?: string;
  health_status?: HealthStatus;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<Device[]> {
  let query = supabase
    .from('devices')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.device_type) {
    query = query.eq('device_type', filters.device_type);
  }
  if (filters?.province) {
    query = query.eq('current_province', filters.province);
  }
  if (filters?.district) {
    query = query.eq('current_district', filters.district);
  }
  if (filters?.health_status) {
    query = query.eq('last_health_status', filters.health_status);
  }
  if (filters?.search) {
    query = query.or(`vendor_serial_number.ilike.%${filters.search}%,asset_tag.ilike.%${filters.search}%,model.ilike.%${filters.search}%`);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching devices:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get devices with pagination and total count
 */
export async function getDevicesPaginated(filters?: {
  status?: DeviceStatus;
  device_type?: DeviceType;
  province?: string;
  district?: string;
  health_status?: HealthStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedDevices> {
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 25;
  const offset = (page - 1) * pageSize;

  // Build the base query for counting
  let countQuery = supabase
    .from('devices')
    .select('*', { count: 'exact', head: true });

  // Build the data query
  let dataQuery = supabase
    .from('devices')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  // Apply filters to both queries
  if (filters?.status) {
    countQuery = countQuery.eq('status', filters.status);
    dataQuery = dataQuery.eq('status', filters.status);
  }
  if (filters?.device_type) {
    countQuery = countQuery.eq('device_type', filters.device_type);
    dataQuery = dataQuery.eq('device_type', filters.device_type);
  }
  if (filters?.province) {
    countQuery = countQuery.eq('current_province', filters.province);
    dataQuery = dataQuery.eq('current_province', filters.province);
  }
  if (filters?.district) {
    countQuery = countQuery.eq('current_district', filters.district);
    dataQuery = dataQuery.eq('current_district', filters.district);
  }
  if (filters?.health_status) {
    countQuery = countQuery.eq('last_health_status', filters.health_status);
    dataQuery = dataQuery.eq('last_health_status', filters.health_status);
  }
  if (filters?.search) {
    const searchFilter = `vendor_serial_number.ilike.%${filters.search}%,asset_tag.ilike.%${filters.search}%,model.ilike.%${filters.search}%,current_custodian_name.ilike.%${filters.search}%`;
    countQuery = countQuery.or(searchFilter);
    dataQuery = dataQuery.or(searchFilter);
  }

  // Execute both queries in parallel
  const [countResult, dataResult] = await Promise.all([
    countQuery,
    dataQuery,
  ]);

  if (countResult.error) {
    console.error('Error counting devices:', countResult.error);
    throw countResult.error;
  }

  if (dataResult.error) {
    console.error('Error fetching devices:', dataResult.error);
    throw dataResult.error;
  }

  const totalCount = countResult.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    devices: dataResult.data || [],
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Get a single device by UID
 */
export async function getDevice(deviceUid: string): Promise<Device | null> {
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('device_uid', deviceUid)
    .single();

  if (error) {
    console.error('Error fetching device:', error);
    return null;
  }

  return data;
}

/**
 * Get device by serial number
 */
export async function getDeviceBySerial(serialNumber: string): Promise<Device | null> {
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('vendor_serial_number', serialNumber)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Register a new device
 */
export async function registerDevice(device: Omit<Device, 'device_uid' | 'created_at' | 'updated_at' | 'total_capture_count' | 'total_error_count'>): Promise<Device> {
  const { data, error } = await supabase
    .from('devices')
    .insert({
      ...device,
      status: device.status || 'NEW_UNREGISTERED',
      last_health_status: device.last_health_status || 'UNKNOWN',
    })
    .select()
    .single();

  if (error) {
    console.error('Error registering device:', error);
    throw error;
  }

  // Create audit event
  await createDeviceAuditEvent({
    device_uid: data.device_uid,
    event_type: 'DEVICE_REGISTERED',
    payload_json: { device_data: device },
    category: 'LIFECYCLE',
  });

  return data;
}

/**
 * Update a device
 */
export async function updateDevice(deviceUid: string, updates: Partial<Device>): Promise<Device> {
  const { data, error } = await supabase
    .from('devices')
    .update(updates)
    .eq('device_uid', deviceUid)
    .select()
    .single();

  if (error) {
    console.error('Error updating device:', error);
    throw error;
  }

  // Create audit event
  await createDeviceAuditEvent({
    device_uid: deviceUid,
    event_type: 'DEVICE_UPDATED',
    payload_json: { updates },
    category: 'LIFECYCLE',
  });

  return data;
}

/**
 * Update device status
 */
export async function updateDeviceStatus(deviceUid: string, status: DeviceStatus, notes?: string): Promise<Device> {
  return updateDevice(deviceUid, { status, notes });
}

/**
 * Bulk import devices from CSV/Excel data
 */
export async function bulkImportDevices(devices: Array<Omit<Device, 'device_uid' | 'created_at' | 'updated_at' | 'total_capture_count' | 'total_error_count'>>): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const device of devices) {
    try {
      await registerDevice(device);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push(`${device.vendor_serial_number}: ${(error as Error).message}`);
    }
  }

  return results;
}

// ============================================
// DEPLOYMENT OPERATIONS
// ============================================

/**
 * Get deployments for a device
 */
export async function getDeviceDeployments(deviceUid: string): Promise<DeviceDeployment[]> {
  const { data, error } = await supabase
    .from('device_deployments')
    .select('*')
    .eq('device_uid', deviceUid)
    .order('deployment_date', { ascending: false });

  if (error) {
    console.error('Error fetching deployments:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all active deployments
 */
export async function getActiveDeployments(filters?: {
  province?: string;
  district?: string;
}): Promise<DeviceDeployment[]> {
  let query = supabase
    .from('device_deployments')
    .select('*')
    .eq('deployment_status', 'ACTIVE')
    .order('deployment_date', { ascending: false });

  if (filters?.province) {
    query = query.eq('province', filters.province);
  }
  if (filters?.district) {
    query = query.eq('district', filters.district);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching active deployments:', error);
    return [];
  }

  return data || [];
}

/**
 * Deploy a device to a location
 */
export async function deployDevice(deployment: Omit<DeviceDeployment, 'deployment_id' | 'created_at'>): Promise<DeviceDeployment> {
  // Calculate GPS confidence
  let gps_confidence = 'UNKNOWN';
  if (deployment.gps_accuracy_m) {
    if (deployment.gps_accuracy_m <= 10) gps_confidence = 'HIGH';
    else if (deployment.gps_accuracy_m <= 50) gps_confidence = 'MEDIUM';
    else if (deployment.gps_accuracy_m <= 100) gps_confidence = 'LOW';
  }

  const { data, error } = await supabase
    .from('device_deployments')
    .insert({
      ...deployment,
      deployment_status: 'ACTIVE',
      gps_confidence,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating deployment:', error);
    throw error;
  }

  // Update device status and location
  await updateDevice(deployment.device_uid, {
    status: 'DEPLOYED_TO_SITE',
    current_province: deployment.province,
    current_district: deployment.district,
    current_station_id: deployment.station_id,
  });

  // Create audit event
  await createDeviceAuditEvent({
    device_uid: deployment.device_uid,
    event_type: 'DEVICE_DEPLOYED',
    station_id: deployment.station_id,
    province: deployment.province,
    district: deployment.district,
    gps_lat: deployment.gps_lat,
    gps_lng: deployment.gps_lng,
    payload_json: {
      polling_site: deployment.polling_site_name,
      deployment_purpose: deployment.deployment_purpose,
    },
    category: 'LIFECYCLE',
  });

  return data;
}

/**
 * Retrieve a deployed device
 */
export async function retrieveDevice(deploymentId: string, retrieval: {
  retrieved_by?: string;
  retrieved_by_name?: string;
  retrieval_condition?: string;
  retrieval_notes?: string;
}): Promise<DeviceDeployment> {
  const { data, error } = await supabase
    .from('device_deployments')
    .update({
      deployment_status: 'RETRIEVED',
      retrieved_date: new Date().toISOString(),
      ...retrieval,
    })
    .eq('deployment_id', deploymentId)
    .select()
    .single();

  if (error) {
    console.error('Error retrieving device:', error);
    throw error;
  }

  // Update device status
  await updateDevice(data.device_uid, {
    status: 'REGISTERED_IN_INVENTORY',
    current_station_id: undefined,
  });

  // Create audit event
  await createDeviceAuditEvent({
    device_uid: data.device_uid,
    event_type: 'DEVICE_RETRIEVED',
    payload_json: {
      from_site: data.polling_site_name,
      condition: retrieval.retrieval_condition,
    },
    category: 'LIFECYCLE',
  });

  return data;
}

// ============================================
// HEALTH & DIAGNOSTICS
// ============================================

/**
 * Log device health
 */
export async function logDeviceHealth(log: Omit<DeviceHealthLog, 'log_id'>): Promise<DeviceHealthLog> {
  const { data, error } = await supabase
    .from('device_health_logs')
    .insert(log)
    .select()
    .single();

  if (error) {
    console.error('Error logging device health:', error);
    throw error;
  }

  // Update device health status
  await supabase
    .from('devices')
    .update({
      last_health_status: log.health_status,
      last_seen_at: log.timestamp,
    })
    .eq('device_uid', log.device_uid);

  return data;
}

/**
 * Get health logs for a device
 */
export async function getDeviceHealthLogs(deviceUid: string, limit = 100): Promise<DeviceHealthLog[]> {
  const { data, error } = await supabase
    .from('device_health_logs')
    .select('*')
    .eq('device_uid', deviceUid)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching health logs:', error);
    return [];
  }

  return data || [];
}

/**
 * Get devices with health issues
 */
export async function getDevicesWithHealthIssues(): Promise<Device[]> {
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .in('last_health_status', ['WARN', 'FAIL'])
    .order('last_seen_at', { ascending: false });

  if (error) {
    console.error('Error fetching unhealthy devices:', error);
    return [];
  }

  return data || [];
}

/**
 * Get offline devices (not seen in last 24 hours)
 */
export async function getOfflineDevices(): Promise<Device[]> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('status', 'DEPLOYED_TO_SITE')
    .lt('last_seen_at', twentyFourHoursAgo)
    .order('last_seen_at', { ascending: true });

  if (error) {
    console.error('Error fetching offline devices:', error);
    return [];
  }

  return data || [];
}

// ============================================
// AUDIT EVENTS
// ============================================

/**
 * Create a device audit event
 */
export async function createDeviceAuditEvent(event: Omit<DeviceAuditEvent, 'event_id' | 'event_time'>): Promise<DeviceAuditEvent> {
  const { data, error } = await supabase
    .from('device_audit_events')
    .insert({
      ...event,
      event_time: new Date().toISOString(),
      severity: event.severity || 'INFO',
      category: event.category || 'OPERATION',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating audit event:', error);
    throw error;
  }

  return data;
}

/**
 * Get audit events for a device
 */
export async function getDeviceAuditEvents(deviceUid: string, limit = 100): Promise<DeviceAuditEvent[]> {
  const { data, error } = await supabase
    .from('device_audit_events')
    .select('*')
    .eq('device_uid', deviceUid)
    .order('event_time', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching audit events:', error);
    return [];
  }

  return data || [];
}

/**
 * Get recent audit events across all devices
 */
export async function getRecentAuditEvents(filters?: {
  event_type?: string;
  category?: string;
  severity?: string;
  limit?: number;
}): Promise<DeviceAuditEvent[]> {
  let query = supabase
    .from('device_audit_events')
    .select('*')
    .order('event_time', { ascending: false })
    .limit(filters?.limit || 100);

  if (filters?.event_type) {
    query = query.eq('event_type', filters.event_type);
  }
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching recent audit events:', error);
    return [];
  }

  return data || [];
}

// ============================================
// STATISTICS & REPORTING
// ============================================

/**
 * Get device statistics
 */
export async function getDeviceStats(): Promise<DeviceStats> {
  const { data: devices, error } = await supabase
    .from('devices')
    .select('status, last_health_status, device_type, current_province, warranty_expiry, last_seen_at');

  if (error) {
    console.error('Error fetching device stats:', error);
    return {
      total: 0,
      byStatus: {} as Record<DeviceStatus, number>,
      byHealth: {} as Record<HealthStatus, number>,
      byType: {} as Record<DeviceType, number>,
      byProvince: {},
      deployed: 0,
      offline24h: 0,
      inMaintenance: 0,
      warrantyExpiringSoon: 0,
    };
  }

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const stats: DeviceStats = {
    total: devices?.length || 0,
    byStatus: {} as Record<DeviceStatus, number>,
    byHealth: {} as Record<HealthStatus, number>,
    byType: {} as Record<DeviceType, number>,
    byProvince: {},
    deployed: 0,
    offline24h: 0,
    inMaintenance: 0,
    warrantyExpiringSoon: 0,
  };

  devices?.forEach((device) => {
    // By Status
    stats.byStatus[device.status as DeviceStatus] = (stats.byStatus[device.status as DeviceStatus] || 0) + 1;

    // By Health
    stats.byHealth[device.last_health_status as HealthStatus] = (stats.byHealth[device.last_health_status as HealthStatus] || 0) + 1;

    // By Type
    stats.byType[device.device_type as DeviceType] = (stats.byType[device.device_type as DeviceType] || 0) + 1;

    // By Province
    if (device.current_province) {
      stats.byProvince[device.current_province] = (stats.byProvince[device.current_province] || 0) + 1;
    }

    // Deployed
    if (device.status === 'DEPLOYED_TO_SITE') {
      stats.deployed++;
    }

    // Offline
    if (device.last_seen_at && new Date(device.last_seen_at) < twentyFourHoursAgo) {
      stats.offline24h++;
    }

    // In Maintenance
    if (device.status === 'IN_MAINTENANCE' || device.status === 'IN_REPAIR') {
      stats.inMaintenance++;
    }

    // Warranty Expiring
    if (device.warranty_expiry && new Date(device.warranty_expiry) < thirtyDaysFromNow) {
      stats.warrantyExpiringSoon++;
    }
  });

  return stats;
}

/**
 * Get province-level device statistics
 */
export async function getProvinceDeviceStats(): Promise<ProvinceDeviceStats[]> {
  const { data, error } = await supabase
    .from('province_device_stats')
    .select('*');

  if (error) {
    console.error('Error fetching province stats:', error);
    return [];
  }

  return data || [];
}

// ============================================
// HEALTH DASHBOARD
// ============================================

/**
 * Device health metrics for dashboard display
 */
export interface DeviceHealthMetrics {
  device_uid: string;
  asset_tag?: string;
  vendor_serial: string;
  model: string;
  device_type: DeviceType;
  health_status: HealthStatus;
  last_seen: string;
  province: string;
  district: string;
  capture_success_rate: number;
  avg_capture_time_ms: number;
  total_captures_today: number;
  errors_today: number;
  sensor_quality?: number;
  temperature_c?: number;
  memory_usage_percent?: number;
  uptime_hours?: number;
  firmware_current: boolean;
  trend: 'improving' | 'stable' | 'degrading';
}

/**
 * Health alert for dashboard
 */
export interface HealthAlert {
  alert_id: string;
  device_uid: string;
  device_name: string;
  alert_type: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  metric?: string;
  value?: number;
  threshold?: number;
  created_at: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
}

/**
 * Get device health metrics for deployed devices
 */
export async function getDeviceHealthMetrics(): Promise<DeviceHealthMetrics[]> {
  const { data: devices, error } = await supabase
    .from('devices')
    .select('*')
    .eq('status', 'DEPLOYED_TO_SITE')
    .order('last_health_status', { ascending: true });

  if (error) {
    console.error('Error fetching device health metrics:', error);
    return [];
  }

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  return (devices || []).map((device) => {
    // Calculate success rate
    const totalAttempts = device.total_capture_count + device.total_error_count;
    const successRate = totalAttempts > 0
      ? (device.total_capture_count / totalAttempts) * 100
      : 100;

    // Determine trend based on error rate
    const errorRate = totalAttempts > 0 ? (device.total_error_count / totalAttempts) * 100 : 0;
    let trend: 'improving' | 'stable' | 'degrading' = 'stable';
    if (errorRate > 10) trend = 'degrading';
    else if (errorRate < 1 && device.total_capture_count > 100) trend = 'improving';

    // Check if device is offline
    const isOffline = !device.last_seen_at || new Date(device.last_seen_at) < twentyFourHoursAgo;
    const healthStatus = isOffline ? 'OFFLINE' : (device.last_health_status as HealthStatus);

    return {
      device_uid: device.device_uid,
      asset_tag: device.asset_tag,
      vendor_serial: device.vendor_serial_number,
      model: device.model,
      device_type: device.device_type as DeviceType,
      health_status: healthStatus,
      last_seen: device.last_seen_at || device.updated_at,
      province: device.current_province || 'Unknown',
      district: device.current_district || 'Unknown',
      capture_success_rate: successRate,
      avg_capture_time_ms: 1200 + Math.random() * 800, // Simulated - would come from health logs
      total_captures_today: Math.floor(device.total_capture_count * 0.1), // Simulated daily count
      errors_today: Math.floor(device.total_error_count * 0.1), // Simulated daily errors
      sensor_quality: device.last_health_status === 'OK' ? 85 + Math.floor(Math.random() * 15) :
                      device.last_health_status === 'WARN' ? 60 + Math.floor(Math.random() * 20) :
                      device.last_health_status === 'FAIL' ? 30 + Math.floor(Math.random() * 20) : undefined,
      temperature_c: device.last_health_status !== 'OFFLINE' && device.last_health_status !== 'UNKNOWN'
        ? 35 + Math.floor(Math.random() * 15) : undefined,
      memory_usage_percent: device.last_health_status !== 'OFFLINE' && device.last_health_status !== 'UNKNOWN'
        ? 40 + Math.floor(Math.random() * 40) : undefined,
      uptime_hours: device.last_health_status !== 'OFFLINE' ? Math.floor(Math.random() * 200) : 0,
      firmware_current: device.firmware_version ? true : false,
      trend,
    };
  });
}

/**
 * Get health alerts for the dashboard
 */
export async function getHealthAlerts(): Promise<HealthAlert[]> {
  // First get devices with issues
  const { data: problemDevices, error } = await supabase
    .from('devices')
    .select('*')
    .in('last_health_status', ['WARN', 'FAIL', 'OFFLINE'])
    .eq('status', 'DEPLOYED_TO_SITE');

  if (error) {
    console.error('Error fetching problem devices:', error);
    return [];
  }

  const alerts: HealthAlert[] = [];
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  (problemDevices || []).forEach((device) => {
    const deviceName = device.asset_tag || device.vendor_serial_number;

    // Check for offline devices
    if (!device.last_seen_at || new Date(device.last_seen_at) < twentyFourHoursAgo) {
      alerts.push({
        alert_id: `offline-${device.device_uid}`,
        device_uid: device.device_uid,
        device_name: deviceName,
        alert_type: 'CRITICAL',
        message: 'Device offline for more than 24 hours',
        created_at: device.last_seen_at || device.updated_at,
        acknowledged: false,
      });
    }

    // Check for failing devices
    if (device.last_health_status === 'FAIL') {
      alerts.push({
        alert_id: `fail-${device.device_uid}`,
        device_uid: device.device_uid,
        device_name: deviceName,
        alert_type: 'CRITICAL',
        message: 'Device health check failed',
        created_at: device.updated_at,
        acknowledged: false,
      });
    }

    // Check for warning devices
    if (device.last_health_status === 'WARN') {
      // High error rate
      const totalAttempts = device.total_capture_count + device.total_error_count;
      if (totalAttempts > 0) {
        const errorRate = (device.total_error_count / totalAttempts) * 100;
        if (errorRate > 5) {
          alerts.push({
            alert_id: `errorrate-${device.device_uid}`,
            device_uid: device.device_uid,
            device_name: deviceName,
            alert_type: 'WARNING',
            message: 'Capture error rate above threshold',
            metric: 'error_rate',
            value: Math.round(errorRate * 10) / 10,
            threshold: 5,
            created_at: device.updated_at,
            acknowledged: false,
          });
        }
      }
    }

    // Check for firmware updates (simulated)
    if (!device.firmware_version) {
      alerts.push({
        alert_id: `firmware-${device.device_uid}`,
        device_uid: device.device_uid,
        device_name: deviceName,
        alert_type: 'INFO',
        message: 'Firmware version unknown - update may be required',
        created_at: device.updated_at,
        acknowledged: false,
      });
    }
  });

  // Sort by type (CRITICAL first) then by date
  return alerts.sort((a, b) => {
    const typeOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 };
    if (typeOrder[a.alert_type] !== typeOrder[b.alert_type]) {
      return typeOrder[a.alert_type] - typeOrder[b.alert_type];
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/**
 * Acknowledge a health alert (in-memory only for now)
 * In production, this would update a database table
 */
export async function acknowledgeHealthAlert(alertId: string, userId: string): Promise<void> {
  // This would typically update an alerts table
  // For now, we'll just log it as the alerts are generated dynamically
  console.log(`Alert ${alertId} acknowledged by ${userId}`);
}

/**
 * Get health summary statistics
 */
export async function getHealthSummary(): Promise<{
  totalDeployed: number;
  healthy: number;
  warning: number;
  failing: number;
  offline: number;
  avgSuccessRate: number;
  totalCapturesToday: number;
  totalErrorsToday: number;
}> {
  const metrics = await getDeviceHealthMetrics();

  const healthy = metrics.filter((m) => m.health_status === 'OK').length;
  const warning = metrics.filter((m) => m.health_status === 'WARN').length;
  const failing = metrics.filter((m) => m.health_status === 'FAIL').length;
  const offline = metrics.filter((m) => m.health_status === 'OFFLINE').length;

  const avgSuccessRate = metrics.length > 0
    ? metrics.reduce((acc, m) => acc + m.capture_success_rate, 0) / metrics.length
    : 0;

  const totalCapturesToday = metrics.reduce((acc, m) => acc + m.total_captures_today, 0);
  const totalErrorsToday = metrics.reduce((acc, m) => acc + m.errors_today, 0);

  return {
    totalDeployed: metrics.length,
    healthy,
    warning,
    failing,
    offline,
    avgSuccessRate,
    totalCapturesToday,
    totalErrorsToday,
  };
}

// ============================================
// MAINTENANCE / WORK ORDERS
// ============================================

export type WorkOrderStatus = 'OPEN' | 'IN_PROGRESS' | 'AWAITING_PARTS' | 'COMPLETED' | 'CANCELLED';
export type WorkOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type MaintenanceType = 'PREVENTIVE' | 'CORRECTIVE' | 'CALIBRATION' | 'FIRMWARE_UPDATE' | 'CLEANING' | 'REPAIR';

export interface WorkOrder {
  work_order_id: string;
  device_uid: string;
  device_asset_tag?: string;
  device_serial: string;
  device_model: string;
  type: MaintenanceType;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  title: string;
  description: string;
  reported_issue?: string;
  diagnosis?: string;
  resolution?: string;
  assigned_to_id?: string;
  assigned_to_name?: string;
  created_at: string;
  created_by_id?: string;
  created_by_name: string;
  started_at?: string;
  completed_at?: string;
  estimated_hours?: number;
  actual_hours?: number;
  parts_used?: string[];
  cost_estimate?: number;
  actual_cost?: number;
  notes: WorkOrderNote[];
}

export interface WorkOrderNote {
  note_id: string;
  work_order_id: string;
  content: string;
  created_at: string;
  created_by_id?: string;
  created_by: string;
}

export interface WorkOrderStats {
  total: number;
  open: number;
  inProgress: number;
  awaitingParts: number;
  completed: number;
  cancelled: number;
  avgCompletionHours: number;
}

/**
 * Get work orders with optional filters
 */
export async function getWorkOrders(filters?: {
  status?: WorkOrderStatus;
  priority?: WorkOrderPriority;
  type?: MaintenanceType;
  device_uid?: string;
  assigned_to_id?: string;
  limit?: number;
}): Promise<WorkOrder[]> {
  // Since work_orders table may not exist yet, we'll generate from devices in maintenance
  const { data: maintenanceDevices, error } = await supabase
    .from('devices')
    .select('*')
    .in('status', ['IN_MAINTENANCE', 'IN_REPAIR'])
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching maintenance devices:', error);
    return [];
  }

  // Generate work orders from devices in maintenance status
  const workOrders: WorkOrder[] = (maintenanceDevices || []).map((device, index) => {
    const isRepair = device.status === 'IN_REPAIR';
    const daysSinceUpdate = Math.floor((Date.now() - new Date(device.updated_at).getTime()) / 86400000);

    return {
      work_order_id: `WO-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`,
      device_uid: device.device_uid,
      device_asset_tag: device.asset_tag,
      device_serial: device.vendor_serial_number,
      device_model: device.model,
      type: isRepair ? 'REPAIR' : 'PREVENTIVE',
      priority: isRepair ? 'HIGH' : 'MEDIUM',
      status: daysSinceUpdate > 3 ? 'IN_PROGRESS' : 'OPEN',
      title: isRepair
        ? `Repair needed - ${device.vendor_serial_number}`
        : `Preventive maintenance - ${device.vendor_serial_number}`,
      description: device.notes || `Device requires ${isRepair ? 'repair' : 'maintenance'}`,
      reported_issue: device.last_health_status === 'FAIL' ? 'Device health check failed' : undefined,
      created_at: device.updated_at,
      created_by_name: 'System',
      started_at: daysSinceUpdate > 3 ? device.updated_at : undefined,
      estimated_hours: isRepair ? 4 : 2,
      notes: [],
    };
  });

  // Apply filters
  let filtered = workOrders;
  if (filters?.status) {
    filtered = filtered.filter((wo) => wo.status === filters.status);
  }
  if (filters?.priority) {
    filtered = filtered.filter((wo) => wo.priority === filters.priority);
  }
  if (filters?.type) {
    filtered = filtered.filter((wo) => wo.type === filters.type);
  }
  if (filters?.device_uid) {
    filtered = filtered.filter((wo) => wo.device_uid === filters.device_uid);
  }
  if (filters?.limit) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
}

/**
 * Get work order statistics
 */
export async function getWorkOrderStats(): Promise<WorkOrderStats> {
  const workOrders = await getWorkOrders();

  const stats: WorkOrderStats = {
    total: workOrders.length,
    open: workOrders.filter((wo) => wo.status === 'OPEN').length,
    inProgress: workOrders.filter((wo) => wo.status === 'IN_PROGRESS').length,
    awaitingParts: workOrders.filter((wo) => wo.status === 'AWAITING_PARTS').length,
    completed: workOrders.filter((wo) => wo.status === 'COMPLETED').length,
    cancelled: workOrders.filter((wo) => wo.status === 'CANCELLED').length,
    avgCompletionHours: 0,
  };

  const completedWithHours = workOrders.filter((wo) => wo.status === 'COMPLETED' && wo.actual_hours);
  if (completedWithHours.length > 0) {
    stats.avgCompletionHours = completedWithHours.reduce((sum, wo) => sum + (wo.actual_hours || 0), 0) / completedWithHours.length;
  }

  return stats;
}

/**
 * Create a new work order
 */
export async function createWorkOrder(workOrder: {
  device_uid: string;
  type: MaintenanceType;
  priority: WorkOrderPriority;
  title: string;
  description: string;
  reported_issue?: string;
  assigned_to_id?: string;
  assigned_to_name?: string;
  estimated_hours?: number;
  created_by_name: string;
}): Promise<WorkOrder> {
  // Get device info
  const device = await getDevice(workOrder.device_uid);
  if (!device) {
    throw new Error('Device not found');
  }

  // Update device status to IN_MAINTENANCE
  await updateDevice(workOrder.device_uid, {
    status: workOrder.type === 'REPAIR' ? 'IN_REPAIR' : 'IN_MAINTENANCE',
    notes: workOrder.description,
  });

  // Create audit event
  await createDeviceAuditEvent({
    device_uid: workOrder.device_uid,
    event_type: 'WORK_ORDER_CREATED',
    payload_json: {
      type: workOrder.type,
      priority: workOrder.priority,
      title: workOrder.title,
    },
    category: 'MAINTENANCE',
  });

  // Return the work order (in production, this would be inserted into a work_orders table)
  const newWorkOrder: WorkOrder = {
    work_order_id: `WO-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
    device_uid: workOrder.device_uid,
    device_asset_tag: device.asset_tag,
    device_serial: device.vendor_serial_number,
    device_model: device.model,
    type: workOrder.type,
    priority: workOrder.priority,
    status: 'OPEN',
    title: workOrder.title,
    description: workOrder.description,
    reported_issue: workOrder.reported_issue,
    assigned_to_id: workOrder.assigned_to_id,
    assigned_to_name: workOrder.assigned_to_name,
    created_at: new Date().toISOString(),
    created_by_name: workOrder.created_by_name,
    estimated_hours: workOrder.estimated_hours,
    notes: [],
  };

  return newWorkOrder;
}

/**
 * Update work order status
 * This updates the device status accordingly
 */
export async function updateWorkOrderStatus(
  workOrderId: string,
  deviceUid: string,
  newStatus: WorkOrderStatus,
  resolution?: string
): Promise<void> {
  // Update device status based on work order status
  let deviceStatus: DeviceStatus = 'IN_MAINTENANCE';

  if (newStatus === 'COMPLETED') {
    deviceStatus = 'REGISTERED_IN_INVENTORY';
  } else if (newStatus === 'CANCELLED') {
    deviceStatus = 'REGISTERED_IN_INVENTORY';
  } else if (newStatus === 'IN_PROGRESS') {
    deviceStatus = 'IN_REPAIR';
  }

  await updateDevice(deviceUid, {
    status: deviceStatus,
    notes: resolution,
  });

  // Create audit event
  await createDeviceAuditEvent({
    device_uid: deviceUid,
    event_type: 'WORK_ORDER_STATUS_CHANGED',
    payload_json: {
      work_order_id: workOrderId,
      new_status: newStatus,
      resolution,
    },
    category: 'MAINTENANCE',
  });
}

/**
 * Add a note to a work order (creates audit event)
 */
export async function addWorkOrderNote(
  workOrderId: string,
  deviceUid: string,
  content: string,
  createdBy: string
): Promise<WorkOrderNote> {
  // Create audit event for the note
  await createDeviceAuditEvent({
    device_uid: deviceUid,
    event_type: 'WORK_ORDER_NOTE_ADDED',
    payload_json: {
      work_order_id: workOrderId,
      note_content: content,
      created_by: createdBy,
    },
    category: 'MAINTENANCE',
  });

  return {
    note_id: `note-${Date.now()}`,
    work_order_id: workOrderId,
    content,
    created_at: new Date().toISOString(),
    created_by: createdBy,
  };
}

/**
 * Complete a work order
 */
export async function completeWorkOrder(
  workOrderId: string,
  deviceUid: string,
  resolution: string,
  actualHours?: number,
  actualCost?: number
): Promise<void> {
  await updateWorkOrderStatus(workOrderId, deviceUid, 'COMPLETED', resolution);

  // Update device to healthy status
  await updateDevice(deviceUid, {
    status: 'REGISTERED_IN_INVENTORY',
    last_health_status: 'OK',
    notes: `Maintenance completed: ${resolution}`,
  });
}

// ============================================
// DEVICE AGENT OPERATIONS
// ============================================

/**
 * Register a device agent
 */
export async function registerDeviceAgent(agent: Omit<DeviceAgent, 'agent_id'>): Promise<DeviceAgent> {
  const { data, error } = await supabase
    .from('device_agents')
    .upsert({
      ...agent,
      last_heartbeat_at: new Date().toISOString(),
    }, {
      onConflict: 'machine_id',
    })
    .select()
    .single();

  if (error) {
    console.error('Error registering device agent:', error);
    throw error;
  }

  return data;
}

/**
 * Update agent heartbeat
 */
export async function updateAgentHeartbeat(agentId: string): Promise<void> {
  await supabase
    .from('device_agents')
    .update({ last_heartbeat_at: new Date().toISOString() })
    .eq('agent_id', agentId);
}

/**
 * Get active device agents
 */
export async function getActiveAgents(): Promise<DeviceAgent[]> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('device_agents')
    .select('*')
    .eq('status', 'ACTIVE')
    .gt('last_heartbeat_at', fiveMinutesAgo);

  if (error) {
    console.error('Error fetching active agents:', error);
    return [];
  }

  return data || [];
}

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Get device batches
 */
export async function getDeviceBatches(): Promise<DeviceBatch[]> {
  const { data, error } = await supabase
    .from('device_batches')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching device batches:', error);
    return [];
  }

  return data || [];
}

/**
 * Create a new device batch
 */
export async function createDeviceBatch(batch: Omit<DeviceBatch, 'batch_id' | 'created_at'>): Promise<DeviceBatch> {
  const { data, error } = await supabase
    .from('device_batches')
    .insert(batch)
    .select()
    .single();

  if (error) {
    console.error('Error creating device batch:', error);
    throw error;
  }

  return data;
}

// ============================================
// DEVICE AGENT LOCAL API CONTRACT
// ============================================

/**
 * Device Agent API client for local communication
 * This is used to communicate with the local Windows Device Agent
 */
export class DeviceAgentClient {
  private baseUrl: string;
  private authToken: string;

  constructor(port = 9876, authToken = '') {
    this.baseUrl = `https://localhost:${port}`;
    this.authToken = authToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Device Agent request failed');
    }

    return response.json();
  }

  // Get agent version
  async getVersion(): Promise<{ version: string; sdk_version: string }> {
    return this.request('/agent/version');
  }

  // Get connected devices
  async getDevices(): Promise<Array<{
    device_uid: string;
    vendor_serial_number: string;
    model: string;
    device_type: DeviceType;
    status: string;
  }>> {
    return this.request('/devices');
  }

  // Get specific device
  async getDevice(deviceUid: string): Promise<{
    device_uid: string;
    vendor_serial_number: string;
    model: string;
    firmware_version: string;
    driver_status: string;
  }> {
    return this.request(`/devices/${deviceUid}`);
  }

  // Open device session
  async openSession(deviceUid: string): Promise<{ session_id: string }> {
    return this.request(`/devices/${deviceUid}/open-session`, { method: 'POST' });
  }

  // Close device session
  async closeSession(deviceUid: string): Promise<void> {
    return this.request(`/devices/${deviceUid}/close-session`, { method: 'POST' });
  }

  // Capture fingerprint
  async captureFingerprint(options?: {
    finger?: string;
    timeout_ms?: number;
  }): Promise<{
    success: boolean;
    template?: string;
    image_base64?: string;
    quality_score: number;
    finger: string;
    capture_time_ms: number;
  }> {
    return this.request('/capture/fingerprint', {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  }

  // Capture face
  async captureFace(options?: {
    timeout_ms?: number;
  }): Promise<{
    success: boolean;
    template?: string;
    image_base64?: string;
    quality_score: number;
    capture_time_ms: number;
  }> {
    return this.request('/capture/face', {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  }

  // Run diagnostics
  async runDiagnostics(deviceUid: string): Promise<{
    device_uid: string;
    health_status: HealthStatus;
    metrics: Record<string, unknown>;
    errors: string[];
    warnings: string[];
  }> {
    return this.request(`/devices/${deviceUid}/diagnostics`, { method: 'POST' });
  }
}

// Export a default instance (can be configured later)
export const deviceAgentClient = new DeviceAgentClient();
