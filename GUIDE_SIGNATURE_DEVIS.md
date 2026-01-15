# 📝 Guide: Ajouter votre signature sur les devis

## 🎯 Objectif
Votre signature apparaîtra automatiquement sur tous vos devis PDF, donnant un aspect professionnel et officiel à vos documents.

## 📋 Étapes à suivre

### Étape 1: Exécuter le script SQL
**IMPORTANT**: Avant de pouvoir utiliser cette fonctionnalité, vous devez exécuter le script SQL.

1. Ouvrez Supabase Dashboard
2. Allez dans **SQL Editor**
3. Ouvrez le fichier `sql/add_signature_column.sql`
4. Copiez tout le contenu
5. Collez dans l'éditeur SQL de Supabase
6. Cliquez sur **Run** (Exécuter)

### Étape 2: Préparer votre signature
**Format recommandé**:
- Image PNG avec fond transparent
- Dimensions: 300-600px de largeur × 100-200px de hauteur
- Taille: Maximum 1MB
- Signature manuscrite scannée ou signature numérique

**Comment créer une signature**:
- **Option 1**: Signez sur papier blanc, scannez, et utilisez un outil en ligne pour retirer le fond blanc
- **Option 2**: Utilisez une tablette graphique pour créer une signature numérique
- **Option 3**: Utilisez un outil en ligne comme "Signature Maker" pour créer une signature

### Étape 3: Télécharger votre signature dans KaziPro

1. Connectez-vous à votre compte prestataire
2. Allez dans **Paramètres** (menu de gauche)
3. Restez sur l'onglet **Entreprise** (par défaut)
4. Faites défiler jusqu'à voir:
   - Section "Logo de l'entreprise"
   - Section "Signature du prestataire" (juste en dessous)
5. Dans la section "Signature du prestataire":
   - Cliquez sur **"Télécharger une signature"**
   - Sélectionnez votre fichier image
   - Attendez que le téléchargement se termine
   - Vous verrez une prévisualisation de votre signature
6. Faites défiler en bas de la page
7. Cliquez sur **"Enregistrer"**

### Étape 4: Vérifier sur un devis

1. Allez dans **Mes Devis**
2. Sélectionnez un devis existant (ou créez-en un nouveau)
3. Cliquez sur **"PDF"** pour télécharger le devis en PDF
4. Ouvrez le PDF
5. Faites défiler jusqu'en bas
6. Vous devriez voir votre signature dans la section "Le Prestataire"

## 📄 Où apparaît la signature?

Sur le PDF du devis, votre signature apparaît:
- **Section**: "Signatures" (en bas du document)
- **Colonne**: "Le Prestataire" (colonne de gauche)
- **Position**: Au-dessus de la ligne "Signature et cachet"
- **Taille**: Environ 150px de largeur, 60px de hauteur

## ✨ Exemple de rendu

```
┌─────────────────────────────────────────────────────────┐
│                    VOTRE DEVIS                          │
│  [Logo]  Nom de votre entreprise                        │
│          Adresse, Téléphone, Email                      │
├─────────────────────────────────────────────────────────┤
│  Détails du devis...                                    │
│  Articles, prix, totaux...                              │
├─────────────────────────────────────────────────────────┤
│  SIGNATURES                                             │
│                                                         │
│  Le Prestataire          │  Le Client                  │
│  [Votre signature]       │                             │
│  ___________________     │  ___________________        │
│  Signature et cachet     │  Bon pour accord           │
└─────────────────────────────────────────────────────────┘
```

## 🔄 Modifier votre signature

Pour changer votre signature:
1. Retournez dans **Paramètres** → **Entreprise**
2. Cliquez à nouveau sur **"Télécharger une signature"**
3. Sélectionnez une nouvelle image (elle remplacera l'ancienne)
4. Cliquez sur **"Enregistrer"**

## ❓ Questions fréquentes

**Q: Ma signature apparaît-elle sur les anciens devis?**
R: Oui! Quand vous téléchargez un PDF (même d'un ancien devis), il utilise votre signature actuelle.

**Q: Que se passe-t-il si je n'ai pas de signature?**
R: Le PDF sera généré normalement, mais l'espace de signature restera vide.

**Q: Puis-je utiliser une image avec fond blanc?**
R: Oui, mais un fond transparent (PNG) donne un meilleur rendu professionnel.

**Q: La signature est-elle obligatoire?**
R: Non, c'est optionnel. Mais c'est fortement recommandé pour un aspect professionnel.

**Q: Puis-je avoir une signature différente pour chaque devis?**
R: Non, la même signature est utilisée pour tous vos devis. C'est votre signature d'entreprise.

## 🎨 Conseils pour une belle signature

1. **Contraste**: Utilisez une signature noire ou bleu foncé sur fond transparent
2. **Taille**: Pas trop petite (illisible) ni trop grande (disproportionnée)
3. **Qualité**: Utilisez une image haute résolution pour éviter le flou
4. **Simplicité**: Une signature claire et lisible est plus professionnelle
5. **Cohérence**: Utilisez la même signature que sur vos documents officiels

## 🚀 Prêt à commencer?

1. ✅ Exécutez le script SQL
2. ✅ Préparez votre image de signature
3. ✅ Téléchargez-la dans Paramètres
4. ✅ Générez un devis PDF pour voir le résultat

---
**Besoin d'aide?** Consultez `SIGNATURE_FEATURE_COMPLETE.md` pour les détails techniques.
