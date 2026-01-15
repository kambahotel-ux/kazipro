# Troubleshoot Login Issues - KaziPro

## Problem: "Invalid login credentials"

This error means either:
1. The user doesn't exist in Supabase auth
2. The password is incorrect
3. The email format is wrong

---

## Solution: Verify & Create Admin User

### Step 1: Check if User Exists

1. Go to Supabase Dashboard
2. Navigate to **Authentication > Users**
3. Look for `admin@kazipro.com`

**If user exists:**
- Check the password is correct: `Admin@123456`
- Try logging in again
- If still fails, delete and recreate the user

**If user doesn't exist:**
- Follow Step 2 below

### Step 2: Create Admin User Correctly

1. In Supabase Dashboard, go to **Authentication > Users**
2. Click **"Add user"** button
3. Fill in the form:
   - **Email:** `admin@kazipro.com` (exactly this)
   - **Password:** `Admin@123456` (exactly this)
   - **Auto generate password:** OFF (uncheck this)
4. Click **"Create user"**
5. Wait for confirmation

### Step 3: Create Client Profile

1. Go to **SQL Editor**
2. Click **"New query"**
3. Paste this SQL:

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

4. Click **"Run"**
5. You should see: `1 row inserted`

### Step 4: Try Login Again

1. Go to: `http://localhost:5173/connexion`
2. Email: `admin@kazipro.com`
3. Password: `Admin@123456`
4. Click "Se connecter"
5. Enter OTP from email

---

## Common Issues

### Issue: "User already exists"
- Delete the existing user first
- Then create a new one with the correct password

### Issue: "OTP not received"
- Check email spam folder
- Check browser console for OTP code (dev mode)
- Wait 30 seconds and try again

### Issue: "Still getting invalid credentials"
1. Clear browser cache and cookies
2. Try in incognito/private mode
3. Verify email is exactly: `admin@kazipro.com`
4. Verify password is exactly: `Admin@123456`
5. Check for typos (spaces, caps, etc.)

### Issue: "Can't access admin dashboard"
- Verify you're logged in as admin
- Check email is `admin@kazipro.com`
- Check that client profile was created in database
- Clear cookies and try again

---

## Verify Setup

### Check Auth User Exists
```sql
SELECT id, email, created_at
FROM auth.users
WHERE email = 'admin@kazipro.com';
```

### Check Client Profile Exists
```sql
SELECT id, user_id, full_name, verified
FROM clients
WHERE full_name = 'Admin KaziPro';
```

Both queries should return 1 row each.

---

## Reset Everything (Nuclear Option)

If nothing works, delete and recreate:

1. **Delete auth user:**
   - Go to Supabase Dashboard
   - Authentication > Users
   - Find `admin@kazipro.com`
   - Click the user
   - Click "Delete user"

2. **Delete client profile:**
```sql
DELETE FROM clients WHERE full_name = 'Admin KaziPro';
```

3. **Start over from Step 2 above**

---

## Test with Different Account

Try creating a test account to verify the system works:

1. Create auth user:
   - Email: `test@example.com`
   - Password: `Test@123456`

2. Create client profile:
```sql
INSERT INTO clients (user_id, full_name, address, city, verified)
SELECT 
  id,
  'Test User',
  'Kinshasa',
  'Kinshasa',
  true
FROM auth.users
WHERE email = 'test@example.com'
AND NOT EXISTS (
  SELECT 1 FROM clients WHERE user_id = auth.users.id
);
```

3. Try logging in with `test@example.com` / `Test@123456`

If this works, the system is fine and the admin account has an issue.

---

## Contact Support

If you've tried everything and still can't login:
1. Check browser console for error messages
2. Check Supabase logs
3. Verify .env.local has correct Supabase credentials
4. Contact development team

---

**Last Updated:** 22 December 2025

