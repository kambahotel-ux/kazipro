-- ============================================
-- STORAGE BUCKETS - SYSTÈME DE PAIEMENT
-- ============================================

-- Bucket: contrats
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contrats',
  'contrats',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Bucket: signatures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signatures',
  'signatures',
  false,
  1048576, -- 1MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg']
) ON CONFLICT (id) DO NOTHING;

-- Bucket: recus
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recus',
  'recus',
  false,
  5242880, -- 5MB
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Bucket: preuves-paiement
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'preuves-paiement',
  'preuves-paiement',
  false,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Success message
DO $
BEGIN
  RAISE NOTICE '✅ Storage buckets créés avec succès!';
  RAISE NOTICE '- contrats (10MB, PDF)';
  RAISE NOTICE '- signatures (1MB, images)';
  RAISE NOTICE '- recus (5MB, PDF)';
  RAISE NOTICE '- preuves-paiement (5MB, images/PDF)';
END $;
