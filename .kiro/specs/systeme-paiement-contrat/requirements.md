# Requirements Document - Système de Paiement et Contractualisation

## Introduction

Le système de paiement et contractualisation de KaziPro permet de gérer le cycle complet de transaction entre clients et prestataires, depuis l'acceptation d'un devis jusqu'au paiement final. Le système génère automatiquement des contrats légaux, gère les signatures électroniques, sépare les frais de travaux des frais de déplacement, et supporte plusieurs méthodes de paiement incluant les paiements échelonnés.

## Glossary

- **System**: Le système de paiement et contractualisation de KaziPro
- **Devis**: Document détaillant les travaux proposés et leurs coûts
- **Contrat**: Document légal généré automatiquement liant le client et le prestataire
- **Acompte**: Paiement initial partiel effectué avant le début des travaux
- **Solde**: Paiement final complétant le montant total après les travaux
- **Frais_Deplacement**: Coûts de transport du prestataire vers le lieu de la mission
- **Signature_Electronique**: Signature numérique capturée via l'interface web/mobile
- **Recu**: Document de confirmation de paiement généré automatiquement
- **Mobile_Money**: Services de paiement mobile (M-Pesa, Airtel Money, Orange Money)
- **Mission**: Tâche de travail créée après validation du paiement et du contrat
- **Client**: Utilisateur demandant un service
- **Prestataire**: Utilisateur fournissant un service
- **Template_Paiement**: Modèle de conditions de paiement prédéfini par le prestataire

## Requirements

### Requirement 1: Séparation des Coûts dans le Devis

**User Story:** En tant que client, je veux voir clairement la séparation entre le coût des travaux et les frais de déplacement (si applicables), afin de comprendre la composition du prix total.

#### Acceptance Criteria

1. WHEN un prestataire crée un devis, THE System SHALL calculer séparément le montant des travaux et les frais de déplacement (si le prestataire a activé cette option)
2. WHEN un devis est affiché au client, THE System SHALL présenter distinctement le montant des travaux HT, les frais de déplacement (si applicables), la TVA, et le montant total TTC
3. WHERE le prestataire n'a pas configuré de frais de déplacement, THE System SHALL afficher uniquement le montant des travaux et la TVA
4. WHEN les frais de déplacement sont calculés, THE System SHALL utiliser la configuration définie par le prestataire (fixe, par kilomètre, par zone, ou gratuit)
5. WHEN la distance est utilisée pour calculer les frais, THE System SHALL appliquer une distance gratuite si configurée avant de facturer
6. WHEN les frais de déplacement sont calculés, THE System SHALL respecter les montants minimum et maximum configurés par le prestataire

### Requirement 2: Configuration des Frais de Déplacement (Optionnel)

**User Story:** En tant que prestataire, je veux pouvoir activer et configurer mes frais de déplacement selon différents modes de calcul, afin d'adapter ma tarification à ma situation, ou les désactiver complètement si je ne facture pas de déplacement.

#### Acceptance Criteria

1. THE System SHALL permettre au prestataire d'activer ou désactiver les frais de déplacement
2. WHERE les frais de déplacement sont activés, THE System SHALL permettre au prestataire de choisir un mode de calcul parmi: fixe, par kilomètre, par zone géographique, ou gratuit
3. WHERE le mode est "fixe", THE System SHALL permettre de définir un montant fixe unique
4. WHERE le mode est "par kilomètre", THE System SHALL permettre de définir un prix par kilomètre et une distance gratuite optionnelle
5. WHERE le mode est "par zone", THE System SHALL permettre de définir plusieurs zones avec un prix pour chaque zone
6. WHERE les frais de déplacement sont activés, THE System SHALL permettre de définir des montants minimum et maximum optionnels
7. WHERE les frais de déplacement sont désactivés, THE System SHALL ne pas afficher de ligne de frais de déplacement dans les devis
8. WHEN la configuration est modifiée, THE System SHALL appliquer les nouveaux paramètres aux devis créés après la modification
9. BY DEFAULT, THE System SHALL considérer les frais de déplacement comme désactivés pour les nouveaux prestataires

### Requirement 3: Génération Automatique de Contrat

**User Story:** En tant que système, je dois générer automatiquement un contrat légal lorsqu'un client accepte un devis, afin de formaliser l'accord entre les parties.

#### Acceptance Criteria

1. WHEN un client accepte un devis, THE System SHALL générer automatiquement un contrat au format HTML et PDF
2. THE System SHALL attribuer un numéro unique au contrat suivant le format CONT-YYYY-NNNN
3. THE System SHALL inclure dans le contrat les informations du prestataire (nom entreprise, adresse, téléphone, email, numéro fiscal)
4. THE System SHALL inclure dans le contrat les informations du client (nom, adresse, téléphone, email)
5. THE System SHALL inclure dans le contrat le détail du devis (numéro, items, montants travaux, frais déplacement, TVA, total TTC)
6. THE System SHALL inclure dans le contrat les conditions de paiement choisies
7. THE System SHALL inclure dans le contrat les conditions générales du prestataire
8. THE System SHALL stocker le PDF du contrat dans Supabase Storage
9. WHEN le contrat est généré, THE System SHALL notifier le client et le prestataire

### Requirement 4: Signature Électronique du Contrat

**User Story:** En tant que client et prestataire, je veux signer électroniquement le contrat, afin de valider mon engagement sans nécessiter de documents papier.

#### Acceptance Criteria

1. WHEN un contrat est généré, THE System SHALL permettre au client de visualiser le PDF du contrat
2. THE System SHALL permettre au client de dessiner sa signature sur un canvas numérique
3. WHEN le client signe, THE System SHALL capturer la signature comme image et la stocker dans Supabase Storage
4. WHEN le client signe, THE System SHALL enregistrer la date et l'heure de la signature
5. WHEN le client a signé, THE System SHALL mettre à jour le statut du contrat à "signe_client"
6. WHEN le client a signé, THE System SHALL notifier le prestataire
7. THE System SHALL permettre au prestataire de signer le contrat de la même manière
8. WHEN les deux parties ont signé, THE System SHALL mettre à jour le statut du contrat à "signe_complet"

### Requirement 5: Templates de Conditions de Paiement

**User Story:** En tant que prestataire, je veux créer des templates de conditions de paiement réutilisables, afin de gagner du temps lors de la création de devis.

#### Acceptance Criteria

1. THE System SHALL permettre au prestataire de créer plusieurs templates de conditions de paiement
2. THE System SHALL permettre de nommer et décrire chaque template
3. THE System SHALL permettre de définir le type de paiement: complet avant travaux, complet après travaux, acompte + solde, ou échelonné
4. WHERE le type est "acompte + solde", THE System SHALL permettre de définir les pourcentages d'acompte et de solde
5. WHERE le type est "échelonné", THE System SHALL permettre de définir plusieurs échéances avec pourcentages et moments
6. THE System SHALL permettre de marquer un template comme template par défaut
7. WHEN un prestataire crée un devis, THE System SHALL proposer la liste des templates disponibles

### Requirement 6: Paiement Unique (Complet)

**User Story:** En tant que client, je veux pouvoir payer le montant total en une seule fois, afin de finaliser rapidement la transaction.

#### Acceptance Criteria

1. WHEN le contrat est signé par les deux parties, THE System SHALL permettre au client d'initier un paiement complet
2. THE System SHALL afficher le montant total à payer (travaux + déplacement + TVA)
3. THE System SHALL permettre au client de choisir une méthode de paiement parmi: M-Pesa, Airtel Money, Orange Money, ou carte bancaire
4. WHEN le client choisit Mobile Money, THE System SHALL demander le numéro de téléphone
5. WHEN le paiement est initié, THE System SHALL créer un enregistrement de paiement avec statut "en_attente"
6. THE System SHALL attribuer un numéro unique au paiement suivant le format PAY-YYYY-NNNN
7. WHEN le paiement est initié, THE System SHALL appeler l'API du service de paiement choisi
8. WHEN le paiement est validé par le service externe, THE System SHALL mettre à jour le statut à "valide"
9. WHEN le paiement est validé, THE System SHALL générer automatiquement un reçu au format PDF
10. WHEN le paiement est validé, THE System SHALL créer automatiquement une mission

### Requirement 7: Paiement Échelonné Sécurisé (Acompte + Solde)

**User Story:** En tant que client et prestataire, je veux un système de paiement échelonné qui protège les deux parties, avec un acompte avant les travaux et un solde après validation.

#### Acceptance Criteria

1. WHEN le contrat est signé par les deux parties, THE System SHALL permettre au client de payer l'acompte
2. THE System SHALL calculer le montant de l'acompte selon le pourcentage défini dans les conditions (par défaut 30%)
3. THE System SHALL séparer le montant de l'acompte en: montant_travaux, montant_deplacement, et montant_total
4. WHEN l'acompte est payé et validé, THE System SHALL créer un enregistrement de paiement avec type "acompte"
5. WHEN l'acompte est validé, THE System SHALL créer la mission avec statut "pending" ou "in_progress"
6. WHEN l'acompte est validé, THE System SHALL notifier le prestataire qu'il peut commencer les travaux
7. WHEN le prestataire marque les travaux comme terminés, THE System SHALL notifier le client pour validation
8. THE System SHALL permettre au client de valider les travaux dans un délai configurable (par défaut 7 jours)
9. WHEN le client valide les travaux, THE System SHALL permettre le paiement du solde
10. THE System SHALL calculer le montant du solde comme le total moins l'acompte déjà payé
11. WHEN le solde est payé et validé, THE System SHALL créer un enregistrement de paiement avec type "solde"
12. WHEN le solde est validé, THE System SHALL mettre à jour le statut de la mission à "completed"
13. IF le client ne valide pas dans le délai configuré, THE System SHALL auto-valider les travaux et permettre le paiement du solde
14. THE System SHALL permettre au client de signaler des problèmes avant de valider, déclenchant un processus de litige

### Requirement 8: Génération Automatique de Reçus

**User Story:** En tant que client, je veux recevoir automatiquement un reçu après chaque paiement, afin d'avoir une preuve de transaction.

#### Acceptance Criteria

1. WHEN un paiement est validé, THE System SHALL générer automatiquement un reçu au format PDF
2. THE System SHALL attribuer un numéro unique au reçu suivant le format REC-YYYY-NNNN
3. THE System SHALL inclure dans le reçu le numéro de paiement, la date, le montant, la méthode de paiement
4. THE System SHALL inclure dans le reçu les informations du prestataire et du client
5. THE System SHALL inclure dans le reçu la référence au contrat et au devis
6. THE System SHALL stocker le PDF du reçu dans Supabase Storage
7. THE System SHALL envoyer le reçu par email au client
8. THE System SHALL permettre au client de télécharger le reçu depuis son interface

### Requirement 9: Intégration Mobile Money (M-Pesa)

**User Story:** En tant que client en RDC, je veux payer via M-Pesa, afin d'utiliser ma méthode de paiement préférée.

#### Acceptance Criteria

1. WHEN un client choisit M-Pesa comme méthode de paiement, THE System SHALL demander le numéro de téléphone Vodacom
2. THE System SHALL valider le format du numéro de téléphone (+243 suivi de 9 chiffres)
3. WHEN le paiement est initié, THE System SHALL appeler l'API M-Pesa pour initier la transaction
4. THE System SHALL enregistrer l'ID de transaction retourné par M-Pesa
5. THE System SHALL afficher au client les instructions pour compléter le paiement sur son téléphone
6. THE System SHALL exposer un webhook pour recevoir les notifications de confirmation de M-Pesa
7. WHEN le webhook reçoit une confirmation, THE System SHALL valider le paiement correspondant
8. IF le paiement échoue, THE System SHALL mettre à jour le statut à "echoue" et notifier le client

### Requirement 10: Intégration Mobile Money (Airtel Money)

**User Story:** En tant que client en RDC, je veux payer via Airtel Money, afin d'utiliser ma méthode de paiement préférée.

#### Acceptance Criteria

1. WHEN un client choisit Airtel Money comme méthode de paiement, THE System SHALL demander le numéro de téléphone Airtel
2. THE System SHALL valider le format du numéro de téléphone (+243 suivi de 9 chiffres)
3. WHEN le paiement est initié, THE System SHALL appeler l'API Airtel Money pour initier la transaction
4. THE System SHALL enregistrer l'ID de transaction retourné par Airtel Money
5. THE System SHALL afficher au client les instructions pour compléter le paiement sur son téléphone
6. THE System SHALL exposer un webhook pour recevoir les notifications de confirmation d'Airtel Money
7. WHEN le webhook reçoit une confirmation, THE System SHALL valider le paiement correspondant
8. IF le paiement échoue, THE System SHALL mettre à jour le statut à "echoue" et notifier le client

### Requirement 11: Notifications de Paiement

**User Story:** En tant que client et prestataire, je veux être notifié des événements importants du processus de paiement, afin de suivre l'avancement de la transaction.

#### Acceptance Criteria

1. WHEN un contrat est généré, THE System SHALL envoyer une notification au client et au prestataire
2. WHEN un client signe le contrat, THE System SHALL notifier le prestataire
3. WHEN le prestataire signe le contrat, THE System SHALL notifier le client
4. WHEN un paiement est initié, THE System SHALL notifier le prestataire
5. WHEN un paiement est validé, THE System SHALL notifier le client et le prestataire
6. WHEN un paiement échoue, THE System SHALL notifier le client avec les détails de l'erreur
7. THE System SHALL envoyer les notifications par email et notification push dans l'application

### Requirement 12: Historique et Traçabilité des Paiements

**User Story:** En tant que client et prestataire, je veux consulter l'historique complet des paiements, afin de suivre toutes les transactions.

#### Acceptance Criteria

1. THE System SHALL permettre au client de consulter la liste de tous ses paiements
2. THE System SHALL permettre au prestataire de consulter la liste de tous les paiements reçus
3. WHEN un paiement est affiché, THE System SHALL montrer le numéro, la date, le montant, le type, la méthode, et le statut
4. THE System SHALL permettre de filtrer les paiements par statut (en attente, validé, échoué)
5. THE System SHALL permettre de filtrer les paiements par date
6. THE System SHALL permettre de télécharger le reçu associé à chaque paiement validé
7. THE System SHALL permettre de visualiser le contrat associé à chaque paiement

### Requirement 13: Gestion des Échecs de Paiement

**User Story:** En tant que client, je veux pouvoir réessayer un paiement qui a échoué, afin de finaliser ma transaction sans recommencer tout le processus.

#### Acceptance Criteria

1. WHEN un paiement échoue, THE System SHALL conserver l'enregistrement avec statut "echoue"
2. THE System SHALL afficher au client la raison de l'échec si disponible
3. THE System SHALL permettre au client de réessayer le paiement avec la même méthode
4. THE System SHALL permettre au client de changer de méthode de paiement pour réessayer
5. WHEN le client réessaie, THE System SHALL créer un nouvel enregistrement de paiement
6. THE System SHALL maintenir la référence au contrat et au devis pour tous les essais

### Requirement 14: Sécurité et Validation des Paiements

**User Story:** En tant que système, je dois valider et sécuriser toutes les transactions de paiement, afin de protéger les utilisateurs contre la fraude.

#### Acceptance Criteria

1. THE System SHALL valider que le contrat est signé par les deux parties avant d'autoriser un paiement
2. THE System SHALL valider que le montant du paiement correspond au montant du contrat
3. THE System SHALL vérifier l'authenticité des webhooks de confirmation de paiement
4. THE System SHALL utiliser HTTPS pour toutes les communications avec les APIs de paiement
5. THE System SHALL ne jamais stocker les informations sensibles de carte bancaire
6. THE System SHALL enregistrer tous les événements de paiement pour audit
7. IF une tentative de paiement suspecte est détectée, THE System SHALL bloquer la transaction et notifier les administrateurs

### Requirement 16: Validation des Travaux et Auto-validation

**User Story:** En tant que client, je veux pouvoir valider les travaux avant de payer le solde, et en tant que prestataire, je veux être protégé si le client ne répond pas.

#### Acceptance Criteria

1. WHEN le prestataire marque une mission comme "terminée", THE System SHALL notifier le client pour inspection et validation
2. THE System SHALL afficher au client un délai de validation (configurable, par défaut 7 jours)
3. THE System SHALL permettre au client de valider les travaux en cliquant sur un bouton "Valider les travaux"
4. WHEN le client valide, THE System SHALL mettre à jour le statut de la mission et débloquer le paiement du solde
5. THE System SHALL permettre au client de signaler des problèmes avant de valider
6. WHEN des problèmes sont signalés, THE System SHALL notifier le prestataire et créer un litige
7. IF le client ne valide pas et ne signale pas de problème dans le délai configuré, THE System SHALL auto-valider les travaux
8. WHEN les travaux sont auto-validés, THE System SHALL notifier le client et débloquer le paiement du solde
9. THE System SHALL enregistrer la date et le mode de validation (manuelle ou automatique)
10. THE System SHALL permettre au prestataire de voir le statut de validation et le temps restant


### Requirement 16: Validation des Travaux et Auto-validation

**User Story:** En tant que client, je veux pouvoir valider les travaux avant de payer le solde, et en tant que prestataire, je veux être protégé si le client ne répond pas.

#### Acceptance Criteria

1. WHEN le prestataire marque une mission comme "terminée", THE System SHALL notifier le client pour inspection et validation
2. THE System SHALL afficher au client un délai de validation (configurable, par défaut 7 jours)
3. THE System SHALL permettre au client de valider les travaux en cliquant sur un bouton "Valider les travaux"
4. WHEN le client valide, THE System SHALL mettre à jour le statut de la mission et débloquer le paiement du solde
5. THE System SHALL permettre au client de signaler des problèmes avant de valider
6. WHEN des problèmes sont signalés, THE System SHALL notifier le prestataire et créer un litige
7. IF le client ne valide pas et ne signale pas de problème dans le délai configuré, THE System SHALL auto-valider les travaux
8. WHEN les travaux sont auto-validés, THE System SHALL notifier le client et débloquer le paiement du solde
9. THE System SHALL enregistrer la date et le mode de validation (manuelle ou automatique)
10. THE System SHALL permettre au prestataire de voir le statut de validation et le temps restant

### Requirement 17: Système de Litiges

**User Story:** En tant que client ou prestataire, je veux pouvoir ouvrir un litige si je ne suis pas satisfait, afin d'avoir un recours et une résolution formelle.

#### Acceptance Criteria

1. THE System SHALL permettre au client de signaler des problèmes après que le prestataire marque les travaux comme terminés
2. THE System SHALL permettre au prestataire d'ouvrir un litige si le client refuse de valider sans raison valable
3. WHEN un litige est ouvert, THE System SHALL bloquer le paiement du solde jusqu'à résolution
4. THE System SHALL permettre aux deux parties de fournir des preuves (photos, messages, documents)
5. THE System SHALL notifier les administrateurs KaziPro de l'ouverture d'un litige
6. THE System SHALL permettre aux administrateurs de voir toutes les informations du litige
7. THE System SHALL permettre aux administrateurs de prendre une décision: libérer le solde au prestataire, rembourser le client, ou solution intermédiaire
8. WHEN une décision est prise, THE System SHALL exécuter la décision automatiquement
9. THE System SHALL notifier les deux parties de la décision et de la résolution
10. THE System SHALL enregistrer l'historique complet du litige pour audit

### Requirement 18: Configuration des Délais et Pourcentages

**User Story:** En tant que prestataire, je veux pouvoir configurer mes pourcentages d'acompte et délais de validation, afin d'adapter le système à mon type de travaux.

#### Acceptance Criteria

1. THE System SHALL permettre au prestataire de configurer le pourcentage d'acompte (20%, 30%, 40%, 50%)
2. THE System SHALL permettre au prestataire de configurer le délai de validation des travaux (3, 7, 14 jours)
3. THE System SHALL permettre au prestataire d'activer ou désactiver l'auto-validation
4. THE System SHALL permettre au prestataire de configurer une période de garantie optionnelle (0, 30, 60, 90 jours)
5. WHERE une garantie est configurée, THE System SHALL retenir un pourcentage du solde (configurable, ex: 5%) pendant la période de garantie
6. THE System SHALL utiliser les paramètres par défaut si le prestataire n'a pas configuré ses préférences
7. WHEN un prestataire modifie sa configuration, THE System SHALL appliquer les nouveaux paramètres aux nouveaux devis uniquement


### Requirement 19: Configuration Globale du Système de Paiement (Admin)

**User Story:** En tant qu'administrateur KaziPro, je veux pouvoir configurer globalement tous les paramètres du système de paiement (commissions, pourcentages, délais), afin de contrôler le modèle économique et l'adapter à tout moment selon la stratégie commerciale.

#### Acceptance Criteria

1. THE System SHALL permettre à l'administrateur de choisir un mode de paiement global parmi: désactivé, optionnel, obligatoire
2. WHERE le mode est "désactivé", THE System SHALL ne pas proposer de paiement via KaziPro aux prestataires
3. WHERE le mode est "optionnel", THE System SHALL permettre aux prestataires de choisir d'activer ou non le paiement via KaziPro
4. WHERE le mode est "obligatoire", THE System SHALL forcer tous les nouveaux devis à passer par le système de paiement KaziPro
5. THE System SHALL permettre à l'administrateur de modifier les taux de commission pour: main d'œuvre, matériel, et déplacement
6. THE System SHALL permettre à l'administrateur de modifier le pourcentage d'acompte par défaut (entre 0% et 100%)
7. THE System SHALL calculer automatiquement le pourcentage de solde comme 100% moins l'acompte
8. THE System SHALL permettre à l'administrateur de modifier le délai de validation des travaux par défaut (en jours)
9. THE System SHALL permettre à l'administrateur de modifier le délai de paiement par défaut (en jours)
10. THE System SHALL permettre à l'administrateur de configurer un pourcentage de garantie par défaut (0% = désactivé)
11. THE System SHALL permettre à l'administrateur de configurer la durée de garantie par défaut (en jours)
12. THE System SHALL permettre à l'administrateur d'activer ou désactiver les permissions des prestataires
13. THE System SHALL demander une raison optionnelle pour chaque modification importante
14. THE System SHALL enregistrer l'historique complet de toutes les modifications avec: date, admin, anciennes valeurs, nouvelles valeurs, raison
15. THE System SHALL permettre à l'administrateur de consulter l'historique des modifications
16. THE System SHALL afficher un avertissement que les changements s'appliquent uniquement aux nouveaux devis
17. THE System SHALL valider que les pourcentages sont cohérents (acompte + solde = 100%)
18. THE System SHALL permettre à l'administrateur de restaurer les valeurs par défaut d'usine
19. WHEN un administrateur modifie la configuration, THE System SHALL notifier tous les autres administrateurs
20. THE System SHALL appliquer les nouvelles configurations uniquement aux nouveaux devis créés après la modification

### Requirement 20: Configuration Prestataire du Système de Paiement

**User Story:** En tant que prestataire, je veux pouvoir configurer comment je souhaite recevoir mes paiements, afin d'avoir le contrôle sur mes transactions et commissions.

#### Acceptance Criteria

1. WHERE le mode global est "optionnel", THE System SHALL permettre au prestataire d'activer ou désactiver le paiement via KaziPro
2. WHERE le paiement via KaziPro est activé, THE System SHALL permettre au prestataire de choisir quels éléments passent par KaziPro: main d'œuvre, matériel, déplacement
3. THE System SHALL afficher clairement les taux de commission pour chaque élément
4. THE System SHALL calculer et afficher un exemple de commission pour un devis type
5. WHERE le prestataire désactive le paiement via KaziPro, THE System SHALL afficher un avertissement sur les risques: pas de protection, pas de système de litiges, pas de reçus automatiques
6. THE System SHALL utiliser les paramètres par défaut (tout activé) pour les nouveaux prestataires
7. THE System SHALL permettre au prestataire de modifier sa configuration à tout moment
8. WHEN un prestataire modifie sa configuration, THE System SHALL appliquer les nouveaux paramètres uniquement aux nouveaux devis
9. THE System SHALL afficher au prestataire un résumé de sa configuration actuelle
10. WHERE un prestataire a une commission négociée, THE System SHALL afficher ses taux personnalisés au lieu des taux par défaut

### Requirement 21: Calcul des Commissions Hybrides

**User Story:** En tant que système, je dois calculer correctement les commissions selon la configuration du prestataire et les éléments du devis, afin d'assurer une facturation juste et transparente.

#### Acceptance Criteria

1. WHEN un devis est créé, THE System SHALL récupérer la configuration de paiement du prestataire
2. THE System SHALL calculer séparément les montants pour: main d'œuvre, matériel, et déplacement
3. FOR chaque élément activé dans la configuration, THE System SHALL calculer la commission selon le taux applicable
4. THE System SHALL utiliser les taux personnalisés du prestataire si disponibles, sinon les taux globaux par défaut
5. THE System SHALL calculer le montant total de commission comme la somme des commissions de chaque élément
6. THE System SHALL calculer le montant que recevra le prestataire comme le total moins la commission
7. THE System SHALL stocker la configuration de paiement utilisée dans le devis (JSONB) pour référence future
8. THE System SHALL afficher au client le montant total à payer (sans mention de la commission)
9. THE System SHALL afficher au prestataire le montant qu'il recevra après commission
10. WHERE certains éléments ne passent pas par KaziPro, THE System SHALL indiquer clairement au client qu'il devra payer ces éléments directement au prestataire

### Requirement 22: Paiement Mixte (KaziPro + Direct)

**User Story:** En tant que client, je veux comprendre clairement comment effectuer le paiement lorsque certains éléments passent par KaziPro et d'autres sont directs, afin d'éviter toute confusion.

#### Acceptance Criteria

1. WHERE un devis a des éléments via KaziPro et des éléments directs, THE System SHALL afficher deux sections de paiement distinctes
2. THE System SHALL afficher en premier la section "Paiement via KaziPro" avec le montant et les éléments concernés
3. THE System SHALL afficher ensuite la section "Paiement direct au prestataire" avec le montant et les éléments concernés
4. THE System SHALL afficher les coordonnées de paiement du prestataire pour la partie directe
5. WHERE le paiement via KaziPro est effectué, THE System SHALL créer un enregistrement de paiement avec le montant et les éléments concernés
6. WHERE le paiement direct est effectué, THE System SHALL permettre au client d'uploader une preuve de paiement
7. THE System SHALL notifier le prestataire de la preuve de paiement uploadée pour validation
8. THE System SHALL permettre au prestataire de confirmer ou rejeter la preuve de paiement
9. WHEN les deux paiements sont validés, THE System SHALL créer ou mettre à jour la mission
10. THE System SHALL générer des reçus séparés pour chaque type de paiement

### Requirement 23: Paiement Direct (Sans KaziPro)

**User Story:** En tant que client, lorsque le prestataire n'utilise pas le système de paiement KaziPro, je veux savoir comment le payer directement, afin de finaliser la transaction.

#### Acceptance Criteria

1. WHERE le prestataire a désactivé le paiement via KaziPro, THE System SHALL afficher une page "Paiement direct au prestataire"
2. THE System SHALL afficher les coordonnées de paiement du prestataire: numéros M-Pesa, Airtel Money, coordonnées bancaires
3. THE System SHALL afficher le montant total à payer
4. THE System SHALL afficher un avertissement que le paiement n'est pas sécurisé par KaziPro
5. THE System SHALL permettre au client de marquer le paiement comme effectué
6. WHEN le client marque comme payé, THE System SHALL demander d'uploader une preuve de paiement (capture d'écran, reçu)
7. THE System SHALL notifier le prestataire de la déclaration de paiement
8. THE System SHALL permettre au prestataire de confirmer la réception du paiement
9. WHEN le prestataire confirme, THE System SHALL créer la mission
10. IF le prestataire ne confirme pas dans un délai configurable, THE System SHALL envoyer des rappels
11. THE System SHALL permettre au client d'ouvrir un litige si le prestataire ne confirme pas après plusieurs rappels

### Requirement 24: Transparence des Commissions

**User Story:** En tant que prestataire et client, je veux voir clairement les commissions appliquées, afin d'avoir une transparence totale sur les coûts.

#### Acceptance Criteria

1. THE System SHALL afficher au prestataire le détail des commissions lors de la création d'un devis
2. THE System SHALL afficher pour chaque élément: montant HT, taux de commission, montant de commission, montant net
3. THE System SHALL afficher le total des commissions et le montant net que recevra le prestataire
4. THE System SHALL permettre au prestataire de voir un historique de toutes les commissions payées
5. THE System SHALL permettre au prestataire de télécharger un rapport mensuel des commissions
6. THE System SHALL afficher au client uniquement le montant total à payer (sans détail des commissions)
7. WHERE le client demande des détails, THE System SHALL afficher que KaziPro prend une commission pour sécuriser la transaction
8. THE System SHALL permettre à l'administrateur de voir les statistiques globales des commissions
9. THE System SHALL calculer et afficher le taux de commission effectif moyen par prestataire
10. THE System SHALL permettre d'exporter les données de commissions pour analyse financière
