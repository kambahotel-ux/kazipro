-- Script pour corriger la colonne statut dans la table demandes
-- La table a deux colonnes: 'status' (anglais) et 'statut' (français)
-- Nous devons nous assurer que 'statut' est utilisé et contient les bonnes valeurs

-- 1. Vérifier les valeurs actuelles
SELECT 
  status as status_anglais,
  statut as statut_francais,
  COUNT(*) as count
FROM demandes
GROUP BY status, statut
ORDER BY count DESC;

-- 2. Copier les valeurs de 'status' vers 'statut' si 'statut' est NULL
-- et mapper les valeurs anglaises vers françaises
UPDATE demandes
SET statut = CASE 
  WHEN status = 'active' THEN 'en_attente'
  WHEN status = 'in_progress' THEN 'en_cours'
  WHEN status = 'completed' THEN 'terminee'
  WHEN status = 'cancelled' THEN 'annulee'
  ELSE 'en_attente'
END
WHERE statut IS NULL OR statut = '';

-- 3. S'assurer que toutes les demandes ont un statut valide
UPDATE demandes
SET statut = 'en_attente'
WHERE statut IS NULL 
   OR statut NOT IN ('en_attente', 'en_cours', 'terminee', 'annulee');

-- 4. Vérifier le résultat
SELECT 
  statut,
  COUNT(*) as count
FROM demandes
GROUP BY statut
ORDER BY count DESC;
