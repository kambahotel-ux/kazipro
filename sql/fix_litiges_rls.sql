-- =====================================================
-- FIX LITIGES RLS POLICIES - VERSION AVANCÉE
-- =====================================================
-- Ce script ajoute des policies RLS plus restrictives
-- Exécutez-le APRÈS avoir créé la table avec create_litiges_simple.sql

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view litiges" ON public.litiges;
DROP POLICY IF EXISTS "Authenticated users can create litiges" ON public.litiges;
DROP POLICY IF EXISTS "Authenticated users can update litiges" ON public.litiges;
DROP POLICY IF EXISTS "Authenticated users can delete litiges" ON public.litiges;

-- =====================================================
-- ADMIN POLICIES
-- =====================================================

-- Policy: Admin can see all litiges
CREATE POLICY "Admin can view all litiges"
  ON public.litiges
  FOR SELECT
  USING (
    auth.jwt() ->> 'email' = 'admin@kazipro.com'
  );

-- Policy: Admin can insert litiges
CREATE POLICY "Admin can insert litiges"
  ON public.litiges
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'email' = 'admin@kazipro.com'
  );

-- Policy: Admin can update litiges
CREATE POLICY "Admin can update litiges"
  ON public.litiges
  FOR UPDATE
  USING (
    auth.jwt() ->> 'email' = 'admin@kazipro.com'
  );

-- Policy: Admin can delete litiges
CREATE POLICY "Admin can delete litiges"
  ON public.litiges
  FOR DELETE
  USING (
    auth.jwt() ->> 'email' = 'admin@kazipro.com'
  );

-- =====================================================
-- CLIENT POLICIES
-- =====================================================

-- Policy: Clients can view their own litiges
CREATE POLICY "Clients can view their litiges"
  ON public.litiges
  FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

-- Policy: Clients can create litiges
CREATE POLICY "Clients can create litiges"
  ON public.litiges
  FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

-- Policy: Clients can update their own litiges (only when open)
CREATE POLICY "Clients can update their litiges"
  ON public.litiges
  FOR UPDATE
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
    AND statut = 'open'
  );

-- =====================================================
-- PRESTATAIRE POLICIES
-- =====================================================

-- Policy: Prestataires can view their litiges
CREATE POLICY "Prestataires can view their litiges"
  ON public.litiges
  FOR SELECT
  USING (
    prestataire_id IN (
      SELECT id FROM public.prestataires WHERE user_id = auth.uid()
    )
  );

-- Policy: Prestataires can update their litiges (add evidence)
CREATE POLICY "Prestataires can update their litiges"
  ON public.litiges
  FOR UPDATE
  USING (
    prestataire_id IN (
      SELECT id FROM public.prestataires WHERE user_id = auth.uid()
    )
    AND statut IN ('open', 'in_progress')
  );

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Policies RLS avancées appliquées!';
  RAISE NOTICE '✅ Admin: accès complet';
  RAISE NOTICE '✅ Clients: peuvent voir et modifier leurs litiges';
  RAISE NOTICE '✅ Prestataires: peuvent voir leurs litiges et ajouter des preuves';
END $$;
