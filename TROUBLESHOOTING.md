# Troubleshooting Guide - KaziPro

## 🔴 Error: "Could not find the table 'public.clients'"

### Cause
The database tables haven't been initialized in Supabase yet.

### Solution

#### Option 1: Initialize Database (Recommended)
Follow the steps in `DATABASE_SETUP_GUIDE.md`:

1. Go to Supabase Dashboard
2. Open SQL Editor
3. Copy content from `sql/init_tables.sql`
4. Paste and run the SQL
5. Wait 2-3 minutes for completion
6. Verify tables in Table Editor

**Time:** 5-10 minutes

#### Option 2: Automatic Client Creation (Fallback)
The code now automatically creates a client record if it doesn't exist:

1. Register a new account
2. The system will create a client record automatically
3. You can then create demandes

**Note:** This only works for the `clients` table. Other tables still need to be created manually.

### Verification
After setup, check that these tables exist in Supabase Table Editor:
- ✅ clients
- ✅ prestataires
- ✅ demandes
- ✅ devis
- ✅ missions
- ✅ paiements
- ✅ avis
- ✅ messages

---

## 🟡 Error: "Email not confirmed"

### Cause
Supabase requires email confirmation before login. For local development, we use OTP instead.

### Solution
1. Register with your email
2. Check your email for OTP code (6 digits)
3. Enter the OTP on the verification page
4. You'll be redirected to login
5. Login with your email and password

### If you don't receive OTP
1. Check spam/junk folder
2. Click "Resend OTP" button
3. Wait 60 seconds before resending

---

## 🟡 Error: "Invalid login credentials"

### Cause
Email or password is incorrect, or account doesn't exist.

### Solution
1. Make sure you registered first
2. Use the same email and password you registered with
3. Check for typos (email is case-insensitive)
4. If you forgot password, use "Mot de passe oublié" link

---

## 🟡 Error: "User already exists"

### Cause
You're trying to register with an email that's already registered.

### Solution
1. Use a different email address
2. Or login with the existing account
3. Or use "Mot de passe oublié" to reset password

---

## 🟡 Error: "Demande creation failed"

### Cause
Could be several reasons:
- Client record doesn't exist
- Budget values are invalid
- Database connection issue

### Solution
1. Make sure you're logged in
2. Check that all form fields are filled
3. Make sure budget_min < budget_max
4. Check browser console for detailed error
5. Refresh page and try again

---

## 🟡 Error: "No demandes found"

### Cause
Either:
- You haven't created any demandes yet
- The demandes are in a different status
- Database query failed

### Solution
1. Click "Nouvelle demande" to create one
2. Check the status filter (active/completed/cancelled)
3. Check browser console for errors
4. Refresh page

---

## 🟡 Error: "Cannot read property 'id' of null"

### Cause
Client record doesn't exist in database.

### Solution
The code now handles this automatically:
1. Register a new account
2. The system will create a client record
3. Try again

If still failing:
1. Initialize database (see DATABASE_SETUP_GUIDE.md)
2. Register a new account
3. Try again

---

## 🟡 Error: "CORS error" or "Network error"

### Cause
Supabase URL or API key is incorrect.

### Solution
1. Check `.env.local` file
2. Verify `VITE_SUPABASE_URL` is correct
3. Verify `VITE_SUPABASE_ANON_KEY` is correct
4. Restart dev server: `npm run dev`

---

## 🟡 Error: "RLS policy violation"

### Cause
Row Level Security policy is preventing the operation.

### Solution
1. Make sure you're logged in
2. Make sure you're accessing your own data
3. Check that RLS policies were created (see DATABASE_SETUP_GUIDE.md)
4. Refresh page

---

## 🟡 Error: "Storage bucket not found"

### Cause
Storage buckets for images haven't been created.

### Solution
1. Initialize database (see DATABASE_SETUP_GUIDE.md)
2. The SQL script creates storage buckets automatically
3. Or manually create buckets in Supabase Storage

---

## 🟡 Error: "Image upload failed"

### Cause
Storage bucket doesn't exist or permissions are wrong.

### Solution
1. Images are optional - you can skip them
2. Initialize database to create storage buckets
3. Check that bucket permissions are correct

---

## 🟡 Error: "Logout not working"

### Cause
Session not being cleared properly.

### Solution
1. Clear browser cache and cookies
2. Restart dev server
3. Try logout again

---

## 🟡 Error: "Protected route redirecting to login"

### Cause
You're not authenticated or session expired.

### Solution
1. Login again
2. Check that AuthProvider is wrapping the app
3. Check browser console for auth errors

---

## 🟡 Error: "Form validation failing"

### Cause
Form fields don't meet validation requirements.

### Solution
Check each field:
- **Title:** Required, at least 1 character
- **Description:** Required, at least 20 characters
- **Service:** Must select one
- **Commune:** Must select one
- **Budget Min:** Must be a number
- **Budget Max:** Must be a number > Budget Min
- **Password:** At least 6 characters
- **Email:** Valid email format

---

## 🟡 Error: "Infinite loading spinner"

### Cause
Query is taking too long or stuck.

### Solution
1. Check browser console for errors
2. Check Supabase logs for database errors
3. Refresh page
4. Restart dev server

---

## 🟡 Error: "Blank page or white screen"

### Cause
JavaScript error or component crash.

### Solution
1. Open browser console (F12)
2. Check for error messages
3. Refresh page
4. Restart dev server
5. Check that all dependencies are installed: `npm install`

---

## 🟡 Error: "Cannot find module '@supabase/supabase-js'"

### Cause
Supabase package not installed.

### Solution
```bash
npm install @supabase/supabase-js
npm run dev
```

---

## 🟡 Error: "Vite error: Failed to resolve import"

### Cause
Import path is incorrect or file doesn't exist.

### Solution
1. Check file path is correct
2. Check file exists
3. Restart dev server: `npm run dev`

---

## 🟡 Error: "TypeScript error"

### Cause
Type mismatch or missing type definition.

### Solution
1. Check error message in console
2. Fix the type issue
3. Restart dev server

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Can register as client
- [ ] Receive OTP email
- [ ] Can verify OTP
- [ ] Can login
- [ ] Can see dashboard
- [ ] Can create demande
- [ ] Can see demandes list
- [ ] Can logout
- [ ] Can login again

---

## 📞 Getting Help

If you're stuck:

1. **Check the error message** - Read it carefully
2. **Check this guide** - Search for your error
3. **Check browser console** - F12 → Console tab
4. **Check Supabase logs** - Supabase Dashboard → Logs
5. **Restart everything** - Stop dev server, restart, try again
6. **Reinitialize database** - Follow DATABASE_SETUP_GUIDE.md

---

## 🚀 Common Fixes

### "Just restart the dev server"
```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### "Clear cache and cookies"
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty cache and hard refresh"

### "Reinstall dependencies"
```bash
rm -rf node_modules
npm install
npm run dev
```

### "Check environment variables"
1. Open `.env.local`
2. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Restart dev server

---

**Last Updated:** 22 December 2025  
**Status:** Active Development
