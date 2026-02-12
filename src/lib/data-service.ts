'use client';

import { supabase } from './supabase';

// ============================================
// TYPES
// ============================================
export interface Province {
  id: string;
  code: string;
  name: string;
  region?: string;
  created_at?: string;
  updated_at?: string;
}

export interface District {
  id: string;
  code: string;
  name: string;
  province_id: string;
  province?: Province;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  auth_id?: string;
  email: string;
  full_name: string;
  role: 'registration_officer' | 'supervisor' | 'provincial_ro' | 'national_admin' | 'ict_security';
  province_id?: string;
  province?: Province;
  clearance_level: number;
  is_active: boolean;
  mfa_enabled: boolean;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Device {
  id: string;
  device_id: string;
  device_name: string;
  model?: string;
  serial_number?: string;
  assigned_ward_id?: string;
  assigned_operator_id?: string;
  status: 'online' | 'offline' | 'degraded' | 'maintenance';
  last_sync?: string;
  battery_level?: number;
  storage_used_gb?: number;
  storage_total_gb?: number;
  gps_enabled?: boolean;
  firmware_version?: string;
  registration_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface VoterRegistration {
  id: string;
  voter_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female';
  province_id?: string;
  district_id?: string;
  llg_id?: string;
  ward_id?: string;
  polling_place_id?: string;
  village_locality?: string;
  facial_image_id?: string;
  has_fingerprints?: boolean;
  fingerprint_count?: number;
  has_iris?: boolean;
  gps_latitude?: number;
  gps_longitude?: number;
  gps_accuracy?: number;
  registration_timestamp?: string;
  device_id?: string;
  operator_id?: string;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'exception';
  dedup_status: 'pending' | 'unique' | 'potential_duplicate' | 'confirmed_duplicate' | 'exception_approved';
  sync_status: 'pending' | 'syncing' | 'synced' | 'failed';
  signature_hash?: string;
  province?: Province;
  district?: District;
  created_at?: string;
  updated_at?: string;
}

export interface DedupMatch {
  id: string;
  voter1_id: string;
  voter2_id: string;
  voter1?: VoterRegistration;
  voter2?: VoterRegistration;
  match_score: number;
  fingerprint_score?: number;
  facial_score?: number;
  iris_score?: number;
  match_type: 'fingerprint' | 'facial' | 'iris' | 'multi';
  status: 'pending_review' | 'confirmed_match' | 'false_positive' | 'exception';
  priority?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  decision_reason?: string;
  signature_hash?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Exception {
  id: string;
  voter_id: string;
  voter?: VoterRegistration;
  exception_type: 'missing_fingerprint' | 'worn_fingerprint' | 'disability_accommodation' | 'photo_quality' | 'data_mismatch' | 'other';
  reason_code: string;
  description: string;
  priority?: string;
  status: 'open' | 'under_review' | 'approved' | 'rejected' | 'escalated';
  alternative_biometrics?: string[];
  created_by?: string;
  creator?: User;
  reviewed_by?: string;
  reviewer?: User;
  reviewed_at?: string;
  override_supervisor_id?: string;
  override_reason_code?: string;
  override_justification?: string;
  override_timestamp?: string;
  signature_hash?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SyncBatch {
  id: string;
  batch_id: string;
  device_id?: string;
  device?: Device;
  operator_id?: string;
  record_count: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  queued_at?: string;
  started_at?: string;
  completed_at?: string;
  hash_manifest?: string;
  upload_receipt?: string;
  error_message?: string;
  retry_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  action_label?: string;
  entity_type: string;
  entity_id: string;
  user_id?: string;
  user?: User;
  user_role?: string;
  description?: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  ip_address?: string;
  device_id?: string;
  signature_hash: string;
  category?: string;
}

export interface SystemStats {
  id?: string;
  snapshot_time?: string;
  total_registrations: number;
  pending_sync: number;
  pending_dedup: number;
  active_devices: number;
  offline_devices: number;
  exceptions_open: number;
  duplicates_detected: number;
  sync_completion_rate: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function generateSignatureHash(): string {
  return `sha256:${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export function generateVoterId(provinceCode: string): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `PNG-${year}-${provinceCode}-${random}`;
}

export function generateBatchId(deviceId: string): string {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `SB-${deviceId}-${date}-${random}`;
}

export function generateDeviceId(provinceCode: string, index: number): string {
  return `DEV-${provinceCode}-${String(index).padStart(3, '0')}`;
}

// ============================================
// PROVINCES CRUD
// ============================================
export async function getProvinces(): Promise<Province[]> {
  const { data, error } = await supabase
    .from('provinces')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching provinces:', error);
    return [];
  }

  return data || [];
}

export async function getProvinceById(id: string): Promise<Province | null> {
  const { data, error } = await supabase
    .from('provinces')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching province:', error);
    return null;
  }

  return data;
}

export async function createProvince(province: Omit<Province, 'id' | 'created_at' | 'updated_at'>): Promise<Province | null> {
  const { data, error } = await supabase
    .from('provinces')
    .insert(province)
    .select()
    .single();

  if (error) {
    console.error('Error creating province:', error);
    throw error;
  }

  return data;
}

export async function updateProvince(id: string, updates: Partial<Province>): Promise<Province | null> {
  const { data, error } = await supabase
    .from('provinces')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating province:', error);
    throw error;
  }

  return data;
}

export async function deleteProvince(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('provinces')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting province:', error);
    throw error;
  }

  return true;
}

// ============================================
// DISTRICTS CRUD
// ============================================
export async function getDistricts(provinceId?: string): Promise<District[]> {
  let query = supabase
    .from('districts')
    .select('*, province:provinces(*)')
    .order('name');

  if (provinceId) {
    query = query.eq('province_id', provinceId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching districts:', error);
    return [];
  }

  return data || [];
}

export async function createDistrict(district: { code: string; name: string; province_id: string }): Promise<District | null> {
  const { data, error } = await supabase
    .from('districts')
    .insert(district)
    .select('*, province:provinces(*)')
    .single();

  if (error) {
    console.error('Error creating district:', error);
    throw error;
  }

  return data;
}

export async function updateDistrict(id: string, updates: Partial<District>): Promise<District | null> {
  const { data, error } = await supabase
    .from('districts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, province:provinces(*)')
    .single();

  if (error) {
    console.error('Error updating district:', error);
    throw error;
  }

  return data;
}

export async function deleteDistrict(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('districts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting district:', error);
    throw error;
  }

  return true;
}

// ============================================
// USERS CRUD
// ============================================
export async function getUsers(limit = 100): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*, province:provinces(*)')
    .order('full_name')
    .limit(limit);

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return data || [];
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*, province:provinces(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
}

export async function createUser(user: {
  email: string;
  full_name: string;
  role: User['role'];
  province_id?: string;
  clearance_level?: number;
}): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .insert({
      ...user,
      is_active: true,
      mfa_enabled: false,
      clearance_level: user.clearance_level || 1,
    })
    .select('*, province:provinces(*)')
    .single();

  if (error) {
    console.error('Error creating user:', error);
    throw error;
  }

  return data;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, province:provinces(*)')
    .single();

  if (error) {
    console.error('Error updating user:', error);
    throw error;
  }

  return data;
}

export async function toggleUserStatus(id: string, isActive: boolean): Promise<User | null> {
  return updateUser(id, { is_active: isActive });
}

export async function deleteUser(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting user:', error);
    throw error;
  }

  return true;
}

// ============================================
// DEVICES CRUD
// ============================================
export async function getDevices(): Promise<Device[]> {
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .order('device_name');

  if (error) {
    console.error('Error fetching devices:', error);
    return [];
  }

  return data || [];
}

export async function getDeviceById(id: string): Promise<Device | null> {
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching device:', error);
    return null;
  }

  return data;
}

export async function createDevice(device: {
  device_id: string;
  device_name: string;
  model?: string;
  serial_number?: string;
  status?: Device['status'];
  battery_level?: number;
  storage_used_gb?: number;
  storage_total_gb?: number;
  gps_enabled?: boolean;
  firmware_version?: string;
}): Promise<Device | null> {
  const { data, error } = await supabase
    .from('devices')
    .insert({
      ...device,
      status: device.status || 'offline',
      registration_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating device:', error);
    throw error;
  }

  return data;
}

export async function updateDevice(id: string, updates: Partial<Device>): Promise<Device | null> {
  const { data, error } = await supabase
    .from('devices')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating device:', error);
    throw error;
  }

  return data;
}

export async function updateDeviceStatus(id: string, status: Device['status']): Promise<Device | null> {
  return updateDevice(id, { status, last_sync: new Date().toISOString() });
}

export async function deleteDevice(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('devices')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting device:', error);
    throw error;
  }

  return true;
}

// ============================================
// VOTER REGISTRATIONS CRUD
// ============================================
export async function getVoterRegistrations(options?: {
  limit?: number;
  status?: VoterRegistration['status'];
  dedup_status?: VoterRegistration['dedup_status'];
  province_id?: string;
  search?: string;
}): Promise<VoterRegistration[]> {
  let query = supabase
    .from('voter_registrations')
    .select('*, province:provinces(*), district:districts(*)')
    .order('registration_timestamp', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.dedup_status) {
    query = query.eq('dedup_status', options.dedup_status);
  }

  if (options?.province_id) {
    query = query.eq('province_id', options.province_id);
  }

  if (options?.search) {
    query = query.or(`first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%,voter_id.ilike.%${options.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching voter registrations:', error);
    return [];
  }

  return data || [];
}

export async function getVoterRegistrationById(id: string): Promise<VoterRegistration | null> {
  const { data, error } = await supabase
    .from('voter_registrations')
    .select('*, province:provinces(*), district:districts(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching voter registration:', error);
    return null;
  }

  return data;
}

export async function createVoterRegistration(registration: {
  voter_id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: string;
  gender: 'male' | 'female';
  village_locality?: string;
  gps_latitude?: number;
  gps_longitude?: number;
  gps_accuracy?: number;
  province_id?: string;
  district_id?: string;
}): Promise<VoterRegistration | null> {
  const { data, error } = await supabase
    .from('voter_registrations')
    .insert({
      ...registration,
      status: 'pending_review',
      dedup_status: 'pending',
      sync_status: 'synced',
      registration_timestamp: new Date().toISOString(),
      signature_hash: generateSignatureHash(),
    })
    .select('*, province:provinces(*), district:districts(*)')
    .single();

  if (error) {
    console.error('Error creating voter registration:', error);
    throw error;
  }

  // Create audit log
  await createAuditLog({
    action: 'REGISTRATION_CREATED',
    action_label: 'Voter Registration Created',
    entity_type: 'voter_registration',
    entity_id: data.id,
    description: `New voter registration created: ${registration.first_name} ${registration.last_name}`,
    category: 'registration',
  });

  return data;
}

export async function updateVoterRegistration(id: string, updates: Partial<VoterRegistration>): Promise<VoterRegistration | null> {
  const { data, error } = await supabase
    .from('voter_registrations')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, province:provinces(*), district:districts(*)')
    .single();

  if (error) {
    console.error('Error updating voter registration:', error);
    throw error;
  }

  return data;
}

export async function approveVoter(id: string): Promise<VoterRegistration | null> {
  const result = await updateVoterRegistration(id, { status: 'approved', dedup_status: 'unique' });

  if (result) {
    await createAuditLog({
      action: 'REGISTRATION_APPROVED',
      action_label: 'Registration Approved',
      entity_type: 'voter_registration',
      entity_id: id,
      description: `Voter registration approved: ${result.voter_id}`,
      category: 'registration',
    });
  }

  return result;
}

export async function rejectVoter(id: string, reason: string): Promise<VoterRegistration | null> {
  const result = await updateVoterRegistration(id, { status: 'rejected' });

  if (result) {
    await createAuditLog({
      action: 'REGISTRATION_REJECTED',
      action_label: 'Registration Rejected',
      entity_type: 'voter_registration',
      entity_id: id,
      description: `Voter registration rejected: ${result.voter_id}. Reason: ${reason}`,
      category: 'registration',
    });
  }

  return result;
}

export async function deleteVoterRegistration(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('voter_registrations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting voter registration:', error);
    throw error;
  }

  return true;
}

// ============================================
// DEDUP MATCHES CRUD
// ============================================
export async function getDedupMatches(options?: {
  limit?: number;
  status?: DedupMatch['status'];
}): Promise<DedupMatch[]> {
  let query = supabase
    .from('dedup_matches')
    .select('*, voter1:voter_registrations!voter1_id(*), voter2:voter_registrations!voter2_id(*)')
    .order('match_score', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching dedup matches:', error);
    return [];
  }

  return data || [];
}

export async function getDedupMatchById(id: string): Promise<DedupMatch | null> {
  const { data, error } = await supabase
    .from('dedup_matches')
    .select('*, voter1:voter_registrations!voter1_id(*), voter2:voter_registrations!voter2_id(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching dedup match:', error);
    return null;
  }

  return data;
}

export async function createDedupMatch(match: {
  voter1_id: string;
  voter2_id: string;
  match_score: number;
  match_type: DedupMatch['match_type'];
  fingerprint_score?: number;
  facial_score?: number;
}): Promise<DedupMatch | null> {
  const { data, error } = await supabase
    .from('dedup_matches')
    .insert({
      ...match,
      status: 'pending_review',
      priority: match.match_score >= 95 ? 'high' : match.match_score >= 85 ? 'medium' : 'low',
      signature_hash: generateSignatureHash(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating dedup match:', error);
    throw error;
  }

  return data;
}

export async function reviewDedupMatch(
  id: string,
  decision: 'confirmed_match' | 'false_positive',
  reason: string,
  reviewerId?: string
): Promise<DedupMatch | null> {
  const { data, error } = await supabase
    .from('dedup_matches')
    .update({
      status: decision,
      decision_reason: reason,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error reviewing dedup match:', error);
    throw error;
  }

  await createAuditLog({
    action: 'DEDUP_RESOLVED',
    action_label: decision === 'confirmed_match' ? 'Duplicate Confirmed' : 'False Positive',
    entity_type: 'dedup_match',
    entity_id: id,
    description: `Dedup match resolved as ${decision}: ${reason}`,
    category: 'dedup',
  });

  return data;
}

export async function deleteDedupMatch(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('dedup_matches')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting dedup match:', error);
    throw error;
  }

  return true;
}

// ============================================
// EXCEPTIONS CRUD
// ============================================
export async function getExceptions(options?: {
  limit?: number;
  status?: Exception['status'];
  exception_type?: Exception['exception_type'];
}): Promise<Exception[]> {
  let query = supabase
    .from('exceptions')
    .select('*, voter:voter_registrations(*), creator:users!created_by(*), reviewer:users!reviewed_by(*)')
    .order('created_at', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.exception_type) {
    query = query.eq('exception_type', options.exception_type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching exceptions:', error);
    return [];
  }

  return data || [];
}

export async function getExceptionById(id: string): Promise<Exception | null> {
  const { data, error } = await supabase
    .from('exceptions')
    .select('*, voter:voter_registrations(*), creator:users!created_by(*), reviewer:users!reviewed_by(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching exception:', error);
    return null;
  }

  return data;
}

export async function createException(exception: {
  voter_id: string;
  exception_type: Exception['exception_type'];
  reason_code: string;
  description: string;
  priority?: string;
  created_by?: string;
}): Promise<Exception | null> {
  const { data, error } = await supabase
    .from('exceptions')
    .insert({
      ...exception,
      status: 'open',
      priority: exception.priority || 'medium',
      signature_hash: generateSignatureHash(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating exception:', error);
    throw error;
  }

  await createAuditLog({
    action: 'EXCEPTION_CREATED',
    action_label: 'Exception Created',
    entity_type: 'exception',
    entity_id: data.id,
    description: `New exception created: ${exception.exception_type} - ${exception.description}`,
    category: 'exception',
  });

  return data;
}

export async function updateException(id: string, updates: Partial<Exception>): Promise<Exception | null> {
  const { data, error } = await supabase
    .from('exceptions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating exception:', error);
    throw error;
  }

  return data;
}

export async function reviewException(
  id: string,
  decision: 'approved' | 'rejected',
  reviewerId?: string,
  justification?: string
): Promise<Exception | null> {
  const { data, error } = await supabase
    .from('exceptions')
    .update({
      status: decision,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      override_justification: justification,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error reviewing exception:', error);
    throw error;
  }

  await createAuditLog({
    action: decision === 'approved' ? 'EXCEPTION_APPROVED' : 'EXCEPTION_REJECTED',
    action_label: decision === 'approved' ? 'Exception Approved' : 'Exception Rejected',
    entity_type: 'exception',
    entity_id: id,
    description: `Exception ${decision}${justification ? `: ${justification}` : ''}`,
    category: 'exception',
  });

  return data;
}

export async function escalateException(id: string, supervisorId: string): Promise<Exception | null> {
  const { data, error } = await supabase
    .from('exceptions')
    .update({
      status: 'escalated',
      override_supervisor_id: supervisorId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error escalating exception:', error);
    throw error;
  }

  await createAuditLog({
    action: 'EXCEPTION_ESCALATED',
    action_label: 'Exception Escalated',
    entity_type: 'exception',
    entity_id: id,
    description: 'Exception escalated to supervisor',
    category: 'exception',
  });

  return data;
}

export async function deleteException(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('exceptions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting exception:', error);
    throw error;
  }

  return true;
}

// ============================================
// SYNC BATCHES CRUD
// ============================================
export async function getSyncBatches(options?: {
  limit?: number;
  status?: SyncBatch['status'];
  device_id?: string;
}): Promise<SyncBatch[]> {
  let query = supabase
    .from('sync_batches')
    .select('*, device:devices(*)')
    .order('queued_at', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.device_id) {
    query = query.eq('device_id', options.device_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching sync batches:', error);
    return [];
  }

  return data || [];
}

export async function getSyncBatchById(id: string): Promise<SyncBatch | null> {
  const { data, error } = await supabase
    .from('sync_batches')
    .select('*, device:devices(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching sync batch:', error);
    return null;
  }

  return data;
}

export async function createSyncBatch(batch: {
  batch_id: string;
  device_id?: string;
  operator_id?: string;
  record_count: number;
}): Promise<SyncBatch | null> {
  const { data, error } = await supabase
    .from('sync_batches')
    .insert({
      ...batch,
      status: 'pending',
      progress: 0,
      queued_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating sync batch:', error);
    throw error;
  }

  return data;
}

export async function updateSyncBatch(id: string, updates: Partial<SyncBatch>): Promise<SyncBatch | null> {
  const { data, error } = await supabase
    .from('sync_batches')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating sync batch:', error);
    throw error;
  }

  return data;
}

export async function startSyncBatch(id: string): Promise<SyncBatch | null> {
  return updateSyncBatch(id, { status: 'in_progress', started_at: new Date().toISOString() });
}

export async function completeSyncBatch(id: string, receipt: string): Promise<SyncBatch | null> {
  return updateSyncBatch(id, {
    status: 'completed',
    progress: 100,
    completed_at: new Date().toISOString(),
    upload_receipt: receipt,
  });
}

export async function failSyncBatch(id: string, errorMessage: string): Promise<SyncBatch | null> {
  const batch = await getSyncBatchById(id);
  return updateSyncBatch(id, {
    status: 'failed',
    error_message: errorMessage,
    retry_count: (batch?.retry_count || 0) + 1,
  });
}

export async function retrySyncBatch(id: string): Promise<SyncBatch | null> {
  return updateSyncBatch(id, {
    status: 'pending',
    progress: 0,
    error_message: undefined,
    started_at: undefined,
    completed_at: undefined,
  });
}

export async function deleteSyncBatch(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('sync_batches')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting sync batch:', error);
    throw error;
  }

  return true;
}

// ============================================
// AUDIT LOGS CRUD
// ============================================
export async function getAuditLogs(options?: {
  limit?: number;
  category?: string;
  entity_type?: string;
  user_id?: string;
}): Promise<AuditLog[]> {
  let query = supabase
    .from('audit_logs')
    .select('*, user:users(*)')
    .order('timestamp', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.category) {
    query = query.eq('category', options.category);
  }

  if (options?.entity_type) {
    query = query.eq('entity_type', options.entity_type);
  }

  if (options?.user_id) {
    query = query.eq('user_id', options.user_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }

  return data || [];
}

export async function createAuditLog(log: {
  action: string;
  action_label?: string;
  entity_type: string;
  entity_id: string;
  description?: string;
  category?: string;
  user_id?: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
}): Promise<AuditLog | null> {
  const { data, error } = await supabase
    .from('audit_logs')
    .insert({
      ...log,
      timestamp: new Date().toISOString(),
      signature_hash: generateSignatureHash(),
      category: log.category || 'general',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating audit log:', error);
    return null;
  }

  return data;
}

// ============================================
// SYSTEM STATS
// ============================================
export async function getSystemStats(): Promise<SystemStats> {
  const { data, error } = await supabase
    .from('system_stats')
    .select('*')
    .order('snapshot_time', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    // Return computed stats
    const [registrations, devices, exceptions, matches] = await Promise.all([
      supabase.from('voter_registrations').select('id, status, dedup_status, sync_status'),
      supabase.from('devices').select('id, status'),
      supabase.from('exceptions').select('id, status'),
      supabase.from('dedup_matches').select('id, status'),
    ]);

    const voterData = registrations.data || [];
    const deviceData = devices.data || [];
    const exceptionData = exceptions.data || [];
    const matchData = matches.data || [];

    return {
      total_registrations: voterData.length,
      pending_sync: voterData.filter((v) => v.sync_status === 'pending').length,
      pending_dedup: matchData.filter((m) => m.status === 'pending_review').length,
      active_devices: deviceData.filter((d) => d.status === 'online').length,
      offline_devices: deviceData.filter((d) => d.status === 'offline').length,
      exceptions_open: exceptionData.filter((e) => e.status === 'open' || e.status === 'under_review').length,
      duplicates_detected: matchData.length,
      sync_completion_rate: voterData.length > 0
        ? (voterData.filter((v) => v.sync_status === 'synced').length / voterData.length) * 100
        : 0,
    };
  }

  return {
    id: data.id,
    snapshot_time: data.snapshot_time,
    total_registrations: data.total_registrations || 0,
    pending_sync: data.pending_sync || 0,
    pending_dedup: data.pending_dedup || 0,
    active_devices: data.active_devices || 0,
    offline_devices: data.offline_devices || 0,
    exceptions_open: data.exceptions_open || 0,
    duplicates_detected: data.duplicates_detected || 0,
    sync_completion_rate: data.sync_completion_rate || 0,
  };
}

export async function updateSystemStats(): Promise<SystemStats | null> {
  const stats = await getSystemStats();

  const { data, error } = await supabase
    .from('system_stats')
    .insert({
      total_registrations: stats.total_registrations,
      pending_sync: stats.pending_sync,
      pending_dedup: stats.pending_dedup,
      active_devices: stats.active_devices,
      offline_devices: stats.offline_devices,
      exceptions_open: stats.exceptions_open,
      duplicates_detected: stats.duplicates_detected,
      sync_completion_rate: stats.sync_completion_rate,
    })
    .select()
    .single();

  if (error) {
    console.error('Error updating system stats:', error);
    return null;
  }

  return data;
}

// ============================================
// PROVINCE STATS (Aggregated)
// ============================================
export async function getProvinceStats(): Promise<{
  province: string;
  code: string;
  registered: number;
  target: number;
  syncRate: number;
}[]> {
  const { data: provinces } = await supabase
    .from('provinces')
    .select('id, code, name');

  if (!provinces) return [];

  const { data: registrations } = await supabase
    .from('voter_registrations')
    .select('province_id, status, sync_status');

  const provinceMap = new Map<string, { name: string; code: string; count: number; synced: number }>();

  provinces.forEach((p) => {
    provinceMap.set(p.id, { name: p.name, code: p.code, count: 0, synced: 0 });
  });

  registrations?.forEach((r) => {
    if (r.province_id && provinceMap.has(r.province_id)) {
      const p = provinceMap.get(r.province_id)!;
      p.count++;
      if (r.sync_status === 'synced') {
        p.synced++;
      }
    }
  });

  return Array.from(provinceMap.entries()).map(([id, data]) => ({
    province: data.name,
    code: data.code,
    registered: data.count,
    target: Math.ceil(data.count * 1.2) || 1000, // Estimate target
    syncRate: data.count > 0 ? (data.synced / data.count) * 100 : 0,
  })).sort((a, b) => b.registered - a.registered);
}

// ============================================
// RECENT ACTIVITY
// ============================================
export async function getRecentActivity(limit = 10): Promise<{
  time: string;
  action: string;
  location: string;
  count: number;
}[]> {
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('timestamp, action_label, description, category')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (!logs) return [];

  return logs.map((log) => ({
    time: new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    action: log.action_label || log.description || 'Unknown action',
    location: 'System',
    count: 1,
  }));
}
