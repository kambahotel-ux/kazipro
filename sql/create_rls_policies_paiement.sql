-- ============================================
-- RLS POLICIES - SYSTÈME DE PAIEMENT
-- ============================================

-- PARTIE 1: Configuration Paiement Globale
-- ============================================

ALTER TABLE configuration_paiement_globale ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read config" ON configuration_paiement_globale;
CREATE POLICY "Anyone can read config" ON configuration_paiement_globale
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can update config" ON configuration_paiement_globale
  FOR UPDATE USING (
    (auth.jwt() ->> 'email') = 'admin@kazipro.com'
  );

-- PARTIE 2: Historique Config
-- ============================================

ALTER TABLE historique_config_paiement ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can read history" ON historique_config_paiement;
CREATE POLICY "Only admins can read history" ON historique_config_paiement
  FOR SELECT USING (
    (auth.jwt() ->> 'email') = 'admin@kazipro.com'
  );

DROP POLICY IF EXISTS "Only admins can insert history" ON historique_config_paiement;
CREATE POLICY "Only admins can insert history" ON historique_config_paiement
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'email') = 'admin@kazipro.com'
  );

-- PARTIE 3: Configuration Prestataire
-- ============================================

ALTER TABLE configuration_paiement_prestataire ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers can read own config" ON configuration_paiement_prestataire;
CREATE POLICY "Providers can read own config" ON configuration_paiement_prestataire
  FOR SELECT USING (
    prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Providers can manage own config" ON configuration_paiement_prestataire;
CREATE POLICY "Providers can manage own config" ON configuration_paiement_prestataire
  FOR ALL USING (
    prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can read all configs" ON configuration_paiement_prestataire;
CREATE POLICY "Admins can read all configs" ON configuration_paiement_prestataire
  FOR SELECT USING (
    (auth.jwt() ->> 'email') = 'admin@kazipro.com'
  );

-- Success message
DO $
BEGIN
  RAISE NOTICE '✅ RLS Policies créées avec succès!';
END $;
