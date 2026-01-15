# Plan d'Amélioration des Devis Professionnels

## Résumé des Besoins

### 1. Profil Entreprise du Prestataire
Les prestataires doivent pouvoir configurer les informations de leur entreprise qui apparaîtront sur les devis:
- **Logo de l'entreprise** (upload d'image)
- **Nom de l'entreprise**
- **Adresse complète**
- **Téléphone**
- **Email professionnel**
- **Numéro d'identification fiscale / RCCM** (optionnel)
- **Conditions générales** (optionnel)

### 2. Branding KaziPro sur les Devis
- KaziPro apparaît comme une **signature/copyright** en bas du devis
- Format: "Généré via KaziPro - Plateforme de mise en relation professionnelle"
- Petit logo KaziPro discret en footer
- **PAS** le logo principal du devis (c'est le logo du prestataire)

### 3. Négociation de Devis (Côté Client)
Le client doit pouvoir:
- **Voir le devis détaillé** avec tous les items
- **Proposer un contre-prix** pour le montant total
- **Ajouter un message** expliquant sa contre-proposition
- **Statuts possibles**:
  - `pending` - En attente de réponse du prestataire
  - `accepted` - Accepté tel quel
  - `negotiating` - En négociation (client a proposé un contre-prix)
  - `rejected` - Rejeté

### 4. Modification de Devis (Côté Prestataire)
Le prestataire doit pouvoir:
- **Voir les contre-propositions** du client
- **Modifier le devis** (prix, items, conditions)
- **Renvoyer le devis modifié** au client
- **Accepter la contre-proposition** du client
- **Historique des versions** du devis (optionnel pour MVP)

---

## Architecture Proposée

### Base de Données

#### 1. Nouvelle table: `entreprise_info`
```sql
CREATE TABLE entreprise_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestataire_id UUID NOT NULL UNIQUE REFERENCES prestataires(id),
  nom_entreprise TEXT,
  logo_url TEXT,
  adresse TEXT,
  ville TEXT,
  telephone TEXT,
  email_professionnel TEXT,
  numero_fiscal TEXT,
  conditions_generales TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. Nouvelle table: `devis_negotiations`
```sql
CREATE TABLE devis_negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devis_id UUID NOT NULL REFERENCES devis(id),
  auteur_type TEXT NOT NULL CHECK (auteur_type IN ('client', 'prestataire')),
  auteur_id UUID NOT NULL,
  montant_propose NUMERIC NOT NULL,
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. Modifications table `devis`
```sql
-- Ajouter colonnes:
ALTER TABLE devis ADD COLUMN statut_negociation TEXT DEFAULT 'pending' 
  CHECK (statut_negociation IN ('pending', 'negotiating', 'accepted', 'rejected'));
ALTER TABLE devis ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE devis ADD COLUMN devis_parent_id UUID REFERENCES devis(id);
```

---

## Fonctionnalités à Implémenter

### Phase 1: Profil Entreprise
1. **Page Paramètres Prestataire** - Section "Informations Entreprise"
   - Formulaire pour saisir les infos
   - Upload de logo (Supabase Storage)
   - Prévisualisation du logo

### Phase 2: Génération PDF Professionnelle
1. **Template de Devis Professionnel**
   - En-tête avec logo prestataire
   - Informations entreprise (adresse, contact)
   - Informations client
   - Tableau des items détaillés
   - Montants (HT, TVA, TTC)
   - Conditions de paiement
   - Footer avec signature KaziPro

2. **Bibliothèque PDF**
   - Utiliser `jsPDF` ou `react-pdf` pour génération
   - Export en PDF téléchargeable

### Phase 3: Négociation Client
1. **Interface Client - Voir Devis**
   - Affichage détaillé du devis
   - Bouton "Proposer un contre-prix"
   - Modal de négociation avec:
     - Montant proposé
     - Message explicatif
     - Bouton "Envoyer la proposition"

2. **Notifications**
   - Notifier le prestataire d'une nouvelle proposition
   - Notifier le client quand le prestataire répond

### Phase 4: Modification Devis Prestataire
1. **Interface Prestataire - Gérer Négociations**
   - Liste des devis en négociation
   - Voir la proposition du client
   - Options:
     - Accepter la proposition
     - Modifier le devis et renvoyer
     - Refuser avec message

2. **Historique**
   - Afficher l'historique des échanges
   - Voir toutes les versions du devis

---

## Questions à Clarifier

### 1. Négociation
- ❓ Le client peut-il négocier **plusieurs fois** ou une seule fois?
- ❓ Le prestataire peut-il **modifier les items** ou seulement le prix total?
- ❓ Faut-il un **système de chat** intégré pour la négociation?

### 2. Validation
- ❓ Après combien d'allers-retours la négociation se termine-t-elle?
- ❓ Y a-t-il une **date d'expiration** pour les devis?
- ❓ Le client peut-il négocier **après avoir accepté** un devis?

### 3. Devis PDF
- ❓ Le PDF doit-il être **généré automatiquement** ou sur demande?
- ❓ Faut-il **stocker les PDFs** ou les générer à la volée?
- ❓ Le client peut-il **télécharger le PDF** directement?

### 4. Informations Entreprise
- ❓ Les informations entreprise sont-elles **obligatoires** pour créer un devis?
- ❓ Faut-il une **vérification** des informations (RCCM, etc.)?
- ❓ Le prestataire peut-il avoir **plusieurs entreprises**?

---

## Ordre d'Implémentation Recommandé

1. ✅ **Clarifier les questions ci-dessus**
2. 📝 **Créer le schéma de base de données complet**
3. 🏢 **Implémenter le profil entreprise** (paramètres prestataire)
4. 📄 **Créer le template de devis professionnel** (avec logo)
5. 💬 **Ajouter la négociation côté client**
6. ✏️ **Ajouter la modification côté prestataire**
7. 📊 **Ajouter l'historique des négociations**
8. 🔔 **Implémenter les notifications**

---

## Prochaines Étapes

**Veuillez répondre aux questions ci-dessus** pour que je puisse:
1. Finaliser l'architecture
2. Créer les scripts SQL nécessaires
3. Implémenter les fonctionnalités dans le bon ordre

Qu'en pensez-vous? Y a-t-il des points à ajuster ou des précisions à apporter?
