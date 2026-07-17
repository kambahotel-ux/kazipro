import { useState, useEffect, useCallback, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AdminListSkeleton } from "@/components/dashboard/AdminLoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Eye, DollarSign, Calendar, User, Phone, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, paiementsApi } from "@/lib/api";
import { unwrapPaginated } from "@/lib/api-utils";
import { displayNameFromProfil } from "@/lib/kazipro-profile";
import { toast } from "sonner";
import { SlideToConfirm } from "@/components/ui/SlideToConfirm";
import { FormDrawer } from "@/components/ui/FormDrawer";
import { DateRangeFilter } from "@/components/filters/DateRangeFilter";

interface Transaction {
  id: string;
  reference: string;
  montant: number;
  type: string;
  statut: "completed" | "pending" | "failed" | "refunded";
  methode?: string;
  reference_externe?: string;
  paye_at?: string;
  libere_at?: string;
  created_at: string;
  client_name: string;
  client_phone?: string;
  client_ville?: string;
  prestataire_name: string;
  prestataire_phone?: string;
  prestataire_ville?: string;
  contrat_numero?: string;
  contrat_montant_ttc?: number;
  contrat_acompte?: number;
  contrat_solde?: number;
  contrat_statut?: string;
  montant_commission?: number;
  montant_net_prestataire?: number;
  statut_escrow?: string;
  escrow_lignes?: Record<string, number>;
}

function strOrUndef(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  const s = String(value).trim();
  return s || undefined;
}

function formatMoney(value: unknown, devise = "FC"): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return `— ${devise}`;
  return `${n.toLocaleString("fr-FR")} ${devise}`;
}

function mapPaiementStatut(statut: unknown): Transaction["statut"] {
  const s = String(statut ?? "").toLowerCase();
  if (s === "valide" || s === "complete") return "completed";
  if (s === "echoue" || s === "annule") return "failed";
  if (s === "rembourse") return "refunded";
  return "pending";
}

function mapTransaction(raw: Record<string, unknown>): Transaction {
  const client = raw.client as Record<string, unknown> | undefined;
  const prestataire = raw.prestataire as Record<string, unknown> | undefined;
  const contrat = raw.contrat as Record<string, unknown> | undefined;
  const escrowBreakdown = contrat?.escrow_breakdown as Record<string, unknown> | undefined;
  const lignes = escrowBreakdown?.lignes as Record<string, number> | undefined;

  return {
    id: String(raw.id),
    reference: String(raw.numero ?? raw.reference ?? raw.id),
    montant: Number(raw.montant ?? 0),
    type: String(raw.type ?? "acompte"),
    statut: mapPaiementStatut(raw.statut),
    methode: strOrUndef(raw.methode),
    reference_externe: strOrUndef(raw.reference_externe),
    paye_at: strOrUndef(raw.paye_at),
    libere_at: strOrUndef(raw.libere_at),
    created_at: String(raw.created_at ?? ""),
    client_name: displayNameFromProfil(client ?? null, "Client"),
    client_phone: strOrUndef(client?.telephone),
    client_ville: strOrUndef(client?.ville),
    prestataire_name: displayNameFromProfil(prestataire ?? null, "Prestataire"),
    prestataire_phone: strOrUndef(prestataire?.telephone),
    prestataire_ville: strOrUndef(prestataire?.ville),
    contrat_numero: strOrUndef(contrat?.numero),
    contrat_montant_ttc: contrat?.montant_ttc != null ? Number(contrat.montant_ttc) : undefined,
    contrat_acompte: contrat?.acompte_montant != null ? Number(contrat.acompte_montant) : undefined,
    contrat_solde: contrat?.solde_montant != null ? Number(contrat.solde_montant) : undefined,
    contrat_statut: strOrUndef(contrat?.statut),
    montant_commission: raw.montant_commission != null ? Number(raw.montant_commission) : undefined,
    montant_net_prestataire:
      raw.montant_net_prestataire != null ? Number(raw.montant_net_prestataire) : undefined,
    statut_escrow: strOrUndef(raw.statut_escrow),
    escrow_lignes: lignes,
  };
}

function getTypeLabel(type: string) {
  switch (type) {
    case "acompte":
      return "Acompte";
    case "solde":
      return "Solde";
    case "payment":
      return "Paiement";
    case "refund":
      return "Remboursement";
    case "location_complet":
      return "Location";
    default:
      return type;
  }
}

function getMethodeLabel(methode?: string) {
  switch (methode) {
    case "mobile_money":
      return "Mobile Money";
    case "carte":
      return "Carte bancaire";
    case "virement":
      return "Virement";
    default:
      return methode ?? "—";
  }
}

function getEscrowLabel(statut?: string) {
  switch (statut) {
    case "libere":
      return "Libéré";
    case "sequestre":
      return "Séquestré";
    case "gele":
      return "Gelé";
    default:
      return statut ?? "—";
  }
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "acompte" | "solde" | "location_complet">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending" | "failed" | "refunded">("all");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [validateTarget, setValidateTarget] = useState<Transaction | null>(null);

  const dateParams = useMemo(
    () => ({
      date_from: startDate || undefined,
      date_to: endDate || undefined,
    }),
    [startDate, endDate],
  );

  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    Boolean(startDate) ||
    Boolean(endDate) ||
    filterType !== "all" ||
    filterStatus !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setFilterType("all");
    setFilterStatus("all");
  };

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await adminApi.getTransactions({
        q: searchTerm.trim() || undefined,
        type: filterType === "all" ? undefined : filterType,
        statut: filterStatus === "all" ? undefined : filterStatus,
        ...dateParams,
      });
      const data = unwrapPaginated<Record<string, unknown>>(res);
      setTransactions(data.map(mapTransaction));
    } catch (error: unknown) {
      toast.error("Erreur lors du chargement des transactions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user, searchTerm, filterType, filterStatus, dateParams]);

  const handleValiderPaiement = async (paiementId: string) => {
    try {
      setValidatingId(paiementId);
      await paiementsApi.valider(paiementId);
      toast.success("Paiement validé");
      await fetchTransactions();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Validation impossible");
    } finally {
      setValidatingId(null);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filteredTransactions = transactions;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "failed":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "refunded":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default:
        return "";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Complétée";
      case "pending":
        return "En attente";
      case "failed":
        return "Échouée";
      case "refunded":
        return "Remboursée";
      default:
        return status;
    }
  };

  return (
    <DashboardLayout role="admin" userName="Admin" userRole="Administrateur">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold">Suivi des Transactions</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gérez et suivez tous les paiements</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Recherche</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Référence, client, prestataire, contrat…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchTransactions()}
                className="h-10 pl-10 text-sm sm:h-11 sm:text-base"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchTransactions}>
              Actualiser
            </Button>
          </CardContent>
        </Card>

        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full gap-2 sm:w-auto"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {showFilters ? "Masquer les filtres" : "Afficher les filtres"}
          </Button>
          {hasActiveFilters && !showFilters && (
            <Badge variant="secondary" className="text-xs">
              Filtres actifs
            </Badge>
          )}
        </div>

        {showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Filtres</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              label="Période de création"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm sm:h-11 sm:text-base"
              >
                <option value="all">Tous les types</option>
                <option value="acompte">Acomptes</option>
                <option value="solde">Soldes</option>
                <option value="location_complet">Location matériel</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm sm:h-11 sm:text-base"
              >
                <option value="all">Tous les statuts</option>
                <option value="completed">Complétées</option>
                <option value="pending">En attente</option>
                <option value="failed">Échouées</option>
                <option value="refunded">Remboursées</option>
              </select>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Réinitialiser les filtres
              </Button>
            )}
          </CardContent>
        </Card>
        )}

        {/* Transactions Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Transactions ({filteredTransactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <AdminListSkeleton items={4} />
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-muted-foreground text-sm sm:text-base">
                Aucune transaction trouvée
              </div>
            ) : (
              <>
                {/* Version mobile - Cards */}
                <div className="block sm:hidden space-y-3">
                  {filteredTransactions.map((t) => (
                    <div key={t.id} className="bg-muted/30 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-mono text-xs font-medium">{t.reference}</p>
                          <Badge variant="outline" className="text-xs mt-1">{getTypeLabel(t.type)}</Badge>
                        </div>
                        <Badge variant="outline" className={`text-xs ${getStatusColor(t.statut)}`}>
                          {getStatusLabel(t.statut)}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3 h-3" />
                          <span className="font-medium">{t.montant.toLocaleString("fr-FR")} FC</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(t.created_at).toLocaleDateString("fr-FR")}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {t.statut === "pending" && (
                          <SlideToConfirm
                            label={`Valider le paiement ${t.reference}`}
                            hint="Glisser pour valider"
                            variant="success"
                            loading={validatingId === t.id}
                            successMessage="Paiement validé"
                            onConfirm={() => handleValiderPaiement(t.id)}
                          />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTransaction(t);
                            setShowDetailsModal(true);
                          }}
                          className="flex-1 h-8 text-xs"
                        >
                          <Eye className="w-3 h-3 mr-2" />
                          Détails
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Version desktop - Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-sm">Référence</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Type</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Montant</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Statut</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((t) => (
                        <tr key={t.id} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-4 font-mono text-sm">{t.reference}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">{getTypeLabel(t.type)}</Badge>
                          </td>
                          <td className="py-3 px-4 font-medium">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              <span>{t.montant.toLocaleString("fr-FR")} FC</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={getStatusColor(t.statut)}>
                              {getStatusLabel(t.statut)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(t.created_at).toLocaleDateString("fr-FR")}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              {t.statut === "pending" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setValidateTarget(t)}
                                >
                                  Valider
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedTransaction(t);
                                  setShowDetailsModal(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
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

        <FormDrawer
          open={showDetailsModal && !!selectedTransaction}
          onOpenChange={(open) => {
            if (!open) {
              setShowDetailsModal(false);
              setSelectedTransaction(null);
            }
          }}
          title="Détails de la transaction"
        >
          {selectedTransaction && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Référence</p>
                  <p className="font-mono font-medium text-sm sm:text-base">{selectedTransaction.reference}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Type</p>
                  <p className="font-medium text-sm sm:text-base">{getTypeLabel(selectedTransaction.type)}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Montant</p>
                  <p className="font-medium text-sm sm:text-base flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    {formatMoney(selectedTransaction.montant)}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Statut</p>
                  <Badge variant="outline" className={`text-xs ${getStatusColor(selectedTransaction.statut)}`}>
                    {getStatusLabel(selectedTransaction.statut)}
                  </Badge>
                </div>
                {selectedTransaction.methode && (
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Méthode</p>
                    <p className="font-medium text-sm sm:text-base">{getMethodeLabel(selectedTransaction.methode)}</p>
                  </div>
                )}
                {selectedTransaction.reference_externe && (
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Réf. externe</p>
                    <p className="font-mono font-medium text-sm sm:text-base">{selectedTransaction.reference_externe}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Client</p>
                  <p className="font-medium text-sm sm:text-base flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {selectedTransaction.client_name}
                  </p>
                  {selectedTransaction.client_phone && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {selectedTransaction.client_phone}
                    </p>
                  )}
                  {selectedTransaction.client_ville && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {selectedTransaction.client_ville}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Prestataire</p>
                  <p className="font-medium text-sm sm:text-base flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {selectedTransaction.prestataire_name}
                  </p>
                  {selectedTransaction.prestataire_phone && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {selectedTransaction.prestataire_phone}
                    </p>
                  )}
                  {selectedTransaction.prestataire_ville && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {selectedTransaction.prestataire_ville}
                    </p>
                  )}
                </div>
                {selectedTransaction.contrat_numero && (
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Contrat</p>
                    <p className="font-medium text-sm sm:text-base">{selectedTransaction.contrat_numero}</p>
                    {selectedTransaction.contrat_statut && (
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                        {selectedTransaction.contrat_statut.replace(/_/g, " ")}
                      </p>
                    )}
                  </div>
                )}
                {selectedTransaction.statut_escrow && (
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Escrow</p>
                    <Badge variant="outline" className="text-xs">
                      {getEscrowLabel(selectedTransaction.statut_escrow)}
                    </Badge>
                  </div>
                )}
                {selectedTransaction.montant_commission != null && (
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Commission plateforme</p>
                    <p className="font-medium text-sm sm:text-base">{formatMoney(selectedTransaction.montant_commission)}</p>
                  </div>
                )}
                {selectedTransaction.montant_net_prestataire != null && (
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Net prestataire</p>
                    <p className="font-medium text-sm sm:text-base">{formatMoney(selectedTransaction.montant_net_prestataire)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Créé le</p>
                  <p className="font-medium text-sm sm:text-base">
                    {new Date(selectedTransaction.created_at).toLocaleString("fr-FR")}
                  </p>
                </div>
                {selectedTransaction.paye_at && (
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Payé le</p>
                    <p className="font-medium text-sm sm:text-base">
                      {new Date(selectedTransaction.paye_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                )}
                {selectedTransaction.libere_at && (
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Libéré le</p>
                    <p className="font-medium text-sm sm:text-base">
                      {new Date(selectedTransaction.libere_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                )}
              </div>

              {(selectedTransaction.contrat_montant_ttc != null ||
                selectedTransaction.contrat_acompte != null ||
                selectedTransaction.contrat_solde != null) && (
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">Contrat — répartition</p>
                  <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
                    {selectedTransaction.contrat_montant_ttc != null && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Montant TTC</span>
                        <span className="font-medium">{formatMoney(selectedTransaction.contrat_montant_ttc)}</span>
                      </div>
                    )}
                    {selectedTransaction.contrat_acompte != null && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Acompte</span>
                        <span className="font-medium">{formatMoney(selectedTransaction.contrat_acompte)}</span>
                      </div>
                    )}
                    {selectedTransaction.contrat_solde != null && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Solde</span>
                        <span className="font-medium">{formatMoney(selectedTransaction.contrat_solde)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedTransaction.escrow_lignes &&
                Object.keys(selectedTransaction.escrow_lignes).length > 0 && (
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2">Détail escrow</p>
                    <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
                      {Object.entries(selectedTransaction.escrow_lignes).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                          <span className="font-medium">{formatMoney(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {selectedTransaction.statut === "pending" && (
                <SlideToConfirm
                  label={`Valider le paiement de ${selectedTransaction.montant.toLocaleString("fr-FR")} FC`}
                  hint="Glisser pour valider"
                  variant="success"
                  loading={validatingId === selectedTransaction.id}
                  successMessage="Paiement validé"
                  onConfirm={async () => {
                    await handleValiderPaiement(selectedTransaction.id);
                    setShowDetailsModal(false);
                    setSelectedTransaction(null);
                  }}
                />
              )}
            </div>
          )}
        </FormDrawer>

        <FormDrawer
          open={!!validateTarget}
          onOpenChange={(open) => {
            if (!open) setValidateTarget(null);
          }}
          title="Valider le paiement"
          description={validateTarget ? `Réf. ${validateTarget.reference} — ${validateTarget.montant.toLocaleString("fr-FR")} FC` : undefined}
        >
          {validateTarget && (
            <SlideToConfirm
              label="Confirmer la validation de ce paiement en attente"
              hint="Glisser pour valider"
              variant="success"
              loading={validatingId === validateTarget.id}
              successMessage="Paiement validé"
              onConfirm={async () => {
                await handleValiderPaiement(validateTarget.id);
                setValidateTarget(null);
              }}
            />
          )}
        </FormDrawer>
      </div>
    </DashboardLayout>
  );
}
