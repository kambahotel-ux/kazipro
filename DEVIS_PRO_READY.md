# ✅ Système de Devis Professionnel - Prêt à Utiliser

## 🎯 Statut: PRÊT POUR TESTS

Le système de devis professionnel est maintenant complet et prêt à être testé!

---

## 📋 ÉTAPE 1: Exécuter le Script SQL

### Action Requise

1. **Ouvrir Supabase Dashboard**: https://supabase.com/dashboard
2. **Aller dans SQL Editor**
3. **Copier et exécuter le contenu de**: `sql/create_devis_pro.sql`

### Ce que le script va créer

✅ **Tables**:
- `devis_pro` - Table principale des devis
- `devis_pro_items` - Lignes d'articles des devis

✅ **Fonctions**:
- `generate_devis_numero()` - Génère des numéros uniques (DEV-2026-0001)
- `calculate_devis_pro_montants()` - Calcule automatiquement HT, TVA, TTC
- `change_devis_pro_statut()` - Change le statut avec dates automatiques

✅ **Triggers**:
- Mise à jour automatique de `updated_at`
- Recalcul automatique des montants quand les items changent

✅ **RLS Policies**:
- Prestataires peuvent gérer leurs propres devis
- Clients peuvent voir les devis qui leur sont envoyés
- Admin peut voir tous les devis

✅ **Indexes**:
- Performance optimisée pour les requêtes fréquentes

---

## 🎨 ÉTAPE 2: Tester l'Interface

### Accès

1. **Se connecter en tant que prestataire**
2. **Aller sur**: `/dashboard/prestataire/devis`

### Fonctionnalités Disponibles

#### 📊 Statistiques
- Nombre de brouillons
- Nombre de devis envoyés
- Nombre de devis acceptés
- Montant total accepté

#### 🔍 Filtres et Recherche
- Recherche par titre ou numéro
- Filtrer par statut (tous, brouillon, envoyé, accepté, refusé, expiré)

#### ➕ Créer un Devis

**Bouton**: "Nouveau devis"

**Formulaire**:
1. **Informations générales**
   - Titre (requis)
   - Description
   - Notes internes (non visibles par le client)

2. **Lignes d'articles**
   - Désignation (description)
   - Quantité
   - Unité (unité, heure, jour, m², m, kg)
   - Prix unitaire
   - Montant (calculé automatiquement)
   - Bouton pour ajouter/supprimer des lignes

3. **Calculs automatiques**
   - Montant HT (somme des lignes)
   - TVA (configurable, défaut 16%)
   - Total TTC

4. **Conditions générales**
   - Texte personnalisable
   - Défaut: "Devis valable 30 jours. Paiement à la livraison. Garantie 1 an."

**Actions**:
- 💾 **Enregistrer brouillon**: Sauvegarde sans envoyer
- 📤 **Envoyer**: Envoie au client (change statut à "envoyé")

#### 👁️ Prévisualiser un Devis

**Bouton**: "Voir" sur chaque devis

**Affichage professionnel**:
- En-tête avec logo KaziPro
- Numéro du devis
- Statut (badge coloré)
- Informations prestataire
- Dates (création, envoi, expiration)
- Titre et description
- Tableau des articles
- Totaux (HT, TVA, TTC)
- Conditions générales
- Pied de page

**Actions disponibles**:
- 📥 **Télécharger PDF**: Export en PDF (à venir)
- 📤 **Envoyer au client**: Si brouillon (à venir)

#### ✏️ Autres Actions

- **Dupliquer**: Créer une copie d'un devis existant
- **Modifier**: Éditer un brouillon (à venir)
- **Supprimer**: Supprimer un brouillon ou devis refusé

---

## 🎨 États des Devis

### 1. 📝 Brouillon (gris)
- Devis en cours de création
- Peut être modifié, supprimé, envoyé
- Non visible par le client

### 2. 📤 Envoyé (bleu)
- Devis envoyé au client
- Date d'expiration: 30 jours après envoi
- En attente de réponse du client

### 3. ✅ Accepté (vert)
- Client a accepté le devis
- Peut créer une mission
- Comptabilisé dans les stats

### 4. ❌ Refusé (rouge)
- Client a refusé le devis
- Peut être dupliqué ou supprimé

### 5. ⏰ Expiré (gris clair)
- Dépassé la date d'expiration
- Peut être dupliqué

---

## 🧪 Scénario de Test

### Test 1: Créer un Devis Brouillon

1. Cliquer sur "Nouveau devis"
2. Remplir:
   - Titre: "Installation électrique complète"
   - Description: "Installation électrique pour maison 3 chambres"
3. Ajouter des lignes:
   - Ligne 1: Câblage électrique, 50m, 500 FC/m = 25,000 FC
   - Ligne 2: Tableau électrique, 1 unité, 15,000 FC = 15,000 FC
   - Ligne 3: Main d'œuvre, 8 heures, 2,000 FC/h = 16,000 FC
4. Vérifier les totaux:
   - HT: 56,000 FC
   - TVA (16%): 8,960 FC
   - TTC: 64,960 FC
5. Cliquer "Enregistrer brouillon"
6. ✅ Vérifier que le devis apparaît dans la liste avec statut "Brouillon"

### Test 2: Prévisualiser le Devis

1. Cliquer sur "Voir" sur le devis créé
2. ✅ Vérifier l'affichage professionnel
3. ✅ Vérifier que toutes les informations sont correctes
4. ✅ Vérifier le numéro généré (DEV-2026-0001)

### Test 3: Dupliquer un Devis

1. Cliquer sur "Dupliquer"
2. ✅ Vérifier que le formulaire est pré-rempli
3. Modifier le titre: "Installation électrique complète (Copie)"
4. Enregistrer
5. ✅ Vérifier que 2 devis existent maintenant

### Test 4: Envoyer un Devis

1. Créer un nouveau devis
2. Cliquer "Envoyer" au lieu de "Enregistrer brouillon"
3. ✅ Vérifier que le statut est "Envoyé"
4. ✅ Vérifier que la date d'envoi est renseignée
5. ✅ Vérifier que la date d'expiration est dans 30 jours

### Test 5: Filtres et Recherche

1. Créer plusieurs devis avec différents statuts
2. Tester la recherche par titre
3. Tester la recherche par numéro
4. Tester les filtres par statut
5. ✅ Vérifier que les résultats sont corrects

### Test 6: Supprimer un Devis

1. Créer un devis brouillon
2. Cliquer "Supprimer"
3. Confirmer
4. ✅ Vérifier que le devis est supprimé

---

## 📊 Vérifications Base de Données

### Après avoir créé des devis, vérifier dans Supabase:

```sql
-- Voir tous les devis
SELECT * FROM devis_pro ORDER BY created_at DESC;

-- Voir les items d'un devis
SELECT * FROM devis_pro_items WHERE devis_id = 'VOTRE_DEVIS_ID';

-- Vérifier les calculs
SELECT 
  numero,
  titre,
  montant_ht,
  tva,
  montant_ttc,
  statut
FROM devis_pro;

-- Statistiques
SELECT 
  statut,
  COUNT(*) as nombre,
  SUM(montant_ttc) as total
FROM devis_pro
GROUP BY statut;
```

---

## 🚀 Prochaines Fonctionnalités

### Phase 3: Export PDF (À venir)
- [ ] Installation de jsPDF ou react-pdf
- [ ] Template PDF professionnel
- [ ] Téléchargement direct
- [ ] Logo et branding

### Phase 4: Envoi au Client (À venir)
- [ ] Sélection du client
- [ ] Envoi par email
- [ ] Notification au client
- [ ] Lien de visualisation

### Phase 5: Gestion Avancée (À venir)
- [ ] Édition des devis brouillons
- [ ] Modèles de devis
- [ ] Historique des modifications
- [ ] Signature électronique
- [ ] Conversion en mission

---

## ✅ Checklist de Validation

- [ ] Script SQL exécuté sans erreur
- [ ] Tables `devis_pro` et `devis_pro_items` créées
- [ ] Page accessible à `/dashboard/prestataire/devis`
- [ ] Statistiques affichées correctement
- [ ] Création de devis brouillon fonctionne
- [ ] Création de devis envoyé fonctionne
- [ ] Prévisualisation affiche correctement
- [ ] Calculs automatiques corrects (HT, TVA, TTC)
- [ ] Numéros générés automatiquement (DEV-2026-XXXX)
- [ ] Filtres et recherche fonctionnent
- [ ] Duplication fonctionne
- [ ] Suppression fonctionne
- [ ] RLS policies fonctionnent (prestataire voit seulement ses devis)

---

## 🐛 Problèmes Connus

Aucun pour le moment. Si vous rencontrez des erreurs:

1. **Vérifier que le script SQL a été exécuté**
2. **Vérifier que vous êtes connecté en tant que prestataire**
3. **Vérifier la console du navigateur pour les erreurs**
4. **Vérifier les logs Supabase**

---

## 📝 Notes Importantes

### Tables Utilisées
- ✅ `devis_pro` et `devis_pro_items` (nouvelles tables)
- ❌ PAS `devis` et `devis_items` (anciennes tables préservées)

### Numérotation
- Format: `DEV-YYYY-NNNN`
- Exemple: `DEV-2026-0001`, `DEV-2026-0002`, etc.
- Incrémentation automatique par année

### Calculs
- Montant ligne = Quantité × Prix unitaire
- Montant HT = Somme des montants des lignes
- Montant TVA = Montant HT × (TVA% / 100)
- Montant TTC = Montant HT + Montant TVA

### Dates
- `date_creation`: Date de création du devis
- `date_envoi`: Date d'envoi au client (si statut = envoyé)
- `date_expiration`: 30 jours après envoi
- `date_acceptation`: Date d'acceptation par le client
- `date_refus`: Date de refus par le client

---

## 🎉 Résultat

Un système complet de gestion de devis professionnels avec:
- ✅ Interface intuitive et moderne
- ✅ Calculs automatiques
- ✅ Gestion des états
- ✅ Prévisualisation professionnelle
- ✅ Filtres et recherche
- ✅ Sécurité RLS
- ✅ Performance optimisée

**Le système est prêt à être utilisé!** 🚀

---

**Prochaine étape**: Exécuter `sql/create_devis_pro.sql` et commencer les tests!
