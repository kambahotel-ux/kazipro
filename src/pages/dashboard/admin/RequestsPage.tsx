import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Eye, Loader2, Calendar, User, DollarSign, Search, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { DateRangeFilter } from "@/components/filters/DateRangeFilter";

interface Request {
  id: string;
  title: string;
  description: string;
  client_name: string;
  budget_min: number;
  budget_max: number;
  status: "active" | "completed" | "cancelled";
  service?: string;
  urgence?: string;
  location?: string;
  created_at: string;
  updated_at?: string;
}

export default function RequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    service: 'all',
    urgence: 'all',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("demandes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Map requests with correct field names
      const mappedRequests = (data || []).map((r: any) => ({
        id: r.id,
        title: r.title || "Sans titre",
        description: r.description || "",
        client_name: "Client",
        budget_min: r.budget_min || 0,
        budget_max: r.budget_max || 0,
        status: r.status || "pending", // Changé de "active" à "pending"
        service: r.service || "",
        urgence: r.urgence || "normal",
        location: r.location || "",
        created_at: r.created_at,
        updated_at: r.updated_at,
      }));

      console.log("Demandes chargées:", mappedRequests);
      console.log("Statuts trouvés:", [...new Set(mappedRequests.map(r => r.status))]);
      setRequests(mappedRequests);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des demandes");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Filtered requests with useMemo
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!request.title?.toLowerCase().includes(searchLower) &&
            !request.description?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Status filter
      if (filters.status !== 'all' && request.status !== filters.status) {
        return false;
      }
      
      // Service filter
      if (filters.service !== 'all' && request.service !== filters.service) {
        return false;
      }
      
      // Urgence filter
      if (filters.urgence !== 'all' && request.urgence !== filters.urgence) {
        return false;
      }
      
      // Date range filter
      if (filters.startDate) {
        const requestDate = new Date(request.created_at);
        const startDate = new Date(filters.startDate);
        if (requestDate < startDate) return false;
      }
      
      if (filters.endDate) {
        const requestDate = new Date(request.created_at);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (requestDate > endDate) return false;
      }
      
      return true;
    });
  }, [requests, filters]);

  const pendingRequests = filteredRequests.filter(r => r.status === "pending" || r.status === "active" || r.status === "en_attente");
  const approvedRequests = filteredRequests.filter(r => r.status === "completed" || r.status === "approved" || r.status === "approuvee");
  const rejectedRequests = filteredRequests.filter(r => r.status === "cancelled" || r.status === "rejected" || r.status === "rejetee");
  
  // Get unique services for filter dropdown
  const services = useMemo(() => {
    const uniqueServices = [...new Set(requests.map(r => r.service).filter(Boolean))];
    return uniqueServices.sort();
  }, [requests]);
  
  // Check if any filters are active
  const hasActiveFilters = filters.search || filters.status !== 'all' || 
    filters.service !== 'all' || filters.urgence !== 'all' || filters.startDate || filters.endDate;
  
  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      service: 'all',
      urgence: 'all',
      startDate: '',
      endDate: '',
    });
  };

  const handleApprove = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("demandes")
        .update({ status: "approved" }) // Changé de "completed" à "approved"
        .eq("id", requestId);

      if (error) throw error;
      toast.success("Demande approuvée");
      await fetchRequests();
    } catch (error: any) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir rejeter cette demande?")) return;
    try {
      const { error } = await supabase
        .from("demandes")
        .update({ status: "rejected" }) // Changé de "cancelled" à "rejected"
        .eq("id", requestId);

      if (error) throw error;
      toast.success("Demande rejetée");
      await fetchRequests();
    } catch (error: any) {
      toast.error("Erreur lors du rejet");
    }
  };

  const RequestCard = ({ request, showActions }: { request: Request; showActions: boolean }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-4 sm:pt-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
          <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
              <h3 className="font-semibold text-sm sm:text-base">{request.title}</h3>
              <Badge
                variant="outline"
                className={`w-fit text-xs ${
                  request.status === "completed" || request.status === "approved" || request.status === "approuvee"
                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                    : request.status === "cancelled" || request.status === "rejected" || request.status === "rejetee"
                    ? "bg-red-500/10 text-red-600 border-red-500/20"
                    : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                }`}
              >
                {request.status === "completed" || request.status === "approved" || request.status === "approuvee" 
                  ? "Approuvée" 
                  : request.status === "cancelled" || request.status === "rejected" || request.status === "rejetee" 
                  ? "Rejetée" 
                  : "En attente"}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3">{request.description}</p>
            <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span className="truncate">{request.client_name}</span>
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                <span className="truncate">{request.budget_min.toLocaleString("fr-FR")} - {request.budget_max.toLocaleString("fr-FR")} FC</span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(request.created_at).toLocaleDateString("fr-FR")}</span>
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedRequest(request);
                setShowDetailsModal(true);
              }}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-0" />
              <span className="sm:hidden">Voir détails</span>
            </Button>
            {showActions && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleApprove(request.id)}
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-0" />
                  <span className="sm:hidden">Approuver</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleReject(request.id)}
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <XCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-0" />
                  <span className="sm:hidden">Rejeter</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout role="admin" userName="Admin" userRole="Administrateur">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold">Modération des Demandes</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Approuvez ou rejetez les demandes de service</p>
        </div>

        {/* Stats */}
        <div className="block sm:hidden">
          {/* Version mobile compacte */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold">{filteredRequests.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-yellow-600">{pendingRequests.length}</p>
                  <p className="text-xs text-muted-foreground">En attente</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">{approvedRequests.length}</p>
                  <p className="text-xs text-muted-foreground">Approuvées</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-red-600">{rejectedRequests.length}</p>
                  <p className="text-xs text-muted-foreground">Rejetées</p>
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
                <p className="text-2xl sm:text-3xl font-bold">{filteredRequests.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {hasActiveFilters ? 'Résultats filtrés' : 'Total demandes'}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{pendingRequests.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">En attente</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{approvedRequests.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Approuvées</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-red-600">{rejectedRequests.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Rejetées</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Toggle Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2 w-full sm:w-auto"
          >
            <Search className="w-4 h-4" />
            {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
          </Button>
          
          {hasActiveFilters && !showFilters && (
            <Badge variant="secondary" className="text-xs">
              Filtres actifs: {filteredRequests.length} résultat(s)
            </Badge>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="pl-10 h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
              
              {/* Service */}
              <Select value={filters.service} onValueChange={(v) => setFilters({...filters, service: v})}>
                <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                  <SelectValue placeholder="Service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les services</SelectItem>
                  {services.map(service => (
                    <SelectItem key={service} value={service}>{service}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Urgence */}
              <Select value={filters.urgence} onValueChange={(v) => setFilters({...filters, urgence: v})}>
                <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                  <SelectValue placeholder="Urgence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="tres_urgent">Très urgent</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Status */}
              <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
                <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actives</SelectItem>
                  <SelectItem value="completed">Complétées</SelectItem>
                  <SelectItem value="cancelled">Annulées</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Date Range */}
            <div className="mb-4">
              <DateRangeFilter
                startDate={filters.startDate}
                endDate={filters.endDate}
                onStartDateChange={(d) => setFilters({...filters, startDate: d})}
                onEndDateChange={(d) => setFilters({...filters, endDate: d})}
                label="Période de création"
              />
            </div>
            
            {/* Results bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <Badge variant="secondary" className="text-xs sm:text-sm">
                {filteredRequests.length} résultat(s)
              </Badge>
              
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="w-full sm:w-auto">
                  <X className="w-4 h-4 mr-2" />
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-3 sm:space-y-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="pending" className="flex-1 sm:flex-none text-xs sm:text-sm">
              En attente ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex-1 sm:flex-none text-xs sm:text-sm">
              Approuvées ({approvedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex-1 sm:flex-none text-xs sm:text-sm">
              Rejetées ({rejectedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3 sm:space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8 sm:py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 sm:py-12 text-center text-muted-foreground text-sm sm:text-base">
                  Aucune demande en attente
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {pendingRequests.map((request) => (
                  <RequestCard key={request.id} request={request} showActions={true} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-3 sm:space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8 sm:py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : approvedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 sm:py-12 text-center text-muted-foreground text-sm sm:text-base">
                  Aucune demande approuvée
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {approvedRequests.map((request) => (
                  <RequestCard key={request.id} request={request} showActions={false} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-3 sm:space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8 sm:py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : rejectedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 sm:py-12 text-center text-muted-foreground text-sm sm:text-base">
                  Aucune demande rejetée
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {rejectedRequests.map((request) => (
                  <RequestCard key={request.id} request={request} showActions={false} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Details Modal */}
        {showDetailsModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-auto">
            <Card className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg sm:text-xl">{selectedRequest.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-xs sm:text-sm">{selectedRequest.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Client</p>
                  <p className="font-medium text-sm sm:text-base">{selectedRequest.client_name}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Budget</p>
                  <p className="font-medium text-sm sm:text-base">{selectedRequest.budget_min.toLocaleString("fr-FR")} - {selectedRequest.budget_max.toLocaleString("fr-FR")} FC</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Service</p>
                  <p className="font-medium text-sm sm:text-base">{selectedRequest.service || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Localisation</p>
                  <p className="font-medium text-sm sm:text-base">{selectedRequest.location || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Statut</p>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      selectedRequest.status === "completed" || selectedRequest.status === "approved" || selectedRequest.status === "approuvee"
                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                        : selectedRequest.status === "cancelled" || selectedRequest.status === "rejected" || selectedRequest.status === "rejetee"
                        ? "bg-red-500/10 text-red-600 border-red-500/20"
                        : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                    }`}
                  >
                    {selectedRequest.status === "completed" || selectedRequest.status === "approved" || selectedRequest.status === "approuvee" 
                      ? "Approuvée" 
                      : selectedRequest.status === "cancelled" || selectedRequest.status === "rejected" || selectedRequest.status === "rejetee" 
                      ? "Rejetée" 
                      : "En attente"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Créée le</p>
                  <p className="font-medium text-sm sm:text-base">
                    {new Date(selectedRequest.created_at).toLocaleDateString("fr-FR")}
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
                  {(selectedRequest.status === "pending" || selectedRequest.status === "active" || selectedRequest.status === "en_attente") && (
                    <>
                      <Button
                        className="flex-1 text-sm"
                        onClick={() => {
                          handleApprove(selectedRequest.id);
                          setShowDetailsModal(false);
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approuver
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1 text-sm"
                        onClick={() => {
                          handleReject(selectedRequest.id);
                          setShowDetailsModal(false);
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rejeter
                      </Button>
                    </>
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
