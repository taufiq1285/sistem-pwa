import os, glob, re

def update_xml(content):
    # Hapus titik manual paksaan supaya rute garis meliuk otomatis dan rapi
    content = re.sub(r'<Array as="points">.*?</Array>', '', content, flags=re.DOTALL)
    
    # 1. Posisikan kumpulan proses vertikal lurus di kolom tengah 
    proc_y = 120
    def proc_repl(m):
        nonlocal proc_y
        geo_inner = re.sub(r'x="[0-9]+"', 'x="420"', m.group(2))
        geo_inner = re.sub(r'y="[0-9]+"', f'y="{proc_y}"', geo_inner)
        proc_y += 140
        return m.group(1) + geo_inner + m.group(3)
        
    content = re.sub(r'(<mxCell id="P\d+".*?<mxGeometry )([^>]*)( as="geometry"/>)', proc_repl, content, flags=re.DOTALL)
    
    # 2. Posisikan kumpulan Data Store lurus di sisi paling kanan 
    ds_y = 160
    ds_groups = {}
    
    def ds_repl(m):
        nonlocal ds_y
        full_id = m.group(2)
        ds_id = full_id.split('_')[0]
        if ds_id not in ds_groups:
            ds_groups[ds_id] = ds_y
            ds_y += 150
        
        y_val = ds_groups[ds_id]
        if '_bot' in full_id:
            y_val += 44
            
        geo_inner = re.sub(r'x="[0-9]+"', 'x="840"', m.group(4))
        geo_inner = re.sub(r'y="[0-9]+"', f'y="{y_val}"', geo_inner)
        return m.group(1) + full_id + m.group(3) + geo_inner + m.group(5)
        
    content = re.sub(r'(<mxCell id=")(D\d+_(?:top|lbl|bot))(".*?<mxGeometry )([^>]*)( as="geometry"/>)', ds_repl, content, flags=re.DOTALL)
    
    # 3. Posisikan entitas pengguna lurus di sisi kiri 
    ent_y_left = 160
    ent_y_right = 160
    
    for ent in ['Dosen', 'Mahasiswa', 'Admin', 'Laboran', 'User', 'SupabaseAuth', 'Supabase']:
        pattern = r'(<mxCell id="' + ent + r'".*?<mxGeometry )([^>]*)( as="geometry"/>)'
        for match in re.finditer(pattern, content, flags=re.DOTALL):
            if 'Supabase' in ent:
                x_val = '840'
                y_val = ent_y_right
                ent_y_right += 150
            else:
                x_val = '30'
                y_val = ent_y_left
                ent_y_left += 160
            geo_inner = re.sub(r'x="[0-9]+"', f'x="{x_val}"', match.group(2))
            geo_inner = re.sub(r'y="[0-9]+"', f'y="{y_val}"', geo_inner)
            content = content.replace(match.group(0), match.group(1) + geo_inner + match.group(3))

    # 4. Lepaskan pengaturan titik exit/entry agar Draw.io mencari titik koneksi terdekat
    def edge_repl(m):
        style = m.group(2)
        style = re.sub(r'exit[XY]=-?[\d\.]+;', '', style)
        style = re.sub(r'entry[XY]=-?[\d\.]+;', '', style)
        return m.group(1) + style + m.group(3)
        
    content = re.sub(r'(<mxCell [^>]*?edge="1".*?style=")([^"]*)(")', edge_repl, content, flags=re.DOTALL)
    
    return content

files = glob.glob('docs/DFD-Level2-*.drawio')
count = 0
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        data = file.read()
    new_data = update_xml(data)
    with open(f, 'w', encoding='utf-8') as file:
        file.write(new_data)
    count += 1
        
print("BERHASIL: Merapikan tata letak vertikal untuk " + str(count) + " DFD Level 2.")
