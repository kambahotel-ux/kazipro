# 🔧 Commandes Utiles - KaziPro

## 🚀 Démarrage du Projet

### Installation initiale
```bash
# Cloner le projet
git clone <repo-url>
cd kazipro

# Installer les dépendances
npm install

# Installer Supabase
npm install @supabase/supabase-js

# Créer le fichier .env.local
cp .env.example .env.local
# Puis remplir les variables
```

### Lancer le serveur de développement
```bash
npm run dev
```
Ouvre http://localhost:5173

### Build pour la production
```bash
npm run build
```

### Preview de la build
```bash
npm run preview
```

---

## 📝 Linting et Formatage

### Vérifier les erreurs ESLint
```bash
npm run lint
```

### Corriger automatiquement les erreurs ESLint
```bash
npm run lint -- --fix
```

---

## 🗄️ Base de Données

### Exécuter les migrations SQL

#### Option 1 : Via Supabase Dashboard
1. Va dans **SQL Editor**
2. Clique sur **New Query**
3. Copie le contenu de `sql/init_tables.sql`
4. Colle-le et clique **Run**

#### Option 2 : Via CLI Supabase (si installé)
```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter à Supabase
supabase login

# Exécuter les migrations
supabase db push
```

### Vérifier les tables
```sql
-- Dans Supabase SQL Editor
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Vérifier les RLS policies
```sql
-- Dans Supabase SQL Editor
SELECT * FROM pg_policies;
```

### Réinitialiser la base de données (ATTENTION!)
```sql
-- Dans Supabase SQL Editor
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
```

---

## 🔐 Authentification

### Tester l'authentification

#### Créer un compte de test
```bash
# Via Supabase Dashboard
# 1. Va dans Authentication → Users
# 2. Clique sur "Add user"
# 3. Remplis email et mot de passe
# 4. Clique "Create user"
```

#### Tester via l'app
```bash
# 1. Va sur http://localhost:5173/inscription/client
# 2. Remplis le formulaire
# 3. Clique "S'inscrire"
# 4. Vérifie dans Supabase Dashboard → Authentication → Users
```

### Réinitialiser un mot de passe
```bash
# Via Supabase Dashboard
# 1. Va dans Authentication → Users
# 2. Clique sur l'utilisateur
# 3. Clique sur "Reset password"
```

---

## 📦 Gestion des Dépendances

### Ajouter une dépendance
```bash
npm install <package-name>
```

### Ajouter une dépendance de développement
```bash
npm install --save-dev <package-name>
```

### Mettre à jour les dépendances
```bash
npm update
```

### Vérifier les dépendances obsolètes
```bash
npm outdated
```

### Nettoyer les dépendances inutilisées
```bash
npm prune
```

---

## 🐛 Débogage

### Ouvrir la console du navigateur
```
F12 ou Ctrl+Shift+I (Windows/Linux)
Cmd+Option+I (Mac)
```

### Vérifier les logs Supabase
```bash
# Via Supabase Dashboard
# 1. Va dans Logs
# 2. Sélectionne le type de log
# 3. Regarde les erreurs
```

### Vérifier les variables d'environnement
```bash
# Créer un fichier de test
# src/debug.ts
import.meta.env.VITE_SUPABASE_URL
import.meta.env.VITE_SUPABASE_ANON_KEY
```

### Tester une requête Supabase
```typescript
// Dans la console du navigateur
import { supabase } from './lib/supabase'

// Tester une requête
const { data, error } = await supabase
  .from('clients')
  .select('*')
  .limit(1)

console.log(data, error)
```

---

## 📊 Monitoring

### Vérifier les performances
```bash
# Ouvrir DevTools
# Onglet Performance
# Enregistrer une session
# Analyser les résultats
```

### Vérifier la taille du bundle
```bash
npm run build
# Regarde la taille dans le terminal
```

### Analyser le bundle
```bash
npm install --save-dev rollup-plugin-visualizer
# Puis configurer dans vite.config.ts
```

---

## 🔄 Git

### Initialiser un repo Git
```bash
git init
git add .
git commit -m "Initial commit"
```

### Créer une branche
```bash
git checkout -b feature/nom-de-la-feature
```

### Commiter les changements
```bash
git add .
git commit -m "Description du changement"
```

### Pousser les changements
```bash
git push origin feature/nom-de-la-feature
```

### Fusionner une branche
```bash
git checkout main
git merge feature/nom-de-la-feature
```

### Voir l'historique
```bash
git log --oneline
```

---

## 🚀 Déploiement

### Déployer sur Vercel

#### Option 1 : Via CLI
```bash
npm install -g vercel
vercel
```

#### Option 2 : Via GitHub
```bash
# 1. Pousse ton code sur GitHub
# 2. Va sur vercel.com
# 3. Clique "New Project"
# 4. Sélectionne ton repo
# 5. Clique "Deploy"
```

### Déployer sur Netlify

#### Option 1 : Via CLI
```bash
npm install -g netlify-cli
netlify deploy
```

#### Option 2 : Via GitHub
```bash
# 1. Pousse ton code sur GitHub
# 2. Va sur netlify.com
# 3. Clique "New site from Git"
# 4. Sélectionne ton repo
# 5. Clique "Deploy"
```

### Configurer les variables d'environnement

#### Sur Vercel
```bash
# 1. Va dans Settings → Environment Variables
# 2. Ajoute VITE_SUPABASE_URL
# 3. Ajoute VITE_SUPABASE_ANON_KEY
# 4. Redéploie
```

#### Sur Netlify
```bash
# 1. Va dans Site settings → Build & deploy → Environment
# 2. Ajoute VITE_SUPABASE_URL
# 3. Ajoute VITE_SUPABASE_ANON_KEY
# 4. Redéploie
```

---

## 📚 Ressources Utiles

### Documentation
- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com/)

### Outils
- [Supabase Dashboard](https://app.supabase.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Netlify Dashboard](https://app.netlify.com)
- [GitHub](https://github.com)

### Extensions VS Code
- Supabase
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin
- ESLint
- Prettier

---

## 💡 Tips & Tricks

### Raccourcis VS Code
```
Ctrl+Shift+P : Palette de commandes
Ctrl+/ : Commenter/Décommenter
Ctrl+D : Sélectionner le mot suivant
Ctrl+Shift+L : Sélectionner toutes les occurrences
Alt+Up/Down : Déplacer la ligne
Ctrl+Shift+K : Supprimer la ligne
```

### Raccourcis Chrome DevTools
```
F12 : Ouvrir DevTools
Ctrl+Shift+C : Sélectionner un élément
Ctrl+Shift+J : Ouvrir la console
Ctrl+Shift+I : Ouvrir l'inspecteur
```

### Commandes Supabase utiles
```bash
# Voir les logs en temps réel
supabase functions serve

# Déployer les functions
supabase functions deploy

# Voir l'état du projet
supabase status
```

---

## 🆘 Dépannage Courant

### Erreur : "Cannot find module '@supabase/supabase-js'"
```bash
npm install @supabase/supabase-js
```

### Erreur : "Missing Supabase environment variables"
```bash
# Vérifier que .env.local existe et contient :
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Erreur : "Invalid login credentials"
```bash
# Vérifier que l'utilisateur existe dans Supabase
# Vérifier que le mot de passe est correct
# Vérifier que l'email est correct
```

### Erreur : "Row Level Security violation"
```bash
# Vérifier les RLS policies dans Supabase
# Vérifier que l'utilisateur a les permissions
# Vérifier que la policy est correcte
```

### Le site ne se charge pas
```bash
# Vérifier que le serveur de développement est lancé
# Vérifier que http://localhost:5173 est accessible
# Vérifier la console du navigateur pour les erreurs
# Vérifier les logs Supabase
```

---

## 📞 Support

Si tu as des problèmes :

1. **Consulte la documentation** - La plupart des problèmes sont documentés
2. **Regarde les logs** - Console du navigateur, Supabase logs
3. **Teste dans Supabase** - Utilise SQL Editor pour tester les requêtes
4. **Demande de l'aide** - Ouvre une issue sur GitHub

---

**Dernière mise à jour:** 22 Décembre 2025

