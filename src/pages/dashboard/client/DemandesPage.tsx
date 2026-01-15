import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Eye, MessageSquare, CheckCircle, Clock, MapPin, DollarSign, Trash2, Edit, FileText, Loader, X } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { DateRangeFilter } from "@/components/filters/DateRangeFilter";

interface Demande {
  id: string;
  title: string;
  description: string;
  location: string;
  budget_min: number;
  budget_max: number;
  status: string; // Use 'status' column from database
  service?: string;
  created_at: string;
  devis_count?: number;
}

interface DevisAccepte {
  id: string;
  numero: string;
  titre: string;
  montant_ttc: number;
  devise: string;
  date_acceptation: string;
  created_at: string;
  demande_id: string;
  prestataire?: {
    full_name: string;
    profession: string;
  };
  demande?: {
    title: string;
    titre: string;
  };
}

export default function DemandesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clientName, setClientName] = useState("Client");
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [devisAcceptes, setDevisAcceptes] = useState<DevisAccepte[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  
  // Additional filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    service: 'all',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchDemandes();
  }, [user]);

  const fetchDemandes = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get client data
      let { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("id, full_name")
        .eq("user_id", user.id)
        .single();

      // If client doesn't exist, create it
      if (clientError && clientError.code === 'PGRST116') {
        const { data: newClient, error: createError } = await supabase
          .from("clients")
          .insert([
            {
              user_id: user.id,
              full_name: user.email?.split('@')[0] || 'Client',
              city: 'Kinshasa',
              verified: false,
            }
          ])
          .select()
          .single();

        if (createError) throw createError;
        clientData = newClient;
      } else if (clientError) {
        throw clientError;
      }

      if (clientData?.full_name) {
        setClientName(clientData.full_name);
      }

      // Fetch demandes for this client
      const { data, error } = await supabase
        .from("demandes")
        .select("*")
        .eq("client_id", clientData.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch devis count for each demande
      const demandesWithCounts = await Promise.all(
        (data || []).map(async (demande) => {
          const { count } = await supabase
            .from("devis")
            .select("*", { count: "exact", head: true })
            .eq("demande_id", demande.id);
          return { 
            ...demande, 
            devis_count: count || 0,
            service: demande.service || demande.profession || ''
          };
        })
      );

      setDemandes(demandesWithCounts);

      // Fetch devis acceptés for this client's demandes
      const demandeIds = (data || []).map(d => d.id);
      if (demandeIds.length > 0) {
        const { data: devisData, error: devisError } = await supabase
          .from('devis')
          .select(`
            *,
            prestataire:prestataires(full_name, profession),
            demande:demandes!devis_demande_id_fkey(title, titre)
          `)
          .eq('statut', 'accepte')
          .in('demande_id', demandeIds)
          .order('date_acceptation', { ascending: false });

        if (!devisError && devisData) {
          const formattedDevis = devisData.map(devis => ({
            ...devis,
            prestataire: Array.isArray(devis.prestataire) ? devis.prestataire[0] : devis.prestataire,
            demande: Array.isArray(devis.demande) ? devis.demande[0] : devis.demande,
          }));
          setDevisAcceptes(formattedDevis);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement des demandes");
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const active = filteredDemandes.filter(d => d.status === "active").length;
    const inProgress = filteredDemandes.filter(d => d.status === "in_progress").length;
    const completed = filteredDemandes.filter(d => d.status === "completed").length;
    const totalActive = active + inProgress;
    const totalDevis = filteredDemandes.reduce((sum, d) => sum + (d.devis_count || 0), 0);
    const totalBudget = filteredDemandes.reduce((sum, d) => sum + (d.budget_max || 0), 0);

    return [
      { title: "Demandes actives", value: totalActive.toString(), subtitle: "En cours", icon: <Clock className="w-5 h-5" /> },
      { title: "Devis reçus", value: totalDevis.toString(), subtitle: "À examiner", icon: <FileText className="w-5 h-5" /> },
      { title: "Missions complétées", value: completed.toString(), subtitle: "Total", icon: <CheckCircle className="w-5 h-5" /> },
      { title: "Budget total", value: `${totalBudget.toLocaleString()} FC`, subtitle: "Engagé", icon: <DollarSign className="w-5 h-5" /> },
    ];
  };

  const filteredDemandes = useMemo(() => {
    return demandes.filter(d => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!d.title.toLowerCase().includes(searchLower) &&
            !d.description.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Status filter
      if (filters.status !== 'all' && d.status !== filters.status) {
        return false;
      }
      
      // Service filter
      if (filters.service !== 'all' && d.service !== filters.service) {
        return false;
      }
      
      // Date range filter
      if (filters.startDate) {
        const demandeDate = new Date(d.created_at);
        const startDate = new Date(filters.startDate);
        if (demandeDate < startDate) return false;
      }
      
      if (filters.endDate) {
        const demandeDate = new Date(d.created_at);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (demandeDate > endDate) return false;
      }
      
      return true;
    });
  }, [demandes, filters]);

  // Get unique services for filter dropdown
  const services = useMemo(() => {
    const uniqueServices = [...new Set(demandes.map(d => d.service).filter(Boolean))];
    return uniqueServices.sort();
  }, [demandes]);
  
  // Check if any filters are active
  const hasActiveFilters = filters.search || filters.status !== 'all' || 
    filters.service !== 'all' || filters.startDate || filters.endDate;
  
  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      service: 'all',
      startDate: '',
      endDate: '',
    });
  };

  return (
    <DashboardLayout role="client" userName={clientName} userRole="Client">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Mes Demandes</h1>
            <p className="text-muted-foreground">Gérez vos demandes de service</p>
          </div>
          <Link to="/dashboard/client/demandes/nouvelle">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle demande
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {getStats().map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
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
              Filtres actifs: {filteredDemandes.length} résultat(s)
            </Badge>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Rechercher une demande..." 
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
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
              
              {/* Status */}
              <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">En attente</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminée</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
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
                {filteredDemandes.length} résultat(s)
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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : demandes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">Aucune demande trouvée</p>
              <Link to="/dashboard/client/demandes/nouvelle">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une demande
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList>
              <TabsTrigger value="active">En attente ({demandes.filter(d => d.status === "active").length})</TabsTrigger>
              <TabsTrigger value="in_progress">En cours ({demandes.filter(d => d.status === "in_progress").length})</TabsTrigger>
              <TabsTrigger value="devis-acceptes">Devis acceptés ({devisAcceptes.length})</TabsTrigger>
              <TabsTrigger value="completed">Terminées ({demandes.filter(d => d.status === "completed").length})</TabsTrigger>
              <TabsTrigger value="cancelled">Annulées ({demandes.filter(d => d.status === "cancelled").length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {filteredDemandes.filter(d => d.status === "active").map((demande) => (
                <Card key={demande.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-start gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{demande.title}</h3>
                          <Badge variant="secondary">En attente</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">{demande.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {demande.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {demande.budget_min.toLocaleString()} - {demande.budget_max.toLocaleString()} FC
                          </span>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span className="text-muted-foreground">{demande.devis_count || 0} réponses</span>
                          <span className="text-muted-foreground">{new Date(demande.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          variant="outline"
                          onClick={() => navigate(`/dashboard/client/demandes/${demande.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Voir détails
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="in_progress" className="space-y-4">
              {filteredDemandes.filter(d => d.status === "in_progress").map((demande) => (
                <Card key={demande.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-start gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{demande.title}</h3>
                          <Badge variant="default">En cours</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">{demande.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {demande.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {demande.budget_min.toLocaleString()} - {demande.budget_max.toLocaleString()} FC
                          </span>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span className="text-muted-foreground">{demande.devis_count || 0} réponses</span>
                          <span className="text-muted-foreground">{new Date(demande.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          variant="outline"
                          onClick={() => navigate(`/dashboard/client/demandes/${demande.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Voir détails
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="devis-acceptes" className="space-y-4">
              {devisAcceptes.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-2">Aucun devis accepté</p>
                    <p className="text-sm text-muted-foreground">
                      Les devis que vous acceptez apparaîtront ici
                    </p>
                  </CardContent>
                </Card>
              ) : (
                devisAcceptes.map((devis) => (
                  <Card key={devis.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-start gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg">{devis.titre || 'Sans titre'}</h3>
                            <Badge className="bg-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Accepté
                            </Badge>
                          </div>
                          
                          {devis.demande && (
                            <div className="flex items-center gap-2 text-sm">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Demande:</span>
                              <span className="font-medium">
                                {devis.demande.title || devis.demande.titre}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Prestataire:</span>
                            <span className="font-medium">{devis.prestataire?.full_name || 'N/A'}</span>
                            {devis.prestataire?.profession && (
                              <span className="text-muted-foreground">({devis.prestataire.profession})</span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span>N° {devis.numero || 'N/A'}</span>
                            <span>
                              Accepté le {new Date(devis.date_acceptation || devis.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>

                          <div className="text-lg font-bold text-green-600">
                            {devis.montant_ttc.toLocaleString()} {devis.devise || 'FC'}
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <Button 
                            variant="outline"
                            onClick={() => navigate(`/dashboard/client/demandes/${devis.demande_id}`)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Voir détails
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {filteredDemandes.filter(d => d.status === "completed").map((demande) => (
                <Card key={demande.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-start gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{demande.title}</h3>
                          <Badge variant="outline">Terminée</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">{demande.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {demande.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {demande.budget_min.toLocaleString()} - {demande.budget_max.toLocaleString()} FC
                          </span>
                        </div>
                      </div>
                      <Button variant="outline">
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {filteredDemandes.filter(d => d.status === "cancelled").map((demande) => (
                <Card key={demande.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-start gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{demande.title}</h3>
                          <Badge variant="default">Annulée</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">{demande.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {demande.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {demande.budget_min.toLocaleString()} - {demande.budget_max.toLocaleString()} FC
                          </span>
                        </div>
                      </div>
                      <Button variant="outline">
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedDemande && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
            <Card className="w-full max-w-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{selectedDemande.title}</CardTitle>
                <Button variant="ghost" onClick={() => setShowDetailsModal(false)}>✕</Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Localisation</p>
                    <p className="font-medium">{selectedDemande.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="font-medium text-lg text-primary">
                      {selectedDemande.budget_min.toLocaleString()} - {selectedDemande.budget_max.toLocaleString()} FC
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Créée le</p>
                    <p className="font-medium">{new Date(selectedDemande.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Réponses reçues</p>
                    <p className="font-medium">{selectedDemande.devis_count || 0} devis</p>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedDemande.description}</p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Devis reçus</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedDemande.devis_count === 0 
                      ? "Aucun devis reçu pour le moment" 
                      : `${selectedDemande.devis_count} devis en attente de votre examen`}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowDetailsModal(false)}>
                    Fermer
                  </Button>
                  <Button className="flex-1">
                    Voir tous les devis
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
