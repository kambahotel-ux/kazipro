-- ============================================
-- CRÉATION DU BUCKET STORAGE: demandes
-- Pour l'upload d'images avec les demandes
-- ============================================

-- Note: Cette partie doit être faite dans l'interface Supabase Storage
-- car les buckets ne peuvent pas être créés via SQL

-- ÉTAPES MANUELLES:
-- 1. Aller dans Supabase Dashboard > Storage
-- 2. Cliquer sur "New bucket"
-- 3. Nom: demandes
-- 4. Public: OUI (cocher la case)
-- 5. Cliquer sur "Create bucket"

-- ============================================
-- POLICIES RLS POUR LE BUCKET
-- À exécuter APRÈS avoir créé le bucket
-- ============================================

-- Policy 1: Permettre aux clients authentifiés d'uploader des images
CREATE POLICY "Clients can upload demande images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'demandes'
  AND auth.role() = 'authenticated'
);

-- Policy 2: Permettre à tout le monde de voir les images (bucket public)
CREATE POLICY "Anyone can view demande images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'demandes');

-- Policy 3: Permettre aux clients de supprimer leurs propres images
CREATE POLICY "Clients can delete own demande images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'demandes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Voir les policies du bucket
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects'
  AND policyname LIKE '%demande%'
ORDER BY policyname;

-- ============================================
-- ✅ TERMINÉ!
-- ============================================

-- Après ces étapes:
-- 1. Les clients peuvent uploader des images avec leurs demandes
-- 2. Les images sont publiquement accessibles
-- 3. Les clients peuvent supprimer leurs propres images
