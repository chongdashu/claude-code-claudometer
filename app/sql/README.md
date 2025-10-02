# Database Migration Instructions

## How to Run These SQL Scripts in Supabase

1. **Open Supabase SQL Editor:**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Click on "SQL Editor" in the left sidebar

2. **Run the migration script:**
   - Click "New query"
   - Copy the entire contents of `001_create_tables.sql`
   - Paste into the SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)

3. **Verify the tables were created:**
   - Go to "Table Editor" in the left sidebar
   - You should see 4 new tables:
     - `raw_posts`
     - `raw_comments`
     - `sentiment_results`
     - `daily_aggregates`

4. **After successful migration:**
   - The database is ready for the application
   - Run `npx prisma generate --schema=app/prisma/schema.prisma` to generate the Prisma client

## Alternative: Run via psql (command line)

If you prefer using psql:

```bash
psql "postgresql://postgres.nxynpbmxcgxcxfmfijwl:ttMsITs1RcxT3qYm@aws-1-eu-west-2.pooler.supabase.com:6543/postgres" < sql/001_create_tables.sql
```

## What This Migration Does

- Creates 4 tables with proper relationships and indexes
- Sets up foreign key constraints (posts → comments)
- Creates indexes for optimal query performance
- Adds a trigger to auto-update `updated_at` timestamp on daily_aggregates
- All tables use TEXT for IDs (compatible with Reddit's ID format)

## Migration Files

- `001_create_tables.sql` - Initial schema creation

## Notes

- These scripts are idempotent (safe to run multiple times) due to `IF NOT EXISTS` clauses
- The schema matches the Prisma schema exactly
- All indexes are created for the queries used in the application
