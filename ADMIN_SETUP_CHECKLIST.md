# Admin Setup Checklist - KaziPro

## Pre-Setup Verification

- [ ] Supabase project created: `qbasvwwerkpmsbzfrydj`
- [ ] `.env.local` file has Supabase credentials
- [ ] Development server running: `npm run dev`
- [ ] Browser can access: `http://localhost:5173`

---

## Phase 1: Create Admin User in Supabase

### Step 1: Access Supabase Dashboard
- [ ] Go to: https://supabase.com/dashboard
- [ ] Select project: `qbasvwwerkpmsbzfrydj`
- [ ] Navigate to: **Authentication > Users**

### Step 2: Create Admin User
- [ ] Click **"Add user"** button
- [ ] Enter Email: `admin@kazipro.com`
- [ ] Enter Password: `Admin@123456`
- [ ] Uncheck: **"Auto generate password"**
- [ ] Click **"Create user"**
- [ ] Confirm: User appears in the list

**Verification:**
- [ ] User email shows: `admin@kazipro.com`
- [ ] User status shows: Active or Confirmed
- [ ] User created_at timestamp is recent

---

## Phase 2: Create Client Profile in Database

### Step 1: Open SQL Editor
- [ ] In Supabase Dashboard, go to: **SQL Editor**
- [ ] Click **"New query"** button

### Step 2: Run SQL Script
- [ ] Copy the SQL script below
- [ ] Paste into SQL Editor
- [ ] Click **"Run"** button

```sql
INSERT INTO clients (user_id, full_name, address, city, verified)
SELECT 
  id,
  'Admin KaziPro',
  'Kinshasa',
  'Kinshasa',
  true
FROM auth.users
WHERE email = 'admin@kazipro.com'
AND NOT EXISTS (
  SELECT 1 FROM clients WHERE user_id = auth.users.id
);
```

**Verification:**
- [ ] Result shows: `1 row inserted`
- [ ] No error messages
- [ ] Query completed successfully

---

## Phase 3: Verify Setup

### Step 1: Verify Auth User
- [ ] Run this query in SQL Editor:

```sql
SELECT id, email, created_at
FROM auth.users
WHERE email = 'admin@kazipro.com';
```

**Verification:**
- [ ] Query returns: 1 row
- [ ] Email shows: `admin@kazipro.com`
- [ ] created_at shows: Recent timestamp

### Step 2: Verify Client Profile
- [ ] Run this query in SQL Editor:

```sql
SELECT id, user_id, full_name, verified, created_at
FROM clients
WHERE full_name = 'Admin KaziPro';
```

**Verification:**
- [ ] Query returns: 1 row
- [ ] full_name shows: `Admin KaziPro`
- [ ] verified shows: `true`
- [ ] created_at shows: Recent timestamp

---

## Phase 4: Login to Admin Dashboard

### Step 1: Go to Login Page
- [ ] Open: `http://localhost:5173/connexion`
- [ ] Page loads without errors

### Step 2: Enter Credentials
- [ ] Email field: `admin@kazipro.com`
- [ ] Password field: `Admin@123456`
- [ ] Click **"Se connecter"** button

**Verification:**
- [ ] No error message
- [ ] Page shows: "Connexion en cours..."
- [ ] Redirected to OTP verification page

### Step 3: Verify OTP
- [ ] Check email for OTP code
- [ ] Or check browser console (F12) for OTP code
- [ ] Enter 6-digit code in form
- [ ] Click **"Vérifier"** button

**Verification:**
- [ ] OTP accepted
- [ ] Redirected to dashboard
- [ ] No error messages

### Step 4: Access Admin Dashboard
- [ ] Redirected to: `/dashboard/admin`
- [ ] Page loads successfully
- [ ] Can see admin dashboard content

**Verification:**
- [ ] Dashboard displays metrics
- [ ] Navigation menu shows admin pages
- [ ] No "Access denied" errors

---

## Phase 5: Test Admin Pages

### Dashboard Pages
- [ ] **Dashboard** (`/dashboard/admin`) - Loads without errors
- [ ] **Users** (`/dashboard/admin/utilisateurs`) - Can view users
- [ ] **Providers** (`/dashboard/admin/prestataires`) - Can view providers
- [ ] **Requests** (`/dashboard/admin/demandes`) - Can view requests
- [ ] **Transactions** (`/dashboard/admin/transactions`) - Can view transactions
- [ ] **Disputes** (`/dashboard/admin/litiges`) - Can view disputes
- [ ] **Reports** (`/dashboard/admin/rapports`) - Can view reports
- [ ] **Configuration** (`/dashboard/admin/configuration`) - Can view config

---

## Troubleshooting Checklist

### If "Invalid login credentials" error:
- [ ] Verify admin user exists in Supabase Dashboard
- [ ] Check email is exactly: `admin@kazipro.com`
- [ ] Check password is exactly: `Admin@123456`
- [ ] Try deleting and recreating the user
- [ ] Clear browser cache and cookies
- [ ] Try in incognito/private mode

### If "0 rows inserted" in Phase 2:
- [ ] Go back to Phase 1
- [ ] Verify admin user was created
- [ ] Check email is exactly: `admin@kazipro.com`
- [ ] Run Phase 2 SQL again

### If "OTP not received":
- [ ] Check email spam folder
- [ ] Check browser console (F12) for OTP code
- [ ] Wait 30 seconds and try again
- [ ] Click "Renvoyer le code" button

### If "Access denied" after login:
- [ ] Verify logged in as: `admin@kazipro.com`
- [ ] Run Phase 3 verification queries
- [ ] Check client profile exists
- [ ] Clear browser cookies
- [ ] Try logging out and back in

### If "Column 'nom' does not exist":
- [ ] Use correct column name: `full_name`
- [ ] Copy SQL script from Phase 2
- [ ] Don't modify column names

---

## Quick Status Check

Run these queries to verify everything is set up:

```sql
-- Check auth user exists
SELECT COUNT(*) as auth_users FROM auth.users WHERE email = 'admin@kazipro.com';

-- Check client profile exists
SELECT COUNT(*) as client_profiles FROM clients WHERE full_name = 'Admin KaziPro';

-- Check both exist
SELECT 
  (SELECT COUNT(*) FROM auth.users WHERE email = 'admin@kazipro.com') as auth_user_exists,
  (SELECT COUNT(*) FROM clients WHERE full_name = 'Admin KaziPro') as client_profile_exists;
```

**Expected result:** Both counts should be 1

---

## Setup Complete!

When all checkboxes are checked:
- ✅ Admin user created in Supabase
- ✅ Client profile created in database
- ✅ Setup verified with SQL queries
- ✅ Successfully logged in as admin
- ✅ Admin dashboard accessible
- ✅ All admin pages working

---

## Next Steps

After successful setup:
1. Create test accounts (optional)
2. Explore admin dashboard
3. Test admin features
4. Configure platform settings
5. Set up payment processing
6. Configure email notifications

---

## Support

If you get stuck:
1. Check this checklist
2. Review ADMIN_SETUP_COMPLETE_GUIDE.md
3. Check browser console (F12) for errors
4. Check Supabase logs
5. Verify `.env.local` credentials

---

**Last Updated:** 22 December 2025  
**Estimated Time:** 12 minutes  
**Difficulty:** Easy
