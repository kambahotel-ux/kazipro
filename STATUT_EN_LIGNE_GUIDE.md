# 🟢 Système de Statut En Ligne - Guide Complet

## Vue d'ensemble

Le système de statut en ligne permet de savoir quels prestataires sont actuellement actifs sur la plateforme.

## Fonctionnalités

### 1. Mise à jour automatique
- ✅ Le prestataire est marqué "en ligne" dès qu'il se connecte
- ✅ Mise à jour toutes les 2 minutes tant qu'il est actif
- ✅ Marqué "hors ligne" automatiquement après 5 minutes d'inactivité
- ✅ Marqué "hors ligne" quand il ferme la page

### 2. Affichage du statut
- 🟢 Badge "En ligne" avec point vert animé
- ⚪ Badge "Hors ligne" avec temps écoulé
- 📊 Compteur de prestataires en ligne

### 3. Visibilité
- Clients peuvent voir quels prestataires sont disponibles
- Admin peut voir les statistiques en temps réel
- Prestataires voient leur propre statut

## Installation

### Étape 1: Exécuter le script SQL

```bash
# Dans Supabase SQL Editor, exécutez:
sql/add_online_status.sql
```

Ce script va:
1. Ajouter les colonnes `is_online` et `last_seen`
2. Créer les index pour les performances
3. Créer les fonctions de gestion
4. Configurer les permissions RLS

### Étape 2: Vérifier l'installation

```sql
-- Vérifier que les colonnes existent
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'prestataires' 
AND column_name IN ('is_online', 'last_seen');

-- Voir les statistiques
SELECT * FROM online_providers_stats;
```

## Utilisation

### Pour les Prestataires

Le statut est géré **automatiquement** dès qu'ils se connectent à leur dashboard.

```typescript
// Dans PrestataireDashboard.tsx
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export default function PrestataireDashboard() {
  const [providerId, setProviderId] = useState<string | null>(null);
  
  // Active automatiquement le statut en ligne
  useOnlineStatus(providerId);
  
  // ... reste du code
}
```

### Pour afficher le compteur

```typescript
// Dans n'importe quel dashboard
import { OnlineProvidersCount } from '@/components/dashboard/OnlineProvidersCount';

<OnlineProvidersCount />
```

### Pour afficher le badge de statut

```typescript
import { OnlineStatusBadge } from '@/components/providers/OnlineStatusBadge';

<OnlineStatusBadge 
  isOnline={provider.is_online} 
  lastSeen={provider.last_seen} 
/>
```

## Composants créés

### 1. `useOnlineStatus` Hook
**Fichier:** `src/hooks/useOnlineStatus.ts`

Gère automatiquement le statut en ligne:
- Met à jour toutes les 2 minutes
- Détecte la fermeture de la page
- Détecte le changement d'onglet

### 2. `OnlineProvidersCount` Component
**Fichier:** `src/components/dashboard/OnlineProvidersCount.tsx`

Affiche le nombre de prestataires en ligne:
- Mise à jour toutes les 30 secondes
- Design avec badge vert animé
- Skeleton loader pendant le chargement

### 3. `OnlineStatusBadge` Component
**Fichier:** `src/components/providers/OnlineStatusBadge.tsx`

Badge de statut réutilisable:
- 🟢 "En ligne" avec animation
- ⚪ "Il y a X min/h/j" pour hors ligne
- Calcul automatique du temps écoulé

## Schéma de la base de données

```sql
ALTER TABLE prestataires ADD COLUMN:
- is_online BOOLEAN DEFAULT false
- last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()

INDEX:
- idx_prestataires_online ON (is_online, last_seen)

FUNCTIONS:
- update_provider_online_status(provider_id, online)
- mark_inactive_providers_offline()

VIEW:
- online_providers_stats (online_count, total_verified, online_verified)
```

## Logique de détection

### Marqué "En ligne" quand:
1. Le prestataire se connecte au dashboard
2. Il interagit avec la plateforme
3. Toutes les 2 minutes (heartbeat automatique)

### Marqué "Hors ligne" quand:
1. Il ferme la page/onglet
2. Pas d'activité depuis 5 minutes
3. Il change d'onglet (optionnel)

## Requêtes utiles

### Compter les prestataires en ligne
```sql
SELECT COUNT(*) 
FROM prestataires 
WHERE is_online = true AND verified = true;
```

### Voir tous les prestataires en ligne
```sql
SELECT id, full_name, profession, last_seen
FROM prestataires
WHERE is_online = true
ORDER BY last_seen DESC;
```

### Voir l'activité récente
```sql
SELECT 
  full_name,
  profession,
  is_online,
  last_seen,
  NOW() - last_seen as inactive_duration
FROM prestataires
WHERE verified = true
ORDER BY last_seen DESC
LIMIT 20;
```

## Intégration dans les pages

### Page d'accueil
```typescript
// Afficher le nombre de prestataires en ligne
const { data } = await supabase
  .from('prestataires')
  .select('*', { count: 'exact', head: true })
  .eq('is_online', true)
  .eq('verified', true);

// Afficher: "X prestataires en ligne maintenant"
```

### Liste de prestataires
```typescript
// Charger avec le statut
const { data } = await supabase
  .from('prestataires')
  .select('*, is_online, last_seen')
  .eq('verified', true);

// Afficher le badge pour chaque prestataire
{providers.map(provider => (
  <div>
    <h3>{provider.full_name}</h3>
    <OnlineStatusBadge 
      isOnline={provider.is_online}
      lastSeen={provider.last_seen}
    />
  </div>
))}
```

### Dashboard Admin
```typescript
// Afficher les statistiques
<OnlineProvidersCount />

// Filtrer par statut
const onlineProviders = providers.filter(p => p.is_online);
```

## Performance

### Optimisations appliquées:
- ✅ Index sur `(is_online, last_seen)`
- ✅ Mise à jour par batch (toutes les 2 min)
- ✅ Requêtes avec `head: true` pour les counts
- ✅ Cleanup automatique des inactifs

### Charge estimée:
- 100 prestataires actifs = ~50 requêtes/min
- Négligeable pour Supabase

## Maintenance

### Nettoyer les statuts manuellement
```sql
-- Marquer tous comme hors ligne
UPDATE prestataires SET is_online = false;

-- Marquer les inactifs comme hors ligne
SELECT mark_inactive_providers_offline();
```

### Monitoring
```sql
-- Voir les statistiques
SELECT * FROM online_providers_stats;

-- Voir l'historique d'activité
SELECT 
  DATE_TRUNC('hour', last_seen) as hour,
  COUNT(*) FILTER (WHERE is_online) as online_count
FROM prestataires
WHERE last_seen > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

## Améliorations futures possibles

1. **Historique d'activité**
   - Table `provider_activity_log`
   - Graphiques de présence

2. **Notifications**
   - Alerter les clients quand un prestataire se connecte
   - "X prestataires disponibles pour votre demande"

3. **Statuts personnalisés**
   - "Disponible", "Occupé", "Absent"
   - Message de statut personnalisé

4. **Temps de réponse moyen**
   - Calculer le délai de réponse
   - Badge "Répond en < 1h"

## Résumé

✅ **Installation:** 1 script SQL  
✅ **Utilisation:** Automatique pour les prestataires  
✅ **Affichage:** 2 composants réutilisables  
✅ **Performance:** Optimisé avec index  
✅ **Maintenance:** Cleanup automatique  

**Le système est prêt à l'emploi!** 🚀
