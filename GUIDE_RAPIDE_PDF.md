# 🚀 Guide Rapide - PDF Professionnel

## Question: Quand je crée un devis, mes infos apparaissent sur le PDF?

**Réponse: OUI! Automatiquement!** ✅

## Comment ça marche?

### 1️⃣ Vous configurez votre entreprise (1 fois)
```
Paramètres > Entreprise
├── Nom entreprise: "SARL TechServices Congo"
├── Logo: [Votre logo.png]
├── Adresse: "123 Avenue de la Liberté"
├── Ville: "Kinshasa"
├── Téléphone: "+243 812 345 678"
├── Email: "contact@techservices.cd"
└── RCCM: "CD/KIN/RCCM/12-345"
```

### 2️⃣ Vous créez un devis normalement
```
Opportunités > Créer un devis
├── Items/Services
├── Prix
├── Conditions
└── Enregistrer
```

### 3️⃣ Vous cliquez sur "Télécharger PDF"
```
[Bouton: Télécharger PDF] 
    ↓
Le système récupère automatiquement:
├── ✅ Vos infos entreprise (nom, logo, adresse...)
├── ✅ Les infos du devis (items, prix...)
├── ✅ Les infos du client
└── ✅ Génère le PDF professionnel
```

## 📄 Ce qui apparaît sur le PDF

```
╔═══════════════════════════════════════════════╗
║  [VOTRE LOGO]    SARL TECHSERVICES CONGO     ║
║                  123 Avenue de la Liberté    ║
║                  Kinshasa                    ║
║                  Tél: +243 812 345 678       ║
║                  Email: contact@tech.cd      ║
║                  RCCM: CD/KIN/RCCM/12-345    ║
╠═══════════════════════════════════════════════╣
║                   DEVIS                       ║
╠═══════════════════════════════════════════════╣
║  Devis N°: DEV-2024-001                      ║
║  Date: 05/01/2026                            ║
║  Client: Jean Dupont                         ║
╠═══════════════════════════════════════════════╣
║  Description         Qté   P.U.    Montant   ║
║  ─────────────────────────────────────────   ║
║  Installation élec.   1   500,000  500,000   ║
║  Tableau électrique   2   150,000  300,000   ║
╠═══════════════════════════════════════════════╣
║                  Sous-total HT: 800,000 FC   ║
║                  TVA (16%):     128,000 FC   ║
║                  TOTAL TTC:     928,000 FC   ║
╠═══════════════════════════════════════════════╣
║  Conditions:                                  ║
║  • Délai: 15 jours                           ║
║  • Paiement: 50% à la commande               ║
╚═══════════════════════════════════════════════╝
   Généré via KaziPro - www.kazipro.cd
```

## ✅ Avantages

### Votre logo en haut ✅
Pas le logo KaziPro! C'est VOTRE logo qui apparaît en grand.

### Vos informations complètes ✅
Nom, adresse, téléphone, email, RCCM - tout est là!

### KaziPro en bas ✅
Juste une petite signature discrète en footer.

### Professionnel ✅
Le PDF ressemble à un vrai document d'entreprise.

## 🎯 Exemple concret

**Avant (sans le système):**
- Devis basique
- Pas de logo
- Pas d'infos entreprise
- Pas professionnel

**Après (avec le système):**
- PDF professionnel
- Votre logo en haut
- Toutes vos infos
- Signature KaziPro discrète
- Prêt à envoyer au client

## 🚀 Installation rapide

### Étape 1: SQL (2 minutes)
```sql
-- Dans Supabase SQL Editor
-- Copier et exécuter: sql/create_professional_devis_system.sql
```

### Étape 2: Configurer entreprise (3 minutes)
```
1. Se connecter en tant que prestataire
2. Paramètres > Entreprise
3. Remplir les infos
4. Uploader le logo
5. Enregistrer
```

### Étape 3: Utiliser (1 clic!)
```
1. Créer un devis
2. Cliquer sur "Télécharger PDF"
3. C'est tout! 🎉
```

## 💡 Questions fréquentes

### Q: Je dois configurer à chaque fois?
**R:** Non! Une seule fois. Après, c'est automatique.

### Q: Le logo KaziPro apparaît en grand?
**R:** Non! Votre logo est en grand. KaziPro est juste en footer.

### Q: Je peux modifier mes infos?
**R:** Oui! Paramètres > Entreprise > Modifier > Enregistrer

### Q: Ça marche sans logo?
**R:** Oui! Mais c'est plus professionnel avec un logo.

### Q: Le client voit mes infos?
**R:** Oui! C'est le but. Le PDF est pour le client.

### Q: Je peux envoyer le PDF au client?
**R:** Oui! Téléchargez et envoyez par email/WhatsApp.

## 📊 Résumé

```
Vous configurez (1 fois)
    ↓
Vous créez des devis (normalement)
    ↓
Vous cliquez "Télécharger PDF"
    ↓
PDF professionnel avec VOS infos!
    ↓
Vous envoyez au client
    ↓
Client impressionné! 🎉
```

## 🎉 C'est tout!

**Simple, automatique, professionnel!**

Vos informations d'entreprise apparaissent automatiquement sur tous vos devis PDF. Plus besoin de créer des documents manuellement!

---

**Fichiers importants:**
- SQL: `sql/create_professional_devis_system.sql`
- Composant: `src/components/devis/GeneratePDFButton.tsx`
- Guide complet: `COMMENT_UTILISER_PDF.md`
