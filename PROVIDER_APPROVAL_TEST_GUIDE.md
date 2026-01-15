# Provider Approval System - Test Guide

## Quick Test Workflow

### 1️⃣ Register a New Provider

**URL:** `http://localhost:5173/inscription/prestataire`

**Fill the form:**
- Nom complet: `Jean Mukeba`
- Email: `jean@example.com`
- Profession: `Électricien`
- Ville: `Gombe`
- Années d'expérience: `5`
- Mot de passe: `Test@123456`
- Confirmer: `Test@123456`

**Click:** "S'inscrire"

**Expected:** 
- ✅ Redirected to OTP verification page
- ✅ Message: "Code OTP envoyé à votre email"

---

### 2️⃣ Verify OTP

**URL:** `http://localhost:5173/auth/verify-otp`

**Enter OTP:**
- Check your email for OTP code
- Enter the 6-digit code
- Click "Vérifier"

**Expected:**
- ✅ Account created
- ✅ Redirected to login page
- ✅ Message: "Email vérifié avec succès"

---

### 3️⃣ Try to Login (Before Approval)

**URL:** `http://localhost:5173/connexion`

**Login with:**
- Email: `jean@example.com`
- Password: `Test@123456`

**Click:** "Se connecter"

**Expected:**
- ✅ Redirected to `/prestataire/en-attente`
- ✅ Shows: "Compte en attente d'approbation"
- ✅ Shows provider name and email
- ✅ Shows approval timeline (24-48 hours)

---

### 4️⃣ Admin Approves Provider

**URL:** `http://localhost:5173/connexion`

**Login as Admin:**
- Email: `admin@kazipro.com`
- Password: `Admin@123456`

**Navigate to:** `/dashboard/admin/prestataires`

**In "En attente" tab:**
- Find "Jean Mukeba"
- Click "Vérifier" button

**Expected:**
- ✅ Message: "Prestataire vérifié"
- ✅ Provider moves to "Vérifiés" tab
- ✅ Database updated: `verified: true`

---

### 5️⃣ Provider Logs In (After Approval)

**URL:** `http://localhost:5173/connexion`

**Login with:**
- Email: `jean@example.com`
- Password: `Test@123456`

**Click:** "Se connecter"

**Expected:**
- ✅ Redirected to `/dashboard/prestataire`
- ✅ Full access to provider dashboard
- ✅ Can see all provider pages

---

## Admin Rejection Test

### Reject a Provider

**URL:** `http://localhost:5173/dashboard/admin/prestataires`

**In "En attente" tab:**
- Find a provider
- Click "Rejeter" button
- Confirm deletion

**Expected:**
- ✅ Message: "Prestataire rejeté"
- ✅ Provider removed from list
- ✅ Provider account deleted

---

## Status Check Test

### Provider Checks Status

**URL:** `http://localhost:5173/prestataire/en-attente`

**Click:** "Vérifier le statut"

**Expected:**
- If still pending: ✅ Shows same page
- If approved: ✅ Auto-redirects to `/dashboard/prestataire`

---

## Database Verification

### Check Provider in Database

**Supabase Console:**

1. Go to `prestataires` table
2. Find the provider by email
3. Check fields:
   - `verified: false` (before approval)
   - `verified: true` (after approval)
   - `full_name: "Jean Mukeba"`
   - `profession: "Électricien"`
   - `city: "Gombe"`
   - `experience: 5`

---

## Test Scenarios

### ✅ Scenario 1: Happy Path
1. Register provider
2. Verify OTP
3. Try to login → redirected to pending page
4. Admin approves
5. Provider logs in → access dashboard

### ✅ Scenario 2: Provider Checks Status
1. Provider on pending page
2. Click "Vérifier le statut"
3. Still pending → stays on page
4. Admin approves
5. Click "Vérifier le statut" → redirects to dashboard

### ✅ Scenario 3: Admin Rejects
1. Provider registers
2. Admin rejects provider
3. Provider tries to login → error or account not found

### ✅ Scenario 4: Multiple Providers
1. Register 3 providers
2. Admin approves 1, rejects 1, leaves 1 pending
3. Check admin page shows correct counts

---

## Troubleshooting

### Provider stuck on pending page
- **Solution:** Admin needs to approve in `/dashboard/admin/prestataires`
- **Check:** Is `verified: true` in database?

### Provider can't login
- **Check:** Email and password correct?
- **Check:** Is account verified in database?
- **Check:** Is OTP verified?

### Admin can't see pending providers
- **Check:** Are you logged in as admin?
- **Check:** Is email `admin@kazipro.com`?
- **Check:** Are there unverified providers in database?

### OTP not received
- **Check:** Email address correct?
- **Check:** Check spam folder
- **Check:** Supabase email settings configured?

---

## Expected Messages

### Registration Success
```
"Code OTP envoyé à votre email !"
```

### OTP Verified
```
"Email vérifié avec succès"
```

### Pending Approval
```
"Votre compte est en attente d'approbation par l'administrateur"
```

### Provider Verified
```
"Prestataire vérifié"
```

### Provider Rejected
```
"Prestataire rejeté"
```

---

## Test Data

### Admin Account
- Email: `admin@kazipro.com`
- Password: `Admin@123456`

### Test Provider 1
- Email: `jean@example.com`
- Password: `Test@123456`
- Name: `Jean Mukeba`
- Profession: `Électricien`

### Test Provider 2
- Email: `marie@example.com`
- Password: `Test@123456`
- Name: `Marie Tshisekedi`
- Profession: `Plombier`

---

## Performance Notes

- ✅ Approval is instant (no email delay)
- ✅ Status check is fast (< 1 second)
- ✅ Auto-redirect works immediately
- ✅ No page refresh needed

---

**Last Updated:** 24 December 2025
