# 🔧 Correction - Colonne missions.status

## ❌ Problème

Erreur lors du chargement du profil prestataire:
```
{
  "code": "42703",
  "message": "column missions.statut does not exist",
  "hint": "Perhaps you meant to reference the column \"missions.status\"."
}
```

## 🔍 Cause

Le code utilisait `statut` mais la colonne dans la base de données s'appelle `status`.

## ✅ Solution

### Fichier corrigé: `src/pages/dashboard/prestataire/ProfilPage.tsx`

**Avant:**
```typescript
const { data: missionsData } = await supabase
  .from("missions")
  .select("id")
  .eq("prestataire_id", providerId)
  .eq("statut", "terminee");  // ❌ Mauvais nom de colonne
```

**Après:**
```typescript
const { data: missionsData } = await supabase
  .from("missions")
  .select("id")
  .eq("prestataire_id", providerId)
  .eq("status", "terminee");  // ✅ Bon nom de colonne
```

## 📊 Impact

Cette correction permet de:
- ✅ Charger le profil prestataire sans erreur
- ✅ Afficher le nombre de missions complétées
- ✅ Calculer les statistiques correctement

## 🧪 Test

1. Se connecter en tant que prestataire
2. Aller sur le profil
3. Vérifier que la page se charge sans erreur
4. Vérifier que le nombre de missions s'affiche

## 📝 Note

Les autres tables utilisent bien `statut`:
- ✅ `paiements.statut`
- ✅ `demandes.statut`
- ✅ `devis.statut`

Seule la table `missions` utilise `status`.

## ✅ Résultat

Le profil prestataire se charge maintenant correctement avec toutes les statistiques, y compris le nombre de missions complétées.
