# 🏗️ Workflow Professionnel Complet - Partie 2

## Phase 6: Paiement sécurisé

**Acteur**: CLIENT (avec système de paiement)

### Scénario A: Avec acompte

**Étape 1: Paiement de l'acompte**
- Client reçoit facture pro forma
- Montant: 30% du total (exemple)
- Méthodes: Mobile Money, Virement, Carte bancaire
- **Statut paiement**: `acompte_en_attente`

**Étape 2: Confirmation**
- Paiement vérifié automatiquement
- **Statut paiement**: `acompte_paye`
- **Statut demande**: `attribuee` → `en_cours`
- Prestataire reçoit notification: "Vous pouvez commencer"
- Fonds bloqués sur compte séquestre (sécurité)

**Étape 3: Paiement du solde**
- Après validation du travail
- Montant: 70% restant
- **Statut paiement**: `solde_en_attente`
- Après confirmation: `paye_complet`

### Scénario B: Sans acompte (paiement après)

**Étape 1: Démarrage**
- Pas de paiement immédiat
- **Statut demande**: `attribuee` → `en_cours`
- Prestataire prend le risque

**Étape 2: Paiement final**
- Après validation du travail
- Montant: 100% du total
- **Statut paiement**: `en_attente` → `paye_complet`

### Scénario C: Paiement échelonné (NOUVEAU)

**Pour gros travaux**:
- Découpage en plusieurs versements
- Exemple: 30% / 40% / 30%
- Chaque versement lié à une étape
- Validation par étape

**Exemple concret**:
```
Rénovation salle de bain - 500,000 FC

Phase 1: Démolition (30%) - 150,000 FC
  → Paiement après démolition validée

Phase 2: Installation (40%) - 200,000 FC
  → Paiement après installation validée

Phase 3: Finitions (30%) - 150,000 FC
  → Paiement après finitions validées
```

### Sécurité des paiements

**Compte séquestre** (ESSENTIEL):
- Argent bloqué sur compte tiers
- Libéré uniquement après validation
- Protection client ET prestataire
- En cas de litige: arbitrage

**Traçabilité**:
- Chaque transaction enregistrée
- Reçu automatique
- Facture générée
- Historique complet

---

## Phase 7: Exécution de la mission

**Acteur**: PRESTATAIRE

### Suivi en temps réel

**Prestataire peut**:
- 📸 Uploader photos de progression
- 📝 Ajouter commentaires
- ⏰ Mettre à jour le statut
- 💬 Communiquer avec client
- 📅 Modifier planning (avec accord)

**Statuts de progression**:
- `non_commence` - Pas encore démarré
- `en_preparation` - Achat matériaux, préparation
- `en_cours` - Travaux en cours
- `en_pause` - Pause temporaire (météo, attente matériel)
- `termine` - Travaux terminés

**Client peut**:
- 👁️ Voir progression en temps réel
- 📸 Voir photos uploadées
- 💬 Poser des questions
- ⚠️ Signaler un problème
- 📅 Demander report (avec accord)

### Gestion des imprévus

**Problèmes techniques**:
- Prestataire signale un imprévu
- Propose solution + coût additionnel
- Client approuve ou refuse
- Si approuvé: Devis complémentaire

**Retards**:
- Prestataire demande prolongation
- Justification requise
- Client approuve ou refuse
- Si refusé: Pénalités possibles

**Modifications demandées**:
- Client demande changement
- Prestataire évalue impact (coût + délai)
- Nouveau devis si nécessaire
- Avenant au contrat

---

## Phase 8: Validation et réception

**Acteur**: CLIENT + PRESTATAIRE

### Étape 1: Déclaration de fin

**Prestataire**:
- Clique "Travaux terminés"
- Upload photos finales
- Demande validation client
- **Statut demande**: `en_cours` → `en_validation`

**Notification client**:
- "Votre prestataire a terminé les travaux"
- "Veuillez vérifier et valider"
- Délai de validation: 48h-72h

### Étape 2: Inspection client

**Client a 3 options**:

**Option A: Validation immédiate** ✅
- Tout est parfait
- Clique "Valider les travaux"
- **Statut demande**: `en_validation` → `terminee`
- Déclenche paiement du solde

**Option B: Demande de corrections** 🔧
- Problèmes mineurs identifiés
- Liste les corrections nécessaires
- **Statut demande**: `en_validation` → `corrections_demandees`
- Prestataire effectue corrections
- Nouvelle validation

**Option C: Refus / Litige** ⚠️
- Travaux non conformes
- Ouvre un litige
- **Statut demande**: `en_validation` → `litige`
- Processus d'arbitrage

### Étape 3: Paiement final

**Si validation OK**:
- Paiement du solde automatique
- Fonds libérés du séquestre
- Prestataire reçoit son argent
- **Statut paiement**: `paye_complet`
- **Statut demande**: `terminee` → `completee`

**Délais de versement**:
- Mobile Money: Immédiat
- Virement: 24-48h
- Commission plateforme déduite (ex: 5%)

---

## Phase 9: Évaluation et avis

**Acteur**: CLIENT + PRESTATAIRE (mutuel)

### Client évalue prestataire

**Critères de notation** (sur 5 étoiles):
- ⭐ Qualité du travail
- ⭐ Respect des délais
- ⭐ Communication
- ⭐ Propreté du chantier
- ⭐ Rapport qualité/prix

**Avis écrit**:
- Commentaire détaillé
- Photos du résultat (optionnel)
- Recommandation: OUI/NON

**Impact**:
- Note moyenne du prestataire mise à jour
- Avis visible sur profil public
- Influence classement dans recherches

### Prestataire évalue client (NOUVEAU)

**Critères de notation**:
- ⭐ Clarté de la demande
- ⭐ Communication
- ⭐ Respect des engagements
- ⭐ Paiement dans les délais
- ⭐ Comportement général

**Pourquoi c'est important**:
- Prestataires peuvent refuser clients problématiques
- Clients avec mauvaise note ont moins de réponses
- Encourage comportement respectueux

---

## Phase 10: Garantie et SAV

**Acteur**: CLIENT (si problème post-mission)

### Période de garantie

**Durée**: Selon devis (ex: 6 mois, 1 an)

**Client peut**:
- Signaler un défaut
- Demander intervention
- Ouvrir ticket SAV

**Prestataire doit**:
- Répondre sous 48h
- Intervenir gratuitement si sous garantie
- Réparer ou remplacer

**Statut SAV**:
- `ouvert` - Ticket créé
- `en_cours` - Intervention planifiée
- `resolu` - Problème réglé
- `clos` - Ticket fermé

### Hors garantie

**Si problème après garantie**:
- Client peut redemander devis
- Prestataire peut facturer
- Ou client cherche autre prestataire

---

## 🚨 Gestion des litiges

### Types de litiges

**1. Travaux non conformes**
- Résultat différent de promis
- Qualité insuffisante
- Matériaux non conformes

**2. Retards excessifs**
- Délais non respectés
- Pas de justification valable
- Impact sur client

**3. Problèmes de paiement**
- Client ne paie pas
- Montant contesté
- Paiement partiel

**4. Abandon de chantier**
- Prestataire disparaît
- Travaux inachevés
- Pas de réponse

### Processus d'arbitrage

**Étape 1: Médiation automatique**
- Système propose solutions
- Délai: 48h pour répondre
- Tentative de résolution amiable

**Étape 2: Arbitrage humain**
- Admin examine le dossier
- Demande preuves (photos, messages)
- Audition des deux parties
- Décision sous 5-7 jours

**Étape 3: Résolution**

**Solutions possibles**:
- Remboursement partiel/total
- Nouvelle intervention
- Pénalités
- Résiliation contrat
- Blacklist (cas graves)

**Fonds séquestrés**:
- Bloqués pendant litige
- Redistribués selon décision
- Protection des deux parties

---

## 📊 Tableau récapitulatif des statuts

### Statuts DEMANDE

| Statut | Signification | Qui peut modifier |
|--------|---------------|-------------------|
| `en_attente` | Publiée, attend devis | Système |
| `attribuee` | Devis accepté, attend paiement | Client |
| `en_cours` | Travaux en cours | Système (après paiement) |
| `en_validation` | Attend validation client | Prestataire |
| `corrections_demandees` | Corrections à faire | Client |
| `terminee` | Validée par client | Client |
| `completee` | Payée et clôturée | Système |
| `annulee` | Annulée avant attribution | Client |
| `litige` | En litige | Client ou Prestataire |
| `archivee` | Clôturée et archivée | Système (après 6 mois) |

### Statuts DEVIS

| Statut | Signification | Qui peut modifier |
|--------|---------------|-------------------|
| `brouillon` | En cours de rédaction | Prestataire |
| `en_attente` | Soumis, attend réponse | Prestataire |
| `en_negociation` | En cours de négociation | Client ou Prestataire |
| `accepte` | Accepté par client | Client |
| `refuse` | Refusé (autre choisi) | Système |
| `retire` | Retiré par prestataire | Prestataire |
| `expire` | Délai dépassé | Système |
| `archive` | Archivé | Système |

### Statuts PAIEMENT

| Statut | Signification | Montant |
|--------|---------------|---------|
| `en_attente` | Attend paiement | 0% |
| `acompte_en_attente` | Attend acompte | 0% |
| `acompte_paye` | Acompte payé | 30-50% |
| `solde_en_attente` | Attend solde | 30-50% |
| `paye_complet` | Totalement payé | 100% |
| `rembourse_partiel` | Remboursement partiel | Variable |
| `rembourse_total` | Remboursement total | 0% |
| `litige` | En litige | Bloqué |

---

**Suite dans WORKFLOW_PRO_PARTIE3.md pour les fonctionnalités avancées**
