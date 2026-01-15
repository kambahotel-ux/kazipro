# KaziPro - Login Credentials

## Admin Account

### Email
```
admin@kazipro.com
```

### Password
```
Admin@123456
```

### Access
```
URL: http://localhost:5173/connexion
Dashboard: http://localhost:5173/dashboard/admin
```

---

## Test Accounts

### Client Test Account
```
Email:    client@test.com
Password: Client@123456
Dashboard: /dashboard/client
```

### Provider Test Account
```
Email:    provider@test.com
Password: Provider@123456
Dashboard: /dashboard/prestataire
```

---

## Admin Pages

Once logged in as admin, access these pages:

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

## Quick Access Links

### Login
- http://localhost:5173/connexion

### Admin Dashboard
- http://localhost:5173/dashboard/admin

### Client Dashboard
- http://localhost:5173/dashboard/client

### Provider Dashboard
- http://localhost:5173/dashboard/prestataire

---

## OTP Verification

When logging in, you'll receive an OTP code:

**In Development:**
- Check browser console for OTP code
- Or check email inbox

**In Production:**
- Check email inbox for OTP code

---

## Security Notes

⚠️ **Important:**
- Change default password immediately in production
- Never share credentials
- Use strong passwords
- Enable 2FA for admin accounts
- Rotate credentials regularly

---

## Troubleshooting

### Can't Login?
1. Verify email and password
2. Check caps lock
3. Clear browser cache
4. Try incognito mode

### OTP Not Received?
1. Check email spam folder
2. Check browser console (dev mode)
3. Wait 30 seconds and try again

### Can't Access Admin Pages?
1. Verify you're logged in as admin
2. Check email is `admin@kazipro.com`
3. Clear cookies and try again

---

**Last Updated:** 22 December 2025

