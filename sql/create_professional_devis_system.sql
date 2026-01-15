-- ============================================
-- KaziPro - Système de Devis Professionnel
-- ============================================

-- ÉTAPE 1: Créer la table entreprise_info
-- ============================================
CREATE TABLE IF NOT EXISTS entreprise_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestataire_id UUID NOT NULL UNIQUE REFERENCES prestataires(id) ON DELETE CASCADE,
  nom_entreprise TEXT,
  logo_url TEXT,
  adresse TEXT,
  ville TEXT,
  telephone TEXT,
  email_professionnel TEXT,
  numero_fiscal TEXT,
  conditions_generales TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ÉTAPE 2: Créer la table devis_negotiations
-- ============================================
CREATE TABLE IF NOT EXISTS devis_negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devis_id UUID NOT NULL REFERENCES devis(id) ON DELETE CASCADE,
  auteur_type TEXT NOT NULL CHECK (auteur_type IN ('client', 'prestataire')),
  auteur_id UUID NOT NULL,
  montant_propose NUMERIC NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ÉTAPE 3: Ajouter colonnes à la table devis
-- ============================================
ALTER TABLE devis ADD COLUMN IF NOT EXISTS statut_negociation TEXT DEFAULT 'pending' 
  CHECK (statut_negociation IN ('pending', 'negotiating', 'accepted', 'rejected'));
ALTER TABLE devis ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS devis_parent_id UUID REFERENCES devis(id);

-- ÉTAPE 4: Activer RLS
-- ============================================
ALTER TABLE entreprise_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis_negotiations ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 5: Policies RLS pour entreprise_info
-- ============================================
DROP POLICY IF EXISTS "Prestataires can view own entreprise_info" ON entreprise_info;
CREATE POLICY "Prestataires can view own entreprise_info" ON entreprise_info 
  FOR SELECT USING (
    prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Prestataires can insert own entreprise_info" ON entreprise_info;
CREATE POLICY "Prestataires can insert own entreprise_info" ON entreprise_info 
  FOR INSERT WITH CHECK (
    prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Prestataires can update own entreprise_info" ON entreprise_info;
CREATE POLICY "Prestataires can update own entreprise_info" ON entreprise_info 
  FOR UPDATE USING (
    prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Clients can view entreprise_info for their devis" ON entreprise_info;
CREATE POLICY "Clients can view entreprise_info for their devis" ON entreprise_info 
  FOR SELECT USING (
    prestataire_id IN (
      SELECT d.prestataire_id FROM devis d
      JOIN demandes dm ON d.demande_id = dm.id
      WHERE dm.client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    )
  );

-- ÉTAPE 6: Policies RLS pour devis_negotiations
-- ============================================
DROP POLICY IF EXISTS "Users can view negotiations for their devis" ON devis_negotiations;
CREATE POLICY "Users can view negotiations for their devis" ON devis_negotiations 
  FOR SELECT USING (
    devis_id IN (
      SELECT d.id FROM devis d
      WHERE d.prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
      OR d.demande_id IN (
        SELECT dm.id FROM demandes dm 
        WHERE dm.client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert negotiations" ON devis_negotiations;
CREATE POLICY "Users can insert negotiations" ON devis_negotiations 
  FOR INSERT WITH CHECK (
    auteur_id = auth.uid()
  );

-- ÉTAPE 7: Créer le storage bucket pour les logos
-- ============================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-logos', 'company-logos', true) 
ON CONFLICT (id) DO NOTHING;

-- ÉTAPE 8: Storage policies pour company-logos
-- ============================================
DROP POLICY IF EXISTS "Prestataires can upload logos" ON storage.objects;
CREATE POLICY "Prestataires can upload logos" ON storage.objects 
  FOR INSERT WITH CHECK (
    bucket_id = 'company-logos' 
    AND auth.uid() IN (SELECT user_id FROM prestataires)
  );

DROP POLICY IF EXISTS "Anyone can view logos" ON storage.objects;
CREATE POLICY "Anyone can view logos" ON storage.objects 
  FOR SELECT USING (bucket_id = 'company-logos');

DROP POLICY IF EXISTS "Prestataires can update own logos" ON storage.objects;
CREATE POLICY "Prestataires can update own logos" ON storage.objects 
  FOR UPDATE USING (
    bucket_id = 'company-logos' 
    AND auth.uid() IN (SELECT user_id FROM prestataires)
  );

DROP POLICY IF EXISTS "Prestataires can delete own logos" ON storage.objects;
CREATE POLICY "Prestataires can delete own logos" ON storage.objects 
  FOR DELETE USING (
    bucket_id = 'company-logos' 
    AND auth.uid() IN (SELECT user_id FROM prestataires)
  );

-- ÉTAPE 9: Créer les indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_entreprise_info_prestataire_id ON entreprise_info(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_devis_negotiations_devis_id ON devis_negotiations(devis_id);
CREATE INDEX IF NOT EXISTS idx_devis_negotiations_auteur_id ON devis_negotiations(auteur_id);
CREATE INDEX IF NOT EXISTS idx_devis_statut_negociation ON devis(statut_negociation);

-- ÉTAPE 10: Trigger pour updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_entreprise_info_updated_at ON entreprise_info;
CREATE TRIGGER update_entreprise_info_updated_at 
  BEFORE UPDATE ON entreprise_info 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FIN - Système de devis professionnel créé
-- ============================================
