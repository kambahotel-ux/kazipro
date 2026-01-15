-- ============================================
-- Create missing missions for accepted devis
-- ============================================

-- Step 1: Create missions for demandes that have accepted devis but no mission
INSERT INTO missions (devis_id, client_id, prestataire_id, status, start_date, created_at, updated_at)
SELECT 
  d.id as devis_id,
  dem.client_id,
  d.prestataire_id,
  CASE 
    WHEN dem.status = 'in_progress' THEN 'in_progress'
    WHEN dem.status = 'completed' THEN 'completed'
    ELSE 'pending'
  END as status,
  d.updated_at as start_date,
  NOW() as created_at,
  NOW() as updated_at
FROM demandes dem
INNER JOIN devis d ON d.id = dem.devis_accepte_id
WHERE dem.devis_accepte_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM missions m WHERE m.devis_id = d.id
  );

-- Step 2: Verify missions were created
SELECT 
  m.id as mission_id,
  m.status as mission_status,
  dem.id as demande_id,
  dem.titre as demande_titre,
  dem.status as demande_status,
  d.numero as devis_numero,
  p.full_name as prestataire_name
FROM missions m
INNER JOIN devis d ON d.id = m.devis_id
INNER JOIN demandes dem ON dem.devis_accepte_id = d.id
INNER JOIN prestataires p ON p.id = m.prestataire_id
ORDER BY m.created_at DESC;

-- Expected result: Should show all missions created with their details
