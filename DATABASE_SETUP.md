# PNGEC-BRS Database Setup Guide

## Supabase Project Details

- **Project URL:** https://wpzdecsalrsftaocmovg.supabase.co
- **Project ID:** wpzdecsalrsftaocmovg

## Step 1: Apply the Database Schema

1. Open the Supabase SQL Editor:
   **[Open SQL Editor](https://supabase.com/dashboard/project/wpzdecsalrsftaocmovg/sql/new)**

2. Copy the entire contents of `supabase/schema.sql`

3. Paste into the SQL Editor and click **"Run"**

4. Wait for the schema to be applied (usually takes 10-20 seconds)

## Step 2: Seed Initial Data

After the schema is applied, run the seed script:

```bash
cd pngec-brs
node scripts/check-and-seed.js
```

This will insert:
- 22 PNG provinces
- 53 sample districts
- 1 admin user
- 5 sample devices
- Initial system statistics

## Step 3: Verify Setup

Run the check script again to see table counts:

```bash
node scripts/check-and-seed.js
```

You should see all tables with record counts.

## Database Schema Overview

### Location Tables
- `provinces` - 22 PNG provinces
- `districts` - Electoral districts
- `llgs` - Local Level Governments
- `wards` - Ward boundaries
- `polling_places` - Polling place locations

### Core Tables
- `users` - System users with role-based access
- `devices` - Registration kit devices
- `voter_registrations` - Main voter data
- `dedup_matches` - Biometric deduplication matches
- `exceptions` - Registration exceptions

### Operational Tables
- `sync_batches` - Data sync tracking
- `audit_logs` - Immutable audit trail
- `system_stats` - System statistics snapshots

## Environment Variables

The following are already configured in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://wpzdecsalrsftaocmovg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Troubleshooting

### Tables show 404 error
The schema hasn't been applied. Follow Step 1 above.

### "relation does not exist" error
Run the schema.sql again in the SQL Editor.

### Permission denied errors
Check that RLS policies were created. The schema includes these automatically.
