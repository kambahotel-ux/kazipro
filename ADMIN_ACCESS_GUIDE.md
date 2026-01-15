# Admin Access Guide - KaziPro

## Quick Start

### Admin Login Credentials

```
Email:    admin@kazipro.com
Password: Admin@123456
```

---

## Step-by-Step Access

### 1. Go to Login Page
```
URL: http://localhost:5173/connexion
```

### 2. Enter Admin Credentials
- **Email:** admin@kazipro.com
- **Password:** Admin@123456

### 3. Verify OTP
- Check your email for OTP code
- Or check browser console (in development)
- Enter the 6-digit code

### 4. Access Admin Dashboard
- You'll be automatically redirected to: `/dashboard/admin`
- If not, navigate to: `http://localhost:5173/dashboard/admin`

---

## Admin Pages

Once logged in, you can access:

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/dashboard/admin` | Overview & quick actions |
| Users | `/dashboard/admin/utilisateurs` | Manage all users |
| Providers | `/dashboard/admin/prestataires` | Verify providers |
| Requests | `/dashboard/admin/demandes` | Moderate requests |
| Transactions | `/dashboard/admin/transactions` | Track payments |
| Disputes | `/dashboard/admin/litiges` | Resolve disputes |
| Reports | `/dashboard/admin/rapports` | View analytics |
| Configuration | `/dashboard/admin/configuration` | Platform settings |

---

## Features Available

### Users Management
- View all users (clients & providers)
- Filter by type and status
- Search by name or email
- Suspend or delete users
- View user details

### Provider Verification
- View pending providers
- Approve/reject verification
- View provider details
- Check ratings and missions

### Request Moderation
- View all service requests
- Filter by status
- Approve/reject requests
- View request details

### Transaction Tracking
- View all transactions
- Filter by type and status
- View transaction details
- Track revenue

### Dispute Resolution
- View open disputes
- Resolve disputes
- Refund clients or pay providers
- Track dispute history

### Analytics & Reports
- View key metrics
- User statistics
- Revenue reports
- Dispute reports
- Export reports (PDF/CSV)

### Platform Configuration
- General settings
- Commission settings
- Verification requirements
- Notification settings
- Security settings
- Feature management

---

## Security Features

✅ **Admin-Only Access**
- Only users with admin email can access
- Automatic redirect if not admin
- Session-based authentication

✅ **Protected Routes**
- All admin pages require authentication
- Admin role verification
- Automatic logout on session expiry

✅ **Audit Trail**
- All admin actions logged
- User activity tracked
- Changes recorded

---

## Troubleshooting

### Can't Login?
1. Verify email: `admin@kazipro.com`
2. Verify password: `Admin@123456`
3. Check caps lock
4. Clear browser cache
5. Try incognito mode

### OTP Not Received?
1. Check email spam folder
2. Check browser console (dev mode)
3. Wait 30 seconds and try again
4. Check Supabase email settings

### Can't Access Admin Pages?
1. Verify you're logged in as admin
2. Check email is `admin@kazipro.com`
3. Clear cookies and try again
4. Check browser console for errors

### Forgot Password?
1. Click "Forgot Password" on login
2. Enter admin email
3. Check email for reset link
4. Or reset via Supabase Dashboard

---

## Test Accounts

### Client Test Account
```
Email:    client@test.com
Password: Client@123456
```

### Provider Test Account
```
Email:    provider@test.com
Password: Provider@123456
```

---

## Creating Additional Admin Accounts

### Via Supabase Dashboard

1. Go to Supabase Dashboard
2. Navigate to Authentication > Users
3. Click "Add user"
4. Enter email and password
5. Create user
6. Update email in `AdminRoute.tsx` to allow access

### Via SQL

```sql
-- Add new admin email to allowed list
-- Edit src/components/AdminRoute.tsx
-- Add email to adminEmails array
```

---

## Best Practices

✅ **Do:**
- Change default password immediately
- Use strong passwords (8+ chars, uppercase, numbers, special chars)
- Enable 2FA for admin accounts
- Rotate credentials regularly
- Log out when done
- Keep admin email secure

❌ **Don't:**
- Share admin credentials
- Use weak passwords
- Leave admin session open
- Use admin account for testing
- Disable security features

---

## Support

For issues or questions:
1. Check this guide
2. Review browser console for errors
3. Check Supabase logs
4. Contact development team

---

**Last Updated:** 22 December 2025  
**Status:** Ready for Use  
**Version:** 1.0

