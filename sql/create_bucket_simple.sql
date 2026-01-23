-- Version simplifiée : Créer le bucket et les policies
-- Si une policy existe déjà, vous verrez une erreur mais ce n'est pas grave

-- 1. Créer le bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prestataire-documents',
  'prestataire-documents',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy : Lecture publique
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'prestataire-documents');

-- 3. Policy : Upload authentifié
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'prestataire-documents');

-- 4. Policy : Mise à jour (propres fichiers)
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'prestataire-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'prestataire-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Policy : Suppression (propres fichiers)
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'prestataire-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Vérifier que tout est créé
SELECT 
  id,
  name,
  public,
  file_size_limit
FROM storage.buckets
WHERE id = 'prestataire-documents';
