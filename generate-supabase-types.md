# Generate Supabase Types

## Cara 1: Menggunakan Supabase CLI (Recommended)

### 1. Install Supabase CLI jika belum ada:
```bash
npm install -g supabase
```

### 2. Login ke Supabase:
```bash
npx supabase login
```

### 3. Link project Anda:
```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

Catatan: YOUR_PROJECT_REF bisa dilihat di:
- Supabase Dashboard → Settings → General → Reference ID

### 4. Generate Types:
```bash
npx supabase gen types typescript --linked > src/types/database.types.ts
```

Atau jika ada error, gunakan ini:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
```

## Cara 2: Manual dari Dashboard

### 1. Buka Supabase Dashboard
### 2. Pergi ke Settings → API
### 3. Scroll ke bawah sampai "Generate Types"
### 4. Copy TypeScript code yang di-generate
### 5. Paste ke file src/types/database.types.ts

