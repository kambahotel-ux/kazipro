-- =====================================================
-- AJOUTER LES COLONNES POUR LES DOCUMENTS
-- =====================================================

-- 1. Ajouter les colonnes pour stocker les URLs des documents
ALTER TABLE public.prestataires 
ADD COLUMN IF NOT EXISTS id_document_url TEXT,
ADD COLUMN IF NOT EXISTS qualification_url TEXT;

-- 2. Vérifier les colonnes
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'prestataires'
  AND column_name IN ('id_document_url', 'qualification_url');

-- 3. Voir les prestataires avec leurs documents
SELECT 
  id,
  full_name,
  email,
  profession,
  verified,
  id_document_url,
  qualification_url,
  created_at
FROM public.prestataires
ORDER BY created_at DESC
LIMIT 10;

-- Message de succès
DO $$
DECLARE
  id_col_exists BOOLEAN;
  qual_col_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prestataires' AND column_name = 'id_document_url'
  ) INTO id_col_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prestataires' AND column_name = 'qualification_url'
  ) INTO qual_col_exists;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ COLONNES DOCUMENTS';
  RAISE NOTICE '========================================';
  
  IF id_col_exists THEN
    RAISE NOTICE '✅ Colonne id_document_url: EXISTE';
  ELSE
    RAISE NOTICE '❌ Colonne id_document_url: N''EXISTE PAS';
  END IF;
  
  IF qual_col_exists THEN
    RAISE NOTICE '✅ Colonne qualification_url: EXISTE';
  ELSE
    RAISE NOTICE '❌ Colonne qualification_url: N''EXISTE PAS';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '📝 Prochaine étape:';
  RAISE NOTICE '   1. Créer le bucket "provider-documents" dans Storage';
  RAISE NOTICE '   2. Configurer les permissions du bucket';
  RAISE NOTICE '   3. Tester l''upload depuis l''inscription';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
