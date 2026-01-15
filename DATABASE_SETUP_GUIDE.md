# Database Setup Guide - KaziPro

## ⚠️ Current Issue
The error `Could not find the table 'public.clients' in the schema cache` means the database tables haven't been created yet.

## ✅ Solution: Initialize Database

### Step 1: Go to Supabase Dashboard
1. Open https://app.supabase.com
2. Select your project: `qbasvwwerkpmsbzfrydj`
3. Click on **SQL Editor** in the left sidebar

### Step 2: Create New Query
1. Click **New Query** button
2. A new SQL editor window will open

### Step 3: Copy and Paste SQL
1. Open the file `sql/init_tables.sql` in your editor
2. Copy ALL the content
3. Paste it into the Supabase SQL Editor

### Step 4: Execute SQL
1. Click the **Run** button (or press Ctrl+Enter)
2. Wait for the query to complete (should take 2-3 minutes)
3. You should see a success message

### Step 5: Verify Tables Created
1. Go to **Table Editor** in the left sidebar
2. You should see these 8 tables:
   - ✅ clients
   - ✅ prestataires
   - ✅ demandes
   - ✅ devis
   - ✅ missions
   - ✅ paiements
   - ✅ avis
   - ✅ messages

## 🔍 Troubleshooting

### If you get an error about "demandes" table not found:
- Make sure you ran the ENTIRE SQL script
- Check that all tables were created in Table Editor
- Try running the script again

### If you get an error about "RLS policies":
- This is normal - RLS policies might fail if tables don't exist yet
- Just run the script again, it will create them

### If tables still don't appear:
1. Refresh the page (F5)
2. Go to Table Editor again
3. If still missing, run the SQL script one more time

## 📝 What Gets Created

### Tables (8 total)
- **clients** - Client profiles
- **prestataires** - Service provider profiles
- **demandes** - Service requests
- **devis** - Quotes/proposals
- **missions** - Active jobs
- **paiements** - Payments
- **avis** - Reviews/ratings
- **messages** - Messages between users

### Security (RLS Policies)
- Row Level Security enabled on all tables
- Policies to ensure users only see their own data
- Policies for clients to see verified providers
- Policies for providers to see active requests

### Storage Buckets (3 total)
- **demandes-images** - Images for service requests
- **prestataire-documents** - Provider verification documents
- **avatars** - User profile pictures

### Indexes (13 total)
- Performance indexes on frequently queried columns
- Speeds up filtering and searching

### Functions & Triggers
- Auto-update `updated_at` timestamp on changes
- Maintains data consistency

## ✅ After Setup

Once tables are created:

1. **Test the connection:**
   ```bash
   npm run dev
   ```

2. **Try registering a new account:**
   - Go to http://localhost:5173/inscription/client
   - Fill in the form
   - You should receive an OTP email

3. **Check the database:**
   - Go to Supabase Table Editor
   - Click on `clients` table
   - You should see your new client record

4. **Try creating a demande:**
   - Login with your account
   - Go to Dashboard → Demandes
   - Click "Nouvelle demande"
   - Fill the form and submit
   - Check the `demandes` table in Supabase

## 🚀 Next Steps

After database is initialized:

1. Test the complete authentication flow
2. Test creating demandes
3. Test fetching demandes
4. Implement remaining client pages
5. Implement provider pages
6. Implement admin pages

## 📞 Need Help?

If you encounter issues:

1. Check that you're in the correct Supabase project
2. Verify the SQL script was fully executed
3. Refresh the page and check Table Editor again
4. Check the browser console for error messages
5. Check Supabase logs for database errors

---

**Important:** This setup only needs to be done ONCE. After tables are created, they will persist.

**Estimated Time:** 5-10 minutes
