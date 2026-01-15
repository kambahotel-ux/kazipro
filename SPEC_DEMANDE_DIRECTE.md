# 📋 Spécification: Demande Directe avec Invitation de Prestataires

## 🎯 Objectif

Permettre aux clients de créer une demande et d'inviter directement des prestataires spécifiques, en plus du système actuel de demande publique.

## 📊 Deux types de demandes

### 1. **Demande Publique** (Existant)
- Visible par tous les prestataires
- N'importe quel prestataire peut faire un devis
- Système actuel

### 2. **Demande Directe** (Nouveau)
- Client sélectionne des prestataires spécifiques
- Seuls les prestataires invités peuvent voir et répondre
- Notification envoyée aux prestataires tagués

## 🗄️ Modifications Base de Données

### 1. Ajouter colonne `type` à la table `demandes`

```sql
ALTER TABLE demandes 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'publique' 
CHECK (type IN ('publique', 'directe'));

COMMENT ON COLUMN demandes.type IS 'Type de demande: publique (tous) ou directe (invités seulement)';
```

### 2. Créer table `demande_invitations`

```sql
CREATE TABLE IF NOT EXISTS demande_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demande_id UUID NOT NULL REFERENCES demandes(id) ON DELETE CASCADE,
  prestataire_id UUID NOT NULL REFERENCES prestataires(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'responded', 'declined')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  viewed_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(demande_id, prestataire_id)
);

CREATE INDEX idx_demande_invitations_demande ON demande_invitations(demande_id);
CREATE INDEX idx_demande_invitations_prestataire ON demande_invitations(prestataire_id);
CREATE INDEX idx_demande_invitations_status ON demande_invitations(status);

COMMENT ON TABLE demande_invitations IS 'Invitations de prestataires pour demandes directes';
```

### 3. RLS Policies

```sql
-- Clients peuvent voir leurs invitations
CREATE POLICY "Clients can view their invitations" ON demande_invitations
  FOR SELECT USING (
    demande_id IN (
      SELECT id FROM demandes WHERE client_id IN (
        SELECT id FROM clients WHERE user_id = auth.uid()
      )
    )
  );

-- Prestataires peuvent voir leurs invitations
CREATE POLICY "Prestataires can view their invitations" ON demande_invitations
  FOR SELECT USING (
    prestataire_id IN (
      SELECT id FROM prestataires WHERE user_id = auth.uid()
    )
  );

-- Clients peuvent créer des invitations
CREATE POLICY "Clients can create invitations" ON demande_invitations
  FOR INSERT WITH CHECK (
    demande_id IN (
      SELECT id FROM demandes WHERE client_id IN (
        SELECT id FROM clients WHERE user_id = auth.uid()
      )
    )
  );

-- Prestataires peuvent mettre à jour le statut
CREATE POLICY "Prestataires can update invitation status" ON demande_invitations
  FOR UPDATE USING (
    prestataire_id IN (
      SELECT id FROM prestataires WHERE user_id = auth.uid()
    )
  );
```

## 🎨 Interface Utilisateur

### Page: Nouvelle Demande (Client)

#### Étape 1: Type de demande
```
┌─────────────────────────────────────────┐
│ Quel type de demande souhaitez-vous    │
│ créer?                                  │
│                                         │
│ ○ Demande publique                     │
│   Tous les prestataires peuvent        │
│   répondre                              │
│                                         │
│ ○ Demande directe                      │
│   Inviter des prestataires             │
│   spécifiques                           │
└─────────────────────────────────────────┘
```

#### Étape 2: Sélection des prestataires (si directe)
```
┌─────────────────────────────────────────┐
│ Inviter des prestataires               │
│                                         │
│ [Rechercher par nom ou profession...]  │
│                                         │
│ Prestataires disponibles:              │
│                                         │
│ ☐ Justin Akonkwa - Électricien        │
│   ⭐ 4.8 (25 avis) • Kinshasa         │
│                                         │
│ ☐ Marie Kabila - Plombier             │
│   ⭐ 4.9 (42 avis) • Kinshasa         │
│                                         │
│ ☐ Pierre Tshisekedi - Peintre         │
│   ⭐ 4.7 (18 avis) • Kinshasa         │
│                                         │
│ Prestataires sélectionnés: 0           │
│                                         │
│ [Annuler]  [Continuer →]              │
└─────────────────────────────────────────┘
```

#### Étape 3: Détails de la demande
```
┌─────────────────────────────────────────┐
│ Détails de votre demande               │
│                                         │
│ Type: Demande directe                  │
│ Invités: Justin, Marie, Pierre (3)     │
│                                         │
│ Titre: [________________]              │
│ Description: [___________]             │
│ Budget: [_______] CDF                  │
│ Localisation: [_________]              │
│                                         │
│ [← Retour]  [Créer la demande]        │
└─────────────────────────────────────────┘
```

### Page: Opportunités (Prestataire)

#### Onglets
```
┌─────────────────────────────────────────┐
│ [Toutes] [Publiques] [Invitations (2)] │
├─────────────────────────────────────────┤
│                                         │
│ 🎯 INVITATION DIRECTE                  │
│ Rénovation peinture voiture            │
│ Budget: 500,000 CDF                    │
│ Client: Jean Dupont                    │
│ Invité le: Il y a 2 heures            │
│                                         │
│ [Voir détails] [Créer un devis]       │
│                                         │
│ ─────────────────────────────────────  │
│                                         │
│ 🎯 INVITATION DIRECTE                  │
│ Installation électrique                │
│ Budget: 800,000 CDF                    │
│ Client: Marie Kabila                   │
│ Invité le: Il y a 5 heures            │
│                                         │
│ [Voir détails] [Créer un devis]       │
└─────────────────────────────────────────┘
```

## 🔔 Notifications

### Pour le prestataire invité:
- **Email**: "Vous avez été invité à répondre à une demande"
- **Notification in-app**: Badge sur "Opportunités"
- **SMS** (optionnel): "Nouvelle invitation sur KaziPro"

### Pour le client:
- Quand un prestataire invité consulte la demande
- Quand un prestataire invité envoie un devis
- Quand tous les prestataires ont répondu

## 📱 Workflow Complet

### Scénario 1: Demande Directe

```
1. Client crée une demande directe
   ↓
2. Sélectionne 3 prestataires
   ↓
3. Soumet la demande
   ↓
4. Système envoie notifications aux 3 prestataires
   ↓
5. Prestataires reçoivent l'invitation
   ↓
6. Prestataires consultent et créent des devis
   ↓
7. Client compare les 3 devis
   ↓
8. Client accepte le meilleur devis
```

### Scénario 2: Demande Publique (Existant)

```
1. Client crée une demande publique
   ↓
2. Tous les prestataires voient la demande
   ↓
3. N'importe quel prestataire peut répondre
   ↓
4. Client reçoit plusieurs devis
   ↓
5. Client choisit le meilleur
```

## 🎨 Badges et Indicateurs

### Sur la demande:
- 🎯 Badge "INVITATION DIRECTE" (orange)
- 📢 Badge "DEMANDE PUBLIQUE" (bleu)

### Statistiques pour le client:
```
Invitations envoyées: 3
Vues: 2/3
Devis reçus: 1/3
En attente: 2
```

## 🔒 Règles de Visibilité

### Demande Publique:
- ✅ Visible par tous les prestataires
- ✅ N'importe qui peut faire un devis

### Demande Directe:
- ❌ Invisible pour les prestataires non invités
- ✅ Visible uniquement pour les prestataires invités
- ✅ Seuls les invités peuvent créer un devis

## 💡 Avantages

### Pour le Client:
- ✅ Contrôle total sur qui peut répondre
- ✅ Cibler des prestataires de confiance
- ✅ Éviter trop de devis non pertinents
- ✅ Gagner du temps

### Pour le Prestataire:
- ✅ Sentiment d'être choisi/valorisé
- ✅ Moins de concurrence
- ✅ Meilleure chance de décrocher le contrat
- ✅ Notification prioritaire

## 📊 Métriques à Suivre

- Nombre de demandes directes vs publiques
- Taux de réponse aux invitations
- Taux d'acceptation des devis (directe vs publique)
- Temps de réponse moyen
- Satisfaction client

## 🚀 Implémentation

### Phase 1: Base de données
1. Ajouter colonne `type` à `demandes`
2. Créer table `demande_invitations`
3. Configurer RLS policies

### Phase 2: Backend
1. API pour rechercher prestataires
2. API pour créer invitations
3. API pour récupérer invitations
4. Système de notifications

### Phase 3: Frontend
1. Modifier page "Nouvelle Demande"
2. Ajouter sélection de prestataires
3. Ajouter onglet "Invitations" pour prestataires
4. Badges et indicateurs visuels

### Phase 4: Notifications
1. Email aux prestataires invités
2. Notifications in-app
3. SMS (optionnel)

## 📝 Notes Techniques

- Limite d'invitations: 10 prestataires max par demande
- Expiration: Invitation expire après 7 jours
- Rappel: Notification de rappel après 24h si pas de réponse
- Historique: Garder trace de toutes les invitations

---

**Prêt à implémenter?** Cette fonctionnalité donnera plus de flexibilité aux clients tout en valorisant les prestataires de qualité.
