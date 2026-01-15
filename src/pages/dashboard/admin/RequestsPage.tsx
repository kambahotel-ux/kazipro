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
        status: r.status || "active",
        service: r.service || "",
        urgence: r.urgence || "normal",
        location: r.location || "",
        created_at: r.created_at,
        updated_at: r.updated_at,
      }));

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

  const pendingRequests = filteredRequests.filter(r => r.status === "active");
  const approvedRequests = filteredRequests.filter(r => r.status === "completed");
  const rejectedRequests = filteredRequests.filter(r => r.status === "cancelled");
  
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
        .update({ status: "completed" })
        .eq("id", requestId);

      if (error) throw error;
      toast.success("Demande marquée comme complétée");
      await fetchRequests();
    } catch (error: any) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir annuler cette demande?")) return;
    try {
      const { error } = await supabase
        .from("demandes")
        .update({ status: "cancelled" })
        .eq("id", requestId);

      if (error) throw error;
      toast.success("Demande annulée");
      await fetchRequests();
    } catch (error: any) {
      toast.error("Erreur lors de l'annulation");
    }
  };

  const RequestCard = ({ request, showActions }: { request: Request; showActions: boolean }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{request.title}</h3>
              <Badge
                variant="outline"
                className={
                  request.status === "completed"
                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                    : request.status === "cancelled"
                    ? "bg-red-500/10 text-red-600 border-red-500/20"
                    : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                }
              >
                {request.status === "completed" ? "Complétée" : request.status === "cancelled" ? "Annulée" : "Active"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{request.description}</p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {request.client_name}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                {request.budget_min.toLocaleString("fr-FR")} - {request.budget_max.toLocaleString("fr-FR")} FC
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(request.created_at).toLocaleDateString("fr-FR")}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedRequest(request);
                setShowDetailsModal(true);
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
            {showActions && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleApprove(request.id)}
                >
                  <CheckCircle className="w-4 h-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleReject(request.id)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </>
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
          <h1 className="text-2xl font-display font-bold">Modération des Demandes</h1>
          <p className="text-muted-foreground">Approuvez ou rejetez les demandes de service</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold">{filteredRequests.length}</p>
                <p className="text-sm text-muted-foreground">
                  {hasActiveFilters ? 'Résultats filtrés' : 'Total demandes'}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">{pendingRequests.length}</p>
                <p className="text-sm text-muted-foreground">En attente</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{approvedRequests.length}</p>
                <p className="text-sm text-muted-foreground">Approuvées</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{rejectedRequests.length}</p>
                <p className="text-sm text-muted-foreground">Rejetées</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Toggle Button */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Search className="w-4 h-4" />
            {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
          </Button>
          
          {hasActiveFilters && !showFilters && (
            <Badge variant="secondary">
              Filtres actifs: {filteredRequests.length} résultat(s)
            </Badge>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="pl-10"
                />
              </div>
              
              {/* Service */}
              <Select value={filters.service} onValueChange={(v) => setFilters({...filters, service: v})}>
                <SelectTrigger>
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
                <SelectTrigger>
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
                <SelectTrigger>
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
            <div className="flex items-center justify-between">
              <Badge variant="secondary">
                {filteredRequests.length} résultat(s)
              </Badge>
              
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              En attente ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approuvées ({approvedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejetées ({rejectedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Aucune demande en attente
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <RequestCard key={request.id} request={request} showActions={true} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : approvedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Aucune demande approuvée
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {approvedRequests.map((request) => (
                  <RequestCard key={request.id} request={request} showActions={false} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : rejectedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Aucune demande rejetée
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {rejectedRequests.map((request) => (
                  <RequestCard key={request.id} request={request} showActions={false} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Details Modal */}
        {showDetailsModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle>{selectedRequest.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-sm">{selectedRequest.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{selectedRequest.client_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="font-medium">{selectedRequest.budget_min.toLocaleString("fr-FR")} - {selectedRequest.budget_max.toLocaleString("fr-FR")} FC</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Service</p>
                  <p className="font-medium">{selectedRequest.service || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Localisation</p>
                  <p className="font-medium">{selectedRequest.location || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <Badge
                    variant="outline"
                    className={
                      selectedRequest.status === "completed"
                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                        : selectedRequest.status === "cancelled"
                        ? "bg-red-500/10 text-red-600 border-red-500/20"
                        : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                    }
                  >
                    {selectedRequest.status === "completed" ? "Complétée" : selectedRequest.status === "cancelled" ? "Annulée" : "Active"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Créée le</p>
                  <p className="font-medium">
                    {new Date(selectedRequest.created_at).toLocaleDateString("fr-FR")}
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
                  {selectedRequest.status === "active" && (
                    <>
                      <Button
                        className="flex-1"
                        onClick={() => {
                          handleApprove(selectedRequest.id);
                          setShowDetailsModal(false);
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Marquer Complétée
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => {
                          handleReject(selectedRequest.id);
                          setShowDetailsModal(false);
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Annuler
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
