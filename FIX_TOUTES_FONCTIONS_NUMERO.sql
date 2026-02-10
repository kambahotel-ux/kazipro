-- ============================================
-- FIX: Toutes les fonctions de génération de numéro
-- Problème: Référence ambiguë aux colonnes "numero"
-- Solution: Qualifier les colonnes avec le nom de la table
-- ============================================

-- 1. Fonction: Générer numéro de contrat
DROP FUNCTION IF EXISTS generate_contrat_numero();

CREATE OR REPLACE FUNCTION generate_contrat_numero()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  count INTEGER;
  numero TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  
  -- Qualifier la colonne avec le nom de la table
  SELECT COUNT(*) INTO count 
  FROM contrats 
  WHERE contrats.numero LIKE 'CONT-' || year || '-%';
  
  numero := 'CONT-' || year || '-' || LPAD((count + 1)::TEXT, 4, '0');
  RETURN numero;
END;
$$ LANGUAGE plpgsql;


-- 2. Fonction: Générer numéro de paiement
DROP FUNCTION IF EXISTS generate_paiement_numero();

CREATE OR REPLACE FUNCTION generate_paiement_numero()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  count INTEGER;
  numero TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  
  -- Qualifier la colonne avec le nom de la table
  SELECT COUNT(*) INTO count 
  FROM paiements 
  WHERE paiements.numero LIKE 'PAY-' || year || '-%';
  
  numero := 'PAY-' || year || '-' || LPAD((count + 1)::TEXT, 4, '0');
  RETURN numero;
END;
$$ LANGUAGE plpgsql;


-- 3. Fonction: Générer numéro de litige
DROP FUNCTION IF EXISTS generate_litige_numero();

CREATE OR REPLACE FUNCTION generate_litige_numero()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  count INTEGER;
  numero TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  
  -- Qualifier la colonne avec le nom de la table
  SELECT COUNT(*) INTO count 
  FROM litiges 
  WHERE litiges.numero LIKE 'LIT-' || year || '-%';
  
  numero := 'LIT-' || year || '-' || LPAD((count + 1)::TEXT, 4, '0');
  RETURN numero;
END;
$$ LANGUAGE plpgsql;


-- Test des fonctions
DO $$
DECLARE
  test_contrat TEXT;
  test_paiement TEXT;
  test_litige TEXT;
BEGIN
  -- Tester chaque fonction
  test_contrat := generate_contrat_numero();
  test_paiement := generate_paiement_numero();
  test_litige := generate_litige_numero();
  
  -- Afficher les résultats
  RAISE NOTICE '✅ Toutes les fonctions ont été corrigées avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Tests des fonctions:';
  RAISE NOTICE '   - generate_contrat_numero() → %', test_contrat;
  RAISE NOTICE '   - generate_paiement_numero() → %', test_paiement;
  RAISE NOTICE '   - generate_litige_numero() → %', test_litige;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Les références ambiguës ont été résolues';
  RAISE NOTICE '   Toutes les colonnes sont maintenant qualifiées avec le nom de la table';
END $$;
