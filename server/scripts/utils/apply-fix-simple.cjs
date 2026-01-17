const fs = require('fs');

// Fix 1: errors.ts
console.log('Fixing errors.ts...');
let errors = fs.readFileSync('./src/lib/utils/errors.ts', 'utf8');

const beforeErrors = `  if (import.meta.env.DEV) {
    console.group(\`🔴 API Error \${context ? \`(\${context})\` : ''}\`);
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Status:', error.statusCode);
    console.error('Details:', error.details);
    console.error('Stack:', error.stack);
    console.groupEnd();
  }`;

const afterErrors = `  if (import.meta.env.DEV) {
    // Skip noisy network errors - only show brief warning
    if (isNetworkError(error)) {
      console.warn(\`⚠️ Offline \${context ? \`(\${context})\` : ''}\`);
      return;
    }

    // Full log for other errors
    console.group(\`🔴 API Error \${context ? \`(\${context})\` : ''}\`);
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    if (error.statusCode) console.error('Status:', error.statusCode);
    if (error.details) console.error('Details:', error.details);
    console.groupEnd();
  }`;

if (errors.includes(beforeErrors)) {
  errors = errors.replace(beforeErrors, afterErrors);
  fs.writeFileSync('./src/lib/utils/errors.ts', errors);
  console.log('✅ errors.ts fixed!');
} else {
  console.log('⚠️  errors.ts pattern not found (already fixed?)');
}

// Fix 2: base.api.ts
console.log('\nFixing base.api.ts...');
let baseApi = fs.readFileSync('./src/lib/api/base.api.ts', 'utf8');

// Fix query()
const beforeQuery = `): Promise<T[]> {
  try {
    let queryBuilder = supabase
      // PERBAIKAN: 'as any' diperlukan di sini untuk generic API
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(table as any)`;

const afterQuery = `): Promise<T[]> {
  // Check if offline - return empty array instead of throwing error
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return [] as T[];
  }

  try {
    let queryBuilder = supabase
      // PERBAIKAN: 'as any' diperlukan di sini untuk generic API
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(table as any)`;

let count = 0;
if (baseApi.includes(beforeQuery)) {
  // Replace first occurrence (query function)
  baseApi = baseApi.replace(beforeQuery, afterQuery);
  count++;
  console.log('✅ query() fixed!');
} else {
  console.log('⚠️  query() pattern not found (already fixed?)');
}

// Fix queryWithFilters() - similar pattern but different function
const beforeQueryFilters = `): Promise<T[]> {
  try {
    let queryBuilder = supabase
      // PERBAIKAN: 'as any' diperlukan di sini untuk generic API
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(table as any)
      .select(options.select || '*');

    // Apply filters`;

const afterQueryFilters = `): Promise<T[]> {
  // Check if offline - return empty array instead of throwing error
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return [] as T[];
  }

  try {
    let queryBuilder = supabase
      // PERBAIKAN: 'as any' diperlukan di sini untuk generic API
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(table as any)
      .select(options.select || '*');

    // Apply filters`;

if (baseApi.includes(beforeQueryFilters)) {
  baseApi = baseApi.replace(beforeQueryFilters, afterQueryFilters);
  count++;
  console.log('✅ queryWithFilters() fixed!');
} else {
  console.log('⚠️  queryWithFilters() pattern not found (already fixed?)');
}

if (count > 0) {
  fs.writeFileSync('./src/lib/api/base.api.ts', baseApi);
  console.log(`\n✅ base.api.ts saved with ${count} fix(es)!`);
}

console.log('\n🎉 Done! Test with: npm run dev');
