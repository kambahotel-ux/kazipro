# Verify Supabase Setup - KaziPro

## Checklist

### 1. Supabase Project Created ✓
- [ ] Project ID: `qbasvwwerkpmsbzfrydj`
- [ ] Go to: https://supabase.com/dashboard
- [ ] Select your project
- [ ] You should see the dashboard

### 2. Environment Variables Set ✓
- [ ] Check `.env.local` file
- [ ] Should have:
  ```
  VITE_SUPABASE_URL=https://qbasvwwerkpmsbzfrydj.supabase.co
  VITE_SUPABASE_ANON_KEY=your_anon_key_here
  ```
- [ ] Both values should be filled in (not empty)

### 3. Database Tables Created ✓
- [ ] Go to Supabase Dashboard
- [ ] Click **Database > Tables**
- [ ] You should see these tables:
  - [ ] `clients`
  - [ ] `prestataires`
  - [ ] `demandes`
  - [ ] `devis`
  - [ ] `missions`
  - [ ] `paiements`
  - [ ] `avis`
  - [ ] `messages`

### 4. Authentication Enabled ✓
- [ ] Go to **Authentication > Providers**
- [ ] Email/Password should be enabled
- [ ] Go to **Authentication > Users**
- [ ] You should be able to add users

### 5. RLS Policies Enabled ✓
- [ ] Go to **Database > Tables**
- [ ] Click on `clients` table
- [ ] Click **RLS** button
- [ ] Should show "RLS is enabled"

---

## Test Connection

### Test 1: Check Supabase Connection

1. Open browser console (F12)
2. Go to: `http://localhost:5173`
3. Check console for errors
4. Should NOT see any Supabase connection errors

### Test 2: Try Registration

1. Go to: `http://localhost:5173/inscription/client`
2. Fill in form:
   - Email: `test@example.com`
   - Password: `Test@123456`
3. Click "S'inscrire"
4. Should receive OTP email or see OTP in console

### Test 3: Try Login

1. Go to: `http://localhost:5173/connexion`
2. Fill in form:
   - Email: `test@example.com`
   - Password: `Test@123456`
3. Click "Se connecter"
4. Should receive OTP email or see OTP in console
5. Enter OTP
6. Should be redirected to dashboard

---

## Verify Database

### Check Tables Exist

Go to **SQL Editor** and run:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Should return 8 tables.

### Check Auth Users

```sql
SELECT id, email, created_at
FROM auth.users
LIMIT 10;
```

Should show any users you've created.

### Check Clients

```sql
SELECT id, user_id, full_name, verified
FROM clients
LIMIT 10;
```

Should show any client profiles.

---

## Verify Environment Variables

### Check .env.local

1. Open `.env.local` file
2. Should have:
   ```
   VITE_SUPABASE_URL=https://qbasvwwerkpmsbzfrydj.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. Both should be filled in (not empty)
4. No quotes around values

### Get Correct Values

1. Go to Supabase Dashboard
2. Click **Settings > API**
3. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`

---

## Verify RLS Policies

### Check RLS is Enabled

1. Go to **Database > Tables**
2. Click on `clients` table
3. Click **RLS** button
4. Should show "RLS is enabled"

### Check Policies Exist

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('clients', 'prestataires', 'demandes', 'devis', 'missions', 'paiements', 'avis', 'messages')
ORDER BY tablename, policyname;
```

Should return multiple policies.

---

## Troubleshoot Connection Issues

### Issue: "Cannot connect to Supabase"

1. Check `.env.local` has correct values
2. Check internet connection
3. Check Supabase project is active
4. Try restarting dev server: `npm run dev`

### Issue: "Invalid API key"

1. Go to Supabase Dashboard
2. Click **Settings > API**
3. Copy the correct `anon public` key
4. Update `.env.local`
5. Restart dev server

### Issue: "Database connection failed"

1. Check Supabase project is active
2. Check database is running
3. Try running SQL query in SQL Editor
4. If SQL Editor works, database is fine

### Issue: "RLS policy error"

1. Check RLS is enabled on tables
2. Check policies exist
3. Try disabling RLS temporarily to test
4. Check policy conditions

---

## Quick Verification Script

Run this in SQL Editor to verify everything:

```sql
-- Check tables exist
SELECT COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check auth users
SELECT COUNT(*) as user_count FROM auth.users;

-- Check clients
SELECT COUNT(*) as client_count FROM clients;

-- Check RLS policies
SELECT COUNT(*) as policy_count FROM pg_policies;

-- Check specific table
SELECT * FROM clients LIMIT 1;
```

All queries should return results without errors.

---

## Still Having Issues?

1. **Check browser console** for error messages
2. **Check Supabase logs** in Dashboard
3. **Verify .env.local** has correct values
4. **Restart dev server** with `npm run dev`
5. **Clear browser cache** and try again
6. **Try incognito mode** to rule out cache issues

---

**Last Updated:** 22 December 2025

