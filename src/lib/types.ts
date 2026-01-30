// User roles for PNGEC-BRS
export type UserRole =
  | 'registration_officer'
  | 'supervisor'
  | 'provincial_ro'
  | 'national_admin'
  | 'ict_security';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  province?: string;
  clearanceLevel: number;
  email: string;
  lastLogin: Date;
}

// Voter registration types
export interface VoterRegistration {
  id: string;
  voterId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: Date;
  gender: 'male' | 'female';
  province: string;
  district: string;
  llg: string;
  ward: string;
  pollingPlace: string;
  villageLocality: string;

  // Biometric data references
  facialImageId: string;
  fingerprintTemplateIds: string[];
  irisTemplateId?: string;

  // Registration metadata
  gpsCoordinates: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  registrationTimestamp: Date;
  deviceId: string;
  operatorId: string;

  // Status
  status: RegistrationStatus;
  dedupStatus: DedupStatus;

  // Audit
  signatureHash: string;
  syncStatus: SyncStatus;
}

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

export type SyncStatus =
  | 'pending'
  | 'syncing'
  | 'synced'
  | 'failed';

// Device types
export interface RegistrationDevice {
  id: string;
  deviceName: string;
  model: string;
  serialNumber: string;
  assignedWard: string;
  assignedOperator: string;
  status: DeviceStatus;
  lastSync: Date;
  batteryLevel: number;
  storageUsed: number;
  storageTotal: number;
  gpsEnabled: boolean;
  firmwareVersion: string;
  registrationCount: number;
}

export type DeviceStatus =
  | 'online'
  | 'offline'
  | 'degraded'
  | 'maintenance';

// Deduplication types
export interface DedupMatch {
  id: string;
  voter1Id: string;
  voter2Id: string;
  matchScore: number;
  matchType: 'fingerprint' | 'facial' | 'iris' | 'multi';
  status: DedupMatchStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  decisionReason?: string;
}

export type DedupMatchStatus =
  | 'pending_review'
  | 'confirmed_match'
  | 'false_positive'
  | 'exception';

// Exception types
export interface Exception {
  id: string;
  voterId: string;
  exceptionType: ExceptionType;
  reasonCode: string;
  description: string;
  status: ExceptionStatus;
  createdBy: string;
  createdAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  supervisorOverride?: {
    supervisorId: string;
    reasonCode: string;
    justification: string;
    timestamp: Date;
  };
}

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

// Audit types
export interface AuditLog {
  id: string;
  timestamp: Date;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userRole: UserRole;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  deviceId?: string;
  signature: string;
}

// Ward and location types
export interface Province {
  code: string;
  name: string;
  districts: District[];
}

export interface District {
  code: string;
  name: string;
  provinceCode: string;
  llgs: LLG[];
}

export interface LLG {
  code: string;
  name: string;
  districtCode: string;
  wards: Ward[];
}

export interface Ward {
  code: string;
  name: string;
  llgCode: string;
  pollingPlaces: PollingPlace[];
}

export interface PollingPlace {
  code: string;
  name: string;
  wardCode: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
  registeredVoters: number;
}

// System stats
export interface SystemStats {
  totalRegistrations: number;
  pendingSync: number;
  pendingDedup: number;
  activeDevices: number;
  offlineDevices: number;
  exceptionsOpen: number;
  duplicatesDetected: number;
  syncCompletionRate: number;
}

// Navigation types
export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  subItems?: SubNavItem[];
  requiredRoles?: UserRole[];
  badge?: {
    count: number;
    variant: 'default' | 'warning' | 'error' | 'success';
  };
}

export interface SubNavItem {
  id: string;
  label: string;
  href: string;
  requiredRoles?: UserRole[];
}
