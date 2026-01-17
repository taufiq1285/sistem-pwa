/**
 * Delete superadmin user from auth.users
 * Run: node delete-superadmin.js
 */

const https = require('https');

// GANTI INI dengan Service Role Key Anda dari Dashboard > Settings > API
const SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY_HERE';

const options = {
  hostname: 'rkyoifqbfcztnhevpnpx.supabase.co',
  port: 443,
  path: '/auth/v1/admin/users/7eb7eead-29e8-48aa-b8be-758b561d35cf',
  method: 'DELETE',
  headers: {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  }
};

console.log('🗑️  Deleting superadmin@akbid.ac.id from auth.users...\n');

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 204 || res.statusCode === 200) {
      console.log('✅ SUCCESS! User deleted from auth.users');
    } else {
      console.log('❌ FAILED!');
      console.log('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error);
});

req.end();
