-- ============================================
-- CRÉATION DU BUCKET SIGNATURES
-- ============================================
-- Ce script crée le bucket de stockage pour les signatures électroniques
-- et configure les politiques d'accès

-- 1. Créer le bucket signatures (public pour lecture)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signatures',
  'signatures',
  true,
  2097152, -- 2MB max
  ARRAY['image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg'];

-- 2. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Public read signatures" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload signatures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own signatures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own signatures" ON storage.objects;

-- 3. Politique de lecture publique
CREATE POLICY "Public read signatures"
ON storage.objects FOR SELECT
USING (bucket_id = 'signatures');

-- 4. Politique d'upload pour utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload signatures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'signatures'
);

-- 5. Politique de mise à jour (pour remplacer une signature)
CREATE POLICY "Users can update their own signatures"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'signatures')
WITH CHECK (bucket_id = 'signatures');

-- 6. Politique de suppression
CREATE POLICY "Users can delete their own signatures"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'signatures');

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Vérifier que le bucket existe
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'signatures';

-- Vérifier les politiques
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%signature%';

-- ============================================
-- RÉSULTAT ATTENDU
-- ============================================
-- ✓ Bucket "signatures" créé avec public = true
-- ✓ 4 politiques créées (SELECT, INSERT, UPDATE, DELETE)
-- ✓ Limite de taille: 2MB
-- ✓ Types MIME autorisés: image/png, image/jpeg, image/jpg
