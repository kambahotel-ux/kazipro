# Cahier des charges – KaziPro

**Document de spécifications fonctionnelles et techniques**  
**Version :** 1.0  
**Date :** Mars 2025

---

## 1. Présentation générale

### 1.1 Objet du document

Ce cahier des charges décrit l’application **KaziPro**, plateforme web de mise en relation entre **clients** et **prestataires de services** (artisans, techniciens) avec gestion des devis, contrats, signatures électroniques et paiements (Mobile Money).

### 1.2 Contexte et objectifs

- **Contexte :** Faciliter la recherche de prestataires qualifiés, la comparaison des offres, la contractualisation et le paiement sécurisé (M-Pesa, Airtel Money, Orange Money).
- **Objectifs :**
  - Mettre en relation clients et prestataires par profession et zone.
  - Gérer le cycle complet : demande → devis → contrat → signature → paiement (acompte/solde) → mission → validation.
  - Sécuriser les échanges (contrats, signatures, traçabilité des paiements).
  - Offrir un espace d’administration pour paramétrage et modération.

### 1.3 Périmètre

- **Inclus :** Site vitrine, inscription client/prestataire, tableaux de bord client/prestataire/admin, demandes, devis (simples et professionnels), contrats, signatures, paiements, missions, messagerie, avis, litiges, calendrier prestataire, configuration paiement.
- **Hors périmètre explicite :** Intégration réelle des API Mobile Money (simulation côté front), 2FA et changement de mot de passe complets, notifications push.

---

## 2. Utilisateurs et rôles

| Rôle | Description | Accès principal |
|------|-------------|-----------------|
| **Visiteur** | Non connecté | Accueil, services, comment ça marche, à propos, connexion, inscription |
| **Client** | Particulier ou entreprise qui recherche un prestataire | Dashboard client : demandes, devis, contrats, paiements, missions, messages, avis, paramètres, recherche prestataires |
| **Prestataire** | Artisan / technicien qui répond aux demandes | Dashboard prestataire : opportunités, demandes, devis, missions, contrats, calendrier, revenus, messages, profil, paramètres, config paiement, frais de déplacement |
| **Administrateur** | Gestion de la plateforme | Dashboard admin : utilisateurs, prestataires, professions, demandes, devis, litiges, transactions, rapports, configuration globale, config paiement, tests |

**Identification administrateur :** email `admin@kazipro.com` (connexion dédiée, redirection vers `/dashboard/admin`).

---

## 3. Fonctionnalités détaillées

### 3.1 Site vitrine (non connecté)

- **Pages :**
  - **Accueil (/)** : Hero, services, comment ça marche, confiance, CTA.
  - **Services (/services)** : Liste des services/professions.
  - **Détail service (/services/:serviceId)** : Fiche service.
  - **Comment ça marche (/comment-ca-marche)** : Étapes côté client et côté prestataire.
  - **À propos (/a-propos)** : Présentation.
- **Fonctionnalités :**
  - Compteur de prestataires en ligne (rafraîchi périodiquement).
  - Mise en avant d’un prestataire vérifié.
  - Liens vers connexion et inscription (client / prestataire).

### 3.2 Authentification et inscription

- **Connexion (/connexion)**  
  - Email + mot de passe.  
  - Connexion Google (AuthCallback).  
  - Redirection selon profil : admin → `/dashboard/admin`, prestataire → `/dashboard/prestataire`, sinon → `/dashboard/client`.

- **Inscription client (/inscription/client)**  
  - Création compte (auth) + enregistrement en table `clients` (profil).

- **Inscription prestataire**  
  - **/inscription/prestataire** : Formulaire simplifié (RegisterProviderSimple).  
  - **/inscription/prestataire/complete** : Complétion du profil (RegisterProvider).  
  - **/inscription/prestataire/steps** : Parcours en étapes (RegisterProviderSteps).  
  - Vérification OTP : **/auth/verify-otp**.  
  - Callback OAuth : **/auth/callback**.

- **Sécurité :** Routes protégées (`ProtectedRoute`), routes admin (`AdminRoute`), garde « profil requis » (`ProfileRequiredGuard`) pour prestataires.

### 3.3 Espace client

- **Dashboard client (/dashboard/client)**  
  - Vue d’ensemble : demandes, devis, accès rapides.

- **Demandes**  
  - **Liste (/dashboard/client/demandes)** : Mes demandes (création, statuts).  
  - **Nouvelle demande (/dashboard/client/demandes/nouvelle)** : Création avec titre, description, service, lieu, budget min/max, éventuellement pièces.  
  - **Détail (/dashboard/client/demandes/:demandeId)** : Détail demande, liste des devis reçus, actions.

- **Devis et contrat**  
  - **Accepter devis (/dashboard/client/devis/:devisId/accepter)** : Acceptation d’un devis (compatible `devis` et `devis_pro`), mise à jour statut, apparition du bouton « Voir le contrat ».  
  - **Voir / signer contrat (/dashboard/client/contrat/:devisId)** :  
    - Affichage du contrat enrichi (HTML) avec parties, articles, tableau de paiement.  
    - Téléchargement PDF (html2canvas + jsPDF, A4, multi-pages).  
    - Signature électronique (canvas), envoi vers Supabase Storage, mise à jour du contrat (statut `signe_client`).  
    - Redirection vers paiement acompte.

- **Paiement**  
  - **Acompte (/dashboard/client/paiement/:contratId/acompte)** : Affichage montants (travaux, matériel, déplacement, total, acompte 30 % par défaut), choix méthode (M-Pesa, Airtel Money, Orange Money), simulation paiement, création enregistrement en table `paiements`, création de la mission.  
  - **Confirmation (/dashboard/client/paiement/:paiementId/confirmation)** : Récapitulatif du paiement.

- **Missions**  
  - **Détail mission (/dashboard/client/missions/:missionId)** : Suivi de la mission, lien avec demande/devis/contrat.

- **Autres**  
  - **Paiements (/dashboard/client/paiements)** : Historique des paiements.  
  - **Avis (/dashboard/client/avis)** : Donner / consulter avis.  
  - **Messages (/dashboard/client/messages)** : Messagerie avec prestataires.  
  - **Paramètres (/dashboard/client/parametres)** : Profil client.  
  - **Recherche prestataires (/dashboard/client/recherche)** : Recherche par critères.  
  - **Profil prestataire (/dashboard/client/prestataire/:id)** : Fiche prestataire.

### 3.4 Espace prestataire

- **Dashboard prestataire (/dashboard/prestataire)**  
  - Vue d’ensemble : opportunités, demandes, devis, missions, revenus.

- **Profil et paramètres**  
  - **Compléter profil (/dashboard/prestataire/completer-profil)** : Complétion du profil (obligatoire si non complété).  
  - **Profil (/dashboard/prestataire/profil)** : Consultation/édition profil.  
  - **Paramètres (/dashboard/prestataire/parametres)** : Entreprise (logo, signature), disponibilité (toggle, horaires), notifications (UI), préférences (langue, fuseau), sécurité (mot de passe, 2FA partiellement prévus).  
  - **Config paiement (/dashboard/prestataire/config-paiement)** : Activer/désactiver paiement via KaziPro, choix des éléments (main-d’œuvre, matériel, déplacement), commissions personnalisées, acompte/délais.  
  - **Frais de déplacement (/dashboard/prestataire/frais-deplacement)** : Mode (fixe, par km, par zone, gratuit), tarifs, zones.

- **Demandes et devis**  
  - **Opportunités (/dashboard/prestataire/opportunites)** : Demandes correspondant au prestataire.  
  - **Détail demande (/dashboard/prestataire/demandes/:id)** : Détail + création devis.  
  - **Créer devis (/dashboard/prestataire/devis/nouveau/:demandeId)** : Devis professionnel (lignes, montants HT/TTC, conditions).  
  - **Devis (/dashboard/prestataire/devis)** : Liste des devis (brouillon, envoyé, accepté, refusé, expiré).

- **Missions et contrats**  
  - **Missions (/dashboard/prestataire/missions)** : Liste et suivi des missions.  
  - **Contrats (/dashboard/prestataire/contrats)** : Liste des contrats.  
  - **Voir contrat (/dashboard/prestataire/contrat/:contratId)** : Consultation contrat.

- **Planification et revenus**  
  - **Calendrier (/dashboard/prestataire/calendrier)** : Événements liés aux missions (création automatique à la création de mission).  
  - **Revenus (/dashboard/prestataire/revenus)** : Synthèse des revenus.

- **Communication**  
  - **Messages (/dashboard/prestataire/messages)** : Messagerie avec clients.

### 3.5 Espace administration

- **Dashboard admin (/dashboard/admin)**  
  - Vue d’ensemble plateforme.

- **Gestion des données**  
  - **Utilisateurs (/dashboard/admin/utilisateurs)** : Gestion des comptes.  
  - **Prestataires (/dashboard/admin/prestataires)** : Liste, vérification, mise à jour.  
  - **Professions (/dashboard/admin/professions)** : CRUD des professions (référentiel métier).  
  - **Demandes (/dashboard/admin/demandes)** : Consultation, modération.  
  - **Devis (/dashboard/admin/devis)** : Consultation des devis.  
  - **Litiges (/dashboard/admin/litiges)** : Ouverture, suivi, résolution (types : qualité, délai, paiement, autre ; décisions : remboursement client, paiement prestataire, partiel, sans action).  
  - **Transactions (/dashboard/admin/transactions)** : Liste des paiements.  
  - **Rapports (/dashboard/admin/rapports)** : Statistiques et rapports.

- **Configuration**  
  - **Configuration générale (/dashboard/admin/configuration)** : Paramètres globaux.  
  - **Config paiement (/dashboard/admin/config-paiement)** :  
    - Mode (désactivé, optionnel, obligatoire).  
    - Commissions (main-d’œuvre, matériel, déplacement).  
    - Acompte/solde par défaut (ex. 30 % / 70 %).  
    - Délais (validation, paiement), garantie.  
    - Permissions prestataires (désactivation, choix des éléments, négociation, modification acompte/délais).  
  - **Test config (/dashboard/admin/test-config)** : Tests de la configuration paiement.

### 3.6 Flux métier principal (résumé)

1. **Client** crée une **demande** (titre, description, service, lieu, budget).  
2. **Prestataires** concernés voient l’opportunité et envoient des **devis** (simples ou professionnels avec lignes).  
3. **Client** **accepte** un devis → statut devis mis à jour.  
4. **Contrat** généré automatiquement (trigger ou processus métier) à partir du devis.  
5. **Client** consulte le contrat, **télécharge le PDF**, **signe** électroniquement → contrat passé en `signe_client`.  
6. **Client** est redirigé vers **paiement acompte** (30 % par défaut), choisit Mobile Money, valide (simulation) → enregistrement **paiement** + création **mission**.  
7. **Mission** créée (statut `en_cours`) ; un **événement calendrier** peut être créé automatiquement.  
8. À la fin des travaux, **client** valide → possibilité de **paiement du solde** (70 %) et **avis**.

---

## 4. Modèle de données (principales entités)

### 4.1 Utilisateurs et profils

- **auth.users** (Supabase Auth) : Comptes (email, mot de passe, OAuth).
- **clients** : `id`, `user_id`, `full_name`, `address`, `city`, `verified`, `created_at`, `updated_at`.
- **prestataires** : `id`, `user_id`, `full_name`, `profession`, `bio`, `rating`, `verified`, `documents_verified`, `profile_completed`, `email`, `phone`, `experience_years`, `personne_physique_morale`, etc., `created_at`, `updated_at`.
- **professions** : `id`, `nom`, `description`, `actif`, `slug`, `created_at`, `updated_at` (référentiel géré par l’admin).

### 4.2 Demandes et devis

- **demandes** : `id`, `client_id`, `title`, `description`, `service`, `location`, `budget_min`, `budget_max`, `status` (active, completed, cancelled), `profession`, `created_at`, `updated_at`.
- **devis** (devis simple) : `id`, `demande_id`, `prestataire_id`, `amount`, `description`, `status` (pending, accepted, rejected), `created_at`, `updated_at`.
- **devis_pro** : `id`, `numero`, `prestataire_id`, `client_id`, `demande_id`, `titre`, `description`, `notes`, `conditions`, `montant_ht`, `tva`, `montant_ttc`, `statut` (brouillon, envoye, accepte, refuse, expire), dates (création, envoi, expiration, acceptation, refus), `created_at`, `updated_at`.
- **devis_pro_items** : `id`, `devis_id`, `designation`, `quantite`, `unite`, `prix_unitaire`, `montant`, `ordre`, `created_at`.

### 4.3 Contrats et signatures

- **contrats** : `id`, `numero`, `devis_id`, `client_id`, `prestataire_id`, `contenu_html`, `contrat_pdf_url`, `signature_client_url`, `signature_prestataire_url`, `date_signature_client`, `date_signature_prestataire`, `statut` (genere, signe_client, signe_complet, annule), `conditions_paiement` (JSONB), `metadata`, `created_at`, `updated_at`.  
  Création automatique possible par trigger à l’acceptation du devis.

### 4.4 Paiements

- **paiements** : `id`, `numero`, `contrat_id`, `devis_id`, `mission_id`, `client_id`, `prestataire_id`, `type_paiement` (acompte, solde, complet, echeance, garantie), `montant_travaux`, `montant_materiel`, `montant_deplacement`, `montant_total`, commissions (travaux, matériel, déplacement, totale), `montant_prestataire`, `methode_paiement` (mpesa, airtel_money, orange_money, etc.), `statut` (en_attente, en_cours, valide, echoue, rembourse, annule), `transaction_id`, `reference_paiement`, `recu_url`, preuves et validations, dates (échéance, paiement, validation), `metadata`, `error_message`, `created_at`, `updated_at`.  
  Numéros générés par des fonctions SQL (ex. `generate_paiement_numero()`).

### 4.5 Configuration paiement

- **configuration_paiement_globale** : Mode (desactive, optionnel, obligatoire), commissions (main-d’œuvre, matériel, déplacement), pourcentages acompte/solde, délais (validation, paiement), garantie, permissions prestataires, traçabilité.
- **configuration_paiement_prestataire** : Par prestataire (activation, éléments facturés via KaziPro, commissions et acompte personnalisés, délais).
- **frais_deplacement_config** : Par prestataire (actif, mode : fixe, par_km, par_zone, gratuit), tarifs, zones, limites.
- **conditions_paiement_templates** : Modèles de conditions (complet_avant, complet_apres, acompte_solde, echelonne), pourcentages, échéances.
- **historique_config_paiement** : Historique des changements de configuration (admin, anciennes/nouvelles valeurs, raison, date).

### 4.6 Missions et calendrier

- **missions** : `id`, `devis_id`, `demande_id`, `client_id`, `prestataire_id`, `status` (pending, in_progress, completed, cancelled), `start_date`, `end_date`, `created_at`, `updated_at`.
- **calendar_events** : `id`, `mission_id`, `title`, `description`, `type` (mission, visite, rdv, autre), `start_date`, `end_date`, `prestataire_id`, `client_id`, `client_name`, `location`, `status` (scheduled, confirmed, cancelled, completed), rappels, `created_at`, `updated_at`. Création automatique possible à la création de mission.

### 4.7 Messagerie, avis et litiges

- **messages** : `id`, `sender_id`, `receiver_id` (auth.users), `content`, `demande_id`, `devis_id`, `read`, `read_at`, `created_at`, `updated_at`.
- **avis** : `id`, mission/client/prestataire, note, commentaire, `created_at`, etc.
- **litiges** : `id`, `mission_id`, `client_id`, `prestataire_id`, `titre`, `description`, `type` (qualite, delai, paiement, autre), `statut` (open, in_progress, resolved, escalated, closed), `priorite`, `montant_litige`, `resolution`, `resolu_par`, `decision` (refund_client, pay_prestataire, partial_refund, no_action), preuves (JSONB), `notes_admin`, dates, `metadata`.

### 4.8 Stockage (Supabase Storage)

- **signatures** : Stockage des images de signature (contrats).
- **contrats** : PDF de contrats (si générés côté serveur).
- **demandes** : Pièces jointes des demandes.
- **recus** : Reçus de paiement.

Politiques RLS et tailles limites définies par scripts SQL (ex. 1 MB signatures, 10 MB contrats).

---

## 5. Exigences techniques

### 5.1 Stack technique

- **Frontend :** React 18, TypeScript, Vite, React Router v6.
- **UI :** Tailwind CSS, Radix UI (shadcn/ui), Lucide React, composants (Button, Input, Dialog, Tabs, etc.).
- **État / données :** TanStack React Query.
- **Formulaires :** React Hook Form, Zod (validation).
- **Backend / BDD :** Supabase (PostgreSQL, Auth, Storage, Realtime).
- **PDF :** jsPDF, html2canvas (génération côté client).
- **Signature :** react-signature-canvas.

### 5.2 Sécurité

- **Authentification :** Supabase Auth (email/mot de passe, Google OAuth).
- **Autorisation :** Row Level Security (RLS) sur les tables (clients, prestataires, demandes, devis, contrats, paiements, missions, messages, avis, litiges, calendar_events, configurations). Politiques par rôle (client, prestataire, admin).
- **Contrôle d’accès :** `ProtectedRoute`, `AdminRoute`, `ProfileRequiredGuard`.
- **Stockage :** Buckets privés avec politiques d’accès (signatures, contrats, etc.).

### 5.3 Environnements et déploiement

- **Développement :** `npm run dev` (Vite).
- **Build :** `npm run build` (production), `npm run build:dev` (mode development).
- **Preview :** `npm run preview`.
- **Variables d’environnement :** URL et clé anonyme Supabase (`.env` ou équivalent).

### 5.4 Compatibilité et contraintes

- **Navigateurs :** Navigateurs modernes (Chrome, Firefox, Safari, Edge).
- **Responsive :** Interface adaptée desktop et mobile (améliorations mobiles documentées).
- **Devis :** L’application gère à la fois les tables `devis` (legacy) et `devis_pro` pour compatibilité avec les données existantes.
- **Paiement :** Simulation Mobile Money côté front ; aucune intégration réelle des API opérateurs dans le périmètre décrit.

---

## 6. Livrables et maintenance

### 6.1 Livrables

- Code source (répo Git) : application React/TypeScript, scripts SQL (création/migration tables, RLS, triggers, fonctions).
- Documentation : ce cahier des charges, fichiers texte de récap (SYSTEME_COMPLET_FONCTIONNEL.txt, VRAIMENT_TOUT_EST_PRET.txt, PARAMETRES_FONCTIONNELS.md, etc.).
- Scripts SQL à exécuter dans Supabase pour finaliser le système (ex. FIX_COMPLET_PAIEMENT_FINAL.sql, FIX_TOUTES_FONCTIONS_NUMERO.sql) selon l’état du déploiement.

### 6.2 Dépendances externes

- Compte et projet Supabase (base PostgreSQL, Auth, Storage).
- Domaine / hébergement pour le frontend (optionnel selon contexte).
- Compte Google Cloud (optionnel, pour OAuth Google).

### 6.3 Évolutions prévues ou partielles

- Notifications (préférences UI présentes, sauvegarde à finaliser).
- Changement de mot de passe et 2FA (partiellement prévus dans les paramètres).
- Table `prestataire_settings` pour notifications, langue, fuseau (documentée dans PARAMETRES_FONCTIONNELS.md).
- Intégration réelle des API Mobile Money (hors périmètre actuel).

---

## 7. Glossaire

| Terme | Définition |
|-------|------------|
| **Devis** | Proposition tarifaire (simple ou professionnel avec lignes) envoyée par un prestataire à un client. |
| **Devis pro** | Devis détaillé (lignes, HT/TTC, conditions) stocké dans `devis_pro` et `devis_pro_items`. |
| **Contrat** | Document contractuel généré après acceptation d’un devis ; signé électroniquement par le client (et éventuellement le prestataire). |
| **Acompte** | Premier paiement (ex. 30 % du total) avant réalisation des travaux. |
| **Solde** | Paiement restant (ex. 70 %) après validation des travaux par le client. |
| **Mission** | Engagement de réalisation lié à un devis accepté et un contrat ; créée après paiement de l’acompte. |
| **Litige** | Différend (qualité, délai, paiement, autre) géré par l’admin avec décisions (remboursement, paiement, partiel, sans action). |
| **RLS** | Row Level Security (PostgreSQL) : restrictions d’accès aux lignes selon l’utilisateur connecté. |

---

## 8. Références

- **Fichiers projet :** `App.tsx` (routes), `package.json` (dépendances), dossiers `src/pages`, `src/components`, `sql/`.
- **Documentation interne :** SYSTEME_COMPLET_FONCTIONNEL.txt, VRAIMENT_TOUT_EST_PRET.txt, PARAMETRES_FONCTIONNELS.md, CONTRAT_ENRICHI_ET_PDF_FINAL.txt, et autres fichiers .txt/.md à la racine et dans `.kiro/specs/`.

---

*Fin du cahier des charges – KaziPro.*
