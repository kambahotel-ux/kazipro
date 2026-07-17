import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FormDrawer,
} from "@/components/ui/FormDrawer";
import { SlideToConfirm } from "@/components/ui/SlideToConfirm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader,
  Scale,
  Plus,
  ChevronRight,
  FileText,
  Info,
} from "lucide-react";
import { litigesApi, contratsApi } from "@/lib/api";
import { unwrapPaginated } from "@/lib/api-utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  clientIdFromUser,
  displayNameFromProfil,
  prestataireIdFromUser,
} from "@/lib/kazipro-profile";
import { toast } from "sonner";
import { LitigesPageSkeleton } from "@/components/dashboard/AdminLoadingSkeleton";

export type LitigesRole = "client" | "prestataire";

const CATEGORIE_OPTIONS: { value: string; label: string }[] = [
  { value: "qualite_travaux", label: "Qualité des travaux" },
  { value: "delai", label: "Délais / planification" },
  { value: "paiement", label: "Paiement ou facturation" },
  { value: "materiel", label: "Matériel / fournitures" },
  { value: "autre", label: "Autre" },
];

function statutLitigeBadge(statut?: string): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  const s = String(statut ?? "").toLowerCase();
  switch (s) {
    case "ouvert":
    case "open":
      return { label: "Ouvert", variant: "secondary" };
    case "en_cours":
    case "in_progress":
      return { label: "En traitement", variant: "default" };
    case "resolu":
    case "resolved":
    case "closed":
      return { label: "Résolu", variant: "outline" };
    case "escalated":
      return { label: "Escaladé", variant: "destructive" };
    default:
      return { label: statut || "Inconnu", variant: "secondary" };
  }
}

function categorieLabel(v?: string) {
  return CATEGORIE_OPTIONS.find((c) => c.value === v)?.label ?? v ?? "—";
}

interface ContratMini {
  id: string;
  numero?: string;
  devis_id?: string | null;
  client_id?: string;
  prestataire_id?: string;
  mission?: { id: string | number } | null;
  mission_id?: string | number;
  prestataire?: { nom?: string; prenom?: string; user?: { name?: string } };
  client?: { nom?: string; prenom?: string; user?: { name?: string } };
}

interface LitigeRow {
  id: string;
  numero?: string | null;
  titre?: string;
  sujet?: string;
  description: string;
  categorie?: string | null;
  statut?: string | null;
  contrat_id?: string | null;
  mission_id?: string | number;
  mission?: {
    contrat?: ContratMini;
    prestataire?: ContratMini["prestataire"];
    client?: ContratMini["client"];
  };
  resolution?: string | null;
  decision?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  resolu_at?: string | null;
  date_resolution?: string | null;
  counterparty_name?: string;
}

interface UserLitigesViewProps {
  role: LitigesRole;
  embedded?: boolean;
}

function LitigesShell({
  role,
  embedded,
  userName,
  children,
}: {
  role: LitigesRole;
  embedded?: boolean;
  userName: string;
  children: React.ReactNode;
}) {
  if (role === "prestataire" && embedded) {
    return <div className="min-w-0">{children}</div>;
  }
  return (
    <DashboardLayout
      role={role}
      userName={userName}
      userRole={role === "client" ? "Client" : "Prestataire"}
    >
      {children}
    </DashboardLayout>
  );
}

export function UserLitigesView({ role, embedded = false }: UserLitigesViewProps) {
  const { user } = useAuth();
  const [personName, setPersonName] = useState(role === "client" ? "Client" : "Prestataire");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [litiges, setLitiges] = useState<LitigeRow[]>([]);
  const [contrats, setContrats] = useState<ContratMini[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingContrats, setLoadingContrats] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newContratId, setNewContratId] = useState<string>("");
  const [newTitre, setNewTitre] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategorie, setNewCategorie] = useState<string>("qualite_travaux");

  const [detailLitige, setDetailLitige] = useState<LitigeRow | null>(null);

  const loadProfile = async () => {
    if (!user) return null;
    const pid = role === "client" ? clientIdFromUser(user) : prestataireIdFromUser(user);
    if (pid) setProfileId(pid);
    const name = displayNameFromProfil(user.profil as Record<string, unknown> | null, user.name);
    if (name) setPersonName(name);
    return pid;
  };

  const mapLitigeRow = (row: LitigeRow): LitigeRow => {
    const mission = row.mission;
    const cp =
      role === "client"
        ? displayNameFromProfil((mission?.prestataire ?? null) as Record<string, unknown> | null)
        : displayNameFromProfil((mission?.client ?? null) as Record<string, unknown> | null);
    return {
      ...row,
      titre: row.titre ?? row.sujet ?? "",
      counterparty_name: cp,
    };
  };

  const fetchLitiges = async (_pid: string) => {
    const res = await litigesApi.getAll({ per_page: 20 });
    const base = unwrapPaginated<LitigeRow>(res).map(mapLitigeRow);
    setLitiges(base);
  };

  const fetchContrats = async (_pid: string) => {
    try {
      setLoadingContrats(true);
      const res = await contratsApi.getAll({ per_page: 30 });
      const rows = unwrapPaginated<ContratMini>(res);
      setContrats(
        rows.map((c) => ({
          ...c,
          mission_id: c.mission?.id ?? c.mission_id,
        })),
      );
    } catch (error) {
      console.warn("Contrats pour litiges:", error);
      setContrats([]);
    } finally {
      setLoadingContrats(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      if (!user) return;
      setLoading(true);
      try {
        const pid = await loadProfile();
        if (cancelled || !pid) {
          setLitiges([]);
          setContrats([]);
          return;
        }
        await fetchLitiges(pid);
      } catch (e) {
        console.error(e);
        toast.error("Impossible de charger les litiges. Vérifiez vos droits ou la table litiges.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    boot();
    return () => {
      cancelled = true;
    };
  }, [user, role]);

  const resetForm = () => {
    setNewContratId(contrats[0]?.id ?? "");
    setNewTitre("");
    setNewDescription("");
    setNewCategorie("qualite_travaux");
  };

  useEffect(() => {
    if (createOpen && profileId && contrats.length === 0) {
      void fetchContrats(profileId);
    }
  }, [createOpen, profileId, contrats.length]);

  useEffect(() => {
    if (createOpen && contrats.length && !newContratId) {
      setNewContratId(contrats[0].id);
    }
  }, [createOpen, contrats, newContratId]);

  const handleCreateLitige = async () => {
    if (!user || !profileId) {
      toast.error("Profil introuvable.");
      return;
    }
    if (!newContratId || !newTitre.trim() || newDescription.trim().length < 10) {
      toast.error("Sélectionnez un contrat, un titre et une description (≥ 10 caractères).");
      return;
    }

    const c = contrats.find((x) => x.id === newContratId);
    if (!c) {
      toast.error("Contrat invalide.");
      return;
    }

    const missionId = c.mission?.id ?? c.mission_id;
    if (!missionId) {
      toast.error("Aucune mission associée à ce contrat.");
      return;
    }

    setSaving(true);
    try {
      await litigesApi.create({
        mission_id: missionId,
        sujet: newTitre.trim(),
        description: newDescription.trim(),
      });

      toast.success("Litige ouvert. KaziPro traitera votre demande dans les meilleurs délais.");
      setCreateOpen(false);
      resetForm();
      await fetchLitiges(profileId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur à la création";
      const lower = msg.toLowerCase();
      if (lower.includes('failed to fetch') || lower.includes('networkerror')) {
        toast.error(
          "Impossible de joindre l'API KaziPro (Laravel). Lancez le backend et vérifiez VITE_API_URL, ou réessayez après configuration.",
        );
      } else {
        toast.error(msg);
      }
      throw e;
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LitigesShell role={role} embedded={embedded} userName={personName}>
        <LitigesPageSkeleton />
      </LitigesShell>
    );
  }

  return (
    <LitigesShell role={role} embedded={embedded} userName={personName}>
      <div className={embedded ? "space-y-6" : "mx-auto max-w-4xl space-y-6 p-4 md:p-6"}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {!(role === "prestataire" && embedded) && (
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold md:text-2xl font-display">
              <Scale className="h-7 w-7 text-primary shrink-0" />
              Litiges
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Déclarez un désaccord lié à un contrat. Les équipes KaziPro pourront examiner la situation avec les deux parties.
            </p>
          </div>
          )}
          <Button
            disabled={!profileId}
            onClick={() => {
              setCreateOpen(true);
              resetForm();
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ouvrir un litige
          </Button>
          <FormDrawer
            open={createOpen}
            onOpenChange={(o) => {
              setCreateOpen(o);
              if (o) resetForm();
            }}
            title="Ouvrir un litige"
          >
              {loadingContrats ? (
                <div className="flex justify-center py-8">
                  <Loader className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : contrats.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6">
                  Aucun contrat disponible. Un litige ne peut être ouvert qu&apos;avec un contrat existant entre vous et l&apos;autre partie.
                </p>
              ) : (
                <div className="space-y-4 py-2">
                  <div className="flex gap-2 rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      Restez factuel et joignez ensuite les détails utiles aux médiateurs (photos, dates) via vos échanges avec le support si besoin.
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label>Contrat concerné</Label>
                    <Select value={newContratId || undefined} onValueChange={setNewContratId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un contrat" />
                      </SelectTrigger>
                      <SelectContent>
                        {contrats.map((ctr) => (
                          <SelectItem key={ctr.id} value={ctr.id}>
                            {ctr.numero || ctr.id.slice(0, 8)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Select value={newCategorie} onValueChange={setNewCategorie}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Titre</Label>
                    <Input value={newTitre} onChange={(e) => setNewTitre(e.target.value)} placeholder="Résumé court du problème" />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      rows={6}
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Exposez les faits et ce que vous attendez (minimum 10 caractères)."
                    />
                  </div>
                  <SlideToConfirm
                    label="Envoyer la déclaration de litige à KaziPro"
                    hint="Glisser pour envoyer"
                    variant="default"
                    disabled={!newContratId || !newTitre.trim() || newDescription.trim().length < 10}
                    loading={saving}
                    successMessage="Litige ouvert"
                    onConfirm={handleCreateLitige}
                  />
                </div>
              )}
          </FormDrawer>
        </div>

        {litiges.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Vous n&apos;avez pas encore ouvert de litige.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {litiges.map((l) => {
              const badge = statutLitigeBadge(l.statut ?? undefined);
              return (
                <Card key={l.id} className="overflow-hidden hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                        <span className="text-xs font-mono text-muted-foreground">{l.numero || l.id.slice(0, 8)}</span>
                        <Badge variant="outline" className="text-xs">
                          {categorieLabel(l.categorie ?? undefined)}
                        </Badge>
                      </div>
                      <h3 className="font-semibold truncate">{l.titre ?? l.sujet}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{l.description}</p>
                      {l.counterparty_name ? (
                        <p className="text-xs text-muted-foreground mt-2">
                          {role === "client" ? "Prestataire" : "Client"} : {l.counterparty_name}
                        </p>
                      ) : null}
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0" onClick={() => setDetailLitige(l)}>
                      Détails
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <FormDrawer
          open={!!detailLitige}
          onOpenChange={(o) => !o && setDetailLitige(null)}
          title={detailLitige?.titre ?? detailLitige?.sujet ?? "Détail du litige"}
        >
          {detailLitige && (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant={statutLitigeBadge(detailLitige.statut ?? undefined).variant}>
                  {statutLitigeBadge(detailLitige.statut ?? undefined).label}
                </Badge>
                <Badge variant="outline">{categorieLabel(detailLitige.categorie ?? undefined)}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Réf. </span>
                <span className="font-mono">{detailLitige.numero}</span>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Description</p>
                <p className="rounded-md bg-muted p-3 whitespace-pre-wrap">{detailLitige.description}</p>
              </div>
              {detailLitige.resolution ? (
                <div>
                  <p className="text-muted-foreground mb-1">Résolution</p>
                  <p className="rounded-md bg-muted p-3 whitespace-pre-wrap">{detailLitige.resolution}</p>
                </div>
              ) : null}
              {detailLitige.decision ? (
                <div>
                  <p className="text-muted-foreground mb-1">Décision</p>
                  <p className="font-medium">{detailLitige.decision}</p>
                </div>
              ) : null}
              {(detailLitige.created_at ?? detailLitige.date_resolution) && (
                <p className="text-xs text-muted-foreground pt-2">
                  {detailLitige.created_at && <>Ouvert le {new Date(detailLitige.created_at).toLocaleDateString("fr-FR")}</>}
                  {detailLitige.date_resolution && (
                    <> · Clôturé le {new Date(detailLitige.date_resolution).toLocaleDateString("fr-FR")}</>
                  )}
                </p>
              )}
            </div>
          )}
        </FormDrawer>
      </div>
    </LitigesShell>
  );
}

