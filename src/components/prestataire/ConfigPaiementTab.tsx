import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useConfigurationGlobale, useConfigurationPrestataire, useSaveConfigurationPrestataire, useFraisDeplacementConfig, useSaveFraisDeplacementConfig } from '@/hooks/usePaiementConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  DollarSign, 
  Shield, 
  Save,
  Info,
  TrendingUp,
  CheckCircle2,
  Car,
  Calculator,
  Plus,
  Trash2,
  MapPin
} from 'lucide-react';
import { ConfigurationPaiementPrestataire, FraisDeplacementConfig, ModeCalculFrais, ZoneFrais } from '@/types/paiement';

export function ConfigPaiementTab() {
  const { user } = useAuth();
  const [prestataireId, setPrestataireId] = useState<string | null>(null);
  const [loadingPrestataireId, setLoadingPrestataireId] = useState(true);
  
  const { config: configGlobale, loading: loadingGlobale } = useConfigurationGlobale();
  const { config: configPrestataire, loading: loadingPrestataire, refetch: refetchConfig } = useConfigurationPrestataire(prestataireId || undefined);
  const { saveConfig, saving: savingConfig } = useSaveConfigurationPrestataire();
  const { config: configFrais, loading: loadingFrais, refetch: refetchFrais } = useFraisDeplacementConfig(prestataireId || undefined);
  const { saveConfig: saveFrais, saving: savingFrais } = useSaveFraisDeplacementConfig();

  // Récupérer l'ID du prestataire depuis la table prestataires
  useEffect(() => {
    const fetchPrestataireId = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('prestataires')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        setPrestataireId(data.id);
      } catch (err) {
        console.error('Erreur récupération prestataire_id:', err);
        toast.error('Impossible de charger votre profil prestataire');
      } finally {
        setLoadingPrestataireId(false);
      }
    };
    
    fetchPrestataireId();
  }, [user?.id]);

  // Config paiement
  const [formDataConfig, setFormDataConfig] = useState<Partial<ConfigurationPaiementPrestataire>>({
    paiement_via_kazipro: true,
    main_oeuvre_via_kazipro: true,
    materiel_via_kazipro: true,
    deplacement_via_kazipro: true,
  });

  // Config frais
  const [formDataFrais, setFormDataFrais] = useState<Partial<FraisDeplacementConfig>>({
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
    if (configPrestataire) {
      setFormDataConfig({
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

  useEffect(() => {
    if (configFrais) {
      setFormDataFrais({
        actif: configFrais.actif,
        mode_calcul: configFrais.mode_calcul,
        montant_fixe: configFrais.montant_fixe,
        prix_par_km: configFrais.prix_par_km,
        distance_gratuite_km: configFrais.distance_gratuite_km,
        zones: configFrais.zones || [],
        montant_minimum: configFrais.montant_minimum,
        montant_maximum: configFrais.montant_maximum,
      });
    }
  }, [configFrais]);

  const handleSaveConfig = async () => {
    if (!prestataireId) return;
    const success = await saveConfig(prestataireId, formDataConfig);
    if (success) refetchConfig();
  };

  const handleSaveFrais = async () => {
    if (!prestataireId) return;
    const success = await saveFrais(prestataireId, formDataFrais);
    if (success) refetchFrais();
  };

  const handleAddZone = () => {
    if (!newZone.nom || newZone.prix <= 0) {
      toast.error('Veuillez remplir le nom et le prix de la zone');
      return;
    }
    setFormDataFrais({
      ...formDataFrais,
      zones: [...(formDataFrais.zones || []), { ...newZone }],
    });
    setNewZone({ nom: '', prix: 0 });
    toast.success('Zone ajoutée');
  };

  const handleRemoveZone = (index: number) => {
    const newZones = [...(formDataFrais.zones || [])];
    newZones.splice(index, 1);
    setFormDataFrais({ ...formDataFrais, zones: newZones });
    toast.success('Zone supprimée');
  };

  const loading = loadingGlobale || loadingPrestataire || loadingFrais || loadingPrestataireId;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!configGlobale) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Impossible de charger la configuration. Contactez l'administrateur.
        </AlertDescription>
      </Alert>
    );
  }

  const commissionTravaux = formDataConfig.commission_main_oeuvre ?? configGlobale.commission_main_oeuvre;
  const commissionMateriel = formDataConfig.commission_materiel ?? configGlobale.commission_materiel;
  const commissionDeplacement = formDataConfig.commission_deplacement ?? configGlobale.commission_deplacement;

  return (
    <Tabs defaultValue="config" className="space-y-4">
      <TabsList>
        <TabsTrigger value="config">Configuration Paiement</TabsTrigger>
        <TabsTrigger value="frais">Frais de Déplacement</TabsTrigger>
      </TabsList>

      {/* Onglet Configuration Paiement */}
      <TabsContent value="config" className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Ces paramètres s'appliquent à tous vos nouveaux devis.
          </AlertDescription>
        </Alert>

        {/* Activation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Paiement via KaziPro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="space-y-1">
                <Label className="text-base font-semibold">
                  Utiliser le paiement KaziPro
                </Label>
                <p className="text-sm text-muted-foreground">
                  {formDataConfig.paiement_via_kazipro
                    ? 'Vos clients peuvent payer via KaziPro (sécurisé)'
                    : 'Vous gérez les paiements directement'}
                </p>
              </div>
              <Switch
                checked={formDataConfig.paiement_via_kazipro}
                onCheckedChange={(checked) =>
                  setFormDataConfig({ ...formDataConfig, paiement_via_kazipro: checked })
                }
                disabled={!configGlobale.permettre_desactivation}
              />
            </div>

            {formDataConfig.paiement_via_kazipro && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  <strong>Avantages:</strong> Paiement sécurisé, acompte avant travaux, protection contre les impayés.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Éléments */}
        {formDataConfig.paiement_via_kazipro && configGlobale.permettre_choix_elements && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Éléments via KaziPro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Main d'œuvre</Label>
                  <p className="text-sm text-muted-foreground">Commission: {commissionTravaux}%</p>
                </div>
                <Switch
                  checked={formDataConfig.main_oeuvre_via_kazipro}
                  onCheckedChange={(checked) =>
                    setFormDataConfig({ ...formDataConfig, main_oeuvre_via_kazipro: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Matériel</Label>
                  <p className="text-sm text-muted-foreground">Commission: {commissionMateriel}%</p>
                </div>
                <Switch
                  checked={formDataConfig.materiel_via_kazipro}
                  onCheckedChange={(checked) =>
                    setFormDataConfig({ ...formDataConfig, materiel_via_kazipro: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Déplacement</Label>
                  <p className="text-sm text-muted-foreground">Commission: {commissionDeplacement}%</p>
                </div>
                <Switch
                  checked={formDataConfig.deplacement_via_kazipro}
                  onCheckedChange={(checked) =>
                    setFormDataConfig({ ...formDataConfig, deplacement_via_kazipro: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Button onClick={handleSaveConfig} disabled={savingConfig} className="w-full">
          {savingConfig ? 'Enregistrement...' : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </>
          )}
        </Button>
      </TabsContent>

      {/* Onglet Frais de Déplacement */}
      <TabsContent value="frais" className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Les frais de déplacement sont optionnels.
          </AlertDescription>
        </Alert>

        {/* Activation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Activer les frais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <Label className="text-base font-semibold">Frais de déplacement</Label>
              <Switch
                checked={formDataFrais.actif}
                onCheckedChange={(checked) =>
                  setFormDataFrais({ ...formDataFrais, actif: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Mode de calcul */}
        {formDataFrais.actif && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Mode de calcul
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={formDataFrais.mode_calcul}
                  onValueChange={(value: ModeCalculFrais) =>
                    setFormDataFrais({ ...formDataFrais, mode_calcul: value })
                  }
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fixe" id="fixe" />
                      <Label htmlFor="fixe">Montant fixe</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="par_km" id="par_km" />
                      <Label htmlFor="par_km">Par kilomètre</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="par_zone" id="par_zone" />
                      <Label htmlFor="par_zone">Par zone</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="gratuit" id="gratuit" />
                      <Label htmlFor="gratuit">Gratuit</Label>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Configuration selon le mode */}
            {formDataFrais.mode_calcul === 'fixe' && (
              <Card>
                <CardHeader>
                  <CardTitle>Montant fixe</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    type="number"
                    value={formDataFrais.montant_fixe || 0}
                    onChange={(e) =>
                      setFormDataFrais({ ...formDataFrais, montant_fixe: parseFloat(e.target.value) || 0 })
                    }
                    min={0}
                  />
                </CardContent>
              </Card>
            )}

            {formDataFrais.mode_calcul === 'par_km' && (
              <Card>
                <CardHeader>
                  <CardTitle>Tarif au kilomètre</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Prix par km (FC)</Label>
                    <Input
                      type="number"
                      value={formDataFrais.prix_par_km || 0}
                      onChange={(e) =>
                        setFormDataFrais({ ...formDataFrais, prix_par_km: parseFloat(e.target.value) || 0 })
                      }
                      min={0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Distance gratuite (km)</Label>
                    <Input
                      type="number"
                      value={formDataFrais.distance_gratuite_km || 0}
                      onChange={(e) =>
                        setFormDataFrais({ ...formDataFrais, distance_gratuite_km: parseFloat(e.target.value) || 0 })
                      }
                      min={0}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {formDataFrais.mode_calcul === 'par_zone' && (
              <Card>
                <CardHeader>
                  <CardTitle>Zones géographiques</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formDataFrais.zones && formDataFrais.zones.length > 0 && (
                    <div className="space-y-2">
                      {formDataFrais.zones.map((zone, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-semibold">{zone.nom}</p>
                            <p className="text-sm text-muted-foreground">{zone.prix.toLocaleString()} FC</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveZone(index)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Separator />
                  <div className="space-y-3">
                    <Label>Ajouter une zone</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Nom"
                        value={newZone.nom}
                        onChange={(e) => setNewZone({ ...newZone, nom: e.target.value })}
                      />
                      <Input
                        type="number"
                        placeholder="Prix"
                        value={newZone.prix || ''}
                        onChange={(e) => setNewZone({ ...newZone, prix: parseFloat(e.target.value) || 0 })}
                      />
                      <Button onClick={handleAddZone}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <Button onClick={handleSaveFrais} disabled={savingFrais} className="w-full">
          {savingFrais ? 'Enregistrement...' : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </>
          )}
        </Button>
      </TabsContent>
    </Tabs>
  );
}
