import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AdminPageSkeleton } from "@/components/dashboard/AdminLoadingSkeleton";
import { AdminSettingsHeader } from "@/components/dashboard/admin/AdminSettingsNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { configPaiementApi, adminApi } from "@/lib/api";
import { mapConfigPaiementFromApi, ConfigPaiementAdmin } from "@/lib/config-paiement";
import {
  ConfigNotificationsAdmin,
  unwrapConfigNotificationsResponse,
} from "@/lib/config-notifications";
import {
  CreditCard,
  Bell,
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  XCircle,
  Send,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

function HealthPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge variant={ok ? "default" : "secondary"} className="gap-1 font-normal">
      {ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {label}
    </Badge>
  );
}

export default function ConfigPage() {
  const [loading, setLoading] = useState(true);
  const [paiement, setPaiement] = useState<ConfigPaiementAdmin | null>(null);
  const [notifications, setNotifications] = useState<ConfigNotificationsAdmin | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [paiementRes, notifRes] = await Promise.all([
          configPaiementApi.adminGet(),
          adminApi.getConfigNotifications(),
        ]);
        setPaiement(mapConfigPaiementFromApi((paiementRes ?? {}) as Record<string, unknown>));
        setNotifications(unwrapConfigNotificationsResponse(notifRes));
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : "Erreur chargement paramètres");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const sendflowReady =
    notifications?.sendflow_enabled &&
    notifications?.sendflow_token_configured &&
    !!notifications?.sendflow_instance_phone;

  if (loading) {
    return (
      <DashboardLayout role="admin" userName="Admin" userRole="Administrateur">
        <AdminPageSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" userName="Admin" userRole="Administrateur">
      <div className="space-y-8 max-w-5xl">
        <AdminSettingsHeader
          title="Paramètres de la plateforme"
          description="Gérez les règles de paiement, les notifications in-app et les messages WhatsApp envoyés aux clients et prestataires."
        />

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="flex flex-col hover:border-primary/30 transition-colors">
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                <CreditCard className="h-5 w-5" />
              </div>
              <CardTitle>Paiement & escrow</CardTitle>
              <CardDescription>
                Commission, acomptes, séquestre des fonds et modes Mobile Money.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              {paiement && (
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li className="flex justify-between gap-2">
                    <span>Commission</span>
                    <span className="font-semibold text-foreground">
                      {paiement.commission_plateforme_pct}%
                    </span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span>Acompte défaut</span>
                    <span className="font-semibold text-foreground">
                      {paiement.acompte_pourcentage_defaut}%
                    </span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span>Escrow actif</span>
                    <span className="font-semibold text-foreground">
                      {paiement.escrow_main_oeuvre || paiement.escrow_transport ? "Oui" : "Non"}
                    </span>
                  </li>
                </ul>
              )}
              <Button asChild className="mt-auto w-full sm:w-auto">
                <Link to="/dashboard/admin/config-paiement">
                  Ouvrir les réglages paiement
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="flex flex-col hover:border-primary/30 transition-colors">
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                <Bell className="h-5 w-5" />
              </div>
              <CardTitle>Notifications & WhatsApp</CardTitle>
              <CardDescription>
                Connexion Sendflow, alertes devis/missions et broadcast des demandes publiques.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <HealthPill ok={!!sendflowReady} label={sendflowReady ? "WhatsApp prêt" : "À configurer"} />
                <HealthPill
                  ok={!!notifications?.broadcast_demande_publique_enabled}
                  label="Broadcast"
                />
              </div>
              {notifications && (
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate font-mono text-xs">
                      {notifications.sendflow_instance_phone || "Instance non renseignée"}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Demandes publiques :{" "}
                      {notifications.demande_publique_moderation_requise
                        ? "modération admin"
                        : "auto-approuvées"}
                    </span>
                  </li>
                </ul>
              )}
              <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                <Button asChild variant="default" className="flex-1">
                  <Link to="/dashboard/admin/config-notifications">
                    Configurer
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link to="/dashboard/admin/config-notifications#test">
                    <Send className="w-4 h-4 mr-2" />
                    Tester WhatsApp
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/30 border-dashed">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Besoin d&apos;aide ?</p>
            <p>
              1. Configurez d&apos;abord <strong>Sendflow</strong> (token + numéro instance).
              2. Utilisez <strong>Tester WhatsApp</strong> avec une image en URL https.
              3. Activez le <strong>broadcast</strong> une fois le test validé.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
