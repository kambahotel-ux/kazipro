# 🔄 Switch de Disponibilité - Guide

## Vue d'ensemble

Le prestataire peut maintenant **contrôler manuellement** sa disponibilité avec un switch élégant sur son dashboard.

## Fonctionnalités

### 1. Contrôle manuel
- ✅ Switch ON/OFF pour la disponibilité
- ✅ Mise à jour instantanée dans la base de données
- ✅ Notification toast de confirmation
- ✅ Animation fluide

### 2. Affichage visuel
- 🟢 **Disponible** - Carte verte avec icône CheckCircle
- ⚪ **Indisponible** - Carte grise avec icône XCircle
- 💫 Point vert animé quand disponible
- 📝 Description claire de l'état

### 3. Feedback utilisateur
- Toast de succès: "Vous êtes maintenant disponible"
- Toast d'info: "Vous êtes maintenant indisponible"
- Loader pendant la mise à jour
- État désactivé pendant l'update

## Composant créé

**Fichier:** `src/components/dashboard/AvailabilityToggle.tsx`

### Props
```typescript
interface AvailabilityToggleProps {
  providerId: string | null;
}
```

### États
- `isAvailable` - État actuel (disponible/indisponible)
- `loading` - Chargement initial
- `updating` - Mise à jour en cours

### Fonctions
- `fetchAvailability()` - Charge l'état depuis la BD
- `handleToggle(checked)` - Met à jour l'état

## Intégration

### Dashboard Prestataire

Le composant est déjà intégré dans `PrestataireDashboard.tsx`:

```typescript
import { AvailabilityToggle } from '@/components/dashboard/AvailabilityToggle';

// Dans le JSX, juste après le titre
<AvailabilityToggle providerId={providerId} />
```

### Position
Affiché en haut du dashboard, juste après le message de bienvenue et avant les statistiques.

## Design

### État Disponible (ON)
```
┌─────────────────────────────────────────┐
│ ✓  Vous êtes disponible          [ON]  │
│    Les clients peuvent voir que         │
│    vous êtes en ligne                   │
│ ─────────────────────────────────────── │
│ • Visible par les clients maintenant    │
└─────────────────────────────────────────┘
```
- Bordure verte
- Fond vert clair
- Icône CheckCircle verte
- Point vert animé

### État Indisponible (OFF)
```
┌─────────────────────────────────────────┐
│ ✕  Vous êtes indisponible       [OFF]  │
│    Les clients ne verront pas votre     │
│    statut en ligne                      │
└─────────────────────────────────────────┘
```
- Bordure grise
- Fond blanc
- Icône XCircle grise
- Pas d'animation

### Pendant la mise à jour
```
┌─────────────────────────────────────────┐
│ ⟳  Mise à jour...               [...]  │
│    Veuillez patienter                   │
└─────────────────────────────────────────┘
```
- Icône Loader2 animée
- Switch désactivé

## Comportement

### Au chargement
1. Affiche un skeleton loader
2. Charge l'état depuis `prestataires.is_online`
3. Affiche le switch avec l'état actuel

### Quand le prestataire toggle
1. Désactive le switch (évite les doubles clics)
2. Met à jour `is_online` et `last_seen` dans la BD
3. Affiche un toast de confirmation
4. Réactive le switch

### Synchronisation
- Le hook `useOnlineStatus` continue de fonctionner en arrière-plan
- Met à jour `last_seen` toutes les 2 minutes si disponible
- Le switch reflète toujours l'état réel

## Base de données

### Colonnes utilisées
```sql
prestataires:
- is_online BOOLEAN (état de disponibilité)
- last_seen TIMESTAMP (dernière activité)
```

### Requête UPDATE
```sql
UPDATE prestataires
SET 
  is_online = true/false,
  last_seen = NOW()
WHERE id = provider_id;
```

## Notifications Toast

### Disponible
```typescript
toast.success('Vous êtes maintenant disponible', {
  description: 'Les clients peuvent voir que vous êtes en ligne'
});
```

### Indisponible
```typescript
toast.info('Vous êtes maintenant indisponible', {
  description: 'Les clients ne verront pas votre statut en ligne'
});
```

### Erreur
```typescript
toast.error('Erreur lors de la mise à jour de votre disponibilité');
```

## Cas d'usage

### Prestataire occupé
1. Toggle OFF avant de partir
2. Les clients ne le voient plus en ligne
3. Pas de nouvelles demandes

### Prestataire disponible
1. Toggle ON en arrivant
2. Badge vert visible pour les clients
3. Reçoit plus de demandes

### Pause déjeuner
1. Toggle OFF temporairement
2. Revient et toggle ON
3. Reprend les demandes

## Avantages

✅ **Contrôle total** - Le prestataire décide quand être visible  
✅ **Simple** - Un seul clic pour changer  
✅ **Visuel** - État clair avec couleurs et icônes  
✅ **Feedback** - Notifications de confirmation  
✅ **Performant** - Mise à jour instantanée  
✅ **Fiable** - Gestion d'erreur complète  

## Combinaison avec le système automatique

### Système automatique (useOnlineStatus)
- Met à jour `last_seen` toutes les 2 minutes
- Détecte la fermeture de page
- Marque hors ligne après 5 min d'inactivité

### Switch manuel (AvailabilityToggle)
- Permet de forcer l'état ON/OFF
- Priorité sur le système automatique
- Utile pour les pauses volontaires

### Logique combinée
```
Si switch OFF:
  → Toujours indisponible (même si actif)
  
Si switch ON:
  → Disponible tant qu'actif
  → Hors ligne après 5 min d'inactivité
```

## Personnalisation

### Changer les couleurs
```typescript
// Dans AvailabilityToggle.tsx
className={`transition-all ${
  isAvailable 
    ? 'border-green-200 bg-green-50/50'  // Disponible
    : 'border-gray-200'                   // Indisponible
}`}
```

### Changer les messages
```typescript
{isAvailable 
  ? 'Vous êtes disponible'      // Message ON
  : 'Vous êtes indisponible'    // Message OFF
}
```

### Ajouter des statuts
Possibilité d'étendre avec:
- "Disponible"
- "Occupé"
- "En pause"
- "Absent"

## Résumé

✅ **Créé:** Composant AvailabilityToggle  
✅ **Intégré:** Dashboard prestataire  
✅ **Design:** Moderne avec animations  
✅ **Feedback:** Toasts de confirmation  
✅ **Synchronisé:** Avec système automatique  

**Le prestataire a maintenant le contrôle total de sa disponibilité!** 🎉
