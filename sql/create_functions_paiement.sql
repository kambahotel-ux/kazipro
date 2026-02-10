-- ============================================
-- FONCTIONS SQL - SYSTÈME DE PAIEMENT
-- ============================================

-- Fonction: Générer numéro de contrat
CREATE OR REPLACE FUNCTION generate_contrat_numero()
RETURNS TEXT AS $
DECLARE
  year TEXT;
  count INTEGER;
  numero TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) INTO count FROM contrats WHERE numero LIKE 'CONT-' || year || '-%';
  numero := 'CONT-' || year || '-' || LPAD((count + 1)::TEXT, 4, '0');
  RETURN numero;
END;
$ LANGUAGE plpgsql;

-- Fonction: Générer numéro de paiement
CREATE OR REPLACE FUNCTION generate_paiement_numero()
RETURNS TEXT AS $
DECLARE
  year TEXT;
  count INTEGER;
  numero TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) INTO count FROM paiements WHERE numero LIKE 'PAY-' || year || '-%';
  numero := 'PAY-' || year || '-' || LPAD((count + 1)::TEXT, 4, '0');
  RETURN numero;
END;
$ LANGUAGE plpgsql;

-- Fonction: Générer numéro de litige
CREATE OR REPLACE FUNCTION generate_litige_numero()
RETURNS TEXT AS $
DECLARE
  year TEXT;
  count INTEGER;
  numero TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) INTO count FROM litiges WHERE numero LIKE 'LIT-' || year || '-%';
  numero := 'LIT-' || year || '-' || LPAD((count + 1)::TEXT, 4, '0');
  RETURN numero;
END;
$ LANGUAGE plpgsql;

-- Fonction: Calculer frais de déplacement
CREATE OR REPLACE FUNCTION calculate_frais_deplacement(
  p_prestataire_id UUID,
  p_distance_km DECIMAL
)
RETURNS DECIMAL AS $
DECLARE
  config RECORD;
  frais DECIMAL := 0;
  distance_facturable DECIMAL;
BEGIN
  SELECT * INTO config FROM frais_deplacement_config
  WHERE prestataire_id = p_prestataire_id AND actif = true;
  
  IF NOT FOUND THEN RETURN 0; END IF;
  
  CASE config.mode_calcul
    WHEN 'fixe' THEN
      frais := COALESCE(config.montant_fixe, 0);
    WHEN 'par_km' THEN
      distance_facturable := GREATEST(0, p_distance_km - COALESCE(config.distance_gratuite_km, 0));
      frais := distance_facturable * COALESCE(config.prix_par_km, 0);
    WHEN 'gratuit' THEN
      frais := 0;
  END CASE;
  
  IF config.montant_minimum IS NOT NULL THEN
    frais := GREATEST(frais, config.montant_minimum);
  END IF;
  
  IF config.montant_maximum IS NOT NULL THEN
    frais := LEAST(frais, config.montant_maximum);
  END IF;
  
  RETURN frais;
END;
$ LANGUAGE plpgsql;

-- Success message
DO $
BEGIN
  RAISE NOTICE '✅ Fonctions créées avec succès!';
  RAISE NOTICE '- generate_contrat_numero()';
  RAISE NOTICE '- generate_paiement_numero()';
  RAISE NOTICE '- generate_litige_numero()';
  RAISE NOTICE '- calculate_frais_deplacement()';
END $;
