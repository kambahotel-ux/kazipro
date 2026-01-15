-- ============================================
-- FIX: Colonnes de la table demandes
-- Ajouter les colonnes manquantes
-- ============================================

-- 1. Vérifier les colonnes existantes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'demandes'
ORDER BY ordinal_position;

-- 2. Ajouter les colonnes manquantes si nécessaire

-- Colonnes pour le titre (si n'existe pas)
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS titre TEXT;
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS title TEXT;

-- Colonnes pour le service
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS service TEXT;

-- Colonnes pour la localisation
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS localisation TEXT;

-- Colonnes pour le budget
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS budget_min INTEGER;
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS budget_max INTEGER;
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS budget INTEGER;

-- Colonnes pour le statut
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'en_attente';

-- Colonnes pour l'urgence
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS urgence TEXT DEFAULT 'normal';
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'normal';

-- Colonnes pour la date limite
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS date_limite TIMESTAMP WITH TIME ZONE;

-- 3. Créer des contraintes pour le statut
ALTER TABLE demandes DROP CONSTRAINT IF EXISTS demandes_statut_check;
ALTER TABLE demandes ADD CONSTRAINT demandes_statut_check 
  CHECK (statut IN ('en_attente', 'en_cours', 'terminee', 'annulee'));

ALTER TABLE demandes DROP CONSTRAINT IF EXISTS demandes_status_check;
ALTER TABLE demandes ADD CONSTRAINT demandes_status_check 
  CHECK (status IN ('active', 'pending', 'in_progress', 'completed', 'cancelled'));

-- 4. Créer des contraintes pour l'urgence
ALTER TABLE demandes DROP CONSTRAINT IF EXISTS demandes_urgence_check;
ALTER TABLE demandes ADD CONSTRAINT demandes_urgence_check 
  CHECK (urgence IN ('normal', 'urgent', 'tres_urgent'));

-- 5. Synchroniser les données (si nécessaire)
-- Copier title vers titre si titre est vide
UPDATE demandes SET titre = title WHERE titre IS NULL AND title IS NOT NULL;
UPDATE demandes SET title = titre WHERE title IS NULL AND titre IS NOT NULL;

-- Copier location vers localisation
UPDATE demandes SET localisation = location WHERE localisation IS NULL AND location IS NOT NULL;
UPDATE demandes SET location = localisation WHERE location IS NULL AND localisation IS NOT NULL;

-- Copier status vers statut
UPDATE demandes 
SET statut = CASE 
  WHEN status = 'active' THEN 'en_attente'
  WHEN status = 'pending' THEN 'en_attente'
  WHEN status = 'in_progress' THEN 'en_cours'
  WHEN status = 'completed' THEN 'terminee'
  WHEN status = 'cancelled' THEN 'annulee'
  ELSE 'en_attente'
END
WHERE statut IS NULL AND status IS NOT NULL;

-- 6. Définir des valeurs par défaut
UPDATE demandes SET statut = 'en_attente' WHERE statut IS NULL;
UPDATE demandes SET urgence = 'normal' WHERE urgence IS NULL;

-- ============================================
-- Vérification finale
-- ============================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'demandes'
  AND column_name IN ('titre', 'title', 'service', 'location', 'localisation', 
                      'budget_min', 'budget_max', 'status', 'statut', 'urgence')
ORDER BY column_name;

-- ✅ Toutes les colonnes nécessaires doivent être présentes
