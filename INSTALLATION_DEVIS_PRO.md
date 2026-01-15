# 🚀 Installation Rapide - Système de Devis Professionnel

## Étape 1: Exécuter le SQL (5 minutes)

### Dans Supabase Dashboard

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor** dans le menu de gauche
4. Cliquez sur **New Query**
5. Copiez tout le contenu du fichier `sql/create_professional_devis_system.sql`
6. Collez-le dans l'éditeur
7. Cliquez sur **Run** (ou Ctrl+Enter)

### Vérification

Vous devriez voir:
```
Success. No rows returned
```

Si vous voyez des erreurs, vérifiez que:
- Les tables `prestataires` et `devis` existent déjà
- La fonction `update_updated_at_column()` existe

## Étape 2: Tester le profil entreprise (2 minutes)

### Dans l'application

1. **Connectez-vous** en tant que prestataire
2. Allez dans **Paramètres** (menu de gauche)
3. Cliquez sur l'onglet **Entreprise** (premier onglet)
4. Remplissez les informations:
   ```
   Nom de l'entreprise: SARL TechServices Congo
   Adresse: 123 Avenue de la Liberté
   Ville: Kinshasa
   Téléphone: +243 812 345 678
   Email: contact@techservices.cd
   ```
5. (Optionnel) Uploadez un logo
6. Cliquez sur **Enregistrer**

### Vérification

Vous devriez voir:
- ✅ Message "Informations enregistrées avec succès"
- ✅ Le logo s'affiche dans la prévisualisation
- ✅ Les données sont sauvegardées

## Étape 3: Vérifier dans Supabase (1 minute)

### Dans SQL Editor

```sql
-- Vérifier les données entreprise
SELECT * FROM entreprise_info;

-- Vérifier le logo uploadé
SELECT * FROM storage.objects WHERE bucket_id = 'company-logos';
```

Vous devriez voir:
- Une ligne dans `entreprise_info` avec vos données
- Une ligne dans `storage.objects` si vous avez uploadé un logo

## Étape 4: Tester la génération PDF (3 minutes)

### Ajouter un bouton de test

Dans n'importe quelle page prestataire, ajoutez temporairement:

```typescript
import { generateDevisPDF } from '@/lib/pdf-generator';

// Dans votre composant
const testPDF = async () => {
  await generateDevisPDF({
    numero: 'DEV-2024-001',
    date: new Date().toLocaleDateString('fr-FR'),
    entreprise: {
      nom_entreprise: 'SARL TechServices Congo',
      adresse: '123 Avenue de la Liberté',
      ville: 'Kinshasa',
      telephone: '+243 812 345 678',
      email_professionnel: 'contact@techservices.cd',
      numero_fiscal: 'CD/KIN/RCCM/12-345',
      conditions_generales: 'Paiement à 30 jours. Garantie 6 mois.'
    },
    client: {
      nom: 'Jean Dupont',
      adresse: '456 Boulevard du Commerce',
      ville: 'Kinshasa'
    },
    items: [
      {
        description: 'Installation électrique complète',
        quantite: 1,
        prix_unitaire: 500000,
        montant: 500000
      },
      {
        description: 'Tableau électrique',
        quantite: 2,
        prix_unitaire: 150000,
        montant: 300000
      }
    ],
    montant_ht: 800000,
    tva: 16,
    montant_ttc: 928000,
    devise: 'FC',
    delai_execution: '15 jours ouvrables',
    conditions_paiement: '50% à la commande, 50% à la livraison'
  });
};

// Bouton
<Button onClick={testPDF}>
  <Download className="w-4 h-4 mr-2" />
  Test PDF
</Button>
```

### Vérification

Cliquez sur le bouton, un PDF devrait se télécharger avec:
- ✅ Header avec infos entreprise
- ✅ Titre "DEVIS" en bleu
- ✅ Infos client
- ✅ Tableau des items
- ✅ Totaux (HT, TVA, TTC)
- ✅ Conditions
- ✅ Footer KaziPro

## ✅ Checklist de validation

- [ ] SQL exécuté sans erreur
- [ ] Table `entreprise_info` créée
- [ ] Table `devis_negotiations` créée
- [ ] Bucket `company-logos` créé
- [ ] Onglet "Entreprise" visible dans Paramètres
- [ ] Formulaire entreprise fonctionne
- [ ] Upload de logo fonctionne
- [ ] Données sauvegardées dans Supabase
- [ ] PDF se génère correctement
- [ ] PDF contient toutes les informations
- [ ] Footer KaziPro présent

## 🐛 Dépannage

### Erreur "permission denied for table entreprise_info"
**Solution:** Vérifiez que les policies RLS sont créées
```sql
SELECT * FROM pg_policies WHERE tablename = 'entreprise_info';
```

### Erreur "bucket company-logos does not exist"
**Solution:** Créez le bucket manuellement
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-logos', 'company-logos', true);
```

### Le logo ne s'upload pas
**Solution:** Vérifiez les policies storage
```sql
SELECT * FROM storage.policies WHERE bucket_id = 'company-logos';
```

### Le PDF ne se génère pas
**Solution:** Vérifiez la console du navigateur (F12)
- Erreur jsPDF? → Vérifiez que la bibliothèque est installée
- Erreur de données? → Vérifiez que toutes les données requises sont présentes

### Les données ne se sauvegardent pas
**Solution:** Ouvrez la console (F12) et regardez les erreurs
- Erreur 401? → Problème d'authentification
- Erreur 403? → Problème de permissions RLS
- Erreur 500? → Problème serveur Supabase

## 📞 Support

Si vous rencontrez des problèmes:

1. **Vérifiez les logs**
   - Console navigateur (F12)
   - Supabase Dashboard > Logs

2. **Testez les requêtes SQL**
   - SQL Editor > Testez manuellement les INSERT/SELECT

3. **Vérifiez les permissions**
   - RLS policies
   - Storage policies

## 🎉 Félicitations!

Si tous les tests passent, vous avez maintenant:
- ✅ Un système de profil entreprise fonctionnel
- ✅ Un générateur de PDF professionnel
- ✅ Une base solide pour la négociation de devis

**Prochaines étapes:**
1. Intégrer le bouton PDF dans les pages de devis existantes
2. Implémenter la négociation client
3. Implémenter la réponse prestataire

## 📚 Documentation

- Spec complète: `.kiro/specs/professional-devis-system.md`
- Implémentation: `DEVIS_PROFESSIONNEL_IMPLEMENTATION.md`
- Guide d'exécution: `EXECUTE_PROFESSIONAL_DEVIS.md`
