# 📸 Guide Visuel - Exécuter les Scripts SQL dans Supabase

## 🎯 Objectif
Exécuter 2 scripts SQL pour activer le système de devis

---

## ÉTAPE 1: Accéder à Supabase

1. **Ouvrir le navigateur**
2. **Aller sur**: https://supabase.com/dashboard
3. **Se connecter** avec vos identifiants
4. **Sélectionner** votre projet KaziPro

---

## ÉTAPE 2: Ouvrir SQL Editor

1. Dans le menu latéral gauche, chercher **"SQL Editor"**
2. Cliquer dessus
3. Vous verrez un éditeur de code SQL

---

## ÉTAPE 3: Exécuter le Premier Script

### 3.1 Ouvrir le fichier
- Dans VS Code, ouvrir: `sql/upgrade_devis_simple.sql`

### 3.2 Copier tout le contenu
- Sélectionner tout: `Ctrl+A` (Windows/Linux) ou `Cmd+A` (Mac)
- Copier: `Ctrl+C` ou `Cmd+C`

### 3.3 Coller dans Supabase
- Cliquer dans l'éditeur SQL de Supabase
- Coller: `Ctrl+V` ou `Cmd+V`

### 3.4 Exécuter
- Cliquer sur le bouton **"Run"** en haut à droite
- OU appuyer sur `Ctrl+Enter` ou `Cmd+Enter`

### 3.5 Attendre
- Le script va s'exécuter (peut prendre 5-10 secondes)
- Vous verrez un message de succès en vert

---

## ÉTAPE 4: Exécuter le Deuxième Script

### 4.1 Effacer l'éditeur
- Sélectionner tout: `Ctrl+A`
- Supprimer: `Delete`

### 4.2 Ouvrir le fichier
- Dans VS Code, ouvrir: `sql/fix_all_devis_constraints.sql`

### 4.3 Copier et coller
- Copier tout le contenu
- Coller dans l'éditeur Supabase

### 4.4 Exécuter
- Cliquer "Run" ou `Ctrl+Enter`
- Attendre le message de succès

---

## ÉTAPE 5: Vérifier que ça a marché

### 5.1 Effacer l'éditeur
- Sélectionner tout et supprimer

### 5.2 Copier cette requête de test
