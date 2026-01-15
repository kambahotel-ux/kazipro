# 🚀 Plan d'Implémentation MVP - KaziPro

## 🎯 Objectif

Créer un **MVP fonctionnel** avec paiements simulés, permettant de tester tout le workflow avant d'intégrer les vrais moyens de paiement.

---

## ✅ Ce qui est FAIT

1. ✅ Authentification (Client, Prestataire, Admin)
2. ✅ Dashboards de base
3. ✅ Profil prestataire complet
4. ✅ **Création de demandes** (CLIENT)
5. ✅ Base de données demandes

---

## 🔨 Ce qu'il faut FAIRE (par ordre de priorité)

### Phase 1: Système de Devis (PRIORITÉ 1)

**Pour PRESTATAIRES**:

1. **Page "Opportunités"** (liste des demandes)
   - Voir toutes les demandes de sa profession
   - Filtrer par: localisation, budget, urgence
   - Voir détails de chaque demande
   - Bouton "Soumettre un devis"

2. **Formulaire de soumission de devis**
   - Montant du service
   - Frais de déplacement (optionnel)
   - Description détaillée
   - Délai d'exécution (jours)
   - Conditions de paiement:
     - Acompte requis? (checkbox)
     - Pourcentage acompte (si oui)
     - Modalités (texte libre)
   - Garantie offerte
   - Validité du devis (date)
   - Upload documents (optionnel)

3. **Gestion des devis soumis**
   - Liste de mes devis
   - Statuts: en_attente, accepte, refuse
   - Possibilité de retirer un devis
   - Voir réponse du client

**Base de données**:
```sql
CREATE TABLE devis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  demande_id UUID REFERENCES demandes(id),
  prestataire_id UUID REFERENCES prestataires(id),
  
  -- Tarification
  montant_service DECIMAL(10,2) NOT NULL,
  frais_deplacement DECIMAL(10,2) DEFAULT 0,
  montant_total DECIMAL(10,2) NOT NULL,
  devise VARCHAR(3) DEFAULT 'FC',
  
  -- Détails
  description TEXT NOT NULL,
  delai_execution INTEGER NOT NULL, -- en jours
  validite_devis DATE NOT NULL,
  garantie TEXT,
  
  -- Conditions de paiement
  acompte_requis BOOLEAN DEFAULT false,
  pourcentage_acompte INTEGER, -- 0-100
  modalites_paiement TEXT,
  
  -- Statut
  statut VARCHAR(50) DEFAULT 'en_attente',
  -- en_attente, accepte, refuse, retire, expire
  
  -- Métadonnées
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT check_pourcentage CHECK (pourcentage_acompte >= 0 AND pourcentage_acompte <= 100)
);
```

---

### Phase 2: Comparaison et Acceptation (PRIORITÉ 2)

**Pour CLIENTS**:

1. **Page détail d'une demande**
   - Voir sa demande complète
   - Nombre de devis reçus
   - Liste des devis avec résumé
   - Bouton "Voir tous les devis"

2. **Page de comparaison des devis**
   - Tableau comparatif:
     - Photo + nom prestataire
     - Note et nombre de missions
     - Prix total
     - Délai
     - Acompte requis
     - Garantie
   - Filtres: prix, note, délai
   - Bouton "Voir détail" pour chaque devis
   - Bouton "Accepter ce devis"

3. **Page détail d'un devis**
   - Toutes les informations du devis
   - Profil complet du prestataire
   - Avis d'autres clients
   - Portfolio du prestataire
   - Bouton "Accepter ce devis"
   - Bouton "Poser une question" (messagerie)

4. **Confirmation d'acceptation**
   - Modal de confirmation
   - Résumé du devis
   - Conditions de paiement
   - Checkbox "J'accepte les conditions"
   - Bouton "Confirmer l'acceptation"

**Actions automatiques après acceptation**:
- Demande: `en_attente` → `attribuee`
- Devis accepté: `en_attente` → `accepte`
- Autres devis: `en_attente` → `refuse`
- Création d'une mission
- Notifications envoyées

**Base de données**:
```sql
CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  demande_id UUID REFERENCES demandes(id),
  devis_id UUID REFERENCES devis(id),
  client_id UUID REFERENCES clients(id),
  prestataire_id UUID REFERENCES prestataires(id),
  
  -- Montants
  montant_total DECIMAL(10,2) NOT NULL,
  montant_acompte DECIMAL(10,2) DEFAULT 0,
  montant_solde DECIMAL(10,2) DEFAULT 0,
  
  -- Statut
  statut VARCHAR(50) DEFAULT 'en_attente_paiement',
  -- en_attente_paiement, en_cours, terminee, validee, completee
  
  -- Dates
  date_debut DATE,
  date_fin_prevue DATE,
  date_fin_reelle DATE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### Phase 3: Paiement Simulé (PRIORITÉ 3)

**Système de simulation simple**:

1. **Page de paiement**
   - Affiche montant à payer (acompte ou total)
   - Méthode de paiement: SELECT (Mobile Money, Virement, Espèces)
   - Bouton "**SIMULER LE PAIEMENT**" (au lieu de payer réellement)

2. **Simulation du paiement**
   - Click sur bouton
   - Loading 2-3 secondes (simulation traitement)
   - Génération d'un numéro de transaction fictif
   - Confirmation: "Paiement simulé avec succès!"
   - Redirection vers suivi de mission

3. **Enregistrement du paiement simulé**
   - Créer entrée dans table `paiements`
   - Statut: `simule` (au lieu de `confirme`)
   - Référence: `SIM-XXXXX` (au lieu de vraie référence)
   - Montant enregistré
   - Date enregistrée

**Base de données**:
```sql
CREATE TABLE paiements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID REFERENCES missions(id),
  demande_id UUID REFERENCES demandes(id),
  devis_id UUID REFERENCES devis(id),
  client_id UUID REFERENCES clients(id),
  prestataire_id UUID REFERENCES prestataires(id),
  
  -- Paiement
  type VARCHAR(50) NOT NULL, -- acompte, solde, total
  montant DECIMAL(10,2) NOT NULL,
  devise VARCHAR(3) DEFAULT 'FC',
  methode VARCHAR(50), -- mobile_money, virement, especes, carte
  
  -- Statut
  statut VARCHAR(50) DEFAULT 'en_attente',
  -- en_attente, simule, confirme, echoue, rembourse
  
  -- Référence
  reference_transaction VARCHAR(100),
  -- Format: SIM-XXXXX pour simulation
  -- Format: REAL-XXXXX pour vrai paiement (futur)
  
  -- Métadonnées
  date_paiement TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Pour future intégration
  provider_response JSONB, -- Réponse du provider de paiement
  is_simulation BOOLEAN DEFAULT true -- Flag pour distinguer
);
```

**Avantages de la simulation**:
- ✅ Tester tout le workflow
- ✅ Pas besoin d'argent réel
- ✅ Pas de frais de transaction
- ✅ Développement plus rapide
- ✅ Facile à remplacer par vrai paiement plus tard

**Comment remplacer par vrai paiement plus tard**:
1. Garder la même structure de données
2. Remplacer le bouton "Simuler" par "Payer"
3. Intégrer API de paiement (Flutterwave, Stripe, etc.)
4. Changer `is_simulation` à `false`
5. Utiliser vraie référence transaction

---

### Phase 4: Suivi de Mission (PRIORITÉ 4)

**Pour PRESTATAIRES**:

1. **Page "Mes Missions"**
   - Liste des missions en cours
   - Statut de chaque mission
   - Bouton "Voir détail"

2. **Page détail mission**
   - Informations client
   - Détails de la demande
   - Montant du devis
   - Statut paiement
   - Bouton "Marquer comme terminé"
   - Zone pour uploader photos (optionnel)
   - Zone pour ajouter commentaires

3. **Marquage comme terminé**
   - Bouton "Travaux terminés"
   - Upload photos finales (optionnel)
   - Commentaire final
   - Confirmation
   - Mission: `en_cours` → `terminee`
   - Notification au client

**Pour CLIENTS**:

1. **Page "Mes Missions"**
   - Liste des missions
   - Statut de chaque mission
   - Bouton "Voir détail"

2. **Page détail mission**
   - Informations prestataire
   - Détails du devis
   - Statut actuel
   - Photos de progression (si uploadées)
   - Bouton "Valider les travaux" (si terminée)

3. **Validation des travaux**
   - Voir photos finales
   - Bouton "Valider"
   - Bouton "Demander corrections"
   - Bouton "Signaler un problème"

---

### Phase 5: Avis et Évaluations (PRIORITÉ 5)

**Après validation**:

1. **Modal d'évaluation**
   - 5 critères avec étoiles (1-5)
   - Commentaire texte
   - Upload photos (optionnel)
   - Recommandation: OUI/NON
   - Bouton "Publier l'avis"

2. **Enregistrement de l'avis**
   - Créer entrée dans table `avis`
   - Mettre à jour note moyenne du prestataire
   - Notification au prestataire
   - Avis visible sur profil

**Base de données**:
```sql
CREATE TABLE avis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID REFERENCES missions(id),
  client_id UUID REFERENCES clients(id),
  prestataire_id UUID REFERENCES prestataires(id),
  
  -- Évaluation
  note_qualite INTEGER CHECK (note_qualite >= 1 AND note_qualite <= 5),
  note_delai INTEGER CHECK (note_delai >= 1 AND note_delai <= 5),
  note_communication INTEGER CHECK (note_communication >= 1 AND note_communication <= 5),
  note_proprete INTEGER CHECK (note_proprete >= 1 AND note_proprete <= 5),
  note_prix INTEGER CHECK (note_prix >= 1 AND note_prix <= 5),
  note_moyenne DECIMAL(2,1), -- Calculée automatiquement
  
  -- Commentaire
  commentaire TEXT,
  recommande BOOLEAN,
  
  -- Métadonnées
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📅 Planning de développement

### Semaine 1: Système de Devis
- Jour 1-2: Page opportunités + liste demandes
- Jour 3-4: Formulaire soumission devis
- Jour 5: Gestion des devis soumis
- Jour 6-7: Tests et corrections

### Semaine 2: Comparaison et Acceptation
- Jour 1-2: Page détail demande + liste devis
- Jour 3-4: Page comparaison devis
- Jour 5: Page détail devis + profil prestataire
- Jour 6: Acceptation et logique automatique
- Jour 7: Tests et corrections

### Semaine 3: Paiement Simulé + Suivi
- Jour 1-2: Page paiement simulé
- Jour 3: Logique de simulation
- Jour 4-5: Pages suivi mission (prestataire + client)
- Jour 6: Validation des travaux
- Jour 7: Tests et corrections

### Semaine 4: Avis + Polish
- Jour 1-2: Système d'avis
- Jour 3-4: Affichage avis sur profils
- Jour 5-6: Polish UI/UX
- Jour 7: Tests complets end-to-end

**Total: 4 semaines pour MVP complet**

---

## 🎨 Maquettes UI à créer

### Pages à designer:

1. **Prestataire - Opportunités**
   - Liste des demandes avec filtres
   - Cards avec infos essentielles
   - Bouton "Soumettre devis"

2. **Prestataire - Formulaire Devis**
   - Form en plusieurs sections
   - Calcul automatique du total
   - Preview avant soumission

3. **Client - Comparaison Devis**
   - Tableau comparatif responsive
   - Filtres et tri
   - Actions rapides

4. **Client - Détail Devis**
   - Layout 2 colonnes: devis + profil prestataire
   - Call-to-action clair
   - Informations complètes

5. **Paiement Simulé**
   - Interface simple et claire
   - Indication "SIMULATION"
   - Confirmation visuelle

6. **Suivi Mission**
   - Timeline de progression
   - Photos et commentaires
   - Actions contextuelles

---

## 🔧 Fonctionnalités à simplifier pour MVP

### ❌ PAS dans le MVP (pour plus tard):

1. ❌ Négociation de devis (trop complexe)
2. ❌ Visite terrain préalable (feature avancée)
3. ❌ Devis multi-phases (trop complexe)
4. ❌ Messagerie temps réel (utiliser email pour MVP)
5. ❌ Calendrier et disponibilités (pas essentiel)
6. ❌ Gestion des matériaux détaillée (trop complexe)
7. ❌ Assurances (pas nécessaire pour MVP)
8. ❌ Programme de fidélité (feature marketing)
9. ❌ Analytics avancés (pas prioritaire)
10. ❌ Système de réclamation complet (litige simple suffit)

### ✅ GARDER dans le MVP (essentiel):

1. ✅ Création de demandes
2. ✅ Soumission de devis
3. ✅ Comparaison et acceptation
4. ✅ Paiement simulé
5. ✅ Suivi de mission basique
6. ✅ Validation des travaux
7. ✅ Système d'avis simple
8. ✅ Notifications basiques (email)
9. ✅ Profils prestataires
10. ✅ Gestion des statuts

---

## 🚀 Prêt à commencer?

**Prochaine étape**: Créer la spécification technique détaillée pour la **Phase 1: Système de Devis**.

**Voulez-vous que je**:
1. Crée le script SQL complet pour les tables `devis` et `missions`?
2. Commence à coder la page "Opportunités" pour les prestataires?
3. Crée d'abord les maquettes/wireframes?

**Dites-moi par quoi commencer!** 🎯
