import { useState, useEffect } from 'react';
import { useConfigurationGlobale } from '@/hooks/usePaiementConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  DollarSign, 
  Shield, 
  Clock, 
  Settings, 
  AlertCircle,
  Save,
  RotateCcw,
  TrendingUp
} from 'lucide-react';
import { ConfigurationPaiementGlobale } from '@/types/paiement';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function ConfigPaiementPage() {
  const { config, loading, refetch } = useConfigurationGlobale();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<ConfigurationPaiementGlobale>>({
    commission_main_oeuvre: 5,
    commission_materiel: 2,
    commission_deplacement: 5,
    pourcentage_acompte_defaut: 30,
    pourcentage_solde_defaut: 70,
    delai_validation_defaut: 7,
    delai_paiement_defaut: 30,
    pourcentage_garantie_defaut: 0,
    duree_garantie_defaut: 30,
    permettre_desactivation: true,
    permettre_choix_elements: true,
    permettre_negociation_commission: false,
    permettre_modification_acompte: true,
    permettre_modification_delais: true,
  });
  const [raison, setRaison] = useState('');

  useEffect(() => {
    if (config) {
      setFormData({
        commission_main_oeuvre: config.commission_main_oeuvre,
        commission_materiel: config.commission_materiel,
        commission_deplacement: config.commission_deplacement,
        pourcentage_acompte_defaut: config.pourcentage_acompte_defaut,
        pourcentage_solde_defaut: config.pourcentage_solde_defaut,
        delai_validation_defaut: config.delai_validation_defaut,
        delai_paiement_defaut: config.delai_paiement_defaut,
        pourcentage_garantie_defaut: config.pourcentage_garantie_defaut,
        duree_garantie_defaut: config.duree_garantie_defaut,
        permettre_desactivation: config.permettre_desactivation,
        permettre_choix_elements: config.permettre_choix_elements,
        permettre_negociation_commission: config.permettre_negociation_commission,
        permettre_modification_acompte: config.permettre_modification_acompte,
        permettre_modification_delais: config.permettre_modification_delais,
      });
    }
  }, [config]);

  const handleSave = async () => {
    try {
      setSaving(true);

      console.log('💾 Tentative de sauvegarde...', formData);

      // Mettre à jour la configuration
      const { data, error } = await supabase
        .from('configuration_paiement_globale')
        .update({
          ...formData,
          modified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .select();

      if (error) {
        console.error('❌ Erreur UPDATE:', error);
        throw error;
      }

      console.log('✅ UPDATE réussi, données retournées:', data);

      // Vérifier si des lignes ont été affectées
      if (!data || data.length === 0) {
        console.warn('⚠️ Aucune ligne affectée par l\'UPDATE');
        toast.warning('Aucune modification effectuée. Vérifiez que la configuration existe.');
        return;
      }

      toast.success('Configuration enregistrée avec succès');
      setRaison('');
      
      // Recharger pour voir les nouvelles valeurs
      await refetch();
      
      console.log('✅ Configuration rechargée');
    } catch (error: any) {
      console.error('❌ Erreur complète:', error);
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (config) {
      setFormData({
        commission_main_oeuvre: config.commission_main_oeuvre,
        commission_materiel: config.commission_materiel,
        commission_deplacement: config.commission_deplacement,
        pourcentage_acompte_defaut: config.pourcentage_acompte_defaut,
        pourcentage_solde_defaut: config.pourcentage_solde_defaut,
        delai_validation_defaut: config.delai_validation_defaut,
        delai_paiement_defaut: config.delai_paiement_defaut,
        pourcentage_garantie_defaut: config.pourcentage_garantie_defaut,
        duree_garantie_defaut: config.duree_garantie_defaut,
        permettre_desactivation: config.permettre_desactivation,
        permettre_choix_elements: config.permettre_choix_elements,
        permettre_negociation_commission: config.permettre_negociation_commission,
        permettre_modification_acompte: config.permettre_modification_acompte,
        permettre_modification_delais: config.permettre_modification_delais,
      });
      setRaison('');
      toast.info('Modifications annulées');
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="admin" userName="Admin" userRole="Administrateur">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement de la configuration...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" userName="Admin" userRole="Administrateur">
      <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-8 h-8" />
          Configuration Paiement
        </h1>
        <p className="text-muted-foreground mt-2">
          Gérez les paramètres globaux du système de paiement KaziPro
        </p>
      </div>

      {/* Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Les modifications s'appliquent uniquement aux nouveaux devis créés après l'enregistrement.
          Les devis existants conservent leurs paramètres d'origine.
        </AlertDescription>
      </Alert>

      {/* Section Commissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Commissions KaziPro
          </CardTitle>
          <CardDescription>
            Définissez les taux de commission pour chaque type d'élément
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Commission main d'œuvre */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-base">Main d'œuvre</Label>
              <span className="text-2xl font-bold text-primary">
                {formData.commission_main_oeuvre}%
              </span>
            </div>
            <Slider
              value={[formData.commission_main_oeuvre || 5]}
              onValueChange={([value]) =>
                setFormData({ ...formData, commission_main_oeuvre: value })
              }
              min={0}
              max={20}
              step={0.5}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Commission sur le coût de la main d'œuvre (0-20%)
            </p>
          </div>

          <Separator />

          {/* Commission matériel */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-base">Matériel</Label>
              <span className="text-2xl font-bold text-primary">
                {formData.commission_materiel}%
              </span>
            </div>
            <Slider
              value={[formData.commission_materiel || 2]}
              onValueChange={([value]) =>
                setFormData({ ...formData, commission_materiel: value })
              }
              min={0}
              max={20}
              step={0.5}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Commission sur le coût du matériel (0-20%)
            </p>
          </div>

          <Separator />

          {/* Commission déplacement */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-base">Déplacement</Label>
              <span className="text-2xl font-bold text-primary">
                {formData.commission_deplacement}%
              </span>
            </div>
            <Slider
              value={[formData.commission_deplacement || 5]}
              onValueChange={([value]) =>
                setFormData({ ...formData, commission_deplacement: value })
              }
              min={0}
              max={20}
              step={0.5}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Commission sur les frais de déplacement (0-20%)
            </p>
          </div>

          {/* Exemple de calcul */}
          <Alert className="bg-blue-50 border-blue-200">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>Exemple:</strong> Pour un devis de 100,000 FC (60k travaux + 30k matériel + 10k déplacement),
              la commission totale serait de{' '}
              <strong>
                {(
                  (60000 * (formData.commission_main_oeuvre || 5)) / 100 +
                  (30000 * (formData.commission_materiel || 2)) / 100 +
                  (10000 * (formData.commission_deplacement || 5)) / 100
                ).toLocaleString()}{' '}
                FC
              </strong>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Section Sécurité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Sécurité des deux parties
          </CardTitle>
          <CardDescription>
            Configurez le système d'acompte et de solde pour protéger clients et prestataires
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Acompte */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-base">Acompte (payé avant travaux)</Label>
              <span className="text-2xl font-bold text-green-600">
                {formData.pourcentage_acompte_defaut}%
              </span>
            </div>
            <Slider
              value={[formData.pourcentage_acompte_defaut || 30]}
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
              className="w-full"
            />
            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div>20-30%: Sécurise client</div>
              <div className="text-center font-semibold">30-40%: Équilibré ⭐</div>
              <div className="text-right">40-50%: Sécurise prestataire</div>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm">
              <strong>Solde (payé après validation):</strong>{' '}
              <span className="text-lg font-bold">{formData.pourcentage_solde_defaut}%</span>
              <span className="text-muted-foreground ml-2">(calculé automatiquement)</span>
            </p>
          </div>

          <Separator />

          {/* Délai de validation */}
          <div className="space-y-3">
            <Label className="text-base">Délai de validation des travaux</Label>
            <div className="flex gap-4 items-center">
              <Input
                type="number"
                value={formData.delai_validation_defaut}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    delai_validation_defaut: parseInt(e.target.value) || 7,
                  })
                }
                min={1}
                max={90}
                className="w-32"
              />
              <span className="text-muted-foreground">jours</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Délai accordé au client pour valider les travaux. Après ce délai, validation automatique.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section Garantie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Garantie (optionnel)
          </CardTitle>
          <CardDescription>
            Retenez un pourcentage du solde pendant une période de garantie
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-base">Pourcentage de garantie</Label>
              <span className="text-2xl font-bold">
                {formData.pourcentage_garantie_defaut}%
              </span>
            </div>
            <Slider
              value={[formData.pourcentage_garantie_defaut || 0]}
              onValueChange={([value]) =>
                setFormData({ ...formData, pourcentage_garantie_defaut: value })
              }
              min={0}
              max={20}
              step={1}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              0% = désactivé. Recommandé: 5-10% pour travaux avec garantie
            </p>
          </div>

          {formData.pourcentage_garantie_defaut! > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-base">Durée de garantie</Label>
                <div className="flex gap-4 items-center">
                  <Input
                    type="number"
                    value={formData.duree_garantie_defaut}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duree_garantie_defaut: parseInt(e.target.value) || 30,
                      })
                    }
                    min={0}
                    max={365}
                    className="w-32"
                  />
                  <span className="text-muted-foreground">jours</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Section Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions des prestataires</CardTitle>
          <CardDescription>
            Définissez ce que les prestataires peuvent configurer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Désactivation du paiement KaziPro</Label>
              <p className="text-sm text-muted-foreground">
                Permettre aux prestataires de désactiver complètement le paiement via KaziPro
              </p>
            </div>
            <Switch
              checked={formData.permettre_desactivation}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, permettre_desactivation: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Choix des éléments</Label>
              <p className="text-sm text-muted-foreground">
                Permettre de choisir quels éléments passent par KaziPro (travaux, matériel, déplacement)
              </p>
            </div>
            <Switch
              checked={formData.permettre_choix_elements}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, permettre_choix_elements: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Modification de l'acompte</Label>
              <p className="text-sm text-muted-foreground">
                Permettre aux prestataires de modifier le pourcentage d'acompte
              </p>
            </div>
            <Switch
              checked={formData.permettre_modification_acompte}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, permettre_modification_acompte: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Raison de la modification */}
      <Card>
        <CardHeader>
          <CardTitle>Raison de la modification (optionnel)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Ex: Ajustement des commissions pour la phase de lancement..."
            value={raison}
            onChange={(e) => setRaison(e.target.value)}
            rows={3}
          />
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
              Enregistrer les modifications
            </>
          )}
        </Button>
        <Button
          onClick={handleReset}
          variant="outline"
          size="lg"
          disabled={saving}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Annuler
        </Button>
      </div>
    </div>
    </DashboardLayout>
  );
}
