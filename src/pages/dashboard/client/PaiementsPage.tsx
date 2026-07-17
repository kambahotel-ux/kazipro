import { useState } from "react";
import { useAbortableFetch } from "@/hooks/useAbortableFetch";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminListSkeleton } from "@/components/dashboard/AdminLoadingSkeleton";
import { Search, Download, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { paiementsApi } from "@/lib/api";
import { getClientDisplayName, mapPaiementToUi, unwrapPaginated } from "@/lib/client-helpers";
import { toast } from "sonner";

interface Paiement {
  id: string;
  numero: string;
  contrat_id: string;
  type_paiement: string;
  montant_total: number;
  methode_paiement: string;
  statut: string;
  date_paiement: string | null;
  created_at: string;
  contrats?: {
    numero: string;
  };
}

export default function PaiementsPage() {
  const { user } = useAuth();
  const clientName = getClientDisplayName(user);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaiement, setSelectedPaiement] = useState<Paiement | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useAbortableFetch(Boolean(user), [user], async (signal) => {
    if (!user || signal.aborted) return;
    try {
      setLoading(true);
      const res = await paiementsApi.getAll({ per_page: 100 });
      if (signal.aborted) return;
      const rows = unwrapPaginated(res).map((p) => mapPaiementToUi(p as Record<string, unknown>));
      setPaiements(rows as Paiement[]);
    } catch (error: unknown) {
      if (signal.aborted) return;
      const message = error instanceof Error ? error.message : "Erreur lors du chargement des paiements";
      toast.error(message);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  });

  const filteredPaiements = paiements.filter((p) => {
    const matchesSearch =
      p.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.contrats?.numero?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || p.statut === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout role="client" userName={clientName} userRole="Client">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Mes Paiements</h1>
            <p className="text-muted-foreground">Gérez vos paiements et transactions</p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Rechercher une transaction..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[150px]">
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

        {loading ? (
          <AdminListSkeleton items={4} />
        ) : paiements.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Aucun paiement trouvé</p>
            </CardContent>
          </Card>
        ) : (
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
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Contrat</th>
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
                        <td className="py-3 px-4 text-sm">{paiement.contrats?.numero || "N/A"}</td>
                        <td className="py-3 px-4 text-sm capitalize">
                          {paiement.type_paiement === "acompte"
                            ? "Acompte"
                            : paiement.type_paiement === "solde"
                              ? "Solde"
                              : paiement.type_paiement}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-medium text-primary">
                          {paiement.montant_total.toLocaleString()} FC
                        </td>
                        <td className="py-3 px-4 text-sm capitalize">
                          {String(paiement.methode_paiement || "").replace("_", " ")}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {new Date(paiement.date_paiement || paiement.created_at).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              paiement.statut === "valide"
                                ? "default"
                                : paiement.statut === "en_cours"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {paiement.statut === "valide"
                              ? "Validé"
                              : paiement.statut === "en_cours"
                                ? "En cours"
                                : "Échoué"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedPaiement(paiement);
                              setShowDetailsModal(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {showDetailsModal && selectedPaiement && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Détails du paiement</CardTitle>
                <Button variant="ghost" onClick={() => setShowDetailsModal(false)}>
                  ✕
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Numéro de paiement</p>
                    <p className="font-mono text-sm">{selectedPaiement.numero}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contrat</p>
                    <p className="font-medium">{selectedPaiement.contrats?.numero || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type de paiement</p>
                    <p className="font-medium capitalize">
                      {selectedPaiement.type_paiement === "acompte"
                        ? "Acompte (30%)"
                        : selectedPaiement.type_paiement === "solde"
                          ? "Solde (70%)"
                          : selectedPaiement.type_paiement}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Montant</p>
                    <p className="text-2xl font-bold text-primary">
                      {selectedPaiement.montant_total.toLocaleString()} FC
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Méthode de paiement</p>
                    <p className="font-medium capitalize">
                      {String(selectedPaiement.methode_paiement || "").replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {new Date(selectedPaiement.date_paiement || selectedPaiement.created_at).toLocaleDateString(
                        "fr-FR",
                        { day: "2-digit", month: "long", year: "numeric" },
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Statut</p>
                    <Badge variant={selectedPaiement.statut === "valide" ? "default" : "secondary"} className="mt-1">
                      {selectedPaiement.statut === "valide" ? "Validé" : "En cours"}
                    </Badge>
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg text-sm">
                  <p className="text-muted-foreground">
                    Votre paiement est sécurisé par notre système escrow. Le prestataire recevra le paiement après
                    validation du travail.
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
    </DashboardLayout>
  );
}
