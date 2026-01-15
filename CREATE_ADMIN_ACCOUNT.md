# How to Create Admin Account - KaziPro

## Quick Setup (5 minutes)

### Step 1: Create Auth User in Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `qbasvwwerkpmsbzfrydj`
3. Navigate to **Authentication > Users**
4. Click **"Add user"** button
5. Fill in the form:
   - **Email:** `admin@kazipro.com`
   - **Password:** `Admin@123456`
   - **Auto generate password:** OFF (uncheck)
6. Click **"Create user"**
7. **Copy the User ID** (you'll need it next)

### Step 2: Create Client Profile in Database

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Paste this SQL (it will automatically find the admin user):

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

**Note:** This query automatically finds the admin user by email, so you don't need to copy the user ID!

### Step 3: Verify Admin Account

Run this query to verify:

```sql
SELECT id, user_id, full_name, verified, created_at
FROM clients
WHERE full_name = 'Admin KaziPro';
```

You should see one row with your admin account.

---

## Login to Admin Dashboard

### Step 1: Go to Login Page
```
http://localhost:5173/connexion
```

### Step 2: Enter Credentials
- **Email:** `admin@kazipro.com`
- **Password:** `Admin@123456`

### Step 3: Verify OTP
- Check your email for OTP code
- Or check browser console (in development)
- Enter the 6-digit code

### Step 4: Access Admin Dashboard
- You'll be redirected to: `/dashboard/admin`
- Or navigate to: `http://localhost:5173/dashboard/admin`

---

## Admin Pages Available

Once logged in, you can access:

| Page | URL |
|------|-----|
| Dashboard | `/dashboard/admin` |
| Users | `/dashboard/admin/utilisateurs` |
| Providers | `/dashboard/admin/prestataires` |
| Requests | `/dashboard/admin/demandes` |
| Transactions | `/dashboard/admin/transactions` |
| Disputes | `/dashboard/admin/litiges` |
| Reports | `/dashboard/admin/rapports` |
| Configuration | `/dashboard/admin/configuration` |

---

## Troubleshooting

### "User not found" error
- Verify email is exactly: `admin@kazipro.com`
- Check that auth user was created in Supabase
- Check that client profile was created in database

### "OTP not received"
- Check email spam folder
- Check browser console for OTP code (dev mode)
- Wait 30 seconds and try again

### "Access denied" error
- Verify you're logged in as admin
- Check email is `admin@kazipro.com`
- Clear browser cookies and try again

### "Column 'nom' does not exist"
- The correct column name is `full_name` (not `nom`)
- Use the SQL script provided above
- Don't try to insert into non-existent columns

---

## Database Schema Reference

### clients table columns
```
- id (UUID, primary key)
- user_id (UUID, foreign key to auth.users)
- full_name (TEXT, required)
- address (TEXT, optional)
- city (TEXT, optional)
- verified (BOOLEAN, default false)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### prestataires table columns
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

1. Create auth user:
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

1. Create auth user:
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

⚠️ **Important:**
- Change default password immediately in production
- Never share admin credentials
- Use strong passwords (8+ chars, uppercase, numbers, special chars)
- Enable 2FA for admin accounts
- Rotate credentials regularly
- Keep admin email secure

---

## Support

For issues:
1. Check this guide
2. Review browser console for errors
3. Check Supabase logs
4. Contact development team

---

**Last Updated:** 22 December 2025  
**Status:** Ready for Setup

