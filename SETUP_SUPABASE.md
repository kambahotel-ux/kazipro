# 🔧 Configuration Supabase - KaziPro

## ✅ Projet Supabase Créé

**ID du Projet:** `qbasvwwerkpmsbzfrydj`  
**URL:** `https://qbasvwwerkpmsbzfrydj.supabase.co`

---

## 📋 Étapes de Configuration

### Étape 1 : Récupérer la Clé ANON

1. Va sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionne ton projet `qbasvwwerkpmsbzfrydj`
3. Va dans **Settings** → **API**
4. Copie la clé **anon public** (commence par `eyJhbGc...`)

### Étape 2 : Mettre à Jour .env.local

Remplace la clé placeholder dans `.env.local` :

```env
VITE_SUPABASE_URL=https://qbasvwwerkpmsbzfrydj.supabase.co
VITE_SUPABASE_ANON_KEY=<COLLE_TA_CLE_ICI>
```

### Étape 3 : Initialiser la Base de Données

1. Va dans Supabase Dashboard
2. Clique sur **SQL Editor**
3. Clique sur **New Query**
4. Copie le contenu de `sql/init_tables.sql`
5. Colle-le dans l'éditeur
6. Clique sur **Run**

**Attends que tout soit créé (2-3 min)**

### Étape 4 : Vérifier les Tables

1. Va dans **Table Editor**
2. Tu devrais voir les tables :
   - clients
   - prestataires
   - demandes
   - devis
   - missions
   - paiements
   - avis
   - messages

### Étape 5 : Vérifier les RLS Policies

1. Va dans **Authentication** → **Policies**
2. Vérifie que les policies sont créées pour chaque table

### Étape 6 : Configurer les Buckets Storage

1. Va dans **Storage**
2. Crée 3 buckets :
   - `demandes-images` (public)
   - `prestataire-documents` (private)
   - `avatars` (public)

---

## 🧪 Tester la Connexion

### Test 1 : Vérifier les Variables d'Environnement

```bash
# Ouvre la console du navigateur (F12)
# Tape dans la console :
console.log(import.meta.env.VITE_SUPABASE_URL)
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY)
```

Tu devrais voir :
```
https://qbasvwwerkpmsbzfrydj.supabase.co
eyJhbGc...
```

### Test 2 : Tester la Connexion Supabase

```bash
# Dans la console du navigateur :
import { supabase } from './lib/supabase'

// Tester une requête simple
const { data, error } = await supabase
  .from('clients')
  .select('*')
  .limit(1)

console.log(data, error)
```

Tu devrais voir un tableau vide (pas d'erreur).

### Test 3 : Tester l'Authentification

```bash
# Dans la console du navigateur :
import { supabase } from './lib/supabase'

// Créer un compte de test
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'TestPassword123!'
})

console.log(data, error)
```

Tu devrais voir un nouvel utilisateur créé.

---

## 🔐 Sécurité

### ✅ À Faire

- [ ] Activer l'authentification par email
- [ ] Configurer les RLS policies
- [ ] Configurer les CORS
- [ ] Ajouter les domaines autorisés

### Configuration CORS

1. Va dans **Settings** → **API**
2. Scroll jusqu'à **CORS**
3. Ajoute tes domaines :
   - `http://localhost:5173` (développement)
   - `https://tondomaine.com` (production)

---

## 📊 Vérifier l'État du Projet

### Checklist

- [ ] Projet Supabase créé
- [ ] URL du projet : `https://qbasvwwerkpmsbzfrydj.supabase.co`
- [ ] Clé ANON récupérée
- [ ] `.env.local` créé avec les bonnes clés
- [ ] Tables créées
- [ ] RLS policies configurées
- [ ] Buckets Storage créés
- [ ] Connexion testée
- [ ] Authentification testée

---

## 🚀 Prochaines Étapes

1. ✅ Configurer Supabase (ce fichier)
2. ⏳ Installer @supabase/supabase-js
3. ⏳ Créer AuthContext
4. ⏳ Implémenter ProtectedRoute
5. ⏳ Connecter Login à Supabase

---

## 📞 Dépannage

### Erreur : "Missing Supabase environment variables"

**Solution:** Vérifie que `.env.local` existe et contient les bonnes clés.

### Erreur : "Invalid API key"

**Solution:** Vérifie que tu as copié la bonne clé ANON (pas la clé service role).

### Erreur : "CORS error"

**Solution:** Ajoute ton domaine dans Settings → API → CORS.

### Les tables ne sont pas créées

**Solution:** Vérifie que tu as exécuté le script SQL complet dans SQL Editor.

### Les RLS policies ne fonctionnent pas

**Solution:** Vérifie que RLS est activé sur chaque table.

---

## 📝 Notes Importantes

1. **Clé ANON** - Utilisée côté client (safe de la partager)
2. **Clé Service Role** - Utilisée côté serveur (JAMAIS côté client)
3. **RLS** - Sécurise l'accès aux données
4. **CORS** - Autorise les domaines à accéder à l'API

---

## 🎯 Résumé

Tu as maintenant :
- ✅ Un projet Supabase configuré
- ✅ Les variables d'environnement
- ✅ Les tables créées
- ✅ Les RLS policies configurées
- ✅ Les buckets Storage créés

**Prochaine étape:** Suis **QUICK_START.md** pour implémenter l'authentification ! 🚀

---

**Créé le:** 22 Décembre 2025  
**Projet ID:** qbasvwwerkpmsbzfrydj  
**Statut:** Prêt à commencer

