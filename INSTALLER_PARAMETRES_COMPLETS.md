# 🎯 Installation: Paramètres Entièrement Fonctionnels

## ✅ Fonctionnalités Ajoutées

### 1. Notifications (Sauvegarde en BDD)
- ✅ Notifications push (5 options)
- ✅ Notifications email (3 options)
- ✅ Notifications SMS (2 options)
- ✅ Sauvegarde automatique à chaque changement

### 2. Sécurité
- ✅ Changement de mot de passe fonctionnel
- ✅ Validation (min 6 caractères, confirmation)
- ⚠️ 2FA (désactivé, à implémenter plus tard)

### 3. Disponibilité
- ✅ Toggle disponibilité globale
- ✅ Horaires de travail par jour
- ✅ Mode vacances
- ✅ Accepter urgences

### 4. Préférences
- ✅ Langue (FR, EN, LN, SW)
- ✅ Fuseau horaire
- ✅ Sauvegarde en BDD

### 5. Entreprise
- ✅ Logo et signature
- ✅ Informations entreprise
- ✅ Conditions générales

---

## 📋 Installation (3 étapes)

### Étape 1: Créer la Table (30 secondes)

Dans Supabase SQL Editor, exécuter:

```sql
sql/create_prestataire_settings.sql
```

Ou copier-coller:

```sql
CREATE TABLE IF NOT EXISTS prestataire_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prestataire_id UUID REFERENCES prestataires(id) ON DELETE CASCADE,
  
  -- Notifications Push
  notif_nouvelles_missions BOOLEAN DEFAULT true,
  notif_messages_clients BOOLEAN DEFAULT true,
  notif_maj_missions BOOLEAN DEFAULT true,
  notif_rappels_rdv BOOLEAN DEFAULT false,
  notif_promotions BOOLEAN DEFAULT false,
  
  -- Notifications Email
  email_resume_hebdo BOOLEAN DEFAULT true,
  email_nouvelles_missions BOOLEAN DEFAULT false,
  email_paiements BOOLEAN DEFAULT true,
  
  -- Notifications SMS
  sms_missions_urgentes BOOLEAN DEFAULT true,
  sms_codes_verification BOOLEAN DEFAULT true,
  
  -- Préférences
  langue VARCHAR(10) DEFAULT 'fr',
  fuseau_horaire VARCHAR(50) DEFAULT 'Africa/Kinshasa',
  
  -- Disponibilité
  mode_vacances BOOLEAN DEFAULT false,
  accepter_urgences BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(prestataire_id)
);

-- RLS
ALTER TABLE prestataire_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prestataires can view own settings" ON prestataire_settings
FOR SELECT USING (
  prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
);

CREATE POLICY "Prestataires can insert own settings" ON prestataire_settings
FOR INSERT WITH CHECK (
  prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
);

CREATE POLICY "Prestataires can update own settings" ON prestataire_settings
FOR UPDATE USING (
  prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
);
```

### Étape 2: Remplacer le Fichier (1 minute)

Le fichier `ParametresPageComplete.tsx` contient toute la logique.

**Option A: Copier le contenu complet**
1. Ouvrir `src/pages/dashboard/prestataire/ParametresPageComplete.tsx`
2. Copier tout le contenu
3. Remplacer le contenu de `src/pages/dashboard/prestataire/ParametresPage.tsx`

**Option B: Utiliser le fichier directement**
```bash
mv src/pages/dashboard/prestataire/ParametresPage.tsx src/pages/dashboard/prestataire/ParametresPage.tsx.backup
mv src/pages/dashboard/prestataire/ParametresPageComplete.tsx src/pages/dashboard/prestataire/ParametresPage.tsx
```

### Étape 3: Tester (2 minutes)

1. Rafraîchir l'application (Ctrl+Shift+R)
2. Aller sur Paramètres
3. Tester chaque onglet:
   - ✅ Entreprise → Upload logo/signature
   - ✅ Notifications → Toggle switches
   - ✅ Sécurité → Changer mot de passe
   - ✅ Disponibilité → Toggle + horaires
   - ✅ Préférences → Langue + fuseau horaire

---

## 🧪 Tests de Validation

### Test 1: Notifications
```
1. Aller sur onglet "Notifications"
2. Désactiver "Nouvelles missions"
3. Rafraîchir la page
4. ✅ Le switch doit rester désactivé
```

### Test 2: Mot de Passe
```
1. Aller sur onglet "Sécurité"
2. Entrer nouveau mot de passe (min 6 caractères)
3. Confirmer le mot de passe
4. Cliquer "Mettre à jour"
5. ✅ Toast de succès
6. Se déconnecter et reconnecter avec nouveau mot de passe
```

### Test 3: Préférences
```
1. Aller sur onglet "Préférences"
2. Changer langue → "English"
3. Changer fuseau horaire → "Lubumbashi"
4. Cliquer "Enregistrer"
5. Rafraîchir la page
6. ✅ Les valeurs doivent être conservées
```

### Test 4: Disponibilité
```
1. Aller sur onglet "Disponibilité"
2. Désactiver le toggle "Disponibilité générale"
3. ✅ Toast de confirmation
4. Vérifier dans la BDD:
   SELECT disponible FROM prestataires WHERE id = 'VOTRE_ID';
5. ✅ Doit être false
```

---

## 📊 Structure de la BDD

### Table: prestataire_settings
```
prestataire_id → prestataires(id)
notif_* → Notifications push (5 colonnes)
email_* → Notifications email (3 colonnes)
sms_* → Notifications SMS (2 colonnes)
langue, fuseau_horaire → Préférences
mode_vacances, accepter_urgences → Disponibilité
```

### Relations
```
prestataires (1) ←→ (1) prestataire_settings
prestataires (1) ←→ (1) entreprise_info
prestataires (1) ←→ (N) horaires_travail
```

---

## 🔧 Fonctionnalités par Onglet

### ✅ Entreprise
- Upload logo (Storage: company-logos)
- Upload signature (Storage: signatures)
- Infos entreprise (Table: entreprise_info)
- Conditions générales

### ✅ Notifications
- 10 switches fonctionnels
- Sauvegarde automatique
- Table: prestataire_settings

### ✅ Sécurité
- Changement mot de passe (Supabase Auth)
- Validation + confirmation
- 2FA (UI seulement, désactivé)

### ✅ Disponibilité
- Toggle global (Table: prestataires.disponible)
- Horaires par jour (Table: horaires_travail)
- Mode vacances (Table: prestataire_settings)
- Accepter urgences (Table: prestataire_settings)

### ✅ Préférences
- Langue (4 options)
- Fuseau horaire (2 options)
- Sauvegarde en BDD

### ❌ Paiements
- Ignoré comme demandé
- UI présente mais non fonctionnelle

---

## ✅ Checklist Finale

- [ ] SQL exécuté (table prestataire_settings créée)
- [ ] Fichier ParametresPage.tsx remplacé
- [ ] Application rafraîchie
- [ ] Test Notifications ✓
- [ ] Test Sécurité (mot de passe) ✓
- [ ] Test Disponibilité ✓
- [ ] Test Préférences ✓
- [ ] Test Entreprise ✓

---

## 🎉 Résultat

Tous les paramètres sont maintenant entièrement fonctionnels (sauf Paiements comme demandé):

- ✅ Sauvegarde en base de données
- ✅ Chargement des valeurs existantes
- ✅ Mise à jour en temps réel
- ✅ Validation des données
- ✅ Messages de confirmation

**Exécutez le SQL et testez!** 🚀
