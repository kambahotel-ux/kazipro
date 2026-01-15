# Correction - Contrainte devise (FC vs CDF)

## 🎯 Problème Identifié

**Erreur:** `new row for relation "devis" violates check constraint "devis_devise_check"`

### Cause Racine
Incohérence entre le code et la base de données:
- **Code TypeScript:** Utilise `'CDF'` (Franc Congolais - code ISO standard)
- **Contrainte SQL:** N'accepte que `'FC'`, `'USD'`, `'EUR'`

## 📊 Analyse

### Code ISO des Devises
- **CDF** = Franc Congolais (code ISO 4217 officiel) ✅
- **FC** = Abréviation locale non standard ❌
- **USD** = Dollar Américain (code ISO standard) ✅
- **EUR** = Euro (code ISO standard) ✅

### Fichiers avec Incohérence

#### Scripts SQL avec 'FC'
```sql
-- sql/upgrade_devis_simple.sql
ALTER TABLE devis ADD CONSTRAINT devis_devise_check 
  CHECK (devise IN ('FC', 'USD', 'EUR'));  -- ❌ Utilise FC

-- sql/add_devise_column.sql
ALTER TABLE devis ADD CONSTRAINT devis_devise_check 
  CHECK (devise IN ('FC', 'USD', 'EUR'));  -- ❌ Utilise FC
```

#### Scripts SQL avec 'CDF'
```sql
-- sql/upgrade_devis_complete.sql
ALTER TABLE devis ADD COLUMN devise TEXT DEFAULT 'CDF' 
  CHECK (devise IN ('CDF', 'USD', 'EUR'));  -- ✅ Utilise CDF
```

#### Code TypeScript
```typescript
// src/pages/dashboard/prestataire/CreerDevisPage.tsx
const [devise, setDevise] = useState('CDF');  // ✅ Utilise CDF
```

## ✅ Solution Appliquée

### Script SQL: `sql/fix_devise_constraint.sql`

```sql
-- Supprimer l'ancienne contrainte
ALTER TABLE devis DROP CONSTRAINT IF EXISTS devis_devise_check;

-- Ajouter la nouvelle contrainte avec CDF
ALTER TABLE devis ADD CONSTRAINT devis_devise_check 
  CHECK (devise IN ('CDF', 'USD', 'EUR'));

-- Mettre à jour les valeurs existantes
UPDATE devis SET devise = 'CDF' WHERE devise = 'FC';
```

## 🔧 Valeurs de Devise Acceptées

Après correction, les valeurs acceptées sont:

| Code | Devise | Symbole | Utilisation |
|------|--------|---------|-------------|
| CDF | Franc Congolais | FC | Devise locale (par défaut) |
| USD | Dollar Américain | $ | Transactions internationales |
| EUR | Euro | € | Transactions internationales |

## 📝 Affichage dans l'Interface

### Code TypeScript
```typescript
// Sélecteur de devise
<Select value={devise} onValueChange={setDevise}>
  <SelectContent>
    <SelectItem value="CDF">Franc Congolais (FC)</SelectItem>
    <SelectItem value="USD">Dollar US ($)</SelectItem>
    <SelectItem value="EUR">Euro (€)</SelectItem>
  </SelectContent>
</Select>

// Affichage du montant
{montant.toLocaleString()} {devise === 'CDF' ? 'FC' : devise}
```

### Logique d'Affichage
- **Stockage DB:** `'CDF'`, `'USD'`, `'EUR'` (codes ISO)
- **Affichage UI:** `'FC'`, `'$'`, `'€'` (symboles locaux)

## 🚀 Migration des Données Existantes

Si des devis existent déjà avec `devise = 'FC'`:

```sql
-- Vérifier les valeurs actuelles
SELECT devise, COUNT(*) 
FROM devis 
GROUP BY devise;

-- Résultat possible:
-- devise | count
-- -------+-------
-- FC     | 15
-- NULL   | 3

-- Migration automatique dans le script
UPDATE devis SET devise = 'CDF' WHERE devise = 'FC';
UPDATE devis SET devise = 'CDF' WHERE devise IS NULL;
```

## ✅ Checklist de Test

- [ ] Exécuter `sql/fix_devise_constraint.sql`
- [ ] Créer un nouveau devis avec devise CDF
- [ ] Créer un nouveau devis avec devise USD
- [ ] Créer un nouveau devis avec devise EUR
- [ ] Vérifier qu'aucune erreur de contrainte n'apparaît
- [ ] Vérifier l'affichage correct des symboles de devise

## 📄 Fichiers Modifiés

- `sql/fix_devise_constraint.sql` - Script de correction de la contrainte

## 🔍 Vérification Post-Migration

```sql
-- Vérifier la contrainte
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'devis_devise_check';

-- Résultat attendu:
-- constraint_name      | constraint_definition
-- --------------------+------------------------------------------
-- devis_devise_check  | CHECK ((devise = ANY (ARRAY['CDF'::text, 'USD'::text, 'EUR'::text])))

-- Vérifier les valeurs
SELECT DISTINCT devise, COUNT(*) as count
FROM devis
GROUP BY devise
ORDER BY devise;

-- Résultat attendu:
-- devise | count
-- -------+-------
-- CDF    | 18
-- USD    | 2
-- EUR    | 1
```

## 💡 Recommandations

### Standardisation Future
1. **Toujours utiliser les codes ISO 4217** dans la base de données
2. **Convertir pour l'affichage** uniquement dans l'interface
3. **Documenter** les codes utilisés dans le schéma

### Fonction Helper (Optionnel)
```typescript
// utils/currency.ts
export const getCurrencySymbol = (code: string): string => {
  const symbols: Record<string, string> = {
    'CDF': 'FC',
    'USD': '$',
    'EUR': '€',
  };
  return symbols[code] || code;
};

export const formatCurrency = (amount: number, code: string): string => {
  const symbol = getCurrencySymbol(code);
  return `${amount.toLocaleString()} ${symbol}`;
};

// Usage
formatCurrency(1500, 'CDF'); // "1,500 FC"
formatCurrency(100, 'USD');  // "100 $"
```

## ✅ Status

**CORRECTION PRÊTE** - Exécuter le script `sql/fix_devise_constraint.sql` pour résoudre le problème.

## 🎯 Action Immédiate

### Option 1: Script Standard (Recommandé)
```bash
# Dans Supabase SQL Editor
sql/fix_devise_constraint.sql
```

### Option 2: Script Sécurisé avec Diagnostic
Si vous voulez voir un diagnostic détaillé avant la correction:
```bash
# Dans Supabase SQL Editor
sql/fix_devise_constraint_safe.sql
```

## 🔧 Ordre d'Exécution Critique

**IMPORTANT:** L'ordre des opérations est crucial:

1. ✅ **Supprimer la contrainte** (permet les modifications)
2. ✅ **Nettoyer les données** (corriger les valeurs invalides)
3. ✅ **Ajouter la nouvelle contrainte** (avec les bonnes valeurs)

**❌ NE PAS faire dans cet ordre:**
- Ajouter la contrainte AVANT de nettoyer les données → ERREUR!

## 🐛 Résolution de l'Erreur

### Erreur Rencontrée
```
ERROR: 23514: check constraint "devis_devise_check" of relation "devis" 
is violated by some row
```

### Cause
Des lignes existantes ont des valeurs de `devise` qui ne sont pas dans la liste autorisée par la nouvelle contrainte.

### Solution
Le script mis à jour:
1. Supprime d'abord la contrainte existante
2. Nettoie toutes les données invalides
3. Ajoute ensuite la nouvelle contrainte

### Valeurs Possibles dans la DB Actuelle
- `'FC'` → Sera converti en `'CDF'`
- `NULL` → Sera converti en `'CDF'`
- Autres valeurs invalides → Seront converties en `'CDF'`
- `'USD'`, `'EUR'` → Restent inchangés
