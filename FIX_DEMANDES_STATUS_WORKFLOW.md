# ✅ Fix Demandes Status Workflow - SOLUTION FINALE

## Problème identifié
La table `demandes` utilise la colonne `status` (pas `statut`) avec des valeurs anglaises:
- `active` - Demande créée, en attente de devis
- `in_progress` - Devis accepté, travaux en cours
- `completed` - Travaux terminés
- `cancelled` - Demande annulée

**Le problème:** Quand un devis est accepté et que le prestataire démarre les travaux, le statut de la demande reste `active` au lieu de passer à `in_progress`.

## Solution implémentée

### 1. Trigger automatique (SQL)
**Fichier:** `sql/fix_demandes_workflow_status.sql`

Ce script crée un trigger qui:
- Met à jour automatiquement `demandes.status = 'in_progress'` quand un devis est accepté
- Corrige les demandes existantes qui ont des devis acceptés mais sont encore en `active`

### 2. Corrections du code frontend

#### `ClientDashboard.tsx`
- Labels de statut mappés correctement:
  - `active` → "En attente"
  - `in_progress` → "En cours"
  - `completed` → "Terminée"
  - `cancelled` → "Annulée"
- Calcul des stats:
  - "En attente de devis": `status = 'active'`
  - "En cours": `status = 'in_progress'`
  - "Terminées": `status = 'completed'`
  - "Demandes actives": total de `active` + `in_progress`

#### `DemandesPage.tsx`
- Interface `Demande` utilise `status: string`
- Filtres utilisent `filters.status`
- Onglets:
  - "En attente" → `status = 'active'`
  - "En cours" → `status = 'in_progress'`
  - "Terminées" → `status = 'completed'`
  - "Annulées" → `status = 'cancelled'`

## Actions à effectuer

### 1. Exécuter le script SQL
```bash
# Dans Supabase SQL Editor
sql/fix_demandes_workflow_status.sql
```

Ce script va:
1. Créer le trigger automatique
2. Mettre à jour les demandes existantes qui ont des devis acceptés
3. Afficher un rapport des demandes et leurs statuts

### 2. Vider le cache
`Cmd + Shift + R` (Mac) ou `Ctrl + Shift + R` (Windows/Linux)

### 3. Tester le workflow
1. Créer une nouvelle demande → `status = 'active'` → Affiche "En attente"
2. Accepter un devis → `status = 'in_progress'` → Affiche "En cours"
3. Terminer les travaux → `status = 'completed'` → Affiche "Terminée"

## Workflow complet

```
1. Client crée une demande
   └─> demandes.status = 'active'
   └─> Dashboard affiche: "En attente de devis"

2. Prestataire envoie un devis
   └─> devis.statut = 'en_attente'
   └─> Demande reste 'active'

3. Client accepte le devis
   └─> devis.statut = 'accepte'
   └─> TRIGGER: demandes.status = 'in_progress'
   └─> Dashboard affiche: "En cours"
   └─> Mission créée automatiquement

4. Prestataire termine les travaux
   └─> missions.status = 'completed'
   └─> demandes.status = 'completed'
   └─> Dashboard affiche: "Terminée"
```

## Résultat attendu

✅ Quand un devis est accepté, la demande passe automatiquement à "En cours"
✅ Le compteur "En cours" affiche le bon nombre
✅ Le compteur "En attente de devis" affiche uniquement les demandes sans devis accepté
✅ Les onglets dans DemandesPage fonctionnent correctement
✅ Le workflow reflète l'état réel des demandes

## Valeurs de la base de données

### Table: demandes
- `status` = `'active'` → En attente de devis
- `status` = `'in_progress'` → Travaux en cours
- `status` = `'completed'` → Terminée
- `status` = `'cancelled'` → Annulée

### Table: devis
- `statut` = `'en_attente'` → En attente de réponse client
- `statut` = `'accepte'` → Accepté par le client
- `statut` = `'refuse'` → Refusé par le client

### Table: missions
- `status` = `'pending'` → En attente de démarrage
- `status` = `'in_progress'` → En cours
- `status` = `'completed'` → Terminée
- `status` = `'cancelled'` → Annulée
