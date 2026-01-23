-- Script complet pour corriger les policies Storage
-- Exécuter ligne par ligne si nécessaire

-- 1. Vérifier les policies existantes
SELECT policyname, cmd FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND bucket_id = 'prestataire-documents';

-- 2. Policy INSERT (Upload) - LA PLUS IMPORTANTE
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prestataire-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Policy UPDATE (Modification)
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'prestataire-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'prestataire-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Policy DELETE (Suppression)
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'prestataire-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Vérifier que toutes les policies sont créées
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND (policyname LIKE '%prestataire%' OR policyname LIKE '%Public read%')
ORDER BY cmd;

-- Résultat attendu : 4 policies (SELECT, INSERT, UPDATE, DELETE)
