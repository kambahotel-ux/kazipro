# 🚀 KaziPro - Roadmap de Développement

## 📊 Vue d'ensemble
Plateforme de services en ligne pour la RDC. Architecture : React + TypeScript + Vite + shadcn/ui + Tailwind CSS

---

## 🎯 PHASE 1 : FONDATIONS (Semaine 1-2)

### 1.1 Configuration Backend & Authentification
- [ ] Créer projet Supabase
- [ ] Configurer tables de base de données
  - [ ] users (id, email, phone, password_hash, role, created_at)
  - [ ] clients (user_id, full_name, address, city, verified)
  - [ ] prestataires (user_id, full_name, profession, bio, rating, verified, documents)
  - [ ] demandes (id, client_id, title, description, service, location, budget_min, budget_max, status, created_at)
  - [ ] devis (id, demande_id, prestataire_id, amount, description, status, created_at)
  - [ ] missions (id, devis_id, client_id, prestataire_id, status, start_date, end_date)
  - [ ] paiements (id, mission_id, amount, method, status, created_at)
  - [ ] avis (id, mission_id, from_user_id, to_user_id, rating, comment, created_at)
  - [ ] messages (id, sender_id, receiver_id, content, created_at)
- [ ] Configurer authentification Supabase (email/phone + password)
- [ ] Configurer Row Level Security (RLS)

### 1.2 Intégration Authentification Frontend
- [ ] Installer @supabase/supabase-js
- [ ] Créer contexte d'authentification (AuthContext)
- [ ] Implémenter hook useAuth()
- [ ] Créer composant ProtectedRoute
- [ ] Connecter page Login à Supabase
- [ ] Connecter pages RegisterClient et RegisterProvider à Supabase
- [ ] Implémenter logout
- [ ] Ajouter persistance de session

### 1.3 Pages d'Authentification Manquantes
- [ ] Créer page "Mot de passe oublié" (forgot-password)
- [ ] Créer page "Réinitialiser mot de passe" (reset-password)
- [ ] Créer page "Vérification email" (verify-email)
- [ ] Ajouter routes dans App.tsx

---

## 🎯 PHASE 2 : PAGES CLIENT (Semaine 2-3)

### 2.1 Pages Manquantes Client
- [ ] **MessagesPage.tsx** - Système de messaging
  - [ ] Liste des conversations
  - [ ] Vue détaillée d'une conversation
  - [ ] Formulaire d'envoi de message
  - [ ] Intégration Supabase (fetch messages, send message)
  
- [ ] **ParametresPage.tsx** - Paramètres du compte
  - [ ] Profil utilisateur (nom, email, téléphone)
  - [ ] Adresse et localisation
  - [ ] Préférences de notification
  - [ ] Sécurité (changement mot de passe)
  - [ ] Suppression de compte

### 2.2 Pages Client à Compléter
- [ ] **DemandesPage.tsx** - Connecter à Supabase
  - [ ] Fetch demandes de l'utilisateur
  - [ ] Filtrage et recherche
  - [ ] Affichage des devis reçus
  
- [ ] **NouvelleDemandePages.tsx** - Compléter
  - [ ] Upload d'images vers Supabase Storage
  - [ ] Validation côté serveur
  - [ ] Création de demande en base de données
  
- [ ] **PaiementsPage.tsx** - Connecter à Supabase
  - [ ] Fetch historique des paiements
  - [ ] Affichage du solde escrow
  
- [ ] **AvisPage.tsx** - Connecter à Supabase
  - [ ] Fetch avis donnés
  - [ ] Édition/suppression d'avis
  - [ ] Création d'avis après mission

---

## 🎯 PHASE 3 : PAGES PRESTATAIRE (Semaine 3-4)

### 3.1 Pages Manquantes Prestataire
- [ ] **MessagesPage.tsx** - Système de messaging (identique au client)
  
- [ ] **ParametresPage.tsx** - Paramètres du compte prestataire
  - [ ] Profil professionnel
  - [ ] Spécialités/services
  - [ ] Tarifs
  - [ ] Disponibilité
  - [ ] Documents de vérification
  
- [ ] **ProfilPage.tsx** - Profil public du prestataire
  - [ ] Affichage du profil
  - [ ] Statistiques (missions, revenus, rating)
  - [ ] Portfolio/galerie
  - [ ] Avis reçus
  
- [ ] **CalendrierPage.tsx** - Calendrier des missions
  - [ ] Vue calendrier
  - [ ] Affichage des missions planifiées
  - [ ] Gestion de la disponibilité
  
- [ ] **DevisPage.tsx** - Gestion des devis
  - [ ] Liste des devis envoyés
  - [ ] Création de devis
  - [ ] Édition/suppression de devis
  - [ ] Statut des devis
  
- [ ] **RevenusPage.tsx** - Suivi des revenus
  - [ ] Graphique des revenus
  - [ ] Historique des paiements reçus
  - [ ] Statistiques mensuelles/annuelles

### 3.2 Pages Prestataire à Compléter
- [ ] **MissionsPage.tsx** - Connecter à Supabase
  - [ ] Fetch missions disponibles
  - [ ] Fetch missions en cours
  - [ ] Fetch missions terminées

---

## 🎯 PHASE 4 : PAGES ADMIN (Semaine 4-5)

### 4.1 Pages Admin à Implémenter
- [ ] **UsersPage.tsx** - Gestion des utilisateurs
  - [ ] Liste des utilisateurs
  - [ ] Filtrage (clients, prestataires)
  - [ ] Suspension/activation
  - [ ] Suppression
  
- [ ] **ProvidersPage.tsx** - Gestion des prestataires
  - [ ] Liste des prestataires
  - [ ] Vérification des documents
  - [ ] Approbation/rejet
  - [ ] Suspension
  
- [ ] **RequestsPage.tsx** - Gestion des demandes
  - [ ] Liste des demandes
  - [ ] Modération
  - [ ] Suppression de contenu inapproprié
  
- [ ] **DisputesPage.tsx** - Gestion des litiges
  - [ ] Liste des litiges ouverts
  - [ ] Détails du litige
  - [ ] Résolution
  - [ ] Remboursement
  
- [ ] **TransactionsPage.tsx** - Suivi des transactions
  - [ ] Historique complet
  - [ ] Filtrage par statut
  - [ ] Rapports
  
- [ ] **ReportsPage.tsx** - Rapports et statistiques
  - [ ] Graphiques de croissance
  - [ ] Statistiques utilisateurs
  - [ ] Revenus de la plateforme
  - [ ] Taux de satisfaction
  
- [ ] **ConfigPage.tsx** - Configuration de la plateforme
  - [ ] Paramètres généraux
  - [ ] Commissions
  - [ ] Catégories de services
  - [ ] Villes/communes

---

## 🎯 PHASE 5 : FONCTIONNALITÉS CRITIQUES (Semaine 5-6)

### 5.1 Système de Paiement
- [ ] Intégration M-Pesa
- [ ] Intégration Airtel Money
- [ ] Intégration Orange Money
- [ ] Système d'escrow
- [ ] Webhook pour confirmations de paiement
- [ ] Gestion des remboursements

### 5.2 Système de Messaging
- [ ] Realtime avec Supabase (subscriptions)
- [ ] Notifications
- [ ] Historique des messages
- [ ] Archivage de conversations

### 5.3 Système de Notation/Avis
- [ ] Création d'avis après mission
- [ ] Affichage des avis
- [ ] Calcul de la note moyenne
- [ ] Modération des avis

### 5.4 Système de Devis
- [ ] Création de devis
- [ ] Acceptation/rejet de devis
- [ ] Modification de devis
- [ ] Historique des devis

### 5.5 Vérification des Prestataires
- [ ] Upload de documents
- [ ] Vérification manuelle par admin
- [ ] Badge "Vérifié"
- [ ] Système de points de confiance

---

## 🎯 PHASE 6 : OPTIMISATIONS & TESTS (Semaine 6-7)

### 6.1 Performance
- [ ] Optimiser les requêtes Supabase
- [ ] Implémenter pagination
- [ ] Lazy loading des images
- [ ] Caching avec React Query

### 6.2 Sécurité
- [ ] Validation des formulaires côté serveur
- [ ] Protection CSRF
- [ ] Rate limiting
- [ ] Sanitization des inputs
- [ ] Audit des permissions RLS

### 6.3 Tests
- [ ] Tests unitaires (Vitest)
- [ ] Tests d'intégration
- [ ] Tests E2E (Playwright)
- [ ] Tests de sécurité

### 6.4 Accessibilité
- [ ] Audit WCAG 2.1
- [ ] Corrections d'accessibilité
- [ ] Tests avec lecteur d'écran

---

## 🎯 PHASE 7 : DÉPLOIEMENT (Semaine 7-8)

### 7.1 Préparation
- [ ] Variables d'environnement
- [ ] Configuration de production
- [ ] Backup de base de données
- [ ] Plan de migration

### 7.2 Déploiement
- [ ] Déployer sur Vercel/Netlify
- [ ] Configurer domaine personnalisé
- [ ] SSL/HTTPS
- [ ] CDN pour images

### 7.3 Post-Déploiement
- [ ] Monitoring
- [ ] Logs et alertes
- [ ] Support utilisateurs
- [ ] Documentation

---

## 📋 TÂCHES IMMÉDIATES (À FAIRE EN PREMIER)

### Priorité 1 - CRITIQUE (Jour 1-2)
1. [ ] Créer projet Supabase et configurer tables
2. [ ] Installer @supabase/supabase-js
3. [ ] Créer AuthContext et hook useAuth()
4. [ ] Implémenter ProtectedRoute
5. [ ] Connecter page Login à Supabase

### Priorité 2 - HAUTE (Jour 3-4)
6. [ ] Connecter RegisterClient et RegisterProvider
7. [ ] Implémenter logout et persistance de session
8. [ ] Créer pages d'authentification manquantes
9. [ ] Ajouter routes dans App.tsx
10. [ ] Tester le flux d'authentification complet

### Priorité 3 - MOYENNE (Jour 5-7)
11. [ ] Implémenter MessagesPage client
12. [ ] Implémenter ParametresPage client
13. [ ] Connecter DemandesPage à Supabase
14. [ ] Implémenter upload d'images dans NouvelleDemandePages
15. [ ] Connecter PaiementsPage et AvisPage

---

## 🔧 Stack Technique

**Frontend:**
- React 18.3.1
- TypeScript 5.8.3
- Vite 5.4.19
- Tailwind CSS 3.4.17
- shadcn/ui
- React Router 6.30.1
- React Hook Form 7.61.1
- React Query 5.83.0
- Zod 3.25.76

**Backend:**
- Supabase (PostgreSQL + Auth + Storage)
- Realtime subscriptions

**Paiements:**
- M-Pesa API
- Airtel Money API
- Orange Money API

**Déploiement:**
- Vercel ou Netlify (frontend)
- Supabase (backend)

---

## 📝 Notes Importantes

1. **Données mockées** : Actuellement, les pages affichent des données mockées. À remplacer progressivement par des appels Supabase.

2. **Permissions** : Implémenter RLS pour que chaque utilisateur ne voie que ses données.

3. **Notifications** : Ajouter un système de notifications (toast) pour les actions utilisateur.

4. **Erreurs** : Gérer les erreurs API et afficher des messages clairs.

5. **Loading states** : Ajouter des spinners pendant les requêtes.

6. **Validation** : Utiliser Zod pour la validation côté client et serveur.

---

## 🎓 Ressources Utiles

- [Supabase Docs](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)

---

**Dernière mise à jour:** 22 Décembre 2025
**Statut:** En cours de planification
