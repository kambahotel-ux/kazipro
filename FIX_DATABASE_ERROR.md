# Fix Database Error - KaziPro

## 🔴 Error
```
ERROR: 42703: column "verified" does not exist
```

## 🔧 Solution

The SQL script had an error referencing a non-existent column. We've fixed it. Follow these steps:

### Option 1: Use the Corrected Script (Recommended)

#### Step 1: Delete Old Tables (Optional but Recommended)
If you want a clean start:

1. Go to Supabase Dashboard
2. Open **SQL Editor**
3. Create a new query
4. Paste this:

```sql
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS avis CASCADE;
DROP TABLE IF EXISTS paiements CASCADE;
DROP TABLE IF EXISTS missions CASCADE;
DROP TABLE IF EXISTS devis CASCADE;
DROP TABLE IF EXISTS demandes CASCADE;
DROP TABLE IF EXISTS prestataires CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
```

5. Click **Run**
6. Wait for completion

#### Step 2: Run the Corrected Script

1. Open file: `sql/init_tables_clean.sql`
2. Copy ALL content
3. Go to Supabase SQL Editor
4. Create new query
5. Paste the content
6. Click **Run**
7. Wait 2-3 minutes for completion

#### Step 3: Verify
1. Go to **Table Editor**
2. You should see 8 tables:
   - clients ✅
   - prestataires ✅
   - demandes ✅
   - devis ✅
   - missions ✅
   - paiements ✅
   - avis ✅
   - messages ✅

### Option 2: Fix Existing Tables

If you want to keep existing data:

1. Go to Supabase SQL Editor
2. Create new query
3. Paste this:

```sql
-- Fix the RLS policy that was causing the error
DROP POLICY IF EXISTS "Prestataires can view active demandes" ON demandes;

CREATE POLICY "Prestataires can view active demandes"
ON demandes FOR SELECT
USING (status = 'active');
```

4. Click **Run**

Then run the rest of the script from `sql/init_tables_clean.sql` (skip the table creation parts)

## ✅ What Changed

### Fixed Issues
- ❌ Removed reference to non-existent `verified` column in demandes table
- ✅ Corrected RLS policy for prestataires viewing demandes
- ✅ Used `IF NOT EXISTS` to prevent duplicate errors
- ✅ Used `IF NOT EXISTS` for triggers to prevent conflicts

### Improvements
- Better error handling
- Cleaner code structure
- Comments for each section
- Optional cleanup section

## 🚀 After Fix

1. Test registration
2. Test creating demande
3. Test login
4. Verify data in database

## 📋 Checklist

- [ ] Opened Supabase Dashboard
- [ ] Opened SQL Editor
- [ ] Deleted old tables (optional)
- [ ] Copied `sql/init_tables_clean.sql`
- [ ] Pasted into SQL editor
- [ ] Clicked Run
- [ ] Waited for completion
- [ ] Verified 8 tables in Table Editor
- [ ] Tested registration
- [ ] Tested creating demande

## 🆘 If Still Getting Errors

### Error: "Relation already exists"
- This is fine, it means the table already exists
- Just click Run again, it will skip existing tables

### Error: "Policy already exists"
- Drop the old policy first:
```sql
DROP POLICY IF EXISTS "Prestataires can view active demandes" ON demandes;
```
- Then run the script again

### Error: "Trigger already exists"
- The script uses `IF NOT EXISTS` so this shouldn't happen
- If it does, drop the trigger:
```sql
DROP TRIGGER IF EXISTS update_demandes_updated_at ON demandes;
```

### Still not working?
1. Delete all tables (Option 1, Step 1)
2. Run the clean script (Option 1, Step 2)
3. Verify tables (Option 1, Step 3)

## 📞 Need Help?

Check:
1. `TROUBLESHOOTING.md` - Common issues
2. `DATABASE_SETUP_GUIDE.md` - Detailed setup
3. Browser console (F12) - Error messages
4. Supabase logs - Database errors

---

**Status:** Fixed ✅  
**Time to Fix:** 5-10 minutes  
**Difficulty:** Easy
