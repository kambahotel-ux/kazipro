# ✅ Erreur colonne phone corrigée

## Problème
```
{"code": "42703","message": "column clients_1.phone does not exist"}
```

## Cause
La table `clients` n'a pas de colonnes `phone` et `email` par défaut. La requête essayait de récupérer ces colonnes qui n'existent pas.

## Solution appliquée

### 1. Requête corrigée
**Avant**:
```typescript
clients:client_id (
  full_name,
  phone,    // ❌ N'existe pas
  email     // ❌ N'existe pas
)
```

**Après**:
```typescript
clients:client_id (
  full_name  // ✅ Existe
)
```

### 2. PDF simplifié
**Avant**:
```html
<div>${devis.client_name || 'À compléter'}</div>
<div>Tél: ${devis.client_phone}</div>
<div>Email: ${devis.client_email}</div>
```

**Après**:
```html
<div>${devis.client_name || 'À compléter'}</div>
```

## Résultat

Le PDF affiche maintenant:
- ✅ Nom du client (si devis lié à une demande)
- ✅ "À compléter" (si devis manuel)

## Structure de la table clients

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Colonnes disponibles**: `full_name`, `address`, `city`, `verified`
**Colonnes manquantes**: `phone`, `email`

## Note

Si vous souhaitez ajouter les colonnes `phone` et `email` à la table `clients`, vous pouvez exécuter:

```sql
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;
```

Puis mettre à jour le code pour les afficher sur le PDF.

## Fichier modifié

- ✅ `src/pages/dashboard/prestataire/DevisPage.tsx`
  - Requête corrigée (seulement `full_name`)
  - PDF simplifié (seulement nom du client)

---
**Statut**: ✅ CORRIGÉ
**Erreur résolue**: ✅
**Fonctionne maintenant**: ✅
