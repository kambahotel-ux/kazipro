-- Fix devis statut constraint to accept both old and new status values

-- Drop existing constraint
ALTER TABLE devis DROP CONSTRAINT IF EXISTS devis_statut_check;

-- Add new constraint with all possible values
ALTER TABLE devis ADD CONSTRAINT devis_statut_check 
  CHECK (statut IN (
    'en_attente',      -- Nouveau système
    'envoye',          -- Nouveau système
    'accepte',         -- Nouveau système
    'refuse',          -- Nouveau système
    'expire',          -- Nouveau système
    'negocie',         -- Nouveau système
    'pending',         -- Ancien système (compatibilité)
    'accepted',        -- Ancien système (compatibilité)
    'rejected',        -- Ancien système (compatibilité)
    'expired'          -- Ancien système (compatibilité)
  ));

-- Also fix status constraint if it exists
ALTER TABLE devis DROP CONSTRAINT IF EXISTS devis_status_check;

ALTER TABLE devis ADD CONSTRAINT devis_status_check 
  CHECK (status IN (
    'pending',
    'accepted',
    'rejected',
    'expired',
    'negotiating'
  ));

-- Verify constraints
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'devis'::regclass
  AND conname LIKE '%statut%' OR conname LIKE '%status%';
