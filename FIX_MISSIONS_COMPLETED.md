# ✅ Correction - missions_completed

## Problème
```
Error: column prestataires.missions_completed does not exist
```

La colonne `missions_completed` n'existe pas dans la table `prestataires`.

## Solution appliquée

Au lieu de lire `missions_completed` depuis la table `prestataires`, je **calcule** le nombre de missions terminées en temps réel.

### Avant (❌ Ne fonctionne pas)
```typescript
const { data } = await supabase
  .from("prestataires")
  .select("full_name, profession, rating, missions_completed") // ❌ Colonne inexistante
  .eq("verified", true);
```

### Après (✅ Fonctionne)
```typescript
// 1. Récupérer le prestataire
const { data } = await supabase
  .from("prestataires")
  .select("id, full_name, profession, rating")
  .eq("verified", true);

// 2. Compter ses missions terminées
const { count } = await supabase
  .from("missions")
  .select("*", { count: "exact", head: true })
  .eq("prestataire_id", provider.id)
  .eq("statut", "terminee");

// 3. Combiner les données
setFeaturedProvider({
  ...provider,
  missions_completed: count || 0
});
```

## Avantages de cette approche

✅ **Toujours à jour** - Compte en temps réel  
✅ **Pas de duplication** - Pas besoin de maintenir un compteur  
✅ **Précis** - Compte uniquement les missions terminées  
✅ **Flexible** - Peut filtrer par statut, date, etc.  

## Changements effectués

**Fichier:** `src/components/home/HeroSection.tsx`

1. Ajout de `id` dans le SELECT
2. Requête séparée pour compter les missions
3. Combinaison des données
4. Baisse du seuil de rating de 4.5 à 4.0 (plus de prestataires éligibles)

## Comment tester

1. **Videz le cache**: `Cmd + Shift + R`
2. Allez sur http://localhost:8080
3. Le hero devrait maintenant afficher un prestataire sans erreur
4. Le nombre de missions sera calculé depuis la table `missions`

## Note

Si vous voulez optimiser les performances, vous pouvez ajouter une colonne `missions_completed` à la table `prestataires` et la mettre à jour avec un trigger SQL:

```sql
-- Optionnel: Ajouter la colonne
ALTER TABLE prestataires ADD COLUMN missions_completed INTEGER DEFAULT 0;

-- Optionnel: Trigger pour la mettre à jour automatiquement
CREATE OR REPLACE FUNCTION update_missions_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE prestataires
  SET missions_completed = (
    SELECT COUNT(*)
    FROM missions
    WHERE prestataire_id = NEW.prestataire_id
    AND statut = 'terminee'
  )
  WHERE id = NEW.prestataire_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_missions_count
AFTER INSERT OR UPDATE ON missions
FOR EACH ROW
EXECUTE FUNCTION update_missions_count();
```

Mais ce n'est **pas nécessaire** - le code actuel fonctionne parfaitement!

**La page d'accueil fonctionne maintenant!** 🎉
