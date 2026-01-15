-- Fix existing missions with NULL end_date
-- Set end_date to start_date + 2 hours for missions without end_date

-- Update existing missions with NULL end_date
UPDATE public.missions
SET end_date = start_date + INTERVAL '2 hours'
WHERE end_date IS NULL;

-- Show updated missions
SELECT 
  id,
  start_date,
  end_date,
  status,
  EXTRACT(EPOCH FROM (end_date - start_date))/3600 as duration_hours
FROM public.missions
ORDER BY created_at DESC
LIMIT 10;

-- Success message
DO $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_updated_count
  FROM public.missions
  WHERE end_date = start_date + INTERVAL '2 hours';
  
  RAISE NOTICE '✅ Missions mises à jour avec end_date par défaut';
  RAISE NOTICE '✅ Nombre de missions corrigées: %', v_updated_count;
  RAISE NOTICE '';
  RAISE NOTICE '📝 Toutes les missions ont maintenant:';
  RAISE NOTICE '   - start_date (date de début)';
  RAISE NOTICE '   - end_date (date de fin, +2h si non spécifiée)';
END $$;
