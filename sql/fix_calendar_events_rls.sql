-- Fix RLS policies for calendar_events table
-- Use a function to check if user owns the prestataire profile

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can create their own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can update their own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can delete their own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Admins can view all calendar events" ON public.calendar_events;

-- Create helper function to check if user owns a prestataire profile
CREATE OR REPLACE FUNCTION user_owns_prestataire(prestataire_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.prestataires
    WHERE id = prestataire_uuid
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if user owns a client profile
CREATE OR REPLACE FUNCTION user_owns_client(client_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = client_uuid
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create simplified RLS policies using helper functions

-- 1. Users can view calendar events where they are the prestataire or client
CREATE POLICY "Users can view their own calendar events"
ON public.calendar_events
FOR SELECT
USING (
  user_owns_prestataire(prestataire_id)
  OR (client_id IS NOT NULL AND user_owns_client(client_id))
);

-- 2. Users can create calendar events if they own the prestataire profile
CREATE POLICY "Users can create their own calendar events"
ON public.calendar_events
FOR INSERT
WITH CHECK (
  user_owns_prestataire(prestataire_id)
);

-- 3. Users can update calendar events if they own the prestataire or client profile
CREATE POLICY "Users can update their own calendar events"
ON public.calendar_events
FOR UPDATE
USING (
  user_owns_prestataire(prestataire_id)
  OR (client_id IS NOT NULL AND user_owns_client(client_id))
)
WITH CHECK (
  user_owns_prestataire(prestataire_id)
  OR (client_id IS NOT NULL AND user_owns_client(client_id))
);

-- 4. Users can delete calendar events if they own the prestataire profile
CREATE POLICY "Users can delete their own calendar events"
ON public.calendar_events
FOR DELETE
USING (
  user_owns_prestataire(prestataire_id)
);

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION user_owns_prestataire TO authenticated;
GRANT EXECUTE ON FUNCTION user_owns_client TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Politiques RLS corrigées pour calendar_events';
  RAISE NOTICE '✅ Fonctions helper créées pour vérifier la propriété';
  RAISE NOTICE '✅ Les utilisateurs peuvent maintenant créer des événements';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Les politiques vérifient maintenant:';
  RAISE NOTICE '   - Si l''utilisateur possède le profil prestataire';
  RAISE NOTICE '   - Si l''utilisateur possède le profil client (pour les événements partagés)';
END $$;
