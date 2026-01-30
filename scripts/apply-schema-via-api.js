/**
 * Apply schema using Supabase's SQL execution endpoint
 * This script attempts to apply the schema via the Supabase Management API
 */

const fs = require('fs');
const https = require('https');

const PROJECT_REF = 'wpzdecsalrsftaocmovg';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwemRlY3NhbHJzZnRhb2Ntb3ZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ2NjcxMCwiZXhwIjoyMDg1MDQyNzEwfQ.4Y_gL8gwYMcVI7-sgTKxKwuJizPOKvlrbmA9VhA2iaQ';

// Read schema
const schemaPath = './supabase/schema.sql';
const schema = fs.readFileSync(schemaPath, 'utf8');

// Split schema into individual statements
const statements = schema
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`Found ${statements.length} SQL statements to execute\n`);

// Function to execute a single SQL statement via RPC
async function executeSql(sql) {
  return new Promise((resolve, reject) => {
    // Try using the query endpoint
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      hostname: `${PROJECT_REF}.supabase.co`,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Check if we can use the RPC approach
async function checkRpcAvailable() {
  return new Promise((resolve) => {
    const options = {
      hostname: `${PROJECT_REF}.supabase.co`,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      }
    };
    
    const req = https.request(options, (res) => {
      resolve(res.statusCode !== 404);
    });
    
    req.on('error', () => resolve(false));
    req.write(JSON.stringify({ query: 'SELECT 1' }));
    req.end();
  });
}

async function main() {
  console.log('Checking if RPC exec_sql is available...');
  const rpcAvailable = await checkRpcAvailable();
  
  if (!rpcAvailable) {
    console.log('\n❌ RPC exec_sql function not available.');
    console.log('\nThe database schema needs to be applied manually via the Supabase Dashboard.');
    console.log('\n📋 QUICK STEPS:');
    console.log('1. Open: https://supabase.com/dashboard/project/wpzdecsalrsftaocmovg/sql/new');
    console.log('2. Copy the contents of supabase/schema.sql');
    console.log('3. Paste into the SQL Editor and click "Run"');
    console.log('4. Then run: bun run db:seed');
    return;
  }
  
  console.log('RPC available! Executing schema...');
  // Execute statements...
}

main().catch(console.error);
