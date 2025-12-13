/**
 * Script to delete test users from Supabase Auth
 * Run with: node delete-test-users.js
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Users to delete
const usersToDelete = [
  {
    name: 'Asti',
    email: 'budi2401@test.com',
    uid: 'ea127368-9173-4838-9869-8617beb18c4f'
  },
  {
    name: 'mahasiswa',
    email: 'mahasiswa@akbid.ac.id',
    uid: '5de02c2b-0cbf-46a2-9b8e-7909096d70a2'
  },
  {
    name: 'Super Admin',
    email: 'superadmin@akbid.ac.id',
    uid: '7eb7eead-29e8-48aa-b8be-758b561d35cf'
  }
];

async function deleteUsers() {
  console.log('🗑️  Starting user deletion process...\n');

  for (const user of usersToDelete) {
    try {
      console.log(`Deleting: ${user.name} (${user.email})`);
      console.log(`UID: ${user.uid}`);

      // Delete from auth.users
      const { error } = await supabase.auth.admin.deleteUser(user.uid);

      if (error) {
        console.error(`❌ Failed: ${error.message}\n`);
      } else {
        console.log(`✅ Successfully deleted from auth.users\n`);
      }
    } catch (err) {
      console.error(`❌ Error: ${err.message}\n`);
    }
  }

  console.log('✅ Deletion process completed!');
  console.log('\nNote: Users are deleted from auth.users.');
  console.log('Database records in public.users table are handled by CASCADE delete policy.');
}

// Run the deletion
deleteUsers().catch(console.error);
