-- SOLUTION ULTIME : Forcer l'accès au Storage
-- Cette approche crée des policies ultra-permissives

-- 1. Supprimer toutes les policies existantes sur storage.objects
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects';
    END LOOP;
END $$;

-- 2. Créer des policies ultra-permissives (autorisent TOUT)
CREATE POLICY "Allow all operations"
ON storage.objects
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 3. Rendre le bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'prestataire-documents';

-- 4. Vérifications
SELECT 'Bucket status:' as info, id, name, public 
FROM storage.buckets 
WHERE id = 'prestataire-documents'
UNION ALL
SELECT 'Policies:' as info, policyname::text, cmd::text, 'active'::text
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects';
