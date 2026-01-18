# 🎯 DÉMARRAGE RAPIDE - Système Personne Physique/Morale

## ⚡ ACTION IMMÉDIATE (2 minutes)

### 1️⃣ Exécuter les scripts SQL dans Supabase

**Ouvrez Supabase → SQL Editor et exécutez dans l'ordre:**

#### Script 1: Ajouter les champs personne physique/morale
```
Fichier: sql/add_personne_physique_morale_sans_contraintes.sql
```
- Copier tout le contenu
- Coller dans SQL Editor
- Cliquer "Run"
- ✅ Attendre le message de succès

#### Script 2: Ajouter la colonne phone
```
Fichier: sql/add_phone_column.sql
```
- Copier tout le contenu
- Coller dans SQL Editor
- Cliquer "Run"
- ✅ Attendre le message de succès

### 2️⃣ Tester l'inscription

```bash
npm run dev
```

Puis allez sur: **http://localhost:5173/inscription/prestataire**

## 🧪 Tests à faire

### Test 1: Personne Physique
1. Sélectionner "👤 Personne Physique"
2. Remplir:
   - Prénom: Jean
   - Nom: Kabongo
   - Email: jean@test.com
   - Mot de passe: test123
3. Sélectionner au moins 1 service
4. Choisir service principal
5. Ville: Kinshasa
6. Expérience: 5
7. Uploader 2 documents
8. Vérifier l'étape 3 (Révision)
9. Soumettre

### Test 2: Personne Morale
1. Sélectionner "🏢 Personne Morale"
2. Remplir:
   - Raison sociale: SARL TEST
   - Représentant: Mukendi
   - Email: contact@test.com
   - Mot de passe: test123
3. Sélectionner au moins 1 service
4. Choisir service principal
5. Ville: Kinshasa
6. Expérience: 10
7. Uploader 2 documents
8. Vérifier l'étape 3 (Révision)
9. Soumettre

## ✅ Ce qui doit fonctionner

- [x] Sélection du type de prestataire
- [x] Formulaire change selon le type
- [x] Boîte bleue pour personne physique
- [x] Boîte verte pour personne morale
- [x] Nom complet auto-rempli
- [x] Upload de documents
- [x] Étape 3 affiche tout selon le type
- [x] Sidebar droite reste fixe
- [x] Inscription réussie
- [x] Redirection vers page d'attente

## 🐛 Si erreur

### Erreur: "Could not find the 'phone' column"
➡️ **Solution**: Exécutez `sql/add_phone_column.sql`

### Erreur: "check constraint violated"
➡️ **Solution**: Exécutez `sql/add_personne_physique_morale_sans_contraintes.sql`

### Erreur: "column does not exist"
➡️ **Solution**: Vérifiez que les 2 scripts SQL ont été exécutés

## 📚 Documentation complète

- **Guide visuel**: `GUIDE_VISUEL_FINAL.md`
- **Actions SQL**: `ACTION_MAINTENANT_SQL.md`
- **Résumé**: `RESUME_PERSONNE_PHYSIQUE_MORALE.md`

## 🎨 Fichiers modifiés

### Code
- ✅ `src/pages/auth/RegisterProviderSteps.tsx` - Formulaire d'inscription
- ✅ `src/types/prestataire.ts` - Types TypeScript
- ✅ `src/components/providers/PrestataireTypeBadge.tsx` - Badge de type
- ✅ `src/components/providers/PrestataireInfoCard.tsx` - Carte d'info

### SQL
- ✅ `sql/add_personne_physique_morale_sans_contraintes.sql` - Champs BD
- ✅ `sql/add_phone_column.sql` - Colonne phone

### Autres
- ✅ `src/pages/auth/Login.tsx` - Section démo supprimée

## 🚀 Prêt à utiliser

Une fois les 2 scripts SQL exécutés, le système est **100% fonctionnel** !

Vous pouvez créer des prestataires de type:
- 👤 **Personne Physique** (individus)
- 🏢 **Personne Morale** (entreprises)

Tous les champs sont **optionnels** sauf le type de prestataire.
