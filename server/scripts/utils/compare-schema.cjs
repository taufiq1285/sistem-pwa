const fs = require('fs');
const path = require('path');

/**
 * Script untuk membandingkan Type Definitions dengan Database Schema
 *
 * Cara pakai:
 * 1. Generate database types dari Supabase: npx supabase gen types typescript --linked > database-actual.ts
 * 2. Jalankan script ini: node compare-schema.cjs
 */

console.log('='.repeat(80));
console.log('SCHEMA COMPARISON TOOL');
console.log('='.repeat(80));
console.log();

// Read current type definitions
const commonTypesPath = path.join(__dirname, 'src/types/common.types.ts');
const commonTypes = fs.readFileSync(commonTypesPath, 'utf8');

console.log('📋 CHECKING PENGUMUMAN TYPE...\n');

// Extract Pengumuman interface
const pengumumanMatch = commonTypes.match(/export interface Pengumuman[\s\S]*?\n\}/);
if (pengumumanMatch) {
  console.log('Current Pengumuman type:');
  console.log(pengumumanMatch[0]);
  console.log();

  // Check for missing properties
  const hasPenulis = pengumumanMatch[0].includes('penulis');
  const hasIsi = pengumumanMatch[0].includes('isi');
  const hasCreatedBy = pengumumanMatch[0].includes('created_by');

  console.log('Property Check:');
  console.log(`  ✓ penulis: ${hasPenulis ? 'FOUND' : '❌ MISSING'}`);
  console.log(`  ✓ isi: ${hasIsi ? 'FOUND' : '❌ MISSING - kolom database mungkin "konten" bukan "isi"'}`);
  console.log(`  ✓ created_by: ${hasCreatedBy ? 'FOUND' : '❌ MISSING - tambahkan property ini'}`);
  console.log();
}

console.log('='.repeat(80));
console.log();

// Check for database.types.ts
const dbTypesPath = path.join(__dirname, 'src/types/database.types.ts');
if (fs.existsSync(dbTypesPath)) {
  console.log('✓ database.types.ts EXISTS');
  console.log('  File size:', fs.statSync(dbTypesPath).size, 'bytes');
  console.log();

  const dbTypes = fs.readFileSync(dbTypesPath, 'utf8');

  // Check if it has Tables definition
  if (dbTypes.includes("Tables: {")) {
    console.log('✓ Database types contain Tables definition');

    // List all tables
    const tableMatches = dbTypes.match(/\s+(\w+): \{/g);
    if (tableMatches) {
      console.log('\n📊 Tables found in database.types.ts:');
      tableMatches.forEach(match => {
        const tableName = match.trim().replace(': {', '');
        if (tableName && !tableName.includes('Database')) {
          console.log(`  - ${tableName}`);
        }
      });
    }
  } else {
    console.log('⚠️  Database types might be outdated or incomplete');
  }
} else {
  console.log('❌ database.types.ts NOT FOUND');
  console.log();
  console.log('🔧 PLEASE GENERATE IT FIRST:');
  console.log('   npx supabase gen types typescript --linked > src/types/database.types.ts');
  console.log();
  console.log('   Or get it from Supabase Dashboard → Settings → API → Generate Types');
}

console.log();
console.log('='.repeat(80));
console.log();

console.log('📝 RECOMMENDATIONS:');
console.log();
console.log('1. Generate fresh database types from Supabase:');
console.log('   npx supabase gen types typescript --linked > src/types/database.types.ts');
console.log();
console.log('2. Run SQL queries in check-database-schema.sql to verify columns');
console.log();
console.log('3. Update type definitions to match actual database schema');
console.log();
console.log('4. Common mismatches found:');
console.log('   - Pengumuman: "konten" vs "isi"');
console.log('   - Pengumuman: missing "created_by" and "penulis_id"');
console.log('   - Mahasiswa: missing "prodi_id", "semester_aktif", etc.');
console.log('   - Peminjaman: column names might differ');
console.log();
console.log('='.repeat(80));
