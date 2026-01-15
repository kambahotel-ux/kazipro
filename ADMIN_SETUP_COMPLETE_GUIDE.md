# Complete Admin Setup Guide - KaziPro

## Problem: "Invalid login credentials" Error

This error occurs when:
- The admin user doesn't exist in Supabase Authentication
- The password is incorrect
- The email format is wrong

---

## Solution: Complete Setup Process

### Phase 1: Create Admin User in Supabase (5 minutes)

#### Step 1.1: Go to Supabase Dashboard
1. Open: https://supabase.com/dashboard
2. Select your project: `qbasvwwerkpmsbzfrydj`
3. Navigate to **Authentication > Users**

#### Step 1.2: Create the Admin User
1. Click the **"Add user"** button (top right)
2. A form will appear with these fields:
   - **Email:** `admin@kazipro.com` (EXACTLY this)
   - **Password:** `Admin@123456` (EXACTLY this)
   - **Auto generate password:** OFF (UNCHECK this box)
3. Click **"Create user"**
4. Wait for confirmation message
5. You should see the new user in the list

**Important:** Make sure:
- Email is exactly: `admin@kazipro.com` (no spaces, correct case)
- Password is exactly: `Admin@123456` (no spaces, correct case)
- Auto generate password is OFF

---

### Phase 2: Create Client Profile in Database (3 minutes)

#### Step 2.1: Open SQL Editor
1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New query"** button

#### Step 2.2: Run the SQL Script
Copy and paste this SQL:

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

#### Step 2.3: Execute the Query
1. Click **"Run"** button
2. You should see: `1 row inserted`
3. If you see `0 rows inserted`, it means:
   - The admin user wasn't created in Step 1
   - Or the client profile already exists
   - Go back to Step 1 and verify the user was created

---

### Phase 3: Verify Setup (2 minutes)

#### Step 3.1: Verify Auth User Exists
Run this query in SQL Editor:

```sql
SELECT id, email, created_at
FROM auth.users
WHERE email = 'admin@kazipro.com';
```

**Expected result:** 1 row with the admin user

#### Step 3.2: Verify Client Profile Exists
Run this query in SQL Editor:

```sql
SELECT id, user_id, full_name, verified, created_at
FROM clients
WHERE full_name = 'Admin KaziPro';
```

**Expected result:** 1 row with the admin profile

If both queries return 1 row each, your setup is complete!

---

### Phase 4: Login to Admin Dashboard (2 minutes)

#### Step 4.1: Go to Login Page
Open: `http://localhost:5173/connexion`

#### Step 4.2: Enter Admin Credentials
- **Email:** `admin@kazipro.com`
- **Password:** `Admin@123456`
- Click **"Se connecter"**

#### Step 4.3: Verify OTP
1. Check your email for OTP code
2. Or check browser console (F12) for OTP code in development
3. Enter the 6-digit code
4. Click **"Vérifier"**

#### Step 4.4: Access Admin Dashboard
You should be redirected to: `/dashboard/admin`

If not, navigate to: `http://localhost:5173/dashboard/admin`

---

## Admin Dashboard Pages

Once logged in as admin, you can access:

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/dashboard/admin` | Overview with metrics |
| Users | `/dashboard/admin/utilisateurs` | Manage clients & providers |
| Providers | `/dashboard/admin/prestataires` | Verify providers |
| Requests | `/dashboard/admin/demandes` | Moderate requests |
| Transactions | `/dashboard/admin/transactions` | Track payments |
| Disputes | `/dashboard/admin/litiges` | Resolve disputes |
| Reports | `/dashboard/admin/rapports` | View analytics |
| Configuration | `/dashboard/admin/configuration` | Platform settings |

---

## Troubleshooting

### Issue 1: "Invalid login credentials"

**Cause:** Admin user not created or password incorrect

**Solution:**
1. Go to Supabase Dashboard > Authentication > Users
2. Look for `admin@kazipro.com`
3. If not found:
   - Follow Phase 1 again
   - Make sure email is exactly: `admin@kazipro.com`
   - Make sure password is exactly: `Admin@123456`
4. If found but login fails:
   - Delete the user
   - Create a new one with correct credentials
   - Follow Phase 2 to create client profile

### Issue 2: "0 rows inserted" in Phase 2

**Cause:** Admin user not created in Supabase auth

**Solution:**
1. Go back to Phase 1
2. Verify the user was created in Supabase Dashboard
3. Check the email is exactly: `admin@kazipro.com`
4. Try Phase 2 again

### Issue 3: "OTP not received"

**Cause:** Email not configured or OTP not sent

**Solution:**
1. Check email spam folder
2. In development, check browser console (F12) for OTP code
3. Wait 30 seconds and try again
4. Try resending OTP

### Issue 4: "Access denied" after login

**Cause:** Not logged in as admin or client profile not created

**Solution:**
1. Verify you're logged in as `admin@kazipro.com`
2. Run Phase 3 verification queries
3. Make sure client profile exists
4. Clear browser cookies and try again

### Issue 5: "Column 'nom' does not exist"

**Cause:** Using wrong column name in SQL

**Solution:**
- Use `full_name` (not `nom`)
- Use the SQL script provided in Phase 2
- Don't modify the column names

---

## Database Schema Reference

### clients table
```
- id (UUID, primary key)
- user_id (UUID, foreign key to auth.users)
- full_name (TEXT, required) ← Use this, not 'nom'
- address (TEXT, optional)
- city (TEXT, optional)
- verified (BOOLEAN, default false)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### prestataires table
```
- id (UUID, primary key)
- user_id (UUID, foreign key to auth.users)
- full_name (TEXT, required)
- profession (TEXT, required)
- bio (TEXT, optional)
- rating (NUMERIC, default 0)
- verified (BOOLEAN, default false)
- documents_verified (BOOLEAN, default false)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

---

## Create Test Accounts (Optional)

### Test Client Account

1. Create auth user in Supabase Dashboard:
   - Email: `client@test.com`
   - Password: `Client@123456`

2. Create client profile:
```sql
INSERT INTO clients (user_id, full_name, address, city, verified)
SELECT 
  id,
  'Test Client',
  'Kinshasa',
  'Kinshasa',
  true
FROM auth.users
WHERE email = 'client@test.com'
AND NOT EXISTS (
  SELECT 1 FROM clients WHERE user_id = auth.users.id
);
```

### Test Provider Account

1. Create auth user in Supabase Dashboard:
   - Email: `provider@test.com`
   - Password: `Provider@123456`

2. Create provider profile:
```sql
INSERT INTO prestataires (user_id, full_name, profession, verified)
SELECT 
  id,
  'Test Provider',
  'Electrician',
  true
FROM auth.users
WHERE email = 'provider@test.com'
AND NOT EXISTS (
  SELECT 1 FROM prestataires WHERE user_id = auth.users.id
);
```

---

## Security Notes

⚠️ **Important for Production:**
- Change default password immediately
- Never share admin credentials
- Use strong passwords (8+ chars, uppercase, numbers, special chars)
- Enable 2FA for admin accounts
- Rotate credentials regularly
- Keep admin email secure
- Restrict admin access to trusted users only

---

## Quick Reference

| Step | Action | Time |
|------|--------|------|
| 1 | Create admin user in Supabase | 5 min |
| 2 | Create client profile in database | 3 min |
| 3 | Verify setup with SQL queries | 2 min |
| 4 | Login and access admin dashboard | 2 min |
| **Total** | **Complete setup** | **~12 min** |

---

## Environment Configuration

Your `.env.local` is already configured:
```
VITE_SUPABASE_URL=https://qbasvwwerkpmsbzfrydj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

No changes needed here.

---

## Admin Access Control

The admin access is controlled by:
1. **Email check:** Only `admin@kazipro.com` can access admin pages
2. **AdminRoute component:** Protects all admin routes
3. **Automatic redirect:** Non-admin users redirected to client dashboard

To change the admin email, edit: `src/components/AdminRoute.tsx`

---

## Support

If you're still having issues:
1. Follow this guide step-by-step
2. Check browser console (F12) for error messages
3. Check Supabase logs in Dashboard
4. Verify `.env.local` has correct credentials
5. Try in incognito/private mode
6. Clear browser cache and cookies

---

**Last Updated:** 22 December 2025  
**Status:** Ready for Setup  
**Estimated Time:** 12 minutes
