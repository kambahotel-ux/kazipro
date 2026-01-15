# Fix Now - Infinite Recursion (2 minutes)

## Problem
```
infinite recursion detected in policy for relation "clients"
```

## Solution
Run the clean RLS setup script.

## Do This Now

### Step 1: Supabase
https://app.supabase.com → `qbasvwwerkpmsbzfrydj`

### Step 2: SQL Editor
**SQL Editor** → **New Query**

### Step 3: Copy
Open: `sql/clean_rls_setup.sql`
Copy all (Ctrl+A, Ctrl+C)

### Step 4: Paste
Click in editor, paste (Ctrl+V)

### Step 5: Run
Click **Run**

### Step 6: Wait
⏳ 1-2 minutes

### Step 7: Test
1. Go to http://localhost:5173/dashboard/client/demandes/nouvelle
2. Create demande
3. Should work! ✅

---

## Done! ✅

Your database is now fixed.

---

**Time:** 2 minutes  
**Difficulty:** Easy  
**Status:** Ready
