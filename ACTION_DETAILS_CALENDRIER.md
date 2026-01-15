# 🎯 ACTION: Améliorer les Détails des Événements Calendrier

## 🔍 Problème Identifié

Les événements créés automatiquement depuis les missions ont des informations génériques:
- ❌ Titre: "Mission" (au lieu du vrai titre de la demande)
- ❌ Client: "Client" (au lieu du nom réel)
- ❌ Localisation: "Non spécifié" (au lieu de l'adresse réelle)
- ❌ Description: Manquante

**Exemple actuel:**
```json
{
  "title": "Mission",
  "client_name": "Client",
  "location": "Non spécifié",
  "description": "Mission créée automatiquement"
}
```

**Ce qu'on veut:**
```json
{
  "title": "Installation électrique",
  "client_name": "Jean Dupont",
  "location": "123 Rue de la Paix, Kinshasa",
  "description": "Installation complète du système électrique..."
}
```

## ✅ Solution

### Exécuter ce Script dans Supabase SQL Editor:

```sql
-- Améliorer les détails des événements calendrier créés depuis les missions
-- Récupérer toutes les informations de la demande pour avoir un événement bien détaillé

CREATE OR REPLACE FUNCTION auto_create_calendar_event_from_mission()
RETURNS TRIGGER AS $$
DECLARE
  v_client_name TEXT;
  v_client_id UUID;
  v_location TEXT;
  v_title TEXT;
  v_description TEXT;
  v_demande_id UUID;
  v_end_date TIMESTAMPTZ;
BEGIN
  -- Si end_date est null, utiliser start_date + 2 heures par défaut
  v_end_date := COALESCE(NEW.end_date, NEW.start_date + INTERVAL '2 hours');

  -- Récupérer TOUTES les informations depuis le devis et la demande
  SELECT 
    dv.demande_id,
    dem.titre,
    dem.description,
    dem.localisation,
    c.full_name,
    c.id
  INTO 
    v_demande_id,
    v_title,
    v_description,
    v_location,
    v_client_name,
    v_client_id
  FROM public.devis_pro dv
  LEFT JOIN public.demandes dem ON dem.id = dv.demande_id
  LEFT JOIN public.clients c ON c.user_id = dem.client_id
  WHERE dv.id = NEW.devis_id;

  -- Créer l'événement calendrier avec TOUTES les informations
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
    COALESCE(v_title, 'Mission sans titre'),
    COALESCE(
      v_description, 
      'Mission créée automatiquement depuis le devis accepté'
    ),
    'mission',
    NEW.start_date,
    v_end_date,
    NEW.prestataire_id,
    v_client_id,
    COALESCE(v_client_name, 'Client non spécifié'),
    COALESCE(v_location, 'Localisation non spécifiée'),
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

-- Mettre à jour aussi la fonction de mise à jour pour synchroniser les changements
CREATE OR REPLACE FUNCTION auto_update_calendar_event_from_mission()
RETURNS TRIGGER AS $$
DECLARE
  v_end_date TIMESTAMPTZ;
  v_title TEXT;
  v_description TEXT;
  v_location TEXT;
  v_client_name TEXT;
BEGIN
  -- Si end_date est null, utiliser start_date + 2 heures par défaut
  v_end_date := COALESCE(NEW.end_date, NEW.start_date + INTERVAL '2 hours');

  -- Récupérer les informations mises à jour depuis la demande
  SELECT 
    dem.titre,
    dem.description,
    dem.localisation,
    c.full_name
  INTO 
    v_title,
    v_description,
    v_location,
    v_client_name
  FROM public.devis_pro dv
  LEFT JOIN public.demandes dem ON dem.id = dv.demande_id
  LEFT JOIN public.clients c ON c.user_id = dem.client_id
  WHERE dv.id = NEW.devis_id;

  -- Mettre à jour l'événement calendrier avec toutes les informations
  UPDATE public.calendar_events
  SET
    title = COALESCE(v_title, title),
    description = COALESCE(v_description, description),
    location = COALESCE(v_location, location),
    client_name = COALESCE(v_client_name, client_name),
    start_date = NEW.start_date,
    end_date = v_end_date,
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

-- Mettre à jour les événements existants avec les vraies informations
UPDATE public.calendar_events ce
SET
  title = COALESCE(dem.titre, ce.title),
  description = COALESCE(dem.description, 'Mission créée automatiquement depuis le devis accepté'),
  location = COALESCE(dem.localisation, ce.location),
  client_name = COALESCE(c.full_name, ce.client_name),
  client_id = c.id
FROM public.missions m
LEFT JOIN public.devis_pro dv ON dv.id = m.devis_id
LEFT JOIN public.demandes dem ON dem.id = dv.demande_id
LEFT JOIN public.clients c ON c.user_id = dem.client_id
WHERE ce.mission_id = m.id
  AND ce.type = 'mission'
  AND (ce.title = 'Mission' OR ce.client_name = 'Client' OR ce.location = 'Non spécifié');
```

## 🧪 Test

### 1. Après avoir exécuté le script:

**Accepter un nouveau devis:**
1. Connectez-vous en tant que client
2. Acceptez un devis avec une demande qui a:
   - Un titre clair (ex: "Installation électrique")
   - Une description détaillée
   - Une localisation précise
   - Un nom de client
3. ✅ L'événement calendrier devrait avoir TOUTES ces informations

**Vérifier dans le calendrier:**
1. Connectez-vous en tant que prestataire
2. Allez sur la page Calendrier
3. ✅ L'événement devrait afficher:
   - Le vrai titre de la demande
   - Le nom réel du client
   - La localisation exacte
   - La description complète (visible dans le modal de détails)

### 2. Vérifier les événements existants:

Le script met aussi à jour les événements déjà créés:

```sql
-- Voir les événements mis à jour
SELECT 
  ce.title,
  ce.client_name,
  ce.location,
  ce.description,
  dem.titre as demande_titre,
  c.full_name as client_reel
FROM public.calendar_events ce
LEFT JOIN public.missions m ON m.id = ce.mission_id
LEFT JOIN public.devis_pro dv ON dv.id = m.devis_id
LEFT JOIN public.demandes dem ON dem.id = dv.demande_id
LEFT JOIN public.clients c ON c.user_id = dem.client_id
WHERE ce.type = 'mission'
ORDER BY ce.created_at DESC
LIMIT 5;
```

## 📊 Avant vs Après

### Avant:
```json
{
  "id": "5c5121e8-f975-4b15-b45a-24338875bc0f",
  "title": "Mission",
  "description": "Mission créée automatiquement",
  "client_name": "Client",
  "location": "Non spécifié"
}
```

### Après:
```json
{
  "id": "5c5121e8-f975-4b15-b45a-24338875bc0f",
  "title": "Installation électrique complète",
  "description": "Installation du système électrique dans la nouvelle maison...",
  "client_name": "Jean Dupont",
  "location": "123 Rue de la Paix, Kinshasa, Gombe"
}
```

## 🎯 Ce qui est Amélioré

### 1. Informations Récupérées:
- ✅ `dem.titre` → Titre réel de la demande
- ✅ `dem.description` → Description complète
- ✅ `dem.localisation` → Adresse exacte
- ✅ `c.full_name` → Nom complet du client
- ✅ `c.id` → ID du client pour les permissions

### 2. Synchronisation:
- ✅ Création automatique avec toutes les infos
- ✅ Mise à jour automatique si la mission change
- ✅ Événements existants corrigés

### 3. Affichage dans le Calendrier:
- ✅ Titre significatif dans la liste
- ✅ Nom du client visible
- ✅ Localisation précise
- ✅ Description complète dans le modal

## ✅ Checklist

- [ ] Script `improve_calendar_event_details.sql` exécuté
- [ ] Événements existants mis à jour (vérifier avec la requête SQL)
- [ ] Accepter un nouveau devis pour tester
- [ ] Vérifier que l'événement a les vraies informations
- [ ] Vérifier dans le calendrier que tout s'affiche correctement
- [ ] Ouvrir le modal de détails pour voir la description

## 📝 Fichiers

- ✅ `sql/improve_calendar_event_details.sql` - Script complet
- ✅ `ACTION_DETAILS_CALENDRIER.md` - Ce guide

C'est tout! Les événements calendrier auront maintenant toutes les informations détaillées de la demande. 🎉
