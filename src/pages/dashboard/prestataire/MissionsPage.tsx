import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Eye, CheckCircle, Clock, AlertCircle, MapPin, DollarSign, Loader, User, Calendar, FileText, Image as ImageIcon } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Mission {
  id: string;
  devis_id: string;
  demande_id: string;
  client_id: string;
  prestataire_id: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
  devis?: {
    montant_ttc?: number;
    amount?: number;
    titre?: string;
    description?: string;
    delai_execution?: string;
    conditions_paiement?: string;
    devise?: string;
  };
  demandes?: {
    titre?: string;
    title?: string;
    description?: string;
    localisation?: string;
    location?: string;
    budget?: number;
    budget_min?: number;
    budget_max?: number;
    urgence?: string;
    urgency?: string;
    images?: string[];
    client_id?: string;
    clients?: {
      full_name?: string;
    };
  };
}

export default function MissionsPage() {
  const { user } = useAuth();
  const [providerName, setProviderName] = useState("Prestataire");
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    if (user) {
      fetchProviderName();
      fetchMissions();
    }
  }, [user]);

  const fetchProviderName = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("prestataires")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.full_name) {
        setProviderName(data.full_name);
      }
    } catch (error) {
      console.error("Error fetching provider name:", error);
    }
  };

  const fetchMissions = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get prestataire ID
      const { data: prestataireData } = await supabase
        .from("prestataires")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!prestataireData) {
        setMissions([]);
        return;
      }

      // Fetch missions for this prestataire
      const { data, error } = await supabase
        .from("missions")
        .select(`
          *,
          devis (
            montant_ttc,
            amount,
            titre,
            description,
            delai_execution,
            conditions_paiement,
            devise
          ),
          demandes (
            titre,
            title,
            description,
            localisation,
            location,
            budget,
            budget_min,
            budget_max,
            urgence,
            urgency,
            images,
            client_id,
            clients (
              full_name
            )
          )
        `)
        .eq("prestataire_id", prestataireData.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMissions(data || []);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement des missions");
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const inProgress = missions.filter(m => m.status === "in_progress").length;
    const completed = missions.filter(m => m.status === "completed").length;
    const totalEarnings = missions
      .filter(m => m.status === "completed")
      .reduce((sum, m) => sum + (m.devis?.montant_ttc || m.devis?.amount || 0), 0);

    return [
      { title: "Missions en cours", value: inProgress.toString(), subtitle: "Actives", icon: <Clock className="w-5 h-5" /> },
      { title: "Missions complétées", value: completed.toString(), subtitle: "Total", icon: <CheckCircle className="w-5 h-5" /> },
      { title: "Revenus générés", value: `${totalEarnings.toLocaleString()} FC`, subtitle: "Total", icon: <DollarSign className="w-5 h-5" /> },
    ];
  };

  const getUrgencyBadge = (urgency?: string) => {
    if (urgency === "urgent") {
      return <Badge variant="destructive" className="text-xs">Urgent</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">Normal</Badge>;
  };

  const handleUpdateStatus = async () => {
    if (!selectedMission || !newStatus) {
      toast.error("Veuillez sélectionner un statut");
      return;
    }

    try {
      setUpdatingStatus(true);

      const { error } = await supabase
        .from("missions")
        .update({ 
          status: newStatus,
          end_date: newStatus === "completed" ? new Date().toISOString() : null
        })
        .eq("id", selectedMission.id);

      if (error) throw error;

      toast.success("Statut mis à jour avec succès");
      setShowDetailsModal(false);
      fetchMissions(); // Reload missions
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openMissionDetails = (mission: Mission) => {
    setSelectedMission(mission);
    setNewStatus(mission.status);
    setShowDetailsModal(true);
  };

  const filteredMissions = missions.filter(m => {
    const matchesSearch = (m.demandes?.titre || m.demandes?.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || m.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">En attente</Badge>;
      case "in_progress":
        return <Badge variant="default">En cours</Badge>;
      case "completed":
        return <Badge>Complétée</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Annulée</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <DashboardLayout role="prestataire" userName={providerName} userRole="Prestataire">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Mes Missions</h1>
            <p className="text-muted-foreground">Gérez vos missions et suivez votre progression</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {getStats().map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Rechercher une mission..." 
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
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="completed">Complétées</SelectItem>
              <SelectItem value="cancelled">Annulées</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : missions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Aucune mission trouvée</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">Toutes ({missions.length})</TabsTrigger>
              <TabsTrigger value="pending">En attente ({missions.filter(m => m.status === "pending").length})</TabsTrigger>
              <TabsTrigger value="in_progress">En cours ({missions.filter(m => m.status === "in_progress").length})</TabsTrigger>
              <TabsTrigger value="completed">Complétées ({missions.filter(m => m.status === "completed").length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {filteredMissions.map((mission) => (
                <Card key={mission.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-start gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{mission.demandes?.titre || mission.demandes?.title || "Mission"}</h3>
                          {getStatusBadge(mission.status)}
                          {getUrgencyBadge(mission.demandes?.urgence || mission.demandes?.urgency)}
                        </div>
                        
                        {mission.demandes?.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{mission.demandes.description}</p>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {mission.demandes?.clients?.full_name || "Client"}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {mission.demandes?.localisation || mission.demandes?.location || "Localisation"}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {mission.demandes?.budget_min && mission.demandes?.budget_max 
                              ? `${mission.demandes.budget_min.toLocaleString()} - ${mission.demandes.budget_max.toLocaleString()} FC`
                              : `${(mission.devis?.montant_ttc || mission.devis?.amount || 0).toLocaleString()} FC`
                            }
                          </span>
                          {mission.demandes?.images && mission.demandes.images.length > 0 && (
                            <span className="flex items-center gap-1">
                              <ImageIcon className="w-4 h-4" />
                              {mission.demandes.images.length} photo{mission.demandes.images.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        
                        {mission.start_date && (
                          <div className="text-sm text-muted-foreground">
                            Début: {new Date(mission.start_date).toLocaleDateString()}
                            {mission.end_date && ` - Fin: ${new Date(mission.end_date).toLocaleDateString()}`}
                          </div>
                        )}
                      </div>
                      <Button 
                        variant="outline"
                        onClick={() => openMissionDetails(mission)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {filteredMissions.filter(m => m.status === "pending").map((mission) => (
                <Card key={mission.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-start gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{mission.demandes?.titre || mission.demandes?.title || "Mission"}</h3>
                          {getUrgencyBadge(mission.demandes?.urgence || mission.demandes?.urgency)}
                        </div>
                        
                        {mission.demandes?.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{mission.demandes.description}</p>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {mission.demandes?.clients?.full_name || "Client"}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {mission.demandes?.localisation || mission.demandes?.location}
                          </span>
                        </div>
                        
                        <p className="text-lg font-bold text-primary">{(mission.devis?.montant_ttc || mission.devis?.amount || 0).toLocaleString()} FC</p>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={() => openMissionDetails(mission)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="in_progress" className="space-y-4">
              {filteredMissions.filter(m => m.status === "in_progress").map((mission) => (
                <Card key={mission.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-start gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{mission.demandes?.titre || mission.demandes?.title || "Mission"}</h3>
                          {getUrgencyBadge(mission.demandes?.urgence || mission.demandes?.urgency)}
                        </div>
                        
                        {mission.demandes?.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{mission.demandes.description}</p>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {mission.demandes?.clients?.full_name || "Client"}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {mission.demandes?.localisation || mission.demandes?.location}
                          </span>
                        </div>
                        
                        <p className="text-lg font-bold text-primary">{(mission.devis?.montant_ttc || mission.devis?.amount || 0).toLocaleString()} FC</p>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={() => openMissionDetails(mission)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {filteredMissions.filter(m => m.status === "completed").map((mission) => (
                <Card key={mission.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-start gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{mission.demandes?.titre || mission.demandes?.title || "Mission"}</h3>
                          {getUrgencyBadge(mission.demandes?.urgence || mission.demandes?.urgency)}
                        </div>
                        
                        {mission.demandes?.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{mission.demandes.description}</p>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {mission.demandes?.clients?.full_name || "Client"}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {mission.demandes?.localisation || mission.demandes?.location}
                          </span>
                        </div>
                        
                        <p className="text-lg font-bold text-primary">{(mission.devis?.montant_ttc || mission.devis?.amount || 0).toLocaleString()} FC</p>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={() => openMissionDetails(mission)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedMission && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetailsModal(false)}
          >
            <div 
              className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between bg-white dark:bg-gray-900">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedMission.demandes?.titre || selectedMission.demandes?.title || "Mission"}
                    </h2>
                    {getStatusBadge(selectedMission.status)}
                    {getUrgencyBadge(selectedMission.demandes?.urgence || selectedMission.demandes?.urgency)}
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(85vh-140px)] p-6 space-y-6 bg-white dark:bg-gray-900">
                {/* Description */}
                {selectedMission.demandes?.description && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-gray-900 dark:text-white">
                      <FileText className="w-4 h-4" />
                      Description
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {selectedMission.demandes.description}
                    </p>
                  </div>
                )}

                {/* Client Info */}
                {selectedMission.demandes?.clients && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                      <User className="w-4 h-4" />
                      Client
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{selectedMission.demandes.clients.full_name || "Non spécifié"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{selectedMission.demandes.localisation || selectedMission.demandes.location}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Budget */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                    <DollarSign className="w-4 h-4" />
                    Budget
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {selectedMission.demandes?.budget_min && selectedMission.demandes?.budget_max && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Budget client</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedMission.demandes.budget_min.toLocaleString()} - {selectedMission.demandes.budget_max.toLocaleString()} FC
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Devis accepté</p>
                      <p className="font-medium text-lg text-primary">
                        {(selectedMission.devis?.montant_ttc || selectedMission.devis?.amount || 0).toLocaleString()} {selectedMission.devis?.devise || 'FC'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Images */}
                {selectedMission.demandes?.images && selectedMission.demandes.images.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                      <ImageIcon className="w-4 h-4" />
                      Photos ({selectedMission.demandes.images.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedMission.demandes.images.map((imageUrl, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                          <img 
                            src={imageUrl} 
                            alt={`Image ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                            onClick={() => window.open(imageUrl, '_blank')}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Update */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Changer le statut</h4>
                  <div className="flex gap-3">
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="in_progress">En cours</SelectItem>
                        <SelectItem value="completed">Complétée</SelectItem>
                        <SelectItem value="cancelled">Annulée</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleUpdateStatus}
                      disabled={updatingStatus || !newStatus}
                    >
                      {updatingStatus ? <Loader className="w-4 h-4 animate-spin" /> : "Mettre à jour"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
