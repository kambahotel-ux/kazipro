# 🛡️ Guide du Système de Gestion des Litiges - KaziPro

## 📋 Vue d'ensemble

Le système de litiges permet de gérer les conflits entre clients et prestataires de manière structurée et équitable.

---

## 🗄️ Structure de la Base de Données

### Table: `litiges`

**Colonnes principales:**
- `id` - Identifiant unique (UUID)
- `mission_id` - Référence à la mission concernée
- `client_id` - Référence au client
- `prestataire_id` - Référence au prestataire
- `titre` - Titre du litige
- `description` - Description détaillée
- `type` - Type de litige (qualite, delai, paiement, autre)
- `statut` - Statut actuel (open, in_progress, resolved, escalated, closed)
- `priorite` - Niveau de priorité (low, medium, high, urgent)
- `montant_litige` - Montant en jeu (optionnel)
- `resolution` - Description de la résolution
- `decision` - Décision admin (refund_client, pay_prestataire, partial_refund, no_action)
- `notes_admin` - Notes internes de l'administrateur
- `created_at` - Date de création
- `resolved_at` - Date de résolution

---

## 🚀 Installation

### Étape 1: Créer la table dans Supabase

1. Ouvrez **Supabase Dashboard**: https://app.supabase.com
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Ouvrez le fichier `sql/create_litiges_table.sql`
5. Copiez tout le contenu
6. Collez dans l'éditeur SQL
7. Cliquez sur **Run** (ou Ctrl+Enter)
8. Attendez le message de succès

### Étape 2: Vérifier la création

1. Allez dans **Table Editor**
2. Vous devriez voir la table `litiges`
3. Vérifiez que les colonnes sont présentes

---

## 📊 Types de Litiges

### 1. **Qualité** (`qualite`)
- Travail non conforme aux attentes
- Mauvaise qualité d'exécution
- Résultat insatisfaisant

### 2. **Délai** (`delai`)
- Retard dans l'exécution
- Non-respect des échéances
- Abandon du chantier

### 3. **Paiement** (`paiement`)
- Non-paiement par le client
- Paiement incomplet
- Litige sur le montant

### 4. **Autre** (`autre`)
- Tout autre type de conflit

---

## 🔄 Workflow des Litiges

### Statuts disponibles:

1. **Open** (`open`)
   - Litige nouvellement créé
   - En attente de traitement
   - Actions: Examiner, Escalader, Résoudre

2. **In Progress** (`in_progress`)
   - Litige en cours d'investigation
   - Admin collecte des informations
   - Actions: Escalader, Résoudre

3. **Escalated** (`escalated`)
   - Litige complexe nécessitant attention urgente
   - Priorité automatiquement mise à "urgent"
   - Actions: Résoudre

4. **Resolved** (`resolved`)
   - Litige résolu avec décision prise
   - Décision enregistrée
   - Date de résolution enregistrée

5. **Closed** (`closed`)
   - Litige archivé
   - Aucune action supplémentaire possible

---

## 🎯 Niveaux de Priorité

1. **Low** (`low`) - Basse priorité
2. **Medium** (`medium`) - Priorité moyenne (par défaut)
3. **High** (`high`) - Haute priorité
4. **Urgent** (`urgent`) - Urgence maximale

---

## 👨‍💼 Actions Administrateur

### 1. Voir les litiges
```typescript
// Tous les litiges
GET /litiges

// Filtrer par statut
GET /litiges?statut=open

// Filtrer par priorité
GET /litiges?priorite=high
```

### 2. Résoudre un litige

**Option A: Rembourser le client**
```typescript
UPDATE litiges
SET 
  statut = 'resolved',
  decision = 'refund_client',
  resolved_at = NOW(),
  resolu_par = 'admin'
WHERE id = 'litige_id'
```

**Option B: Payer le prestataire**
```typescript
UPDATE litiges
SET 
  statut = 'resolved',
  decision = 'pay_prestataire',
  resolved_at = NOW(),
  resolu_par = 'admin'
WHERE id = 'litige_id'
```

### 3. Escalader un litige
```typescript
UPDATE litiges
SET 
  statut = 'escalated',
  priorite = 'urgent'
WHERE id = 'litige_id'
```

### 4. Ajouter des notes
```typescript
UPDATE litiges
SET notes_admin = 'Notes de l\'administrateur...'
WHERE id = 'litige_id'
```

---

## 🔐 Sécurité (RLS Policies)

### Admin
- ✅ Voir tous les litiges
- ✅ Créer des litiges
- ✅ Modifier tous les litiges
- ✅ Résoudre les litiges

### Clients
- ✅ Voir leurs propres litiges
- ✅ Créer des litiges
- ✅ Modifier leurs litiges (seulement si statut = 'open')

### Prestataires
- ✅ Voir leurs propres litiges
- ✅ Ajouter des preuves (seulement si statut = 'open' ou 'in_progress')

---

## 📱 Interface Admin

### Page: `/dashboard/admin/litiges`

**Fonctionnalités:**
1. **Onglets de filtrage**
   - Ouverts (open + in_progress)
   - Résolus (resolved + closed)
   - Escaladés (escalated)

2. **Carte de litige**
   - Titre et badges (priorité, type)
   - Description
   - Parties impliquées
   - Montant
   - Date de création

3. **Modal de détails**
   - Informations complètes
   - Historique
   - Notes admin
   - Actions disponibles

4. **Actions disponibles**
   - Voir les détails
   - Escalader
   - Rembourser client
   - Payer prestataire
   - Ajouter des notes

---

## 🧪 Tester le Système

### 1. Créer un litige de test (SQL)

```sql
INSERT INTO public.litiges (
  titre,
  description,
  type,
  statut,
  priorite,
  montant_litige,
  client_id,
  prestataire_id
) VALUES (
  'Test - Travail non terminé',
  'Le prestataire n''a pas terminé les travaux dans les délais convenus.',
  'delai',
  'open',
  'high',
  50000,
  (SELECT id FROM clients LIMIT 1),
  (SELECT id FROM prestataires LIMIT 1)
);
```

### 2. Vérifier dans l'interface

1. Connectez-vous en tant qu'admin
2. Allez sur `/dashboard/admin/litiges`
3. Vous devriez voir le litige de test
4. Cliquez sur "Détails"
5. Testez les actions (Escalader, Résoudre)

---

## 📈 Statistiques

Le système collecte automatiquement:
- Nombre total de litiges
- Litiges ouverts
- Litiges résolus
- Litiges escaladés
- Taux de résolution
- Temps moyen de résolution

---

## 🔧 Maintenance

### Archiver les vieux litiges

```sql
-- Fermer les litiges résolus depuis plus de 30 jours
UPDATE litiges
SET statut = 'closed'
WHERE statut = 'resolved'
  AND resolved_at < NOW() - INTERVAL '30 days';
```

### Statistiques de performance

```sql
-- Temps moyen de résolution
SELECT 
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_hours
FROM litiges
WHERE statut = 'resolved';

-- Taux de résolution par type
SELECT 
  type,
  COUNT(*) as total,
  SUM(CASE WHEN statut = 'resolved' THEN 1 ELSE 0 END) as resolved,
  ROUND(100.0 * SUM(CASE WHEN statut = 'resolved' THEN 1 ELSE 0 END) / COUNT(*), 2) as resolution_rate
FROM litiges
GROUP BY type;
```

---

## ⚠️ Bonnes Pratiques

1. **Toujours documenter** - Ajoutez des notes admin détaillées
2. **Escalader rapidement** - Les litiges urgents doivent être traités en priorité
3. **Communiquer** - Informez les parties de la décision
4. **Archiver** - Fermez les litiges résolus après 30 jours
5. **Analyser** - Utilisez les statistiques pour améliorer le service

---

## 🆘 Dépannage

### Problème: Table litiges n'existe pas
**Solution:** Exécutez le script `sql/create_litiges_table.sql`

### Problème: Erreur de permissions
**Solution:** Vérifiez que vous êtes connecté en tant qu'admin

### Problème: Litiges ne s'affichent pas
**Solution:** 
1. Vérifiez que la table contient des données
2. Vérifiez les RLS policies
3. Vérifiez la console du navigateur pour les erreurs

---

## 📞 Support

Pour toute question ou problème:
1. Vérifiez ce guide
2. Consultez les logs Supabase
3. Vérifiez la console du navigateur

---

**Système de litiges opérationnel! ✅**
