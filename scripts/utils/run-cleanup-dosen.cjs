const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runCleanup() {
  // Load environment variables
  require('dotenv').config();

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('🧹 Starting cleanup dosen data...\n');
  console.log('⚠️  This will delete ALL data created by dosen!');
  console.log('   (But will keep dosen user accounts)\n');

  try {
    // Read and execute SQL file
    const sqlPath = path.join(__dirname, '..', 'sql', 'cleanup-dosen-data.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL by statements (simple split by semicolon)
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];

      // Skip comments
      if (stmt.startsWith('--') || stmt.length < 10) continue;

      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);

        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: stmt
        });

        if (error) {
          // Try direct query if RPC fails
          const { data: d2, error: e2 } = await supabase
            .from('_sql_executor')
            .select('*')
            .limit(1);

          if (e2) {
            console.log(`   ⚠️  Skipping (may need manual execution): ${error.message}`);
          }
        } else {
          console.log(`   ✓ Success`);
        }
      } catch (err) {
        console.log(`   ⚠️  Error: ${err.message}`);
      }
    }

    console.log('\n✅ Cleanup script executed!');
    console.log('\n⚠️  NOTE: Some statements may need manual execution via Supabase Dashboard');
    console.log('   Please verify the results in Supabase Dashboard > SQL Editor\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    console.log('\n💡 Alternative: Copy the SQL content and run it manually in Supabase Dashboard');
    console.log('   File location: scripts/sql/cleanup-dosen-data.sql');
    process.exit(1);
  }
}

runCleanup();
