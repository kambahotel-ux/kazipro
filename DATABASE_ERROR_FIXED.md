# Database Error Fixed ✅

## What Happened
The SQL initialization script had an error:
```
ERROR: 42703: column "verified" does not exist
```

This was caused by a RLS policy trying to reference a column that doesn't exist in the `demandes` table.

## What We Fixed

### Original Error (in `sql/init_tables.sql`)
```sql
-- ❌ WRONG - demandes table doesn't have a "verified" column
CREATE POLICY "Prestataires can view active demandes"
ON demandes FOR SELECT
USING (status = 'active' AND verified = TRUE);
```

### Fixed Version (in `sql/init_tables_clean.sql`)
```sql
-- ✅ CORRECT - Only check status
CREATE POLICY "Prestataires can view active demandes"
ON demandes FOR SELECT
USING (status = 'active');
```

## How to Fix Your Database

### Quick Fix (2 minutes)
1. Go to Supabase SQL Editor
2. Run this query:

```sql
DROP POLICY IF EXISTS "Prestataires can view active demandes" ON demandes;

CREATE POLICY "Prestataires can view active demandes"
ON demandes FOR SELECT
USING (status = 'active');
```

### Complete Fix (5 minutes)
1. Delete all tables (optional but recommended)
2. Run the corrected script: `sql/init_tables_clean.sql`
3. Verify tables in Table Editor

See `FIX_DATABASE_ERROR.md` for detailed steps.

## Files Updated

- ✅ `sql/init_tables.sql` - Fixed the error
- ✅ `sql/init_tables_clean.sql` - New clean version
- ✅ `FIX_DATABASE_ERROR.md` - Fix instructions

## Next Steps

1. Fix the database (see above)
2. Test registration
3. Test creating demande
4. Continue development

---

**Status:** Ready to Fix  
**Time Required:** 5-10 minutes  
**Difficulty:** Easy
