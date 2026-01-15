# 📄 Comment utiliser le système de PDF professionnel

## 🎯 Fonctionnement

Quand un prestataire crée un devis, il peut générer un PDF professionnel qui contient:

### ✅ Informations de l'entreprise du prestataire
- Logo de l'entreprise (en haut à gauche)
- Nom de l'entreprise
- Adresse complète
- Téléphone professionnel
- Email professionnel
- Numéro RCCM/Fiscal

### ✅ Informations du devis
- Numéro du devis
- Date
- Informations du client
- Liste détaillée des items/services
- Calculs (HT, TVA, TTC)
- Conditions de paiement
- Délai d'exécution

### ✅ Signature KaziPro
- En bas de page (footer)
- Discret et professionnel
- "Généré via KaziPro - Plateforme de mise en relation professionnelle"

## 🚀 Utilisation en 3 étapes

### Étape 1: Configurer votre entreprise (une seule fois)

1. Connectez-vous en tant que prestataire
2. Allez dans **Paramètres** (menu de gauche)
3. Cliquez sur l'onglet **Entreprise**
4. Remplissez vos informations:
   - Nom de l'entreprise (obligatoire)
   - Logo (recommandé)
   - Adresse, ville
   - Téléphone, email professionnel
   - Numéro RCCM (optionnel)
   - Conditions générales (optionnel)
5. Cliquez sur **Enregistrer**

### Étape 2: Créer un devis normalement

1. Allez dans **Opportunités**
2. Cliquez sur une demande
3. Créez votre devis avec les items
4. Enregistrez le devis

### Étape 3: Générer le PDF

1. Dans la liste de vos devis
2. Cliquez sur le bouton **"Télécharger PDF"**
3. Le PDF se génère automatiquement avec:
   - Votre logo et infos entreprise
   - Les détails du devis
   - Le footer KaziPro

## 💡 Exemple d'utilisation dans le code

### Dans n'importe quelle page de devis:

```typescript
import { GeneratePDFButton } from '@/components/devis/GeneratePDFButton';

// Dans votre composant
<GeneratePDFButton
  devisId={devis.id}
  devisNumero={devis.numero}
  prestataireId={devis.prestataire_id}
  clientId={devis.client_id}
  items={devis.items}
  montantHT={devis.montant_ht}
  tva={devis.tva}
  montantTTC={devis.montant_ttc}
  devise={devis.devise || 'FC'}
  delaiExecution={devis.delai_execution}
  conditionsPaiement={devis.conditions_paiement}
/>
```

### Exemple complet dans DevisPage.tsx:

```typescript
// Dans la liste des devis, pour chaque devis:
<div className="flex gap-2">
  <Button variant="outline" onClick={() => viewDevis(devis.id)}>
    Voir
  </Button>
  
  <GeneratePDFButton
    devisId={devis.id}
    devisNumero={devis.numero}
    prestataireId={devis.prestataire_id}
    clientId={devis.client_id}
    items={devis.items || []}
    montantHT={devis.montant_ht}
    tva={devis.tva}
    montantTTC={devis.montant_ttc}
    devise={devis.devise || 'FC'}
    delaiExecution={devis.delai_execution}
    conditionsPaiement={devis.conditions_paiement}
    variant="outline"
    size="sm"
  />
</div>
```

## 📋 Ce qui apparaît sur le PDF

### En-tête (Header)
```
┌─────────────────────────────────────────────────┐
│  [VOTRE LOGO]        NOM DE VOTRE ENTREPRISE    │
│                      123 Avenue de la Liberté   │
│                      Kinshasa                   │
│                      Tél: +243 812 345 678      │
│                      Email: contact@vous.cd     │
│                      RCCM: CD/KIN/RCCM/12-345   │
└─────────────────────────────────────────────────┘
```

### Corps du document
```
┌─────────────────────────────────────────────────┐
│                    DEVIS                        │
├─────────────────────────────────────────────────┤
│ Devis N°: DEV-2024-001    Client: Jean Dupont  │
│ Date: 05/01/2026          Adresse: ...         │
├─────────────────────────────────────────────────┤
│ Description      Qté    P.U.        Montant    │
├─────────────────────────────────────────────────┤
│ Service 1         1    100,000     100,000 FC  │
│ Service 2         2     50,000     100,000 FC  │
├─────────────────────────────────────────────────┤
│                    Sous-total HT: 200,000 FC   │
│                    TVA (16%):      32,000 FC   │
│                    TOTAL TTC:     232,000 FC   │
├─────────────────────────────────────────────────┤
│ Conditions:                                     │
│ • Délai d'exécution: 15 jours                  │
│ • Conditions de paiement: 50% à la commande    │
│ • Vos conditions générales...                  │
└─────────────────────────────────────────────────┘
```

### Footer (Bas de page)
```
─────────────────────────────────────────────────
  Généré via KaziPro - Plateforme de mise en 
  relation professionnelle
  www.kazipro.cd
```

## ⚙️ Configuration avancée

### Si vous n'avez pas configuré votre entreprise

Le PDF utilisera automatiquement:
- Votre nom de prestataire comme nom d'entreprise
- Pas de logo
- Pas d'adresse/téléphone
- Juste les infos du devis

**Recommandation:** Configurez votre profil entreprise pour un rendu professionnel!

### Personnalisation du bouton

```typescript
// Bouton par défaut
<GeneratePDFButton {...props} />

// Bouton petit
<GeneratePDFButton {...props} size="sm" />

// Bouton ghost
<GeneratePDFButton {...props} variant="ghost" />

// Bouton primaire
<GeneratePDFButton {...props} variant="default" />
```

## 🎨 Avantages

### Pour vous (prestataire)
- ✅ Image professionnelle
- ✅ Votre branding sur tous les devis
- ✅ Génération automatique
- ✅ Pas besoin de logiciel externe
- ✅ Toujours à jour avec vos infos

### Pour vos clients
- ✅ Devis clair et professionnel
- ✅ Toutes les informations nécessaires
- ✅ PDF téléchargeable
- ✅ Facile à partager/imprimer

### Pour KaziPro
- ✅ Visibilité de la plateforme
- ✅ Professionnalisation du service
- ✅ Signature sur tous les documents

## 🔧 Installation

### 1. Exécuter le SQL
```bash
# Dans Supabase SQL Editor
# Exécuter: sql/create_professional_devis_system.sql
```

### 2. Importer le composant
```typescript
import { GeneratePDFButton } from '@/components/devis/GeneratePDFButton';
```

### 3. Utiliser dans vos pages
Ajoutez le bouton partout où vous affichez un devis!

## 📱 Où ajouter le bouton?

### Pages recommandées:
1. **DevisPage.tsx** - Liste des devis (dans chaque carte)
2. **CreerDevisPage.tsx** - Après création du devis
3. **DemandeDetailPage.tsx** - Vue détaillée d'un devis
4. **Modal de détails** - Dans les popups de devis

### Exemple dans une liste:
```typescript
{devisList.map((devis) => (
  <Card key={devis.id}>
    <CardContent>
      <h3>{devis.titre}</h3>
      <p>{devis.montant_ttc} {devis.devise}</p>
      
      <div className="flex gap-2 mt-4">
        <Button onClick={() => viewDetails(devis.id)}>
          Voir détails
        </Button>
        
        <GeneratePDFButton
          devisId={devis.id}
          devisNumero={devis.numero}
          prestataireId={devis.prestataire_id}
          clientId={devis.client_id}
          items={devis.items || []}
          montantHT={devis.montant_ht}
          tva={devis.tva}
          montantTTC={devis.montant_ttc}
          devise={devis.devise || 'FC'}
          variant="outline"
          size="sm"
        />
      </div>
    </CardContent>
  </Card>
))}
```

## ✅ Checklist

Avant de générer votre premier PDF:
- [ ] SQL exécuté dans Supabase
- [ ] Profil entreprise configuré (Paramètres > Entreprise)
- [ ] Logo uploadé (recommandé)
- [ ] Composant GeneratePDFButton importé
- [ ] Bouton ajouté dans vos pages de devis
- [ ] Test avec un devis réel

## 🎉 Résultat

Après configuration, chaque fois qu'un prestataire clique sur "Télécharger PDF":
1. Le système récupère automatiquement les infos entreprise
2. Le système récupère les infos du devis et du client
3. Un PDF professionnel est généré
4. Le PDF se télécharge automatiquement
5. Le prestataire peut l'envoyer au client

**C'est automatique et professionnel!** 🚀
