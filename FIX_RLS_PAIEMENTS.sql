-- ═══════════════════════════════════════════════════════════════════
-- FIX RLS POLICIES - TABLE PAIEMENTS
-- ═══════════════════════════════════════════════════════════════════
-- Date: 27 janvier 2025
-- Description: Policies RLS pour la table paiements
-- ═══════════════════════════════════════════════════════════════════

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "paiements_select_policy" ON paiements;
DROP POLICY IF EXISTS "paiements_insert_policy" ON paiements;
DROP POLICY IF EXISTS "paiements_update_policy" ON paiements;

-- ═══════════════════════════════════════════════════════════════════
-- POLICY SELECT - Lecture des paiements
-- ═══════════════════════════════════════════════════════════════════
-- Permet de lire:
-- - Ses propres paiements (client ou prestataire)
-- - Tous les paiements (admin)
-- ═══════════════════════════════════════════════════════════════════

CREATE POLICY "paiements_select_policy" ON paiements
FOR SELECT
USING (
  -- Admin peut tout voir
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.user_id = auth.uid()
    AND clients.role = 'admin'
  )
  OR
  -- Client peut voir ses paiements
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = paiements.client_id
    AND clients.user_id = auth.uid()
  )
  OR
  -- Prestataire peut voir ses paiements
  EXISTS (
    SELECT 1 FROM prestataires
    WHERE prestataires.id = paiements.prestataire_id
    AND prestataires.user_id = auth.uid()
  )
);

-- ═══════════════════════════════════════════════════════════════════
-- POLICY INSERT - Création de paiements
-- ═══════════════════════════════════════════════════════════════════
-- Permet de créer:
-- - Un paiement pour son propre contrat (client)
-- - Tous les paiements (admin)
-- ═══════════════════════════════════════════════════════════════════

CREATE POLICY "paiements_insert_policy" ON paiements
FOR INSERT
WITH CHECK (
  -- Admin peut tout créer
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.user_id = auth.uid()
    AND clients.role = 'admin'
  )
  OR
  -- Client peut créer un paiement pour son contrat
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = paiements.client_id
    AND clients.user_id = auth.uid()
  )
);

-- ═══════════════════════════════════════════════════════════════════
-- POLICY UPDATE - Mise à jour des paiements
-- ═══════════════════════════════════════════════════════════════════
-- Permet de modifier:
-- - Ses propres paiements (client - pour annulation)
-- - Tous les paiements (admin)
-- - Statut de paiement (système via service role)
-- ═══════════════════════════════════════════════════════════════════

CREATE POLICY "paiements_update_policy" ON paiements
FOR UPDATE
USING (
  -- Admin peut tout modifier
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.user_id = auth.uid()
    AND clients.role = 'admin'
  )
  OR
  -- Client peut modifier ses paiements (ex: annulation)
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = paiements.client_id
    AND clients.user_id = auth.uid()
  )
);

-- ═══════════════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════════

-- Vérifier que RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'paiements';

-- Lister les policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'paiements';

-- ═══════════════════════════════════════════════════════════════════
-- NOTES
-- ═══════════════════════════════════════════════════════════════════
-- 
-- SÉCURITÉ:
-- - Les clients ne peuvent créer que leurs propres paiements
-- - Les prestataires peuvent voir mais pas créer de paiements
-- - Les admins ont tous les droits
-- - Les webhooks de paiement utilisent le service role (bypass RLS)
--
-- FLUX:
-- 1. Client crée un paiement (INSERT)
-- 2. Webhook met à jour le statut (service role)
-- 3. Client et prestataire peuvent voir le paiement (SELECT)
-- 4. Admin peut tout gérer
--
-- ═══════════════════════════════════════════════════════════════════
