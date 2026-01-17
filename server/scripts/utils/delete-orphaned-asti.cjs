/**
 * Delete orphaned asti@test.com user from auth.users
 * Run: node delete-orphaned-asti.js
 */

const https = require('https');

// Service Role Key dari dashboard
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJreW9pZnFiZmN6dG5oZXZwbnB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjM3NTI2NywiZXhwIjoyMDQ3OTUxMjY3fQ.nUIgG0jjRa_R1L1EVCZZhj1m3tSyxlKuaKkCVaUFPro';

// ID user yang akan dihapus (dari error log terakhir)
const USER_ID = '0ab074eb-1415-43c4-b404-83140533271b';

const options = {
  hostname: 'rkyoifqbfcztnhevpnpx.supabase.co',
  port: 443,
  path: `/auth/v1/admin/users/${USER_ID}`,
  method: 'DELETE',
  headers: {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  }
};

console.log('🗑️  Deleting orphaned asti@test.com from auth.users...');
console.log(`User ID: ${USER_ID}\n`);

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 204 || res.statusCode === 200) {
      console.log('✅ SUCCESS! Orphaned user deleted from auth.users');
      console.log('\nNext steps:');
      console.log('1. Apply migration: npx supabase db push');
      console.log('2. Test registration with asti@test.com again');
    } else {
      console.log('❌ FAILED!');
      console.log('Response:', data);
      console.log('\nAlternative: Delete manually from Supabase Dashboard');
      console.log('Go to: Authentication > Users > Find asti@test.com > Delete');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error);
});

req.end();
