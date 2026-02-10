# 🚀 DÉMARRAGE RAPIDE - SYSTÈME DE PAIEMENT KAZIPRO

## 📋 ÉTAPE 1: EXÉCUTER LES SCRIPTS SQL (15 minutes)

### Option A: Script tout-en-un (Recommandé)

1. Ouvrir **Supabase Dashboard** → **SQL Editor**
2. Créer une nouvelle query
3. Copier le contenu de `sql/INSTALLER_SYSTEME_PAIEMENT.sql`
4. Exécuter
5. Vérifier les messages de succès

### Option B: Scripts individuels

Exécuter dans cet ordre:

```sql
-- 1. Créer les tables
\i sql/create_systeme_paiement_complet.sql

-- 2. Créer les RLS policies
\i sql/create_rls_policies_paiement.sql

-- 3. Créer les fonctions SQL
\i sql/create_functions_paiement.sql

-- 4. Créer les storage buckets
\i sql/create_storage_paiement.sql
```

### ✅ Vérifications

Après exécution, vérifier dans Supabase:

**Tables créées** (8 nouvelles):
- [ ] configuration_paiement_globale
- [ ] historique_config_paiement
- [ ] configuration_paiement_prestataire
- [ ] frais_deplacement_config
- [ ] conditions_paiement_templates
- [ ] contrats
- [ ] paiements
- [ ] litiges

**Storage Buckets** (4):
- [ ] contrats
- [ ] signatures
- [ ] recus
- [ ] preuves-paiement

**Fonctions SQL** (4):
- [ ] generate_contrat_numero()
- [ ] generate_paiement_numero()
- [ ] generate_litige_numero()
- [ ] calculate_frais_deplacement()

---

## 💻 ÉTAPE 2: TESTER LES HOOKS REACT (5 minutes)

### Test 1: Configuration globale

Créer un fichier de test `src/pages/test/TestPaiement.tsx`:

```tsx
import { useConfigurationGlobale } from '@/hooks/usePaiementConfig';

export default function TestPaiement() {
  const { config, loading, error } = useConfigurationGlobale();

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Configuration</h1>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(config, null, 2)}
      </pre>
    </div>
  );
}
```

### Test 2: Calculs

Dans la console du navigateur:

```javascript
import { calculateDevisMontants } from '@/lib/paiement-utils';

const config = {
  commission_main_oeuvre: 5,
  commission_materiel: 2,
  commission_deplacement: 5,
  pourcentage_acompte_defaut: 30,
  // ... autres champs
};

const montants = calculateDevisMontants(
  60000, // travaux
  30000, // matériel
  10000, // déplacement
  16,    // TVA 16%
  config
);

console.log(montants);
```

---

## 🎨 ÉTAPE 3: CRÉER LES COMPOSANTS UI (2 heures)

### Composant 1: MontantDisplay

`src/components/paiement/MontantDisplay.tsx`:

```tsx
import { formatMontant } from '@/lib/paiement-utils';

interface MontantDisplayProps {
  label: string;
  montant: number;
  devise?: string;
  className?: string;
  highlight?: boolean;
}

export function MontantDisplay({
  label,
  montant,
  devise = 'FC',
  className = '',
  highlight = false,
}: MontantDisplayProps) {
  return (
    <div className={`flex justify-between items-center py-2 ${className}`}>
      <span className={highlight ? 'font-semibold' : 'text-muted-foreground'}>
        {label}
      </span>
      <span className={highlight ? 'text-lg font-bold' : 'font-medium'}>
        {formatMontant(montant, devise)}
      </span>
    </div>
  );
}
```

### Composant 2: StatutPaiementBadge

`src/components/paiement/StatutPaiementBadge.tsx`:

```tsx
import { Badge } from '@/components/ui/badge';
import { getStatutPaiementLabel, getStatutPaiementColor } from '@/lib/paiement-utils';

interface StatutPaiementBadgeProps {
  statut: string;
}

export function StatutPaiementBadge({ statut }: StatutPaiementBadgeProps) {
  return (
    <Badge className={getStatutPaiementColor(statut)}>
      {getStatutPaiementLabel(statut)}
    </Badge>
  );
}
```

### Composant 3: CommissionInfo

`src/components/paiement/CommissionInfo.tsx`:

```tsx
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatMontant } from '@/lib/paiement-utils';

interface CommissionInfoProps {
  commission: number;
  taux: number;
  montantBase: number;
}

export function CommissionInfo({ commission, taux, montantBase }: CommissionInfoProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 text-sm text-muted-foreground cursor-help">
            <Info className="w-4 h-4" />
            <span>Commission: {formatMontant(commission)}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{taux}% de {formatMontant(montantBase)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

---

## 🔧 ÉTAPE 4: PAGE CONFIGURATION ADMIN (3 heures)

`src/pages/dashboard/admin/ConfigPaiementPage.tsx`:

Structure de base:

```tsx
import { useState } from 'react';
import { useConfigurationGlobale } from '@/hooks/usePaiementConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function ConfigPaiementPage() {
  const { config, loading } = useConfigurationGlobale();
  const [formData, setFormData] = useState({
    commission_main_oeuvre: 5,
    commission_materiel: 2,
    commission_deplacement: 5,
    pourcentage_acompte_defaut: 30,
    delai_validation_defaut: 7,
    // ... autres champs
  });

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuration Paiement</h1>
        <p className="text-muted-foreground">
          Gérez les paramètres globaux du système de paiement
        </p>
      </div>

      {/* Section Commissions */}
      <Card>
        <CardHeader>
          <CardTitle>💰 Commissions KaziPro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Commission main d'œuvre */}
          <div className="space-y-2">
            <Label>Main d'œuvre: {formData.commission_main_oeuvre}%</Label>
            <Slider
              value={[formData.commission_main_oeuvre]}
              onValueChange={([value]) =>
                setFormData({ ...formData, commission_main_oeuvre: value })
              }
              min={0}
              max={20}
              step={0.5}
            />
          </div>

          {/* Commission matériel */}
          <div className="space-y-2">
            <Label>Matériel: {formData.commission_materiel}%</Label>
            <Slider
              value={[formData.commission_materiel]}
              onValueChange={([value]) =>
                setFormData({ ...formData, commission_materiel: value })
              }
              min={0}
              max={20}
              step={0.5}
            />
          </div>

          {/* Commission déplacement */}
          <div className="space-y-2">
            <Label>Déplacement: {formData.commission_deplacement}%</Label>
            <Slider
              value={[formData.commission_deplacement]}
              onValueChange={([value]) =>
                setFormData({ ...formData, commission_deplacement: value })
              }
              min={0}
              max={20}
              step={0.5}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section Acompte/Solde */}
      <Card>
        <CardHeader>
          <CardTitle>🔒 Sécurité des deux parties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Acompte: {formData.pourcentage_acompte_defaut}%</Label>
            <Slider
              value={[formData.pourcentage_acompte_defaut]}
              onValueChange={([value]) =>
                setFormData({
                  ...formData,
                  pourcentage_acompte_defaut: value,
                  pourcentage_solde_defaut: 100 - value,
                })
              }
              min={0}
              max={100}
              step={5}
            />
            <p className="text-sm text-muted-foreground">
              Solde: {100 - formData.pourcentage_acompte_defaut}% (calculé automatiquement)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Délai de validation (jours)</Label>
            <Input
              type="number"
              value={formData.delai_validation_defaut}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  delai_validation_defaut: parseInt(e.target.value),
                })
              }
              min={1}
              max={90}
            />
          </div>
        </CardContent>
      </Card>

      {/* Boutons d'action */}
      <div className="flex gap-4">
        <Button size="lg">Enregistrer les modifications</Button>
        <Button variant="outline" size="lg">
          Annuler
        </Button>
      </div>
    </div>
  );
}
```

---

## 📱 ÉTAPE 5: PAGE CONFIGURATION PRESTATAIRE (3 heures)

`src/pages/dashboard/prestataire/ConfigPaiementPage.tsx`:

Structure similaire avec:
- Toggle activation paiement KaziPro
- Checkboxes pour éléments
- Affichage des commissions
- Simulation de montants

---

## 🎯 ORDRE D'IMPLÉMENTATION RECOMMANDÉ

### Semaine 1: Configuration et Base

1. ✅ Jour 1: Exécuter SQL + Tester hooks
2. ⏳ Jour 2: Créer composants UI de base
3. ⏳ Jour 3: Page configuration admin
4. ⏳ Jour 4: Page configuration prestataire
5. ⏳ Jour 5: Page frais de déplacement

### Semaine 2: Devis et Contrats

6. ⏳ Jour 6-7: Améliorer création de devis
7. ⏳ Jour 8-9: Génération et signature contrats
8. ⏳ Jour 10: Tests et ajustements

### Semaine 3: Paiements

9. ⏳ Jour 11-12: Pages paiement client
10. ⏳ Jour 13-14: Validation travaux
11. ⏳ Jour 15: Historique et litiges

### Semaine 4: Intégrations et Tests

12. ⏳ Jour 16-17: Intégration M-Pesa/Airtel
13. ⏳ Jour 18-19: Génération PDF
14. ⏳ Jour 20: Tests finaux et déploiement

---

## 🆘 AIDE ET SUPPORT

### Problèmes courants

**Erreur: Table already exists**
→ Normal si vous réexécutez. Les scripts utilisent `IF NOT EXISTS`.

**Erreur: RLS policy already exists**
→ Supprimer les policies existantes d'abord ou utiliser `DROP POLICY IF EXISTS`.

**Hooks ne chargent pas les données**
→ Vérifier que les tables existent et que RLS est configuré.

**Types TypeScript non reconnus**
→ Redémarrer le serveur de développement: `npm run dev`

### Commandes utiles

```bash
# Redémarrer le serveur
npm run dev

# Vérifier les types
npm run type-check

# Linter
npm run lint

# Build
npm run build
```

---

## 📚 RESSOURCES

### Documentation

- **Spécifications complètes**: `.kiro/specs/systeme-paiement-contrat/`
- **État d'implémentation**: `IMPLEMENTATION_STATUS.md`
- **Résumé système**: `RESUME_FINAL_SYSTEME_PAIEMENT.txt`

### Code de référence

- **Types**: `src/types/paiement.ts`
- **Utilitaires**: `src/lib/paiement-utils.ts`
- **Hooks**: `src/hooks/usePaiementConfig.ts`

### Exemples

Voir les fichiers existants:
- `src/pages/dashboard/client/PaiementsPage.tsx` (à améliorer)
- `src/pages/dashboard/prestataire/CreerDevisPage.tsx` (à modifier)

---

**Prêt à commencer? Exécutez les scripts SQL et créez votre premier composant!** 🚀
