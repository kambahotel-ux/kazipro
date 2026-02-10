# Tasks - Système de Paiement et Contractualisation

## Phase 1: Base de Données (PRIORITÉ 1)

### Task 1.1: Créer les tables de configuration
- [ ] Créer `configuration_paiement_globale`
- [ ] Créer `historique_config_paiement`
- [ ] Créer `configuration_paiement_prestataire`
- [ ] Initialiser config globale avec valeurs par défaut
- [ ] Tester les contraintes de validation

**Fichier**: `sql/create_configuration_paiement.sql`
**Estimation**: 1h

### Task 1.2: Créer les tables de frais et templates
- [ ] Créer `frais_deplacement_config`
- [ ] Créer `conditions_paiement_templates`
- [ ] Tester les contraintes

**Fichier**: `sql/create_frais_et_templates.sql`
**Estimation**: 1h

### Task 1.3: Créer les tables de contrats et paiements
- [ ] Créer `contrats`
- [ ] Créer `paiements` (enhanced)
- [ ] Créer `litiges`
- [ ] Tester les relations

**Fichier**: `sql/create_contrats_paiements_litiges.sql`
**Estimation**: 1h

### Task 1.4: Modifier les tables existantes
- [ ] Modifier `devis_pro` (ajouter colonnes)
- [ ] Modifier `missions` (ajouter colonnes validation)
- [ ] Tester les modifications

**Fichier**: `sql/modify_existing_tables.sql`
**Estimation**: 30min

### Task 1.5: Créer les storage buckets
- [ ] Créer bucket `contrats`
- [ ] Créer bucket `signatures`
- [ ] Créer bucket `recus`
- [ ] Créer bucket `preuves-paiement`
- [ ] Configurer les policies RLS pour chaque bucket

**Fichier**: `sql/create_storage_buckets.sql`
**Estimation**: 1h

### Task 1.6: Créer les fonctions SQL
- [ ] `generate_contrat_numero()`
- [ ] `generate_paiement_numero()`
- [ ] `generate_litige_numero()`
- [ ] `calculate_frais_deplacement()`
- [ ] `calculate_commission_kazipro()`
- [ ] `calculate_devis_montants()` (modifier)
- [ ] Tester toutes les fonctions

**Fichier**: `sql/create_functions.sql`
**Estimation**: 2h

### Task 1.7: Créer les triggers
- [ ] Trigger pour historique config
- [ ] Trigger pour auto-validation missions
- [ ] Trigger pour calcul montants devis
- [ ] Tester les triggers

**Fichier**: `sql/create_triggers.sql`
**Estimation**: 1h

**TOTAL PHASE 1**: ~7.5h

---

## Phase 2: Backend / API (PRIORITÉ 2)

### Task 2.1: API Configuration Admin
- [ ] GET `/api/config/paiement` - Lire config globale
- [ ] PUT `/api/config/paiement` - Modifier config globale
- [ ] GET `/api/config/paiement/history` - Historique
- [ ] Middleware admin uniquement
- [ ] Tests

**Fichier**: `src/api/config-paiement.ts`
**Estimation**: 2h

### Task 2.2: API Configuration Prestataire
- [ ] GET `/api/prestataire/config-paiement` - Lire config
- [ ] PUT `/api/prestataire/config-paiement` - Modifier config
- [ ] GET `/api/prestataire/frais-deplacement` - Lire frais
- [ ] PUT `/api/prestataire/frais-deplacement` - Modifier frais
- [ ] Tests

**Fichier**: `src/api/prestataire-config.ts`
**Estimation**: 2h

### Task 2.3: API Génération Contrat
- [ ] POST `/api/contrats/generate` - Générer contrat
- [ ] GET `/api/contrats/:id` - Récupérer contrat
- [ ] POST `/api/contrats/:id/sign` - Signer contrat
- [ ] Génération PDF (jsPDF)
- [ ] Upload vers storage
- [ ] Tests

**Fichier**: `src/api/contrats.ts`
**Estimation**: 3h

### Task 2.4: API Paiements
- [ ] POST `/api/paiements/initiate` - Initier paiement
- [ ] POST `/api/paiements/webhook/mpesa` - Webhook M-Pesa
- [ ] POST `/api/paiements/webhook/airtel` - Webhook Airtel
- [ ] GET `/api/paiements/:id` - Récupérer paiement
- [ ] POST `/api/paiements/:id/validate-proof` - Valider preuve
- [ ] Génération reçu PDF
- [ ] Tests

**Fichier**: `src/api/paiements.ts`
**Estimation**: 4h

### Task 2.5: API Validation Travaux
- [ ] POST `/api/missions/:id/complete` - Marquer terminé
- [ ] POST `/api/missions/:id/validate` - Valider travaux
- [ ] POST `/api/missions/:id/report-issue` - Signaler problème
- [ ] Cron job pour auto-validation
- [ ] Tests

**Fichier**: `src/api/missions-validation.ts`
**Estimation**: 2h

### Task 2.6: API Litiges
- [ ] POST `/api/litiges` - Créer litige
- [ ] GET `/api/litiges/:id` - Récupérer litige
- [ ] POST `/api/litiges/:id/resolve` - Résoudre (admin)
- [ ] Tests

**Fichier**: `src/api/litiges.ts`
**Estimation**: 2h

**TOTAL PHASE 2**: ~15h

---

## Phase 3: Frontend Admin (PRIORITÉ 3)

### Task 3.1: Page Configuration Globale
- [ ] Interface avec sliders pour commissions
- [ ] Slider pour acompte/solde
- [ ] Inputs pour délais
- [ ] Section garantie
- [ ] Permissions prestataires
- [ ] Bouton enregistrer avec confirmation
- [ ] Responsive mobile

**Fichier**: `src/pages/dashboard/admin/ConfigPaiementPage.tsx`
**Estimation**: 4h

### Task 3.2: Page Historique Config
- [ ] Liste des modifications
- [ ] Filtres (date, admin)
- [ ] Détails de chaque modification
- [ ] Export CSV
- [ ] Responsive mobile

**Fichier**: `src/pages/dashboard/admin/HistoriqueConfigPage.tsx`
**Estimation**: 2h

### Task 3.3: Statistiques Paiements
- [ ] Dashboard avec KPIs
- [ ] Graphiques revenus
- [ ] Taux d'adoption
- [ ] Commission moyenne
- [ ] Responsive mobile

**Fichier**: `src/pages/dashboard/admin/StatistiquesPaiementsPage.tsx`
**Estimation**: 3h

**TOTAL PHASE 3**: ~9h

---

## Phase 4: Frontend Prestataire (PRIORITÉ 4)

### Task 4.1: Configuration Paiement Prestataire
- [ ] Toggle activation paiement KaziPro
- [ ] Checkboxes pour éléments
- [ ] Affichage commissions
- [ ] Simulation montants
- [ ] Avertissements si désactivé
- [ ] Responsive mobile

**Fichier**: `src/pages/dashboard/prestataire/ConfigPaiementPage.tsx`
**Estimation**: 3h

### Task 4.2: Configuration Frais Déplacement
- [ ] Toggle activation
- [ ] Sélection mode (fixe, par_km, par_zone, gratuit)
- [ ] Inputs selon mode
- [ ] Limites min/max
- [ ] Simulation
- [ ] Responsive mobile

**Fichier**: `src/pages/dashboard/prestataire/FraisDeplacementPage.tsx`
**Estimation**: 3h

### Task 4.3: Templates Conditions Paiement
- [ ] Liste des templates
- [ ] Créer nouveau template
- [ ] Modifier template
- [ ] Marquer comme défaut
- [ ] Responsive mobile

**Fichier**: `src/pages/dashboard/prestataire/TemplatesPaiementPage.tsx`
**Estimation**: 3h

### Task 4.4: Création Devis Améliorée
- [ ] Calcul automatique frais déplacement
- [ ] Affichage séparé travaux/matériel/déplacement
- [ ] Sélection template paiement
- [ ] Calcul commissions
- [ ] Aperçu montants
- [ ] Responsive mobile

**Fichier**: Modifier `src/pages/dashboard/prestataire/CreerDevisPage.tsx`
**Estimation**: 4h

**TOTAL PHASE 4**: ~13h

---

## Phase 5: Frontend Client (PRIORITÉ 5)

### Task 5.1: Visualisation Devis Détaillé
- [ ] Affichage séparé travaux/matériel/déplacement
- [ ] Conditions de paiement claires
- [ ] Bouton accepter
- [ ] Responsive mobile

**Fichier**: Modifier `src/pages/dashboard/client/DemandeDetailPage.tsx`
**Estimation**: 2h

### Task 5.2: Signature Contrat
- [ ] Visualisation PDF contrat
- [ ] Canvas pour signature
- [ ] Upload signature
- [ ] Checkbox acceptation conditions
- [ ] Bouton signer
- [ ] Responsive mobile

**Fichier**: `src/pages/dashboard/client/SignerContratPage.tsx`
**Estimation**: 3h

### Task 5.3: Page Paiement
- [ ] Affichage montant à payer
- [ ] Détails (travaux, matériel, déplacement)
- [ ] Sélection méthode (M-Pesa, Airtel, Carte)
- [ ] Input numéro téléphone
- [ ] Instructions paiement
- [ ] Bouton payer
- [ ] Responsive mobile

**Fichier**: `src/pages/dashboard/client/PaiementPage.tsx`
**Estimation**: 4h

### Task 5.4: Paiement Direct
- [ ] Affichage coordonnées prestataire
- [ ] Upload preuve de paiement
- [ ] Bouton "J'ai payé"
- [ ] Responsive mobile

**Fichier**: `src/pages/dashboard/client/PaiementDirectPage.tsx`
**Estimation**: 2h

### Task 5.5: Validation Travaux
- [ ] Affichage détails mission
- [ ] Bouton "Valider les travaux"
- [ ] Bouton "Signaler un problème"
- [ ] Compte à rebours auto-validation
- [ ] Responsive mobile

**Fichier**: `src/pages/dashboard/client/ValiderTravauxPage.tsx`
**Estimation**: 3h

### Task 5.6: Historique Paiements
- [ ] Liste des paiements
- [ ] Filtres (statut, date)
- [ ] Télécharger reçus
- [ ] Voir contrat
- [ ] Responsive mobile

**Fichier**: `src/pages/dashboard/client/HistoriquePaiementsPage.tsx`
**Estimation**: 2h

**TOTAL PHASE 5**: ~16h

---

## Phase 6: Intégrations (PRIORITÉ 6)

### Task 6.1: Intégration M-Pesa
- [ ] Configuration API M-Pesa
- [ ] Fonction initier paiement
- [ ] Webhook handler
- [ ] Validation callback
- [ ] Tests en sandbox
- [ ] Documentation

**Fichier**: `src/lib/mpesa.ts`
**Estimation**: 4h

### Task 6.2: Intégration Airtel Money
- [ ] Configuration API Airtel
- [ ] Fonction initier paiement
- [ ] Webhook handler
- [ ] Validation callback
- [ ] Tests en sandbox
- [ ] Documentation

**Fichier**: `src/lib/airtel-money.ts`
**Estimation**: 4h

### Task 6.3: Génération PDF Contrats
- [ ] Template HTML contrat
- [ ] Fonction génération PDF (jsPDF)
- [ ] Styling
- [ ] Tests
- [ ] Documentation

**Fichier**: `src/lib/pdf-contrat.ts`
**Estimation**: 3h

### Task 6.4: Génération PDF Reçus
- [ ] Template HTML reçu
- [ ] Fonction génération PDF
- [ ] Styling
- [ ] Tests
- [ ] Documentation

**Fichier**: `src/lib/pdf-recu.ts`
**Estimation**: 2h

### Task 6.5: Notifications Email
- [ ] Template email contrat généré
- [ ] Template email signature
- [ ] Template email paiement
- [ ] Template email validation
- [ ] Configuration Supabase
- [ ] Tests

**Fichier**: `src/lib/email-notifications.ts`
**Estimation**: 3h

**TOTAL PHASE 6**: ~16h

---

## Phase 7: Tests & Déploiement (PRIORITÉ 7)

### Task 7.1: Tests Unitaires
- [ ] Tests fonctions SQL
- [ ] Tests API endpoints
- [ ] Tests composants React
- [ ] Coverage > 80%

**Estimation**: 4h

### Task 7.2: Tests d'Intégration
- [ ] Flux complet: devis → contrat → paiement → mission
- [ ] Flux avec paiement direct
- [ ] Flux avec litige
- [ ] Tests auto-validation

**Estimation**: 4h

### Task 7.3: Tests Utilisateurs
- [ ] Test avec vrais prestataires
- [ ] Test avec vrais clients
- [ ] Feedback et ajustements

**Estimation**: 4h

### Task 7.4: Documentation
- [ ] Guide admin
- [ ] Guide prestataire
- [ ] Guide client
- [ ] Documentation technique
- [ ] FAQ

**Estimation**: 3h

### Task 7.5: Déploiement
- [ ] Migration base de données
- [ ] Déploiement backend
- [ ] Déploiement frontend
- [ ] Configuration production
- [ ] Monitoring

**Estimation**: 3h

**TOTAL PHASE 7**: ~18h

---

## RÉSUMÉ

| Phase | Description | Estimation | Priorité |
|-------|-------------|------------|----------|
| 1 | Base de Données | 7.5h | 1 |
| 2 | Backend / API | 15h | 2 |
| 3 | Frontend Admin | 9h | 3 |
| 4 | Frontend Prestataire | 13h | 4 |
| 5 | Frontend Client | 16h | 5 |
| 6 | Intégrations | 16h | 6 |
| 7 | Tests & Déploiement | 18h | 7 |
| **TOTAL** | | **94.5h** | |

**Estimation totale**: ~12 jours de travail (8h/jour)

---

## ORDRE D'EXÉCUTION RECOMMANDÉ

1. ✅ Phase 1: Base de Données (TOUT)
2. ✅ Phase 2: Backend / API (TOUT)
3. ✅ Phase 4.4: Création Devis Améliorée
4. ✅ Phase 5.1: Visualisation Devis
5. ✅ Phase 5.2: Signature Contrat
6. ✅ Phase 5.3: Page Paiement
7. ✅ Phase 5.5: Validation Travaux
8. ✅ Phase 4.1-4.3: Config Prestataire
9. ✅ Phase 3: Frontend Admin
10. ✅ Phase 6: Intégrations
11. ✅ Phase 7: Tests & Déploiement

---

## DÉPENDANCES

- Phase 2 dépend de Phase 1
- Phase 3, 4, 5 dépendent de Phase 2
- Phase 6 peut être en parallèle
- Phase 7 dépend de toutes les autres

---

## NOTES

- Commencer par la base de données (Phase 1)
- Tester chaque phase avant de passer à la suivante
- Responsive mobile obligatoire pour toutes les interfaces
- Documentation au fur et à mesure
- Tests continus

