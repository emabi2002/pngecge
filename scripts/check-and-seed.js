/**
 * PNGEC-BRS Database Check and Seed Script
 */

const SUPABASE_URL = 'https://wpzdecsalrsftaocmovg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwemRlY3NhbHJzZnRhb2Ntb3ZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ2NjcxMCwiZXhwIjoyMDg1MDQyNzEwfQ.4Y_gL8gwYMcVI7-sgTKxKwuJizPOKvlrbmA9VhA2iaQ';

const headers = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

// PNG Province data (all 22 provinces)
const provinces = [
  { code: 'NCD', name: 'National Capital District', region: 'Papua' },
  { code: 'CEN', name: 'Central Province', region: 'Papua' },
  { code: 'GUL', name: 'Gulf Province', region: 'Papua' },
  { code: 'WES', name: 'Western Province', region: 'Papua' },
  { code: 'MIL', name: 'Milne Bay Province', region: 'Papua' },
  { code: 'ORO', name: 'Oro (Northern) Province', region: 'Papua' },
  { code: 'SHP', name: 'Southern Highlands Province', region: 'Highlands' },
  { code: 'EHP', name: 'Eastern Highlands Province', region: 'Highlands' },
  { code: 'WHP', name: 'Western Highlands Province', region: 'Highlands' },
  { code: 'SIM', name: 'Simbu (Chimbu) Province', region: 'Highlands' },
  { code: 'ENG', name: 'Enga Province', region: 'Highlands' },
  { code: 'JIW', name: 'Jiwaka Province', region: 'Highlands' },
  { code: 'HEL', name: 'Hela Province', region: 'Highlands' },
  { code: 'MOR', name: 'Morobe Province', region: 'Momase' },
  { code: 'MAD', name: 'Madang Province', region: 'Momase' },
  { code: 'ESP', name: 'East Sepik Province', region: 'Momase' },
  { code: 'WSP', name: 'West Sepik (Sandaun) Province', region: 'Momase' },
  { code: 'MAN', name: 'Manus Province', region: 'Islands' },
  { code: 'NIR', name: 'New Ireland Province', region: 'Islands' },
  { code: 'ENB', name: 'East New Britain Province', region: 'Islands' },
  { code: 'WNB', name: 'West New Britain Province', region: 'Islands' },
  { code: 'ARB', name: 'Autonomous Region of Bougainville', region: 'Islands' }
];

// Sample districts for major provinces
const districtsByProvince = {
  'NCD': [
    { code: 'NCD-MOR', name: 'Moresby North-East' },
    { code: 'NCD-MNW', name: 'Moresby North-West' },
    { code: 'NCD-MSO', name: 'Moresby South' }
  ],
  'EHP': [
    { code: 'EHP-GOR', name: 'Goroka' },
    { code: 'EHP-KAI', name: 'Kainantu' },
    { code: 'EHP-OKA', name: 'Okapa' },
    { code: 'EHP-LUF', name: 'Lufa' },
    { code: 'EHP-OBU', name: 'Obura-Wonenara' },
    { code: 'EHP-UNG', name: 'Unggai-Bena' },
    { code: 'EHP-DAU', name: 'Daulo' },
    { code: 'EHP-HEN', name: 'Henganofi' }
  ],
  'WHP': [
    { code: 'WHP-HAG', name: 'Hagen Central' },
    { code: 'WHP-MUI', name: 'Mul-Baiyer' },
    { code: 'WHP-TAM', name: 'Tambul-Nebilyer' },
    { code: 'WHP-ANG', name: 'Anglimp-South Waghi' },
    { code: 'WHP-JIM', name: 'Jimi' },
    { code: 'WHP-NOG', name: 'North Waghi' },
    { code: 'WHP-DEI', name: 'Dei' }
  ],
  'MOR': [
    { code: 'MOR-LAE', name: 'Lae' },
    { code: 'MOR-HUO', name: 'Huon Gulf' },
    { code: 'MOR-FIN', name: 'Finschhafen' },
    { code: 'MOR-KAB', name: 'Kabwum' },
    { code: 'MOR-TEB', name: 'Tewai-Siassi' },
    { code: 'MOR-NAW', name: 'Nawae' },
    { code: 'MOR-BUL', name: 'Bulolo' },
    { code: 'MOR-MEN', name: 'Menyamya' },
    { code: 'MOR-MAR', name: 'Markham' }
  ],
  'ESP': [
    { code: 'ESP-WEW', name: 'Wewak' },
    { code: 'ESP-YAN', name: 'Yangoru-Saussia' },
    { code: 'ESP-MAP', name: 'Maprik' },
    { code: 'ESP-DRE', name: 'Dreikikir-Ambunti' },
    { code: 'ESP-ANB', name: 'Ambunti-Dreikikir' },
    { code: 'ESP-ANG', name: 'Angoram' }
  ],
  'ENG': [
    { code: 'ENG-WAB', name: 'Wabag' },
    { code: 'ENG-WAP', name: 'Wapenamanda' },
    { code: 'ENG-KOM', name: 'Kompiam-Ambum' },
    { code: 'ENG-KAN', name: 'Kandep' },
    { code: 'ENG-LAG', name: 'Lagaip-Porgera' }
  ],
  'SIM': [
    { code: 'SIM-KUN', name: 'Kundiawa-Gembogl' },
    { code: 'SIM-CHU', name: 'Chuave' },
    { code: 'SIM-SIN', name: 'Sinasina-Yongomugl' },
    { code: 'SIM-KER', name: 'Kerowagi' },
    { code: 'SIM-GUI', name: 'Gumine' },
    { code: 'SIM-SAL', name: 'Salt-Nomane' }
  ],
  'SHP': [
    { code: 'SHP-MEN', name: 'Mendi-Munihu' },
    { code: 'SHP-IAL', name: 'Imbonggu' },
    { code: 'SHP-KAG', name: 'Kagua-Erave' },
    { code: 'SHP-IAR', name: 'Ialibu-Pangia' },
    { code: 'SHP-NIP', name: 'Nipa-Kutubu' }
  ]
};

async function checkTable(tableName) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${tableName}?select=id&limit=1`,
      { headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` } }
    );
    return { exists: response.ok, status: response.status };
  } catch (error) {
    return { exists: false, status: 0, error: error.message };
  }
}

async function getTableCount(tableName) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${tableName}?select=id`,
      {
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Prefer': 'count=exact'
        }
      }
    );
    const contentRange = response.headers.get('content-range');
    if (contentRange) {
      const match = contentRange.match(/\/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    }
    return 0;
  } catch (error) {
    return 0;
  }
}

async function insertData(tableName, data) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${tableName}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to insert into ${tableName}: ${response.status} - ${text}`);
  }

  return await response.json();
}

async function main() {
  console.log('========================================');
  console.log('  PNGEC-BRS Database Setup');
  console.log('========================================\n');

  // Step 1: Check if tables exist
  console.log('Step 1: Checking tables...\n');

  const tables = ['provinces', 'districts', 'llgs', 'wards', 'polling_places', 'users', 'devices', 'voter_registrations', 'dedup_matches', 'exceptions', 'sync_batches', 'audit_logs', 'system_stats'];

  for (const table of tables) {
    const result = await checkTable(table);
    console.log(`  ${result.exists ? '✅' : '❌'} ${table}: ${result.status}`);
  }

  // Check if core tables exist
  const provincesResult = await checkTable('provinces');

  if (!provincesResult.exists) {
    console.log('\n❌ Core tables do not exist. Please run the schema.sql first!');
    console.log('   Go to: https://supabase.com/dashboard/project/wpzdecsalrsftaocmovg/sql/new');
    console.log('   And execute the contents of supabase/schema.sql');
    return;
  }

  // Step 2: Check if data already exists
  const existingProvinces = await getTableCount('provinces');
  console.log(`\nExisting provinces count: ${existingProvinces}`);

  if (existingProvinces > 0) {
    console.log('\n✅ Data already exists. Showing current counts:\n');

    for (const table of tables) {
      const count = await getTableCount(table);
      console.log(`  ${table}: ${count} records`);
    }
    return;
  }

  // Step 3: Seed data
  console.log('\nStep 2: Seeding data...\n');

  // Insert provinces
  console.log('📍 Inserting provinces...');
  const insertedProvinces = await insertData('provinces', provinces);
  console.log(`  ✅ Inserted ${insertedProvinces.length} provinces`);

  // Create province map
  const provinceMap = {};
  for (const p of insertedProvinces) {
    provinceMap[p.code] = p.id;
  }

  // Insert districts
  console.log('📍 Inserting districts...');
  let totalDistricts = 0;
  for (const [provinceCode, districts] of Object.entries(districtsByProvince)) {
    const provinceId = provinceMap[provinceCode];
    if (!provinceId) continue;

    const districtsWithProvinceId = districts.map(d => ({
      ...d,
      province_id: provinceId
    }));

    const inserted = await insertData('districts', districtsWithProvinceId);
    totalDistricts += inserted.length;
    console.log(`  ✅ Inserted ${inserted.length} districts for ${provinceCode}`);
  }
  console.log(`  📊 Total districts: ${totalDistricts}`);

  // Insert admin user
  console.log('👤 Inserting admin user...');
  const ncdId = provinceMap['NCD'];
  const adminUser = await insertData('users', [{
    email: 'admin@pngec.gov.pg',
    full_name: 'System Administrator',
    role: 'national_admin',
    clearance_level: 5,
    is_active: true,
    mfa_enabled: true,
    province_id: ncdId
  }]);
  console.log(`  ✅ Created admin user: ${adminUser[0].email}`);

  // Insert devices
  console.log('📱 Inserting devices...');
  const devices = [
    {
      device_id: 'BRS-DEV-001',
      device_name: 'Registration Kit Alpha',
      model: 'BRS-3000 Pro',
      serial_number: 'SN-2025-0001',
      status: 'online',
      battery_level: 85,
      storage_used_gb: 12.5,
      storage_total_gb: 128.0,
      gps_enabled: true,
      firmware_version: 'v2.1.5',
      registration_count: 0,
      assigned_operator_id: adminUser[0].id
    },
    {
      device_id: 'BRS-DEV-002',
      device_name: 'Registration Kit Beta',
      model: 'BRS-3000 Pro',
      serial_number: 'SN-2025-0002',
      status: 'online',
      battery_level: 92,
      storage_used_gb: 8.2,
      storage_total_gb: 128.0,
      gps_enabled: true,
      firmware_version: 'v2.1.5',
      registration_count: 0,
      assigned_operator_id: adminUser[0].id
    },
    {
      device_id: 'BRS-DEV-003',
      device_name: 'Registration Kit Gamma',
      model: 'BRS-3000 Pro',
      serial_number: 'SN-2025-0003',
      status: 'offline',
      battery_level: 45,
      storage_used_gb: 25.8,
      storage_total_gb: 128.0,
      gps_enabled: true,
      firmware_version: 'v2.1.4',
      registration_count: 0,
      assigned_operator_id: adminUser[0].id
    },
    {
      device_id: 'BRS-DEV-004',
      device_name: 'Registration Kit Delta',
      model: 'BRS-2000',
      serial_number: 'SN-2024-0101',
      status: 'maintenance',
      battery_level: 0,
      storage_used_gb: 50.3,
      storage_total_gb: 64.0,
      gps_enabled: false,
      firmware_version: 'v2.0.8',
      registration_count: 0,
      assigned_operator_id: adminUser[0].id
    },
    {
      device_id: 'BRS-DEV-005',
      device_name: 'Registration Kit Echo',
      model: 'BRS-3000 Pro',
      serial_number: 'SN-2025-0005',
      status: 'online',
      battery_level: 78,
      storage_used_gb: 15.7,
      storage_total_gb: 128.0,
      gps_enabled: true,
      firmware_version: 'v2.1.5',
      registration_count: 0,
      assigned_operator_id: adminUser[0].id
    }
  ];

  const insertedDevices = await insertData('devices', devices);
  console.log(`  ✅ Inserted ${insertedDevices.length} devices`);

  // Insert system stats
  console.log('📊 Inserting system stats...');
  const stats = await insertData('system_stats', [{
    total_registrations: 0,
    pending_sync: 0,
    pending_dedup: 0,
    active_devices: 3,
    offline_devices: 2,
    exceptions_open: 0,
    duplicates_detected: 0,
    sync_completion_rate: 100.00
  }]);
  console.log(`  ✅ Created initial system stats`);

  // Final summary
  console.log('\n========================================');
  console.log('  ✅ Database Setup Complete!');
  console.log('========================================\n');

  console.log('Summary:');
  for (const table of tables) {
    const count = await getTableCount(table);
    console.log(`  ${table}: ${count} records`);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
