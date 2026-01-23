-- ✅ SOLUTION COMPLÈTE : Corriger TOUS les buckets Storage
-- Ce script rend tous les buckets accessibles

-- ÉTAPE 1 : Supprimer TOUTES les policies sur storage.objects
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
        RAISE NOTICE 'Policy supprimée: %', r.policyname;
    END LOOP;
END $$;

-- ÉTAPE 2 : Créer les buckets s'ils n'existent pas
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('prestataire-documents', 'prestataire-documents', true),
    ('company-logos', 'company-logos', true),
    ('demande-images', 'demande-images', true)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 5242880,  -- 5 MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

-- ÉTAPE 3 : Créer UNE policy ultra-permissive pour TOUS les buckets
CREATE POLICY "Allow all authenticated users full access"
ON storage.objects
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ÉTAPE 4 : Ajouter une policy pour lecture publique
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (true);

-- ÉTAPE 5 : Vérifications
SELECT 
    '✅ Buckets configurés' as status,
    id, 
    name, 
    public,
    file_size_limit
FROM storage.buckets 
WHERE id IN ('prestataire-documents', 'company-logos', 'demande-images')
ORDER BY id;

-- Vérifier les policies
SELECT 
    '✅ Policies actives' as status,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Configuration terminée !';
    RAISE NOTICE '✅ Tous les buckets sont maintenant PUBLIC';
    RAISE NOTICE '✅ Les utilisateurs authentifiés peuvent uploader partout';
    RAISE NOTICE '✅ Lecture publique activée';
END $$;
