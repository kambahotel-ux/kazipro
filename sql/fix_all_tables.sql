-- Script complet pour corriger toutes les tables
-- Ce script est idempotent (peut être exécuté plusieurs fois)

-- ============================================
-- 1. TABLE PRESTATAIRES
-- ============================================

-- Ajouter les colonnes manquantes
DO $$ 
BEGIN
  -- email
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prestataires' AND column_name = 'email') THEN
    ALTER TABLE prestataires ADD COLUMN email TEXT;
    CREATE INDEX IF NOT EXISTS idx_prestataires_email ON prestataires(email);
  END IF;

  -- profile_completed
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prestataires' AND column_name = 'profile_completed') THEN
    ALTER TABLE prestataires ADD COLUMN profile_completed BOOLEAN DEFAULT FALSE;
  END IF;

  -- disponible
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prestataires' AND column_name = 'disponible') THEN
    ALTER TABLE prestataires ADD COLUMN disponible BOOLEAN DEFAULT FALSE;
  END IF;

  -- telephone
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prestataires' AND column_name = 'telephone') THEN
    ALTER TABLE prestataires ADD COLUMN telephone TEXT;
  END IF;

  -- city
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prestataires' AND column_name = 'city') THEN
    ALTER TABLE prestataires ADD COLUMN city TEXT;
  END IF;

  -- bio
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prestataires' AND column_name = 'bio') THEN
    ALTER TABLE prestataires ADD COLUMN bio TEXT;
  END IF;

  -- experience_years
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prestataires' AND column_name = 'experience_years') THEN
    ALTER TABLE prestataires ADD COLUMN experience_years INTEGER;
  END IF;
END $$;

-- ============================================
-- 2. TABLE CLIENTS
-- ============================================

DO $$ 
BEGIN
  -- email
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'email') THEN
    ALTER TABLE clients ADD COLUMN email TEXT;
    CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
  END IF;
END $$;

-- ============================================
-- 3. TABLE AVIS
-- ============================================

DO $$ 
BEGIN
  -- prestataire_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avis' AND column_name = 'prestataire_id') THEN
    ALTER TABLE avis ADD COLUMN prestataire_id UUID REFERENCES prestataires(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_avis_prestataire_id ON avis(prestataire_id);
  END IF;
END $$;

-- ============================================
-- 4. MISE À JOUR DES DONNÉES
-- ============================================

-- Mettre à jour les emails depuis auth.users
UPDATE prestataires p 
SET email = u.email 
FROM auth.users u 
WHERE p.user_id = u.id AND p.email IS NULL;

UPDATE clients c 
SET email = u.email 
FROM auth.users u 
WHERE c.user_id = u.id AND c.email IS NULL;

-- Marquer les profils existants comme complétés
UPDATE prestataires 
SET profile_completed = TRUE 
WHERE profession IS NOT NULL 
  AND profession != '' 
  AND profession != 'À définir'
  AND profile_completed = FALSE;

-- ============================================
-- 5. VÉRIFICATION
-- ============================================

-- Afficher les résultats
SELECT 
  'prestataires' as table_name,
  COUNT(*) as total,
  COUNT(CASE WHEN profile_completed = TRUE THEN 1 END) as profils_complets,
  COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as avec_email
FROM prestataires

UNION ALL

SELECT 
  'clients' as table_name,
  COUNT(*) as total,
  NULL as profils_complets,
  COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as avec_email
FROM clients

UNION ALL

SELECT 
  'avis' as table_name,
  COUNT(*) as total,
  NULL as profils_complets,
  COUNT(CASE WHEN prestataire_id IS NOT NULL THEN 1 END) as avec_prestataire_id
FROM avis;

-- Afficher les colonnes ajoutées
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name IN ('prestataires', 'clients', 'avis')
  AND column_name IN ('email', 'profile_completed', 'disponible', 'telephone', 'city', 'bio', 'experience_years', 'prestataire_id')
ORDER BY table_name, column_name;
