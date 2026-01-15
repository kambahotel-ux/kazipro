# 🏗️ Workflow Professionnel Complet - Partie 1

## 📌 Vue d'ensemble du système

KaziPro est une **marketplace de services** qui connecte des clients avec des prestataires qualifiés. Le système fonctionne comme un **appel d'offres** où:

1. **Client** publie un besoin (demande)
2. **Plusieurs prestataires** soumettent leurs propositions (devis)
3. **Client** compare et choisit la meilleure offre
4. **Transaction sécurisée** avec paiement échelonné
5. **Validation** et notation du service

---

## 🔄 Cycle de vie complet d'une mission

### Phase 1: Publication de la demande

**Acteur**: CLIENT

**Actions**:
- Crée une demande détaillée
- Définit son budget indicatif
- Ajoute photos/documents si nécessaire
- Spécifie l'urgence et la localisation

**Statut demande**: `en_attente`

**Visibilité**: 
- ✅ Tous les prestataires de la profession concernée
- ✅ Dans leur zone géographique (même commune ou communes voisines)
- ✅ Avec statut "vérifié" uniquement (pour qualité)

**Notifications**:
- 📧 Email aux prestataires concernés
- 🔔 Notification push dans l'app
- 📱 SMS si urgence "très urgent"

---

### Phase 2: Soumission des devis (Appel d'offres)

**Acteur**: PRESTATAIRES (plusieurs en compétition)

**Chaque prestataire peut**:
- Consulter la demande complète
- Voir le profil du client (historique, fiabilité)
- Poser des questions via messagerie
- Soumettre UN devis détaillé

**Contenu du devis**:

```
1. TARIFICATION
   - Montant du service (main d'œuvre + matériaux)
   - Frais de déplacement (si visite terrain nécessaire)
   - TVA (si applicable)
   - MONTANT TOTAL TTC

2. DÉTAILS TECHNIQUES
   - Description détaillée du travail
   - Matériaux utilisés (marques, qualités)
   - Méthodologie
   - Photos de références (travaux similaires)

3. PLANNING
   - Délai d'intervention (combien de jours avant de commencer)
   - Durée des travaux (combien de jours/heures)
   - Disponibilité (dates précises)

4. CONDITIONS DE PAIEMENT
   - Acompte requis: OUI/NON
   - Si OUI: Pourcentage (ex: 30%, 40%, 50%)
   - Modalités: "X% avant début, Y% après validation"
   - Méthodes acceptées: Mobile Money, Virement, Espèces, Chèque

5. GARANTIES
   - Durée de garantie (ex: 6 mois, 1 an)
   - Ce qui est couvert
   - Conditions de garantie

6. VALIDITÉ
   - Date d'expiration du devis (ex: 15 jours, 30 jours)
   - Conditions d'annulation

7. DOCUMENTS
   - Assurance professionnelle (si applicable)
   - Certifications
   - Références clients
```

**Statut devis**: `en_attente`

**Limite**: 
- Maximum 10 devis par demande (pour éviter spam)
- Délai de soumission: 48h-72h selon urgence

---

### Phase 3: Évaluation et comparaison

**Acteur**: CLIENT

**Interface de comparaison**:

Le client voit un **tableau comparatif** avec:

| Critère | Prestataire A | Prestataire B | Prestataire C |
|---------|---------------|---------------|---------------|
| **Prix total** | 150,000 FC | 180,000 FC | 140,000 FC |
| **Délai** | 5 jours | 3 jours | 7 jours |
| **Note** | ⭐ 4.8/5 | ⭐ 4.5/5 | ⭐ 4.9/5 |
| **Missions** | 45 | 23 | 67 |
| **Acompte** | 30% | 50% | 40% |
| **Garantie** | 1 an | 6 mois | 1 an |

**Filtres disponibles**:
- Prix (croissant/décroissant)
- Note (meilleure note)
- Délai (plus rapide)
- Expérience (plus de missions)

**Actions possibles**:
- 👁️ Voir détail du devis
- 👤 Consulter profil complet du prestataire
- 💬 Poser des questions
- ⭐ Voir avis d'autres clients
- 📸 Voir portfolio du prestataire
- ✅ Accepter le devis
- ❌ Refuser le devis

**Aide à la décision**:
- Badge "Meilleur rapport qualité/prix"
- Badge "Plus rapide"
- Badge "Mieux noté"
- Badge "Plus expérimenté"

---

### Phase 4: Négociation (NOUVEAU - À AJOUTER)

**Acteur**: CLIENT + PRESTATAIRE

**Fonctionnalité importante manquante**:

Le client devrait pouvoir:
- 💬 **Négocier le prix** avec un prestataire
- 📝 **Demander des modifications** au devis
- 🔄 **Recevoir un devis révisé**

**Workflow de négociation**:
1. Client clique "Négocier" sur un devis
2. Ouvre une conversation dédiée
3. Client propose un contre-prix ou demande modifications
4. Prestataire peut:
   - Accepter et soumettre nouveau devis
   - Refuser et maintenir son prix
   - Proposer un compromis
5. Nouveau devis remplace l'ancien
6. Client peut accepter ou continuer à négocier

**Statut devis pendant négociation**: `en_negociation`

**Limite**: Maximum 3 révisions par devis

---

### Phase 5: Acceptation du devis

**Acteur**: CLIENT

**Action**: Client clique "Accepter ce devis"

**Conséquences automatiques**:

1. **Mise à jour des statuts**:
   - Demande: `en_attente` → `attribuee`
   - Devis accepté: `en_attente` → `accepte`
   - Autres devis: `en_attente` → `refuse`

2. **Notifications**:
   - ✅ Prestataire choisi: "Félicitations! Votre devis a été accepté"
   - ❌ Autres prestataires: "Le client a choisi un autre prestataire"
   - 📧 Email de confirmation au client

3. **Création automatique**:
   - **Contrat numérique** généré (PDF)
   - **Mission** créée dans le système
   - **Échéancier de paiement** établi

4. **Blocage**:
   - Demande retirée des opportunités
   - Autres prestataires ne peuvent plus soumettre de devis
   - Devis refusés archivés

**Documents générés**:
- Bon de commande
- Contrat de prestation
- Échéancier de paiement

---

## 📋 Éléments manquants identifiés

### 1. Système de notation du devis

**MANQUE**: Le client devrait pouvoir "noter" ou "favoriser" des devis sans les accepter immédiatement.

**À ajouter**:
- ⭐ Marquer comme "Favori"
- 📌 Mettre en "Liste restreinte"
- 💭 Ajouter des notes privées sur chaque devis

### 2. Visite terrain préalable

**MANQUE**: Certains travaux nécessitent une visite avant devis définitif.

**À ajouter**:
- Option "Visite terrain requise" dans le devis
- Frais de visite (remboursables si devis accepté)
- Planification de rendez-vous
- Après visite: Devis révisé avec prix exact

### 3. Devis en plusieurs phases

**MANQUE**: Travaux complexes nécessitent découpage en phases.

**À ajouter**:
- Devis multi-phases
- Paiement par phase
- Validation par phase
- Possibilité d'arrêter après une phase

### 4. Assurance et garanties

**MANQUE**: Protection client et prestataire.

**À ajouter**:
- Assurance responsabilité civile du prestataire
- Garantie décennale (si applicable)
- Caution de bonne fin
- Assurance dommages-ouvrage

### 5. Gestion des modifications en cours de mission

**MANQUE**: Client demande des modifications pendant les travaux.

**À ajouter**:
- Demande de modification
- Devis complémentaire
- Avenant au contrat
- Ajustement du paiement

---

**Suite dans WORKFLOW_PRO_PARTIE2.md**
