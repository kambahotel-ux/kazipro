# 🔄 Guide Rapide - Switch de Disponibilité

## Ce qui a été ajouté

Un **switch élégant** sur le dashboard prestataire pour contrôler manuellement la disponibilité.

## Où le voir

1. Connectez-vous en tant que **prestataire**
2. Sur le dashboard, juste après "Bonjour, [Nom] 👋"
3. Vous verrez une carte avec un switch

## Comment l'utiliser

### Pour se rendre disponible
1. Cliquez sur le switch pour l'activer (ON)
2. La carte devient verte 🟢
3. Message: "Vous êtes maintenant disponible"
4. Les clients voient que vous êtes en ligne

### Pour se rendre indisponible
1. Cliquez sur le switch pour le désactiver (OFF)
2. La carte devient grise ⚪
3. Message: "Vous êtes maintenant indisponible"
4. Les clients ne voient plus votre statut en ligne

## États visuels

### 🟢 Disponible (ON)
```
┌─────────────────────────────────────┐
│ ✓  Vous êtes disponible      [ON]  │
│    Les clients peuvent voir que     │
│    vous êtes en ligne               │
│ ─────────────────────────────────── │
│ • Visible par les clients           │
└─────────────────────────────────────┘
```
- Carte verte
- Icône ✓ verte
- Point vert animé
- Switch activé

### ⚪ Indisponible (OFF)
```
┌─────────────────────────────────────┐
│ ✕  Vous êtes indisponible   [OFF]  │
│    Les clients ne verront pas       │
│    votre statut en ligne            │
└─────────────────────────────────────┘
```
- Carte grise
- Icône ✕ grise
- Switch désactivé

## Cas d'usage

### 1. Début de journée
- Arrivez au travail
- Activez le switch (ON)
- Les clients vous voient disponible

### 2. Pause déjeuner
- Désactivez le switch (OFF)
- Prenez votre pause tranquillement
- Réactivez après

### 3. Fin de journée
- Désactivez le switch (OFF)
- Fermez l'application
- Pas de demandes pendant la nuit

### 4. Urgence
- Désactivez rapidement (OFF)
- Gérez votre urgence
- Réactivez quand prêt

## Avantages

✅ **Contrôle total** - Vous décidez quand être visible  
✅ **Simple** - Un clic suffit  
✅ **Instantané** - Mise à jour immédiate  
✅ **Visuel** - État clair avec couleurs  
✅ **Notifications** - Confirmation à chaque changement  

## Combinaison avec le système automatique

### Système automatique
- Vous marque en ligne quand vous êtes actif
- Vous marque hors ligne après 5 min d'inactivité
- Fonctionne en arrière-plan

### Switch manuel
- **Priorité sur le système automatique**
- Si OFF → toujours indisponible
- Si ON → disponible tant que vous êtes actif

### Exemple
```
Switch OFF + Actif = Indisponible ❌
Switch ON + Actif = Disponible ✅
Switch ON + Inactif 5min = Indisponible ❌
```

## Notifications

### Quand vous activez
```
✓ Vous êtes maintenant disponible
  Les clients peuvent voir que vous êtes en ligne
```

### Quand vous désactivez
```
ℹ Vous êtes maintenant indisponible
  Les clients ne verront pas votre statut en ligne
```

## Fichiers créés

1. **src/components/dashboard/AvailabilityToggle.tsx**
   - Composant du switch
   - Gestion de l'état
   - Mise à jour BD

2. **Intégration dans PrestataireDashboard.tsx**
   - Affiché en haut du dashboard
   - Synchronisé avec providerId

## Prochaines étapes

1. **Testez le switch** sur votre dashboard
2. **Vérifiez** que les clients voient votre statut
3. **Utilisez-le** au quotidien pour gérer votre disponibilité

## Support

Tous les détails techniques sont dans `SWITCH_DISPONIBILITE.md`.

**Profitez de votre nouveau contrôle de disponibilité!** 🚀
