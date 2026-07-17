import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AdminPageSkeleton } from "@/components/dashboard/AdminLoadingSkeleton";
import { AdminSettingsHeader } from "@/components/dashboard/admin/AdminSettingsNav";
import { SettingRow } from "@/components/dashboard/admin/SettingRow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { configPaiementApi } from "@/lib/api";
import {
  ConfigPaiementAdmin,
  DEFAULT_CONFIG_PAIEMENT,
  MODES_PAIEMENT_OPTIONS,
  mapConfigPaiementFromApi,
  mapConfigPaiementToApi,
} from "@/lib/config-paiement";
import { toast } from "sonner";
import { DollarSign, Shield, Clock, AlertCircle, Save, RotateCcw, Loader2, Package } from "lucide-react";

export default function ConfigPaiementPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedConfig, setSavedConfig] = useState<ConfigPaiementAdmin>(DEFAULT_CONFIG_PAIEMENT);
  const [formData, setFormData] = useState<ConfigPaiementAdmin>(DEFAULT_CONFIG_PAIEMENT);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await configPaiementApi.adminGet();
      const mapped = mapConfigPaiementFromApi((data ?? {}) as Record<string, unknown>);
      setSavedConfig(mapped);
      setFormData(mapped);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur chargement config");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await configPaiementApi.adminUpdate(mapConfigPaiementToApi(formData));
      const updated = mapConfigPaiementFromApi(
        ((res as { config?: Record<string, unknown> }).config ?? res ?? formData) as Record<
          string,
          unknown
        >,
      );
      setSavedConfig(updated);
      setFormData(updated);
      toast.success("Configuration paiement enregistrée");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const toggleMode = (mode: string, checked: boolean) => {
    setFormData((prev) => {
      const modes = new Set(prev.modes_paiement);
      if (checked) modes.add(mode);
      else modes.delete(mode);
      return { ...prev, modes_paiement: Array.from(modes) };
    });
  };

  if (loading) {
    return (
      <DashboardLayout role="admin" userName="Admin" userRole="Administrateur">
        <AdminPageSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" userName="Admin" userRole="Administrateur">
      <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-5xl">
        <AdminSettingsHeader
          title="Paiement & escrow"
          description="Commission plateforme, acomptes par défaut, règles de séquestre et modes Mobile Money acceptés."
        />

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Ces paramètres s&apos;appliquent aux nouveaux contrats et paiements. Les contrats existants
            conservent leur répartition escrow enregistrée.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Commission plateforme
            </CardTitle>
            <CardDescription>
              Pourcentage prélevé sur les montants libérés de l&apos;escrow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Taux de commission</Label>
              <span className="text-2xl font-bold text-primary">
                {formData.commission_plateforme_pct}%
              </span>
            </div>
            <Slider
              value={[formData.commission_plateforme_pct]}
              onValueChange={([value]) =>
                setFormData({ ...formData, commission_plateforme_pct: value })
              }
              min={0}
              max={100}
              step={0.5}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Acompte par défaut
            </CardTitle>
            <CardDescription>
              Pourcentage appliqué à chaque nouveau devis et contrat. Ex. 13 % → acompte de 13 % du montant de référence.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Taux d&apos;acompte</Label>
              <span className="text-2xl font-bold text-green-600">
                {formData.acompte_pourcentage_defaut}%
              </span>
            </div>
            <Slider
              value={[formData.acompte_pourcentage_defaut]}
              onValueChange={([value]) =>
                setFormData({ ...formData, acompte_pourcentage_defaut: value })
              }
              min={0}
              max={100}
              step={1}
            />
            <div className="space-y-2">
              <Label>Base de calcul de l&apos;acompte</Label>
              <Select
                value={formData.acompte_base}
                onValueChange={(value: "total_ttc" | "main_oeuvre") =>
                  setFormData({ ...formData, acompte_base: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total_ttc">
                    % du montant total TTC (recommandé)
                  </SelectItem>
                  <SelectItem value="main_oeuvre">
                    % de la main d&apos;œuvre uniquement
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {formData.acompte_base === "total_ttc"
                  ? `Sur un devis de 1 000 $, l'acompte sera ${formData.acompte_pourcentage_defaut}% = ${(1000 * formData.acompte_pourcentage_defaut) / 100} $.`
                  : `L'acompte sera ${formData.acompte_pourcentage_defaut}% de la part main d'œuvre seulement (le % affiché sur le total peut être plus bas).`}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Solde au contrat : {100 - formData.acompte_pourcentage_defaut}% du total TTC (montant exact calculé à l&apos;acceptation du devis).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Règles escrow
            </CardTitle>
            <CardDescription>Éléments du devis séquestrés avant libération au prestataire</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <SettingRow
              label="Main d'œuvre en escrow"
              description="Séquestrer les lignes main d'œuvre du devis."
              checked={formData.escrow_main_oeuvre}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, escrow_main_oeuvre: checked })
              }
            />

            {formData.escrow_main_oeuvre && (
              <div className="space-y-3 pl-2 border-l-2 border-muted">
                <div className="flex justify-between items-center">
                  <Label>% minimum main d&apos;œuvre séquestré</Label>
                  <span className="font-bold">{formData.escrow_main_oeuvre_pct_min}%</span>
                </div>
                <Slider
                  value={[formData.escrow_main_oeuvre_pct_min]}
                  onValueChange={([value]) =>
                    setFormData({ ...formData, escrow_main_oeuvre_pct_min: value })
                  }
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
            )}

            <Separator />

            <SettingRow
              label="Transport en escrow"
              description="Séquestrer les frais de transport."
              checked={formData.escrow_transport}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, escrow_transport: checked })
              }
            />

            <SettingRow
              label="Montant total du devis"
              description="Séquestrer l'intégralité du montant (lignes « autre »)."
              checked={formData.escrow_montant_devis_total}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, escrow_montant_devis_total: checked })
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Libération automatique
            </CardTitle>
            <CardDescription>
              Délai après validation mission avant libération escrow (commande artisan{" "}
              <code className="text-xs">escrow:auto-release</code>)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-4 items-center">
              <Input
                type="number"
                value={formData.delai_liberation_jours ?? ""}
                placeholder="Désactivé"
                onChange={(e) => {
                  const v = e.target.value.trim();
                  setFormData({
                    ...formData,
                    delai_liberation_jours: v === "" ? null : Math.max(1, parseInt(v, 10) || 1),
                  });
                }}
                min={1}
                className="w-32"
              />
              <span className="text-muted-foreground">jours (vide = manuel uniquement)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modes de paiement acceptés</CardTitle>
            <CardDescription>Modes proposés aux clients lors du paiement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {MODES_PAIEMENT_OPTIONS.map(({ value, label }) => (
              <div key={value} className="flex items-center gap-3">
                <Checkbox
                  id={`mode-${value}`}
                  checked={formData.modes_paiement.includes(value)}
                  onCheckedChange={(checked) => toggleMode(value, checked === true)}
                />
                <Label htmlFor={`mode-${value}`} className="font-normal cursor-pointer">
                  {label}
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Location matériel
            </CardTitle>
            <CardDescription>
              Escrow loyer/caution, commission location, modération des annonces et limites vidéo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <SettingRow
              label="Loyer en escrow"
              description="Séquestrer le loyer jusqu'à la fin de la location."
              checked={formData.escrow_location_loyer}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, escrow_location_loyer: checked })
              }
            />
            <SettingRow
              label="Caution obligatoire"
              description="Exiger une caution sur chaque réservation."
              checked={formData.escrow_caution_obligatoire}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, escrow_caution_obligatoire: checked })
              }
            />
            <SettingRow
              label="Frais livraison en escrow"
              description="Séquestrer les frais de livraison loueur."
              checked={formData.escrow_livraison_materiel}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, escrow_livraison_materiel: checked })
              }
            />
            <div className="space-y-2">
              <Label>Libération frais livraison</Label>
              <Select
                value={formData.escrow_livraison_liberation}
                onValueChange={(value: "remise" | "retour") =>
                  setFormData({ ...formData, escrow_livraison_liberation: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remise">À la remise du matériel</SelectItem>
                  <SelectItem value="retour">Au retour validé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <Label>Commission location</Label>
              <span className="text-xl font-bold text-primary">
                {formData.commission_location_pct}%
              </span>
            </div>
            <Slider
              value={[formData.commission_location_pct]}
              onValueChange={([value]) =>
                setFormData({ ...formData, commission_location_pct: value })
              }
              min={0}
              max={30}
              step={0.5}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Caution % défaut</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.caution_pct_defaut}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      caution_pct_defaut: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Plancher caution (FC)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.caution_plancher_fc}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      caution_plancher_fc: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Caution % min</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.caution_pct_min}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      caution_pct_min: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Caution % max</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.caution_pct_max}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      caution_pct_max: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Plafond caution (FC)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.caution_plafond_fc}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      caution_plafond_fc: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Inspection retour (jours)</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.delai_inspection_retour_jours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      delai_inspection_retour_jours: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                />
              </div>
            </div>

            <Separator />

            <SettingRow
              label="Modération des médias"
              description="Les annonces passent en file d'attente avant publication."
              checked={formData.moderation_medias_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, moderation_medias_active: checked })
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Vidéo max annonce (Mo)</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.video_max_mo_annonce}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      video_max_mo_annonce: Number(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Vidéo max checklist (Mo)</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.video_max_mo_checklist}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      video_max_mo_checklist: Number(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Durée max vidéo (s)</Label>
                <Input
                  type="number"
                  min={5}
                  value={formData.video_duree_max_secondes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      video_duree_max_secondes: Number(e.target.value) || 60,
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 sticky bottom-4 bg-background p-4 rounded-lg border shadow-lg">
          <Button onClick={handleSave} disabled={saving} size="lg" className="flex-1">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
            onClick={() => {
              setFormData(savedConfig);
              toast.info("Modifications annulées");
            }}
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
