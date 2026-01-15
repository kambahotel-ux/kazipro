# ✅ Nom du client automatique sur les devis

## Problème résolu

**Avant**: Sur les devis liés à une demande, la section "Client" affichait "À compléter"

**Après**: Le nom du client (et ses coordonnées) s'affichent automatiquement sur le PDF

## Comment ça marche

### 1. Récupération des données client

Quand un devis est lié à une demande (`demande_id` existe):
1. Le système récupère la demande
2. Trouve le client associé à cette demande
3. Charge ses informations: nom, téléphone, email

### 2. Affichage sur le PDF

**Section "Client"** affiche maintenant:
- **Nom complet** du client (en gras)
- **Téléphone** (si disponible)
- **Email** (si disponible)

### Exemple de rendu:

**Devis lié à une demande**:
```
┌──────────────────────┐  ┌──────────────────────┐
│ PRESTATAIRE          │  │ CLIENT               │
│ Justin Akonkwa       │  │ Jean Dupont ✅       │
│                      │  │ Tél: +243 812 345 678│
│                      │  │ Email: jean@mail.com │
└──────────────────────┘  └──────────────────────┘
```

**Devis sans demande** (créé manuellement):
```
┌──────────────────────┐  ┌──────────────────────┐
│ PRESTATAIRE          │  │ CLIENT               │
│ Justin Akonkwa       │  │ À compléter          │
└──────────────────────┘  └──────────────────────┘
```

## Modifications techniques

### 1. Interface Devis étendue
```typescript
interface Devis {
  // ... champs existants
  client_name?: string;
  client_phone?: string;
  client_email?: string;
}
```

### 2. Fonction fetchDevis améliorée
```typescript
// Pour chaque devis
if (devis.demande_id) {
  // Récupérer les infos client via la demande
  const { data: demandeData } = await supabase
    .from("demandes")
    .select(`
      client_id,
      clients:client_id (
        full_name,
        phone,
        email
      )
    `)
    .eq("id", devis.demande_id)
    .maybeSingle();
  
  // Ajouter au devis
  clientInfo = {
    client_name: client.full_name,
    client_phone: client.phone,
    client_email: client.email
  };
}
```

### 3. PDF mis à jour
```html
<div>
  <div>CLIENT</div>
  <div>${devis.client_name || 'À compléter'}</div>
  ${devis.client_phone ? `<div>Tél: ${devis.client_phone}</div>` : ''}
  ${devis.client_email ? `<div>Email: ${devis.client_email}</div>` : ''}
</div>
```

## Cas d'utilisation

### Cas 1: Devis suite à une demande
1. Client crée une demande de service
2. Prestataire crée un devis pour cette demande
3. **Automatique**: Le nom du client apparaît sur le devis
4. PDF généré avec toutes les infos client

### Cas 2: Devis manuel
1. Prestataire crée un devis sans demande
2. Section "Client" affiche "À compléter"
3. Peut être rempli manuellement plus tard

### Cas 3: Devis accepté
1. Client accepte le devis
2. Son nom apparaît dans la section "Client"
3. **ET** sa signature apparaît dans la section "Signatures"
4. Preuve complète d'acceptation

## Avantages

✅ **Automatique**: Pas besoin de saisir manuellement
✅ **Précis**: Données directement de la base
✅ **Complet**: Nom + téléphone + email
✅ **Professionnel**: PDF avec toutes les infos
✅ **Traçable**: Lien clair entre demande et devis

## Fichier modifié

- ✅ `src/pages/dashboard/prestataire/DevisPage.tsx`
  - Interface `Devis` étendue
  - Fonction `fetchDevis` améliorée
  - PDF mis à jour

## Test

Pour tester:
1. **Client crée une demande**
2. **Prestataire crée un devis** pour cette demande
3. **Générer le PDF**
4. **Vérifier**: Le nom du client apparaît dans la section "Client"

## Résultat

Un devis professionnel avec:
- ✅ Nom du client automatique
- ✅ Coordonnées du client (tél, email)
- ✅ Informations complètes
- ✅ Aspect professionnel

---
**Statut**: ✅ IMPLÉMENTÉ
**Aucune erreur**: ✅
**Prêt à utiliser**: Immédiatement
