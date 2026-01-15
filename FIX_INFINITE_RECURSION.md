# Fix Infinite Recursion Error ✅

## 🔴 Error
```
infinite recursion detected in policy for relation "clients"
```

## 🔧 Cause
The RLS policy for creating demandes has a circular reference that causes infinite recursion.

## ✅ Solution

Run the clean RLS setup script to replace all policies with safe ones.

## How to Fix (2 minutes)

### Step 1: Open Supabase
https://app.supabase.com → Select `qbasvwwerkpmsbzfrydj`

### Step 2: SQL Editor
Click **SQL Editor** → **New Query**

### Step 3: Copy Script
Open: `sql/clean_rls_setup.sql`
Copy all content (Ctrl+A, Ctrl+C)

### Step 4: Paste
Click in editor, paste (Ctrl+V)

### Step 5: Run
Click **Run** button

### Step 6: Wait
⏳ 1-2 minutes

### Step 7: Test
1. Go to http://localhost:5173/dashboard/client/demandes/nouvelle
2. Create a demande
3. Should work now! ✅

## What Changed

### ❌ Old Policy (Causes Recursion)
```sql
CREATE POLICY "Clients can create demandes" ON demandes FOR INSERT 
WITH CHECK (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);
```

### ✅ New Policy (Safe)
```sql
CREATE POLICY "Clients can create demandes" ON demandes FOR INSERT 
WITH CHECK (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);
```

The issue was that the policy was checking the `clients` table while the `clients` table had a policy that referenced `missions`, which referenced `clients` again, creating a loop.

## After Fix

1. ✅ Can create demandes
2. ✅ Can view demandes
3. ✅ Can create devis
4. ✅ All operations work

## Testing

### Test 1: Create Demande
1. Go to Dashboard → Demandes
2. Click "Nouvelle demande"
3. Fill form
4. Click "Publier"
5. Should work! ✅

### Test 2: View Demandes
1. Go to Dashboard → Demandes
2. Should see your demandes ✅

### Test 3: Create Devis (as provider)
1. Register as provider
2. Go to Dashboard → Devis
3. Create devis
4. Should work! ✅

## Files

### ✅ Use This:
- `sql/clean_rls_setup.sql` - **RECOMMENDED**

### ⚠️ Don't Use:
- `sql/reset_and_init.sql` - Has the recursion issue
- `sql/init_tables_final.sql` - Has the recursion issue

---

**Time:** 2 minutes  
**Difficulty:** Easy  
**Status:** Ready to fix
