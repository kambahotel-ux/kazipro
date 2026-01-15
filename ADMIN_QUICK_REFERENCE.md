# Admin Quick Reference - KaziPro

## Admin Credentials

| Field | Value |
|-------|-------|
| **Email** | `admin@kazipro.com` |
| **Password** | `Admin@123456` |
| **Role** | Administrator |
| **Access Level** | Full Platform Access |

---

## Login Process

1. Go to: `http://localhost:5173/connexion`
2. Email: `admin@kazipro.com`
3. Password: `Admin@123456`
4. Click: **"Se connecter"**
5. Enter OTP from email
6. Access admin dashboard

---

## Admin Dashboard URLs

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/dashboard/admin` | Overview & metrics |
| Users | `/dashboard/admin/utilisateurs` | Manage clients & providers |
| Providers | `/dashboard/admin/prestataires` | Verify & manage providers |
| Requests | `/dashboard/admin/demandes` | Moderate service requests |
| Transactions | `/dashboard/admin/transactions` | Track payments |
| Disputes | `/dashboard/admin/litiges` | Resolve disputes |
| Reports | `/dashboard/admin/rapports` | View analytics |
| Configuration | `/dashboard/admin/configuration` | Platform settings |

---

## Database Setup

### Create Admin User (Supabase Dashboard)
1. Go to: **Authentication > Users**
2. Click: **"Add user"**
3. Email: `admin@kazipro.com`
4. Password: `Admin@123456`
5. Uncheck: **"Auto generate password"**
6. Click: **"Create user"**

### Create Client Profile (SQL Editor)
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

---

## Verification Queries

### Check Auth User
```sql
SELECT id, email, created_at
FROM auth.users
WHERE email = 'admin@kazipro.com';
```

### Check Client Profile
```sql
SELECT id, user_id, full_name, verified, created_at
FROM clients
WHERE full_name = 'Admin KaziPro';
```

### Check Both
```sql
SELECT 
  (SELECT COUNT(*) FROM auth.users WHERE email = 'admin@kazipro.com') as auth_user,
  (SELECT COUNT(*) FROM clients WHERE full_name = 'Admin KaziPro') as client_profile;
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Invalid login credentials" | Create admin user in Supabase Dashboard |
| "0 rows inserted" | Admin user not created in auth |
| "OTP not received" | Check email spam or browser console |
| "Access denied" | Verify logged in as admin@kazipro.com |
| "Column 'nom' does not exist" | Use `full_name` column instead |

---

## Admin Access Control

- **Protected by:** `AdminRoute` component
- **Check:** Email must be `admin@kazipro.com`
- **Redirect:** Non-admin users → `/dashboard/client`
- **Location:** `src/components/AdminRoute.tsx`

---

## Environment Variables

```
VITE_SUPABASE_URL=https://qbasvwwerkpmsbzfrydj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `clients` | Client profiles |
| `prestataires` | Provider profiles |
| `demandes` | Service requests |
| `devis` | Quotes |
| `missions` | Missions/Jobs |
| `paiements` | Payments |
| `avis` | Reviews |
| `messages` | Messages |

---

## Key Files

| File | Purpose |
|------|---------|
| `src/components/AdminRoute.tsx` | Admin access control |
| `src/pages/dashboard/admin/AdminDashboard.tsx` | Main dashboard |
| `src/App.tsx` | Route configuration |
| `.env.local` | Supabase credentials |

---

## Test Accounts (Optional)

### Client Test Account
- Email: `client@test.com`
- Password: `Client@123456`

### Provider Test Account
- Email: `provider@test.com`
- Password: `Provider@123456`

---

## Security Notes

⚠️ **Important:**
- Change password in production
- Never share credentials
- Use strong passwords
- Enable 2FA for admin
- Rotate credentials regularly
- Keep email secure

---

## Support Resources

- **Setup Guide:** `ADMIN_SETUP_COMPLETE_GUIDE.md`
- **Checklist:** `ADMIN_SETUP_CHECKLIST.md`
- **Troubleshooting:** `TROUBLESHOOT_LOGIN.md`
- **Verification:** `VERIFY_SUPABASE_SETUP.md`

---

**Last Updated:** 22 December 2025  
**Status:** Ready for Use
