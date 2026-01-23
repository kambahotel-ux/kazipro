-- ============================================
-- INSTRUCTIONS: Exécuter ce SQL dans Supabase
-- ============================================
-- 1. Aller sur https://supabase.com/dashboard
-- 2. Sélectionner votre projet
-- 3. Aller dans "SQL Editor"
-- 4. Copier-coller tout le contenu ci-dessous
-- 5. Cliquer sur "Run"
-- ============================================

-- TABLE: prestataire_settings
-- Paramètres et préférences des prestataires

CREATE TABLE IF NOT EXISTS prestataire_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prestataire_id UUID REFERENCES prestataires(id) ON DELETE CASCADE,
  
  -- Notifications Push
  notif_nouvelles_missions BOOLEAN DEFAULT true,
  notif_messages_clients BOOLEAN DEFAULT true,
  notif_maj_missions BOOLEAN DEFAULT true,
  notif_rappels_rdv BOOLEAN DEFAULT false,
  notif_promotions BOOLEAN DEFAULT false,
  
  -- Notifications Email
  email_resume_hebdo BOOLEAN DEFAULT true,
  email_nouvelles_missions BOOLEAN DEFAULT false,
  email_paiements BOOLEAN DEFAULT true,
  
  -- Notifications SMS
  sms_missions_urgentes BOOLEAN DEFAULT true,
  sms_codes_verification BOOLEAN DEFAULT true,
  
  -- Préférences
  langue VARCHAR(10) DEFAULT 'fr',
  fuseau_horaire VARCHAR(50) DEFAULT 'Africa/Kinshasa',
  
  -- Disponibilité
  mode_vacances BOOLEAN DEFAULT false,
  accepter_urgences BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(prestataire_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_prestataire_settings_prestataire 
ON prestataire_settings(prestataire_id);

-- RLS Policies
ALTER TABLE prestataire_settings ENABLE ROW LEVEL SECURITY;

-- Les prestataires peuvent voir leurs propres paramètres
DROP POLICY IF EXISTS "Prestataires can view own settings" ON prestataire_settings;
CREATE POLICY "Prestataires can view own settings" ON prestataire_settings
FOR SELECT
USING (
  prestataire_id IN (
    SELECT id FROM prestataires WHERE user_id = auth.uid()
  )
);

-- Les prestataires peuvent insérer leurs propres paramètres
DROP POLICY IF EXISTS "Prestataires can insert own settings" ON prestataire_settings;
CREATE POLICY "Prestataires can insert own settings" ON prestataire_settings
FOR INSERT
WITH CHECK (
  prestataire_id IN (
    SELECT id FROM prestataires WHERE user_id = auth.uid()
  )
);

-- Les prestataires peuvent mettre à jour leurs propres paramètres
DROP POLICY IF EXISTS "Prestataires can update own settings" ON prestataire_settings;
CREATE POLICY "Prestataires can update own settings" ON prestataire_settings
FOR UPDATE
USING (
  prestataire_id IN (
    SELECT id FROM prestataires WHERE user_id = auth.uid()
  )
);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_prestataire_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_prestataire_settings_updated_at_trigger ON prestataire_settings;
CREATE TRIGGER update_prestataire_settings_updated_at_trigger
BEFORE UPDATE ON prestataire_settings
FOR EACH ROW
EXECUTE FUNCTION update_prestataire_settings_updated_at();

-- Vérifier
SELECT 'Table prestataire_settings créée avec succès ✓' AS status;
