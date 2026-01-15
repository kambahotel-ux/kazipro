# ⚠️ AVERTISSEMENT DE SÉCURITÉ - KaziPro

## 🚨 CLÉS COMPROMISES

Tu as accidentellement partagé ta clé **SERVICE ROLE** (clé secrète du serveur).

**Clé compromise:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXN2d3dlcmtwbXNiemZyeWRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjM1OTAzOSwiZXhwIjoyMDgxOTM1MDM5fQ.TeQvTfpH2M617gZlPX8id0mpMqLiyvRpBwtLJgELufo
```

---

## 🔴 ACTIONS À FAIRE IMMÉDIATEMENT

### Étape 1 : Révoquer la Clé Compromise

1. Va sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionne ton projet `qbasvwwerkpmsbzfrydj`
3. Va dans **Settings** → **API**
4. Clique sur **Revoke** pour la clé SERVICE ROLE compromise
5. Clique sur **Generate New Key** pour créer une nouvelle clé

### Étape 2 : Récupérer la Nouvelle Clé

1. Copie la nouvelle clé SERVICE ROLE
2. Mets-la à jour dans ton `.env.local` (côté serveur uniquement)
3. Redémarre ton serveur

### Étape 3 : Vérifier les Accès

1. Va dans **Settings** → **API Logs**
2. Vérifie s'il y a eu des accès non autorisés
3. Si oui, contacte le support Supabase

---

## 📚 Différence Entre les Clés

### ✅ Clé ANON (Public)
- **Utilisation:** Côté client (navigateur, app mobile)
- **Sécurité:** Safe de la partager publiquement
- **Permissions:** Limitées par les RLS policies
- **Exemple:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXN2d3dlcmtwbXNiemZyeWRqIiwicm9sZSI6ImFub24i...`

### ❌ Clé SERVICE ROLE (Secret)
- **Utilisation:** Côté serveur uniquement
- **Sécurité:** JAMAIS partager publiquement
- **Permissions:** Accès complet à la base de données
- **Exemple:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXN2d3dlcmtwbXNiemZyeWRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSI...`

---

## 🔐 Bonnes Pratiques de Sécurité

### ✅ À Faire
- [ ] Utiliser la clé ANON côté client
- [ ] Utiliser la clé SERVICE ROLE côté serveur uniquement
- [ ] Ajouter `.env.local` à `.gitignore`
- [ ] Révoquer les clés compromise immédiatement
- [ ] Utiliser les RLS policies pour sécuriser les données
- [ ] Utiliser les Edge Functions pour la logique sensible
- [ ] Journaliser les actions critiques

### ❌ À NE PAS Faire
- [ ] Ne partage PAS ta clé SERVICE ROLE
- [ ] Ne commit PAS `.env.local` sur GitHub
- [ ] Ne mets PAS les clés dans le code source
- [ ] Ne partage PAS les clés par email ou chat
- [ ] Ne stocke PAS les clés en clair dans les fichiers

---

## 📋 Vérifier .gitignore

Assure-toi que `.gitignore` contient :

```
# Environment variables
.env
.env.local
.env.*.local

# Secrets
*.key
*.pem
```

---

## 🔑 Récupérer la Clé ANON (Publique)

### Étape 1 : Aller dans Supabase Dashboard

1. Va sur [https://app.supabase.com](https://app.supabase.com)
2. Sélectionne ton projet `qbasvwwerkpmsbzfrydj`
3. Va dans **Settings** → **API**

### Étape 2 : Copier la Clé ANON

Tu devrais voir :

```
Project URL
https://qbasvwwerkpmsbzfrydj.supabase.co

API Keys
anon public
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXN2d3dlcmtwbXNiemZyeWRqIiwicm9sZSI6ImFub24i...

service_role secret
(NE PAS COPIER CELLE-CI)
```

**Copie la clé `anon public`** (celle qui commence par `eyJhbGc...` et contient `"role":"anon"`)

### Étape 3 : Mettre à Jour .env.local

```env
VITE_SUPABASE_URL=https://qbasvwwerkpmsbzfrydj.supabase.co
VITE_SUPABASE_ANON_KEY=<COLLE_TA_CLE_ANON_ICI>
```

---

## 🧪 Vérifier que c'est la Bonne Clé

### Vérifier le Contenu de la Clé

1. Va sur [jwt.io](https://jwt.io)
2. Colle ta clé dans le champ "Encoded"
3. Regarde le payload (partie du milieu)
4. Tu devrais voir `"role":"anon"` (pas `"role":"service_role"`)

### Exemple de Clé ANON (Correcte)
```json
{
  "iss": "supabase",
  "ref": "qbasvwwerkpmsbzfrydj",
  "role": "anon",
  "iat": 1734876877,
  "exp": 2050452877
}
```

### Exemple de Clé SERVICE ROLE (Incorrecte)
```json
{
  "iss": "supabase",
  "ref": "qbasvwwerkpmsbzfrydj",
  "role": "service_role",
  "iat": 1766359039,
  "exp": 2081935039
}
```

---

## 📞 Dépannage

### Q: J'ai accidentellement partagé ma clé SERVICE ROLE, qu'est-ce que je fais ?

**R:** 
1. Va dans Supabase Dashboard
2. Révoque la clé compromise
3. Génère une nouvelle clé
4. Mets-la à jour dans ton `.env.local`
5. Redémarre ton serveur

### Q: Comment je sais si ma clé a été utilisée de manière malveillante ?

**R:**
1. Va dans Supabase Dashboard
2. Va dans **Settings** → **API Logs**
3. Regarde les accès récents
4. Si tu vois des accès suspects, contacte le support Supabase

### Q: Puis-je utiliser la clé SERVICE ROLE côté client ?

**R:** Non ! C'est une faille de sécurité majeure. Utilise toujours la clé ANON côté client.

---

## 🔒 Résumé de Sécurité

| Aspect | Statut |
|--------|--------|
| Clé SERVICE ROLE compromise | ⚠️ À révoquer |
| Clé ANON | ⏳ À récupérer |
| .env.local | ⏳ À mettre à jour |
| .gitignore | ✅ À vérifier |
| RLS policies | ✅ Configurées |

---

## 🚀 Prochaines Étapes

1. ✅ Révoquer la clé SERVICE ROLE compromise
2. ✅ Générer une nouvelle clé SERVICE ROLE
3. ✅ Récupérer la clé ANON
4. ✅ Mettre à jour `.env.local`
5. ✅ Redémarrer le serveur
6. ✅ Tester la connexion

---

## 📝 Notes Importantes

1. **Jamais partager les clés** - Surtout pas la clé SERVICE ROLE
2. **Utiliser .gitignore** - Pour éviter de commiter les clés
3. **Révoquer rapidement** - Si une clé est compromise
4. **Utiliser les RLS policies** - Pour sécuriser les données
5. **Journaliser les actions** - Pour détecter les accès suspects

---

**Créé le:** 22 Décembre 2025  
**Statut:** URGENT - À faire immédiatement

