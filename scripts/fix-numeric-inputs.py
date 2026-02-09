#!/usr/bin/env python3
"""
Script to fix numeric input fields to allow deletion without reverting to default value.
Converts type="number" to type="text" with inputMode="numeric" and proper validation.
"""

import re
import os

def fix_simple_number_input(content):
    """
    Fix simple number inputs (integer only) like jumlah, kapasitas, tahun_pengadaan
    Pattern: type="number" with onChange that uses parseInt
    """
    # Pattern 1: Input dengan parseInt di onChange
    pattern1 = r'<Input\s+([^>]*?)type="number"([^>]*?)value=\{([^}]+)\}([^>]*?)onChange=\{\(e\)\s*=>\s*([^}]+)\{([^}]*?)([^,\s]+):\s*parseInt\(e\.target\.value\)([^}]*?)\}\)'

    def replace1(match):
        before_type = match.group(1)
        after_type = match.group(2)
        value_expr = match.group(3)
        after_value = match.group(4)
        before_change = match.group(5)
        before_field = match.group(6)
        field_name = match.group(7)
        after_field = match.group(8)

        # Remove min/max from before_type and after_type
        before_type = re.sub(r'\s*min="[^"]*"\s*', ' ', before_type)
        before_type = re.sub(r'\s*max="[^"]*"\s*', ' ', before_type)
        after_type = re.sub(r'\s*min="[^"]*"\s*', ' ', after_type)
        after_type = re.sub(r'\s*max="[^"]*"\s*', ' ', after_type)
        after_value = re.sub(r'\s*min="[^"]*"\s*', ' ', after_value)
        after_value = re.sub(r'\s*max="[^"]*"\s*', ' ', after_value)

        return f'''<Input{before_type}type="text"{after_type}inputMode="numeric" value={{{value_expr}}}{after_value}onChange={{(e) => {before_change}{{
                    const value = e.target.value;
                    if (value === "" || /^\\d+$/.test(value)) {{{before_field}{field_name}: value === "" ? 0 : parseInt(value){after_field}}}
                  }}}}'''

    content = re.sub(pattern1, replace1, content)
    return content

def fix_float_number_input(content):
    """
    Fix float number inputs like nilai (grades), harga_satuan
    Pattern: type="number" with step="0.01" or parseFloat
    """
    # Pattern for parseFloat
    pattern = r'<Input\s+([^>]*?)type="number"([^>]*?)value=\{([^}]+)\}([^>]*?)onChange=\{\(e\)\s*=>\s*([^}]+)\{([^}]*?)([^,\s]+):\s*parseFloat\(e\.target\.value\)([^}]*?)\}\)'

    def replace_float(match):
        before_type = match.group(1)
        after_type = match.group(2)
        value_expr = match.group(3)
        after_value = match.group(4)
        before_change = match.group(5)
        before_field = match.group(6)
        field_name = match.group(7)
        after_field = match.group(8)

        # Remove min/max/step
        before_type = re.sub(r'\s*(min|max|step)="[^"]*"\s*', ' ', before_type)
        after_type = re.sub(r'\s*(min|max|step)="[^"]*"\s*', ' ', after_type)
        after_value = re.sub(r'\s*(min|max|step)="[^"]*"\s*', ' ', after_value)

        return f'''<Input{before_type}type="text"{after_type}inputMode="numeric" value={{{value_expr}}}{after_value}onChange={{(e) => {before_change}{{
                    const value = e.target.value;
                    if (value === "" || /^\\d*\\.?\\d*$/.test(value)) {{{before_field}{field_name}: value === "" ? 0 : parseFloat(value){after_field}}}
                  }}}}'''

    content = re.sub(pattern, replace_float, content)
    return content

# Files to process
files_to_fix = [
    "src/pages/dosen/PenilaianPage.tsx",
    "src/pages/laboran/InventarisPage.tsx",
    "src/pages/laboran/LaboratoriumPage.tsx",
    "src/pages/admin/LaboratoriesPage.tsx",
    "src/pages/admin/EquipmentsPage.tsx",
    "src/pages/laboran/PeminjamanAktifPage.tsx",
    "src/pages/mahasiswa/NilaiPage.tsx",
    "src/components/features/penilaian/PermintaanPerbaikanTab.tsx",
]

print("Starting to fix numeric input fields...")
for filepath in files_to_fix:
    if not os.path.exists(filepath):
        print(f"⚠️  File not found: {filepath}")
        continue

    print(f"Processing: {filepath}")

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Apply fixes
    content = fix_simple_number_input(content)
    content = fix_float_number_input(content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Fixed: {filepath}")
    else:
        print(f"ℹ️  No changes needed: {filepath}")

print("\nDone! All files have been processed.")
