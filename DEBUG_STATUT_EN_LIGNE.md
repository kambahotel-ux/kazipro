# 🔍 Debug : Statut En Ligne N'Affiche Pas

## Étapes de Diagnostic

### 1. Vérifier si le Script SQL a été Exécuté

**Ouvrez Supabase SQL Editor et exécutez :**

```sql
-- Vérifier si les colonnes existent
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'prestataires' 
AND column_name IN ('is_online', 'last_seen');
```

**Résultat attendu :**
```
column_name | data_type
------------|----------
is_online   | boolean
last_seen   | timestamp with time zone
```

**Si vous ne voyez RIEN** → Le script SQL n'a pas été exécuté !
**Solution** : Exécutez `sql/add_online_status.sql` maintenant

---

### 2. Vérifier la Console du Navigateur

**Ouvrez la console (F12) et regardez les erreurs :**

**Erreur possible 1 :**
```
column prestataires.is_online does not exist
```
→ **Solution** : Exécutez le script SQL

**Erreur possible 2 :**
```
permission denied for table prestataires
```
→ **Solution** : Les RLS policies ne sont pas configurées (le script SQL les crée)

**Pas d'erreur ?**
→ Le code fonctionne, mais il n'y a peut-être aucun prestataire en ligne

---

### 3. Vérifier Manuellement dans Supabase

**Exécutez cette requête :**

```sql
-- Voir tous les prestataires et leur statut
SELECT id, full_name, verified, is_online, last_seen 
FROM prestataires 
ORDER BY last_seen DESC NULLS LAST
LIMIT 10;
```

**Que chercher :**
- `is_online` = `true` pour au moins un prestataire
- `verified` = `true` (seuls les prestataires vérifiés sont comptés)

**Si tous les `is_online` sont `false` ou `null`** → Aucun prestataire n'est connecté

---

### 4. Tester avec un Prestataire Connecté

**Étapes :**

1. **Connectez-vous comme prestataire**
2. **Allez sur le dashboard prestataire**
3. **Vérifiez que le switch de disponibilité apparaît**
4. **Activez le switch**
5. **Ouvrez un autre onglet (ou navigateur privé)**
6. **Allez sur la page d'accueil** : `http://localhost:8080/`
7. **Vérifiez le badge** : devrait afficher "1 prestataire en ligne"

---

### 5. Forcer la Mise à Jour Manuelle (Test)

**Dans Supabase SQL Editor :**

```sql
-- Marquer manuellement un prestataire comme en ligne
UPDATE prestataires 
SET is_online = true, last_seen = NOW() 
WHERE verified = true 
LIMIT 1;

-- Vérifier
SELECT COUNT(*) as online_count 
FROM prestataires 
WHERE is_online = true AND verified = true;
```

**Puis rafraîchissez la page d'accueil** (Cmd+Shift+R)

Le badge devrait maintenant afficher "1 prestataire en ligne"

---

## 🎯 Actions Immédiates

### Si le script SQL n'a PAS été exécuté :

1. **Ouvrez Supabase** : https://supabase.com/dashboard
2. **SQL Editor** → New query
3. **Copiez tout** le contenu de `sql/add_online_status.sql`
4. **Collez et exécutez**
5. **Vérifiez** : pas d'erreurs
6. **Videz le cache** : Cmd+Shift+R
7. **Testez à nouveau**

### Si le script a été exécuté mais ça ne marche pas :

1. **Ouvrez la console du navigateur** (F12)
2. **Allez sur la page d'accueil**
3. **Regardez les erreurs** dans l'onglet Console
4. **Regardez les requêtes** dans l'onglet Network
5. **Cherchez** : requêtes vers `/rest/v1/prestataires`
6. **Copiez l'erreur** et partagez-la

---

## 🧪 Test Rapide

**Exécutez ceci dans Supabase pour tester :**

```sql
-- 1. Vérifier que les colonnes existent
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'prestataires' 
AND column_name IN ('is_online', 'last_seen');

-- 2. Compter les prestataires en ligne
SELECT COUNT(*) as online_count 
FROM prestataires 
WHERE is_online = true AND verified = true;

-- 3. Voir les prestataires vérifiés
SELECT id, full_name, verified, is_online 
FROM prestataires 
WHERE verified = true;
```

**Résultats attendus :**
1. Devrait retourner 2 lignes (is_online, last_seen)
2. Devrait retourner un nombre (peut être 0 si personne n'est connecté)
3. Devrait retourner la liste de vos prestataires vérifiés

---

## 📋 Checklist de Vérification

- [ ] Script SQL exécuté dans Supabase
- [ ] Colonnes `is_online` et `last_seen` existent
- [ ] Aucune erreur dans la console du navigateur
- [ ] Cache navigateur vidé (Cmd+Shift+R)
- [ ] Au moins un prestataire vérifié existe
- [ ] Prestataire connecté à son dashboard
- [ ] Switch de disponibilité visible sur le dashboard
- [ ] Switch activé (vert)
- [ ] Page d'accueil rafraîchie

---

## 🆘 Si Rien Ne Fonctionne

**Partagez ces informations :**

1. **Résultat de cette requête :**
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'prestataires' 
AND column_name IN ('is_online', 'last_seen');
```

2. **Erreurs dans la console du navigateur** (F12 → Console)

3. **Capture d'écran** de la page d'accueil

4. **Confirmation** : Avez-vous exécuté le script SQL ? (Oui/Non)

Je pourrai alors vous aider précisément ! 🚀
