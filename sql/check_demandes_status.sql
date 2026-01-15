-- Vérifier les valeurs réelles du champ status dans la table demandes
SELECT DISTINCT status, COUNT(*) as count
FROM demandes
GROUP BY status
ORDER BY count DESC;

-- Voir aussi la structure de la table
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'demandes' 
  AND column_name = 'status';
