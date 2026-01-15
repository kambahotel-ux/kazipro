# Admin Credentials - KaziPro

## Admin Account Setup

### Default Admin Credentials

**Email:** admin@kazipro.com  
**Password:** Admin@123456  
**Role:** Administrator

---

## How to Create Admin Account

### Option 1: Via Supabase Dashboard

1. Go to Supabase Dashboard
2. Navigate to Authentication > Users
3. Click "Add user"
4. Enter email: `admin@kazipro.com`
5. Enter password: `Admin@123456`
6. Create user

### Option 2: Via Supabase SQL Editor

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Run this SQL:

```sql
-- First, create the auth user
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  'admin@kazipro.com',
  crypt('Admin@123456', gen_salt('bf')),
  NOW(),
  '{"role": "admin"}'::jsonb
);

-- Then create the client profile
INSERT INTO clients (user_id, full_name, address, city, verified)
SELECT id, 'Admin KaziPro', 'Kinshasa', 'Kinshasa', true
FROM auth.users
WHERE email = 'admin@kazipro.com';
```

**Note:** The password must be hashed. It's easier to use the Supabase Dashboard UI.

---

## Access Admin Dashboard

### Steps:

1. Go to login page: `http://localhost:5173/connexion`
2. Enter credentials:
   - **Email:** admin@kazipro.com
   - **Password:** Admin@123456
3. Verify OTP (check email or console)
4. You'll be redirected to admin dashboard: `/dashboard/admin`

---

## Admin Pages Available

Once logged in as admin, access these pages:

- **Dashboard:** `/dashboard/admin`
- **Users:** `/dashboard/admin/utilisateurs`
- **Providers:** `/dashboard/admin/prestataires`
- **Requests:** `/dashboard/admin/demandes`
- **Transactions:** `/dashboard/admin/transactions`
- **Disputes:** `/dashboard/admin/litiges`
- **Reports:** `/dashboard/admin/rapports`
- **Configuration:** `/dashboard/admin/configuration`

---

## Security Notes

⚠️ **Important:**
- Change default password immediately in production
- Use strong passwords (min 8 chars, uppercase, numbers, special chars)
- Enable 2FA for admin accounts
- Never share admin credentials
- Rotate credentials regularly

---

## Troubleshooting

### Can't access admin pages?
- Verify you're logged in as admin
- Check that your email is `admin@kazipro.com`
- Clear browser cache and cookies
- Try incognito/private mode

### OTP not received?
- Check email spam folder
- Check browser console for OTP code
- Verify Supabase email settings

### Forgot password?
- Use "Forgot Password" on login page
- Or reset via Supabase Dashboard

---

## Test Accounts

### Client Account
- **Email:** client@test.com
- **Password:** Client@123456

### Provider Account
- **Email:** provider@test.com
- **Password:** Provider@123456

---

**Last Updated:** 22 December 2025  
**Status:** Ready for Testing

