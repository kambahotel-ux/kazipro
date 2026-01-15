-- ============================================
-- Fix RLS Policies - Remove Infinite Recursion
-- ============================================

-- Drop problematic policies
DROP POLICY IF EXISTS "Clients can create demandes" ON demandes;
DROP POLICY IF EXISTS "Prestataires can view client profiles" ON clients;

-- Recreate with simpler logic that doesn't cause recursion

-- For demandes: Allow insert if user has a client record
CREATE POLICY "Clients can create demandes" ON demandes FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM clients WHERE user_id = auth.uid() AND id = client_id)
);

-- For clients: Simpler policy without subqueries
DROP POLICY IF EXISTS "Prestataires can view client profiles" ON clients;
-- This policy is optional - providers can see client info through missions if needed
-- For now, we'll skip it to avoid recursion

-- Verify all policies are correct
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
