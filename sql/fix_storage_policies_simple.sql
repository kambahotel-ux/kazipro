-- Version SIMPLE pour tester (moins sécurisée mais fonctionnelle)
-- À utiliser si la version sécurisée ne fonctionne pas

-- Policy INSERT : Tous les utilisateurs authentifiés peuvent uploader
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'prestataire-documents');

-- Policy UPDATE : Tous les utilisateurs authentifiés peuvent modifier
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'prestataire-documents')
WITH CHECK (bucket_id = 'prestataire-documents');

-- Policy DELETE : Tous les utilisateurs authentifiés peuvent supprimer
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'prestataire-documents');

-- Vérifier
SELECT policyname, cmd FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%Allow%'
ORDER BY cmd;
