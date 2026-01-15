-- Fix foreign key constraint for calendar_events table
-- Change prestataire_id to reference prestataires table instead of auth.users

-- Drop the existing foreign key constraint
ALTER TABLE public.calendar_events
DROP CONSTRAINT IF EXISTS calendar_events_prestataire_id_fkey;

-- Drop the existing foreign key constraint for client_id if it exists
ALTER TABLE public.calendar_events
DROP CONSTRAINT IF EXISTS calendar_events_client_id_fkey;

-- Add correct foreign key constraint for prestataire_id (references prestataires table)
ALTER TABLE public.calendar_events
ADD CONSTRAINT calendar_events_prestataire_id_fkey
FOREIGN KEY (prestataire_id)
REFERENCES public.prestataires(id)
ON DELETE CASCADE;

-- Add correct foreign key constraint for client_id (references clients table)
ALTER TABLE public.calendar_events
ADD CONSTRAINT calendar_events_client_id_fkey
FOREIGN KEY (client_id)
REFERENCES public.clients(id)
ON DELETE SET NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Foreign keys corrigées pour calendar_events';
  RAISE NOTICE '✅ prestataire_id → public.prestataires(id)';
  RAISE NOTICE '✅ client_id → public.clients(id)';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Vous pouvez maintenant créer des événements avec:';
  RAISE NOTICE '   - prestataire_id = ID depuis la table prestataires';
  RAISE NOTICE '   - client_id = ID depuis la table clients (optionnel)';
END $$;
