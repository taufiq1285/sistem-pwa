/**
 * Script to apply offline error handling fixes
 * Run with: node apply-offline-fix.js
 */

const fs = require('fs');
const path = require('path');

// Fix 1: errors.ts
const errorsPath = path.join(__dirname, 'src/lib/utils/errors.ts');
let errorsContent = fs.readFileSync(errorsPath, 'utf8');

const oldLogError = `export function logError(error: BaseApiError, context?: string): void {
  if (import.meta.env.DEV) {
    console.group(\`🔴 API Error \${context ? \`(\${context})\` : ''}\`);
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Status:', error.statusCode);
    console.error('Details:', error.details);
    console.error('Stack:', error.stack);
    console.groupEnd();
  }
}`;

const newLogError = `export function logError(error: BaseApiError, context?: string): void {
  if (import.meta.env.DEV) {
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
  }
}`;

if (errorsContent.includes(oldLogError)) {
  errorsContent = errorsContent.replace(oldLogError, newLogError);
  fs.writeFileSync(errorsPath, errorsContent, 'utf8');
  console.log('✅ Fix 1: errors.ts updated successfully');
} else {
  console.log('⚠️  Fix 1: Pattern not found or already applied');
}

// Fix 2a: base.api.ts - query() function
const baseApiPath = path.join(__dirname, 'src/lib/api/base.api.ts');
let baseApiContent = fs.readFileSync(baseApiPath, 'utf8');

const oldQuery = `export async function query<T = any>(
  table: string,
  options: BaseQueryOptions = {}
): Promise<T[]> {
  try {
    let queryBuilder = supabase`;

const newQuery = `export async function query<T = any>(
  table: string,
  options: BaseQueryOptions = {}
): Promise<T[]> {
  // Check if offline - return empty array instead of throwing error
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return [] as T[];
  }

  try {
    let queryBuilder = supabase`;

if (baseApiContent.includes(oldQuery)) {
  baseApiContent = baseApiContent.replace(oldQuery, newQuery);
  console.log('✅ Fix 2a: base.api.ts query() updated successfully');
} else {
  console.log('⚠️  Fix 2a: Pattern not found or already applied');
}

// Fix 2b: base.api.ts - queryWithFilters() function
const oldQueryWithFilters = `export async function queryWithFilters<T = any>(
  table: string,
  filters: FilterOptions[],
  options: BaseQueryOptions = {}
): Promise<T[]> {
  try {
    let queryBuilder = supabase`;

const newQueryWithFilters = `export async function queryWithFilters<T = any>(
  table: string,
  filters: FilterOptions[],
  options: BaseQueryOptions = {}
): Promise<T[]> {
  // Check if offline - return empty array instead of throwing error
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return [] as T[];
  }

  try {
    let queryBuilder = supabase`;

if (baseApiContent.includes(oldQueryWithFilters)) {
  baseApiContent = baseApiContent.replace(oldQueryWithFilters, newQueryWithFilters);
  console.log('✅ Fix 2b: base.api.ts queryWithFilters() updated successfully');
} else {
  console.log('⚠️  Fix 2b: Pattern not found or already applied');
}

// Save base.api.ts
fs.writeFileSync(baseApiPath, baseApiContent, 'utf8');

console.log('\n🎉 All fixes applied! Now you can:');
console.log('1. Run: npm run dev');
console.log('2. Test offline mode (F12 > Network > Offline)');
console.log('3. Check console - should only show "⚠️ Offline" instead of 300+ error lines');
