# 📋 QUICK REFERENCE - SYSTÈME DE PAIEMENT KAZIPRO

## 🚀 DÉMARRAGE EN 3 ÉTAPES

### 1. Exécuter SQL (15 min)
```bash
# Dans Supabase SQL Editor
sql/INSTALLER_SYSTEME_PAIEMENT.sql
```

### 2. Vérifier (5 min)
- ✓ 8 tables créées
- ✓ 4 storage buckets
- ✓ Fonctions SQL actives

### 3. Commencer à coder (2h)
```bash
# Créer les composants UI
src/components/paiement/MontantDisplay.tsx
src/components/paiement/StatutPaiementBadge.tsx
```

---

## 📊 TABLES PRINCIPALES

| Table | Description | Colonnes clés |
|-------|-------------|---------------|
| `configuration_paiement_globale` | Config admin | commissions, acompte, délais |
| `configuration_paiement_prestataire` | Config prestataire | paiement_via_kazipro, éléments |
| `frais_deplacement_config` | Frais déplacement | actif, mode_calcul, tarifs |
| `contrats` | Contrats signés | numero, signatures, statut |
| `paiements` | Transactions | montants, commissions, statut |
| `litiges` | Litiges | titre, preuves, décision |

---

## 🔧 FONCTIONS UTILES

### Calculs
```typescript
import { calculateDevisMontants } from '@/lib/paiement-utils';

const montants = calculateDevisMontants(
  60000,  // travaux
  30000,  // matériel
  10000,  // déplacement
  16,     // TVA
  configGlobale,
  configPrestataire
);
```

### Formatage
```typescript
import { formatMontant } from '@/lib/paiement-utils';

formatMontant(100000, 'FC'); // "100,000 FC"
```

### Hooks
```typescript
import { useConfigurationGlobale } from '@/hooks/usePaiementConfig';

const { config, loading } = useConfigurationGlobale();
```

---

## 🎨 COMPOSANTS À CRÉER

### Priorité 1 (Base)
- [ ] MontantDisplay - Affichage montants
- [ ] StatutPaiementBadge - Badge statut
- [ ] CommissionInfo - Info commissions

### Priorité 2 (Config)
- [ ] ConfigPaiementPage (Admin)
- [ ] ConfigPaiementPage (Prestataire)
- [ ] FraisDeplacementPage

### Priorité 3 (Flux)
- [ ] CreerDevisPage (améliorer)
- [ ] SignerContratPage
- [ ] PaiementPage
- [ ] ValiderTravauxPage

---

## 📈 FLUX COMPLET

```
1. Prestataire crée devis
   ↓ (calcul auto frais + commissions)
2. Client accepte devis
   ↓ (génération contrat auto)
3. Client signe contrat
   ↓
4. Prestataire signe contrat
   ↓ (contrat complet)
5. Client paie ACOMPTE (30%)
   ↓ (mission créée)
6. Prestataire fait travaux
   ↓
7. Prestataire marque terminé
   ↓ (notification client)
8. Client valide (7 jours max)
   ↓ (ou auto-validation)
9. Client paie SOLDE (70%)
   ↓ (mission complétée)
10. Les deux laissent avis
```

---

## 💰 CONFIGURATION PAR DÉFAUT

| Paramètre | Valeur | Modifiable |
|-----------|--------|------------|
| Commission travaux | 5% | ✅ Admin |
| Commission matériel | 2% | ✅ Admin |
| Commission déplacement | 5% | ✅ Admin |
| Acompte | 30% | ✅ Admin |
| Solde | 70% | Auto |
| Délai validation | 7 jours | ✅ Admin |
| Auto-validation | Activée | ✅ Admin |
| Frais déplacement | Désactivés | ✅ Prestataire |

---

## 🔐 SÉCURITÉ

### RLS Policies
- Admin: Accès complet
- Prestataire: Ses données uniquement
- Client: Ses données uniquement

### Storage
- Contrats: Private (parties uniquement)
- Signatures: Private (propriétaire)
- Reçus: Private (parties)
- Preuves: Private (parties)

---

## 📱 RESPONSIVE

Toutes les pages doivent être:
- ✅ Mobile-first
- ✅ Tablette optimisée
- ✅ Desktop full-featured

---

## 🆘 AIDE RAPIDE

### Erreur: Table not found
→ Exécuter les scripts SQL

### Erreur: RLS policy violation
→ Vérifier les policies RLS

### Types non reconnus
→ Redémarrer: `npm run dev`

### Hooks ne chargent pas
→ Vérifier Supabase connection

---

## 📚 DOCUMENTATION

- **Specs**: `.kiro/specs/systeme-paiement-contrat/`
- **Status**: `IMPLEMENTATION_STATUS.md`
- **Guide**: `DEMARRAGE_RAPIDE.md`
- **Résumé**: `COMPLETION_SUMMARY.txt`

---

## ✅ CHECKLIST AVANT DE COMMENCER

- [ ] Scripts SQL exécutés
- [ ] Tables vérifiées dans Supabase
- [ ] Storage buckets créés
- [ ] Types TypeScript sans erreurs
- [ ] Serveur dev démarré
- [ ] Documentation lue

---

**Prêt? Commencez par exécuter les scripts SQL!** 🚀
