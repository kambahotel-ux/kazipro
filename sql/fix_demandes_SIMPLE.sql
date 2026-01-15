-- ============================================
-- FIX SIMPLE: Demandes (sans erreur si existe déjà)
-- ============================================

-- PARTIE 1: Rendre les colonnes nullable
-- ============================================

ALTER TABLE demandes ALTER COLUMN title DROP NOT NULL;
ALTER TABLE demandes ALTER COLUMN description DROP NOT NULL;
ALTER TABLE demandes ALTER COLUMN service DROP NOT NULL;
ALTER TABLE demandes ALTER COLUMN location DROP NOT NULL;
ALTER TABLE demandes ALTER COLUMN budget_min DROP NOT NULL;
ALTER TABLE demandes ALTER COLUMN budget_max DROP NOT NULL;

-- PARTIE 2: Ajouter les colonnes manquantes
-- ============================================

ALTER TABLE demandes ADD COLUMN IF NOT EXISTS titre TEXT;
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS localisation TEXT;
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS budget INTEGER;
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS urgence TEXT DEFAULT 'normal';
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'en_attente';

-- PARTIE 3: Supprimer TOUTES les policies existantes
-- ============================================

DROP POLICY IF EXISTS "Clients can insert own demandes" ON demandes;
DROP POLICY IF EXISTS "Clients can create demandes" ON demandes;
DROP POLICY IF EXISTS "Clients can insert demandes" ON demandes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON demandes;
DROP POLICY IF EXISTS "Clients can view own demandes" ON demandes;
DROP POLICY IF EXISTS "Clients can update own demandes" ON demandes;
DROP POLICY IF EXISTS "Allow clients to insert demandes" ON demandes;
DROP POLICY IF EXISTS "Allow clients to view own demandes" ON demandes;
DROP POLICY IF EXISTS "Allow clients to update own demandes" ON demandes;
DROP POLICY IF EXISTS "Prestataires can view demandes" ON demandes;

-- PARTIE 4: Créer les nouvelles policies
-- ============================================

-- INSERT: Permettre aux clients de créer des demandes
CREATE POLICY "Clients can create demandes"
ON demandes FOR INSERT
TO authenticated
WITH CHECK (true);

-- SELECT: Permettre aux clients de voir leurs demandes
CREATE POLICY "Clients can view own demandes"
ON demandes FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
  OR
  (auth.jwt() ->> 'email') = 'admin@kazipro.com'
);

-- UPDATE: Permettre aux clients de modifier leurs demandes
CREATE POLICY "Clients can update own demandes"
ON demandes FOR UPDATE
TO authenticated
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

-- SELECT: Permettre aux prestataires de voir les demandes de leur profession
CREATE POLICY "Prestataires can view demandes"
ON demandes FOR SELECT
TO authenticated
USING (
  profession IN (
    SELECT profession FROM prestataires WHERE user_id = auth.uid()
  )
  AND statut = 'en_attente'
);

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Voir les colonnes
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'demandes'
  AND column_name IN ('title', 'titre', 'description', 'service', 'profession', 'location', 'localisation', 'budget', 'urgence', 'statut')
ORDER BY column_name;

-- Voir les policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'demandes';

-- ============================================
-- ✅ TERMINÉ!
-- ============================================
