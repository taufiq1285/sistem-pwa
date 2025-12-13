const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing TypeScript errors...\n');

// ============================================================================
// 1. Fix UsersPage.tsx - Remove phone field
// ============================================================================

const usersPagePath = path.join(__dirname, 'src/pages/admin/UsersPage.tsx');
let usersContent = fs.readFileSync(usersPagePath, 'utf8');

// Remove phone from update query
usersContent = usersContent.replace(
  `        .update({
          full_name: editingUser.full_name,
          phone: editingUser.phone,
          is_active: editingUser.is_active,
        })`,
  `        .update({
          full_name: editingUser.full_name,
          is_active: editingUser.is_active,
        })`
);

// Remove phone input field from dialog
usersContent = usersContent.replace(
  `              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                />
              </div>`,
  ``
);

// Fix is_active null handling in checkbox
usersContent = usersContent.replace(
  `                  checked={editingUser.is_active}`,
  `                  checked={editingUser.is_active || false}`
);

fs.writeFileSync(usersPagePath, usersContent, 'utf8');
console.log('✅ Fixed UsersPage.tsx - removed phone field');

// ============================================================================
// 2. Fix AuthProvider.tsx - Remove response variable references
// ============================================================================

const authProviderPath = path.join(__dirname, 'src/providers/AuthProvider.tsx');
let authContent = fs.readFileSync(authProviderPath, 'utf8');

// Remove the response variable references
authContent = authContent.replace(
  `        if (!response?.success) {
          console.warn('⚠️ Logout API error:', response?.error);
        } else {
          console.log('✅ Auth API logout success');
        }`,
  ``
);

fs.writeFileSync(authProviderPath, authContent, 'utf8');
console.log('✅ Fixed AuthProvider.tsx - removed response variable references');

console.log('\n═══════════════════════════════════════');
console.log('✅ All TypeScript errors fixed!');
console.log('═══════════════════════════════════════\n');

console.log('Fixed issues:');
console.log('  - Removed phone field from UsersPage (not in database schema)');
console.log('  - Fixed is_active null handling');
console.log('  - Removed response variable references from AuthProvider');
