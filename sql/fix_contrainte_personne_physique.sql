-- ============================================
-- Correction rapide de la contrainte personne physique
-- ============================================

-- Supprimer les contraintes problématiques
ALTER TABLE prestataires DROP CONSTRAINT IF EXISTS check_personne_physique_fields;
ALTER TABLE prestataires DROP CONSTRAINT IF EXISTS check_personne_morale_fields;

-- Remplir les champs manquants pour les prestataires existants
UPDATE prestataires 
SET 
  type_prestataire = COALESCE(type_prestataire, 'physique'),
  prenom = COALESCE(prenom, SPLIT_PART(full_name, ' ', 1), full_name),
  nom = COALESCE(nom, NULLIF(SPLIT_PART(full_name, ' ', 2), ''), full_name)
WHERE type_prestataire = 'physique' OR type_prestataire IS NULL;

-- Vérifier qu'il n'y a plus de valeurs NULL
UPDATE prestataires 
SET 
  nom = full_name,
  prenom = full_name
WHERE type_prestataire = 'physique' AND (nom IS NULL OR nom = '' OR prenom IS NULL OR prenom = '');

-- Réajouter les contraintes
ALTER TABLE prestataires 
ADD CONSTRAINT check_personne_physique_fields 
CHECK (
  type_prestataire != 'physique' OR 
  (nom IS NOT NULL AND nom != '' AND prenom IS NOT NULL AND prenom != '')
);

ALTER TABLE prestataires 
ADD CONSTRAINT check_personne_morale_fields 
CHECK (
  type_prestataire != 'morale' OR 
  (raison_sociale IS NOT NULL AND raison_sociale != '' AND representant_legal_nom IS NOT NULL AND representant_legal_nom != '')
);

-- Afficher le résultat
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE type_prestataire = 'physique') as physiques,
  COUNT(*) FILTER (WHERE type_prestataire = 'morale') as morales,
  COUNT(*) FILTER (WHERE type_prestataire = 'physique' AND (nom IS NULL OR prenom IS NULL)) as problemes
FROM prestataires;
