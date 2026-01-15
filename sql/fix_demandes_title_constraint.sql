-- ============================================
-- FIX: Rendre la colonne title nullable
-- EXÉCUTER MAINTENANT dans Supabase SQL Editor
-- ============================================

-- Rendre title nullable (car on utilise titre maintenant)
ALTER TABLE demandes ALTER COLUMN title DROP NOT NULL;

-- Rendre aussi les autres colonnes nullable pour éviter d'autres erreurs
ALTER TABLE demandes ALTER COLUMN description DROP NOT NULL;

-- Vérification
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'demandes'
  AND column_name IN ('title', 'titre', 'description')
ORDER BY column_name;

-- ✅ title et description doivent maintenant être nullable (YES)
