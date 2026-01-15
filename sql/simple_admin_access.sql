-- ============================================
-- Simple Admin Access - Without auth.users check
-- ============================================

-- Step 1: Drop all existing policies
DROP POLICY IF EXISTS "clients_admin_select" ON clients;
DROP POLICY IF EXISTS "clients_insert" ON clients;
DROP POLICY IF EXISTS "clients_update" ON clients;
DROP POLICY IF EXISTS "clients_delete" ON clients;

DROP POLICY IF EXISTS "prestataires_admin_select" ON prestataires;
DROP POLICY IF EXISTS "prestataires_insert" ON prestataires;
DROP POLICY IF EXISTS "prestataires_update" ON prestataires;
DROP POLICY IF EXISTS "prestataires_delete" ON prestataires;

DROP POLICY IF EXISTS "demandes_admin_select" ON demandes;
DROP POLICY IF EXISTS "demandes_insert" ON demandes;
DROP POLICY IF EXISTS "demandes_update" ON demandes;
DROP POLICY IF EXISTS "demandes_delete" ON demandes;

DROP POLICY IF EXISTS "paiements_admin_select" ON paiements;
DROP POLICY IF EXISTS "paiements_insert" ON paiements;
DROP POLICY IF EXISTS "paiements_update" ON paiements;

DROP POLICY IF EXISTS "missions_admin_select" ON missions;
DROP POLICY IF EXISTS "missions_insert" ON missions;
DROP POLICY IF EXISTS "missions_update" ON missions;

DROP POLICY IF EXISTS "devis_admin_select" ON devis;
DROP POLICY IF EXISTS "devis_insert" ON devis;
DROP POLICY IF EXISTS "devis_update" ON devis;

DROP POLICY IF EXISTS "avis_admin_select" ON avis;
DROP POLICY IF EXISTS "avis_insert" ON avis;

DROP POLICY IF EXISTS "messages_admin_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;

-- Step 2: Disable RLS temporarily to verify data
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE prestataires DISABLE ROW LEVEL SECURITY;
ALTER TABLE demandes DISABLE ROW LEVEL SECURITY;
ALTER TABLE paiements DISABLE ROW LEVEL SECURITY;
ALTER TABLE missions DISABLE ROW LEVEL SECURITY;
ALTER TABLE devis DISABLE ROW LEVEL SECURITY;
ALTER TABLE avis DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Step 3: Check data exists
SELECT 'DATA CHECK:' as info;
SELECT COUNT(*) as clients_count FROM clients;
SELECT COUNT(*) as demandes_count FROM demandes;
SELECT COUNT(*) as prestataires_count FROM prestataires;

-- Step 4: Re-enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestataires ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE avis ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Step 5: Create SIMPLE policies - Allow all authenticated users to see all data
-- This is simpler and works better with Supabase

-- CLIENTS: All authenticated users can see all
CREATE POLICY "clients_select_all" ON clients
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "clients_insert_own" ON clients
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clients_update_own" ON clients
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "clients_delete_own" ON clients
  FOR DELETE
  USING (auth.uid() = user_id);

-- PRESTATAIRES: All authenticated users can see all
CREATE POLICY "prestataires_select_all" ON prestataires
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "prestataires_insert_own" ON prestataires
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prestataires_update_own" ON prestataires
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "prestataires_delete_own" ON prestataires
  FOR DELETE
  USING (auth.uid() = user_id);

-- DEMANDES: All authenticated users can see all
CREATE POLICY "demandes_select_all" ON demandes
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "demandes_insert_own" ON demandes
  FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "demandes_update_own" ON demandes
  FOR UPDATE
  USING (auth.uid() = client_id);

CREATE POLICY "demandes_delete_own" ON demandes
  FOR DELETE
  USING (auth.uid() = client_id);

-- PAIEMENTS: All authenticated users can see all
CREATE POLICY "paiements_select_all" ON paiements
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "paiements_insert_all" ON paiements
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "paiements_update_all" ON paiements
  FOR UPDATE
  USING (true);

-- MISSIONS: All authenticated users can see all
CREATE POLICY "missions_select_all" ON missions
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "missions_insert_all" ON missions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "missions_update_all" ON missions
  FOR UPDATE
  USING (true);

-- DEVIS: All authenticated users can see all
CREATE POLICY "devis_select_all" ON devis
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "devis_insert_all" ON devis
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "devis_update_all" ON devis
  FOR UPDATE
  USING (true);

-- AVIS: All authenticated users can see all
CREATE POLICY "avis_select_all" ON avis
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "avis_insert_all" ON avis
  FOR INSERT
  WITH CHECK (true);

-- MESSAGES: All authenticated users can see all
CREATE POLICY "messages_select_all" ON messages
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "messages_insert_all" ON messages
  FOR INSERT
  WITH CHECK (true);

-- Step 6: Verify policies
SELECT tablename, policyname, permissive
FROM pg_policies
WHERE tablename IN ('clients', 'prestataires', 'demandes', 'paiements', 'missions', 'devis', 'avis', 'messages')
ORDER BY tablename, policyname;
