# Actual Permissions Reference

## Permission Patterns in System

Based on `src/types/role.types.ts`, here are the actual permissions defined:

### Admin Permissions (26 permissions)
- `manage:user`, `manage:users`
- `view:all_users`
- `manage:mahasiswa`, `manage:dosen`, `manage:laboran`, `manage:admin`
- `manage:mata_kuliah`, `manage:kelas`, `manage:kelas_mahasiswa`
- `manage:jadwal`, `manage:laboratorium`
- `manage:kuis`, `manage:inventaris`, `manage:peminjaman`
- `manage:pengumuman`, `manage:materi`, `manage:sync`
- `view:dashboard`, `view:analytics`, `view:nilai`
- `manage:notification`

### Dosen Permissions (17 permissions)
- `manage:mata_kuliah`, `view:mata_kuliah`
- `manage:kelas`, `manage:kelas_mahasiswa`
- `view:mahasiswa`
- `manage:jadwal`, `view:jadwal`
- `manage:kehadiran`
- `manage:kuis`, `manage:soal`
- `grade:attempt_kuis` (NOT `grade:kuis`!)
- `view:jawaban`
- `manage:nilai`
- `manage:materi`, `view:materi`
- `create:peminjaman`, `update:peminjaman`, `view:peminjaman`
- `create:pengumuman`
- `view:notification`

### Mahasiswa Permissions (13 permissions)
- `view:jadwal`
- `manage:kehadiran`
- `view:kuis`
- `create:attempt_kuis`, `update:attempt_kuis`, `view:attempt_kuis`
- `create:jawaban`, `update:jawaban`, `view:jawaban`
- `view:nilai`, `view:materi`
- `create:peminjaman`, `view:peminjaman`
- `view:pengumuman`
- `view:notification`

### Laboran Permissions (8 permissions)
- `manage:inventaris`
- `manage:laboratorium`
- `manage:peminjaman`, `view:peminjaman`, `update:peminjaman`
- `view:jadwal`
- `manage:kehadiran`
- `view:notification`

## Important Notes

1. **No CRUD Pattern**: Permissions don't follow `create:`, `update:`, `delete:` pattern consistently
2. **Manage Pattern**: Most resources use `manage:` for full control
3. **View Pattern**: Read access uses `view:` pattern
4. **Special Cases**:
   - Quiz grading: `grade:attempt_kuis` (not `grade:kuis`)
   - User management: both `manage:user` and `manage:users` exist
   - No `approve:*` permissions exist!
5. **Peminjaman**:
   - Dosen: can `create`, `update`, `view`
   - Mahasiswa: can `create`, `view`
   - Laboran: can `manage`, `update`, `view`

## For Unit Tests

When writing tests, use these ACTUAL permissions:
```typescript
// CORRECT ✅
expect(hasPermission('dosen', 'manage:kuis')).toBe(true);
expect(hasPermission('dosen', 'grade:attempt_kuis')).toBe(true);
expect(hasPermission('laboran', 'manage:inventaris')).toBe(true);

// WRONG ❌
expect(hasPermission('dosen', 'create:kuis')).toBe(true); // No such permission!
expect(hasPermission('dosen', 'grade:kuis')).toBe(true); // No such permission!
expect(hasPermission('laboran', 'approve:peminjaman')).toBe(true); // No such permission!
```
