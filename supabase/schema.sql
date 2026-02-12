-- PNGEC-BRS Database Schema
-- Papua New Guinea Electoral Commission - Biometric Registration System
-- This schema is idempotent - can be run multiple times safely

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DROP EXISTING TYPES (for clean re-run)
-- ============================================
DO $$ BEGIN
  -- Drop policies first (they depend on tables)
  DROP POLICY IF EXISTS "Allow read access to provinces" ON provinces;
  DROP POLICY IF EXISTS "Allow read access to districts" ON districts;
  DROP POLICY IF EXISTS "Allow read access to llgs" ON llgs;
  DROP POLICY IF EXISTS "Allow read access to wards" ON wards;
  DROP POLICY IF EXISTS "Allow read access to polling_places" ON polling_places;
  DROP POLICY IF EXISTS "Allow read access to users" ON users;
  DROP POLICY IF EXISTS "Allow read access to devices" ON devices;
  DROP POLICY IF EXISTS "Allow read access to voter_registrations" ON voter_registrations;
  DROP POLICY IF EXISTS "Allow read access to dedup_matches" ON dedup_matches;
  DROP POLICY IF EXISTS "Allow read access to exceptions" ON exceptions;
  DROP POLICY IF EXISTS "Allow read access to sync_batches" ON sync_batches;
  DROP POLICY IF EXISTS "Allow read access to audit_logs" ON audit_logs;
  DROP POLICY IF EXISTS "Allow read access to system_stats" ON system_stats;
  DROP POLICY IF EXISTS "Allow insert for authenticated" ON voter_registrations;
  DROP POLICY IF EXISTS "Allow update for authenticated" ON voter_registrations;
  DROP POLICY IF EXISTS "Allow insert for authenticated" ON dedup_matches;
  DROP POLICY IF EXISTS "Allow update for authenticated" ON dedup_matches;
  DROP POLICY IF EXISTS "Allow insert for authenticated" ON exceptions;
  DROP POLICY IF EXISTS "Allow update for authenticated" ON exceptions;
  DROP POLICY IF EXISTS "Allow insert for authenticated" ON sync_batches;
  DROP POLICY IF EXISTS "Allow update for authenticated" ON sync_batches;
  DROP POLICY IF EXISTS "Allow insert for authenticated" ON audit_logs;
  DROP POLICY IF EXISTS "Allow insert for authenticated" ON system_stats;
  DROP POLICY IF EXISTS "Allow insert for authenticated" ON devices;
  DROP POLICY IF EXISTS "Allow update for authenticated" ON devices;
  DROP POLICY IF EXISTS "Allow insert for authenticated" ON users;
  DROP POLICY IF EXISTS "Allow update for authenticated" ON users;
  DROP POLICY IF EXISTS "Allow delete for authenticated" ON users;
  DROP POLICY IF EXISTS "Allow delete for authenticated" ON devices;
  DROP POLICY IF EXISTS "Allow delete for authenticated" ON voter_registrations;
  DROP POLICY IF EXISTS "Allow delete for authenticated" ON dedup_matches;
  DROP POLICY IF EXISTS "Allow delete for authenticated" ON exceptions;
  DROP POLICY IF EXISTS "Allow delete for authenticated" ON sync_batches;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================
-- LOCATION HIERARCHY TABLES
-- ============================================

-- Provinces table
CREATE TABLE IF NOT EXISTS provinces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  region VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Districts table
CREATE TABLE IF NOT EXISTS districts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  province_id UUID REFERENCES provinces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Local Level Governments (LLGs)
CREATE TABLE IF NOT EXISTS llgs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(30) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  district_id UUID REFERENCES districts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wards table
CREATE TABLE IF NOT EXISTS wards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(40) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  llg_id UUID REFERENCES llgs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Polling places table
CREATE TABLE IF NOT EXISTS polling_places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  ward_id UUID REFERENCES wards(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  capacity INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER MANAGEMENT TABLES
-- ============================================

-- User roles enum (drop and recreate for safety)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'registration_officer',
    'supervisor',
    'provincial_ro',
    'national_admin',
    'ict_security'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE, -- Links to Supabase Auth
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  role user_role NOT NULL DEFAULT 'registration_officer',
  province_id UUID REFERENCES provinces(id),
  clearance_level INTEGER DEFAULT 1 CHECK (clearance_level BETWEEN 1 AND 5),
  is_active BOOLEAN DEFAULT true,
  mfa_enabled BOOLEAN DEFAULT false,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DEVICE MANAGEMENT TABLES
-- ============================================

-- Device status enum
DO $$ BEGIN
  CREATE TYPE device_status AS ENUM ('online', 'offline', 'degraded', 'maintenance');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Registration devices/kits
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id VARCHAR(50) UNIQUE NOT NULL,
  device_name VARCHAR(100) NOT NULL,
  model VARCHAR(100),
  serial_number VARCHAR(100) UNIQUE,
  assigned_ward_id UUID REFERENCES wards(id),
  assigned_operator_id UUID REFERENCES users(id),
  status device_status DEFAULT 'offline',
  last_sync TIMESTAMPTZ,
  battery_level INTEGER CHECK (battery_level BETWEEN 0 AND 100),
  storage_used_gb DECIMAL(10, 2),
  storage_total_gb DECIMAL(10, 2),
  gps_enabled BOOLEAN DEFAULT true,
  firmware_version VARCHAR(20),
  registration_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VOTER REGISTRATION TABLES
-- ============================================

-- Registration status enum
DO $$ BEGIN
  CREATE TYPE registration_status AS ENUM (
    'draft',
    'pending_review',
    'approved',
    'rejected',
    'exception'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Deduplication status enum
DO $$ BEGIN
  CREATE TYPE dedup_status AS ENUM (
    'pending',
    'unique',
    'potential_duplicate',
    'confirmed_duplicate',
    'exception_approved'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Sync status enum
DO $$ BEGIN
  CREATE TYPE sync_status AS ENUM ('pending', 'syncing', 'synced', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Voter registrations table
CREATE TABLE IF NOT EXISTS voter_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voter_id VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female')),

  -- Location references
  province_id UUID REFERENCES provinces(id),
  district_id UUID REFERENCES districts(id),
  llg_id UUID REFERENCES llgs(id),
  ward_id UUID REFERENCES wards(id),
  polling_place_id UUID REFERENCES polling_places(id),
  village_locality VARCHAR(200),

  -- Biometric references (stored separately for security)
  facial_image_id VARCHAR(100),
  has_fingerprints BOOLEAN DEFAULT false,
  fingerprint_count INTEGER DEFAULT 0,
  has_iris BOOLEAN DEFAULT false,

  -- GPS capture
  gps_latitude DECIMAL(10, 8),
  gps_longitude DECIMAL(11, 8),
  gps_accuracy DECIMAL(10, 2),

  -- Registration metadata
  registration_timestamp TIMESTAMPTZ DEFAULT NOW(),
  device_id UUID REFERENCES devices(id),
  operator_id UUID REFERENCES users(id),

  -- Status fields
  status registration_status DEFAULT 'pending_review',
  dedup_status dedup_status DEFAULT 'pending',
  sync_status sync_status DEFAULT 'pending',

  -- Cryptographic verification
  signature_hash VARCHAR(256),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BIOMETRIC DEDUPLICATION TABLES
-- ============================================

-- Match type enum
DO $$ BEGIN
  CREATE TYPE match_type AS ENUM ('fingerprint', 'facial', 'iris', 'multi');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Match status enum
DO $$ BEGIN
  CREATE TYPE match_status AS ENUM (
    'pending_review',
    'confirmed_match',
    'false_positive',
    'exception'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Deduplication matches table
CREATE TABLE IF NOT EXISTS dedup_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voter1_id UUID REFERENCES voter_registrations(id) ON DELETE CASCADE,
  voter2_id UUID REFERENCES voter_registrations(id) ON DELETE CASCADE,
  match_score DECIMAL(5, 2) NOT NULL,
  fingerprint_score DECIMAL(5, 2),
  facial_score DECIMAL(5, 2),
  iris_score DECIMAL(5, 2),
  match_type match_type NOT NULL,
  status match_status DEFAULT 'pending_review',
  priority VARCHAR(20) DEFAULT 'medium',

  -- Review information
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  decision_reason TEXT,

  -- Audit
  signature_hash VARCHAR(256),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_match_pair UNIQUE (voter1_id, voter2_id)
);

-- ============================================
-- EXCEPTION HANDLING TABLES
-- ============================================

-- Exception type enum
DO $$ BEGIN
  CREATE TYPE exception_type AS ENUM (
    'missing_fingerprint',
    'worn_fingerprint',
    'disability_accommodation',
    'photo_quality',
    'data_mismatch',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Exception status enum
DO $$ BEGIN
  CREATE TYPE exception_status AS ENUM (
    'open',
    'under_review',
    'approved',
    'rejected',
    'escalated'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Exceptions table
CREATE TABLE IF NOT EXISTS exceptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voter_id UUID REFERENCES voter_registrations(id) ON DELETE CASCADE,
  exception_type exception_type NOT NULL,
  reason_code VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium',
  status exception_status DEFAULT 'open',

  -- Alternative biometrics captured
  alternative_biometrics TEXT[], -- Array of strings like ['facial', 'iris']

  -- Creator
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Reviewer
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,

  -- Supervisor override
  override_supervisor_id UUID REFERENCES users(id),
  override_reason_code VARCHAR(20),
  override_justification TEXT,
  override_timestamp TIMESTAMPTZ,

  -- Audit
  signature_hash VARCHAR(256),

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SYNC MANAGEMENT TABLES
-- ============================================

-- Sync batch status enum
DO $$ BEGIN
  CREATE TYPE sync_batch_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Sync batches table
CREATE TABLE IF NOT EXISTS sync_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id VARCHAR(50) UNIQUE NOT NULL,
  device_id UUID REFERENCES devices(id),
  operator_id UUID REFERENCES users(id),
  record_count INTEGER DEFAULT 0,
  status sync_batch_status DEFAULT 'pending',
  progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),

  -- Timing
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Verification
  hash_manifest VARCHAR(256),
  upload_receipt VARCHAR(100),

  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOG TABLES
-- ============================================

-- Audit logs table (append-only)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  action VARCHAR(100) NOT NULL,
  action_label VARCHAR(150),
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id),
  user_role user_role,
  description TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  device_id UUID REFERENCES devices(id),
  signature_hash VARCHAR(256) NOT NULL,
  category VARCHAR(50) DEFAULT 'general'
);

-- ============================================
-- SYSTEM STATISTICS TABLE
-- ============================================

-- System stats snapshot
CREATE TABLE IF NOT EXISTS system_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_time TIMESTAMPTZ DEFAULT NOW(),
  total_registrations BIGINT DEFAULT 0,
  pending_sync INTEGER DEFAULT 0,
  pending_dedup INTEGER DEFAULT 0,
  active_devices INTEGER DEFAULT 0,
  offline_devices INTEGER DEFAULT 0,
  exceptions_open INTEGER DEFAULT 0,
  duplicates_detected INTEGER DEFAULT 0,
  sync_completion_rate DECIMAL(5, 2) DEFAULT 0
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_voter_registrations_status ON voter_registrations(status);
CREATE INDEX IF NOT EXISTS idx_voter_registrations_dedup_status ON voter_registrations(dedup_status);
CREATE INDEX IF NOT EXISTS idx_voter_registrations_province ON voter_registrations(province_id);
CREATE INDEX IF NOT EXISTS idx_voter_registrations_ward ON voter_registrations(ward_id);
CREATE INDEX IF NOT EXISTS idx_voter_registrations_voter_id ON voter_registrations(voter_id);

CREATE INDEX IF NOT EXISTS idx_dedup_matches_status ON dedup_matches(status);
CREATE INDEX IF NOT EXISTS idx_dedup_matches_score ON dedup_matches(match_score DESC);

CREATE INDEX IF NOT EXISTS idx_exceptions_status ON exceptions(status);
CREATE INDEX IF NOT EXISTS idx_exceptions_type ON exceptions(exception_type);

CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_ward ON devices(assigned_ward_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_sync_batches_status ON sync_batches(status);
CREATE INDEX IF NOT EXISTS idx_sync_batches_device ON sync_batches(device_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE llgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE polling_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE voter_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dedup_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (adjust based on requirements)
CREATE POLICY "Allow read access to provinces" ON provinces FOR SELECT USING (true);
CREATE POLICY "Allow read access to districts" ON districts FOR SELECT USING (true);
CREATE POLICY "Allow read access to llgs" ON llgs FOR SELECT USING (true);
CREATE POLICY "Allow read access to wards" ON wards FOR SELECT USING (true);
CREATE POLICY "Allow read access to polling_places" ON polling_places FOR SELECT USING (true);
CREATE POLICY "Allow read access to users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow read access to devices" ON devices FOR SELECT USING (true);
CREATE POLICY "Allow read access to voter_registrations" ON voter_registrations FOR SELECT USING (true);
CREATE POLICY "Allow read access to dedup_matches" ON dedup_matches FOR SELECT USING (true);
CREATE POLICY "Allow read access to exceptions" ON exceptions FOR SELECT USING (true);
CREATE POLICY "Allow read access to sync_batches" ON sync_batches FOR SELECT USING (true);
CREATE POLICY "Allow read access to audit_logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow read access to system_stats" ON system_stats FOR SELECT USING (true);

-- Allow insert/update/delete for authenticated users (service role will bypass RLS)
CREATE POLICY "Allow insert for authenticated" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for authenticated" ON users FOR UPDATE USING (true);
CREATE POLICY "Allow delete for authenticated" ON users FOR DELETE USING (true);

CREATE POLICY "Allow insert for authenticated" ON devices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for authenticated" ON devices FOR UPDATE USING (true);
CREATE POLICY "Allow delete for authenticated" ON devices FOR DELETE USING (true);

CREATE POLICY "Allow insert for authenticated" ON voter_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for authenticated" ON voter_registrations FOR UPDATE USING (true);
CREATE POLICY "Allow delete for authenticated" ON voter_registrations FOR DELETE USING (true);

CREATE POLICY "Allow insert for authenticated" ON dedup_matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for authenticated" ON dedup_matches FOR UPDATE USING (true);
CREATE POLICY "Allow delete for authenticated" ON dedup_matches FOR DELETE USING (true);

CREATE POLICY "Allow insert for authenticated" ON exceptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for authenticated" ON exceptions FOR UPDATE USING (true);
CREATE POLICY "Allow delete for authenticated" ON exceptions FOR DELETE USING (true);

CREATE POLICY "Allow insert for authenticated" ON sync_batches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for authenticated" ON sync_batches FOR UPDATE USING (true);
CREATE POLICY "Allow delete for authenticated" ON sync_batches FOR DELETE USING (true);

CREATE POLICY "Allow insert for authenticated" ON audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert for authenticated" ON system_stats FOR INSERT WITH CHECK (true);
