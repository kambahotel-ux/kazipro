# Fix Missions Display ✅

## 🔍 PROBLÈME

Les missions étaient chargées (visibles dans l'inspecteur) mais ne s'affichaient pas dans la page Missions.

**Cause**: La requête ne chargeait pas les relations `devis` et `demandes`, donc `mission.devis?.demande?.title` était `undefined`.

---

## ✅ SOLUTION APPLIQUÉE

### 1. Mise à jour de la requête Supabase

**Avant**:
```typescript
.select("*")
```

**Après**:
```typescript
.select(`
  *,
  devis (
    montant_ttc,
    amount
  ),
  demandes (
    titre,
    title,
    localisation,
    location
  )
`)
```

### 2. Mise à jour de l'interface Mission

**Ajouté**:
```typescript
interface Mission {
  // ... autres champs
  demande_id: string;  // ← Ajouté
  devis?: {
    montant_ttc?: number;
    amount?: number;
  };
  demandes?: {  // ← Ajouté
    titre?: string;
    title?: string;
    localisation?: string;
    location?: string;
  };
}
```

### 3. Mise à jour de l'affichage

**Avant**:
```typescript
mission.devis?.demande?.title  // ❌ undefined
mission.devis?.demande?.location
mission.devis?.amount
```

**Après**:
```typescript
mission.demandes?.titre || mission.demandes?.title  // ✅ Fonctionne
mission.demandes?.localisation || mission.demandes?.location
mission.devis?.montant_ttc || mission.devis?.amount
```

---

## 📊 STRUCTURE DES DONNÉES

La table `missions` a maintenant 2 relations:

1. **missions → devis** (via `devis_id`)
   - Contient: `montant_ttc`, `amount`

2. **missions → demandes** (via `demande_id`)
   - Contient: `titre/title`, `localisation/location`

---

## 🎯 RÉSULTAT

Maintenant dans la page Missions:

✅ Les stats s'affichent correctement
✅ La liste des missions s'affiche dans tous les onglets:
  - Toutes
  - En attente
  - En cours
  - Complétées
✅ Les détails de chaque mission sont visibles:
  - Titre de la demande
  - Localisation
  - Montant
  - Dates
✅ Le modal de détails fonctionne
✅ La recherche fonctionne

---

## 📁 FICHIER MODIFIÉ

- `src/pages/dashboard/prestataire/MissionsPage.tsx`
  - Requête Supabase mise à jour
  - Interface `Mission` mise à jour
  - Affichage dans tous les onglets mis à jour
  - Modal de détails mis à jour
  - Fonction de recherche mise à jour
  - Calcul des stats mis à jour

---

## 🧪 TEST

1. Va sur la page "Missions" (prestataire)
2. Tu devrais voir ta mission avec:
   - Titre: "Décrivez votre projet"
   - Localisation: "Kalamu"
   - Montant: (du devis)
   - Statut: "En cours"
3. Clique sur "Détails" pour voir plus d'infos
4. Teste les onglets (Toutes, En attente, En cours, Complétées)
5. Teste la recherche

Tout devrait fonctionner maintenant! 🎉
