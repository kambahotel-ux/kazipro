# Final Action - Database Setup ✅

## Problem
```
ERROR: 42710: policy "Clients can view own data" already exists
```

## Solution
Use the reset script to drop everything and start fresh.

## Do This Now (2 minutes)

1. **Open Supabase**
   https://app.supabase.com → Select `qbasvwwerkpmsbzfrydj`

2. **SQL Editor**
   Click **SQL Editor** → **New Query**

3. **Copy Script**
   Open: `sql/reset_and_init.sql`
   Copy all content (Ctrl+A, Ctrl+C)

4. **Paste**
   Click in editor, paste (Ctrl+V)

5. **Run**
   Click **Run** button

6. **Wait**
   ⏳ 2-3 minutes

7. **Verify**
   Go to **Table Editor** → See 8 tables ✅

## Done! ✅

Your database is now ready.

---

## Quick Test

1. Register: http://localhost:5173/inscription/client
2. Verify OTP from email
3. Login
4. Create demande
5. See it in database

---

**Time:** 5 minutes  
**Difficulty:** Easy  
**Status:** Ready
