# 💱 Système Multi-Devises pour les Devis

## ✅ Fonctionnalité Ajoutée

Le système de devis supporte maintenant **3 devises différentes**:
- 🇨🇩 **FC** (Franc Congolais) - Par défaut
- 🇺🇸 **USD** (Dollar Américain)
- 🇪🇺 **EUR** (Euro)

---

## 🔧 Modifications Apportées

### 1. Base de Données

**Colonne ajoutée**: `devise TEXT DEFAULT 'FC'`

**Constraint ajouté**: 
```sql
CHECK (devise IN ('FC', 'USD', 'EUR'))
```

**Fichier**: `sql/upgrade_devis_simple.sql`

### 2. Interface Utilisateur

**Sélecteur de devise** ajouté dans le modal de création:
- Position: Au-dessus des totaux
- Options: FC, USD, EUR
- Valeur par défaut: FC

**Affichage de la devise** partout:
- ✅ Liste des devis
- ✅ Modal de création (totaux)
- ✅ Modal de prévisualisation
- ✅ Statistiques (montant accepté)
- ✅ Tableau des articles

---

## 🎨 Interface

### Modal de Création

```
┌─────────────────────────────────────────────────┐
│  Totaux                                         │
├─────────────────────────────────────────────────┤
│  Devise:                    [FC ▼]              │
│                             - FC (Franc Congo)  │
│                             - USD ($)           │
│                             - EUR (€)           │
│                                                 │
│  Montant HT:                56,000 FC           │
│  TVA: [16] %                 8,960 FC           │
│  ─────────────────────────────────────          │
│  Total TTC:                 64,960 FC           │
└─────────────────────────────────────────────────┘
```

### Liste des Devis

```
┌─────────────────────────────────────────────────┐
│ Installation électrique      [Brouillon]       │
│ DEV-2026-0001                                   │
│                                                 │
│ Montant HT: 50,000 USD  TVA (16%): 8,000 USD  │
│ Total TTC: 58,000 USD                           │
└─────────────────────────────────────────────────┘
```

### Prévisualisation

```
┌─────────────────────────────────────────────────┐
│ Désignation      Qté  Unité  P.U.     Montant  │
├─────────────────────────────────────────────────┤
│ Câblage          50   m      500 EUR  25,000 EUR│
│ Tableau          1    unité  15K EUR  15,000 EUR│
└─────────────────────────────────────────────────┘

                          Montant HT:  40,000 EUR
                          TVA (16%):    6,400 EUR
                          ─────────────────────
                          Total TTC:   46,400 EUR
```

### Statistiques

```
┌──────────────────────────────────────┐
│  Montant accepté                     │
│  150,000 FC + 5,000 USD + 2,000 EUR │
│  Total                               │
└──────────────────────────────────────┘
```

---

## 💾 Structure de Données

### Table devis

```sql
CREATE TABLE devis (
  ...
  montant_ht DECIMAL(10, 2),
  tva DECIMAL(5, 2),
  montant_ttc DECIMAL(10, 2),
  devise TEXT DEFAULT 'FC',  -- NOUVEAU
  ...
);
```

### Exemple de Devis

```json
{
  "id": "uuid",
  "numero": "DEV-2026-0001",
  "titre": "Installation électrique",
  "montant_ht": 50000,
  "tva": 16,
  "montant_ttc": 58000,
  "devise": "USD",  // NOUVEAU
  "statut": "brouillon"
}
```

---

## 🧪 Tests à Effectuer

### Test 1: Créer un Devis en FC (Par défaut)

1. Créer un nouveau devis
2. ✅ Vérifier que la devise est "FC" par défaut
3. Enregistrer
4. ✅ Vérifier l'affichage: "58,000 FC"

### Test 2: Créer un Devis en USD

1. Créer un nouveau devis
2. Changer la devise à "USD"
3. ✅ Vérifier que les totaux affichent "USD"
4. Enregistrer
5. ✅ Vérifier dans la liste: "58,000 USD"
6. ✅ Vérifier dans la prévisualisation: "58,000 USD"

### Test 3: Créer un Devis en EUR

1. Créer un nouveau devis
2. Changer la devise à "EUR"
3. ✅ Vérifier que les totaux affichent "EUR"
4. Enregistrer
5. ✅ Vérifier dans la liste: "58,000 EUR"

### Test 4: Dupliquer un Devis

1. Créer un devis en USD
2. Dupliquer le devis
3. ✅ Vérifier que la devise USD est préservée
4. Modifier la devise à EUR
5. Enregistrer
6. ✅ Vérifier que le nouveau devis est en EUR

### Test 5: Statistiques Multi-Devises

1. Créer et accepter 3 devis:
   - Devis 1: 50,000 FC (accepté)
   - Devis 2: 1,000 USD (accepté)
   - Devis 3: 500 EUR (accepté)
2. ✅ Vérifier les statistiques affichent: "50,000 FC + 1,000 USD + 500 EUR"

---

## 📋 Checklist d'Installation

- [ ] Script SQL `sql/upgrade_devis_simple.sql` exécuté
- [ ] Colonne `devise` ajoutée à la table `devis`
- [ ] Constraint `devis_devise_check` créé
- [ ] Interface mise à jour
- [ ] Sélecteur de devise visible dans le modal
- [ ] Devise affichée dans la liste
- [ ] Devise affichée dans la prévisualisation
- [ ] Statistiques multi-devises fonctionnelles
- [ ] Tests effectués pour les 3 devises

---

## 🎯 Cas d'Usage

### Cas 1: Prestataire International

Un électricien qui travaille avec des clients internationaux peut:
- Créer des devis en FC pour les clients locaux
- Créer des devis en USD pour les entreprises internationales
- Créer des devis en EUR pour les clients européens

### Cas 2: Suivi Multi-Devises

Le prestataire peut voir dans ses statistiques:
- Total accepté en FC: 500,000 FC
- Total accepté en USD: 2,000 USD
- Total accepté en EUR: 1,500 EUR

### Cas 3: Flexibilité Client

Le prestataire peut adapter la devise selon:
- La préférence du client
- Le type de projet
- Le mode de paiement prévu

---

## 🔄 Migration des Données Existantes

Les devis existants sans devise seront automatiquement en **FC** (valeur par défaut).

```sql
-- Vérifier les devis sans devise
SELECT id, numero, titre, devise 
FROM devis 
WHERE devise IS NULL;

-- Mettre à jour si nécessaire (automatique avec DEFAULT)
UPDATE devis SET devise = 'FC' WHERE devise IS NULL;
```

---

## 💡 Améliorations Futures

### Phase 1: Conversion de Devises
- [ ] Ajouter un taux de change
- [ ] Convertir automatiquement entre devises
- [ ] Afficher l'équivalent dans d'autres devises

### Phase 2: Plus de Devises
- [ ] Ajouter d'autres devises africaines
- [ ] Ajouter des devises asiatiques
- [ ] Configuration personnalisée des devises

### Phase 3: Symboles de Devises
- [ ] Afficher les symboles ($ pour USD, € pour EUR)
- [ ] Format localisé des nombres
- [ ] Position du symbole selon la devise

---

## 📝 Notes Importantes

### Devise par Défaut

La devise par défaut est **FC** (Franc Congolais) car:
- C'est la devise locale de la RDC
- La majorité des transactions seront en FC
- Compatibilité avec les devis existants

### Pas de Conversion Automatique

Le système **ne convertit pas** automatiquement entre devises:
- Chaque devis garde sa devise d'origine
- Les montants sont stockés tels quels
- Le prestataire doit gérer les taux de change manuellement

### Statistiques Multi-Devises

Les statistiques affichent les montants **séparés par devise**:
- Exemple: "150,000 FC + 5,000 USD + 2,000 EUR"
- Pas de total unique (pas de conversion)
- Chaque devise est clairement identifiée

---

## ✅ Résultat

Un système de devis flexible qui supporte:
- ✅ 3 devises (FC, USD, EUR)
- ✅ Sélection facile de la devise
- ✅ Affichage cohérent partout
- ✅ Statistiques multi-devises
- ✅ Compatibilité avec les données existantes

**Le système multi-devises est prêt à être utilisé!** 💱

---

**IMPORTANT**: Exécutez d'abord `sql/upgrade_devis_simple.sql` pour ajouter la colonne `devise` à la base de données.
