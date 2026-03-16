import os
import glob
import xml.etree.ElementTree as ET

def fix_file(filepath):
    tree = ET.parse(filepath)
    root = tree.getroot()
    
    cells = root.findall('.//mxCell')
    
    entities = []
    processes = []
    data_stores = []
    data_store_tops = {}
    data_store_bots = {}
    
    edges = []
    
    for cell in cells:
        style = cell.get('style', '')
        cell_id = cell.get('id', '')
        
        if cell.get('edge') == '1':
            edges.append(cell)
            continue
            
        geom = cell.find('mxGeometry')
        if geom is None:
            continue
            
        if cell_id in ['0', '1', 'title', 'subtitle']:
            continue
            
        if 'ellipse;' in style or 'shape=ellipse' in style:
            processes.append(cell)
        elif 'shape=rectangle' in style or ('whiteSpace=wrap' in style and 'fillColor' in style and 'ellipse' not in style and not cell_id.endswith('_lbl')):
            if 'text;' not in style:
                entities.append(cell)
        elif cell_id.endswith('_lbl') and 'text;' in style:
            data_stores.append(cell)
        elif cell_id.endswith('_top'):
            data_store_tops[cell_id.replace('_top', '')] = cell
        elif cell_id.endswith('_bot'):
            data_store_bots[cell_id.replace('_bot', '')] = cell

    # Posisi Ideal
    LEFT_X = 100
    MIDDLE_X = 500
    RIGHT_X = 900
    
    # Ratakan Entitas di Kiri
    start_y = 150
    gap_y = 150
    for i, ent in enumerate(entities):
        geom = ent.find('mxGeometry')
        if geom is not None:
            geom.set('x', str(LEFT_X))
            geom.set('y', str(start_y + i * gap_y))
            
    # Ratakan Proses di Tengah
    start_y = 100
    gap_y = 180
    for i, proc in enumerate(processes):
        geom = proc.find('mxGeometry')
        if geom is not None:
            geom.set('x', str(MIDDLE_X))
            geom.set('y', str(start_y + i * gap_y))
            
    # Ratakan Data Store di Kanan
    start_y = 150
    gap_y = 150
    for i, ds in enumerate(data_stores):
        geom = ds.find('mxGeometry')
        if geom is not None:
            geom.set('x', str(RIGHT_X))
            new_y = start_y + i * gap_y
            geom.set('y', str(new_y))
            base_id = ds.get('id').replace('_lbl', '')
            
            top_line = data_store_tops.get(base_id)
            if top_line is not None:
                tgeom = top_line.find('mxGeometry')
                tgeom.set('x', str(RIGHT_X))
                tgeom.set('y', str(new_y))
                
            bot_line = data_store_bots.get(base_id)
            if bot_line is not None:
                bgeom = bot_line.find('mxGeometry')
                bgeom.set('x', str(RIGHT_X))
                bgeom.set('y', str(new_y + 44))

    for edge in edges:
        geom = edge.find('mxGeometry')
        if geom is not None:
            # Hapus poin Waypoints statis, Drawio akan routing dgn sendirinya jika kita biarkan point hilang
            points = geom.find('Array')
            if points is not None:
                geom.remove(points)
            
        style = edge.get('style', '')
        parts = []
        for p in style.split(';'):
            if p and not p.startswith('exitX') and not p.startswith('exitY') and not p.startswith('entryX') and not p.startswith('entryY'):
                parts.append(p)
                
        # Menambahkan Edge Style otomatis terbaik
        if 'jumpStyle=arc' not in parts:
            parts.append('jumpStyle=arc')
            parts.append('jumpSize=15')
            parts.append('rounded=1')
            parts.append('orthogonalLoop=1')
            
        # Drawio's native elbow/orthogonal automatic routing
        if 'edgeStyle=orthogonalEdgeStyle' not in parts:
            parts.append('edgeStyle=orthogonalEdgeStyle')

        edge.set('style', ';'.join(parts) + ';')

    tree.write(filepath, encoding='UTF-8', xml_declaration=True)
    print("Fixed", filepath)

files = glob.glob("f:/sistem-praktikum/sistem-praktikum-pwa/docs/DFD-Level2*.drawio")
for f in files:
    fix_file(f)
