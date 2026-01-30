export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole =
  | 'registration_officer'
  | 'supervisor'
  | 'provincial_ro'
  | 'national_admin'
  | 'ict_security';

export type DeviceStatus = 'online' | 'offline' | 'degraded' | 'maintenance';

export type RegistrationStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'exception';

export type DedupStatus =
  | 'pending'
  | 'unique'
  | 'potential_duplicate'
  | 'confirmed_duplicate'
  | 'exception_approved';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export type MatchType = 'fingerprint' | 'facial' | 'iris' | 'multi';

export type MatchStatus =
  | 'pending_review'
  | 'confirmed_match'
  | 'false_positive'
  | 'exception';

export type ExceptionType =
  | 'missing_fingerprint'
  | 'worn_fingerprint'
  | 'disability_accommodation'
  | 'photo_quality'
  | 'data_mismatch'
  | 'other';

export type ExceptionStatus =
  | 'open'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'escalated';

export type SyncBatchStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface Database {
  public: {
    Tables: {
      provinces: {
        Row: {
          id: string;
          code: string;
          name: string;
          region: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          region?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          region?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      districts: {
        Row: {
          id: string;
          code: string;
          name: string;
          province_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          province_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          province_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      wards: {
        Row: {
          id: string;
          code: string;
          name: string;
          llg_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          llg_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          llg_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          auth_id: string | null;
          email: string;
          full_name: string;
          role: UserRole;
          province_id: string | null;
          clearance_level: number;
          is_active: boolean;
          mfa_enabled: boolean;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_id?: string | null;
          email: string;
          full_name: string;
          role?: UserRole;
          province_id?: string | null;
          clearance_level?: number;
          is_active?: boolean;
          mfa_enabled?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_id?: string | null;
          email?: string;
          full_name?: string;
          role?: UserRole;
          province_id?: string | null;
          clearance_level?: number;
          is_active?: boolean;
          mfa_enabled?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      devices: {
        Row: {
          id: string;
          device_id: string;
          device_name: string;
          model: string | null;
          serial_number: string | null;
          assigned_ward_id: string | null;
          assigned_operator_id: string | null;
          status: DeviceStatus;
          last_sync: string | null;
          battery_level: number | null;
          storage_used_gb: number | null;
          storage_total_gb: number | null;
          gps_enabled: boolean;
          firmware_version: string | null;
          registration_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          device_id: string;
          device_name: string;
          model?: string | null;
          serial_number?: string | null;
          assigned_ward_id?: string | null;
          assigned_operator_id?: string | null;
          status?: DeviceStatus;
          last_sync?: string | null;
          battery_level?: number | null;
          storage_used_gb?: number | null;
          storage_total_gb?: number | null;
          gps_enabled?: boolean;
          firmware_version?: string | null;
          registration_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          device_name?: string;
          model?: string | null;
          serial_number?: string | null;
          assigned_ward_id?: string | null;
          assigned_operator_id?: string | null;
          status?: DeviceStatus;
          last_sync?: string | null;
          battery_level?: number | null;
          storage_used_gb?: number | null;
          storage_total_gb?: number | null;
          gps_enabled?: boolean;
          firmware_version?: string | null;
          registration_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      voter_registrations: {
        Row: {
          id: string;
          voter_id: string;
          first_name: string;
          middle_name: string | null;
          last_name: string;
          date_of_birth: string;
          gender: string | null;
          province_id: string | null;
          district_id: string | null;
          llg_id: string | null;
          ward_id: string | null;
          polling_place_id: string | null;
          village_locality: string | null;
          facial_image_id: string | null;
          has_fingerprints: boolean;
          fingerprint_count: number;
          has_iris: boolean;
          gps_latitude: number | null;
          gps_longitude: number | null;
          gps_accuracy: number | null;
          registration_timestamp: string;
          device_id: string | null;
          operator_id: string | null;
          status: RegistrationStatus;
          dedup_status: DedupStatus;
          sync_status: SyncStatus;
          signature_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          voter_id: string;
          first_name: string;
          middle_name?: string | null;
          last_name: string;
          date_of_birth: string;
          gender?: string | null;
          province_id?: string | null;
          district_id?: string | null;
          llg_id?: string | null;
          ward_id?: string | null;
          polling_place_id?: string | null;
          village_locality?: string | null;
          facial_image_id?: string | null;
          has_fingerprints?: boolean;
          fingerprint_count?: number;
          has_iris?: boolean;
          gps_latitude?: number | null;
          gps_longitude?: number | null;
          gps_accuracy?: number | null;
          registration_timestamp?: string;
          device_id?: string | null;
          operator_id?: string | null;
          status?: RegistrationStatus;
          dedup_status?: DedupStatus;
          sync_status?: SyncStatus;
          signature_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          voter_id?: string;
          first_name?: string;
          middle_name?: string | null;
          last_name?: string;
          date_of_birth?: string;
          gender?: string | null;
          province_id?: string | null;
          district_id?: string | null;
          llg_id?: string | null;
          ward_id?: string | null;
          polling_place_id?: string | null;
          village_locality?: string | null;
          facial_image_id?: string | null;
          has_fingerprints?: boolean;
          fingerprint_count?: number;
          has_iris?: boolean;
          gps_latitude?: number | null;
          gps_longitude?: number | null;
          gps_accuracy?: number | null;
          registration_timestamp?: string;
          device_id?: string | null;
          operator_id?: string | null;
          status?: RegistrationStatus;
          dedup_status?: DedupStatus;
          sync_status?: SyncStatus;
          signature_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      dedup_matches: {
        Row: {
          id: string;
          voter1_id: string | null;
          voter2_id: string | null;
          match_score: number;
          fingerprint_score: number | null;
          facial_score: number | null;
          iris_score: number | null;
          match_type: MatchType;
          status: MatchStatus;
          priority: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          decision_reason: string | null;
          signature_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          voter1_id?: string | null;
          voter2_id?: string | null;
          match_score: number;
          fingerprint_score?: number | null;
          facial_score?: number | null;
          iris_score?: number | null;
          match_type: MatchType;
          status?: MatchStatus;
          priority?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          decision_reason?: string | null;
          signature_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          voter1_id?: string | null;
          voter2_id?: string | null;
          match_score?: number;
          fingerprint_score?: number | null;
          facial_score?: number | null;
          iris_score?: number | null;
          match_type?: MatchType;
          status?: MatchStatus;
          priority?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          decision_reason?: string | null;
          signature_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      exceptions: {
        Row: {
          id: string;
          voter_id: string | null;
          exception_type: ExceptionType;
          reason_code: string;
          description: string;
          priority: string | null;
          status: ExceptionStatus;
          alternative_biometrics: string[] | null;
          created_by: string | null;
          created_at: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          override_supervisor_id: string | null;
          override_reason_code: string | null;
          override_justification: string | null;
          override_timestamp: string | null;
          signature_hash: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          voter_id?: string | null;
          exception_type: ExceptionType;
          reason_code: string;
          description: string;
          priority?: string | null;
          status?: ExceptionStatus;
          alternative_biometrics?: string[] | null;
          created_by?: string | null;
          created_at?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          override_supervisor_id?: string | null;
          override_reason_code?: string | null;
          override_justification?: string | null;
          override_timestamp?: string | null;
          signature_hash?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          voter_id?: string | null;
          exception_type?: ExceptionType;
          reason_code?: string;
          description?: string;
          priority?: string | null;
          status?: ExceptionStatus;
          alternative_biometrics?: string[] | null;
          created_by?: string | null;
          created_at?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          override_supervisor_id?: string | null;
          override_reason_code?: string | null;
          override_justification?: string | null;
          override_timestamp?: string | null;
          signature_hash?: string | null;
          updated_at?: string;
        };
      };
      sync_batches: {
        Row: {
          id: string;
          batch_id: string;
          device_id: string | null;
          operator_id: string | null;
          record_count: number;
          status: SyncBatchStatus;
          progress: number;
          queued_at: string;
          started_at: string | null;
          completed_at: string | null;
          hash_manifest: string | null;
          upload_receipt: string | null;
          error_message: string | null;
          retry_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          batch_id: string;
          device_id?: string | null;
          operator_id?: string | null;
          record_count?: number;
          status?: SyncBatchStatus;
          progress?: number;
          queued_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          hash_manifest?: string | null;
          upload_receipt?: string | null;
          error_message?: string | null;
          retry_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          batch_id?: string;
          device_id?: string | null;
          operator_id?: string | null;
          record_count?: number;
          status?: SyncBatchStatus;
          progress?: number;
          queued_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          hash_manifest?: string | null;
          upload_receipt?: string | null;
          error_message?: string | null;
          retry_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          timestamp: string;
          action: string;
          action_label: string | null;
          entity_type: string;
          entity_id: string;
          user_id: string | null;
          user_role: UserRole | null;
          description: string | null;
          old_value: Json | null;
          new_value: Json | null;
          ip_address: string | null;
          device_id: string | null;
          signature_hash: string;
          category: string | null;
        };
        Insert: {
          id?: string;
          timestamp?: string;
          action: string;
          action_label?: string | null;
          entity_type: string;
          entity_id: string;
          user_id?: string | null;
          user_role?: UserRole | null;
          description?: string | null;
          old_value?: Json | null;
          new_value?: Json | null;
          ip_address?: string | null;
          device_id?: string | null;
          signature_hash: string;
          category?: string | null;
        };
        Update: {
          id?: string;
          timestamp?: string;
          action?: string;
          action_label?: string | null;
          entity_type?: string;
          entity_id?: string;
          user_id?: string | null;
          user_role?: UserRole | null;
          description?: string | null;
          old_value?: Json | null;
          new_value?: Json | null;
          ip_address?: string | null;
          device_id?: string | null;
          signature_hash?: string;
          category?: string | null;
        };
      };
      system_stats: {
        Row: {
          id: string;
          snapshot_time: string;
          total_registrations: number;
          pending_sync: number;
          pending_dedup: number;
          active_devices: number;
          offline_devices: number;
          exceptions_open: number;
          duplicates_detected: number;
          sync_completion_rate: number;
        };
        Insert: {
          id?: string;
          snapshot_time?: string;
          total_registrations?: number;
          pending_sync?: number;
          pending_dedup?: number;
          active_devices?: number;
          offline_devices?: number;
          exceptions_open?: number;
          duplicates_detected?: number;
          sync_completion_rate?: number;
        };
        Update: {
          id?: string;
          snapshot_time?: string;
          total_registrations?: number;
          pending_sync?: number;
          pending_dedup?: number;
          active_devices?: number;
          offline_devices?: number;
          exceptions_open?: number;
          duplicates_detected?: number;
          sync_completion_rate?: number;
        };
      };
    };
  };
}
