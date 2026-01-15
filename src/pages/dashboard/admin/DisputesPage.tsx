import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Loader2, AlertCircle, CheckCircle, Clock, User, DollarSign } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Dispute {
  id: string;
  titre: string;
  description: string;
  type: "qualite" | "delai" | "paiement" | "autre";
  statut: "open" | "in_progress" | "resolved" | "escalated" | "closed";
  priorite: "low" | "medium" | "high" | "urgent";
  montant_litige?: number;
  client_id: string;
  prestataire_id: string;
  mission_id?: string;
  resolution?: string;
  decision?: string;
  notes_admin?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  // Joined data
  client_name?: string;
  prestataire_name?: string;
  mission_title?: string;
}

export default function DisputesPage() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDisputes();
    }
  }, [user]);

  const fetchDisputes = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      // Fetch disputes from database
      const { data: litigesData, error: litigesError } = await supabase
        .from("litiges")
        .select("*")
        .order("created_at", { ascending: false });

      if (litigesError) throw litigesError;

      // Fetch related data for each dispute
      const disputesWithDetails = await Promise.all(
        (litigesData || []).map(async (litige: any) => {
          // Fetch client name
          let clientName = "Client inconnu";
          if (litige.client_id) {
            const { data: clientData } = await supabase
              .from("clients")
              .select("full_name")
              .eq("id", litige.client_id)
              .single();
            if (clientData) clientName = clientData.full_name;
          }

          // Fetch prestataire name
          let prestataireName = "Prestataire inconnu";
          if (litige.prestataire_id) {
            const { data: prestataireData } = await supabase
              .from("prestataires")
              .select("full_name")
              .eq("id", litige.prestataire_id)
              .single();
            if (prestataireData) prestataireName = prestataireData.full_name;
          }

          // Fetch mission title
          let missionTitle = "Mission inconnue";
          if (litige.mission_id) {
            const { data: missionData } = await supabase
              .from("missions")
              .select("titre")
              .eq("id", litige.mission_id)
              .single();
            if (missionData) missionTitle = missionData.titre;
          }

          return {
            ...litige,
            client_name: clientName,
            prestataire_name: prestataireName,
            mission_title: missionTitle,
          };
        })
      );

      setDisputes(disputesWithDetails);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des litiges");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (disputeId: string, decision: "refund_client" | "pay_prestataire") => {
    try {
      const { error } = await supabase
        .from("litiges")
        .update({
          statut: "resolved",
          decision: decision,
          resolved_at: new Date().toISOString(),
          resolu_par: "admin",
        })
        .eq("id", disputeId);

      if (error) throw error;
      
      toast.success("Litige résolu avec succès");
      await fetchDisputes();
    } catch (error: any) {
      toast.error("Erreur lors de la résolution");
      console.error(error);
    }
  };

  const handleEscalate = async (disputeId: string) => {
    try {
      const { error } = await supabase
        .from("litiges")
        .update({
          statut: "escalated",
          priorite: "urgent",
        })
        .eq("id", disputeId);

      if (error) throw error;
      
      toast.success("Litige escaladé");
      await fetchDisputes();
    } catch (error: any) {
      toast.error("Erreur lors de l'escalade");
      console.error(error);
    }
  };

  const handleUpdateNotes = async (disputeId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from("litiges")
        .update({ notes_admin: notes })
        .eq("id", disputeId);

      if (error) throw error;
      
      toast.success("Notes mises à jour");
      await fetchDisputes();
    } catch (error: any) {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    }
  };

  const openDisputes = disputes.filter(d => d.statut === "open" || d.statut === "in_progress");
  const resolvedDisputes = disputes.filter(d => d.statut === "resolved" || d.statut === "closed");
  const escalatedDisputes = disputes.filter(d => d.statut === "escalated");

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-600/10 text-red-700 border-red-600/20";
      case "high":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "low":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default:
        return "";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "Urgente";
      case "high":
        return "Haute";
      case "medium":
        return "Moyenne";
      case "low":
        return "Basse";
      default:
        return priority;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "qualite":
        return "Qualité";
      case "delai":
        return "Délai";
      case "paiement":
        return "Paiement";
      case "autre":
        return "Autre";
      default:
        return type;
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case "open":
        return "Ouvert";
      case "in_progress":
        return "En cours";
      case "resolved":
        return "Résolu";
      case "escalated":
        return "Escaladé";
      case "closed":
        return "Fermé";
      default:
        return statut;
    }
  };

  const DisputeCard = ({ dispute }: { dispute: Dispute }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold">{dispute.titre}</h3>
              <Badge variant="outline" className={getPriorityColor(dispute.priorite)}>
                {getPriorityLabel(dispute.priorite)}
              </Badge>
              <Badge variant="secondary">{getTypeLabel(dispute.type)}</Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{dispute.description}</p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {dispute.client_name} vs {dispute.prestataire_name}
              </span>
              {dispute.montant_litige && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  {dispute.montant_litige.toLocaleString("fr-FR")} FC
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(dispute.created_at).toLocaleDateString("fr-FR")}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedDispute(dispute);
                setShowDetailsModal(true);
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout role="admin" userName="Admin" userRole="Administrateur">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Résolution des Litiges</h1>
          <p className="text-muted-foreground">Gérez les litiges entre clients et prestataires</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold">{disputes.length}</p>
                <p className="text-sm text-muted-foreground">Total litiges</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{openDisputes.length}</p>
                <p className="text-sm text-muted-foreground">Ouverts</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{resolvedDisputes.length}</p>
                <p className="text-sm text-muted-foreground">Résolus</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">{escalatedDisputes.length}</p>
                <p className="text-sm text-muted-foreground">Escaladés</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="open" className="space-y-4">
          <TabsList>
            <TabsTrigger value="open">
              Ouverts ({openDisputes.length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Résolus ({resolvedDisputes.length})
            </TabsTrigger>
            <TabsTrigger value="escalated">
              Escaladés ({escalatedDisputes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : openDisputes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Aucun litige ouvert
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {openDisputes.map((dispute) => (
                  <DisputeCard key={dispute.id} dispute={dispute} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resolved" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : resolvedDisputes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Aucun litige résolu
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {resolvedDisputes.map((dispute) => (
                  <DisputeCard key={dispute.id} dispute={dispute} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="escalated" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : escalatedDisputes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Aucun litige escaladé
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {escalatedDisputes.map((dispute) => (
                  <DisputeCard key={dispute.id} dispute={dispute} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Details Modal */}
        {showDetailsModal && selectedDispute && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>{selectedDispute.titre}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description du litige</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedDispute.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="font-medium">{selectedDispute.client_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Prestataire</p>
                    <p className="font-medium">{selectedDispute.prestataire_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mission</p>
                    <p className="font-medium">{selectedDispute.mission_title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <Badge variant="secondary">{getTypeLabel(selectedDispute.type)}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Priorité</p>
                    <Badge variant="outline" className={getPriorityColor(selectedDispute.priorite)}>
                      {getPriorityLabel(selectedDispute.priorite)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Statut</p>
                    <Badge variant="outline">
                      {getStatusLabel(selectedDispute.statut)}
                    </Badge>
                  </div>
                  {selectedDispute.montant_litige && (
                    <div>
                      <p className="text-sm text-muted-foreground">Montant du litige</p>
                      <p className="font-medium flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {selectedDispute.montant_litige.toLocaleString("fr-FR")} FC
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Créé le</p>
                    <p className="font-medium">
                      {new Date(selectedDispute.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  {selectedDispute.resolved_at && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Résolu le</p>
                      <p className="font-medium">
                        {new Date(selectedDispute.resolved_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  )}
                </div>

                {selectedDispute.resolution && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Résolution</p>
                    <p className="text-sm bg-green-500/10 text-green-700 p-3 rounded-lg border border-green-500/20">
                      {selectedDispute.resolution}
                    </p>
                  </div>
                )}

                {selectedDispute.notes_admin && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Notes administrateur</p>
                    <p className="text-sm bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                      {selectedDispute.notes_admin}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    Fermer
                  </Button>
                  {(selectedDispute.statut === "open" || selectedDispute.statut === "in_progress") && (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          handleEscalate(selectedDispute.id);
                          setShowDetailsModal(false);
                        }}
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Escalader
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => {
                          handleResolve(selectedDispute.id, "refund_client");
                          setShowDetailsModal(false);
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Rembourser Client
                      </Button>
                      <Button
                        variant="default"
                        className="flex-1"
                        onClick={() => {
                          handleResolve(selectedDispute.id, "pay_prestataire");
                          setShowDetailsModal(false);
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Payer Prestataire
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
