# ✅ Correction appliquée!

## Problème
Vos infos d'entreprise (Naara, adresse, téléphone, etc.) n'apparaissaient pas sur le PDF. C'était "KAZIPRO" qui s'affichait.

## Solution
J'ai modifié le code pour récupérer et afficher VOS informations d'entreprise au lieu de KAZIPRO.

## Résultat

### Avant:
```
KAZIPRO
Plateforme de Services Professionnels
Kinshasa, RDC
contact@kazipro.com
```

### Maintenant:
```
Naara
okapi 1244b
kinshasa
Tél: 0987656786
Email: naarateam@gmaill.com
RCCM: CD/KIN/RCCM/74-954
```

## Test

1. Allez dans Devis
2. Cliquez "Télécharger PDF"
3. Ouvrez le PDF
4. Vous verrez "Naara" en haut, pas "KAZIPRO"!

## KaziPro?

KaziPro apparaît maintenant en **petit** en bas de page:
```
Généré via KaziPro - Plateforme de mise en relation professionnelle
```

C'est discret et professionnel!

## Fichier modifié

- `src/pages/dashboard/prestataire/DevisPage.tsx`

## ✅ C'est prêt!

Testez maintenant et vous verrez vos informations sur le PDF! 🎉
