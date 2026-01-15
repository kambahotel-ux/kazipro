-- Fix trigger to handle null end_date in missions
-- When mission has no end_date, use start_date + 2 hours as default

CREATE OR REPLACE FUNCTION auto_create_calendar_event_from_mission()
RETURNS TRIGGER AS $$
DECLARE
  v_client_name TEXT;
  v_client_id UUID;
  v_location TEXT;
  v_title TEXT;
  v_demande_id UUID;
  v_end_date TIMESTAMPTZ;
BEGIN
  -- Si end_date est null, utiliser start_date + 2 heures par défaut
  v_end_date := COALESCE(NEW.end_date, NEW.start_date + INTERVAL '2 hours');

  -- Récupérer le devis_id et les informations depuis le devis
  SELECT 
    dv.demande_id,
    dem.titre,
    dem.localisation,
    c.full_name,
    c.id
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
    v_end_date,  -- Utilise la date calculée
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

-- Recréer le trigger
DROP TRIGGER IF EXISTS trigger_auto_create_calendar_event ON public.missions;
CREATE TRIGGER trigger_auto_create_calendar_event
  AFTER INSERT ON public.missions
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_calendar_event_from_mission();

-- Mettre à jour aussi la fonction de mise à jour
CREATE OR REPLACE FUNCTION auto_update_calendar_event_from_mission()
RETURNS TRIGGER AS $$
DECLARE
  v_end_date TIMESTAMPTZ;
BEGIN
  -- Si end_date est null, utiliser start_date + 2 heures par défaut
  v_end_date := COALESCE(NEW.end_date, NEW.start_date + INTERVAL '2 hours');

  -- Mettre à jour l'événement calendrier correspondant
  UPDATE public.calendar_events
  SET
    start_date = NEW.start_date,
    end_date = v_end_date,  -- Utilise la date calculée
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

-- Recréer le trigger de mise à jour
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

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger corrigé pour gérer les end_date NULL';
  RAISE NOTICE '✅ Si end_date est NULL → utilise start_date + 2 heures';
  RAISE NOTICE '✅ Les missions peuvent maintenant créer des événements calendrier';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Comportement:';
  RAISE NOTICE '   - Mission avec end_date → utilise cette date';
  RAISE NOTICE '   - Mission sans end_date → ajoute 2 heures à start_date';
END $$;
