# ✅ AMÉLIORATION: Gestion des Items et Devise Dynamique

## 🎯 PROBLÈMES RÉSOLUS

1. **Pas de possibilité d'ajouter des articles/items** → Ajout d'une gestion complète des items
2. **Devise figée en CDF** → Sélection dynamique de la devise (CDF, USD, EUR)

## 🚀 NOUVELLES FONCTIONNALITÉS

### 1. Gestion des Items/Articles ✅

Le prestataire peut maintenant ajouter plusieurs articles/services dans un devis:

**Fonctionnalités**:
- ✅ Ajouter des articles illimités
- ✅ Supprimer des articles (minimum 1)
- ✅ Pour chaque article:
  - Désignation (ex: Main d'œuvre, Matériaux, etc.)
  - Quantité
  - Prix unitaire
  - Total calculé automatiquement

**Interface**:
```
Article 1                                    [🗑️]
├─ Désignation: Main d'œuvre
├─ Quantité: 5
├─ Prix unitaire: 20000 CDF
└─ Total: 100000 CDF

[+ Ajouter un article]
```

### 2. Sélection de Devise ✅

Le prestataire peut choisir la devise du devis:

**Devises disponibles**:
- 🇨🇩 Franc Congolais (CDF)
- 🇺🇸 Dollar Américain (USD)
- 🇪🇺 Euro (EUR)

**Affichage dynamique**:
- Tous les montants s'affichent dans la devise sélectionnée
- Calculs automatiques mis à jour
- Devise enregistrée dans la base de données

## 📊 STRUCTURE DES DONNÉES

### Devis (table `devis`)
```typescript
{
  devise: 'CDF' | 'USD' | 'EUR', // ✅ Dynamique
  montant_ttc: number,
  montant_ht: number,
  tva: number,
  frais_deplacement: number,
  // ... autres champs
}
```

### Items (table `devis_pro_items`)
```typescript
{
  devis_id: UUID,
  designation: string,      // "Main d'œuvre", "Matériaux"
  quantite: number,         // 5
  prix_unitaire: number,    // 20000
  montant: number,          // 100000 (quantite * prix_unitaire)
}
```

## 🧮 CALCULS AUTOMATIQUES

### Avec Items

```
Sous-total articles:  100000 CDF
  Article 1: 5 × 20000 = 100000
  Article 2: 2 × 15000 = 30000
  → Sous-total: 130000 CDF

+ Frais de déplacement: 5000 CDF
= Montant HT: 135000 CDF

+ TVA (16%): 21600 CDF
= Montant TTC: 156600 CDF

Si acompte 30%:
  Acompte: 46980 CDF
  Solde: 109620 CDF
```

## 🎨 INTERFACE UTILISATEUR

### Section Tarification

```
┌─ Tarification ────────────────────────────────┐
│                                                │
│ Devise: [Franc Congolais (CDF) ▼]            │
│                                                │
│ ─────────────────────────────────────────────  │
│                                                │
│ Articles / Services        [+ Ajouter article] │
│                                                │
│ ┌─ Article 1 ──────────────────────── [🗑️] ─┐ │
│ │ Désignation: [Main d'œuvre          ]      │ │
│ │ Quantité: [5]  Prix unitaire: [20000]     │ │
│ │ Total: 100000 CDF                          │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ ┌─ Article 2 ──────────────────────── [🗑️] ─┐ │
│ │ Désignation: [Matériaux             ]      │ │
│ │ Quantité: [2]  Prix unitaire: [15000]     │ │
│ │ Total: 30000 CDF                           │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ ─────────────────────────────────────────────  │
│                                                │
│ Frais de déplacement: [5000] CDF              │
│ TVA: [16] %                                    │
│ Validité: [30] jours                           │
│                                                │
│ ─────────────────────────────────────────────  │
│                                                │
│ Sous-total articles:     130000 CDF            │
│ Frais de déplacement:      5000 CDF            │
│ Montant HT:              135000 CDF            │
│ TVA (16%):                21600 CDF            │
│ ─────────────────────────────────────────────  │
│ Montant TTC:             156600 CDF            │
│                                                │
└────────────────────────────────────────────────┘
```

## ✅ VALIDATION

Le formulaire valide maintenant:
- ✅ Au moins un article avec désignation
- ✅ Tous les articles ont un prix > 0
- ✅ Tous les articles ont une quantité > 0
- ✅ Description non vide
- ✅ Délais renseignés

## 💾 ENREGISTREMENT

### Étape 1: Créer le devis
```sql
INSERT INTO devis (
  demande_id,
  prestataire_id,
  montant_ttc,
  montant_ht,
  tva,
  frais_deplacement,
  devise,  -- ✅ Devise sélectionnée
  description,
  delai_execution,
  delai_intervention,
  garantie,
  validite_devis,
  conditions_paiement,
  status,
  statut
) VALUES (...)
RETURNING id;
```

### Étape 2: Créer les items
```sql
INSERT INTO devis_pro_items (
  devis_id,
  designation,
  quantite,
  prix_unitaire,
  montant
) VALUES
  (devis_id, 'Main d''œuvre', 5, 20000, 100000),
  (devis_id, 'Matériaux', 2, 15000, 30000);
```

## 🧪 COMMENT TESTER

### Test 1: Créer un devis avec items

1. **Aller sur Opportunités**
2. **Cliquer "Voir les détails" sur une demande**
3. **Cliquer "Soumettre un devis"**
4. **Sélectionner la devise**: USD
5. **Ajouter des articles**:
   - Article 1: Main d'œuvre, Qté: 5, Prix: 100
   - Article 2: Matériaux, Qté: 10, Prix: 50
6. **Vérifier les calculs**:
   - Sous-total: 1000 USD
   - Avec frais et TVA
7. **Soumettre**

### Test 2: Supprimer/Ajouter des items

1. **Ajouter 3 articles**
2. **Supprimer le 2ème** (bouton 🗑️)
3. **Vérifier que les calculs se mettent à jour**
4. **Ajouter un nouvel article**
5. **Vérifier la numérotation** (Article 1, 2, 3...)

### Test 3: Changer de devise

1. **Sélectionner CDF**
2. **Ajouter un article**: 100000 CDF
3. **Changer pour USD**
4. **Vérifier que l'affichage change**: 100000 USD
5. **Soumettre et vérifier en base**: devise = 'USD'

### Test 4: Validation

1. **Essayer de soumettre sans articles** → Erreur
2. **Ajouter un article avec prix = 0** → Erreur
3. **Ajouter un article avec quantité = 0** → Erreur
4. **Corriger et soumettre** → Succès

## 📋 MODIFICATIONS TECHNIQUES

### Fichier modifié
- `src/pages/dashboard/prestataire/CreerDevisPage.tsx`

### Changements principaux

1. **State ajouté**:
   ```typescript
   const [devise, setDevise] = useState('CDF');
   const [items, setItems] = useState<Array<{...}>>([]);
   ```

2. **Fonctions ajoutées**:
   ```typescript
   addItem()           // Ajouter un article
   removeItem(id)      // Supprimer un article
   updateItem(id, field, value)  // Modifier un article
   ```

3. **Calculs modifiés**:
   ```typescript
   // AVANT
   const montantHT = parseFloat(montantService) + ...
   
   // APRÈS
   const sousTotal = items.reduce((sum, item) => sum + item.total, 0);
   const montantHT = sousTotal + parseFloat(fraisDeplacement);
   ```

4. **Validation modifiée**:
   ```typescript
   // Vérifier items au lieu de montantService
   if (items.length === 0 || items.every(item => !item.designation.trim()))
   if (items.some(item => item.prix_unitaire <= 0 || item.quantite <= 0))
   ```

5. **Insertion items**:
   ```typescript
   // Après création du devis
   await supabase
     .from('devis_pro_items')
     .insert(itemsToInsert);
   ```

### Imports ajoutés
```typescript
import { Plus, Trash2 } from 'lucide-react';
```

## 🎉 RÉSULTAT FINAL

Le formulaire de création de devis est maintenant **professionnel et complet**:

✅ **Gestion multi-items** (comme un vrai devis)
✅ **Devise dynamique** (CDF, USD, EUR)
✅ **Calculs automatiques** en temps réel
✅ **Validation robuste**
✅ **Interface intuitive**
✅ **Enregistrement complet** (devis + items)

Le prestataire peut créer des devis détaillés avec plusieurs lignes d'articles, exactement comme un devis professionnel traditionnel! 🚀
