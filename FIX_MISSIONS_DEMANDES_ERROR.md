# 🔧 FIX: Erreur "Could not find relationship between missions and demandes"

## ❌ ERREUR

```
Could not find a relationship between 'missions' and 'demandes' in the schema cache
```

## ✅ SOLUTION RAPIDE

**Exécutez ce script SQL**: `sql/add_demande_id_to_missions.sql`

Ce script va:
1. Ajouter la colonne `demande_id` à la table `missions`
2. Remplir automatiquement les données existantes
3. Créer la foreign key
4. Créer un index pour performance
5. Créer un trigger pour maintenir la synchronisation

---

## 📋 ÉTAPES

### 1. Ouvrir Supabase SQL Editor

### 2. Exécuter le script

Copier-coller le contenu de `sql/add_demande_id_to_missions.sql` et cliquer "Run"

### 3. Vérifier

```sql
-- Vérifier que la colonne existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'missions' AND column_name = 'demande_id';

-- Vérifier que les données sont remplies
SELECT id, devis_id, demande_id 
FROM missions 
LIMIT 5;
```

### 4. Recharger votre page

L'erreur devrait disparaître!

---

## 🎯 POURQUOI CETTE ERREUR?

### Structure actuelle

Avant:
```
missions → devis → demandes
```

Il n'y avait pas de lien direct entre `missions` et `demandes`.

### Après le fix

Après:
```
missions → demandes (direct)
missions → devis → demandes (via devis)
```

Maintenant vous pouvez faire:
```typescript
const { data } = await supabase
  .from('missions')
  .select('*, demandes(*)')  // ✅ Fonctionne!
```

---

## 📝 DÉTAILS TECHNIQUES

### Colonne ajoutée

```sql
demande_id UUID REFERENCES demandes(id) ON DELETE SET NULL
```

### Trigger de synchronisation

Quand vous créez ou modifiez une mission avec un `devis_id`, le `demande_id` est automatiquement rempli depuis le devis.

```sql
CREATE TRIGGER trigger_sync_mission_demande_id
BEFORE INSERT OR UPDATE OF devis_id ON missions
FOR EACH ROW
EXECUTE FUNCTION sync_mission_demande_id();
```

---

## ✅ APRÈS LE FIX

Vous pourrez:
- ✅ Charger missions avec demandes directement
- ✅ Filtrer missions par demande
- ✅ Faire des requêtes plus simples
- ✅ Meilleures performances (pas besoin de double join)

---

## 🚀 EXÉCUTEZ MAINTENANT

```bash
# 1. Ouvrir Supabase SQL Editor
# 2. Copier-coller sql/add_demande_id_to_missions.sql
# 3. Cliquer "Run"
# 4. Recharger votre page
```

**Temps estimé**: 30 secondes ⚡

---

**Prêt? Exécutez le script!** 🚀
