═══════════════════════════════════════════════════════════════════
📚 SYSTÈME DE CONTRATS - GUIDE COMPLET
═══════════════════════════════════════════════════════════════════

🎯 OBJECTIF
-----------
Créer automatiquement un contrat quand un client accepte un devis

═══════════════════════════════════════════════════════════════════
🚀 INSTALLATION RAPIDE (5 MINUTES)
═══════════════════════════════════════════════════════════════════

ÉTAPE 1: Installer le système complet
--------------------------------------
Fichier: CREER_DEVIS_ET_CONTRAT_TEST.sql

Ce script fait TOUT:
✅ Crée un devis de test accepté
✅ Installe le trigger automatique
✅ Configure les permissions RLS
✅ Crée les policies nécessaires

ÉTAPE 2: Vérifier que tout fonctionne
--------------------------------------
Fichier: VERIFIER_SYSTEME_CONTRATS.sql

Ce script affiche:
✅ État du trigger
✅ Policies RLS
✅ Vos devis et contrats
✅ Résumé du système

ÉTAPE 3: Tester dans l'application
-----------------------------------
1. Rafraîchir l'app (F5)
2. Aller sur "Mes Demandes" > "Devis acceptés"
3. Cliquer "Voir le contrat"
4. Signer le contrat
5. Continuer vers le paiement

═══════════════════════════════════════════════════════════════════
🔧 COMMENT ÇA MARCHE
═══════════════════════════════════════════════════════════════════

FLUX AUTOMATIQUE:
-----------------
1. Client accepte un devis
   └─> Statut devis → 'accepte'
   
2. Trigger SQL se déclenche
   └─> Fonction generate_contrat_from_devis()
   └─> Crée un contrat automatiquement
   
3. Contrat créé avec:
   - Numéro unique (CTR-YYYYMMDD-HHMMSS)
   - Contenu HTML généré
   - Conditions de paiement (30/70)
   - Statut 'genere'
   
4. Client peut voir le contrat
   └─> Bouton "Voir le contrat" actif
   └─> Page de signature accessible

FLUX MANUEL (BACKUP):
---------------------
Si le trigger n'a pas fonctionné:

1. Client clique "Voir le contrat"
2. SignerContratPage.tsx détecte l'absence de contrat
3. Appelle createContrat() automatiquement
4. Crée le contrat à la volée
5. Affiche la page de signature

═══════════════════════════════════════════════════════════════════
📁 FICHIERS IMPORTANTS
═══════════════════════════════════════════════════════════════════

INSTALLATION:
- CREER_DEVIS_ET_CONTRAT_TEST.sql ← EXÉCUTER EN PREMIER
- FIX_ACCES_DEVIS_CONTRAT.sql (alternative)
- sql/fix_trigger_contrat_simple.sql (trigger seul)

VÉRIFICATION:
- VERIFIER_SYSTEME_CONTRATS.sql
- DIAGNOSTIC_DEVIS_COMPLET.sql

CODE SOURCE:
- src/pages/dashboard/client/SignerContratPage.tsx (création manuelle)
- src/pages/dashboard/client/AccepterDevisPage.tsx (acceptation)
- src/pages/dashboard/client/DemandesPage.tsx (liste)
- src/pages/dashboard/client/DemandeDetailPage.tsx (détails)

DOCUMENTATION:
- SOLUTION_FINALE_SIMPLE.txt ← LIRE EN PREMIER
- ETAT_ACTUEL_CONTRATS.txt
- DEBUG_ERREUR_PGRST116.txt

═══════════════════════════════════════════════════════════════════
🐛 DÉPANNAGE
═══════════════════════════════════════════════════════════════════

PROBLÈME: "Devis introuvable"
CAUSE: Permissions RLS bloquent l'accès
SOLUTION: Exécuter CREER_DEVIS_ET_CONTRAT_TEST.sql

PROBLÈME: "Cannot coerce result to single JSON object"
CAUSE: Requête avec .single() au lieu de .maybeSingle()
SOLUTION: Code déjà corrigé dans SignerContratPage.tsx

PROBLÈME: Pas de contrat créé après acceptation
CAUSE: Trigger pas installé
SOLUTION: Exécuter CREER_DEVIS_ET_CONTRAT_TEST.sql

PROBLÈME: Bouton "Voir le contrat" invisible
CAUSE: Devis pas en statut 'accepte'
SOLUTION: Vérifier le statut du devis dans Supabase

═══════════════════════════════════════════════════════════════════
✅ CHECKLIST DE VÉRIFICATION
═══════════════════════════════════════════════════════════════════

☐ Script CREER_DEVIS_ET_CONTRAT_TEST.sql exécuté
☐ Trigger visible dans VERIFIER_SYSTEME_CONTRATS.sql
☐ Policies RLS créées
☐ Devis de test visible dans l'app
☐ Bouton "Voir le contrat" cliquable
☐ Page de signature s'affiche
☐ Zone de signature fonctionne
☐ Signature enregistrée
☐ Redirection vers paiement

═══════════════════════════════════════════════════════════════════
📞 SUPPORT
═══════════════════════════════════════════════════════════════════

Si un problème persiste:
1. Exécutez VERIFIER_SYSTEME_CONTRATS.sql
2. Copiez les résultats
3. Partagez-les avec le message d'erreur exact

═══════════════════════════════════════════════════════════════════
🎉 PROCHAINES ÉTAPES
═══════════════════════════════════════════════════════════════════

Une fois les contrats fonctionnels:
1. Tester le paiement de l'acompte
2. Tester la signature du prestataire
3. Tester le paiement du solde
4. Tester la validation de mission

═══════════════════════════════════════════════════════════════════
