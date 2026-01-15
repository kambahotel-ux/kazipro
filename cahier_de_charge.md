CAHIER DES CHARGES COMPLET
Application de mise en relation Clients ↔ Prestataires (Web &
Mobile)
1. Contexte et objectifs du projet
1.1 Contexte
En RDC, la recherche de prestataires fiables (électriciens, plombiers, installateurs de maison, etc.)
repose majoritairement sur le bouche-à-oreille, sans cadre formel, sans garantie de qualité ni sécurité
de paiement.
1.2 Objectif général
Créer une plateforme numérique sécurisée permettant : - aux clients de trouver des prestataires
qualifiés, - aux prestataires d’obtenir des missions régulières, - à la plateforme de jouer le rôle de tiers
de confiance (devis, paiement, litiges).
1.3 Objectifs spécifiques
•
•
•
•
Digitaliser les devis et contrats
Sécuriser les paiements via escrow
Réduire les fraudes et litiges
Professionnaliser les métiers techniques
2. Périmètre du projet
2.1 Plateformes concernées
•
•
📱 Application mobile (Flutter) : Clients & Prestataires
🌐 Application web (React) : Administration & supervision
•
🔙 Backend : Supabase (PostgreSQL, Auth, Edge Functions)
2.2 Zone de lancement
•
•
Phase pilote : 1 ville (ex : Kinshasa)
Extension progressive par communes
3. Acteurs et rôles
3.1 Client
•
Crée une demande de service
1
•
•
•
•
Reçoit et accepte des devis
Paie via mobile money
Suit l’exécution du service
Note le prestataire
3.2 Prestataire
•
•
•
•
•
Crée un profil professionnel
Reçoit des demandes ciblées
Émet des devis
Exécute les services
Reçoit les paiements via l’app
3.3 Administrateur
•
•
•
•
Valide les prestataires
Supervise les transactions
Gère les litiges
Configure les commissions
4. Fonctionnalités détaillées
4.1 Authentification
•
•
•
Inscription par numéro de téléphone
Vérification OTP
Gestion des rôles (client / prestataire / admin)
4.2 Gestion des profils
Client
•
•
•
Nom
Téléphone
Historique des demandes
Prestataire
•
•
•
•
•
Informations personnelles
Services proposés
Zones couvertes
Années d’expérience
Statut de validation
4.3 Demande de service (Client)
•
•
Choix du type de service
Description du besoin
2
•
•
•
Localisation (quartier)
Date souhaitée
Envoi de la demande
4.4 Devis (Prestataire)
•
•
•
•
Réponse à une demande
Définition du coût de la main-d’œuvre
Découpage du paiement (ex : 30/40/30)
Durée estimée
4.5 Acceptation du devis (Client)
•
•
•
Visualisation détaillée
Acceptation ou refus
Génération automatique du contrat
4.6 Paiement & Escrow
•
•
•
•
Paiement via Mobile Money
Séquestration des fonds
Libération progressive selon validation
Commission automatique de la plateforme
4.7 Suivi du service
•
•
•
Checklist des étapes
Téléversement de photos
Validation par le client
4.8 Notation & avis
•
•
•
Évaluation du prestataire
Commentaire optionnel
Calcul de la note globale
4.9 Litiges
•
•
•
•
Ouverture d’un litige
Gel des paiements
Arbitrage par l’admin
Décision finale (libération / remboursement)
3
5. Paiements
5.1 Moyens acceptés
•
•
•
M-Pesa
Airtel Money
Orange Money
5.2 Règles
•
•
•
Paiement obligatoire via l’application
Interdiction du cash pour la main-d’œuvre
Paiements hors app = sans garantie
6. Sécurité
•
•
•
•
•
Authentification sécurisée
Row Level Security (Supabase)
Accès restreint aux données sensibles
Paiements uniquement via Edge Functions
Journalisation des actions critiques
7. Contraintes techniques
7.1 Mobile
•
•
•
Android first
Offline partiel
Notifications push
7.2 Web
•
•
Accès admin sécurisé
Responsive
7.3 Backend
•
•
Supabase PostgreSQL
Edge Functions pour la logique métier
8. Performances attendues
•
•
Temps de réponse API < 500 ms
Support de 1 000 utilisateurs actifs (phase 1)
4
9. Planning prévisionnel
•
•
•
•
Semaine 1 : Auth & profils
Semaine 2 : Demandes & devis
Semaine 3 : Paiement & escrow
Semaine 4 : Admin, tests, lancement pilote
10. Indicateurs de succès
•
•
•
•
Nombre de prestataires actifs
Nombre de missions par mois
Taux de litiges
Revenus mensuels
11. Évolutions futures
•
•
•
•
Assurance chantier
Abonnements premium
Extension multi-villes
Application iOS
12. Conclusion
Ce cahier des charges définit une plateforme professionnelle, sécurisée et adaptée au contexte
RDC, conçue pour être scalable, rentable et crédible auprès des utilisateurs comme des partenaires.