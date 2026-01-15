# 🚨 URGENT: Corriger les Missions Manquantes

## LE PROBLÈME

Tu as des demandes avec `status: "in_progress"` et `devis_accepte_id` rempli, **MAIS aucune mission créée**.

Résultat: Les prestataires ne voient pas leurs missions dans la page "Missions".

---

## LA SOLUTION (1 SCRIPT)

Exécute ce script dans Supabase SQL Editor:

**Fichier**: `sql/fix_missions_complete.sql`

Ce script va:
1. ✅ Ajouter la colonne `demande_id` à la table `missions`
2. ✅ Créer toutes les missions manquantes
3. ✅ Installer un trigger pour auto-créer les missions à l'avenir
4. ✅ Afficher un résumé des missions créées

---

## COMMENT EXÉCUTER

### Dans Supabase:

1. Va sur https://supabase.com/dashboard
2. Sélectionne ton projet
3. Clique sur "SQL Editor" dans le menu gauche
4. Clique sur "New query"
5. Copie-colle le contenu de `sql/fix_missions_complete.sql`
6. Clique sur "Run"

---

## VÉRIFICATION

Après exécution, tu devrais voir:

```
✅ Colonne demande_id ajoutée à missions
✅ demande_id rempli pour les missions existantes
✅ Foreign key ajoutée
✅ Index créé sur demande_id
✅ X missions créées/vérifiées
✅ Fonction create_mission_on_devis_accept créée
✅ Trigger installé sur table devis
✅ Trigger de synchronisation installé

🎉 SUCCÈS! Missions corrigées
```

Et un tableau avec les missions créées.

---

## TEST

1. **Login en tant que prestataire**
2. **Va sur la page "Missions"**
3. **Vérifie que les missions apparaissent maintenant**

Les missions avec `status: "in_progress"` devraient être visibles!

---

## CE QUI SE PASSE MAINTENANT

À l'avenir, quand un client accepte un devis:

```
Client clique "Accepter ce devis"
         ↓
1. Devis.statut = 'accepte'
2. Demande.status = 'in_progress'
3. Mission créée AUTOMATIQUEMENT ✨ (nouveau!)
         ↓
Prestataire voit la mission immédiatement
```

---

## FICHIERS CRÉÉS

- `sql/fix_missions_complete.sql` - Script tout-en-un (EXÉCUTE CELUI-CI)
- `sql/create_missing_missions.sql` - Crée missions manquantes seulement
- `sql/auto_create_mission_on_devis_accept.sql` - Trigger seulement
- `FIX_MISSING_MISSIONS.md` - Documentation complète

---

## BESOIN D'AIDE?

Si tu as des erreurs, envoie-moi le message d'erreur et je t'aiderai!
