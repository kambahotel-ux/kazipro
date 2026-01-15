# 🔧 Fix: Calendar Events - Null End Date Error

## ❌ Problème Identifié

Erreur lors de l'acceptation d'un devis:
```
null value in column "end_date" of relation "calendar_events" violates not-null constraint
```

**Cause**: Le trigger automatique essaie de créer un événement calendrier quand une mission est créée, mais la mission a `end_date = NULL`, alors que la table `calendar_events` exige que `end_date` soit NOT NULL.

## ✅ Solution

### Étape 1: Corriger le Trigger (OBLIGATOIRE)

Exécutez ce script dans Supabase SQL Editor:
```sql
sql/fix_calendar_trigger_null_dates.sql
```

**Ce que fait ce script:**
- ✅ Modifie la fonction `auto_create_calendar_event_from_mission()`
- ✅ Si `end_date` est NULL → utilise `start_date + 2 heures`
- ✅ Modifie aussi la fonction de mise à jour
- ✅ Recrée les triggers

### Étape 2: Corriger les Missions Existantes (RECOMMANDÉ)

Exécutez ce script dans Supabase SQL Editor:
```sql
sql/fix_missions_null_end_dates.sql
```

**Ce que fait ce script:**
- ✅ Met à jour toutes les missions avec `end_date = NULL`
- ✅ Définit `end_date = start_date + 2 heures`
- ✅ Affiche le nombre de missions corrigées

## 🧪 Test

### 1. Après avoir exécuté les scripts:

1. **Accepter un devis:**
   - Connectez-vous en tant que client
   - Allez sur une demande avec un devis
   - Signez et acceptez le devis
   - ✅ Devrait créer une mission ET un événement calendrier sans erreur

2. **Vérifier l'événement créé:**
   - Connectez-vous en tant que prestataire
   - Allez sur la page Calendrier
   - ✅ L'événement devrait apparaître avec:
     - Titre de la mission
     - Date de début
     - Date de fin (start_date + 2h si non spécifiée)
     - Type: Mission
     - Client et localisation

### 2. Vérifier dans Supabase:

```sql
-- Voir les événements calendrier récents
SELECT 
  ce.title,
  ce.start_date,
  ce.end_date,
  ce.status,
  ce.client_name,
  m.id as mission_id,
  EXTRACT(EPOCH FROM (ce.end_date - ce.start_date))/3600 as duration_hours
FROM public.calendar_events ce
LEFT JOIN public.missions m ON m.id = ce.mission_id
ORDER BY ce.created_at DESC
LIMIT 5;
```

## 📋 Comportement Attendu

### Avant le Fix:
- ❌ Accepter un devis → Erreur "null value in column end_date"
- ❌ Mission créée mais pas d'événement calendrier
- ❌ Workflow bloqué

### Après le Fix:
- ✅ Accepter un devis → Mission créée
- ✅ Événement calendrier créé automatiquement
- ✅ Si mission sans end_date → événement de 2 heures par défaut
- ✅ Workflow complet fonctionne

## 🔍 Détails Techniques

### Logique du Trigger Corrigé:

```sql
-- Si end_date est null, utiliser start_date + 2 heures
v_end_date := COALESCE(NEW.end_date, NEW.start_date + INTERVAL '2 hours');
```

### Pourquoi 2 heures?
- Durée raisonnable pour une mission/visite par défaut
- Permet d'avoir un événement visible dans le calendrier
- Peut être modifié manuellement après création

### Alternative: Modifier la Table Missions

Si vous voulez que toutes les missions aient obligatoirement une end_date:

```sql
-- Rendre end_date obligatoire dans missions
ALTER TABLE public.missions
ALTER COLUMN end_date SET NOT NULL;

-- Définir une valeur par défaut
ALTER TABLE public.missions
ALTER COLUMN end_date SET DEFAULT (NOW() + INTERVAL '2 hours');
```

⚠️ **Attention**: Cela nécessiterait de modifier aussi le code de création de missions.

## 📝 Scripts SQL à Exécuter

### Dans l'ordre:

1. **`sql/fix_calendar_trigger_null_dates.sql`** (OBLIGATOIRE)
   - Corrige les triggers pour gérer les end_date NULL
   - Permet la création d'événements même sans end_date

2. **`sql/fix_missions_null_end_dates.sql`** (RECOMMANDÉ)
   - Corrige les missions existantes avec end_date NULL
   - Évite les problèmes avec les anciennes données

## ✅ Checklist de Vérification

- [ ] Script `fix_calendar_trigger_null_dates.sql` exécuté
- [ ] Script `fix_missions_null_end_dates.sql` exécuté
- [ ] Acceptation d'un devis fonctionne sans erreur
- [ ] Mission créée avec succès
- [ ] Événement calendrier créé automatiquement
- [ ] Événement visible dans la page Calendrier du prestataire
- [ ] end_date est défini (même si NULL dans mission)

## 🎯 Résultat Final

Après ces corrections:
- ✅ Les devis peuvent être acceptés sans erreur
- ✅ Les missions sont créées automatiquement
- ✅ Les événements calendrier sont créés automatiquement
- ✅ Le workflow complet fonctionne de bout en bout
- ✅ Les prestataires voient leurs missions dans le calendrier

## 📚 Fichiers Créés

- ✅ `sql/fix_calendar_trigger_null_dates.sql` - Correction du trigger
- ✅ `sql/fix_missions_null_end_dates.sql` - Correction des données
- ✅ `FIX_CALENDAR_NULL_END_DATE.md` - Cette documentation

## 🔗 Fichiers de Référence

- `sql/auto_create_calendar_events.sql` - Script original
- `CALENDRIER_AUTO_EVENTS.md` - Documentation du système
- `CALENDRIER_EVENTS_FIXED.md` - Corrections précédentes
