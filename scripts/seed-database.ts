import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wpzdecsalrsftaocmovg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwemRlY3NhbHJzZnRhb2Ntb3ZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ2NjcxMCwiZXhwIjoyMDg1MDQyNzEwfQ.4Y_gL8gwYMcVI7-sgTKxKwuJizPOKvlrbmA9VhA2iaQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// PNG Provinces data
const provinces = [
  { code: 'NCD', name: 'National Capital District', region: 'Southern' },
  { code: 'EHP', name: 'Eastern Highlands', region: 'Highlands' },
  { code: 'WHP', name: 'Western Highlands', region: 'Highlands' },
  { code: 'ENG', name: 'Enga', region: 'Highlands' },
  { code: 'SHP', name: 'Southern Highlands', region: 'Highlands' },
  { code: 'HLA', name: 'Hela', region: 'Highlands' },
  { code: 'JWK', name: 'Jiwaka', region: 'Highlands' },
  { code: 'SIM', name: 'Simbu (Chimbu)', region: 'Highlands' },
  { code: 'MBP', name: 'Morobe', region: 'Momase' },
  { code: 'MPP', name: 'Madang', region: 'Momase' },
  { code: 'ESP', name: 'East Sepik', region: 'Momase' },
  { code: 'WSP', name: 'West Sepik (Sandaun)', region: 'Momase' },
  { code: 'ENB', name: 'East New Britain', region: 'Islands' },
  { code: 'WNB', name: 'West New Britain', region: 'Islands' },
  { code: 'NIP', name: 'New Ireland', region: 'Islands' },
  { code: 'MAN', name: 'Manus', region: 'Islands' },
  { code: 'ABG', name: 'Bougainville', region: 'Islands' },
  { code: 'MBA', name: 'Milne Bay', region: 'Southern' },
  { code: 'NPP', name: 'Northern (Oro)', region: 'Southern' },
  { code: 'CPP', name: 'Central', region: 'Southern' },
  { code: 'GPP', name: 'Gulf', region: 'Southern' },
  { code: 'WPP', name: 'Western', region: 'Southern' },
];

// Districts per province
const districtsByProvince: Record<string, { code: string; name: string }[]> = {
  NCD: [
    { code: 'NCD-MNW', name: 'Moresby North-West' },
    { code: 'NCD-MNE', name: 'Moresby North-East' },
    { code: 'NCD-MS', name: 'Moresby South' },
  ],
  EHP: [
    { code: 'EHP-GOR', name: 'Goroka' },
    { code: 'EHP-KAI', name: 'Kainantu' },
    { code: 'EHP-OBU', name: 'Obura-Wonenara' },
    { code: 'EHP-UNI', name: 'Unggai-Benna' },
  ],
  WHP: [
    { code: 'WHP-HAG', name: 'Hagen Central' },
    { code: 'WHP-MUL', name: 'Mul-Baiyer' },
    { code: 'WHP-TAM', name: 'Tambul-Nebilyer' },
  ],
  ENG: [
    { code: 'ENG-WAB', name: 'Wabag' },
    { code: 'ENG-WAP', name: 'Wapenamanda' },
    { code: 'ENG-KOM', name: 'Kompiam-Ambum' },
  ],
  SHP: [
    { code: 'SHP-MEN', name: 'Mendi' },
    { code: 'SHP-ILI', name: 'Ialibu-Pangia' },
    { code: 'SHP-KAG', name: 'Kagua-Erave' },
  ],
  HLA: [
    { code: 'HLA-TAR', name: 'Tari-Pori' },
    { code: 'HLA-KOR', name: 'Koroba-Lake Kopiago' },
  ],
  JWK: [
    { code: 'JWK-JIW', name: 'Jiwaka' },
    { code: 'JWK-ANG', name: 'Anglimp-South Waghi' },
  ],
  SIM: [
    { code: 'SIM-KUN', name: 'Kundiawa-Gembogl' },
    { code: 'SIM-GUA', name: 'Gumine' },
    { code: 'SIM-CHU', name: 'Chuave' },
  ],
  MBP: [
    { code: 'MBP-LAE', name: 'Lae' },
    { code: 'MBP-HUO', name: 'Huon Gulf' },
    { code: 'MBP-BUL', name: 'Bulolo' },
    { code: 'MBP-FIN', name: 'Finschhafen' },
  ],
  MPP: [
    { code: 'MPP-MAD', name: 'Madang' },
    { code: 'MPP-BOG', name: 'Bogia' },
    { code: 'MPP-SUM', name: 'Sumkar' },
  ],
  ESP: [
    { code: 'ESP-WEW', name: 'Wewak' },
    { code: 'ESP-MAP', name: 'Maprik' },
    { code: 'ESP-ANG', name: 'Angoram' },
  ],
  WSP: [
    { code: 'WSP-VAN', name: 'Vanimo-Green River' },
    { code: 'WSP-AIT', name: 'Aitape-Lumi' },
  ],
  ENB: [
    { code: 'ENB-RAB', name: 'Rabaul' },
    { code: 'ENB-KOK', name: 'Kokopo' },
    { code: 'ENB-GAZ', name: 'Gazelle' },
  ],
  WNB: [
    { code: 'WNB-KIM', name: 'Kimbe' },
    { code: 'WNB-TAL', name: 'Talasea' },
  ],
  NIP: [
    { code: 'NIP-KAV', name: 'Kavieng' },
    { code: 'NIP-NAM', name: 'Namatanai' },
  ],
  MAN: [
    { code: 'MAN-LOR', name: 'Lorengau' },
    { code: 'MAN-MAN', name: 'Manus' },
  ],
  ABG: [
    { code: 'ABG-NTH', name: 'North Bougainville' },
    { code: 'ABG-CTR', name: 'Central Bougainville' },
    { code: 'ABG-STH', name: 'South Bougainville' },
  ],
  MBA: [
    { code: 'MBA-ALO', name: 'Alotau' },
    { code: 'MBA-ESA', name: 'Esa\'ala' },
    { code: 'MBA-SAM', name: 'Samarai-Murua' },
  ],
  NPP: [
    { code: 'NPP-POP', name: 'Popondetta' },
    { code: 'NPP-IJI', name: 'Ijivitari' },
    { code: 'NPP-SOP', name: 'Sohe' },
  ],
  CPP: [
    { code: 'CPP-ABE', name: 'Abau' },
    { code: 'CPP-RIG', name: 'Rigo' },
    { code: 'CPP-KAI', name: 'Kairuku-Hiri' },
    { code: 'CPP-GOI', name: 'Goilala' },
  ],
  GPP: [
    { code: 'GPP-KER', name: 'Kerema' },
    { code: 'GPP-KIK', name: 'Kikori' },
  ],
  WPP: [
    { code: 'WPP-DAR', name: 'Daru' },
    { code: 'WPP-STR', name: 'South Fly' },
    { code: 'WPP-NTH', name: 'North Fly' },
  ],
};

// Sample first and last names for generating voters
const firstNamesMale = ['Michael', 'Peter', 'John', 'David', 'James', 'Thomas', 'Joseph', 'Daniel', 'Paul', 'Steven', 'Andrew', 'Mark', 'William', 'Robert', 'Philip', 'Simon', 'Timothy', 'Patrick', 'Christopher', 'Benjamin'];
const firstNamesFemale = ['Mary', 'Janet', 'Lucy', 'Sarah', 'Elizabeth', 'Grace', 'Ruth', 'Anna', 'Catherine', 'Margaret', 'Rose', 'Helen', 'Patricia', 'Jennifer', 'Christine', 'Dorothy', 'Nancy', 'Susan', 'Martha', 'Rebecca'];
const lastNames = ['Toroama', 'Somare', 'Ipatas', 'Wingti', 'Namaliu', 'Marape', 'Abel', 'Polye', 'Haiveta', 'Pruaitch', 'Parkop', 'Kuman', 'Ravu', 'Sana', 'Wari', 'Mori', 'Kaupa', 'Nalu', 'Gende', 'Malu', 'Tapo', 'Iangalio', 'Korowi', 'Tokam', 'Yama'];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateVoterId(provinceCode: string, index: number): string {
  return `PNG-2027-${provinceCode}-${String(index).padStart(6, '0')}`;
}

async function seedDatabase() {
  console.log('Starting database seed...');

  try {
    // 1. Seed Provinces
    console.log('Seeding provinces...');
    const { data: insertedProvinces, error: provincesError } = await supabase
      .from('provinces')
      .upsert(provinces, { onConflict: 'code' })
      .select();

    if (provincesError) {
      console.error('Error seeding provinces:', provincesError);
      throw provincesError;
    }
    console.log(`Inserted ${insertedProvinces?.length || 0} provinces`);

    // Create a map of province codes to IDs
    const provinceMap = new Map<string, string>();
    insertedProvinces?.forEach((p) => {
      provinceMap.set(p.code, p.id);
    });

    // 2. Seed Districts
    console.log('Seeding districts...');
    const allDistricts: { code: string; name: string; province_id: string }[] = [];
    for (const [provinceCode, districts] of Object.entries(districtsByProvince)) {
      const provinceId = provinceMap.get(provinceCode);
      if (provinceId) {
        districts.forEach((d) => {
          allDistricts.push({ ...d, province_id: provinceId });
        });
      }
    }

    const { data: insertedDistricts, error: districtsError } = await supabase
      .from('districts')
      .upsert(allDistricts, { onConflict: 'code' })
      .select();

    if (districtsError) {
      console.error('Error seeding districts:', districtsError);
      throw districtsError;
    }
    console.log(`Inserted ${insertedDistricts?.length || 0} districts`);

    // Create district map
    const districtMap = new Map<string, string>();
    insertedDistricts?.forEach((d) => {
      districtMap.set(d.code, d.id);
    });

    // 3. Seed Users
    console.log('Seeding users...');
    const users = [
      { email: 'admin@pngec.gov.pg', full_name: 'John Kamara', role: 'national_admin', clearance_level: 5, is_active: true, mfa_enabled: true },
      { email: 'ict.security@pngec.gov.pg', full_name: 'David Korowi', role: 'ict_security', clearance_level: 5, is_active: true, mfa_enabled: true },
      { email: 'pro.ehp@pngec.gov.pg', full_name: 'Peter Gende', role: 'provincial_ro', province_id: provinceMap.get('EHP'), clearance_level: 4, is_active: true, mfa_enabled: false },
      { email: 'pro.whp@pngec.gov.pg', full_name: 'Lucy Kuman', role: 'provincial_ro', province_id: provinceMap.get('WHP'), clearance_level: 4, is_active: true, mfa_enabled: false },
      { email: 'sup.ehp.01@pngec.gov.pg', full_name: 'Tom Wari', role: 'supervisor', province_id: provinceMap.get('EHP'), clearance_level: 3, is_active: true, mfa_enabled: false },
      { email: 'sup.whp.01@pngec.gov.pg', full_name: 'Michael Nalu', role: 'supervisor', province_id: provinceMap.get('WHP'), clearance_level: 3, is_active: true, mfa_enabled: false },
      { email: 'sup.ncd.01@pngec.gov.pg', full_name: 'Janet Ravu', role: 'supervisor', province_id: provinceMap.get('NCD'), clearance_level: 3, is_active: true, mfa_enabled: false },
      { email: 'ro.ehp.01@pngec.gov.pg', full_name: 'Sarah Mori', role: 'registration_officer', province_id: provinceMap.get('EHP'), clearance_level: 1, is_active: true, mfa_enabled: false },
      { email: 'ro.whp.01@pngec.gov.pg', full_name: 'James Tapo', role: 'registration_officer', province_id: provinceMap.get('WHP'), clearance_level: 1, is_active: true, mfa_enabled: false },
      { email: 'ro.ncd.01@pngec.gov.pg', full_name: 'Grace Tokam', role: 'registration_officer', province_id: provinceMap.get('NCD'), clearance_level: 1, is_active: true, mfa_enabled: false },
    ];

    const { data: insertedUsers, error: usersError } = await supabase
      .from('users')
      .upsert(users, { onConflict: 'email' })
      .select();

    if (usersError) {
      console.error('Error seeding users:', usersError);
      throw usersError;
    }
    console.log(`Inserted ${insertedUsers?.length || 0} users`);

    // Create user map
    const userMap = new Map<string, string>();
    insertedUsers?.forEach((u) => {
      userMap.set(u.email, u.id);
    });

    // 4. Seed Devices
    console.log('Seeding devices...');
    const devices = [
      { device_id: 'DEV-NCD-001', device_name: 'NCD Registration Kit 01', model: 'Samsung Galaxy Tab S8', serial_number: 'SGT8-NCD-001', status: 'online', battery_level: 85, storage_used_gb: 12.4, storage_total_gb: 128, gps_enabled: true, firmware_version: '2.1.4', registration_count: 847, last_sync: new Date().toISOString() },
      { device_id: 'DEV-NCD-002', device_name: 'NCD Registration Kit 02', model: 'Samsung Galaxy Tab S8', serial_number: 'SGT8-NCD-002', status: 'online', battery_level: 92, storage_used_gb: 8.2, storage_total_gb: 128, gps_enabled: true, firmware_version: '2.1.4', registration_count: 623, last_sync: new Date().toISOString() },
      { device_id: 'DEV-EHP-001', device_name: 'EHP Registration Kit 01', model: 'Samsung Galaxy Tab S8', serial_number: 'SGT8-EHP-001', status: 'online', battery_level: 72, storage_used_gb: 18.7, storage_total_gb: 128, gps_enabled: true, firmware_version: '2.1.4', registration_count: 1245, last_sync: new Date().toISOString() },
      { device_id: 'DEV-EHP-002', device_name: 'EHP Registration Kit 02', model: 'Samsung Galaxy Tab S8', serial_number: 'SGT8-EHP-002', status: 'online', battery_level: 68, storage_used_gb: 22.1, storage_total_gb: 128, gps_enabled: true, firmware_version: '2.1.4', registration_count: 1089, last_sync: new Date().toISOString() },
      { device_id: 'DEV-WHP-001', device_name: 'WHP Registration Kit 01', model: 'Samsung Galaxy Tab S8', serial_number: 'SGT8-WHP-001', status: 'online', battery_level: 78, storage_used_gb: 15.3, storage_total_gb: 128, gps_enabled: true, firmware_version: '2.1.4', registration_count: 956, last_sync: new Date().toISOString() },
      { device_id: 'DEV-WHP-002', device_name: 'WHP Registration Kit 02', model: 'Samsung Galaxy Tab S8', serial_number: 'SGT8-WHP-002', status: 'degraded', battery_level: 45, storage_used_gb: 89.3, storage_total_gb: 128, gps_enabled: false, firmware_version: '2.1.2', registration_count: 2103, last_sync: new Date(Date.now() - 3600000).toISOString() },
      { device_id: 'DEV-ESP-001', device_name: 'ESP Registration Kit 01', model: 'Samsung Galaxy Tab S7', serial_number: 'SGT7-ESP-001', status: 'online', battery_level: 88, storage_used_gb: 11.2, storage_total_gb: 64, gps_enabled: true, firmware_version: '2.1.3', registration_count: 412, last_sync: new Date().toISOString() },
      { device_id: 'DEV-ESP-002', device_name: 'ESP Registration Kit 02', model: 'Samsung Galaxy Tab S7', serial_number: 'SGT7-ESP-002', status: 'offline', battery_level: 15, storage_used_gb: 45.2, storage_total_gb: 64, gps_enabled: true, firmware_version: '2.1.3', registration_count: 523, last_sync: new Date(Date.now() - 86400000).toISOString() },
      { device_id: 'DEV-ENG-001', device_name: 'ENG Registration Kit 01', model: 'Samsung Galaxy Tab S8', serial_number: 'SGT8-ENG-001', status: 'online', battery_level: 95, storage_used_gb: 9.8, storage_total_gb: 128, gps_enabled: true, firmware_version: '2.1.4', registration_count: 678, last_sync: new Date().toISOString() },
      { device_id: 'DEV-MBP-001', device_name: 'MBP Registration Kit 01', model: 'Samsung Galaxy Tab S8', serial_number: 'SGT8-MBP-001', status: 'online', battery_level: 81, storage_used_gb: 14.6, storage_total_gb: 128, gps_enabled: true, firmware_version: '2.1.4', registration_count: 892, last_sync: new Date().toISOString() },
      { device_id: 'DEV-MBP-002', device_name: 'MBP Registration Kit 02', model: 'Samsung Galaxy Tab S8', serial_number: 'SGT8-MBP-002', status: 'online', battery_level: 76, storage_used_gb: 17.9, storage_total_gb: 128, gps_enabled: true, firmware_version: '2.1.4', registration_count: 1034, last_sync: new Date().toISOString() },
      { device_id: 'DEV-SHP-001', device_name: 'SHP Registration Kit 01', model: 'Samsung Galaxy Tab S8', serial_number: 'SGT8-SHP-001', status: 'maintenance', battery_level: 0, storage_used_gb: 25.4, storage_total_gb: 128, gps_enabled: true, firmware_version: '2.1.4', registration_count: 1567, last_sync: new Date(Date.now() - 172800000).toISOString() },
      { device_id: 'DEV-ENB-001', device_name: 'ENB Registration Kit 01', model: 'Samsung Galaxy Tab S8', serial_number: 'SGT8-ENB-001', status: 'online', battery_level: 89, storage_used_gb: 10.1, storage_total_gb: 128, gps_enabled: true, firmware_version: '2.1.4', registration_count: 534, last_sync: new Date().toISOString() },
      { device_id: 'DEV-MBA-001', device_name: 'MBA Registration Kit 01', model: 'Samsung Galaxy Tab S7', serial_number: 'SGT7-MBA-001', status: 'online', battery_level: 82, storage_used_gb: 7.8, storage_total_gb: 64, gps_enabled: true, firmware_version: '2.1.3', registration_count: 289, last_sync: new Date().toISOString() },
      { device_id: 'DEV-SIM-001', device_name: 'SIM Registration Kit 01', model: 'Samsung Galaxy Tab S8', serial_number: 'SGT8-SIM-001', status: 'online', battery_level: 74, storage_used_gb: 19.5, storage_total_gb: 128, gps_enabled: true, firmware_version: '2.1.4', registration_count: 978, last_sync: new Date().toISOString() },
    ];

    const { data: insertedDevices, error: devicesError } = await supabase
      .from('devices')
      .upsert(devices, { onConflict: 'device_id' })
      .select();

    if (devicesError) {
      console.error('Error seeding devices:', devicesError);
      throw devicesError;
    }
    console.log(`Inserted ${insertedDevices?.length || 0} devices`);

    // Create device map
    const deviceMap = new Map<string, string>();
    insertedDevices?.forEach((d) => {
      deviceMap.set(d.device_id, d.id);
    });

    // 5. Seed Voter Registrations
    console.log('Seeding voter registrations...');
    const voterRegistrations: any[] = [];
    const provinceCoords: Record<string, { lat: number; lng: number }> = {
      NCD: { lat: -9.4438, lng: 147.1803 },
      EHP: { lat: -6.0821, lng: 145.3861 },
      WHP: { lat: -5.8608, lng: 144.2249 },
      ENG: { lat: -5.4897, lng: 143.7189 },
      ESP: { lat: -3.5536, lng: 143.6314 },
      MBP: { lat: -6.7277, lng: 147.0000 },
      SHP: { lat: -6.0833, lng: 143.9333 },
      SIM: { lat: -6.0167, lng: 144.9667 },
      ENB: { lat: -4.3417, lng: 152.2750 },
      MBA: { lat: -10.3157, lng: 150.4593 },
    };

    const statuses = ['approved', 'approved', 'approved', 'pending_review', 'pending_review', 'rejected', 'exception'];
    const dedupStatuses = ['unique', 'unique', 'unique', 'pending', 'potential_duplicate'];

    let voterIndex = 1;
    const provinceCodes = ['NCD', 'EHP', 'WHP', 'ENG', 'ESP', 'MBP', 'SHP', 'SIM', 'ENB', 'MBA'];

    for (const provinceCode of provinceCodes) {
      const coords = provinceCoords[provinceCode] || { lat: -6.0, lng: 145.0 };
      const provinceId = provinceMap.get(provinceCode);
      const districtCode = Object.keys(districtsByProvince).includes(provinceCode)
        ? districtsByProvince[provinceCode][0]?.code
        : null;
      const districtId = districtCode ? districtMap.get(districtCode) : null;

      for (let i = 0; i < 5; i++) {
        const isMale = Math.random() > 0.5;
        const firstName = isMale ? randomElement(firstNamesMale) : randomElement(firstNamesFemale);
        const lastName = randomElement(lastNames);
        const dob = randomDate(new Date(1950, 0, 1), new Date(2008, 0, 1));
        const status = randomElement(statuses);
        const dedupStatus = randomElement(dedupStatuses);

        voterRegistrations.push({
          voter_id: generateVoterId(provinceCode, voterIndex++),
          first_name: firstName,
          last_name: lastName,
          middle_name: Math.random() > 0.5 ? randomElement(lastNames) : null,
          date_of_birth: dob.toISOString().split('T')[0],
          gender: isMale ? 'male' : 'female',
          province_id: provinceId,
          district_id: districtId,
          village_locality: `${randomElement(lastNames)} Village`,
          gps_latitude: coords.lat + (Math.random() - 0.5) * 0.1,
          gps_longitude: coords.lng + (Math.random() - 0.5) * 0.1,
          gps_accuracy: Math.floor(Math.random() * 15) + 3,
          registration_timestamp: randomDate(new Date(2026, 0, 1), new Date()).toISOString(),
          status: status,
          dedup_status: dedupStatus,
          sync_status: 'synced',
          has_fingerprints: true,
          fingerprint_count: Math.floor(Math.random() * 6) + 4,
          facial_image_id: `img-${voterIndex}`,
          signature_hash: `sha256:${Date.now()}-${voterIndex}`,
        });
      }
    }

    const { data: insertedVoters, error: votersError } = await supabase
      .from('voter_registrations')
      .upsert(voterRegistrations, { onConflict: 'voter_id' })
      .select();

    if (votersError) {
      console.error('Error seeding voter registrations:', votersError);
      throw votersError;
    }
    console.log(`Inserted ${insertedVoters?.length || 0} voter registrations`);

    // 6. Seed Dedup Matches
    console.log('Seeding dedup matches...');
    if (insertedVoters && insertedVoters.length >= 20) {
      const dedupMatches = [
        { voter1_id: insertedVoters[0].id, voter2_id: insertedVoters[10].id, match_score: 94.7, match_type: 'fingerprint', status: 'pending_review', priority: 'high' },
        { voter1_id: insertedVoters[1].id, voter2_id: insertedVoters[11].id, match_score: 87.3, match_type: 'facial', status: 'pending_review', priority: 'medium' },
        { voter1_id: insertedVoters[2].id, voter2_id: insertedVoters[12].id, match_score: 98.2, match_type: 'multi', status: 'confirmed_match', priority: 'high', reviewed_by: userMap.get('sup.ehp.01@pngec.gov.pg'), reviewed_at: new Date().toISOString(), decision_reason: 'Same person registered twice' },
        { voter1_id: insertedVoters[3].id, voter2_id: insertedVoters[13].id, match_score: 82.1, match_type: 'fingerprint', status: 'false_positive', priority: 'low', reviewed_by: userMap.get('sup.whp.01@pngec.gov.pg'), reviewed_at: new Date().toISOString(), decision_reason: 'Similar but different individuals' },
        { voter1_id: insertedVoters[4].id, voter2_id: insertedVoters[14].id, match_score: 91.5, match_type: 'facial', status: 'pending_review', priority: 'high' },
        { voter1_id: insertedVoters[5].id, voter2_id: insertedVoters[15].id, match_score: 88.9, match_type: 'multi', status: 'pending_review', priority: 'medium' },
        { voter1_id: insertedVoters[6].id, voter2_id: insertedVoters[16].id, match_score: 79.4, match_type: 'fingerprint', status: 'pending_review', priority: 'low' },
        { voter1_id: insertedVoters[7].id, voter2_id: insertedVoters[17].id, match_score: 95.8, match_type: 'multi', status: 'pending_review', priority: 'high' },
        { voter1_id: insertedVoters[8].id, voter2_id: insertedVoters[18].id, match_score: 84.2, match_type: 'facial', status: 'confirmed_match', priority: 'medium', reviewed_by: userMap.get('sup.ncd.01@pngec.gov.pg'), reviewed_at: new Date().toISOString(), decision_reason: 'Verified duplicate registration' },
        { voter1_id: insertedVoters[9].id, voter2_id: insertedVoters[19].id, match_score: 76.8, match_type: 'fingerprint', status: 'false_positive', priority: 'low', reviewed_by: userMap.get('sup.ehp.01@pngec.gov.pg'), reviewed_at: new Date().toISOString(), decision_reason: 'Twins, verified as different individuals' },
      ].map((m) => ({ ...m, signature_hash: `sha256:dedup-${Date.now()}-${Math.random()}` }));

      const { data: insertedMatches, error: matchesError } = await supabase
        .from('dedup_matches')
        .insert(dedupMatches)
        .select();

      if (matchesError) {
        console.error('Error seeding dedup matches:', matchesError);
      } else {
        console.log(`Inserted ${insertedMatches?.length || 0} dedup matches`);
      }
    }

    // 7. Seed Exceptions
    console.log('Seeding exceptions...');
    if (insertedVoters && insertedVoters.length >= 10) {
      const exceptions = [
        { voter_id: insertedVoters[0].id, exception_type: 'missing_fingerprint', reason_code: 'MF-01', description: 'Voter has no fingers on left hand due to industrial accident', status: 'under_review', priority: 'high', created_by: userMap.get('ro.ehp.01@pngec.gov.pg') },
        { voter_id: insertedVoters[1].id, exception_type: 'worn_fingerprint', reason_code: 'WF-01', description: 'Elderly voter with severely worn fingerprints - agricultural worker', status: 'approved', priority: 'medium', created_by: userMap.get('ro.whp.01@pngec.gov.pg'), reviewed_by: userMap.get('sup.whp.01@pngec.gov.pg'), reviewed_at: new Date().toISOString(), override_justification: 'Alternative biometric captured' },
        { voter_id: insertedVoters[2].id, exception_type: 'disability_accommodation', reason_code: 'DA-02', description: 'Voter is visually impaired, requires assisted registration', status: 'open', priority: 'medium', created_by: userMap.get('ro.ncd.01@pngec.gov.pg') },
        { voter_id: insertedVoters[3].id, exception_type: 'photo_quality', reason_code: 'PQ-01', description: 'Photo quality too low due to lighting conditions', status: 'open', priority: 'low', created_by: userMap.get('ro.ehp.01@pngec.gov.pg') },
        { voter_id: insertedVoters[4].id, exception_type: 'data_mismatch', reason_code: 'DM-01', description: 'Date of birth does not match ID document', status: 'escalated', priority: 'high', created_by: userMap.get('ro.whp.01@pngec.gov.pg'), override_supervisor_id: userMap.get('pro.whp@pngec.gov.pg') },
        { voter_id: insertedVoters[5].id, exception_type: 'missing_fingerprint', reason_code: 'MF-02', description: 'Birth defect - missing right thumb', status: 'approved', priority: 'medium', created_by: userMap.get('ro.ncd.01@pngec.gov.pg'), reviewed_by: userMap.get('sup.ncd.01@pngec.gov.pg'), reviewed_at: new Date().toISOString() },
        { voter_id: insertedVoters[6].id, exception_type: 'worn_fingerprint', reason_code: 'WF-02', description: 'Fisherman with worn fingerprints from salt water exposure', status: 'under_review', priority: 'medium', created_by: userMap.get('ro.ehp.01@pngec.gov.pg') },
        { voter_id: insertedVoters[7].id, exception_type: 'other', reason_code: 'OT-01', description: 'Voter requested name correction on registration', status: 'open', priority: 'low', created_by: userMap.get('ro.whp.01@pngec.gov.pg') },
        { voter_id: insertedVoters[8].id, exception_type: 'disability_accommodation', reason_code: 'DA-01', description: 'Voter cannot stand for photo, wheelchair user', status: 'approved', priority: 'medium', created_by: userMap.get('ro.ncd.01@pngec.gov.pg'), reviewed_by: userMap.get('sup.ncd.01@pngec.gov.pg'), reviewed_at: new Date().toISOString() },
        { voter_id: insertedVoters[9].id, exception_type: 'photo_quality', reason_code: 'PQ-02', description: 'Camera malfunction during capture, needs re-registration', status: 'rejected', priority: 'low', created_by: userMap.get('ro.ehp.01@pngec.gov.pg'), reviewed_by: userMap.get('sup.ehp.01@pngec.gov.pg'), reviewed_at: new Date().toISOString() },
      ].map((e) => ({ ...e, signature_hash: `sha256:exc-${Date.now()}-${Math.random()}` }));

      const { data: insertedExceptions, error: exceptionsError } = await supabase
        .from('exceptions')
        .insert(exceptions)
        .select();

      if (exceptionsError) {
        console.error('Error seeding exceptions:', exceptionsError);
      } else {
        console.log(`Inserted ${insertedExceptions?.length || 0} exceptions`);
      }
    }

    // 8. Seed Sync Batches
    console.log('Seeding sync batches...');
    const syncBatches = [
      { batch_id: 'SB-NCD-001-20260125', device_id: deviceMap.get('DEV-NCD-001'), record_count: 125, status: 'completed', progress: 100, queued_at: new Date(Date.now() - 3600000).toISOString(), completed_at: new Date().toISOString(), upload_receipt: 'RCP-NCD-001' },
      { batch_id: 'SB-NCD-002-20260125', device_id: deviceMap.get('DEV-NCD-002'), record_count: 98, status: 'completed', progress: 100, queued_at: new Date(Date.now() - 7200000).toISOString(), completed_at: new Date(Date.now() - 3600000).toISOString(), upload_receipt: 'RCP-NCD-002' },
      { batch_id: 'SB-EHP-001-20260125', device_id: deviceMap.get('DEV-EHP-001'), record_count: 234, status: 'completed', progress: 100, queued_at: new Date(Date.now() - 5400000).toISOString(), completed_at: new Date(Date.now() - 1800000).toISOString(), upload_receipt: 'RCP-EHP-001' },
      { batch_id: 'SB-EHP-002-20260125', device_id: deviceMap.get('DEV-EHP-002'), record_count: 187, status: 'in_progress', progress: 67, queued_at: new Date(Date.now() - 1800000).toISOString(), started_at: new Date(Date.now() - 900000).toISOString() },
      { batch_id: 'SB-WHP-001-20260125', device_id: deviceMap.get('DEV-WHP-001'), record_count: 156, status: 'completed', progress: 100, queued_at: new Date(Date.now() - 10800000).toISOString(), completed_at: new Date(Date.now() - 7200000).toISOString(), upload_receipt: 'RCP-WHP-001' },
      { batch_id: 'SB-WHP-002-20260125', device_id: deviceMap.get('DEV-WHP-002'), record_count: 89, status: 'failed', progress: 45, queued_at: new Date(Date.now() - 3600000).toISOString(), error_message: 'Connection timeout during upload', retry_count: 2 },
      { batch_id: 'SB-ESP-001-20260125', device_id: deviceMap.get('DEV-ESP-001'), record_count: 67, status: 'completed', progress: 100, queued_at: new Date(Date.now() - 14400000).toISOString(), completed_at: new Date(Date.now() - 10800000).toISOString(), upload_receipt: 'RCP-ESP-001' },
      { batch_id: 'SB-ESP-002-20260125', device_id: deviceMap.get('DEV-ESP-002'), record_count: 145, status: 'pending', progress: 0, queued_at: new Date().toISOString() },
      { batch_id: 'SB-ENG-001-20260125', device_id: deviceMap.get('DEV-ENG-001'), record_count: 112, status: 'in_progress', progress: 23, queued_at: new Date(Date.now() - 600000).toISOString(), started_at: new Date(Date.now() - 300000).toISOString() },
      { batch_id: 'SB-MBP-001-20260125', device_id: deviceMap.get('DEV-MBP-001'), record_count: 203, status: 'completed', progress: 100, queued_at: new Date(Date.now() - 18000000).toISOString(), completed_at: new Date(Date.now() - 14400000).toISOString(), upload_receipt: 'RCP-MBP-001' },
      { batch_id: 'SB-MBP-002-20260125', device_id: deviceMap.get('DEV-MBP-002'), record_count: 178, status: 'completed', progress: 100, queued_at: new Date(Date.now() - 21600000).toISOString(), completed_at: new Date(Date.now() - 18000000).toISOString(), upload_receipt: 'RCP-MBP-002' },
      { batch_id: 'SB-SIM-001-20260125', device_id: deviceMap.get('DEV-SIM-001'), record_count: 134, status: 'pending', progress: 0, queued_at: new Date().toISOString() },
      { batch_id: 'SB-ENB-001-20260125', device_id: deviceMap.get('DEV-ENB-001'), record_count: 89, status: 'completed', progress: 100, queued_at: new Date(Date.now() - 28800000).toISOString(), completed_at: new Date(Date.now() - 25200000).toISOString(), upload_receipt: 'RCP-ENB-001' },
      { batch_id: 'SB-MBA-001-20260125', device_id: deviceMap.get('DEV-MBA-001'), record_count: 56, status: 'in_progress', progress: 89, queued_at: new Date(Date.now() - 1200000).toISOString(), started_at: new Date(Date.now() - 600000).toISOString() },
    ];

    const { data: insertedBatches, error: batchesError } = await supabase
      .from('sync_batches')
      .upsert(syncBatches, { onConflict: 'batch_id' })
      .select();

    if (batchesError) {
      console.error('Error seeding sync batches:', batchesError);
    } else {
      console.log(`Inserted ${insertedBatches?.length || 0} sync batches`);
    }

    // 9. Seed Audit Logs
    console.log('Seeding audit logs...');
    const auditLogs = [
      { action: 'REGISTRATION_CREATED', action_label: 'Voter Registration Created', entity_type: 'voter_registration', entity_id: insertedVoters?.[0]?.id || 'unknown', user_id: userMap.get('ro.ehp.01@pngec.gov.pg'), description: 'New voter registration created', category: 'registration' },
      { action: 'BIOMETRIC_CAPTURED', action_label: 'Biometric Data Captured', entity_type: 'biometric', entity_id: 'fp-001-l1', user_id: userMap.get('ro.ehp.01@pngec.gov.pg'), description: 'Left index fingerprint captured', category: 'biometric' },
      { action: 'SYNC_COMPLETED', action_label: 'Sync Batch Completed', entity_type: 'sync_batch', entity_id: 'SB-NCD-001-20260125', user_id: userMap.get('ict.security@pngec.gov.pg'), description: 'Batch sync completed successfully - 125 records', category: 'sync' },
      { action: 'DEDUP_MATCH_DETECTED', action_label: 'Duplicate Match Detected', entity_type: 'dedup_match', entity_id: 'match-auto-001', user_id: userMap.get('ict.security@pngec.gov.pg'), description: 'Potential duplicate detected with 94.7% match score', category: 'dedup' },
      { action: 'EXCEPTION_CREATED', action_label: 'Exception Created', entity_type: 'exception', entity_id: 'exc-001', user_id: userMap.get('ro.ehp.01@pngec.gov.pg'), description: 'Missing fingerprint exception raised', category: 'exception' },
      { action: 'EXCEPTION_APPROVED', action_label: 'Exception Approved', entity_type: 'exception', entity_id: 'exc-002', user_id: userMap.get('sup.whp.01@pngec.gov.pg'), description: 'Worn fingerprint exception approved with supervisor override', category: 'exception' },
      { action: 'DEVICE_STATUS_CHANGE', action_label: 'Device Status Changed', entity_type: 'device', entity_id: 'DEV-ESP-002', user_id: userMap.get('ict.security@pngec.gov.pg'), description: 'Device went offline - low battery', category: 'device' },
      { action: 'USER_LOGIN', action_label: 'User Login', entity_type: 'user', entity_id: userMap.get('admin@pngec.gov.pg') || 'unknown', user_id: userMap.get('admin@pngec.gov.pg'), description: 'Admin user logged in', category: 'auth' },
      { action: 'REGISTRATION_APPROVED', action_label: 'Registration Approved', entity_type: 'voter_registration', entity_id: insertedVoters?.[5]?.id || 'unknown', user_id: userMap.get('sup.ehp.01@pngec.gov.pg'), description: 'Voter registration approved after review', category: 'registration' },
      { action: 'DEDUP_RESOLVED', action_label: 'Duplicate Resolved', entity_type: 'dedup_match', entity_id: 'match-002', user_id: userMap.get('sup.whp.01@pngec.gov.pg'), description: 'Match marked as false positive - twins verified', category: 'dedup' },
      { action: 'CONFIG_UPDATED', action_label: 'Configuration Updated', entity_type: 'config', entity_id: 'dedup-threshold', user_id: userMap.get('ict.security@pngec.gov.pg'), description: 'Dedup threshold updated from 85% to 90%', category: 'system' },
      { action: 'BACKUP_CREATED', action_label: 'Backup Created', entity_type: 'backup', entity_id: 'backup-20260125-001', user_id: userMap.get('ict.security@pngec.gov.pg'), description: 'Full database backup created', category: 'system' },
      { action: 'REGISTRATION_REJECTED', action_label: 'Registration Rejected', entity_type: 'voter_registration', entity_id: insertedVoters?.[8]?.id || 'unknown', user_id: userMap.get('sup.ncd.01@pngec.gov.pg'), description: 'Registration rejected - underage voter', category: 'registration' },
      { action: 'DEVICE_ASSIGNED', action_label: 'Device Assigned', entity_type: 'device', entity_id: 'DEV-NCD-001', user_id: userMap.get('pro.ehp@pngec.gov.pg'), description: 'Device assigned to registration officer', category: 'device' },
      { action: 'SYNC_FAILED', action_label: 'Sync Failed', entity_type: 'sync_batch', entity_id: 'SB-WHP-002-20260125', user_id: userMap.get('ict.security@pngec.gov.pg'), description: 'Sync failed - connection timeout, retry scheduled', category: 'sync' },
      { action: 'EXCEPTION_ESCALATED', action_label: 'Exception Escalated', entity_type: 'exception', entity_id: 'exc-005', user_id: userMap.get('sup.whp.01@pngec.gov.pg'), description: 'Exception escalated to Provincial RO', category: 'exception' },
      { action: 'USER_CREATED', action_label: 'User Created', entity_type: 'user', entity_id: 'new-user-001', user_id: userMap.get('admin@pngec.gov.pg'), description: 'New registration officer account created', category: 'admin' },
      { action: 'SECURITY_KEY_ROTATED', action_label: 'Security Key Rotated', entity_type: 'security', entity_id: 'api-key-001', user_id: userMap.get('ict.security@pngec.gov.pg'), description: 'API key rotated for external integration', category: 'security' },
      { action: 'REPORT_GENERATED', action_label: 'Report Generated', entity_type: 'report', entity_id: 'report-daily-20260125', user_id: userMap.get('pro.ehp@pngec.gov.pg'), description: 'Daily registration report generated for EHP', category: 'report' },
      { action: 'VOTER_MERGED', action_label: 'Voter Records Merged', entity_type: 'voter_registration', entity_id: insertedVoters?.[2]?.id || 'unknown', user_id: userMap.get('sup.ehp.01@pngec.gov.pg'), description: 'Duplicate voter records merged', category: 'registration' },
    ].map((log) => ({ ...log, signature_hash: `sha256:audit-${Date.now()}-${Math.random()}`, timestamp: randomDate(new Date(2026, 0, 20), new Date()).toISOString() }));

    const { data: insertedLogs, error: logsError } = await supabase
      .from('audit_logs')
      .insert(auditLogs)
      .select();

    if (logsError) {
      console.error('Error seeding audit logs:', logsError);
    } else {
      console.log(`Inserted ${insertedLogs?.length || 0} audit logs`);
    }

    // 10. Seed System Stats
    console.log('Seeding system stats...');
    const systemStats = {
      total_registrations: insertedVoters?.length || 50,
      pending_sync: 289,
      pending_dedup: 6,
      active_devices: 11,
      offline_devices: 2,
      exceptions_open: 4,
      duplicates_detected: 10,
      sync_completion_rate: 94.5,
    };

    const { data: insertedStats, error: statsError } = await supabase
      .from('system_stats')
      .insert(systemStats)
      .select();

    if (statsError) {
      console.error('Error seeding system stats:', statsError);
    } else {
      console.log(`Inserted system stats snapshot`);
    }

    console.log('\n=== Database Seed Complete ===');
    console.log(`Provinces: ${insertedProvinces?.length || 0}`);
    console.log(`Districts: ${insertedDistricts?.length || 0}`);
    console.log(`Users: ${insertedUsers?.length || 0}`);
    console.log(`Devices: ${insertedDevices?.length || 0}`);
    console.log(`Voter Registrations: ${insertedVoters?.length || 0}`);
    console.log('Dedup Matches: 10');
    console.log('Exceptions: 10');
    console.log('Sync Batches: 14');
    console.log('Audit Logs: 20');
    console.log('System Stats: 1');

  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seedDatabase();
