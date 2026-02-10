-- ============================================
-- FIX: Fonction generate_paiement_numero
-- Problème: Référence ambiguë à la colonne "numero"
-- ============================================

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS generate_paiement_numero();

-- Recréer la fonction avec qualification correcte
CREATE OR REPLACE FUNCTION generate_paiement_numero()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  count INTEGER;
  numero TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  
  -- Qualifier la colonne avec le nom de la table pour éviter l'ambiguïté
  SELECT COUNT(*) INTO count 
  FROM paiements 
  WHERE paiements.numero LIKE 'PAY-' || year || '-%';
  
  numero := 'PAY-' || year || '-' || LPAD((count + 1)::TEXT, 4, '0');
  RETURN numero;
END;
$$ LANGUAGE plpgsql;

-- Test de la fonction
SELECT generate_paiement_numero() as test_numero;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Fonction generate_paiement_numero corrigée avec succès!';
  RAISE NOTICE '   La référence ambiguë à "numero" a été résolue';
END $$;
