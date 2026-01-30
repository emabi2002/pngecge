-- ============================================
-- PNGEC-BRS National Device Registry Schema
-- Biometric Device SDK Integration Module
-- ============================================

-- ============================================
-- DEVICES TABLE (Core Device Registry)
-- ============================================
CREATE TABLE IF NOT EXISTS devices (
  device_uid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_serial_number VARCHAR(100) UNIQUE NOT NULL,
  vendor_name VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  device_type VARCHAR(50) NOT NULL CHECK (device_type IN ('fingerprint', 'face', 'iris', 'multi', 'card_reader', 'signature_pad')),
  connectivity VARCHAR(50) NOT NULL DEFAULT 'usb' CHECK (connectivity IN ('usb', 'wireless', 'bluetooth', 'ethernet', 'both')),

  -- Version Information
  firmware_version VARCHAR(50),
  driver_version VARCHAR(50),
  sdk_version VARCHAR(50),

  -- Asset Management
  asset_tag VARCHAR(100) UNIQUE,
  purchase_batch_id VARCHAR(100),
  purchase_date DATE,
  purchase_price DECIMAL(10, 2),
  warranty_expiry DATE,
  warranty_provider VARCHAR(200),

  -- Lifecycle Status
  status VARCHAR(50) NOT NULL DEFAULT 'NEW_UNREGISTERED' CHECK (status IN (
    'NEW_UNREGISTERED',
    'REGISTERED_IN_INVENTORY',
    'ALLOCATED_TO_REGION',
    'DEPLOYED_TO_SITE',
    'IN_MAINTENANCE',
    'IN_REPAIR',
    'RETIRED',
    'LOST',
    'STOLEN',
    'DECOMMISSIONED'
  )),

  -- Technical Details
  vid VARCHAR(10),
  pid VARCHAR(10),
  device_descriptor TEXT,
  capabilities JSONB DEFAULT '{}',
  calibration_data JSONB,
  last_calibration_date TIMESTAMPTZ,

  -- Location & Assignment (denormalized for quick access)
  current_province VARCHAR(100),
  current_district VARCHAR(100),
  current_custodian_id UUID,
  current_custodian_name VARCHAR(200),
  current_station_id VARCHAR(50),

  -- Health & Status
  last_seen_at TIMESTAMPTZ,
  last_health_status VARCHAR(20) DEFAULT 'UNKNOWN' CHECK (last_health_status IN ('OK', 'WARN', 'FAIL', 'UNKNOWN', 'OFFLINE')),
  total_capture_count INTEGER DEFAULT 0,
  total_error_count INTEGER DEFAULT 0,

  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  qr_code_data TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- ============================================
-- DEVICE ASSIGNMENTS TABLE
-- Tracks allocations and transfers
-- ============================================
CREATE TABLE IF NOT EXISTS device_assignments (
  assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_uid UUID NOT NULL REFERENCES devices(device_uid) ON DELETE CASCADE,

  -- Assignment Details
  assignment_type VARCHAR(50) NOT NULL CHECK (assignment_type IN (
    'INITIAL_ALLOCATION',
    'TRANSFER',
    'TEMPORARY_LOAN',
    'MAINTENANCE_HANDOVER',
    'RETURN_TO_HQ',
    'FIELD_DEPLOYMENT',
    'TRAINING_USE'
  )),

  -- From/To
  from_org_unit VARCHAR(200),
  to_org_unit VARCHAR(200) NOT NULL,
  from_person_id UUID,
  from_person_name VARCHAR(200),
  to_person_id UUID,
  to_person_name VARCHAR(200) NOT NULL,

  -- Location
  from_province VARCHAR(100),
  from_district VARCHAR(100),
  to_province VARCHAR(100),
  to_district VARCHAR(100),

  -- Timing
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_return_date DATE,
  released_at TIMESTAMPTZ,

  -- Purpose & Documentation
  purpose VARCHAR(200),
  event_name VARCHAR(200),
  authorization_reference VARCHAR(100),
  handover_document_url TEXT,

  -- Status
  status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED', 'OVERDUE')),

  -- Approval
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,

  -- Audit
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- ============================================
-- DEVICE DEPLOYMENTS TABLE
-- Tracks physical deployment locations
-- ============================================
CREATE TABLE IF NOT EXISTS device_deployments (
  deployment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_uid UUID NOT NULL REFERENCES devices(device_uid) ON DELETE CASCADE,

  -- Location Hierarchy
  province VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  llg VARCHAR(100),
  ward VARCHAR(100),

  -- Polling Station Details
  polling_site_name VARCHAR(200) NOT NULL,
  polling_site_code VARCHAR(50),
  station_id VARCHAR(50),
  station_type VARCHAR(50) CHECK (station_type IN ('POLLING_STATION', 'REGISTRATION_CENTER', 'DISTRICT_OFFICE', 'PROVINCIAL_OFFICE', 'HQ', 'MOBILE_UNIT', 'TRAINING_CENTER')),

  -- GPS Coordinates
  gps_lat DECIMAL(10, 8),
  gps_lng DECIMAL(11, 8),
  gps_accuracy_m DECIMAL(10, 2),
  gps_altitude_m DECIMAL(10, 2),
  gps_capture_method VARCHAR(50) CHECK (gps_capture_method IN ('DEVICE_GPS', 'EXTERNAL_GPS', 'MOBILE_COMPANION', 'MANUAL_ENTRY', 'MAP_PIN')),
  gps_confidence VARCHAR(20) DEFAULT 'UNKNOWN' CHECK (gps_confidence IN ('HIGH', 'MEDIUM', 'LOW', 'UNKNOWN')),
  gps_captured_at TIMESTAMPTZ,

  -- Deployment Details
  deployment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deployed_by UUID,
  deployed_by_name VARCHAR(200),
  deployment_purpose VARCHAR(200),
  event_name VARCHAR(200),

  -- Retrieval
  expected_retrieval_date DATE,
  retrieved_date TIMESTAMPTZ,
  retrieved_by UUID,
  retrieved_by_name VARCHAR(200),
  retrieval_condition VARCHAR(50) CHECK (retrieval_condition IN ('GOOD', 'MINOR_DAMAGE', 'MAJOR_DAMAGE', 'MISSING_PARTS', 'NON_FUNCTIONAL')),
  retrieval_notes TEXT,

  -- Status
  deployment_status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (deployment_status IN ('PLANNED', 'ACTIVE', 'RETRIEVED', 'RELOCATED', 'LOST', 'STOLEN')),

  -- Verification
  verified_at_location BOOLEAN DEFAULT FALSE,
  verification_photo_url TEXT,
  verification_notes TEXT,

  -- Audit
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- ============================================
-- DEVICE HEALTH LOGS TABLE
-- Tracks device health and diagnostics
-- ============================================
CREATE TABLE IF NOT EXISTS device_health_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_uid UUID NOT NULL REFERENCES devices(device_uid) ON DELETE CASCADE,

  -- Timing
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Health Status
  health_status VARCHAR(20) NOT NULL CHECK (health_status IN ('OK', 'WARN', 'FAIL', 'OFFLINE')),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),

  -- Error Information
  error_codes TEXT[],
  error_messages TEXT[],
  warning_codes TEXT[],
  warning_messages TEXT[],

  -- Metrics
  metrics_json JSONB DEFAULT '{}',
  -- Example metrics:
  -- {
  --   "temperature_c": 42.5,
  --   "sensor_quality": 95,
  --   "battery_level": 80,
  --   "memory_usage_mb": 256,
  --   "uptime_seconds": 86400,
  --   "capture_success_rate": 98.5,
  --   "last_capture_quality": 85
  -- }

  -- Version Info at time of log
  firmware_version VARCHAR(50),
  driver_version VARCHAR(50),
  agent_version VARCHAR(50),

  -- Connection Info
  connection_type VARCHAR(20),
  connection_quality VARCHAR(20) CHECK (connection_quality IN ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'NONE')),

  -- Location at time of health check
  station_id VARCHAR(50),
  province VARCHAR(100),
  district VARCHAR(100),

  -- Source
  log_source VARCHAR(50) DEFAULT 'AGENT' CHECK (log_source IN ('AGENT', 'MANUAL', 'SCHEDULED', 'SYSTEM', 'REMOTE')),

  -- Audit
  notes TEXT,
  created_by UUID
);

-- ============================================
-- DEVICE AUDIT EVENTS TABLE
-- Immutable audit trail for all device actions
-- ============================================
CREATE TABLE IF NOT EXISTS device_audit_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_uid UUID REFERENCES devices(device_uid) ON DELETE SET NULL,

  -- Event Details
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'DEVICE_DETECTED',
    'DEVICE_REGISTERED',
    'DEVICE_UPDATED',
    'DEVICE_ALLOCATED',
    'DEVICE_TRANSFERRED',
    'DEVICE_DEPLOYED',
    'DEVICE_RETRIEVED',
    'DEVICE_RELOCATED',
    'DEVICE_MAINTENANCE_START',
    'DEVICE_MAINTENANCE_END',
    'DEVICE_RETIRED',
    'DEVICE_LOST',
    'DEVICE_FOUND',
    'CAPTURE_ATTEMPT',
    'CAPTURE_SUCCESS',
    'CAPTURE_FAILURE',
    'SESSION_OPENED',
    'SESSION_CLOSED',
    'FIRMWARE_UPDATE',
    'CALIBRATION',
    'DIAGNOSTIC_RUN',
    'ERROR_REPORTED',
    'TAMPER_DETECTED',
    'GPS_MISMATCH',
    'CUSTODY_CHANGE',
    'STATUS_CHANGE',
    'CONFIG_CHANGE'
  )),
  event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Actor
  actor_user_id UUID,
  actor_user_name VARCHAR(200),
  actor_user_role VARCHAR(100),
  actor_ip_address INET,
  actor_user_agent TEXT,

  -- Location Context
  station_id VARCHAR(50),
  province VARCHAR(100),
  district VARCHAR(100),
  gps_lat DECIMAL(10, 8),
  gps_lng DECIMAL(11, 8),

  -- Event Data
  payload_json JSONB NOT NULL DEFAULT '{}',
  -- Example payloads:
  -- CAPTURE_SUCCESS: { "capture_type": "fingerprint", "finger": "right_index", "quality_score": 92, "template_size": 512 }
  -- DEVICE_DEPLOYED: { "from_location": "HQ", "to_location": "Goroka District Office", "purpose": "NG Election 2027" }
  -- ERROR_REPORTED: { "error_code": "SDK_001", "error_message": "Sensor timeout", "severity": "WARN" }

  -- Previous State (for changes)
  previous_state_json JSONB,
  new_state_json JSONB,

  -- Severity
  severity VARCHAR(20) DEFAULT 'INFO' CHECK (severity IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL')),

  -- Hash Chain for Tamper Evidence (optional)
  hash_chain_prev VARCHAR(64),
  event_hash VARCHAR(64),

  -- Categorization
  category VARCHAR(50) DEFAULT 'OPERATION' CHECK (category IN ('LIFECYCLE', 'OPERATION', 'SECURITY', 'MAINTENANCE', 'CAPTURE', 'ERROR', 'SYSTEM')),

  -- Flags
  requires_review BOOLEAN DEFAULT FALSE,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Immutability marker
  is_immutable BOOLEAN DEFAULT TRUE
);

-- ============================================
-- DEVICE AGENTS TABLE
-- Tracks installed Device Agent instances
-- ============================================
CREATE TABLE IF NOT EXISTS device_agents (
  agent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Agent Identity
  machine_name VARCHAR(200) NOT NULL,
  machine_id VARCHAR(100) UNIQUE,
  agent_version VARCHAR(50) NOT NULL,

  -- Installation
  installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  installed_by UUID,
  installation_path TEXT,

  -- Configuration
  api_port INTEGER DEFAULT 9876,
  environment VARCHAR(20) DEFAULT 'PROD' CHECK (environment IN ('DEV', 'UAT', 'PROD')),
  config_json JSONB DEFAULT '{}',

  -- SDK Info
  sdk_vendor VARCHAR(100),
  sdk_version VARCHAR(50),
  driver_version VARCHAR(50),

  -- Status
  status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'UPDATING', 'ERROR', 'UNINSTALLED')),
  last_heartbeat_at TIMESTAMPTZ,
  last_error TEXT,

  -- Location
  assigned_station_id VARCHAR(50),
  assigned_province VARCHAR(100),
  assigned_district VARCHAR(100),

  -- Security
  auth_token_hash VARCHAR(64),
  token_expires_at TIMESTAMPTZ,
  allowed_origins TEXT[],

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DEVICE BATCHES TABLE
-- Tracks procurement batches
-- ============================================
CREATE TABLE IF NOT EXISTS device_batches (
  batch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Batch Info
  batch_reference VARCHAR(100) UNIQUE NOT NULL,
  batch_name VARCHAR(200),

  -- Procurement
  vendor_name VARCHAR(200) NOT NULL,
  vendor_contact VARCHAR(200),
  purchase_order_number VARCHAR(100),
  purchase_date DATE,
  delivery_date DATE,

  -- Financial
  total_cost DECIMAL(12, 2),
  currency VARCHAR(3) DEFAULT 'PGK',

  -- Devices
  device_type VARCHAR(50),
  device_model VARCHAR(100),
  quantity_ordered INTEGER NOT NULL,
  quantity_received INTEGER DEFAULT 0,
  quantity_accepted INTEGER DEFAULT 0,
  quantity_rejected INTEGER DEFAULT 0,

  -- Warranty
  warranty_months INTEGER DEFAULT 12,
  warranty_start_date DATE,
  warranty_end_date DATE,
  warranty_terms TEXT,

  -- Documentation
  invoice_url TEXT,
  delivery_note_url TEXT,
  acceptance_report_url TEXT,

  -- Status
  status VARCHAR(30) DEFAULT 'ORDERED' CHECK (status IN ('ORDERED', 'SHIPPED', 'RECEIVED', 'INSPECTING', 'ACCEPTED', 'PARTIAL_ACCEPT', 'REJECTED', 'CANCELLED')),

  -- Audit
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Devices
CREATE INDEX IF NOT EXISTS idx_devices_serial ON devices(vendor_serial_number);
CREATE INDEX IF NOT EXISTS idx_devices_asset_tag ON devices(asset_tag);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(device_type);
CREATE INDEX IF NOT EXISTS idx_devices_vendor ON devices(vendor_name);
CREATE INDEX IF NOT EXISTS idx_devices_province ON devices(current_province);
CREATE INDEX IF NOT EXISTS idx_devices_district ON devices(current_district);
CREATE INDEX IF NOT EXISTS idx_devices_custodian ON devices(current_custodian_id);
CREATE INDEX IF NOT EXISTS idx_devices_health ON devices(last_health_status);
CREATE INDEX IF NOT EXISTS idx_devices_last_seen ON devices(last_seen_at DESC);

-- Assignments
CREATE INDEX IF NOT EXISTS idx_assignments_device ON device_assignments(device_uid);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON device_assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_to_person ON device_assignments(to_person_id);
CREATE INDEX IF NOT EXISTS idx_assignments_date ON device_assignments(assigned_at DESC);

-- Deployments
CREATE INDEX IF NOT EXISTS idx_deployments_device ON device_deployments(device_uid);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON device_deployments(deployment_status);
CREATE INDEX IF NOT EXISTS idx_deployments_province ON device_deployments(province);
CREATE INDEX IF NOT EXISTS idx_deployments_district ON device_deployments(district);
CREATE INDEX IF NOT EXISTS idx_deployments_station ON device_deployments(station_id);
CREATE INDEX IF NOT EXISTS idx_deployments_date ON device_deployments(deployment_date DESC);
CREATE INDEX IF NOT EXISTS idx_deployments_gps ON device_deployments(gps_lat, gps_lng);

-- Health Logs
CREATE INDEX IF NOT EXISTS idx_health_device ON device_health_logs(device_uid);
CREATE INDEX IF NOT EXISTS idx_health_timestamp ON device_health_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_health_status ON device_health_logs(health_status);

-- Audit Events
CREATE INDEX IF NOT EXISTS idx_audit_device ON device_audit_events(device_uid);
CREATE INDEX IF NOT EXISTS idx_audit_type ON device_audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_time ON device_audit_events(event_time DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON device_audit_events(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_category ON device_audit_events(category);
CREATE INDEX IF NOT EXISTS idx_audit_severity ON device_audit_events(severity);
CREATE INDEX IF NOT EXISTS idx_audit_station ON device_audit_events(station_id);

-- Agents
CREATE INDEX IF NOT EXISTS idx_agents_machine ON device_agents(machine_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON device_agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_heartbeat ON device_agents(last_heartbeat_at DESC);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_batches ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Authenticated users can read devices
CREATE POLICY "devices_read_policy" ON devices FOR SELECT TO authenticated USING (true);
CREATE POLICY "devices_service_policy" ON devices FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can read assignments
CREATE POLICY "assignments_read_policy" ON device_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "assignments_service_policy" ON device_assignments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can read deployments
CREATE POLICY "deployments_read_policy" ON device_deployments FOR SELECT TO authenticated USING (true);
CREATE POLICY "deployments_service_policy" ON device_deployments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can read health logs
CREATE POLICY "health_logs_read_policy" ON device_health_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "health_logs_service_policy" ON device_health_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Audit events are read-only for authenticated users
CREATE POLICY "audit_events_read_policy" ON device_audit_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "audit_events_service_policy" ON device_audit_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Agents readable by authenticated users
CREATE POLICY "agents_read_policy" ON device_agents FOR SELECT TO authenticated USING (true);
CREATE POLICY "agents_service_policy" ON device_agents FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Batches readable by authenticated users
CREATE POLICY "batches_read_policy" ON device_batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "batches_service_policy" ON device_batches FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update devices.updated_at on change
CREATE OR REPLACE FUNCTION update_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_devices_updated_at
BEFORE UPDATE ON devices
FOR EACH ROW
EXECUTE FUNCTION update_devices_updated_at();

-- Update device_deployments.updated_at on change
CREATE TRIGGER trigger_deployments_updated_at
BEFORE UPDATE ON device_deployments
FOR EACH ROW
EXECUTE FUNCTION update_devices_updated_at();

-- Auto-create audit event on device status change
CREATE OR REPLACE FUNCTION audit_device_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO device_audit_events (
      device_uid,
      event_type,
      event_time,
      payload_json,
      previous_state_json,
      new_state_json,
      category
    ) VALUES (
      NEW.device_uid,
      'STATUS_CHANGE',
      NOW(),
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status),
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      'LIFECYCLE'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_device_status_audit
AFTER UPDATE ON devices
FOR EACH ROW
EXECUTE FUNCTION audit_device_status_change();

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- Device Summary View
CREATE OR REPLACE VIEW device_summary AS
SELECT
  d.device_uid,
  d.vendor_serial_number,
  d.asset_tag,
  d.vendor_name,
  d.model,
  d.device_type,
  d.status,
  d.last_health_status,
  d.current_province,
  d.current_district,
  d.current_custodian_name,
  d.current_station_id,
  d.last_seen_at,
  d.total_capture_count,
  d.warranty_expiry,
  dd.polling_site_name as deployed_site,
  dd.gps_lat,
  dd.gps_lng,
  dd.deployment_status
FROM devices d
LEFT JOIN device_deployments dd ON d.device_uid = dd.device_uid AND dd.deployment_status = 'ACTIVE';

-- Province Device Stats View
CREATE OR REPLACE VIEW province_device_stats AS
SELECT
  current_province as province,
  COUNT(*) as total_devices,
  COUNT(*) FILTER (WHERE status = 'DEPLOYED_TO_SITE') as deployed,
  COUNT(*) FILTER (WHERE status = 'REGISTERED_IN_INVENTORY') as in_inventory,
  COUNT(*) FILTER (WHERE status = 'IN_MAINTENANCE') as in_maintenance,
  COUNT(*) FILTER (WHERE last_health_status = 'OK') as healthy,
  COUNT(*) FILTER (WHERE last_health_status = 'WARN') as warnings,
  COUNT(*) FILTER (WHERE last_health_status = 'FAIL') as failing,
  COUNT(*) FILTER (WHERE last_seen_at < NOW() - INTERVAL '24 hours') as offline_24h
FROM devices
WHERE current_province IS NOT NULL
GROUP BY current_province;

-- ============================================
-- ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE devices;
ALTER PUBLICATION supabase_realtime ADD TABLE device_deployments;
ALTER PUBLICATION supabase_realtime ADD TABLE device_health_logs;
