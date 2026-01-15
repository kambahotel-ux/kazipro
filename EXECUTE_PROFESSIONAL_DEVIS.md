# Guide d'Exécution - Système de Devis Professionnel

## ✅ Ce qui a été fait

### 1. Base de données
- ✅ Script SQL créé: `sql/create_professional_devis_system.sql`
- ✅ Table `entreprise_info` pour les infos d'entreprise
- ✅ Table `devis_negotiations` pour les négociations
- ✅ Colonnes ajoutées à `devis` (statut_negociation, version, devis_parent_id)
- ✅ Storage bucket `company-logos` pour les logos
- ✅ Policies RLS configurées

### 2. Interface Prestataire
- ✅ Onglet "Entreprise" ajouté dans ParametresPage
- ✅ Formulaire complet pour les infos d'entreprise
- ✅ Upload de logo avec prévisualisation
- ✅ Sauvegarde des données dans Supabase
- ✅ Composant Textarea créé

## 🚀 Prochaines étapes

### Étape 1: Exécuter le script SQL
```bash
# Allez dans Supabase Dashboard > SQL Editor
# Copiez et exécutez le contenu de:
sql/create_professional_devis_system.sql
```

### Étape 2: Tester le profil entreprise
1. Connectez-vous en tant que prestataire
2. Allez dans Paramètres > Entreprise
3. Remplissez les informations:
   - Nom de l'entreprise (obligatoire)
   - Logo (optionnel)
   - Adresse, ville
   - Téléphone, email professionnel
   - Numéro fiscal (optionnel)
   - Conditions générales (optionnel)
4. Cliquez sur "Enregistrer"

### Étape 3: Vérifier dans Supabase
```sql
-- Vérifier que les données sont enregistrées
SELECT * FROM entreprise_info;

-- Vérifier le storage bucket
SELECT * FROM storage.objects WHERE bucket_id = 'company-logos';
```

## 📋 Fonctionnalités implémentées

### Phase 1: Profil Entreprise ✅
- [x] Table entreprise_info créée
- [x] Storage bucket pour logos
- [x] Interface de saisie des infos
- [x] Upload de logo
- [x] Prévisualisation du logo
- [x] Sauvegarde/mise à jour des données
- [x] RLS policies

### Phase 2: Génération PDF (À venir)
- [ ] Installer bibliothèque PDF (@react-pdf/renderer)
- [ ] Créer template de devis professionnel
- [ ] Intégrer logo et infos entreprise
- [ ] Ajouter footer KaziPro
- [ ] Bouton de téléchargement PDF

### Phase 3: Négociation Client (À venir)
- [ ] Interface de contre-proposition
- [ ] Modal de négociation
- [ ] Historique des échanges
- [ ] Notifications

### Phase 4: Modification Prestataire (À venir)
- [ ] Interface de gestion des négociations
- [ ] Accepter/refuser/modifier devis
- [ ] Mise à jour des montants
- [ ] Notifications

## 🎯 Résultat attendu

Après l'exécution du SQL et le test:
1. Les prestataires peuvent configurer leur profil entreprise
2. Le logo est uploadé et stocké dans Supabase Storage
3. Les informations sont sauvegardées dans la table entreprise_info
4. Les données sont protégées par RLS (seul le prestataire peut voir/modifier ses infos)
5. Les clients peuvent voir les infos entreprise des prestataires qui leur envoient des devis

## ⚠️ Notes importantes

- Le nom de l'entreprise est obligatoire
- Le logo est optionnel mais recommandé
- Les infos seront utilisées pour générer les PDF de devis
- KaziPro apparaîtra en footer, pas en header
- Le logo du prestataire sera le logo principal du devis

## 🐛 Dépannage

### Erreur "permission denied for table entreprise_info"
→ Vérifiez que les policies RLS sont bien créées

### Erreur lors de l'upload du logo
→ Vérifiez que le bucket 'company-logos' existe et que les policies storage sont créées

### Les données ne se sauvegardent pas
→ Vérifiez que le prestataire_id est bien récupéré
→ Vérifiez les logs dans la console du navigateur

## 📞 Support

Si vous rencontrez des problèmes:
1. Vérifiez les logs dans la console du navigateur (F12)
2. Vérifiez les erreurs dans Supabase Dashboard > Logs
3. Testez les requêtes SQL manuellement dans SQL Editor
