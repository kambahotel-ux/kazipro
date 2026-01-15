# Correction - Colonne missions.statut → missions.status

## 🎯 Problème Identifié

**Erreur:** `column missions.statut does not exist`

Le code utilisait `missions.statut` mais la table `missions` utilise la colonne `status` (en anglais) selon le schéma initial.

## 📊 Schéma de la Table Missions

Selon `sql/init_tables.sql`:
```sql
CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devis_id UUID NOT NULL REFERENCES devis(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  prestataire_id UUID NOT NULL REFERENCES prestataires(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),  -- ✅ Colonne 'status'
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## ✅ Correction Appliquée

### Fichier: `src/pages/dashboard/admin/AdminDashboard.tsx`

**AVANT (Cassé):**
```typescript
const { data: missionsData } = await supabase
  .from("missions")
  .select("statut");  // ❌ Colonne n'existe pas

const statusCounts: { [key: string]: number } = {
  "En cours": 0,      // ❌ Valeurs en français
  "Terminée": 0,
  "Annulée": 0,
};

(missionsData || []).forEach((mission) => {
  if (statusCounts[mission.statut] !== undefined) {  // ❌
    statusCounts[mission.statut]++;
  }
});

const statusData: MissionStatusData[] = [
  { name: "En cours", value: statusCounts["En cours"], color: "#3b82f6" },
  { name: "Terminée", value: statusCounts["Terminée"], color: "#10b981" },
  { name: "Annulée", value: statusCounts["Annulée"], color: "#ef4444" },
];
```

**APRÈS (Corrigé):**
```typescript
const { data: missionsData } = await supabase
  .from("missions")
  .select("status");  // ✅ Colonne correcte

const statusCounts: { [key: string]: number } = {
  "in_progress": 0,   // ✅ Valeurs en anglais (DB)
  "completed": 0,
  "cancelled": 0,
};

(missionsData || []).forEach((mission) => {
  if (statusCounts[mission.status] !== undefined) {  // ✅
    statusCounts[mission.status]++;
  }
});

const statusData: MissionStatusData[] = [
  { name: "En cours", value: statusCounts["in_progress"], color: "#3b82f6" },  // ✅ Labels FR, valeurs EN
  { name: "Terminée", value: statusCounts["completed"], color: "#10b981" },
  { name: "Annulée", value: statusCounts["cancelled"], color: "#ef4444" },
];
```

## 📋 Valeurs de Status dans la Base de Données

### Table: missions
- `pending` - Mission en attente
- `in_progress` - Mission en cours
- `completed` - Mission terminée
- `cancelled` - Mission annulée

### Table: devis
- `brouillon` - Devis en brouillon
- `en_attente` - Devis en attente
- `envoye` - Devis envoyé
- `accepte` - Devis accepté
- `refuse` - Devis refusé
- `expire` - Devis expiré

### Table: demandes
- `active` - Demande active
- `pending` - Demande en attente
- `in_progress` - Demande en cours
- `completed` - Demande terminée
- `cancelled` - Demande annulée

## 🔍 Vérification des Autres Tables

### Tables utilisant "status" (anglais)
- ✅ `missions.status`
- ✅ `demandes.status`
- ✅ `devis.status` (colonne de compatibilité)
- ✅ `paiements.status`

### Tables utilisant "statut" (français)
- ✅ `devis.statut` (colonne principale)
- ✅ `demandes.statut` (colonne ajoutée)

## 📝 Convention de Nommage

### Recommandation
Pour éviter la confusion, il faudrait standardiser:

**Option 1: Tout en anglais (recommandé pour API)**
- `status` partout
- Valeurs: `pending`, `in_progress`, `completed`, `cancelled`

**Option 2: Tout en français**
- `statut` partout
- Valeurs: `en_attente`, `en_cours`, `termine`, `annule`

**État actuel: Mixte** (à cause de l'évolution du projet)
- Certaines tables utilisent `status` (missions, paiements)
- D'autres utilisent `statut` (devis)
- Certaines ont les deux pour compatibilité

## ✅ Checklist de Test

- [ ] Le dashboard admin charge sans erreur
- [ ] Les statistiques de missions s'affichent
- [ ] Le graphique de distribution des statuts fonctionne
- [ ] Aucune erreur `column does not exist` dans la console

## 📄 Fichiers Modifiés

- `src/pages/dashboard/admin/AdminDashboard.tsx` - Correction de la requête missions

## 🚀 Prochaines Actions

Si d'autres erreurs similaires apparaissent, vérifier:
1. Le nom de la colonne dans le schéma SQL
2. Les valeurs possibles (constraint CHECK)
3. La cohérence entre le code et la base de données

## ✅ Status

**CORRECTION APPLIQUÉE** - La colonne `missions.status` est maintenant utilisée correctement dans le dashboard admin.
