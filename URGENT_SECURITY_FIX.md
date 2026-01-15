# 🚨 CORRECTION DE SÉCURITÉ URGENTE

## ⚠️ Situation

Tu as accidentellement partagé ta clé **SERVICE ROLE** (clé secrète du serveur).

**Clé compromise:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXN2d3dlcmtwbXNiemZyeWRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjM1OTAzOSwiZXhwIjoyMDgxOTM1MDM5fQ.TeQvTfpH2M617gZlPX8id0mpMqLiyvRpBwtLJgELufo
```

---

## 🔴 À FAIRE MAINTENANT (5 min)

### Étape 1 : Révoquer la Clé Compromise

1. Va sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionne ton projet `qbasvwwerkpmsbzfrydj`
3. Va dans **Settings** → **API**
4. Scroll jusqu'à **API Keys**
5. Clique sur le bouton **Revoke** à côté de la clé SERVICE ROLE
6. Confirme la révocation

### Étape 2 : Générer une Nouvelle Clé SERVICE ROLE

1. Clique sur **Generate New Key**
2. Sélectionne **service_role**
3. Copie la nouvelle clé
4. Sauvegarde-la dans un endroit sûr (pas dans le code !)

### Étape 3 : Récupérer la Clé ANON

1. Dans la même page **Settings** → **API**
2. Copie la clé **anon public** (celle qui contient `"role":"anon"`)
3. Assure-toi que c'est la bonne clé (voir ci-dessous)

### Étape 4 : Mettre à Jour .env.local

```env
VITE_SUPABASE_URL=https://qbasvwwerkpmsbzfrydj.supabase.co
VITE_SUPABASE_ANON_KEY=<COLLE_TA_CLE_ANON_ICI>
```

### Étape 5 : Redémarrer le Serveur

```bash
# Arrête le serveur (Ctrl+C)
# Puis relance-le
npm run dev
```

---

## ✅ Vérifier que c'est la Bonne Clé

### Méthode 1 : Vérifier le Contenu

1. Va sur [jwt.io](https://jwt.io)
2. Colle ta clé dans le champ "Encoded"
3. Regarde le payload (partie du milieu)
4. Tu devrais voir `"role":"anon"` (pas `"role":"service_role"`)

### Méthode 2 : Vérifier dans le Code

```bash
# Ouvre la console du navigateur (F12)
# Tape :
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY)
```

Tu devrais voir une clé qui commence par `eyJhbGc...` et contient `"role":"anon"`.

---

## 📋 Checklist de Sécurité

- [ ] Clé SERVICE ROLE compromise révoquée
- [ ] Nouvelle clé SERVICE ROLE générée
- [ ] Clé ANON récupérée
- [ ] `.env.local` mis à jour avec la clé ANON
- [ ] Serveur redémarré
- [ ] Connexion testée
- [ ] `.gitignore` contient `.env.local`
- [ ] Pas de clés dans le code source

---

## 🔐 Différence Entre les Clés

### ✅ Clé ANON (Public)
```
Contient: "role":"anon"
Utilisation: Côté client (navigateur, app mobile)
Sécurité: Safe de la partager
Permissions: Limitées par les RLS policies
```

### ❌ Clé SERVICE ROLE (Secret)
```
Contient: "role":"service_role"
Utilisation: Côté serveur uniquement
Sécurité: JAMAIS partager
Permissions: Accès complet à la base de données
```

---

## 🧪 Tester la Connexion

```bash
# Ouvre la console du navigateur (F12)
# Tape :
import { supabase } from './lib/supabase'

const { data, error } = await supabase
  .from('clients')
  .select('*')
  .limit(1)

console.log(data, error)
```

Tu devrais voir `data: []` et `error: null`.

---

## 📞 Besoin d'Aide ?

Consulte **SECURITY_WARNING.md** pour plus de détails.

---

## 🚀 Prochaines Étapes

Une fois la sécurité corrigée :

1. Ouvre **START_HERE.md**
2. Suis les étapes de démarrage
3. Commence le développement

---

**Créé le:** 22 Décembre 2025  
**Statut:** URGENT - À faire immédiatement  
**Durée estimée:** 5 minutes

