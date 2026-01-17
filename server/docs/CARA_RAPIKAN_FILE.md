# 📁 Cara Merapikan File

## Untuk Windows:

Jalankan:

```cmd
move-files.bat
```

## Untuk Linux/Mac:

Jalankan:

```bash
chmod +x move-files.sh
./move-files.sh
```

## Hasil:

- ✅ Semua file `.sql` → folder `scripts/`
- ✅ Semua file `.md` dokumentasi → folder `docs/`
- ✅ Semua file test → folder `testing/`
- ✅ File misc → folder `scripts/`

## File yang tetap di root:

- package.json
- tsconfig.json
- vite.config.ts
- eslint.config.js
- .gitignore
- README.md
- index.html
