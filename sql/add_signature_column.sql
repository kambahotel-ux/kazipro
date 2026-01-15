-- ============================================
-- Ajouter la colonne signature_url
-- ============================================

-- Ajouter la colonne pour la signature
ALTER TABLE entreprise_info 
ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- Créer un bucket pour les signatures si nécessaire
INSERT INTO storage.buckets (id, name, public) 
VALUES ('signatures', 'signatures', true) 
ON CONFLICT (id) DO NOTHING;

-- Policies pour le bucket signatures
DROP POLICY IF EXISTS "Prestataires can upload signatures" ON storage.objects;
CREATE POLICY "Prestataires can upload signatures" ON storage.objects 
  FOR INSERT WITH CHECK (
    bucket_id = 'signatures' 
    AND auth.uid() IN (SELECT user_id FROM prestataires)
  );

DROP POLICY IF EXISTS "Anyone can view signatures" ON storage.objects;
CREATE POLICY "Anyone can view signatures" ON storage.objects 
  FOR SELECT USING (bucket_id = 'signatures');

DROP POLICY IF EXISTS "Prestataires can update own signatures" ON storage.objects;
CREATE POLICY "Prestataires can update own signatures" ON storage.objects 
  FOR UPDATE USING (
    bucket_id = 'signatures' 
    AND auth.uid() IN (SELECT user_id FROM prestataires)
  );

DROP POLICY IF EXISTS "Prestataires can delete own signatures" ON storage.objects;
CREATE POLICY "Prestataires can delete own signatures" ON storage.objects 
  FOR DELETE USING (
    bucket_id = 'signatures' 
    AND auth.uid() IN (SELECT user_id FROM prestataires)
  );

-- ============================================
-- FIN
-- ============================================
