import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFraisDeplacementConfig, useSaveFraisDeplacementConfig } from '@/hooks/usePaiementConfig';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  MapPin, 
  Car, 
  DollarSign,
  Save,
  Plus,
  Trash2,
  Info,
  Calculator
} from 'lucide-react';
import { FraisDeplacementConfig, ModeCalculFrais, ZoneFrais } from '@/types/paiement';

export default function FraisDeplacementPage() {
  const { user } = useAuth();
  const { config, loading, refetch } = useFraisDeplacementConfig(user?.id);
  const { saveConfig, saving } = useSaveFraisDeplacementConfig();

  const [formData, setFormData] = useState<Partial<FraisDeplacementConfig>>({
    actif: false,
    mode_calcul: 'fixe',
    montant_fixe: 0,
    prix_par_km: 0,
    distance_gratuite_km: 0,
    zones: [],
    montant_minimum: 0,
    montant_maximum: undefined,
  });

  const [newZone, setNewZone] = useState({ nom: '', prix: 0 });

  useEffect(() => {
    if (config) {
      setFormData({
        actif: config.actif,
        mode_calcul: config.mode_calcul,
        montant_fixe: config.montant_fixe,
        prix_par_km: config.prix_par_km,
        distance_gratuite_km: config.distance_gratuite_km,
        zones: config.zones || [],
        montant_minimum: config.montant_minimum,
        montant_maximum: config.montant_maximum,
      });
    }
  }, [config]);

  const handleSave = async () => {
    if (!user?.id) return;

    const success = await saveConfig(user.id, formData);
    if (success) {
      refetch();
    }
  };

  const handleAddZone = () => {
    if (!newZone.nom || newZone.prix <= 0) {
      toast.error('Veuillez remplir le nom et le prix de la zone');
      return;
    }

    setFormData({
      ...formData,
      zones: [...(formData.zones || []), { ...newZone }],
    });
    setNewZone({ nom: '', prix: 0 });
    toast.success('Zone ajoutée');
  };

  const handleRemoveZone = (index: number) => {
    const newZones = [...(formData.zones || [])];
    newZones.splice(index, 1);
    setFormData({ ...formData, zones: newZones });
    toast.success('Zone supprimée');
  };

  if (loading) {
    return (
      <DashboardLayout role="prestataire" userName={user?.email || ''} userRole="Prestataire">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="prestataire" userName={user?.email || ''} userRole="Prestataire">
      <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-5xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Car className="w-8 h-8" />
            Frais de Déplacement
          </h1>
          <p className="text-muted-foreground mt-2">
            Configurez vos frais de déplacement (optionnel)
          </p>
        </div>

        {/* Alert Info */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Les frais de déplacement sont optionnels. Si vous ne les activez pas, aucun frais ne sera ajouté à vos devis.
          </AlertDescription>
        </Alert>

        {/* Section Activation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Activer les frais de déplacement
            </CardTitle>
            <CardDescription>
              Ajoutez automatiquement des frais de déplacement à vos devis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="space-y-1">
                <Label className="text-base font-semibold">
                  Frais de déplacement
                </Label>
                <p className="text-sm text-muted-foreground">
                  {formData.actif
                    ? 'Les frais seront ajoutés automatiquement selon votre configuration'
                    : 'Aucun frais de déplacement ne sera facturé'}
                </p>
              </div>
              <Switch
                checked={formData.actif}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, actif: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Section Mode de calcul (si activé) */}
        {formData.actif && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Mode de calcul
                </CardTitle>
                <CardDescription>
                  Choisissez comment calculer vos frais de déplacement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={formData.mode_calcul}
                  onValueChange={(value: ModeCalculFrais) =>
                    setFormData({ ...formData, mode_calcul: value })
                  }
                >
                  <div className="space-y-4">
                    {/* Montant fixe */}
                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="fixe" id="fixe" />
                      <div className="flex-1">
                        <Label htmlFor="fixe" className="cursor-pointer font-semibold">
                          Montant fixe
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Un montant unique quel que soit la distance
                        </p>
                      </div>
                    </div>

                    {/* Par kilomètre */}
                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="par_km" id="par_km" />
                      <div className="flex-1">
                        <Label htmlFor="par_km" className="cursor-pointer font-semibold">
                          Par kilomètre
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Tarif au kilomètre avec distance gratuite optionnelle
                        </p>
                      </div>
                    </div>

                    {/* Par zone */}
                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="par_zone" id="par_zone" />
                      <div className="flex-1">
                        <Label htmlFor="par_zone" className="cursor-pointer font-semibold">
                          Par zone géographique
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Définissez des zones avec des tarifs différents
                        </p>
                      </div>
                    </div>

                    {/* Gratuit */}
                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="gratuit" id="gratuit" />
                      <div className="flex-1">
                        <Label htmlFor="gratuit" className="cursor-pointer font-semibold">
                          Gratuit
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Aucun frais de déplacement (inclus dans le prix)
                        </p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Configuration selon le mode */}
            {formData.mode_calcul === 'fixe' && (
              <Card>
                <CardHeader>
                  <CardTitle>Montant fixe</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Montant (FC)</Label>
                    <Input
                      type="number"
                      value={formData.montant_fixe || 0}
                      onChange={(e) =>
                        setFormData({ ...formData, montant_fixe: parseFloat(e.target.value) || 0 })
                      }
                      min={0}
                    />
                    <p className="text-sm text-muted-foreground">
                      Ce montant sera ajouté à tous vos devis
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {formData.mode_calcul === 'par_km' && (
              <Card>
                <CardHeader>
                  <CardTitle>Tarif au kilomètre</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Prix par kilomètre (FC)</Label>
                    <Input
                      type="number"
                      value={formData.prix_par_km || 0}
                      onChange={(e) =>
                        setFormData({ ...formData, prix_par_km: parseFloat(e.target.value) || 0 })
                      }
                      min={0}
                      step={0.1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Distance gratuite (km)</Label>
                    <Input
                      type="number"
                      value={formData.distance_gratuite_km || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          distance_gratuite_km: parseFloat(e.target.value) || 0,
                        })
                      }
                      min={0}
                    />
                    <p className="text-sm text-muted-foreground">
                      Les premiers kilomètres sont gratuits
                    </p>
                  </div>

                  <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-900">
                      <strong>Exemple:</strong> Pour 25 km avec {formData.prix_par_km || 0} FC/km et{' '}
                      {formData.distance_gratuite_km || 0} km gratuits, le coût sera de{' '}
                      <strong>
                        {Math.max(0, (25 - (formData.distance_gratuite_km || 0)) * (formData.prix_par_km || 0)).toLocaleString()}{' '}
                        FC
                      </strong>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {formData.mode_calcul === 'par_zone' && (
              <Card>
                <CardHeader>
                  <CardTitle>Zones géographiques</CardTitle>
                  <CardDescription>
                    Définissez vos zones d'intervention avec leurs tarifs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Liste des zones */}
                  {formData.zones && formData.zones.length > 0 && (
                    <div className="space-y-2">
                      {formData.zones.map((zone, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-semibold">{zone.nom}</p>
                            <p className="text-sm text-muted-foreground">
                              {zone.prix.toLocaleString()} FC
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveZone(index)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Separator />

                  {/* Ajouter une zone */}
                  <div className="space-y-3">
                    <Label>Ajouter une zone</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        placeholder="Nom de la zone"
                        value={newZone.nom}
                        onChange={(e) => setNewZone({ ...newZone, nom: e.target.value })}
                      />
                      <Input
                        type="number"
                        placeholder="Prix (FC)"
                        value={newZone.prix || ''}
                        onChange={(e) =>
                          setNewZone({ ...newZone, prix: parseFloat(e.target.value) || 0 })
                        }
                        min={0}
                      />
                      <Button onClick={handleAddZone} className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Limites (pour tous les modes sauf gratuit) */}
            {formData.mode_calcul !== 'gratuit' && (
              <Card>
                <CardHeader>
                  <CardTitle>Limites (optionnel)</CardTitle>
                  <CardDescription>
                    Définissez des montants minimum et maximum
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Montant minimum (FC)</Label>
                      <Input
                        type="number"
                        value={formData.montant_minimum || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            montant_minimum: parseFloat(e.target.value) || 0,
                          })
                        }
                        min={0}
                      />
                      <p className="text-sm text-muted-foreground">
                        Montant minimum facturé
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Montant maximum (FC)</Label>
                      <Input
                        type="number"
                        value={formData.montant_maximum || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            montant_maximum: e.target.value ? parseFloat(e.target.value) : undefined,
                          })
                        }
                        min={0}
                        placeholder="Aucune limite"
                      />
                      <p className="text-sm text-muted-foreground">
                        Montant maximum facturé
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

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
        </div>
      </div>
    </DashboardLayout>
  );
}
