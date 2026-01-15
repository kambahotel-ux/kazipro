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
          <h1 className="text-2xl font-display font-bold">Suivi des Transactions</h1>
          <p className="text-muted-foreground">Gérez et suivez tous les paiements</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold">{transactions.length}</p>
                <p className="text-sm text-muted-foreground">Total transactions</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {completedAmount.toLocaleString("fr-FR")}
                </p>
                <p className="text-sm text-muted-foreground">Complétées (FC)</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">
                  {transactions.filter(t => t.statut === "pending").length}
                </p>
                <p className="text-sm text-muted-foreground">En attente</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">
                  {transactions.filter(t => t.statut === "failed").length}
                </p>
                <p className="text-sm text-muted-foreground">Échouées</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 rounded-lg border border-input bg-background"
              >
                <option value="all">Tous les types</option>
                <option value="payment">Paiements</option>
                <option value="refund">Remboursements</option>
                <option value="withdrawal">Retraits</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 rounded-lg border border-input bg-background"
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
          <CardHeader>
            <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Aucune transaction trouvée
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium">Référence</th>
                      <th className="text-left py-3 px-4 font-medium">Type</th>
                      <th className="text-left py-3 px-4 font-medium">Montant</th>
                      <th className="text-left py-3 px-4 font-medium">Statut</th>
                      <th className="text-left py-3 px-4 font-medium">Date</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((t) => (
                      <tr key={t.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4 font-mono text-sm">{t.reference}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{getTypeLabel(t.type)}</Badge>
                        </td>
                        <td className="py-3 px-4 font-medium flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          {t.montant.toLocaleString("fr-FR")} FC
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={getStatusColor(t.statut)}>
                            {getStatusLabel(t.statut)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(t.created_at).toLocaleDateString("fr-FR")}
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
            )}
          </CardContent>
        </Card>

        {/* Details Modal */}
        {showDetailsModal && selectedTransaction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle>Détails de la Transaction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Référence</p>
                    <p className="font-mono font-medium">{selectedTransaction.reference}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium">{getTypeLabel(selectedTransaction.type)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Montant</p>
                    <p className="font-medium flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      {selectedTransaction.montant.toLocaleString("fr-FR")} FC
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Statut</p>
                    <Badge variant="outline" className={getStatusColor(selectedTransaction.statut)}>
                      {getStatusLabel(selectedTransaction.statut)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {selectedTransaction.client_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Prestataire</p>
                    <p className="font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {selectedTransaction.prestataire_name}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Mission</p>
                    <p className="font-medium">{selectedTransaction.mission_title}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {new Date(selectedTransaction.created_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    Fermer
                  </Button>
                  {selectedTransaction.statut === "pending" && (
                    <Button className="flex-1">
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
