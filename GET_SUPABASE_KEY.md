# 🔑 Comment Récupérer ta Clé Supabase ANON

## 📍 Localisation de la Clé

### Étape 1 : Accéder au Dashboard Supabase

1. Va sur [https://app.supabase.com](https://app.supabase.com)
2. Connecte-toi avec ton compte
3. Sélectionne ton projet `qbasvwwerkpmsbzfrydj`

### Étape 2 : Aller dans les Paramètres API

1. Clique sur **Settings** (en bas à gauche)
2. Clique sur **API** dans le menu

### Étape 3 : Copier la Clé ANON

Tu devrais voir :

```
Project URL
https://qbasvwwerkpmsbzfrydj.supabase.co

API Keys
anon public
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXN2d3dlcmtwbXNiemZyeWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4NzY4NzcsImV4cCI6MjA1MDQ1Mjg3N30.xxxxxxxxxxxxxxxxxxxxx

service_role secret
(NE PAS COPIER CELLE-CI)
```

**Copie la clé `anon public`** (celle qui commence par `eyJhbGc...`)

### Étape 4 : Mettre à Jour .env.local

Ouvre le fichier `.env.local` à la racine du projet et remplace :

```env
VITE_SUPABASE_URL=https://qbasvwwerkpmsbzfrydj.supabase.co
VITE_SUPABASE_ANON_KEY=<COLLE_TA_CLE_ICI>
```

Par exemple :

```env
VITE_SUPABASE_URL=https://qbasvwwerkpmsbzfrydj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXN2d3dlcmtwbXNiemZyeWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4NzY4NzcsImV4cCI6MjA1MDQ1Mjg3N30.xxxxxxxxxxxxxxxxxxxxx
```

### Étape 5 : Redémarrer le Serveur

```bash
# Arrête le serveur (Ctrl+C)
# Puis relance-le
npm run dev
```

---

## ⚠️ Important

### ✅ À Faire
- Copie la clé **anon public**
- Mets-la dans `.env.local`
- Redémarre le serveur

### ❌ À NE PAS Faire
- Ne copie PAS la clé **service_role secret**
- Ne partage PAS ta clé ANON publiquement
- Ne commit PAS `.env.local` sur GitHub

---

## 🧪 Vérifier que ça Fonctionne

### Test 1 : Vérifier les Variables

```bash
# Ouvre la console du navigateur (F12)
# Tape :
console.log(import.meta.env.VITE_SUPABASE_URL)
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY)
```

Tu devrais voir :
```
https://qbasvwwerkpmsbzfrydj.supabase.co
eyJhbGc...
```

### Test 2 : Tester la Connexion

```bash
# Dans la console :
import { supabase } from './lib/supabase'

const { data, error } = await supabase
  .from('clients')
  .select('*')
  .limit(1)

console.log(data, error)
```

Si tu vois `data: []` et `error: null`, c'est bon ! ✅

---

## 📞 Dépannage

### Erreur : "Missing Supabase environment variables"

**Cause:** `.env.local` n'existe pas ou est mal configuré

**Solution:**
1. Vérifie que `.env.local` existe à la racine du projet
2. Vérifie que les deux lignes sont présentes
3. Redémarre le serveur

### Erreur : "Invalid API key"

**Cause:** Tu as copié la mauvaise clé

**Solution:**
1. Va dans Supabase Dashboard
2. Copie la clé **anon public** (pas service_role)
3. Mets-la à jour dans `.env.local`
4. Redémarre le serveur

### Erreur : "CORS error"

**Cause:** Ton domaine n'est pas autorisé

**Solution:**
1. Va dans Supabase Dashboard
2. Settings → API → CORS
3. Ajoute `http://localhost:5173`
4. Redémarre le serveur

---

## 🎯 Résumé

1. ✅ Va sur Supabase Dashboard
2. ✅ Copie la clé ANON
3. ✅ Mets-la dans `.env.local`
4. ✅ Redémarre le serveur
5. ✅ Teste la connexion

**Prochaine étape:** Suis **QUICK_START.md** ! 🚀

---

**Créé le:** 22 Décembre 2025

