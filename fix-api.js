const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/lib/api/kelas.api.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Remove the unused userId variable declaration
content = content.replace('    let userId: string;', '');

// Replace the if (!data.email) block with email generation logic
const oldBlock = `    } else {
      // If no email provided, create mahasiswa without user account
      if (!data.email) {
        const { data: newMahasiswa, error: mahasiswaError } = await supabase
          .from('mahasiswa')
          .insert({
            user_id: null, // No user account yet
            nim: data.nim,
            angkatan: new Date().getFullYear(),
            program_studi: 'Unknown',
          })
          .select('id')
          .single();

        if (mahasiswaError) throw mahasiswaError;
        mahasiswaId = newMahasiswa.id;
      } else {
        // Email provided, check if user with this email already exists`;

const newBlock = `    } else {
      // If no email provided, generate a temporary email based on NIM
      const emailToUse = data.email || \`\${data.nim}@temp.student.local\`;

      {
        // Check if user with this email already exists`;

content = content.replace(oldBlock, newBlock);

// Update the reference to data.email to emailToUse
content = content.replace(
  '        const { data: existingUser } = await supabase\n          .from(\'users\')\n          .select(\'id, role, full_name\')\n          .eq(\'email\', data.email)\n          .limit(1);',
  '        const { data: existingUser } = await supabase\n          .from(\'users\')\n          .select(\'id, role, full_name\')\n          .eq(\'email\', emailToUse)\n          .limit(1);'
);

// Update other references to data.email in the block
content = content.replace(
  '            `Email ${data.email} sudah terdaftar sebagai ${user.role}. Gunakan email lain.`',
  '            `Email ${emailToUse} sudah terdaftar sebagai ${user.role}. Gunakan email lain.`'
);

content = content.replace(
  '        const { data: newUser, error: signUpError } = await supabase.auth.signUp({\n          email: data.email,',
  '        const { data: newUser, error: signUpError } = await supabase.auth.signUp({\n          email: emailToUse,'
);

content = content.replace(
  '          .insert({\n            id: newUser.user.id,\n            email: data.email,\n            full_name: data.full_name,',
  '          .insert({\n            id: newUser.user.id,\n            email: emailToUse,\n            full_name: data.full_name,'
);

// Remove the userId assignments since it's no longer used
content = content.replace(/\n      userId = existingMahasiswa\[0\]\.user_id;/g, '');
content = content.replace(/\n            userId = user\.id;/g, '');
content = content.replace(/\n        userId = newUser\.user\.id;/g, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('File updated successfully!');
