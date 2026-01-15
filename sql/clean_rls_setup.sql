-- ============================================
-- Clean RLS Setup - No Infinite Recursion
-- ============================================
-- This script removes all problematic policies and creates simple, safe ones

-- ============================================
-- STEP 1: Drop all existing policies
-- ============================================

DROP POLICY IF EXISTS "Clients can view own data" ON clients;
DROP POLICY IF EXISTS "Clients can update own data" ON clients;
DROP POLICY IF EXISTS "Prestataires can view client profiles" ON clients;

DROP POLICY IF EXISTS "Prestataires can view own data" ON prestataires;
DROP POLICY IF EXISTS "Prestataires can update own data" ON prestataires;
DROP POLICY IF EXISTS "Clients can view prestataire profiles" ON prestataires;

DROP POLICY IF EXISTS "Clients can view own demandes" ON demandes;
DROP POLICY IF EXISTS "Clients can create demandes" ON demandes;
DROP POLICY IF EXISTS "Clients can update own demandes" ON demandes;
DROP POLICY IF EXISTS "Prestataires can view active demandes" ON demandes;

DROP POLICY IF EXISTS "Prestataires can view own devis" ON devis;
DROP POLICY IF EXISTS "Prestataires can create devis" ON devis;
DROP POLICY IF EXISTS "Clients can view devis for their demandes" ON devis;

DROP POLICY IF EXISTS "Clients can view own missions" ON missions;
DROP POLICY IF EXISTS "Prestataires can view own missions" ON missions;

DROP POLICY IF EXISTS "Clients can view own paiements" ON paiements;
DROP POLICY IF EXISTS "Prestataires can view own paiements" ON paiements;

DROP POLICY IF EXISTS "Anyone can view avis" ON avis;
DROP POLICY IF EXISTS "Users can create avis" ON avis;
DROP POLICY IF EXISTS "Users can update own avis" ON avis;

DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;

-- ============================================
-- STEP 2: Create Simple, Safe RLS Policies
-- ============================================

-- ============================================
-- CLIENTS TABLE POLICIES
-- ============================================

-- Clients can view their own profile
CREATE POLICY "Clients can view own data" ON clients 
FOR SELECT USING (auth.uid() = user_id);

-- Clients can update their own profile
CREATE POLICY "Clients can update own data" ON clients 
FOR UPDATE USING (auth.uid() = user_id);

-- Clients can insert their own profile
CREATE POLICY "Clients can insert own data" ON clients 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PRESTATAIRES TABLE POLICIES
-- ============================================

-- Prestataires can view their own profile
CREATE POLICY "Prestataires can view own data" ON prestataires 
FOR SELECT USING (auth.uid() = user_id);

-- Prestataires can update their own profile
CREATE POLICY "Prestataires can update own data" ON prestataires 
FOR UPDATE USING (auth.uid() = user_id);

-- Prestataires can insert their own profile
CREATE POLICY "Prestataires can insert own data" ON prestataires 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Anyone can view verified prestataires (for discovery)
CREATE POLICY "Anyone can view verified prestataires" ON prestataires 
FOR SELECT USING (verified = TRUE);

-- ============================================
-- DEMANDES TABLE POLICIES
-- ============================================

-- Clients can view their own demandes
CREATE POLICY "Clients can view own demandes" ON demandes 
FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);

-- Clients can create demandes (simple check)
CREATE POLICY "Clients can create demandes" ON demandes 
FOR INSERT WITH CHECK (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);

-- Clients can update their own demandes
CREATE POLICY "Clients can update own demandes" ON demandes 
FOR UPDATE USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);

-- Prestataires can view active demandes (for browsing)
CREATE POLICY "Prestataires can view active demandes" ON demandes 
FOR SELECT USING (status = 'active');

-- ============================================
-- DEVIS TABLE POLICIES
-- ============================================

-- Prestataires can view their own devis
CREATE POLICY "Prestataires can view own devis" ON devis 
FOR SELECT USING (
  prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
);

-- Prestataires can create devis
CREATE POLICY "Prestataires can create devis" ON devis 
FOR INSERT WITH CHECK (
  prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
);

-- Clients can view devis for their demandes
CREATE POLICY "Clients can view devis for their demandes" ON devis 
FOR SELECT USING (
  demande_id IN (SELECT id FROM demandes WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
);

-- ============================================
-- MISSIONS TABLE POLICIES
-- ============================================

-- Clients can view their own missions
CREATE POLICY "Clients can view own missions" ON missions 
FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);

-- Prestataires can view their own missions
CREATE POLICY "Prestataires can view own missions" ON missions 
FOR SELECT USING (
  prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
);

-- ============================================
-- PAIEMENTS TABLE POLICIES
-- ============================================

-- Clients can view their own payments
CREATE POLICY "Clients can view own paiements" ON paiements 
FOR SELECT USING (
  mission_id IN (SELECT id FROM missions WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
);

-- Prestataires can view their own payments
CREATE POLICY "Prestataires can view own paiements" ON paiements 
FOR SELECT USING (
  mission_id IN (SELECT id FROM missions WHERE prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid()))
);

-- ============================================
-- AVIS TABLE POLICIES
-- ============================================

-- Anyone can view reviews
CREATE POLICY "Anyone can view avis" ON avis 
FOR SELECT USING (TRUE);

-- Users can create reviews
CREATE POLICY "Users can create avis" ON avis 
FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own avis" ON avis 
FOR UPDATE USING (auth.uid() = from_user_id);

-- ============================================
-- MESSAGES TABLE POLICIES
-- ============================================

-- Users can view their own messages
CREATE POLICY "Users can view own messages" ON messages 
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send messages
CREATE POLICY "Users can send messages" ON messages 
FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- ============================================
-- DONE - RLS policies are now safe
-- ============================================
