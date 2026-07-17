import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AdminPageSkeleton } from "@/components/dashboard/AdminLoadingSkeleton";
import { AdminSettingsHeader } from "@/components/dashboard/admin/AdminSettingsNav";
import { SettingField, SettingRow } from "@/components/dashboard/admin/SettingRow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminApi } from "@/lib/api";
import {
  ConfigNotificationsAdmin,
  DEFAULT_CONFIG_NOTIFICATIONS,
  buildConfigNotificationsPayload,
  unwrapConfigNotificationsResponse,
} from "@/lib/config-notifications";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  Info,
  MessageCircle,
  Send,
  CheckCircle2,
  Circle,
  Radio,
  Megaphone,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TabId = "connexion" | "test" | "broadcast" | "avance";

function SetupChecklist({
  form,
  saved,
}: {
  form: ConfigNotificationsAdmin;
  saved: ConfigNotificationsAdmin;
}) {
  const steps = [
    {
      done: !!form.sendflow_enabled,
      label: "Sendflow activé",
    },
    {
      done: saved.sendflow_token_configured || !!form.sendflow_token,
      label: "Token API renseigné",
    },
    {
      done: !!form.sendflow_instance_phone?.trim(),
      label: "Numéro instance WhatsApp",
    },
    {
      done:
        form.sendflow_enabled &&
        (saved.sendflow_token_configured || !!form.sendflow_token) &&
        !!form.sendflow_instance_phone?.trim(),
      label: "Prêt pour un test d'envoi",
    },
  ];

  return (
    <Card className="bg-muted/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Checklist de mise en route</CardTitle>
        <CardDescription>
          Suivez ces étapes dans l&apos;ordre avant d&apos;activer le broadcast en production.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {steps.map((step, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              {step.done ? (
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className={cn(step.done ? "text-foreground" : "text-muted-foreground")}>
                {step.label}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function ConfigNotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState<ConfigNotificationsAdmin>(DEFAULT_CONFIG_NOTIFICATIONS);
  const [form, setForm] = useState<ConfigNotificationsAdmin>(DEFAULT_CONFIG_NOTIFICATIONS);
  const [testPhone, setTestPhone] = useState("");
  const [testImageUrl, setTestImageUrl] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("connexion");

  const sendflowReady =
    form.sendflow_enabled && saved.sendflow_token_configured && !!form.sendflow_instance_phone;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await adminApi.getConfigNotifications();
        const cfg = unwrapConfigNotificationsResponse(data);
        setSaved(cfg);
        setForm(cfg);
        setTestPhone(cfg.sendflow_override_phone || "");
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : "Erreur chargement");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "test" || hash === "test-whatsapp") {
      setActiveTab("test");
      requestAnimationFrame(() => {
        document.getElementById("test-whatsapp")?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [loading]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await adminApi.updateConfigNotifications(buildConfigNotificationsPayload(form));
      const updated = unwrapConfigNotificationsResponse(res);
      setSaved(updated);
      setForm({ ...updated, sendflow_token: "", sendflow_code_organisme: "" });
      toast.success("Configuration enregistrée");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleTestWhatsApp = async () => {
    try {
      setTesting(true);
      const res = await adminApi.testWhatsApp({
        phone: testPhone || undefined,
        title: "KaziPro — test admin",
        body: `Test WhatsApp depuis l'admin le ${new Date().toLocaleString("fr-FR")}.`,
        image_url: testImageUrl || undefined,
      });
      toast.success((res as { message?: string })?.message ?? "Message envoyé");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Échec envoi test");
    } finally {
      setTesting(false);
    }
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
      <div className="max-w-3xl mx-auto space-y-6">
        <AdminSettingsHeader
          title="Notifications & WhatsApp"
          description="Connectez Sendflow, testez les envois, puis configurez les alertes automatiques et le broadcast des demandes publiques."
        >
          <Badge
            variant={sendflowReady ? "default" : "secondary"}
            className="gap-1 shrink-0 self-start"
          >
            {sendflowReady ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <Circle className="h-3 w-3" />
            )}
            {sendflowReady ? "Connexion OK" : "Configuration incomplète"}
          </Badge>
        </AdminSettingsHeader>

        <SetupChecklist form={form} saved={saved} />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1">
            <TabsTrigger value="connexion" className="gap-1.5 py-2">
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Connexion</span>
              <span className="xs:hidden">API</span>
            </TabsTrigger>
            <TabsTrigger value="test" className="gap-1.5 py-2">
              <Send className="h-3.5 w-3.5" />
              Tester
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="gap-1.5 py-2">
              <Megaphone className="h-3.5 w-3.5" />
              Broadcast
            </TabsTrigger>
            <TabsTrigger value="avance" className="gap-1.5 py-2">
              <Wrench className="h-3.5 w-3.5" />
              Avancé
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connexion" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Connexion Sendflow</CardTitle>
                <CardDescription>
                  Identifiants fournis par Kamba Chat Meet pour envoyer les messages WhatsApp.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <SettingRow
                  label="Activer Sendflow"
                  description="Coupe tous les envois WhatsApp si désactivé."
                  checked={!!form.sendflow_enabled}
                  onCheckedChange={(v) => setForm({ ...form, sendflow_enabled: v })}
                />

                <SettingField
                  label="URL de l'API Sendflow"
                  description="Adresse de base de votre instance (ex. https://sendflow.example.com)."
                >
                  <Input
                    id="sendflow_base_url"
                    value={form.sendflow_base_url}
                    onChange={(e) => setForm({ ...form, sendflow_base_url: e.target.value })}
                  />
                </SettingField>

                <SettingField
                  label="Token API"
                  description={
                    saved.sendflow_token_configured
                      ? "Un token est déjà enregistré — laissez vide pour le conserver."
                      : "Collez le token syt_... fourni par Sendflow."
                  }
                >
                  <Input
                    id="sendflow_token"
                    type="password"
                    autoComplete="off"
                    placeholder={saved.sendflow_token_configured ? "••••••••" : "syt_..."}
                    value={form.sendflow_token ?? ""}
                    onChange={(e) => setForm({ ...form, sendflow_token: e.target.value })}
                  />
                </SettingField>

                <SettingField
                  label="Numéro de l'instance WhatsApp"
                  description="Numéro connecté à Sendflow, format international sans + (ex. 243975024769)."
                >
                  <Input
                    id="sendflow_instance_phone"
                    placeholder="243975024769"
                    value={form.sendflow_instance_phone}
                    onChange={(e) => setForm({ ...form, sendflow_instance_phone: e.target.value })}
                  />
                </SettingField>

                <SettingRow
                  label="WhatsApp sur les notifications app"
                  description="Devis, missions, changements de statut — en plus des alertes in-app."
                  checked={!!form.sendflow_notify_app}
                  onCheckedChange={(v) => setForm({ ...form, sendflow_notify_app: v })}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test" className="mt-6 space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Enregistrez d&apos;abord la connexion Sendflow, puis envoyez un test. Pour une image,
                utilisez une URL <strong>https</strong> accessible publiquement (ex. photo stockée sur
                l&apos;API).
              </AlertDescription>
            </Alert>

            <Card id="test-whatsapp" className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Envoyer un message test
                </CardTitle>
                <CardDescription>
                  Texte seul ou image avec légende — un seul message WhatsApp.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SettingField
                  label="Numéro destinataire"
                  description="Laissez vide pour utiliser le numéro de test (override) si configuré."
                >
                  <Input
                    id="test_phone"
                    placeholder={form.sendflow_override_phone || "243XXXXXXXXX"}
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                  />
                </SettingField>

                <SettingField
                  label="URL image (optionnel)"
                  description="Photo jointe au message — doit être accessible par Sendflow."
                  className="border-0 pb-0"
                >
                  <Input
                    id="test_image"
                    placeholder="https://ms-api-kazi.kazipro.tech/storage/demandes/..."
                    value={testImageUrl}
                    onChange={(e) => setTestImageUrl(e.target.value)}
                  />
                </SettingField>

                <Button
                  type="button"
                  onClick={handleTestWhatsApp}
                  disabled={testing || !form.sendflow_enabled}
                  className="w-full sm:w-auto"
                >
                  {testing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Envoyer le test
                </Button>

                {!form.sendflow_enabled && (
                  <p className="text-xs text-destructive">
                    Activez Sendflow dans l&apos;onglet Connexion avant de tester.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="broadcast" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Radio className="w-5 h-5" />
                  Demandes publiques
                </CardTitle>
                <CardDescription>
                  Quand un client publie une demande, notifier les prestataires du métier et de la
                  zone.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <SettingRow
                  label="Modération admin requise"
                  description="Si activé, un admin doit approuver avant publication. Sinon, la demande est visible immédiatement."
                  checked={!!form.demande_publique_moderation_requise}
                  onCheckedChange={(v) =>
                    setForm({ ...form, demande_publique_moderation_requise: v })
                  }
                />

                <SettingRow
                  label="Activer le broadcast"
                  description="Envoie une notification in-app aux prestataires éligibles."
                  checked={!!form.broadcast_demande_publique_enabled}
                  onCheckedChange={(v) =>
                    setForm({ ...form, broadcast_demande_publique_enabled: v })
                  }
                />

                <SettingRow
                  label="Inclure WhatsApp"
                  description="Envoie aussi un message WhatsApp avec les photos de la demande."
                  checked={!!form.broadcast_demande_publique_whatsapp}
                  disabled={!form.broadcast_demande_publique_enabled}
                  onCheckedChange={(v) =>
                    setForm({ ...form, broadcast_demande_publique_whatsapp: v })
                  }
                />

                <SettingField
                  label="Nombre max de destinataires"
                  description="Limite le nombre de prestataires notifiés par demande (1–500)."
                >
                  <Input
                    id="max"
                    type="number"
                    min={1}
                    max={500}
                    value={form.broadcast_demande_publique_max ?? 50}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        broadcast_demande_publique_max: Number(e.target.value) || 50,
                      })
                    }
                    className="max-w-[8rem]"
                  />
                </SettingField>

                <SettingRow
                  label="Exiger la ville sur la demande"
                  description="Sans ville, le broadcast ne part pas."
                  checked={!!form.broadcast_demande_publique_require_ville}
                  onCheckedChange={(v) =>
                    setForm({ ...form, broadcast_demande_publique_require_ville: v })
                  }
                />

                <SettingRow
                  label="Prestataires disponibles uniquement"
                  description="Ignore les prestataires marqués indisponibles."
                  checked={!!form.broadcast_demande_publique_require_disponible}
                  onCheckedChange={(v) =>
                    setForm({ ...form, broadcast_demande_publique_require_disponible: v })
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="avance" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Options avancées</CardTitle>
                <CardDescription>
                  Réservé aux tests ou cas particuliers — à laisser vide en production.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <SettingRow
                  label="Authentification par code organisme (JWT)"
                  description="Alternative au token API — rarement nécessaire."
                  checked={!!form.sendflow_use_code_organisme}
                  onCheckedChange={(v) => setForm({ ...form, sendflow_use_code_organisme: v })}
                />

                {form.sendflow_use_code_organisme && (
                  <SettingField label="Code organisme">
                    <Input
                      id="sendflow_code_organisme"
                      type="password"
                      value={form.sendflow_code_organisme ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, sendflow_code_organisme: e.target.value })
                      }
                    />
                  </SettingField>
                )}

                <SettingField
                  label="Numéro de test (override)"
                  description="Redirige tous les WhatsApp vers ce numéro — utile en préprod."
                >
                  <Input
                    id="sendflow_override_phone"
                    placeholder="Laisser vide en production"
                    value={form.sendflow_override_phone}
                    onChange={(e) => setForm({ ...form, sendflow_override_phone: e.target.value })}
                  />
                </SettingField>

                <SettingField
                  label="URLs des médias publics"
                  description="Chemin utilisé pour les images jointes aux messages WhatsApp."
                  className="border-0 pb-0"
                >
                  <Select
                    value={form.public_media_route}
                    onValueChange={(v: "storage" | "fichiers") =>
                      setForm({ ...form, public_media_route: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="storage">/storage/ — recommandé en production</SelectItem>
                      <SelectItem value="fichiers">/api/fichiers/ — route API</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingField>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="sticky bottom-4 flex justify-end pt-2 pb-1">
          <Button onClick={handleSave} disabled={saving} size="lg" className="shadow-lg">
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Enregistrer les modifications
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
