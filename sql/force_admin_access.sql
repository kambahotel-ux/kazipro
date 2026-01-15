-- ============================================
-- Force Admin Access - Remove All Restrictions
-- ============================================

-- Step 1: Disable RLS on all tables
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE prestataires DISABLE ROW LEVEL SECURITY;
ALTER TABLE demandes DISABLE ROW LEVEL SECURITY;
ALTER TABLE paiements DISABLE ROW LEVEL SECURITY;
ALTER TABLE missions DISABLE ROW LEVEL SECURITY;
ALTER TABLE devis DISABLE ROW LEVEL SECURITY;
ALTER TABLE avis DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Step 2: Verify data exists
SELECT 'CLIENTS' as table_name, COUNT(*) as count FROM clients
UNION ALL
SELECT 'DEMANDES', COUNT(*) FROM demandes
UNION ALL
SELECT 'PRESTATAIRES', COUNT(*) FROM prestataires
UNION ALL
SELECT 'PAIEMENTS', COUNT(*) FROM paiements
UNION ALL
SELECT 'MISSIONS', COUNT(*) FROM missions
UNION ALL
SELECT 'DEVIS', COUNT(*) FROM devis
UNION ALL
SELECT 'AVIS', COUNT(*) FROM avis
UNION ALL
SELECT 'MESSAGES', COUNT(*) FROM messages;

-- Step 3: Show sample data
SELECT 'CLIENTS SAMPLE:' as info;
SELECT id, user_id, full_name FROM clients LIMIT 3;

SELECT 'DEMANDES SAMPLE:' as info;
SELECT id, title, description FROM demandes LIMIT 3;

SELECT 'PRESTATAIRES SAMPLE:' as info;
SELECT id, user_id, full_name, profession FROM prestataires LIMIT 3;

-- Step 4: Re-enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestataires ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE avis ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop ALL existing policies
DROP POLICY IF EXISTS "Clients can insert own data" ON clients;
DROP POLICY IF EXISTS "Clients can update own data" ON clients;
DROP POLICY IF EXISTS "Clients can view own data" ON clients;
DROP POLICY IF EXISTS "Clients can create demandes" ON demandes;
DROP POLICY IF EXISTS "Clients can update own demandes" ON demandes;
DROP POLICY IF EXISTS "Clients can view own demandes" ON demandes;
DROP POLICY IF EXISTS "Prestataires can view active demandes" ON demandes;
DROP POLICY IF EXISTS "Prestataires can insert own data" ON prestataires;
DROP POLICY IF EXISTS "Prestataires can update own data" ON prestataires;
DROP POLICY IF EXISTS "Prestataires can view own data" ON prestataires;
DROP POLICY IF EXISTS "Anyone can view verified prestataires" ON prestataires;
DROP POLICY IF EXISTS "Prestataires can create devis" ON devis;
DROP POLICY IF EXISTS "Prestataires can view own devis" ON devis;
DROP POLICY IF EXISTS "Clients can view devis for their demandes" ON devis;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Clients can view own missions" ON missions;
DROP POLICY IF EXISTS "Prestataires can view own missions" ON missions;
DROP POLICY IF EXISTS "Clients can view own paiements" ON paiements;
DROP POLICY IF EXISTS "Prestataires can view own paiements" ON paiements;
DROP POLICY IF EXISTS "Anyone can view avis" ON avis;
DROP POLICY IF EXISTS "Users can create avis" ON avis;
DROP POLICY IF EXISTS "Users can update own avis" ON avis;

-- Drop new policies too
DROP POLICY IF EXISTS "clients_select_all" ON clients;
DROP POLICY IF EXISTS "clients_insert_own" ON clients;
DROP POLICY IF EXISTS "clients_update_own" ON clients;
DROP POLICY IF EXISTS "clients_delete_own" ON clients;

DROP POLICY IF EXISTS "prestataires_select_all" ON prestataires;
DROP POLICY IF EXISTS "prestataires_insert_own" ON prestataires;
DROP POLICY IF EXISTS "prestataires_update_own" ON prestataires;
DROP POLICY IF EXISTS "prestataires_delete_own" ON prestataires;

DROP POLICY IF EXISTS "demandes_select_all" ON demandes;
DROP POLICY IF EXISTS "demandes_insert_own" ON demandes;
DROP POLICY IF EXISTS "demandes_update_own" ON demandes;
DROP POLICY IF EXISTS "demandes_delete_own" ON demandes;

DROP POLICY IF EXISTS "paiements_select_all" ON paiements;
DROP POLICY IF EXISTS "paiements_insert_own" ON paiements;
DROP POLICY IF EXISTS "paiements_update_own" ON paiements;

DROP POLICY IF EXISTS "missions_select_all" ON missions;
DROP POLICY IF EXISTS "missions_insert_own" ON missions;
DROP POLICY IF EXISTS "missions_update_own" ON missions;

DROP POLICY IF EXISTS "devis_select_all" ON devis;
DROP POLICY IF EXISTS "devis_insert_own" ON devis;
DROP POLICY IF EXISTS "devis_update_own" ON devis;

DROP POLICY IF EXISTS "avis_select_all" ON avis;
DROP POLICY IF EXISTS "avis_insert_own" ON avis;

DROP POLICY IF EXISTS "messages_select_all" ON messages;
DROP POLICY IF EXISTS "messages_insert_own" ON messages;

-- Step 6: Create SIMPLE policies that allow admin to see everything

-- CLIENTS: Admin can see all, users see own
CREATE POLICY "clients_admin_select" ON clients
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@kazipro.com'
  );

CREATE POLICY "clients_insert" ON clients
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clients_update" ON clients
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "clients_delete" ON clients
  FOR DELETE
  USING (auth.uid() = user_id);

-- PRESTATAIRES: Admin can see all, users see own
CREATE POLICY "prestataires_admin_select" ON prestataires
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@kazipro.com'
  );

CREATE POLICY "prestataires_insert" ON prestataires
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prestataires_update" ON prestataires
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "prestataires_delete" ON prestataires
  FOR DELETE
  USING (auth.uid() = user_id);

-- DEMANDES: Admin can see all, clients see own
CREATE POLICY "demandes_admin_select" ON demandes
  FOR SELECT
  USING (
    auth.uid() = client_id 
    OR (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@kazipro.com'
  );

CREATE POLICY "demandes_insert" ON demandes
  FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "demandes_update" ON demandes
  FOR UPDATE
  USING (auth.uid() = client_id);

CREATE POLICY "demandes_delete" ON demandes
  FOR DELETE
  USING (auth.uid() = client_id);

-- PAIEMENTS: Admin can see all
CREATE POLICY "paiements_admin_select" ON paiements
  FOR SELECT
  USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@kazipro.com');

CREATE POLICY "paiements_insert" ON paiements
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "paiements_update" ON paiements
  FOR UPDATE
  USING (true);

-- MISSIONS: Admin can see all
CREATE POLICY "missions_admin_select" ON missions
  FOR SELECT
  USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@kazipro.com');

CREATE POLICY "missions_insert" ON missions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "missions_update" ON missions
  FOR UPDATE
  USING (true);

-- DEVIS: Admin can see all
CREATE POLICY "devis_admin_select" ON devis
  FOR SELECT
  USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@kazipro.com');

CREATE POLICY "devis_insert" ON devis
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "devis_update" ON devis
  FOR UPDATE
  USING (true);

-- AVIS: Admin can see all
CREATE POLICY "avis_admin_select" ON avis
  FOR SELECT
  USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@kazipro.com');

CREATE POLICY "avis_insert" ON avis
  FOR INSERT
  WITH CHECK (true);

-- MESSAGES: Admin can see all
CREATE POLICY "messages_admin_select" ON messages
  FOR SELECT
  USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@kazipro.com');

CREATE POLICY "messages_insert" ON messages
  FOR INSERT
  WITH CHECK (true);

-- Step 7: Verify policies
SELECT tablename, policyname, permissive
FROM pg_policies
WHERE tablename IN ('clients', 'prestataires', 'demandes', 'paiements', 'missions', 'devis', 'avis', 'messages')
ORDER BY tablename, policyname;
