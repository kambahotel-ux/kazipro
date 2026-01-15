# Quick Fix - Database Error

## 🚨 Problem
```
ERROR: 42703: column "verified" does not exist
```

## ⚡ 2-Minute Fix

### Step 1: Open Supabase
https://app.supabase.com → Select project `qbasvwwerkpmsbzfrydj`

### Step 2: SQL Editor
Click **SQL Editor** → **New Query**

### Step 3: Copy & Paste
```sql
DROP POLICY IF EXISTS "Prestataires can view active demandes" ON demandes;

CREATE POLICY "Prestataires can view active demandes"
ON demandes FOR SELECT
USING (status = 'active');
```

### Step 4: Run
Click **Run** button

### Step 5: Done ✅
The error is fixed!

---

## 🔄 Complete Fix (5 minutes)

If the quick fix doesn't work:

### Step 1: Delete Tables
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

### Step 2: Run Clean Script
1. Open `sql/init_tables_clean.sql`
2. Copy ALL content
3. Paste into SQL Editor
4. Click **Run**
5. Wait 2-3 minutes

### Step 3: Verify
Go to **Table Editor** → Should see 8 tables ✅

---

## ✅ Test It

1. Register: http://localhost:5173/inscription/client
2. Verify OTP from email
3. Login
4. Create demande
5. Check database

---

**Time:** 2-5 minutes  
**Difficulty:** Easy  
**Status:** Ready to fix
