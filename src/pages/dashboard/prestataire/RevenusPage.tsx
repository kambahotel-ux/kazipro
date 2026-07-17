import { useState } from "react";
import { PrestatairePageShell } from "@/components/prestataire/PrestatairePageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Eye, MoreHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAbortableFetch } from "@/hooks/useAbortableFetch";
import { walletApi } from "@/lib/api";
import { parsePaginatedMeta, unwrapPaginated } from "@/lib/api-utils";
import { displayNameFromProfil, getProfil } from "@/lib/kazipro-profile";
import { toast } from "sonner";
import { AdminListSkeleton } from "@/components/dashboard/AdminLoadingSkeleton";
import { PrestataireEmptyState } from "@/components/prestataire/PrestataireEmptyState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Paiement {
  id: string;
  numero: string;
  contrat_id: string;
  devis_id: string;
  client_id: string;
  prestataire_id: string;
  type_paiement: string;
  montant_total: number;
  methode_paiement: string;
  statut: string;
  date_paiement: string | null;
  transaction_id: string | null;
  reference_paiement: string | null;
  created_at: string;
  clients?: {
    full_name: string;
  };
  contrats?: {
    numero: string;
  };
}

export default function RevenusPage({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuth();
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaiement, setSelectedPaiement] = useState<Paiement | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalPaiements, setTotalPaiements] = useState(0);
  const PAGE_SIZE = 20;

  const providerDisplayName = user
    ? displayNameFromProfil(getProfil(user) ?? {}, user.name || "Prestataire")
    : "Prestataire";

  useAbortableFetch(Boolean(user), [user, page, searchTerm, filterStatus], async (signal) => {
    if (!user || signal.aborted) return;
    await fetchPaiements(page, signal);
  });

  const fetchPaiements = async (targetPage = 1, signal?: AbortSignal) => {
    if (!user) return;
    try {
      setLoading(true);
      const mouvements = await walletApi.mouvements({
        page: targetPage,
        per_page: PAGE_SIZE,
        search: searchTerm.trim() || undefined,
        statut: filterStatus !== "all" ? filterStatus : undefined,
      });
      const meta = parsePaginatedMeta(mouvements);
      const rows = unwrapPaginated<Record<string, unknown>>(mouvements);
      setPaiements(rows.map((p) => ({
        id: String(p.id ?? ''),
        numero: String(p.numero ?? p.reference ?? ''),
        contrat_id: String(p.contrat_id ?? ''),
        devis_id: String(p.devis_id ?? ''),
        client_id: String(p.client_id ?? ''),
        prestataire_id: String(p.prestataire_id ?? ''),
        type_paiement: String(p.type_paiement ?? p.type ?? ''),
        montant_total: Number(p.montant_total ?? p.montant ?? p.montant_net_prestataire ?? 0),
        methode_paiement: String(p.methode_paiement ?? ''),
        statut: String(p.statut ?? ''),
        date_paiement: p.date_paiement ? String(p.date_paiement) : null,
        transaction_id: p.transaction_id ? String(p.transaction_id) : null,
        reference_paiement: p.reference_paiement ? String(p.reference_paiement) : null,
        created_at: String(p.created_at ?? ''),
        clients: { full_name: displayNameFromProfil(p.client as Record<string, unknown> ?? {}, 'Client') },
        contrats: { numero: String((p.contrat as { numero?: string })?.numero ?? '') },
      })) as Paiement[]);
      setPage(meta.current_page || targetPage);
      setLastPage(Math.max(1, meta.last_page || 1));
      setTotalPaiements(meta.total ?? rows.length);
    } catch (error: unknown) {
      if (signal?.aborted) return;
      toast.error(error instanceof Error ? error.message : "Erreur lors du chargement des revenus");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  const filteredPaiements = paiements;
  const hasActiveFilters = searchTerm.trim().length > 0 || filterStatus !== "all";

  const resetFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setPage(1);
  };

  if (loading) {
    return (
      <PrestatairePageShell embedded={embedded} userName={providerDisplayName} userRole="Prestataire">
        <div className="space-y-6">
          {!embedded && (
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Mes Revenus</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Suivi de vos revenus et paiements</p>
          </div>
          )}
          <AdminListSkeleton items={4} />
        </div>
      </PrestatairePageShell>
    );
  }

  return (
    <PrestatairePageShell embedded={embedded} userName={providerDisplayName} userRole="Prestataire">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          {!embedded && (
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Mes Revenus</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Suivi de vos revenus et paiements</p>
          </div>
          )}
          <Button variant="outline" className={`text-sm ${embedded ? 'ml-auto' : ''}`}>
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Exporter</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters((v) => !v)}
            className="gap-2"
          >
            <Search className="w-4 h-4" />
            {showFilters ? "Masquer les filtres" : "Afficher les filtres"}
          </Button>
          {hasActiveFilters && !showFilters ? (
            <Badge variant="secondary">{totalPaiements} résultat(s)</Badge>
          ) : null}
        </div>
        {showFilters ? (
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Rechercher une transaction..."
                    className="pl-10 text-sm"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="valide">Validés</SelectItem>
                    <SelectItem value="en_cours">En cours</SelectItem>
                    <SelectItem value="echoue">Échoués</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {hasActiveFilters ? (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Réinitialiser les filtres
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {paiements.length === 0 ? (
          <PrestataireEmptyState
            context="revenus"
            hasActiveFilters={hasActiveFilters}
            onResetFilters={resetFilters}
          />
        ) : (
          /* Transactions Table */
          <Card>
            <CardHeader>
              <CardTitle>Historique des paiements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Numéro</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Client</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Montant</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Méthode</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPaiements.map((paiement) => (
                      <tr key={paiement.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4 text-sm font-mono">{paiement.numero}</td>
                        <td className="py-3 px-4 text-sm">{paiement.clients?.full_name || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm capitalize">
                          {paiement.type_paiement === 'acompte' ? 'Acompte' : paiement.type_paiement}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-medium text-primary">
                          {paiement.montant_total.toLocaleString()} FC
                        </td>
                        <td className="py-3 px-4 text-sm capitalize">
                          {paiement.methode_paiement.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {new Date(paiement.date_paiement || paiement.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={
                            paiement.statut === "valide" ? "default" : 
                            paiement.statut === "en_cours" ? "secondary" : 
                            "destructive"
                          }>
                            {paiement.statut === "valide" ? "Validé" : 
                             paiement.statut === "en_cours" ? "En cours" : 
                             "Échoué"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => {
                                  setSelectedPaiement(paiement);
                                  setShowDetailsModal(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                                Voir détails
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {page} sur {lastPage} ({totalPaiements} paiement(s))
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= lastPage}
                    onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  >
                    Suivant
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedPaiement && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Détails du paiement</CardTitle>
                <Button variant="ghost" onClick={() => setShowDetailsModal(false)}>✕</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Numéro de paiement</p>
                    <p className="font-mono text-sm">{selectedPaiement.numero}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="font-medium">{selectedPaiement.clients?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contrat</p>
                    <p className="font-medium">{selectedPaiement.contrats?.numero || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type de paiement</p>
                    <p className="font-medium capitalize">
                      {selectedPaiement.type_paiement === 'acompte' ? 'Acompte (30%)' : selectedPaiement.type_paiement}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Montant</p>
                    <p className="text-2xl font-bold text-primary">{selectedPaiement.montant_total.toLocaleString()} FC</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Méthode de paiement</p>
                    <p className="font-medium capitalize">{selectedPaiement.methode_paiement.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {new Date(selectedPaiement.date_paiement || selectedPaiement.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  {(selectedPaiement.transaction_id || selectedPaiement.reference_paiement) && (
                    <div>
                      <p className="text-sm text-muted-foreground">Référence de transaction</p>
                      <p className="font-mono text-xs bg-muted p-2 rounded">
                        {selectedPaiement.transaction_id || selectedPaiement.reference_paiement}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Statut</p>
                    <Badge variant={selectedPaiement.statut === "valide" ? "default" : "secondary"} className="mt-1">
                      {selectedPaiement.statut === "valide" ? "Validé" : "En cours"}
                    </Badge>
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg text-sm">
                  <p className="text-muted-foreground">
                    {selectedPaiement.statut === "valide" 
                      ? "Ce paiement a été validé. Les fonds seront transférés selon les conditions du contrat."
                      : "Ce paiement est en cours de traitement. Vous serez notifié une fois validé."}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowDetailsModal(false)}>
                    Fermer
                  </Button>
                  <Button className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Reçu
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PrestatairePageShell>
  );
}
