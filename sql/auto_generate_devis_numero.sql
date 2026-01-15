-- Script pour auto-générer le numéro de devis
-- À exécuter dans Supabase SQL Editor

-- 1. Créer une fonction pour générer le numéro de devis
CREATE OR REPLACE FUNCTION generate_devis_numero()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  new_numero TEXT;
BEGIN
  -- Obtenir le prochain numéro séquentiel
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 'DEV-(\d+)') AS INTEGER)), 0) + 1
  INTO next_num
  FROM devis
  WHERE numero LIKE 'DEV-%';
  
  -- Générer le numéro au format DEV-XXXXXX (6 chiffres)
  new_numero := 'DEV-' || LPAD(next_num::TEXT, 6, '0');
  
  RETURN new_numero;
END;
$$ LANGUAGE plpgsql;

-- 2. Créer un trigger pour auto-générer le numéro avant insertion
CREATE OR REPLACE FUNCTION set_devis_numero()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le numéro n'est pas fourni, le générer automatiquement
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := generate_devis_numero();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trigger_set_devis_numero ON devis;

-- 4. Créer le trigger
CREATE TRIGGER trigger_set_devis_numero
  BEFORE INSERT ON devis
  FOR EACH ROW
  EXECUTE FUNCTION set_devis_numero();

-- 5. Mettre à jour les devis existants sans numéro
UPDATE devis
SET numero = 'DEV-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 6, '0')
WHERE numero IS NULL OR numero = '';

-- Vérification
SELECT 
  'Fonction créée' as status,
  generate_devis_numero() as prochain_numero;

SELECT 
  id, 
  numero, 
  titre,
  created_at
FROM devis
ORDER BY created_at DESC
LIMIT 5;
