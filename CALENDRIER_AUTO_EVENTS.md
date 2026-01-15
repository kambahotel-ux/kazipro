# Événements Calendrier Automatiques 📅

## 🎯 Fonctionnalité

Quand une mission est créée, un événement est **automatiquement** ajouté au calendrier du prestataire.

## ✅ Ce qui a été créé

### 1. Table `calendar_events`
Une table dédiée pour stocker tous les événements du calendrier avec :
- Lien vers la mission (`mission_id`)
- Informations de l'événement (titre, description, type)
- Dates et heures (start_date, end_date)
- Participants (prestataire_id, client_id, client_name)
- Localisation
- Statut (scheduled, confirmed, cancelled, completed)
- Système de rappels

### 2. Triggers Automatiques

#### Trigger 1: Création automatique
```sql
trigger_auto_create_calendar_event
```
- **Quand**: Une mission est créée (INSERT sur `missions`)
- **Action**: Crée automatiquement un événement dans `calendar_events`
- **Données copiées**:
  - Titre de la mission
  - Dates de début et fin
  - ID du prestataire
  - Informations du client (nom, ID)
  - Localisation depuis la demande
  - Statut synchronisé

#### Trigger 2: Mise à jour automatique
```sql
trigger_auto_update_calendar_event
```
- **Quand**: Une mission est modifiée (UPDATE sur `missions`)
- **Action**: Met à jour l'événement calendrier correspondant
- **Champs synchronisés**:
  - Titre
  - Dates (start_date, end_date)
  - Statut

### 3. Sécurité RLS
Politiques configurées :
- ✅ Les prestataires voient leurs propres événements
- ✅ Les clients voient les événements où ils sont participants
- ✅ Les prestataires peuvent créer/modifier/supprimer leurs événements
- ✅ Les admins ont accès à tous les événements

## 📝 Installation

1. **Ouvrir Supabase Dashboard**
   - Allez sur https://supabase.com
   - Sélectionnez votre projet

2. **Exécuter le Script SQL**
   - Cliquez sur "SQL Editor"
   - Cliquez sur "New Query"
   - Copiez le contenu de `sql/auto_create_calendar_events.sql`
   - Exécutez le script

## 🔄 Workflow Automatique

### Scénario 1: Création de Mission
```
1. Client crée une demande
2. Prestataire envoie un devis
3. Client accepte le devis
4. ✨ Mission créée automatiquement
5. 🎉 Événement calendrier créé automatiquement
```

### Scénario 2: Modification de Mission
```
1. Mission modifiée (titre, dates, statut)
2. ✨ Événement calendrier mis à jour automatiquement
```

### Scénario 3: Suppression de Mission
```
1. Mission supprimée
2. ✨ Événement calendrier supprimé automatiquement (CASCADE)
```

## 📊 Structure de l'Événement

Chaque événement contient :
```typescript
{
  id: UUID,
  mission_id: UUID,              // Lien vers la mission
  title: string,                 // Titre de la mission
  description: string,           // Description
  type: 'mission' | 'visite' | 'rdv' | 'autre',
  start_date: timestamp,         // Date/heure de début
  end_date: timestamp,           // Date/heure de fin
  prestataire_id: UUID,          // ID du prestataire
  client_id: UUID,               // ID du client
  client_name: string,           // Nom du client
  location: string,              // Adresse
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed',
  reminder_sent: boolean,        // Rappel envoyé?
  reminder_date: timestamp,      // Date du rappel
  created_at: timestamp,
  updated_at: timestamp
}
```

## 🎨 Types d'Événements

Le système supporte 4 types d'événements :
1. **mission** - Mission de travail (créé automatiquement)
2. **visite** - Visite sur site
3. **rdv** - Rendez-vous
4. **autre** - Autre type d'événement

## 🔔 Système de Rappels

Chaque événement peut avoir un rappel :
- `reminder_date` - Date/heure du rappel
- `reminder_sent` - Indique si le rappel a été envoyé

## 💻 Utilisation dans le Code

### Récupérer les événements du calendrier
```typescript
const { data: events, error } = await supabase
  .from('calendar_events')
  .select('*')
  .eq('prestataire_id', userId)
  .order('start_date', { ascending: true });
```

### Récupérer les événements d'une date
```typescript
const { data: events, error } = await supabase
  .from('calendar_events')
  .select('*')
  .eq('prestataire_id', userId)
  .gte('start_date', startOfDay)
  .lte('start_date', endOfDay);
```

### Créer un événement manuel
```typescript
const { data, error } = await supabase
  .from('calendar_events')
  .insert({
    title: 'Visite technique',
    type: 'visite',
    start_date: '2026-01-15 10:00:00',
    end_date: '2026-01-15 11:00:00',
    prestataire_id: userId,
    client_name: 'Jean Dupont',
    location: 'Kinshasa, Gombe',
    status: 'scheduled'
  });
```

### Mettre à jour un événement
```typescript
const { error } = await supabase
  .from('calendar_events')
  .update({
    status: 'confirmed',
    reminder_date: '2026-01-14 18:00:00'
  })
  .eq('id', eventId);
```

## 🔗 Synchronisation Mission ↔ Événement

### Mapping des Statuts
```
Mission Status    →  Event Status
--------------       -------------
pending          →  scheduled
in_progress      →  confirmed
completed        →  completed
cancelled        →  cancelled
```

### Champs Synchronisés
- ✅ Titre (titre → title)
- ✅ Dates (start_date, end_date)
- ✅ Statut (status)
- ✅ Prestataire (prestataire_id)
- ✅ Client (via demande)
- ✅ Localisation (via demande)

## 📱 Intégration avec CalendrierPage

La page calendrier peut maintenant utiliser `calendar_events` au lieu de `missions` directement :

```typescript
// Avant (utilise missions)
const { data: missions } = await supabase
  .from('missions')
  .select('*')
  .eq('prestataire_id', userId);

// Après (utilise calendar_events)
const { data: events } = await supabase
  .from('calendar_events')
  .select(`
    *,
    mission:mission_id (
      id,
      titre,
      description,
      status
    )
  `)
  .eq('prestataire_id', userId);
```

## 🎯 Avantages

1. **Automatique** - Aucune action manuelle requise
2. **Synchronisé** - Toujours à jour avec les missions
3. **Flexible** - Supporte différents types d'événements
4. **Sécurisé** - RLS configuré correctement
5. **Extensible** - Facile d'ajouter des rappels, notifications, etc.

## 🚀 Prochaines Étapes

1. ✅ Exécuter le script SQL
2. ✅ Tester la création d'une mission
3. ✅ Vérifier que l'événement apparaît dans le calendrier
4. 🔄 Optionnel: Mettre à jour CalendrierPage pour utiliser `calendar_events`
5. 🔔 Optionnel: Implémenter le système de rappels

## 📝 Notes Importantes

- Les événements sont créés **automatiquement** via trigger
- La suppression d'une mission supprime l'événement (CASCADE)
- Les prestataires peuvent créer des événements manuels (visites, rdv)
- Les clients peuvent voir les événements où ils sont participants
- Le système est prêt pour les notifications/rappels futurs

---

**Fichier SQL :** `sql/auto_create_calendar_events.sql`
