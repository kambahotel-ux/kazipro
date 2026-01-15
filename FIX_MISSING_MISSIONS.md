# Fix Missing Missions - Guide Complet

## 🔍 PROBLÈME IDENTIFIÉ

Tu as des demandes avec:
- `status: "in_progress"` 
- `devis_accepte_id` rempli (devis accepté)
- **MAIS aucune mission créée dans la table `missions`**

### Exemple:
```json
{
  "id": "48d1db7c-f9dd-4389-adc5-755f114f50e1",
  "status": "in_progress",
  "devis_accepte_id": "1ffb54d6-73ca-471a-90fc-3682a51c7f18"
}
```

**Résultat**: Le prestataire ne voit pas cette mission dans sa page "Missions" car elle n'existe pas dans la table `missions`.

---

## 🎯 SOLUTION

Il faut **créer automatiquement une mission** quand un devis est accepté.

### Workflow correct:

```
Client accepte devis
       ↓
1. UPDATE devis SET statut='accepte'
2. UPDATE demandes SET status='in_progress', devis_accepte_id=devis.id
3. INSERT INTO missions ← MANQUANT! ❌
```

---

## 🔧 SCRIPTS SQL À EXÉCUTER

### Script 1: Créer les missions manquantes (URGENT)
**Fichier**: `sql/create_missing_missions.sql`

Ce script va:
- Trouver toutes les demandes avec `devis_accepte_id` rempli
- Vérifier si une mission existe déjà
- Créer les missions manquantes avec le bon statut

**À exécuter MAINTENANT** pour corriger les données existantes.

```sql
-- Crée les missions pour tous les devis acceptés qui n'ont pas de mission
INSERT INTO missions (devis_id, client_id, prestataire_id, status, start_date)
SELECT 
  d.id,
  dem.client_id,
  d.prestataire_id,
  CASE 
    WHEN dem.status = 'in_progress' THEN 'in_progress'
    WHEN dem.status = 'completed' THEN 'completed'
    ELSE 'pending'
  END,
  d.updated_at
FROM demandes dem
INNER JOIN devis d ON d.id = dem.devis_accepte_id
WHERE dem.devis_accepte_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM missions m WHERE m.devis_id = d.id);
```

---

### Script 2: Ajouter demande_id à missions (RECOMMANDÉ)
**Fichier**: `sql/add_demande_id_to_missions.sql`

Ce script va:
- Ajouter la colonne `demande_id` à la table `missions`
- Remplir les valeurs depuis la table `devis`
- Créer un trigger pour maintenir la synchronisation

**Avantage**: Permet de faire des requêtes plus simples:
```typescript
// Avant (compliqué)
.select('*, devis(*, demandes(*))')

// Après (simple)
.select('*, demandes(*)')
```

---

### Script 3: Auto-créer mission quand devis accepté (IMPORTANT)
**Fichier**: `sql/auto_create_mission_on_devis_accept.sql`

Ce script va:
- Créer un trigger sur la table `devis`
- Quand `statut` passe à `'accepte'`, créer automatiquement une mission
- Éviter les doublons

**Résultat**: À l'avenir, les missions seront créées automatiquement!

---

## 📋 ORDRE D'EXÉCUTION

Exécute les scripts dans cet ordre:

1. ✅ **`sql/add_demande_id_to_missions.sql`** (optionnel mais recommandé)
   - Ajoute la colonne demande_id
   - Facilite les requêtes

2. ✅ **`sql/create_missing_missions.sql`** (URGENT)
   - Crée les missions manquantes
   - Corrige les données existantes

3. ✅ **`sql/auto_create_mission_on_devis_accept.sql`** (IMPORTANT)
   - Installe le trigger automatique
   - Évite le problème à l'avenir

---

## 🧪 VÉRIFICATION

Après avoir exécuté les scripts:

### 1. Vérifier que les missions ont été créées:
```sql
SELECT 
  m.id as mission_id,
  m.status as mission_status,
  dem.titre as demande_titre,
  d.numero as devis_numero,
  p.full_name as prestataire_name
FROM missions m
INNER JOIN devis d ON d.id = m.devis_id
INNER JOIN demandes dem ON dem.devis_accepte_id = d.id
INNER JOIN prestataires p ON p.id = m.prestataire_id
ORDER BY m.created_at DESC;
```

### 2. Tester côté prestataire:
- Login en tant que prestataire
- Aller sur la page "Missions"
- Vérifier que les missions apparaissent

### 3. Tester l'auto-création:
- Login en tant que client
- Accepter un nouveau devis
- Vérifier qu'une mission est créée automatiquement
- Login en tant que prestataire
- Vérifier que la mission apparaît immédiatement

---

## 🔄 STRUCTURE DE LA TABLE MISSIONS

```sql
CREATE TABLE missions (
  id UUID PRIMARY KEY,
  devis_id UUID NOT NULL REFERENCES devis(id),
  demande_id UUID REFERENCES demandes(id),  -- Ajouté par script 2
  client_id UUID NOT NULL REFERENCES clients(id),
  prestataire_id UUID NOT NULL REFERENCES prestataires(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📊 MAPPING DES STATUTS

### Demande → Mission

| Statut Demande | Statut Mission | Description |
|----------------|----------------|-------------|
| `active` | - | Pas encore de mission |
| `in_progress` | `in_progress` | Travail en cours |
| `completed` | `completed` | Travail terminé |
| `cancelled` | `cancelled` | Annulé |

---

## 🎯 RÉSULTAT ATTENDU

Après correction:

✅ Toutes les demandes avec `devis_accepte_id` ont une mission correspondante
✅ Les prestataires voient leurs missions dans la page "Missions"
✅ Les nouvelles acceptations de devis créent automatiquement une mission
✅ Le workflow complet fonctionne: Demande → Devis → Mission → Paiement

---

## 🚨 NOTES IMPORTANTES

1. **RLS Policies**: Assure-toi que les policies sur `missions` permettent:
   - Prestataires: SELECT leurs propres missions
   - Clients: SELECT leurs propres missions
   - Admin: SELECT toutes les missions

2. **Trigger**: Le trigger s'exécute sur `UPDATE devis` quand `statut='accepte'`

3. **Doublons**: Les scripts vérifient qu'une mission n'existe pas déjà avant d'en créer une

4. **Performance**: Un index est créé sur `missions.demande_id` pour optimiser les requêtes

---

## 📝 PROCHAINES ÉTAPES

Après avoir corrigé les missions:

1. Tester le workflow complet client → prestataire
2. Vérifier que les notifications fonctionnent
3. Implémenter la page de détail de mission
4. Ajouter le suivi de progression (photos, commentaires)
5. Implémenter le système de paiement
