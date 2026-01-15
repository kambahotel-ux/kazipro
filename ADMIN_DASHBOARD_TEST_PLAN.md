# Plan de Test - Dashboard Admin KaziPro

## Prérequis
- ✅ Admin user créé: `admin@kazipro.com` / `Admin@123456`
- ✅ Client profile créé dans la base de données
- ✅ Dev server en cours d'exécution: `npm run dev`
- ✅ Navigateur: http://localhost:5173

---

## 1. LOGIN & REDIRECTION

### Test 1.1: Login Admin
**Étapes:**
1. Aller à: `http://localhost:5173/connexion`
2. Email: `admin@kazipro.com`
3. Mot de passe: `Admin@123456`
4. Cliquer "Se connecter"

**Résultat attendu:**
- ✅ Pas d'erreur "Invalid login credentials"
- ✅ Redirection vers `/dashboard/admin` (pas `/dashboard/client`)
- ✅ Demande OTP

**Résultat réel:**
- [ ] Connexion réussie
- [ ] Redirection correcte
- [ ] OTP reçu

---

## 2. ADMIN DASHBOARD (Page Principale)

### Test 2.1: Chargement du Dashboard
**URL:** `http://localhost:5173/dashboard/admin`

**Éléments à vérifier:**
- [ ] Titre: "Tableau de Bord Admin"
- [ ] Sous-titre: "Bienvenue dans l'espace d'administration KaziPro"
- [ ] Pas d'erreur de chargement

### Test 2.2: Statistiques Clés
**Éléments à vérifier:**
- [ ] Carte "Utilisateurs Totaux" affiche un nombre
- [ ] Carte "Revenus Totaux" affiche un montant en M FC
- [ ] Carte "Missions Actives" affiche un nombre
- [ ] Les nombres sont corrects (pas 0 ou NaN)

### Test 2.3: Alerte Prestataires
**Éléments à vérifier:**
- [ ] Si prestataires non vérifiés > 0: alerte affichée
- [ ] Bouton "Vérifier" redirige vers `/dashboard/admin/prestataires`

### Test 2.4: Actions Rapides
**Éléments à vérifier:**
- [ ] 7 boutons affichés:
  - [ ] Utilisateurs
  - [ ] Prestataires
  - [ ] Demandes
  - [ ] Transactions
  - [ ] Litiges
  - [ ] Rapports
  - [ ] Configuration
- [ ] Chaque bouton a une icône et une couleur
- [ ] Cliquer sur chaque bouton redirige vers la bonne page

### Test 2.5: Activité Récente
**Éléments à vérifier:**
- [ ] Section "Activité Récente" affichée
- [ ] 4 lignes d'activité affichées
- [ ] Timestamps affichés (Il y a 2h, etc.)

### Test 2.6: Statistiques Clés (Bas)
**Éléments à vérifier:**
- [ ] Taux de Conversion: affiche un pourcentage
- [ ] Utilisateurs Actifs: affiche un nombre
- [ ] Satisfaction Moyenne: 4.6/5
- [ ] Temps Réponse Moyen: 2.3h

---

## 3. PAGE UTILISATEURS

### Test 3.1: Accès à la Page
**URL:** `http://localhost:5173/dashboard/admin/utilisateurs`

**Éléments à vérifier:**
- [ ] Titre: "Gestion des Utilisateurs"
- [ ] Sous-titre: "Gérez tous les utilisateurs de la plateforme"
- [ ] Pas d'erreur de chargement

### Test 3.2: Statistiques
**Éléments à vérifier:**
- [ ] Carte "Total utilisateurs": affiche un nombre
- [ ] Carte "Clients": affiche un nombre
- [ ] Carte "Prestataires": affiche un nombre
- [ ] Carte "Actifs": affiche un nombre

### Test 3.3: Filtres
**Éléments à vérifier:**
- [ ] Champ de recherche par nom/email
- [ ] Dropdown "Tous les types" (Client/Prestataire)
- [ ] Dropdown "Tous les statuts" (Actif/Inactif/Suspendu)

### Test 3.4: Tableau Utilisateurs
**Éléments à vérifier:**
- [ ] Colonnes: Utilisateur, Type, Email, Statut, Inscrit, Actions
- [ ] Au moins 1 utilisateur affiché
- [ ] Noms affichés correctement (pas "undefined")
- [ ] Emails affichés correctement
- [ ] Badges de type (Client/Prestataire)
- [ ] Badges de statut (Actif/Inactif/Suspendu)

### Test 3.5: Actions
**Éléments à vérifier:**
- [ ] Bouton "Voir" (Eye icon)
- [ ] Bouton "Suspendre" (Ban icon)
- [ ] Bouton "Supprimer" (Trash icon)

---

## 4. PAGE PRESTATAIRES

### Test 4.1: Accès à la Page
**URL:** `http://localhost:5173/dashboard/admin/prestataires`

**Éléments à vérifier:**
- [ ] Titre: "Gestion des Prestataires"
- [ ] Sous-titre: "Vérifiez et gérez les prestataires"
- [ ] Pas d'erreur de chargement

### Test 4.2: Statistiques
**Éléments à vérifier:**
- [ ] Carte "Total prestataires": affiche un nombre
- [ ] Carte "En attente de vérification": affiche un nombre (jaune)
- [ ] Carte "Vérifiés": affiche un nombre (vert)

### Test 4.3: Onglets
**Éléments à vérifier:**
- [ ] Onglet "En attente (X)"
- [ ] Onglet "Vérifiés (X)"
- [ ] Onglets cliquables et fonctionnels

### Test 4.4: Cartes Prestataires
**Éléments à vérifier:**
- [ ] Avatar avec initiales
- [ ] Nom du prestataire
- [ ] Badge "Vérifié" (si applicable)
- [ ] Profession affichée
- [ ] Localisation affichée
- [ ] Note affichée (étoile)
- [ ] Nombre de missions affichées

### Test 4.5: Actions
**Éléments à vérifier:**
- [ ] Bouton "Détails"
- [ ] Si en attente: Bouton "Vérifier" (vert)
- [ ] Si en attente: Bouton "Rejeter" (rouge)

### Test 4.6: Modal Détails
**Éléments à vérifier:**
- [ ] Modal s'ouvre au clic sur "Détails"
- [ ] Affiche: Spécialité, Email, Localisation, Note, Missions, Date
- [ ] Bouton "Fermer"
- [ ] Si en attente: Boutons "Vérifier" et "Rejeter"

---

## 5. PAGE DEMANDES

### Test 5.1: Accès à la Page
**URL:** `http://localhost:5173/dashboard/admin/demandes`

**Éléments à vérifier:**
- [ ] Titre: "Modération des Demandes"
- [ ] Sous-titre: "Approuvez ou rejetez les demandes de service"
- [ ] Pas d'erreur de chargement

### Test 5.2: Statistiques
**Éléments à vérifier:**
- [ ] Carte "Total demandes": affiche un nombre
- [ ] Carte "En attente": affiche un nombre (jaune)
- [ ] Carte "Approuvées": affiche un nombre (vert)
- [ ] Carte "Rejetées": affiche un nombre (rouge)

### Test 5.3: Onglets
**Éléments à vérifier:**
- [ ] Onglet "En attente (X)"
- [ ] Onglet "Approuvées (X)"
- [ ] Onglet "Rejetées (X)"

### Test 5.4: Cartes Demandes
**Éléments à vérifier:**
- [ ] Titre de la demande
- [ ] Badge de statut (couleur appropriée)
- [ ] Description (max 2 lignes)
- [ ] Nom du client
- [ ] Budget affichée
- [ ] Date de création

### Test 5.5: Actions
**Éléments à vérifier:**
- [ ] Bouton "Voir"
- [ ] Si en attente: Bouton "Approuver" (vert)
- [ ] Si en attente: Bouton "Rejeter" (rouge)

---

## 6. PAGE TRANSACTIONS

### Test 6.1: Accès à la Page
**URL:** `http://localhost:5173/dashboard/admin/transactions`

**Éléments à vérifier:**
- [ ] Titre: "Suivi des Transactions"
- [ ] Sous-titre: "Gérez et suivez tous les paiements"
- [ ] Pas d'erreur de chargement

### Test 6.2: Statistiques
**Éléments à vérifier:**
- [ ] Carte "Total transactions": affiche un nombre
- [ ] Carte "Complétées (FC)": affiche un montant (vert)
- [ ] Carte "En attente": affiche un nombre (jaune)
- [ ] Carte "Échouées": affiche un nombre (rouge)

### Test 6.3: Filtres
**Éléments à vérifier:**
- [ ] Dropdown "Tous les types" (Paiements/Remboursements/Retraits)
- [ ] Dropdown "Tous les statuts" (Complétées/En attente/Échouées)

### Test 6.4: Tableau Transactions
**Éléments à vérifier:**
- [ ] Colonnes: Référence, Type, Montant, Statut, Date, Actions
- [ ] Au moins 1 transaction affichée
- [ ] Montants affichés correctement
- [ ] Badges de type et statut

### Test 6.5: Modal Détails
**Éléments à vérifier:**
- [ ] Modal s'ouvre au clic sur "Voir"
- [ ] Affiche: Référence, Type, Montant, Statut, Client, Prestataire, Mission, Date
- [ ] Si en attente: Bouton "Marquer comme complétée"

---

## 7. PAGE LITIGES

### Test 7.1: Accès à la Page
**URL:** `http://localhost:5173/dashboard/admin/litiges`

**Éléments à vérifier:**
- [ ] Titre: "Résolution des Litiges"
- [ ] Sous-titre: "Gérez les litiges entre clients et prestataires"
- [ ] Pas d'erreur de chargement

### Test 7.2: Statistiques
**Éléments à vérifier:**
- [ ] Carte "Total litiges": affiche 0 (pas de litiges)
- [ ] Carte "Ouverts": affiche 0 (rouge)
- [ ] Carte "Résolus": affiche 0 (vert)
- [ ] Carte "Escaladés": affiche 0 (jaune)

### Test 7.3: Onglets
**Éléments à vérifier:**
- [ ] Onglet "Ouverts (0)"
- [ ] Onglet "Résolus (0)"
- [ ] Onglet "Escaladés (0)"
- [ ] Message "Aucun litige ouvert"

---

## 8. PAGE RAPPORTS

### Test 8.1: Accès à la Page
**URL:** `http://localhost:5173/dashboard/admin/rapports`

**Éléments à vérifier:**
- [ ] Titre: "Rapports & Analytics"
- [ ] Sous-titre: "Analysez les performances de la plateforme"
- [ ] Boutons "PDF" et "CSV" affichés
- [ ] Pas d'erreur de chargement

### Test 8.2: Statistiques Clés
**Éléments à vérifier:**
- [ ] Carte "Utilisateurs Totaux": affiche un nombre + croissance
- [ ] Carte "Revenus Totaux": affiche un montant + croissance
- [ ] Carte "Missions Actives": affiche un nombre

### Test 8.3: Onglets Rapports
**Éléments à vérifier:**
- [ ] Onglet "Vue d'ensemble"
- [ ] Onglet "Utilisateurs"
- [ ] Onglet "Revenus"
- [ ] Onglet "Litiges"

### Test 8.4: Contenu des Onglets
**Éléments à vérifier:**
- [ ] Chaque onglet affiche des statistiques
- [ ] Les nombres sont affichés correctement
- [ ] Pas d'erreur ou de valeurs "undefined"

---

## 9. PAGE CONFIGURATION

### Test 9.1: Accès à la Page
**URL:** `http://localhost:5173/dashboard/admin/configuration`

**Éléments à vérifier:**
- [ ] Titre: "Configuration"
- [ ] Sous-titre: "Gérez les paramètres de la plateforme"
- [ ] Pas d'erreur de chargement

### Test 9.2: Onglets
**Éléments à vérifier:**
- [ ] Onglet "Général"
- [ ] Onglet "Commission"
- [ ] Onglet "Vérification"
- [ ] Onglet "Notifications"
- [ ] Onglet "Sécurité"
- [ ] Onglet "Fonctionnalités"

### Test 9.3: Contenu des Onglets
**Éléments à vérifier:**
- [ ] Chaque onglet affiche des champs de configuration
- [ ] Les champs sont remplissables
- [ ] Les switches fonctionnent
- [ ] Bouton "Enregistrer" apparaît après modification

---

## 10. NAVIGATION

### Test 10.1: Menu Latéral
**Éléments à vérifier:**
- [ ] Logo KaziPro affichée
- [ ] Lien "Tableau de Bord"
- [ ] Lien "Utilisateurs"
- [ ] Lien "Prestataires"
- [ ] Lien "Demandes"
- [ ] Lien "Transactions"
- [ ] Lien "Litiges"
- [ ] Lien "Rapports"
- [ ] Lien "Configuration"
- [ ] Lien "Déconnexion"

### Test 10.2: Navigation Entre Pages
**Éléments à vérifier:**
- [ ] Cliquer sur chaque lien redirige vers la bonne page
- [ ] L'URL change correctement
- [ ] Le lien actif est mis en évidence

### Test 10.3: Breadcrumb/Titre
**Éléments à vérifier:**
- [ ] Le titre de la page change selon la page active
- [ ] Le sous-titre change selon la page active

---

## 11. RESPONSIVE DESIGN

### Test 11.1: Desktop (1920x1080)
**Éléments à vérifier:**
- [ ] Toutes les pages s'affichent correctement
- [ ] Pas de débordement de contenu
- [ ] Les tableaux sont lisibles

### Test 11.2: Tablet (768x1024)
**Éléments à vérifier:**
- [ ] Menu latéral peut être réduit
- [ ] Les cartes s'empilent correctement
- [ ] Les tableaux restent lisibles

### Test 11.3: Mobile (375x667)
**Éléments à vérifier:**
- [ ] Menu latéral peut être réduit
- [ ] Les cartes s'empilent correctement
- [ ] Les tableaux sont scrollables

---

## 12. PERFORMANCE

### Test 12.1: Temps de Chargement
**Éléments à vérifier:**
- [ ] Dashboard charge en < 2 secondes
- [ ] Pas de lag lors de la navigation
- [ ] Les données se chargent rapidement

### Test 12.2: Pas de Fuites Mémoire
**Éléments à vérifier:**
- [ ] Naviguer entre les pages ne cause pas de lag
- [ ] Les modals se ferment correctement
- [ ] Pas de console errors

---

## 13. ERREURS & EDGE CASES

### Test 13.1: Pas de Données
**Éléments à vérifier:**
- [ ] Si pas d'utilisateurs: message "Aucun utilisateur trouvé"
- [ ] Si pas de prestataires: message "Aucun prestataire en attente"
- [ ] Si pas de demandes: message "Aucune demande en attente"

### Test 13.2: Erreurs Réseau
**Éléments à vérifier:**
- [ ] Si Supabase est down: message d'erreur affichée
- [ ] Pas de crash de l'app
- [ ] Bouton "Réessayer" disponible

### Test 13.3: Permissions
**Éléments à vérifier:**
- [ ] Non-admin ne peut pas accéder à `/dashboard/admin`
- [ ] Non-admin est redirigé vers `/dashboard/client`

---

## Résumé des Tests

| Section | Tests | Statut |
|---------|-------|--------|
| 1. Login & Redirection | 1 | [ ] |
| 2. Admin Dashboard | 6 | [ ] |
| 3. Page Utilisateurs | 5 | [ ] |
| 4. Page Prestataires | 6 | [ ] |
| 5. Page Demandes | 5 | [ ] |
| 6. Page Transactions | 5 | [ ] |
| 7. Page Litiges | 3 | [ ] |
| 8. Page Rapports | 4 | [ ] |
| 9. Page Configuration | 3 | [ ] |
| 10. Navigation | 3 | [ ] |
| 11. Responsive Design | 3 | [ ] |
| 12. Performance | 2 | [ ] |
| 13. Erreurs & Edge Cases | 3 | [ ] |
| **TOTAL** | **49 tests** | [ ] |

---

## Notes

- Tous les tests doivent passer avant de considérer le dashboard admin comme complet
- Si un test échoue, noter le problème et créer un ticket de correction
- Tester sur plusieurs navigateurs (Chrome, Firefox, Safari)
- Tester sur plusieurs appareils (Desktop, Tablet, Mobile)

---

**Last Updated:** 22 December 2025  
**Status:** Ready for Testing
