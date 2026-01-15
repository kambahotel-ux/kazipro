-- Fix demandes workflow: Update status when devis is accepted
-- The demandes table only has 'status' column (not 'statut')
-- Status values: 'active', 'in_progress', 'completed', 'cancelled'

-- 1. Create trigger to update demande status when devis is accepted
CREATE OR REPLACE FUNCTION update_demande_status_on_devis_accept()
RETURNS TRIGGER AS $$
BEGIN
  -- When a devis is accepted, update the demande status to 'in_progress'
  IF NEW.statut = 'accepte' AND (OLD.statut IS NULL OR OLD.statut != 'accepte') THEN
    UPDATE demandes
    SET status = 'in_progress',
        updated_at = NOW()
    WHERE id = NEW.demande_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_update_demande_on_devis_accept ON devis;

-- Create trigger
CREATE TRIGGER trigger_update_demande_on_devis_accept
  AFTER UPDATE ON devis
  FOR EACH ROW
  EXECUTE FUNCTION update_demande_status_on_devis_accept();

-- 2. Update existing demandes that have accepted devis but still show 'active'
UPDATE demandes d
SET status = 'in_progress',
    updated_at = NOW()
WHERE d.status = 'active'
  AND EXISTS (
    SELECT 1 FROM devis
    WHERE devis.demande_id = d.id
      AND devis.statut = 'accepte'
  );

-- 3. Verify the results
SELECT 
  d.id,
  d.title,
  d.status as demande_status,
  COUNT(dv.id) as total_devis,
  COUNT(CASE WHEN dv.statut = 'accepte' THEN 1 END) as devis_acceptes
FROM demandes d
LEFT JOIN devis dv ON dv.demande_id = d.id
GROUP BY d.id, d.title, d.status
ORDER BY d.created_at DESC;
