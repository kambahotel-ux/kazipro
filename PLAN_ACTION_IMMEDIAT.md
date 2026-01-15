# 🚀 PLAN D'ACTION IMMÉDIAT

## 📋 Vue d'ensemble

Nous allons implémenter le workflow complet en 3 phases progressives.

---

## PHASE 1: Fondations (2-3 heures)

### Tâche 1.1: Mettre à jour la table `demandes`

**Fichier**: `sql/upgrade_demandes_complete.sql`

**Actions**:
```sql
-- Ajouter colonnes manquantes
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS localisation TEXT;
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS urgence TEXT DEFAULT 'normal';
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'en_attente';
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS devis_accepte_id UUID;
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS deadline DATE;

-- Mettre à jour constraint statut
ALTER TABLE demandes DROP CONSTRAINT IF EXISTS demandes_status_check;
ALTER TABLE demandes ADD CONSTRAINT demandes_statut_check 
  CHECK (statut IN ('en_attente', 'attribuee', 'en_cours', 'en_validation', 
                    'corrections_demandees', 'terminee', 'completee', 
                    'annulee', 'litige', 'archivee'));
```

**Résultat**: Table demandes complète avec tous les statuts

---

### Tâche 1.2: Compléter la table `devis`

**Fichier**: `sql/upgrade_devis_complete.sql`

**Actions**:
```sql
-- Ajouter colonnes manquantes
ALTER TABLE devis ADD COLUMN IF NOT EXISTS frais_deplacement DECIMAL(10,2) DEFAULT 0;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS delai_execution TEXT;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS delai_intervention TEXT;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS validite_devis DATE;
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS garantie TEXT;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS conditions_paiement JSONB;

-- Exemple de conditions_paiement:
-- {
--   "acompte_requis": true,
--   "pourcentage_acompte": 30,
--   "montant_acompte": 31500,
--   "montant_solde": 73500,
--   "modalites": "30% avant début, 70% après validation",
--   "methodes_acceptees": ["Mobile Money", "Virement", "Espèces"]
-- }
```

**Résultat**: Table devis avec toutes les informations nécessaires

---

### Tâche 1.3: Créer les tables manquantes

**Fichier**: `sql/create_missing_tables.sql`

**Tables à créer**:
1. `litiges`
2. `notifications`
3. `documents`
4. `favoris`

**Résultat**: Base de données complète

---

## PHASE 2: Workflow Devis (3-4 heures)

### Tâche 2.1: Page Opportunités (Prestataire)

**Fichier**: `src/pages/dashboard/prestataire/OpportunitesPage.tsx`

**Fonctionnalités**:
- Liste des demandes en_attente
- Filtrées par profession du prestataire
- Filtrées par zone géographique
- Affichage: titre, description, budget, urgence, localisation
- Bouton "Voir détails" → Page détail
- Bouton "Soumettre un devis" → Page création devis

**Résultat**: Prestataires voient les opportunités

---

### Tâche 2.2: Page Détail Demande (Prestataire)

**Fichier**: `src/pages/dashboard/prestataire/DemandeDetailPage.tsx`

**Fonctionnalités**:
- Affichage complet de la demande
- Photos/documents
- Profil du client (nom, historique, fiabilité)
- Bouton "Soumettre un devis"
- Bouton "Poser une question" (messagerie)

**Résultat**: Prestataire peut évaluer la demande

---

### Tâche 2.3: Page Création Devis (Prestataire)

**Fichier**: `src/pages/dashboard/prestataire/CreerDevisPage.tsx`

**Formulaire**:
```typescript
{
  // Montants
  montant_service: number,
  frais_deplacement: number,
  tva: number,
  montant_total: number (calculé),
  
  // Description
  description: text,
  delai_execution: text,
  delai_intervention: text,
  garantie: text,
  
  // Conditions paiement
  acompte_requis: boolean,
  pourcentage_acompte: number,
  modalites: text,
  methodes_acceptees: array,
  
  // Validité
  validite_devis: date,
  
  // Items (optionnel)
  items: [{
    designation: text,
    quantite: number,
    prix_unitaire: number
  }]
}
```

**Résultat**: Prestataire peut créer un devis complet

---

### Tâche 2.4: Page Liste Devis (Client)

**Fichier**: `src/pages/dashboard/client/DemandeDetailPage.tsx`

**Fonctionnalités**:
- Affichage de la demande
- Liste des devis reçus (cards)
- Pour chaque devis:
  - Photo + nom prestataire
  - Note + nombre missions
  - Prix total
  - Délai
  - Bouton "Voir détails"
  - Bouton "Accepter"
- Tableau comparatif (optionnel)

**Résultat**: Client voit tous les devis

---

### Tâche 2.5: Page Détail Devis (Client)

**Fichier**: `src/pages/dashboard/client/DevisDetailPage.tsx`

**Fonctionnalités**:
- Affichage complet du devis
- Profil du prestataire
- Détail des montants
- Conditions de paiement
- Garanties
- Bouton "Accepter ce devis"
- Bouton "Négocier"
- Bouton "Refuser"

**Résultat**: Client peut évaluer un devis

---

### Tâche 2.6: Acceptation de Devis

**Fichier**: Mise à jour de `DevisDetailPage.tsx`

**Actions lors de l'acceptation**:
1. Mettre à jour statuts:
   - Demande: `en_attente` → `attribuee`
   - Devis accepté: `en_attente` → `accepte`
   - Autres devis: `en_attente` → `refuse`
2. Créer une mission
3. Notifier le prestataire
4. Rediriger vers page paiement

**Résultat**: Workflow d'acceptation fonctionnel

---

## PHASE 3: Paiement et Suivi (4-5 heures)

### Tâche 3.1: Page Paiement

**Fichier**: `src/pages/dashboard/client/PaiementPage.tsx`

**Fonctionnalités**:
- Récapitulatif du devis accepté
- Montant à payer (acompte ou total)
- Choix de la méthode:
  - Mobile Money (Airtel, Vodacom, Orange)
  - Virement bancaire
  - Carte bancaire
- Formulaire de paiement
- Confirmation

**Résultat**: Client peut payer

---

### Tâche 3.2: Page Suivi Mission (Prestataire)

**Fichier**: `src/pages/dashboard/prestataire/MissionDetailPage.tsx`

**Fonctionnalités**:
- Informations de la mission
- Upload photos de progression
- Ajout de commentaires
- Mise à jour du statut:
  - non_commence → en_preparation → en_cours → termine
- Timeline de progression
- Bouton "Marquer comme terminé"

**Résultat**: Prestataire peut suivre sa mission

---

### Tâche 3.3: Page Suivi Mission (Client)

**Fichier**: `src/pages/dashboard/client/MissionDetailPage.tsx`

**Fonctionnalités**:
- Informations de la mission
- Photos uploadées par prestataire
- Commentaires
- Statut actuel
- Timeline
- Bouton "Contacter le prestataire"
- Bouton "Signaler un problème"

**Résultat**: Client peut suivre la mission

---

### Tâche 3.4: Validation des Travaux

**Fichier**: Mise à jour de `MissionDetailPage.tsx` (client)

**Fonctionnalités**:
- Notification quand prestataire marque "terminé"
- Formulaire de validation:
  - ✅ Valider (tout est OK)
  - 🔧 Demander corrections (liste des corrections)
  - ⚠️ Ouvrir un litige
- Upload photos finales
- Commentaire

**Résultat**: Client peut valider ou demander corrections

---

### Tâche 3.5: Système d'Avis

**Fichier**: `src/pages/dashboard/AvisPage.tsx`

**Fonctionnalités**:
- Après validation, demander avis
- Formulaire d'avis:
  - Note sur 5 étoiles (par critère)
  - Commentaire
  - Photos (optionnel)
  - Recommandation oui/non
- Avis mutuel (prestataire note aussi client)

**Résultat**: Système d'avis complet

---

## 📊 ORDRE D'EXÉCUTION

### Jour 1: Fondations
1. ✅ Mettre à jour table demandes (30 min)
2. ✅ Compléter table devis (30 min)
3. ✅ Créer tables manquantes (1h)
4. ✅ Tester en base de données (30 min)

### Jour 2: Workflow Devis
5. ✅ Page Opportunités (1h)
6. ✅ Page Détail Demande (30 min)
7. ✅ Page Création Devis (2h)
8. ✅ Page Liste Devis Client (1h)
9. ✅ Page Détail Devis Client (1h)
10. ✅ Acceptation de Devis (30 min)

### Jour 3: Paiement et Suivi
11. ✅ Page Paiement (2h)
12. ✅ Page Suivi Mission Prestataire (1h)
13. ✅ Page Suivi Mission Client (1h)
14. ✅ Validation des Travaux (1h)
15. ✅ Système d'Avis (1h)

---

## 🎯 COMMENÇONS!

**Prochaine action**: Créer `sql/upgrade_demandes_complete.sql`

**Voulez-vous que je commence par la Tâche 1.1?**
