-- ============================================
-- Fix RLS Policies for Admin Access
-- ============================================
-- This script ensures admin can see all data

-- 1. Check current RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('clients', 'prestataires', 'demandes', 'paiements', 'missions', 'devis', 'avis', 'messages');

-- 2. Disable RLS temporarily to check data exists
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE prestataires DISABLE ROW LEVEL SECURITY;
ALTER TABLE demandes DISABLE ROW LEVEL SECURITY;
ALTER TABLE paiements DISABLE ROW LEVEL SECURITY;
ALTER TABLE missions DISABLE ROW LEVEL SECURITY;
ALTER TABLE devis DISABLE ROW LEVEL SECURITY;
ALTER TABLE avis DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- 3. Check data
SELECT COUNT(*) as total_clients FROM clients;
SELECT COUNT(*) as total_demandes FROM demandes;
SELECT COUNT(*) as total_prestataires FROM prestataires;

-- 4. Re-enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestataires ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE avis ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies
DROP POLICY IF EXISTS "clients_select_own" ON clients;
DROP POLICY IF EXISTS "clients_insert_own" ON clients;
DROP POLICY IF EXISTS "clients_update_own" ON clients;
DROP POLICY IF EXISTS "clients_delete_own" ON clients;

DROP POLICY IF EXISTS "prestataires_select_own" ON prestataires;
DROP POLICY IF EXISTS "prestataires_insert_own" ON prestataires;
DROP POLICY IF EXISTS "prestataires_update_own" ON prestataires;
DROP POLICY IF EXISTS "prestataires_delete_own" ON prestataires;

DROP POLICY IF EXISTS "demandes_select_own" ON demandes;
DROP POLICY IF EXISTS "demandes_insert_own" ON demandes;
DROP POLICY IF EXISTS "demandes_update_own" ON demandes;
DROP POLICY IF EXISTS "demandes_delete_own" ON demandes;

DROP POLICY IF EXISTS "paiements_select_own" ON paiements;
DROP POLICY IF EXISTS "paiements_insert_own" ON paiements;
DROP POLICY IF EXISTS "paiements_update_own" ON paiements;

DROP POLICY IF EXISTS "missions_select_own" ON missions;
DROP POLICY IF EXISTS "missions_insert_own" ON missions;
DROP POLICY IF EXISTS "missions_update_own" ON missions;

DROP POLICY IF EXISTS "devis_select_own" ON devis;
DROP POLICY IF EXISTS "devis_insert_own" ON devis;
DROP POLICY IF EXISTS "devis_update_own" ON devis;

DROP POLICY IF EXISTS "avis_select_own" ON avis;
DROP POLICY IF EXISTS "avis_insert_own" ON avis;

DROP POLICY IF EXISTS "messages_select_own" ON messages;
DROP POLICY IF EXISTS "messages_insert_own" ON messages;

-- 6. Create new policies that allow admin to see everything
-- Admin email: admin@kazipro.com

-- CLIENTS policies
CREATE POLICY "clients_select_all" ON clients
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@kazipro.com'
    )
  );

CREATE POLICY "clients_insert_own" ON clients
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clients_update_own" ON clients
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clients_delete_own" ON clients
  FOR DELETE
  USING (auth.uid() = user_id);

-- PRESTATAIRES policies
CREATE POLICY "prestataires_select_all" ON prestataires
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@kazipro.com'
    )
  );

CREATE POLICY "prestataires_insert_own" ON prestataires
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prestataires_update_own" ON prestataires
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prestataires_delete_own" ON prestataires
  FOR DELETE
  USING (auth.uid() = user_id);

-- DEMANDES policies
CREATE POLICY "demandes_select_all" ON demandes
  FOR SELECT
  USING (
    auth.uid() = client_id 
    OR EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@kazipro.com'
    )
  );

CREATE POLICY "demandes_insert_own" ON demandes
  FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "demandes_update_own" ON demandes
  FOR UPDATE
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "demandes_delete_own" ON demandes
  FOR DELETE
  USING (auth.uid() = client_id);

-- PAIEMENTS policies
CREATE POLICY "paiements_select_all" ON paiements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@kazipro.com'
    )
  );

CREATE POLICY "paiements_insert_own" ON paiements
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "paiements_update_own" ON paiements
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- MISSIONS policies
CREATE POLICY "missions_select_all" ON missions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@kazipro.com'
    )
  );

CREATE POLICY "missions_insert_own" ON missions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "missions_update_own" ON missions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- DEVIS policies
CREATE POLICY "devis_select_all" ON devis
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@kazipro.com'
    )
  );

CREATE POLICY "devis_insert_own" ON devis
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "devis_update_own" ON devis
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- AVIS policies
CREATE POLICY "avis_select_all" ON avis
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@kazipro.com'
    )
  );

CREATE POLICY "avis_insert_own" ON avis
  FOR INSERT
  WITH CHECK (true);

-- MESSAGES policies
CREATE POLICY "messages_select_all" ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@kazipro.com'
    )
  );

CREATE POLICY "messages_insert_own" ON messages
  FOR INSERT
  WITH CHECK (true);

-- 7. Verify policies are created
SELECT tablename, policyname, permissive, roles
FROM pg_policies
WHERE tablename IN ('clients', 'prestataires', 'demandes', 'paiements', 'missions', 'devis', 'avis', 'messages')
ORDER BY tablename, policyname;
