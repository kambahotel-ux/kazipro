-- ============================================
-- Auto-create mission when devis is accepted
-- Trigger function to automatically create a mission
-- ============================================

-- Step 1: Create function to auto-create mission
CREATE OR REPLACE FUNCTION create_mission_on_devis_accept()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create mission if devis status changed to 'accepte'
  IF NEW.statut = 'accepte' AND (OLD.statut IS NULL OR OLD.statut != 'accepte') THEN
    
    -- Get client_id from demande
    INSERT INTO missions (devis_id, client_id, prestataire_id, status, start_date, created_at, updated_at)
    SELECT 
      NEW.id,
      dem.client_id,
      NEW.prestataire_id,
      'pending', -- Initial status
      NOW(),
      NOW(),
      NOW()
    FROM demandes dem
    WHERE dem.id = NEW.demande_id
    ON CONFLICT DO NOTHING; -- Avoid duplicates if mission already exists
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger on devis table
DROP TRIGGER IF EXISTS trigger_create_mission_on_devis_accept ON devis;

CREATE TRIGGER trigger_create_mission_on_devis_accept
AFTER UPDATE ON devis
FOR EACH ROW
EXECUTE FUNCTION create_mission_on_devis_accept();

-- Step 3: Verify trigger was created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_create_mission_on_devis_accept';

-- Expected result: Should show the trigger details
