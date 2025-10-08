# Protected Files - DO NOT MODIFY

These files are critical and should NOT be modified without careful consideration:

## Configuration Files
- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript base config
- `tsconfig.app.json` - App TypeScript config
- `tsconfig.node.json` - Node TypeScript config
- `components.json` - Shadcn configuration
- `package.json` - Dependencies (only add, don't remove)

## Core Setup Files
- `src/main.tsx` - App entry point
- `src/index.css` - Global styles
- `sw.js` - Service Worker (ROOT LEVEL - critical for offline)

## Database Schema
- `supabase/database-complete.sql` - Single source of truth
- All files in `supabase/migrations/` once applied

## Documentation
- `README.md` - Project overview
- Project structure files

## Why Protected?
These files form the foundation of the application. Modifying them incorrectly can break:
- Build process
- Type checking
- Offline functionality
- Database integrity

## When to Modify?
Only modify these files when:
1. Adding new dependencies (package.json)
2. Adding new Vite plugins (vite.config.ts)
3. Extending TypeScript config (tsconfig files)
4. Adding new Shadcn components (components.json)
5. Database schema changes (create new migration file)

## Before Modifying:
1. ✅ Understand what the file does
2. ✅ Check if there's an alternative approach
3. ✅ Backup the file
4. ✅ Test thoroughly after changes
5. ✅ Document the reason for modification