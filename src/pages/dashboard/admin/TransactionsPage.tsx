import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Eye, Loader2, DollarSign, TrendingUp, Calendar, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Transaction {
  id: string;
  montant: number;
  type: "payment" | "refund" | "withdrawal";
  statut: "completed" | "pending" | "failed";
  client_name: string;
  prestataire_name: string;
  mission_title: string;
  created_at: string;
  reference: string;
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "payment" | "refund" | "withdrawal">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending" | "failed">("all");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("paiements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Map transactions with default values for missing columns
      const mappedTransactions = (data || []).map((t: any) => ({
        id: t.id,
        montant: t.montant || 0,
        type: t.type || "payment",
        statut: t.statut || "pending",
        client_name: "Client",
        prestataire_name: "Prestataire",
        mission_title: "Mission",
        created_at: t.created_at,
        reference: t.id.substring(0, 8).toUpperCase(),
      }));

      setTransactions(mappedTransactions);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des transactions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesType = filterType === "all" || t.type === filterType;
    const matchesStatus = filterStatus === "all" || t.statut === filterStatus;
    return matchesType && matchesStatus;
  });

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.montant, 0);
  const completedAmount = filteredTransactions
    .filter(t => t.statut === "completed")
    .reduce((sum, t) => sum + t.montant, 0);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "payment":
        return "Paiement";
      case "refund":
        return "Remboursement";
      case "withdrawal":
        return "Retrait";
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "failed":
        return "bg-red-500/10 text-red-600 border-red-500/20";
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

        {/* Stats */}
        <div className="block sm:hidden">
          {/* Version mobile compacte */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold">{transactions.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">
                    {Math.round(completedAmount / 1000)}K
                  </p>
                  <p className="text-xs text-muted-foreground">Complétées</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-yellow-600">
                    {transactions.filter(t => t.statut === "pending").length}
                  </p>
                  <p className="text-xs text-muted-foreground">En attente</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-red-600">
                    {transactions.filter(t => t.statut === "failed").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Échouées</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Version desktop */}
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold">{transactions.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Total transactions</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-green-600">
                  {completedAmount.toLocaleString("fr-FR")}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Complétées (FC)</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600">
                  {transactions.filter(t => t.statut === "pending").length}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">En attente</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-red-600">
                  {transactions.filter(t => t.statut === "failed").length}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Échouées</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Filtres</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 rounded-lg border border-input bg-background h-10 sm:h-11 text-sm sm:text-base"
              >
                <option value="all">Tous les types</option>
                <option value="payment">Paiements</option>
                <option value="refund">Remboursements</option>
                <option value="withdrawal">Retraits</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 rounded-lg border border-input bg-background h-10 sm:h-11 text-sm sm:text-base"
              >
                <option value="all">Tous les statuts</option>
                <option value="completed">Complétées</option>
                <option value="pending">En attente</option>
                <option value="failed">Échouées</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Transactions ({filteredTransactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8 sm:py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
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
                      <div className="flex items-start justify-between mb-2">
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTransaction(t);
                          setShowDetailsModal(true);
                        }}
                        className="w-full h-8 text-xs"
                      >
                        <Eye className="w-3 h-3 mr-2" />
                        Voir détails
                      </Button>
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

        {/* Details Modal */}
        {showDetailsModal && selectedTransaction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-auto">
            <Card className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg sm:text-xl">Détails de la Transaction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
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
                      {selectedTransaction.montant.toLocaleString("fr-FR")} FC
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Statut</p>
                    <Badge variant="outline" className={`text-xs ${getStatusColor(selectedTransaction.statut)}`}>
                      {getStatusLabel(selectedTransaction.statut)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Client</p>
                    <p className="font-medium text-sm sm:text-base flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {selectedTransaction.client_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Prestataire</p>
                    <p className="font-medium text-sm sm:text-base flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {selectedTransaction.prestataire_name}
                    </p>
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <p className="text-xs sm:text-sm text-muted-foreground">Mission</p>
                    <p className="font-medium text-sm sm:text-base">{selectedTransaction.mission_title}</p>
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <p className="text-xs sm:text-sm text-muted-foreground">Date</p>
                    <p className="font-medium text-sm sm:text-base">
                      {new Date(selectedTransaction.created_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    className="flex-1 text-sm"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    Fermer
                  </Button>
                  {selectedTransaction.statut === "pending" && (
                    <Button className="flex-1 text-sm">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Marquer comme complétée
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
