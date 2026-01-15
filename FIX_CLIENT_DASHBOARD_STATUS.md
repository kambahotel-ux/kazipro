# ✅ Fix Client Dashboard Status Display - SOLUTION COMPLÈTE

## Problème identifié
La table `demandes` a **DEUX colonnes de statut**:
- `status` - avec valeurs anglaises: `'active', 'completed', 'cancelled'`
- `statut` - avec valeurs françaises: `'en_attente', 'en_cours', 'terminee', 'annulee'`

Le code lisait la colonne `status` (anglais) au lieu de `statut` (français).

## Modifications apportées

### 1. Fichier: `src/pages/dashboard/client/ClientDashboard.tsx`

#### Correction des labels de statut
```typescript
const statusLabels = {
  en_attente: { label: "En attente", variant: "secondary" },
  en_cours: { label: "En cours", variant: "default" },
  terminee: { label: "Terminée", variant: "outline" },
  annulee: { label: "Annulée", variant: "default" },
};
```

#### Correction de la lecture des données
```typescript
// Use 'statut' column (French) not 'status' (English)
status: d.statut || "en_attente", // Changed from d.status
```

#### Correction du calcul des statistiques
```typescript
const enAttenteCount = requests.filter((r) => r.status === "en_attente").length;
const enCoursCount = requests.filter((r) => r.status === "en_cours").length;
const termineeCount = requests.filter((r) => r.status === "terminee").length;
const activeCount = enAttenteCount + enCoursCount;

setStats({
  active: activeCount,
  pending: enAttenteCount,
  inProgress: enCoursCount,
  completed: termineeCount,
});
```

### 2. Fichier: `src/pages/dashboard/client/DemandesPage.tsx`

#### Changements effectués:
- Interface `Demande`: `status: string` → `statut: string`
- Filtres: `filters.status` → `filters.statut`
- Tous les filtres: `.filter(d => d.status === ...)` → `.filter(d => d.statut === ...)`
- Onglets: `"active"` → `"en_attente"`, `"completed"` → `"terminee"`, etc.
- Labels des badges: "Actif" → "En attente", "Complétée" → "Terminée"
- Calcul des stats basé sur `statut` au lieu de `status`

### 3. Script SQL: `sql/fix_demandes_statut_column.sql`

Ce script:
1. Vérifie les valeurs actuelles dans les deux colonnes
2. Copie et mappe les valeurs de `status` vers `statut` si nécessaire
3. S'assure que toutes les demandes ont un statut français valide
4. Affiche le résultat final

## Actions à effectuer

### 1. Exécuter le script SQL
Ouvrez Supabase SQL Editor et exécutez:
```sql
sql/fix_demandes_statut_column.sql
```

### 2. Vider le cache du navigateur
`Cmd + Shift + R` (Mac) ou `Ctrl + Shift + R` (Windows/Linux)

### 3. Recharger l'application
Les statuts devraient maintenant s'afficher correctement en français.

## Résultat attendu
✅ Les statuts s'affichent en français: "En attente", "En cours", "Terminée", "Annulée"
✅ Le compteur "En cours" affiche le bon nombre (demandes avec `statut = 'en_cours'`)
✅ Le compteur "En attente de devis" affiche les demandes avec `statut = 'en_attente'`
✅ Le compteur "Terminées" affiche les demandes avec `statut = 'terminee'`
✅ Les onglets dans DemandesPage fonctionnent correctement
✅ Les filtres par statut fonctionnent

## Statuts de la base de données
- `en_attente` - En attente de devis/réponse
- `en_cours` - En cours d'exécution
- `terminee` - Terminée
- `annulee` - Annulée

