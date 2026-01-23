-- Créer le bucket pour les documents des prestataires

-- 1. Créer le bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prestataire-documents',
  'prestataire-documents',
  true,
  5242880, -- 5 MB en bytes
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy : Lecture publique
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public Access'
  ) THEN
    CREATE POLICY "Public Access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'prestataire-documents');
  END IF;
END $$;

-- 3. Policy : Upload pour utilisateurs authentifiés
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload'
  ) THEN
    CREATE POLICY "Authenticated users can upload"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'prestataire-documents');
  END IF;
END $$;

-- 4. Policy : Mise à jour pour utilisateurs authentifiés (leurs propres fichiers)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update own files'
  ) THEN
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
  END IF;
END $$;

-- 5. Policy : Suppression pour utilisateurs authentifiés (leurs propres fichiers)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete own files'
  ) THEN
    CREATE POLICY "Users can delete own files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'prestataire-documents' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- Vérifier que le bucket a été créé
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'prestataire-documents';
