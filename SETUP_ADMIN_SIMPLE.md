# Setup Admin Account - Simple Steps

## 3 Easy Steps (5 minutes)

### Step 1: Create Auth User
1. Go to Supabase Dashboard
2. Click **Authentication > Users**
3. Click **"Add user"**
4. Enter:
   - Email: `admin@kazipro.com`
   - Password: `Admin@123456`
5. Click **"Create user"**

### Step 2: Create Client Profile
1. Go to **SQL Editor**
2. Click **"New query"**
3. Copy and paste:

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

### Step 3: Login
1. Go to: `http://localhost:5173/connexion`
2. Email: `admin@kazipro.com`
3. Password: `Admin@123456`
4. Enter OTP from email
5. Done! ✅

---

## Admin Dashboard
- URL: `http://localhost:5173/dashboard/admin`
- Users: `/dashboard/admin/utilisateurs`
- Providers: `/dashboard/admin/prestataires`
- Requests: `/dashboard/admin/demandes`
- Transactions: `/dashboard/admin/transactions`
- Disputes: `/dashboard/admin/litiges`
- Reports: `/dashboard/admin/rapports`
- Config: `/dashboard/admin/configuration`

---

## Test Accounts (Optional)

### Client Test
```sql
INSERT INTO clients (user_id, full_name, address, city, verified)
SELECT id, 'Test Client', 'Kinshasa', 'Kinshasa', true
FROM auth.users WHERE email = 'client@test.com'
AND NOT EXISTS (SELECT 1 FROM clients WHERE user_id = auth.users.id);
```

### Provider Test
```sql
INSERT INTO prestataires (user_id, full_name, profession, verified)
SELECT id, 'Test Provider', 'Electrician', true
FROM auth.users WHERE email = 'provider@test.com'
AND NOT EXISTS (SELECT 1 FROM prestataires WHERE user_id = auth.users.id);
```

---

**That's it! You're ready to go.** 🚀

