-- Corriger les policies du bucket prestataire-documents

-- 1. Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- 2. Policy : Lecture publique (SELECT)
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'prestataire-documents');

-- 3. Policy : Upload pour utilisateurs authentifiés (INSERT)
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prestataire-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Policy : Mise à jour pour utilisateurs authentifiés (UPDATE)
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

-- 5. Policy : Suppression pour utilisateurs authentifiés (DELETE)
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'prestataire-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Vérifier les policies créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%prestataire%'
OR policyname LIKE '%Public read%'
ORDER BY policyname;
