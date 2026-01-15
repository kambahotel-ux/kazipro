-- Système automatique de création d'événements calendrier lors de la création de missions
-- Quand une mission est créée, un événement est automatiquement ajouté au calendrier

-- Créer la table calendar_events si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Lien avec la mission
  mission_id UUID REFERENCES public.missions(id) ON DELETE CASCADE,
  
  -- Informations de l'événement
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'mission' CHECK (type IN ('mission', 'visite', 'rdv', 'autre')),
  
  -- Dates et heures
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  
  -- Participants
  prestataire_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_name TEXT,
  
  -- Localisation
  location TEXT,
  
  -- Statut
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
  
  -- Rappels
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_date TIMESTAMPTZ,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_prestataire ON public.calendar_events(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_client ON public.calendar_events(client_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_mission ON public.calendar_events(mission_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_dates ON public.calendar_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON public.calendar_events(status);

-- Enable RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can create their own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can update their own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can delete their own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Admins can view all calendar events" ON public.calendar_events;

-- RLS Policies
CREATE POLICY "Users can view their own calendar events"
ON public.calendar_events
FOR SELECT
USING (
  auth.uid() = prestataire_id 
  OR auth.uid() = client_id
  OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Users can create their own calendar events"
ON public.calendar_events
FOR INSERT
WITH CHECK (
  auth.uid() = prestataire_id
);

CREATE POLICY "Users can update their own calendar events"
ON public.calendar_events
FOR UPDATE
USING (auth.uid() = prestataire_id OR auth.uid() = client_id)
WITH CHECK (auth.uid() = prestataire_id OR auth.uid() = client_id);

CREATE POLICY "Users can delete their own calendar events"
ON public.calendar_events
FOR DELETE
USING (auth.uid() = prestataire_id);

CREATE POLICY "Admins can view all calendar events"
ON public.calendar_events
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS calendar_events_updated_at ON public.calendar_events;
CREATE TRIGGER calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_events_updated_at();

-- ============================================
-- FONCTION PRINCIPALE: Créer événement automatiquement
-- ============================================
CREATE OR REPLACE FUNCTION auto_create_calendar_event_from_mission()
RETURNS TRIGGER AS $$
DECLARE
  v_client_name TEXT;
  v_client_id UUID;
  v_location TEXT;
  v_title TEXT;
  v_demande_id UUID;
BEGIN
  -- Récupérer le devis_id et les informations depuis le devis
  SELECT 
    dv.demande_id,
    dem.titre,
    dem.localisation,
    c.full_name,
    c.user_id
  INTO 
    v_demande_id,
    v_title,
    v_location,
    v_client_name,
    v_client_id
  FROM public.devis_pro dv
  LEFT JOIN public.demandes dem ON dem.id = dv.demande_id
  LEFT JOIN public.clients c ON c.user_id = dem.client_id
  WHERE dv.id = NEW.devis_id;

  -- Créer l'événement calendrier
  INSERT INTO public.calendar_events (
    mission_id,
    title,
    description,
    type,
    start_date,
    end_date,
    prestataire_id,
    client_id,
    client_name,
    location,
    status
  ) VALUES (
    NEW.id,
    COALESCE(v_title, 'Mission'),
    'Mission créée automatiquement',
    'mission',
    NEW.start_date,
    NEW.end_date,
    NEW.prestataire_id,
    v_client_id,
    COALESCE(v_client_name, 'Client'),
    COALESCE(v_location, 'Non spécifié'),
    CASE 
      WHEN NEW.status = 'pending' THEN 'scheduled'
      WHEN NEW.status = 'in_progress' THEN 'confirmed'
      WHEN NEW.status = 'completed' THEN 'completed'
      WHEN NEW.status = 'cancelled' THEN 'cancelled'
      ELSE 'scheduled'
    END
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un événement quand une mission est créée
DROP TRIGGER IF EXISTS trigger_auto_create_calendar_event ON public.missions;
CREATE TRIGGER trigger_auto_create_calendar_event
  AFTER INSERT ON public.missions
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_calendar_event_from_mission();

-- ============================================
-- FONCTION: Mettre à jour l'événement quand la mission change
-- ============================================
CREATE OR REPLACE FUNCTION auto_update_calendar_event_from_mission()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour l'événement calendrier correspondant
  UPDATE public.calendar_events
  SET
    start_date = NEW.start_date,
    end_date = NEW.end_date,
    status = CASE 
      WHEN NEW.status = 'pending' THEN 'scheduled'
      WHEN NEW.status = 'in_progress' THEN 'confirmed'
      WHEN NEW.status = 'completed' THEN 'completed'
      WHEN NEW.status = 'cancelled' THEN 'cancelled'
      ELSE status
    END,
    updated_at = NOW()
  WHERE mission_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour automatiquement l'événement quand la mission change
DROP TRIGGER IF EXISTS trigger_auto_update_calendar_event ON public.missions;
CREATE TRIGGER trigger_auto_update_calendar_event
  AFTER UPDATE ON public.missions
  FOR EACH ROW
  WHEN (
    OLD.start_date IS DISTINCT FROM NEW.start_date OR
    OLD.end_date IS DISTINCT FROM NEW.end_date OR
    OLD.status IS DISTINCT FROM NEW.status
  )
  EXECUTE FUNCTION auto_update_calendar_event_from_mission();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_events TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Table calendar_events créée avec succès!';
  RAISE NOTICE '✅ Trigger automatique configuré pour les missions';
  RAISE NOTICE '✅ Quand une mission est créée → événement calendrier créé automatiquement';
  RAISE NOTICE '✅ Quand une mission est modifiée → événement calendrier mis à jour automatiquement';
  RAISE NOTICE '';
  RAISE NOTICE '📅 Fonctionnalités:';
  RAISE NOTICE '   - Création automatique d''événements';
  RAISE NOTICE '   - Synchronisation avec les missions';
  RAISE NOTICE '   - Support de différents types (mission, visite, rdv)';
  RAISE NOTICE '   - Rappels configurables';
  RAISE NOTICE '   - RLS pour la sécurité';
END $$;
