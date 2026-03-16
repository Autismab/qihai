# Prisma Migration Baseline

## Current status

This project now uses a **PostgreSQL baseline migration** for production.

### Active migration chain
- `prisma/migrations/000000000000_init_pg/`
- `prisma/migrations/migration_lock.toml` → `provider = "postgresql"`

### Legacy history
Older SQLite-era migrations were moved to:
- `prisma/migrations_sqlite_legacy/`

They are kept only for historical reference and should **not** be used for PostgreSQL deploys.

## Production deploy flow

1. Set `DATABASE_URL` to a real PostgreSQL database
2. Run:
   - `npx prisma migrate deploy`
   - `npx prisma generate`
3. Deploy application

## Notes

- Do not restore the old SQLite migration chain into `prisma/migrations/`
- If old SQLite data must be preserved, migrate data separately with a one-off import script
- Do not use `prisma db push` as the main production workflow
