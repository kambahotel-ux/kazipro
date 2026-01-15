-- ============================================
-- FIX COMPLET: Tout pour les demandes
-- COPIER ET EXÉCUTER TOUT CE SCRIPT
-- ============================================

-- PARTIE 1: Rendre les colonnes nullable
-- ============================================

ALTER TABLE demandes ALTER COLUMN title DROP NOT NULL;
ALTER TABLE demandes ALTER COLUMN description DROP NOT NULL;
ALTER TABLE demandes ALTER COLUMN service DROP NOT NULL;
ALTER TABLE demandes ALTER COLUMN location DROP NOT NULL;

-- PARTIE 2: Ajouter les colonnes manquantes
-- ============================================

ALTER TABLE demandes ADD COLUMN IF NOT EXISTS titre TEXT;
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS localisation TEXT;
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS budget INTEGER;
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS urgence TEXT DEFAULT 'normal';
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'en_attente';

-- PARTIE 3: Supprimer les anciennes policies RLS
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

-- PARTIE 4: Créer les nouvelles policies RLS
-- ============================================

-- Permettre aux clients de créer des demandes
CREATE POLICY "Clients can create demandes"
ON demandes FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permettre aux clients de voir leurs demandes
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

-- Permettre aux clients de modifier leurs demandes
CREATE POLICY "Clients can update own demandes"
ON demandes FOR UPDATE
TO authenticated
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

-- Permettre aux prestataires de voir les demandes de leur profession
CREATE POLICY "Prestataires can view demandes"
ON demandes FOR SELECT
TO authenticated
USING (
  profession IN (
    SELECT profession FROM prestataires WHERE user_id = auth.uid()
  )
  AND statut = 'en_attente'
);

-- PARTIE 5: Vérification
-- ============================================

-- Voir les colonnes
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'demandes'
  AND column_name IN ('title', 'titre', 'description', 'localisation', 'budget', 'urgence', 'statut')
ORDER BY column_name;

-- Voir les policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'demandes';

-- ============================================
-- RÉSULTAT ATTENDU
-- ============================================

-- Colonnes:
-- ✅ title (nullable)
-- ✅ titre (nullable)
-- ✅ description (nullable)
-- ✅ localisation (nullable)
-- ✅ budget (nullable)
-- ✅ urgence (nullable)
-- ✅ statut (nullable)

-- Policies:
-- ✅ Clients can create demandes (INSERT)
-- ✅ Clients can view own demandes (SELECT)
-- ✅ Clients can update own demandes (UPDATE)
-- ✅ Prestataires can view demandes (SELECT)

-- ============================================
-- APRÈS CE SCRIPT
-- ============================================

-- 1. Rafraîchir la page de création de demande
-- 2. Essayer de créer une demande
-- 3. ✅ Ça devrait fonctionner sans erreur!
