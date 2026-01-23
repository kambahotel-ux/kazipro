-- Rendre le bucket public via l'API Storage
-- À exécuter dans Supabase SQL Editor

-- 1. Mettre à jour le bucket pour le rendre public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'prestataire-documents';

-- 2. Vérifier que le bucket est public
SELECT id, name, public 
FROM storage.buckets 
WHERE id = 'prestataire-documents';

-- Résultat attendu : public = true

-- 3. Supprimer toutes les policies existantes (optionnel)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
    END LOOP;
END $$;

-- 4. Vérifier qu'il n'y a plus de policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- Résultat attendu : aucune ligne (ou très peu)
