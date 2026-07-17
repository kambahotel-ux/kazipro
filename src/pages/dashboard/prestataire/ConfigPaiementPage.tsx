import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useConfigurationGlobale, useConfigurationPrestataire, useSaveConfigurationPrestataire } from '@/hooks/usePaiementConfig';
import { PrestatairePageShell } from '@/components/prestataire/PrestatairePageShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  DollarSign, 
  Shield, 
  Settings, 
  AlertCircle,
  Save,
  Info,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { ConfigurationPaiementPrestataire } from '@/types/paiement';
import { SettingsPageSkeleton } from '@/components/dashboard/AdminLoadingSkeleton';

export default function ConfigPaiementPage({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuth();
  const { config: configGlobale, loading: loadingGlobale } = useConfigurationGlobale();
  const { config: configPrestataire, loading: loadingPrestataire, refetch } = useConfigurationPrestataire(user?.id);
  const { saveConfig, saving } = useSaveConfigurationPrestataire();

  const [formData, setFormData] = useState<Partial<ConfigurationPaiementPrestataire>>({
    paiement_via_kazipro: true,
    main_oeuvre_via_kazipro: true,
    materiel_via_kazipro: true,
    deplacement_via_kazipro: true,
  });

  useEffect(() => {
    if (configPrestataire) {
      setFormData({
        paiement_via_kazipro: configPrestataire.paiement_via_kazipro,
        main_oeuvre_via_kazipro: configPrestataire.main_oeuvre_via_kazipro,
        materiel_via_kazipro: configPrestataire.materiel_via_kazipro,
        deplacement_via_kazipro: configPrestataire.deplacement_via_kazipro,
        commission_main_oeuvre: configPrestataire.commission_main_oeuvre,
        commission_materiel: configPrestataire.commission_materiel,
        commission_deplacement: configPrestataire.commission_deplacement,
        pourcentage_acompte: configPrestataire.pourcentage_acompte,
      });
    }
  }, [configPrestataire]);

  const handleSave = async () => {
    if (!user?.id) return;

    const success = await saveConfig(user.id, formData);
    if (success) {
      refetch();
    }
  };

  const handleReset = () => {
    if (configPrestataire) {
      setFormData({
        paiement_via_kazipro: configPrestataire.paiement_via_kazipro,
        main_oeuvre_via_kazipro: configPrestataire.main_oeuvre_via_kazipro,
        materiel_via_kazipro: configPrestataire.materiel_via_kazipro,
        deplacement_via_kazipro: configPrestataire.deplacement_via_kazipro,
        commission_main_oeuvre: configPrestataire.commission_main_oeuvre,
        commission_materiel: configPrestataire.commission_materiel,
        commission_deplacement: configPrestataire.commission_deplacement,
        pourcentage_acompte: configPrestataire.pourcentage_acompte,
      });
    } else {
      setFormData({
        paiement_via_kazipro: true,
        main_oeuvre_via_kazipro: true,
        materiel_via_kazipro: true,
        deplacement_via_kazipro: true,
      });
    }
    toast.info('Modifications annulées');
  };

  const loading = loadingGlobale || loadingPrestataire;

  if (loading) {
    return (
      <PrestatairePageShell embedded={embedded} userName={user?.email || ''} userRole="Prestataire">
        <SettingsPageSkeleton />
      </PrestatairePageShell>
    );
  }

  if (!configGlobale) {
    return (
      <PrestatairePageShell embedded={embedded} userName={user?.email || ''} userRole="Prestataire">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Impossible de charger la configuration. Contactez l'administrateur.
          </AlertDescription>
        </Alert>
      </PrestatairePageShell>
    );
  }

  const commissionTravaux = formData.commission_main_oeuvre ?? configGlobale.commission_main_oeuvre;
  const commissionMateriel = formData.commission_materiel ?? configGlobale.commission_materiel;
  const commissionDeplacement = formData.commission_deplacement ?? configGlobale.commission_deplacement;

  return (
    <PrestatairePageShell embedded={embedded} userName={user?.email || ''} userRole="Prestataire">
      <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-5xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Configuration Paiement
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos préférences de paiement via KaziPro
          </p>
        </div>

        {/* Alert Info */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Ces paramètres s'appliquent à tous vos nouveaux devis. Les devis existants conservent leurs paramètres d'origine.
          </AlertDescription>
        </Alert>

        {/* Section Activation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Paiement via KaziPro
            </CardTitle>
            <CardDescription>
              Activez ou désactivez le système de paiement sécurisé KaziPro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="space-y-1">
                <Label className="text-base font-semibold">
                  Utiliser le paiement KaziPro
                </Label>
                <p className="text-sm text-muted-foreground">
                  {formData.paiement_via_kazipro
                    ? 'Vos clients peuvent payer via KaziPro (sécurisé, acompte/solde)'
                    : 'Vous gérez les paiements directement avec vos clients'}
                </p>
              </div>
              <Switch
                checked={formData.paiement_via_kazipro}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, paiement_via_kazipro: checked })
                }
                disabled={!configGlobale.permettre_desactivation}
              />
            </div>

            {!configGlobale.permettre_desactivation && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  L'administrateur a rendu le paiement KaziPro obligatoire.
                </AlertDescription>
              </Alert>
            )}

            {formData.paiement_via_kazipro && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  <strong>Avantages:</strong> Paiement sécurisé, acompte avant travaux, protection contre les impayés, 
                  gestion automatique des contrats et factures.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Section Éléments (si paiement activé) */}
        {formData.paiement_via_kazipro && configGlobale.permettre_choix_elements && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Éléments via KaziPro
              </CardTitle>
              <CardDescription>
                Choisissez quels éléments passent par le système de paiement KaziPro
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Main d'œuvre</Label>
                  <p className="text-sm text-muted-foreground">
                    Commission: {commissionTravaux}%
                  </p>
                </div>
                <Switch
                  checked={formData.main_oeuvre_via_kazipro}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, main_oeuvre_via_kazipro: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Matériel</Label>
                  <p className="text-sm text-muted-foreground">
                    Commission: {commissionMateriel}%
                  </p>
                </div>
                <Switch
                  checked={formData.materiel_via_kazipro}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, materiel_via_kazipro: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Frais de déplacement</Label>
                  <p className="text-sm text-muted-foreground">
                    Commission: {commissionDeplacement}%
                  </p>
                </div>
                <Switch
                  checked={formData.deplacement_via_kazipro}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, deplacement_via_kazipro: checked })
                  }
                />
              </div>

              {/* Exemple de calcul */}
              <Alert className="bg-blue-50 border-blue-200 mt-4">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  <strong>Exemple:</strong> Pour un devis de 100,000 FC (60k travaux + 30k matériel + 10k déplacement),
                  votre commission totale serait de{' '}
                  <strong>
                    {(
                      (formData.main_oeuvre_via_kazipro ? (60000 * commissionTravaux) / 100 : 0) +
                      (formData.materiel_via_kazipro ? (30000 * commissionMateriel) / 100 : 0) +
                      (formData.deplacement_via_kazipro ? (10000 * commissionDeplacement) / 100 : 0)
                    ).toLocaleString()}{' '}
                    FC
                  </strong>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Section Acompte (si paiement activé et modification autorisée) */}
        {formData.paiement_via_kazipro && configGlobale.permettre_modification_acompte && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Acompte personnalisé
              </CardTitle>
              <CardDescription>
                Modifiez le pourcentage d'acompte par défaut (optionnel)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label>Utiliser l'acompte par défaut ({configGlobale.pourcentage_acompte_defaut}%)</Label>
                <Switch
                  checked={formData.pourcentage_acompte === undefined}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      pourcentage_acompte: checked ? undefined : configGlobale.pourcentage_acompte_defaut,
                    })
                  }
                />
              </div>

              {formData.pourcentage_acompte !== undefined && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-base">Acompte personnalisé</Label>
                      <span className="text-2xl font-bold text-green-600">
                        {formData.pourcentage_acompte}%
                      </span>
                    </div>
                    <Slider
                      value={[formData.pourcentage_acompte]}
                      onValueChange={([value]) =>
                        setFormData({ ...formData, pourcentage_acompte: value })
                      }
                      min={20}
                      max={50}
                      step={5}
                      className="w-full"
                    />
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm">
                        <strong>Solde:</strong>{' '}
                        <span className="text-lg font-bold">{100 - formData.pourcentage_acompte}%</span>
                        <span className="text-muted-foreground ml-2">(payé après validation)</span>
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Résumé de la configuration */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>📊 Résumé de votre configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Paiement KaziPro</p>
                <p className="font-semibold">
                  {formData.paiement_via_kazipro ? '✅ Activé' : '❌ Désactivé'}
                </p>
              </div>
              {formData.paiement_via_kazipro && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Acompte</p>
                    <p className="font-semibold">
                      {formData.pourcentage_acompte ?? configGlobale.pourcentage_acompte_defaut}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Commission travaux</p>
                    <p className="font-semibold">
                      {formData.main_oeuvre_via_kazipro ? `${commissionTravaux}%` : 'Désactivé'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Commission matériel</p>
                    <p className="font-semibold">
                      {formData.materiel_via_kazipro ? `${commissionMateriel}%` : 'Désactivé'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Commission déplacement</p>
                    <p className="font-semibold">
                      {formData.deplacement_via_kazipro ? `${commissionDeplacement}%` : 'Désactivé'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 sticky bottom-4 bg-background p-4 rounded-lg border shadow-lg">
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="flex-1"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
            disabled={saving}
          >
            Annuler
          </Button>
        </div>
      </div>
    </PrestatairePageShell>
  );
}
