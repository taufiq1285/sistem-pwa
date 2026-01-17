/**
 * Run Bank Soal Migration
 * This script applies the bank_soal table migration to the database
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('📦 Running Bank Soal migration...\n');

    // Read the migration file
    const migrationSQL = fs.readFileSync(
      './supabase/migrations/20250112_create_bank_soal.sql',
      'utf8'
    );

    // Split SQL statements (simple split by semicolon)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comments
      if (statement.startsWith('--') || statement.startsWith('/*')) {
        continue;
      }

      console.log(`[${i + 1}/${statements.length}] Executing statement...`);

      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });

        if (error) {
          // Check if it's an "already exists" error (42P07)
          if (error.code === '42P07' || error.message.includes('already exists')) {
            console.log(`⚠️  Statement ${i + 1}: Already exists (skipping)`);
          } else if (error.message.includes('does not exist')) {
            console.log(`⚠️  Statement ${i + 1}: ${error.message} (skipping)`);
          } else {
            console.error(`❌ Statement ${i + 1} failed:`, error.message);
            // Don't exit, continue with other statements
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`❌ Statement ${i + 1} error:`, err.message);
      }
    }

    console.log('\n✅ Migration completed!');
    console.log('\nℹ️  If you see errors above, you may need to run the migration manually through Supabase SQL Editor:');
    console.log('1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new');
    console.log('2. Copy the contents of supabase/migrations/20250112_create_bank_soal.sql');
    console.log('3. Paste and run the SQL');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Alternative: Direct SQL execution via Supabase API
async function runMigrationDirect() {
  try {
    console.log('📦 Running Bank Soal migration (Direct Method)...\n');

    // Read the migration file
    const migrationSQL = fs.readFileSync(
      './supabase/migrations/20250112_create_bank_soal.sql',
      'utf8'
    );

    console.log('📄 Migration file loaded successfully');
    console.log('\n⚠️  MANUAL STEP REQUIRED:\n');
    console.log('Since the Supabase JavaScript client cannot execute raw DDL SQL,');
    console.log('you need to run this migration manually:\n');
    console.log('1. Go to: https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Create a new query');
    console.log('5. Copy and paste the contents of:');
    console.log('   supabase/migrations/20250112_create_bank_soal.sql');
    console.log('6. Click "Run" to execute\n');

    console.log('✅ Migration file is ready at:');
    console.log('   supabase/migrations/20250112_create_bank_soal.sql\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the migration
console.log('='.repeat(60));
console.log('BANK SOAL MIGRATION');
console.log('='.repeat(60));
runMigrationDirect();
