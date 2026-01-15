# ✅ Système de Statut En Ligne - Implémentation Complète

Le système est implémenté dans le code. Maintenant il faut **vider le cache** et vérifier les permissions.

## 🎯 Actions Immédiates

### 1. Videz COMPLÈTEMENT le Cache

**Sur Mac** : `Cmd + Shift + R` puis `Cmd + Option + E` (vider le cache)
**Sur Windows** : `Ctrl + Shift + R` puis `Ctrl + Shift + Delete` (vider le cache)

Ou mieux encore :
1. Ouvrez DevTools (F12)
2. Cliquez droit sur le bouton de rafraîchissement
3. Choisissez "Vider le cache et actualiser de force"

### 2. Vérifiez la Console

Ouvrez la console (F12) et regardez s'il y a des erreurs en rouge.

Vous devriez voir un log : `"Prestataires en ligne: 1"`

### 3. Vérifiez les Permissions RLS

Exécutez ce script dans Supabase pour vérifier les permissions :

```sql
-- Voir toutes les policies sur la table prestataires
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'prestataires';

-- Tester la requête directement
SELECT COUNT(*) as online_count
FROM prestataires
WHERE verified = true AND is_online = true;

-- Voir les prestataires en ligne
SELECT id, full_name, verified, is_online, last_seen
FROM prestataires
WHERE is_online = true;
```

### 4. Si Ça Ne Marche Toujours Pas

Il y a peut-être un conflit de policies RLS. Exécutez ceci pour permettre la lecture publique :

```sql
-- Supprimer les anciennes policies qui pourraient bloquer
DROP POLICY IF EXISTS "Anyone can view online status of verified providers" ON prestataires;
DROP POLICY IF EXISTS "Public can view verified providers" ON prestataires;

-- Créer une policy simple pour la lecture publique
CREATE POLICY "public_read_verified_providers"
ON prestataires FOR SELECT
USING (verified = true);
```

### 5. Test Final

Après avoir vidé le cache et vérifié les permissions :

1. Allez sur `http://localhost:8080/`
2. Ouvrez la console (F12)
3. Vous devriez voir : `"Prestataires en ligne: 1"`
4. Le badge devrait afficher : "● 1 prestataire en ligne"

---

## 🔍 Debug Rapide

Si le badge n'apparaît toujours pas, vérifiez dans la console :

```javascript
// Ouvrez la console et tapez :
fetch('https://qbasvwwerkpmsbzfrydj.supabase.co/rest/v1/prestataires?select=*&verified=eq.true&is_online=eq.true', {
  headers: {
    'apikey': 'VOTRE_ANON_KEY',
    'Authorization': 'Bearer VOTRE_ANON_KEY'
  }
}).then(r => r.json()).then(console.log)
```

Remplacez `VOTRE_ANON_KEY` par votre clé Supabase (dans `.env.local`).

Si ça retourne des données, le problème vient du cache.
Si ça retourne une erreur, le problème vient des permissions RLS.

---

## ✅ Checklist Finale

- [ ] Script SQL `sql/add_online_status.sql` exécuté
- [ ] Colonnes `is_online` et `last_seen` existent
- [ ] Au moins 1 prestataire vérifié et en ligne
- [ ] Cache navigateur vidé (Cmd+Shift+R)
- [ ] Console ouverte pour voir les logs
- [ ] Aucune erreur rouge dans la console
- [ ] Policy RLS permet la lecture publique

**Si tout est coché, ça devrait fonctionner ! 🚀**
