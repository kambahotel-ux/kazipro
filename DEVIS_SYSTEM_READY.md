# ✅ Système de Devis - PRÊT À UTILISER

## 🎯 Statut: COMPLET

Le système de devis professionnel est maintenant prêt à être utilisé avec la table `devis` existante!

---

## 📁 FICHIER À EXÉCUTER

**Fichier**: `sql/upgrade_devis_simple.sql`

**Action**: Exécuter dans Supabase SQL Editor

Ce script va:
1. ✅ Étendre la table `devis` existante (ajouter colonnes)
2. ✅ Créer la table `devis_items` (lignes d'articles)
3. ✅ Créer les fonctions (génération numéro, calculs)
4. ✅ Créer les triggers (recalcul automatique)
5. ✅ Configurer les RLS policies (sécurité)
6. ✅ Migrer les données existantes

---

## 🔄 CHANGEMENTS PAR RAPPORT À L'ORIGINAL

### Avant (Table devis originale)
```sql
devis
├── id
├── demande_id
├── prestataire_id
├── amount          ← Montant simple
├── description
├── status          ← pending/accepted/rejected
├── created_at
└── updated_at
```

### Après (Table devis étendue)
```sql
devis
├── id
├── demande_id
├── prestataire_id
├── client_id       ← NOUVEAU
├── numero          ← NOUVEAU (DEV-2026-0001)
├── titre           ← NOUVEAU
├── description
├── notes           ← NOUVEAU
├── conditions      ← NOUVEAU
├── amount          ← Préservé (compatibilité)
├── montant_ht      ← NOUVEAU
├── tva             ← NOUVEAU (16%)
├── montant_ttc     ← NOUVEAU
├── status          ← Préservé (compatibilité)
├── statut          ← NOUVEAU (brouillon/envoye/accepte/refuse/expire)
├── date_creation   ← NOUVEAU
├── date_envoi      ← NOUVEAU
├── date_expiration ← NOUVEAU
├── date_acceptation← NOUVEAU
├── date_refus      ← NOUVEAU
├── created_at
└── updated_at

devis_items (NOUVELLE TABLE)
├── id
├── devis_id
├── designation
├── quantite
├── unite
├── prix_unitaire
├── montant
├── ordre
└── created_at
```

---

## 🎨 FONCTIONNALITÉS DISPONIBLES

### Interface Complète
- ✅ Page de gestion des devis
- ✅ Statistiques en temps réel
- ✅ Liste avec filtres et recherche
- ✅ Modal de création
- ✅ Modal de prévisualisation

### Création de Devis
- ✅ Informations générales (titre, description, notes)
- ✅ Lignes d'articles dynamiques
- ✅ Calculs automatiques (HT, TVA, TTC)
- ✅ Conditions personnalisables
- ✅ Enregistrer en brouillon ou envoyer

### Gestion des Devis
- ✅ Voir (prévisualisation professionnelle)
- ✅ Dupliquer
- ✅ Supprimer (brouillons et refusés)
- ✅ Filtrer par statut
- ✅ Rechercher par titre ou numéro

### États Gérés
- 📝 **Brouillon** - En cours de création
- 📤 **Envoyé** - Envoyé au client (expire dans 30 jours)
- ✅ **Accepté** - Validé par le client
- ❌ **Refusé** - Refusé par le client
- ⏰ **Expiré** - Date d'expiration dépassée

### Automatisations
- ✅ Génération automatique de numéros (DEV-2026-0001)
- ✅ Calcul automatique des montants
- ✅ Recalcul lors de modification des lignes
- ✅ Mise à jour automatique des dates selon le statut

---

## 📋 ÉTAPES D'INSTALLATION

### 1. Exécuter le Script SQL ⚠️ REQUIS

```bash
# Ouvrir Supabase Dashboard
# → SQL Editor
# → Copier le contenu de sql/upgrade_devis_simple.sql
# → Exécuter (Run)
```

### 2. Vérifier l'Installation

```sql
-- Vérifier les colonnes
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'devis' AND column_name IN ('numero', 'titre', 'statut');

-- Vérifier la table items
SELECT * FROM devis_items LIMIT 1;

-- Tester la fonction
SELECT generate_devis_numero();
```

### 3. Tester l'Interface

```bash
# Accéder à la page
http://localhost:8080/dashboard/prestataire/devis

# Créer un devis test
# Vérifier la prévisualisation
# Tester les filtres
```

---

## 🧪 SCÉNARIO DE TEST

### Test 1: Créer un Devis Brouillon

1. Cliquer "Nouveau devis"
2. Remplir:
   - Titre: "Installation électrique test"
   - Ligne 1: Câblage | 10 | m | 500 | = 5,000 FC
   - Ligne 2: Tableau | 1 | unité | 15000 | = 15,000 FC
3. Vérifier totaux: HT: 20,000 FC, TVA: 3,200 FC, TTC: 23,200 FC
4. Cliquer "Enregistrer brouillon"
5. ✅ Vérifier: Devis dans la liste, statut "Brouillon", numéro DEV-2026-0001

### Test 2: Prévisualiser

1. Cliquer "Voir" sur le devis
2. ✅ Vérifier: Modal s'ouvre, design professionnel, toutes les infos

### Test 3: Dupliquer

1. Cliquer "Dupliquer"
2. Modifier le titre
3. Enregistrer
4. ✅ Vérifier: Nouveau devis créé avec numéro DEV-2026-0002

### Test 4: Envoyer

1. Créer un nouveau devis
2. Cliquer "Envoyer" au lieu de "Enregistrer brouillon"
3. ✅ Vérifier: Statut "Envoyé", date d'envoi renseignée

### Test 5: Filtres

1. Créer plusieurs devis avec différents statuts
2. Tester recherche par titre
3. Tester filtres par statut
4. ✅ Vérifier: Résultats corrects

---

## 📊 STRUCTURE DES DONNÉES

### Exemple de Devis Complet

```json
{
  "id": "uuid",
  "numero": "DEV-2026-0001",
  "prestataire_id": "uuid",
  "client_id": null,
  "demande_id": null,
  "titre": "Installation électrique complète",
  "description": "Installation pour maison 3 chambres",
  "notes": "Client habituel",
  "conditions": "Devis valable 30 jours...",
  "montant_ht": 56000,
  "tva": 16,
  "montant_ttc": 64960,
  "statut": "brouillon",
  "date_creation": "2026-01-04T10:00:00Z",
  "date_envoi": null,
  "date_expiration": null,
  "items": [
    {
      "designation": "Câblage électrique",
      "quantite": 50,
      "unite": "m",
      "prix_unitaire": 500,
      "montant": 25000,
      "ordre": 0
    },
    {
      "designation": "Tableau électrique",
      "quantite": 1,
      "unite": "unité",
      "prix_unitaire": 15000,
      "montant": 15000,
      "ordre": 1
    }
  ]
}
```

---

## 🔧 FONCTIONS DISPONIBLES

### 1. generate_devis_numero()
Génère un numéro unique pour le devis
```sql
SELECT generate_devis_numero();
-- Retourne: DEV-2026-0001
```

### 2. calculate_devis_montants(devis_uuid)
Recalcule les montants d'un devis
```sql
SELECT calculate_devis_montants('uuid-du-devis');
```

### 3. change_devis_statut(devis_uuid, new_statut)
Change le statut et met à jour les dates
```sql
SELECT change_devis_statut('uuid-du-devis', 'envoye');
```

---

## 🎯 COMPATIBILITÉ

### Anciennes Données Préservées

Le script migre automatiquement:
- `amount` → `montant_ttc`
- `status` → `statut`
  - pending → envoye
  - accepted → accepte
  - rejected → refuse

### Colonnes Préservées

Les anciennes colonnes restent intactes:
- `amount` (pour compatibilité)
- `status` (pour compatibilité)
- `description` (utilisée)

---

## 🚀 PROCHAINES AMÉLIORATIONS

### Phase 3: Export PDF
- [ ] Installation de jsPDF
- [ ] Template PDF professionnel
- [ ] Téléchargement direct

### Phase 4: Envoi Client
- [ ] Sélection du client
- [ ] Email automatique
- [ ] Notification

### Phase 5: Avancé
- [ ] Édition des brouillons
- [ ] Modèles réutilisables
- [ ] Signature électronique
- [ ] Conversion en mission

---

## 📝 NOTES IMPORTANTES

### Utilisation des Colonnes

**Utilisez les nouvelles colonnes**:
- `montant_ttc` au lieu de `amount`
- `statut` au lieu de `status`
- `titre` pour le titre
- `montant_ht` pour HT

**Les anciennes colonnes sont préservées** pour compatibilité avec le code existant.

### Numérotation

Format: `DEV-YYYY-NNNN`
- DEV = Devis
- YYYY = Année
- NNNN = Numéro séquentiel (0001, 0002, etc.)

Exemple: DEV-2026-0001, DEV-2026-0002, etc.

### Calculs

```
Montant ligne = Quantité × Prix unitaire
Montant HT = Somme des montants des lignes
Montant TVA = Montant HT × (TVA% / 100)
Montant TTC = Montant HT + Montant TVA
```

---

## ✅ CHECKLIST FINALE

- [ ] Script `sql/upgrade_devis_simple.sql` exécuté
- [ ] Colonnes ajoutées à la table `devis`
- [ ] Table `devis_items` créée
- [ ] Fonctions créées et testées
- [ ] Triggers fonctionnels
- [ ] RLS policies configurées
- [ ] Page accessible
- [ ] Création de devis fonctionne
- [ ] Prévisualisation fonctionne
- [ ] Calculs corrects
- [ ] Filtres fonctionnent
- [ ] Recherche fonctionne

---

## 🎉 RÉSULTAT

Un système de devis professionnel complet qui:
- ✅ Utilise la table `devis` existante (étendue)
- ✅ Préserve les données existantes
- ✅ Ajoute des fonctionnalités avancées
- ✅ Calcule automatiquement les montants
- ✅ Génère des numéros uniques
- ✅ Offre une interface moderne
- ✅ Sécurise avec RLS

**Le système est prêt à être utilisé!** 🚀

---

**PROCHAINE ÉTAPE**: Exécuter `sql/upgrade_devis_simple.sql` dans Supabase SQL Editor

**DOCUMENTATION**: Voir `EXECUTE_DEVIS_UPGRADE.md` pour les instructions détaillées
