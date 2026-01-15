# 🟢 Installation du Statut En Ligne

## Ce qui a été créé

### 1. Script SQL
**Fichier:** `sql/add_online_status.sql`
- Ajoute les colonnes `is_online` et `last_seen`
- Crée les fonctions de gestion automatique
- Configure les permissions

### 2. Hook React
**Fichier:** `src/hooks/useOnlineStatus.ts`
- Gère automatiquement le statut en ligne
- Mise à jour toutes les 2 minutes
- Détecte la fermeture de la page

### 3. Composants d'affichage
- `OnlineProvidersCount` - Compteur de prestataires en ligne
- `OnlineStatusBadge` - Badge de statut (en ligne/hors ligne)

### 4. Intégration
- Dashboard prestataire utilise automatiquement le hook
- Prêt à afficher sur les autres pages

## Installation en 3 étapes

### Étape 1: Exécuter le SQL

1. Ouvrez Supabase → SQL Editor
2. Copiez tout le contenu de `sql/add_online_status.sql`
3. Collez et cliquez sur "RUN"

### Étape 2: Vérifier

Exécutez cette requête pour vérifier:
```sql
SELECT * FROM online_providers_stats;
```

Vous devriez voir:
- `online_count`: 0 (normal, personne n'est connecté)
- `total_verified`: nombre de prestataires vérifiés
- `online_verified`: 0

### Étape 3: Tester

1. Connectez-vous en tant que prestataire
2. Le statut passe automatiquement à "en ligne"
3. Fermez la page → statut passe à "hors ligne"

## Comment ça marche

### Pour les prestataires
**Automatique!** Dès qu'ils ouvrent leur dashboard:
- ✅ Marqués "en ligne"
- ✅ Mise à jour toutes les 2 minutes
- ✅ Marqués "hors ligne" après 5 min d'inactivité

### Pour les clients
Peuvent voir:
- 🟢 Badge "En ligne" sur les prestataires disponibles
- ⚪ "Il y a X min" pour les récemment actifs
- 📊 Nombre total de prestataires en ligne

### Pour l'admin
Peut voir:
- 📊 Statistiques en temps réel
- 👥 Liste des prestataires en ligne
- 📈 Activité de la plateforme

## Affichage du compteur

Pour afficher le nombre de prestataires en ligne:

```typescript
import { OnlineProvidersCount } from '@/components/dashboard/OnlineProvidersCount';

// Dans votre composant
<OnlineProvidersCount />
```

Résultat:
```
┌─────────────────────────────┐
│ 👥  Prestataires en ligne   │
│     12  🟢 En ligne         │
└─────────────────────────────┘
```

## Affichage du badge

Pour afficher le statut d'un prestataire:

```typescript
import { OnlineStatusBadge } from '@/components/providers/OnlineStatusBadge';

<OnlineStatusBadge 
  isOnline={provider.is_online} 
  lastSeen={provider.last_seen} 
/>
```

Résultats possibles:
- 🟢 **En ligne** (avec point vert animé)
- ⚪ **Il y a 5 min**
- ⚪ **Il y a 2h**
- ⚪ **Il y a 3j**
- ⚪ **Hors ligne**

## Où l'utiliser

### 1. Page d'accueil
Afficher: "X prestataires en ligne maintenant"

### 2. Liste de services
Badge sur chaque prestataire

### 3. Dashboard admin
Statistiques et monitoring

### 4. Dashboard client
Voir les prestataires disponibles

## Avantages

✅ **Transparence** - Les clients voient qui est disponible  
✅ **Confiance** - Prestataires actifs = réponse rapide  
✅ **Statistiques** - Admin voit l'activité en temps réel  
✅ **Automatique** - Aucune action requise des prestataires  
✅ **Performant** - Optimisé avec index  

## Prochaines étapes

1. **Exécutez le SQL** dans Supabase
2. **Testez** en vous connectant comme prestataire
3. **Ajoutez le compteur** sur la page d'accueil
4. **Ajoutez les badges** sur les listes de prestataires

**C'est tout!** Le système fonctionne automatiquement. 🎉

## Support

Tous les détails techniques sont dans `STATUT_EN_LIGNE_GUIDE.md`.
