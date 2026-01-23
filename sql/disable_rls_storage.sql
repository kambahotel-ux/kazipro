-- Désactiver complètement le RLS sur storage.objects
-- Cela permettra à tous les utilisateurs authentifiés d'uploader

-- 1. Supprimer TOUTES les policies existantes
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- 2. Désactiver le RLS sur la table storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 3. Vérifier que le RLS est désactivé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- Résultat attendu : rowsecurity = false
