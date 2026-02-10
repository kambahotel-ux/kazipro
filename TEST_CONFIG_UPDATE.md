# 🔧 TEST DE LA CONFIGURATION PAIEMENT

## Problème actuel
L'UPDATE de la configuration affiche "Configuration enregistrée avec succès" mais les valeurs ne changent pas dans la base de données.

## Étapes de diagnostic

### 1. Exécuter le script SQL de fix complet
```bash
# Dans Supabase SQL Editor, exécute:
FIX_CONFIG_UPDATE_COMPLET.sql
```

Ce script va:
- ✅ Vérifier que la ligne de config existe
- ✅ Supprimer TOUTES les anciennes policies RLS
- ✅ Créer des policies permissives pour le dev
- ✅ Tester l'UPDATE
- ✅ Afficher l'état final

### 2. Vérifier dans la console du navigateur
Après avoir exécuté le script, va sur la page admin:
```
http://localhost:5173/dashboard/admin/config-paiement
```

Ouvre la console du navigateur (F12) et tu devrais voir:
- `💾 Tentative de sauvegarde...` avec les données
- `✅ UPDATE réussi, données retournées:` avec les nouvelles valeurs
- `✅ Configuration rechargée`

### 3. Causes possibles si ça ne marche toujours pas

#### A. La ligne n'existe pas
```sql
-- Vérifier dans Supabase:
SELECT * FROM configuration_paiement_globale;
```

Si vide, exécute:
```sql
INSERT INTO configuration_paiement_globale (id) 
VALUES ('00000000-0000-0000-0000-000000000001');
```

#### B. RLS bloque l'UPDATE
```sql
-- Vérifier les policies:
SELECT * FROM pg_policies 
WHERE tablename = 'configuration_paiement_globale';
```

Tu devrais voir:
- `allow_read_config` (SELECT)
- `allow_update_config` (UPDATE)

#### C. L'utilisateur n'est pas authentifié
Dans la console du navigateur:
```javascript
// Vérifier l'auth
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);
```

Si `user` est null, tu n'es pas connecté!

#### D. Le .eq() ne trouve pas la ligne
```javascript
// Test direct dans la console:
const { data, error } = await supabase
  .from('configuration_paiement_globale')
  .select('*')
  .eq('id', '00000000-0000-0000-0000-000000000001');
console.log('Config trouvée:', data, error);
```

### 4. Test manuel de l'UPDATE

Dans la console du navigateur:
```javascript
// Test UPDATE direct
const { data, error } = await supabase
  .from('configuration_paiement_globale')
  .update({ commission_main_oeuvre: 7.5 })
  .eq('id', '00000000-0000-0000-0000-000000000001')
  .select();

console.log('Résultat:', data, error);
```

Si ça marche ici mais pas dans la page, c'est un problème de code React.
Si ça ne marche pas, c'est un problème de RLS ou de données.

## Solutions rapides

### Solution 1: Désactiver temporairement RLS (DEV SEULEMENT!)
```sql
ALTER TABLE configuration_paiement_globale DISABLE ROW LEVEL SECURITY;
```

### Solution 2: Policy ultra-permissive (DEV SEULEMENT!)
```sql
DROP POLICY IF EXISTS "allow_update_config" ON configuration_paiement_globale;
CREATE POLICY "allow_all" ON configuration_paiement_globale
  FOR ALL 
  USING (true)
  WITH CHECK (true);
```

### Solution 3: Vérifier que l'ID est correct
```sql
-- Voir l'ID réel de la config
SELECT id FROM configuration_paiement_globale;

-- Si différent de '00000000-0000-0000-0000-000000000001',
-- utilise le bon ID dans le code React
```

## Après le fix

Une fois que ça marche, on pourra:
1. ✅ Réactiver l'historique des modifications
2. ✅ Créer la page prestataire
3. ✅ Créer la page frais de déplacement
4. ✅ Améliorer la création de devis

## Besoin d'aide?

Envoie-moi:
1. Le résultat du script `FIX_CONFIG_UPDATE_COMPLET.sql`
2. Les logs de la console navigateur
3. Le résultat de `SELECT * FROM configuration_paiement_globale;`
