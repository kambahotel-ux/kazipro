import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AdminListSkeleton } from "@/components/dashboard/AdminLoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Eye,
  Trash2,
  Ban,
  Mail,
  Calendar,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Phone,
  MapPin,
  ExternalLink,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { parsePaginatedMeta, unwrapPaginated } from "@/lib/api-utils";
import { FormDrawer } from "@/components/ui/FormDrawer";
import { toast } from "sonner";

interface UserRow {
  id: string;
  email: string;
  type: "client" | "prestataire";
  name: string;
  status: "active" | "inactive" | "suspended";
  created_at: string;
  telephone?: string;
  prestataire_id?: number;
  client_id?: number;
}

interface UserDetailProfile {
  id?: number;
  nom?: string;
  prenom?: string;
  telephone?: string;
  ville?: string;
  quartier?: string;
  bio?: string;
  statut_validation?: string;
  motif_rejet?: string;
  profession?: { nom?: string; categorie?: string };
  note_moyenne?: number;
  nb_missions?: number;
}

interface UserDetail {
  id: string;
  name: string;
  email: string;
  telephone?: string;
  type: "client" | "prestataire";
  status: "active" | "inactive" | "suspended";
  created_at?: string;
  email_verified_at?: string;
  prestataire_id?: number;
  client_id?: number;
  profile?: UserDetailProfile | null;
  stats?: Record<string, number>;
}

function apiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message?: string }).message;
    if (msg) return msg;
  }
  return fallback;
}

function statusLabel(status: UserRow["status"]): string {
  if (status === "active") return "Actif";
  if (status === "suspended") return "Suspendu";
  return "Inactif";
}

function statusBadgeClass(status: UserRow["status"]): string {
  if (status === "active") return "bg-green-500/10 text-green-600 border-green-500/20";
  if (status === "suspended") return "bg-red-500/10 text-red-600 border-red-500/20";
  return "bg-gray-500/10 text-gray-600 border-gray-500/20";
}

export default function UsersPage() {
  const PAGE_SIZE = 20;
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "client" | "prestataire">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "suspended">("all");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [suspendMotif, setSuspendMotif] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 250);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterType, filterStatus]);

  const fetchUsers = useCallback(
    async (targetPage = 1) => {
      if (!user) return;
      try {
        setLoading(true);

        const usersRes = await adminApi.getUsers({
          page: targetPage,
          per_page: PAGE_SIZE,
          search: debouncedSearch || undefined,
          type: filterType,
          status: filterStatus,
        });
        const meta = parsePaginatedMeta(usersRes);
        const usersData = unwrapPaginated<Record<string, unknown>>(usersRes);
        const allUsers: UserRow[] = usersData.map((u) => ({
          id: String(u.id),
          name: String(u.name ?? ""),
          email: String(u.email ?? ""),
          telephone: u.telephone != null ? String(u.telephone) : undefined,
          type: String(u.type ?? "client") === "prestataire" ? "prestataire" : "client",
          status:
            String(u.status ?? "active") === "suspended"
              ? "suspended"
              : String(u.status ?? "active") === "inactive"
                ? "inactive"
                : "active",
          created_at: String(u.created_at ?? new Date().toISOString()),
          prestataire_id: u.prestataire_id != null ? Number(u.prestataire_id) : undefined,
          client_id: u.client_id != null ? Number(u.client_id) : undefined,
        }));
        setUsers(allUsers);
        setPage(meta.current_page || targetPage);
        setLastPage(Math.max(1, meta.last_page || 1));
        setTotalUsers(meta.total ?? allUsers.length);
      } catch (error: unknown) {
        toast.error("Erreur lors du chargement des utilisateurs");
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [user, debouncedSearch, filterType, filterStatus],
  );

  useEffect(() => {
    if (user) fetchUsers(page);
  }, [user, page, fetchUsers]);

  const loadDetail = async (userId: string) => {
    try {
      setDetailLoading(true);
      const data = await adminApi.getUser(userId);
      setDetail(data as UserDetail);
    } catch (error: unknown) {
      toast.error(apiErrorMessage(error, "Impossible de charger le profil"));
      setDrawerOpen(false);
      setSelectedUserId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const openExamine = (userId: string) => {
    setSelectedUserId(userId);
    setDrawerOpen(true);
    setSuspendMotif("");
    setDetail(null);
    void loadDetail(userId);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedUserId(null);
    setDetail(null);
    setSuspendMotif("");
  };

  const refreshAfterAction = async () => {
    await fetchUsers(page);
    if (selectedUserId) await loadDetail(selectedUserId);
  };

  const handleSuspend = async (userId: string, fromDrawer = false) => {
    const motif = fromDrawer ? suspendMotif.trim() : "";
    if (!motif) {
      openExamine(userId);
      toast.info("Indiquez un motif de suspension dans le détail du compte.");
      return;
    }
    try {
      setActionLoading(true);
      const res = await adminApi.suspendUser(userId, motif);
      toast.success(res?.message ?? "Compte suspendu");
      setSuspendMotif("");
      await refreshAfterAction();
    } catch (error: unknown) {
      toast.error(apiErrorMessage(error, "Erreur lors de la suspension"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async (userId: string) => {
    try {
      setActionLoading(true);
      const res = await adminApi.reactivateUser(userId);
      toast.success(res?.message ?? "Compte réactivé");
      await refreshAfterAction();
    } catch (error: unknown) {
      toast.error(apiErrorMessage(error, "Erreur lors de la réactivation"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Supprimer définitivement cet utilisateur et son profil ?")) return;
    try {
      setActionLoading(true);
      const res = await adminApi.deleteUser(userId);
      toast.success(res?.message ?? "Utilisateur supprimé");
      closeDrawer();
      await fetchUsers(page);
    } catch (error: unknown) {
      toast.error(apiErrorMessage(error, "Erreur lors de la suppression"));
    } finally {
      setActionLoading(false);
    }
  };

  const ActionMenu = ({ row }: { row: UserRow }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem className="gap-2" onClick={() => openExamine(row.id)}>
          <Eye className="w-4 h-4" />
          Examiner
        </DropdownMenuItem>
        {row.type === "prestataire" && row.status !== "suspended" && (
          <DropdownMenuItem className="gap-2" onClick={() => openExamine(row.id)}>
            <Ban className="w-4 h-4" />
            Suspendre
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="gap-2 text-destructive focus:text-destructive"
          onClick={() => handleDelete(row.id)}
        >
          <Trash2 className="w-4 h-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const initials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <DashboardLayout role="admin" userName="Admin" userRole="Administrateur">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold">Gestion des Utilisateurs</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gérez tous les utilisateurs de la plateforme</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Recherche</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 sm:h-11 text-sm sm:text-base"
              />
            </div>
          </CardContent>
        </Card>

        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2 w-full sm:w-auto">
          <Search className="w-4 h-4" />
          {showFilters ? "Masquer les filtres" : "Afficher les filtres"}
        </Button>

        {showFilters && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Filtres avancés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                  className="px-3 py-2 rounded-lg border border-input bg-background text-sm sm:text-base h-10 sm:h-11"
                >
                  <option value="all">Tous les types</option>
                  <option value="client">Clients</option>
                  <option value="prestataire">Prestataires</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                  className="px-3 py-2 rounded-lg border border-input bg-background text-sm sm:text-base h-10 sm:h-11"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                  <option value="suspended">Suspendu</option>
                </select>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Utilisateurs ({totalUsers})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <AdminListSkeleton items={4} />
            ) : users.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-muted-foreground text-sm sm:text-base">
                Aucun utilisateur trouvé
              </div>
            ) : (
              <>
                <div className="block sm:hidden space-y-3">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="bg-muted/30 p-3 rounded-lg cursor-pointer"
                      onClick={() => openExamine(u.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && openExamine(u.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">{initials(u.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{u.name}</p>
                            <Badge variant={u.type === "client" ? "default" : "secondary"} className="text-xs">
                              {u.type === "client" ? "Client" : "Prestataire"}
                            </Badge>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-xs ${statusBadgeClass(u.status)}`}>
                          {statusLabel(u.status)}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{u.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(u.created_at).toLocaleDateString("fr-FR")}</span>
                        </div>
                      </div>
                      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                        <ActionMenu row={u} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-sm">Utilisateur</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Type</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Statut</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Inscrit</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr
                          key={u.id}
                          className="border-b border-border hover:bg-muted/50 cursor-pointer"
                          onClick={() => openExamine(u.id)}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>{initials(u.name)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm">{u.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={u.type === "client" ? "default" : "secondary"}>
                              {u.type === "client" ? "Client" : "Prestataire"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <span className="truncate max-w-[200px]">{u.email}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={statusBadgeClass(u.status)}>
                              {statusLabel(u.status)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(u.created_at).toLocaleDateString("fr-FR")}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                            <ActionMenu row={u} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {!loading && totalUsers > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t pt-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Page {page} / {lastPage} · {users.length} sur {totalUsers}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= lastPage}
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <FormDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          if (!open) closeDrawer();
        }}
        title={detail?.name ?? "Utilisateur"}
        description="Détail du compte et actions de modération"
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Chargement…
          </div>
        ) : detail ? (
          <div className="space-y-4 sm:space-y-6 pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={detail.type === "client" ? "default" : "secondary"}>
                {detail.type === "client" ? "Client" : "Prestataire"}
              </Badge>
              <Badge variant="outline" className={statusBadgeClass(detail.status)}>
                {statusLabel(detail.status)}
              </Badge>
            </div>

            <div className="bg-muted p-3 sm:p-4 rounded-lg space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium text-sm break-all">{detail.email}</p>
              </div>
              {detail.telephone && (
                <div>
                  <p className="text-xs text-muted-foreground">Téléphone</p>
                  <p className="font-medium text-sm flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {detail.telephone}
                  </p>
                </div>
              )}
              {detail.created_at && (
                <div>
                  <p className="text-xs text-muted-foreground">Inscription</p>
                  <p className="font-medium text-sm">
                    {new Date(detail.created_at).toLocaleString("fr-FR")}
                  </p>
                </div>
              )}
              {detail.profile?.ville && (
                <div>
                  <p className="text-xs text-muted-foreground">Localisation</p>
                  <p className="font-medium text-sm flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {[detail.profile.ville, detail.profile.quartier].filter(Boolean).join(" — ")}
                  </p>
                </div>
              )}
            </div>

            {detail.type === "prestataire" && detail.profile?.profession?.nom && (
              <div className="bg-muted/60 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">Profession</p>
                <p className="font-medium text-sm">{detail.profile.profession.nom}</p>
                {detail.profile.profession.categorie && (
                  <p className="text-xs text-muted-foreground">{detail.profile.profession.categorie}</p>
                )}
              </div>
            )}

            {detail.stats && Object.keys(detail.stats).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(detail.stats).map(([key, value]) => (
                  <div key={key} className="border rounded-lg p-3 text-center">
                    <p className="text-lg font-semibold">{value}</p>
                    <p className="text-xs text-muted-foreground capitalize">{key}</p>
                  </div>
                ))}
              </div>
            )}

            {detail.profile?.motif_rejet && (
              <div className="border border-destructive/30 bg-destructive/5 p-3 rounded-lg">
                <p className="text-xs font-medium text-destructive">Motif de rejet / suspension</p>
                <p className="text-sm mt-1">{detail.profile.motif_rejet}</p>
              </div>
            )}

            {detail.type === "prestataire" && detail.prestataire_id && (
              <Button variant="outline" className="w-full gap-2" asChild>
                <Link to="/dashboard/admin/prestataires">
                  <ExternalLink className="w-4 h-4" />
                  Ouvrir le dossier prestataire complet
                </Link>
              </Button>
            )}

            {detail.type === "prestataire" && detail.status !== "suspended" && (
              <div className="space-y-2 border-t pt-4">
                <Label htmlFor="suspend-motif">Motif de suspension (obligatoire)</Label>
                <Textarea
                  id="suspend-motif"
                  value={suspendMotif}
                  onChange={(e) => setSuspendMotif(e.target.value)}
                  placeholder="Ex. : documents non conformes, comportement inapproprié…"
                  rows={3}
                />
                <Button
                  variant="destructive"
                  className="w-full gap-2"
                  disabled={actionLoading || !suspendMotif.trim()}
                  onClick={() => void handleSuspend(detail.id, true)}
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                  Suspendre le prestataire
                </Button>
              </div>
            )}

            {detail.type === "prestataire" && detail.status === "suspended" && (
              <Button
                className="w-full gap-2"
                disabled={actionLoading}
                onClick={() => void handleReactivate(detail.id)}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Réactiver le compte
              </Button>
            )}

            {detail.type === "client" && (
              <p className="text-xs text-muted-foreground border-t pt-4">
                La suspension via cette page concerne les prestataires. Pour un client, vous pouvez supprimer le compte si nécessaire.
              </p>
            )}

            <Button
              variant="outline"
              className="w-full gap-2 text-destructive hover:text-destructive"
              disabled={actionLoading}
              onClick={() => void handleDelete(detail.id)}
            >
              <Trash2 className="w-4 h-4" />
              Supprimer l&apos;utilisateur
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">Sélectionnez un utilisateur.</p>
        )}
      </FormDrawer>
    </DashboardLayout>
  );
}
