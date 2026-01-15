import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Clock, MapPin, User, Plus, X, Edit, Trash2, Loader2 } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Mission {
  id: string;
  titre: string;
  client_name: string;
  localisation: string;
  start_date: string;
  end_date: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  type?: string;
  db_status?: string; // Original status from database
}

const typeConfig = {
  mission: { label: "Mission", color: "bg-primary/10 text-primary border-primary/20" },
  visite: { label: "Visite", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  rdv: { label: "RDV", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  autre: { label: "Autre", color: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
};

export default function CalendrierPage() {
  const { user } = useAuth();
  const [providerName, setProviderName] = useState("Prestataire");
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<"week" | "month">("week");
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Mission | null>(null);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [newEventData, setNewEventData] = useState({
    title: "",
    type: "rdv" as "mission" | "visite" | "rdv" | "autre",
    startTime: "",
    endTime: "",
    clientName: "",
    location: ""
  });
  const [creating, setCreating] = useState(false);

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
      
      // Récupérer l'ID du prestataire
      const { data: prestataireData } = await supabase
        .from("prestataires")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!prestataireData) {
        setLoading(false);
        return;
      }

      // Charger les événements depuis calendar_events
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("prestataire_id", prestataireData.id)
        .order("start_date", { ascending: true });

      if (error) throw error;
      
      // Transformer les événements calendar_events en format Mission pour compatibilité
      const transformedData = (data || []).map(event => ({
        id: event.id,
        titre: event.title,
        client_name: event.client_name || 'Client',
        localisation: event.location || 'Non spécifié',
        start_date: event.start_date,
        end_date: event.end_date,
        status: (event.status === 'scheduled' ? 'pending' : 
                event.status === 'confirmed' ? 'in_progress' :
                event.status === 'completed' ? 'completed' : 'cancelled') as "pending" | "in_progress" | "completed" | "cancelled",
        type: event.type,
        db_status: event.status
      }));
      
      setMissions(transformedData);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des événements");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getEventsForDate = (date: Date) => {
    return missions.filter((mission) => {
      const missionDate = new Date(mission.start_date);
      return isSameDay(missionDate, date);
    });
  };

  const selectedDateEvents = getEventsForDate(selectedDate);

  const handleCreateEvent = async () => {
    if (!user || !newEventData.title || !newEventData.startTime || !newEventData.endTime) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      setCreating(true);

      // Récupérer l'ID du prestataire depuis la table prestataires
      const { data: prestataireData, error: prestataireError } = await supabase
        .from('prestataires')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (prestataireError || !prestataireData) {
        toast.error("Erreur: Profil prestataire non trouvé");
        return;
      }

      // Construire les dates complètes
      const startDateTime = new Date(selectedDate);
      const [startHours, startMinutes] = newEventData.startTime.split(':');
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0);

      const endDateTime = new Date(selectedDate);
      const [endHours, endMinutes] = newEventData.endTime.split(':');
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0);

      // Créer l'événement dans calendar_events
      const { error } = await supabase
        .from('calendar_events')
        .insert({
          title: newEventData.title,
          type: newEventData.type,
          start_date: startDateTime.toISOString(),
          end_date: endDateTime.toISOString(),
          prestataire_id: prestataireData.id,
          client_name: newEventData.clientName || null,
          location: newEventData.location || null,
          status: 'scheduled'
        });

      if (error) throw error;

      toast.success("Événement créé avec succès");
      setShowNewEventModal(false);
      setNewEventData({
        title: "",
        type: "rdv",
        startTime: "",
        endTime: "",
        clientName: "",
        location: ""
      });
      fetchMissions(); // Recharger les événements
    } catch (error: any) {
      console.error("Erreur lors de la création:", error);
      toast.error(error.message || "Erreur lors de la création de l'événement");
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardLayout role="prestataire" userName={providerName} userRole="Prestataire">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Mon Calendrier</h1>
            <p className="text-muted-foreground">Planifiez et gérez vos rendez-vous et missions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setView(view === "week" ? "month" : "week")}>
              Vue {view === "week" ? "Mois" : "Semaine"}
            </Button>
            <Button onClick={() => setShowNewEventModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un événement
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>
                  {format(selectedDate, "MMMM yyyy", { locale: fr })}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedDate(addDays(selectedDate, -7))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDate(new Date())}>
                    Aujourd'hui
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedDate(addDays(selectedDate, 7))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {view === "week" ? (
                <div className="space-y-4">
                  {/* Week header */}
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day) => (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={`p-2 rounded-lg text-center transition-colors ${
                          isSameDay(day, selectedDate)
                            ? "bg-primary text-primary-foreground"
                            : isSameDay(day, new Date())
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted"
                        }`}
                      >
                        <p className="text-xs text-inherit opacity-70">
                          {format(day, "EEE", { locale: fr })}
                        </p>
                        <p className="text-lg font-semibold">{format(day, "d")}</p>
                        {getEventsForDate(day).length > 0 && (
                          <div className="flex justify-center gap-1 mt-1">
                            {getEventsForDate(day).slice(0, 3).map((_, i) => (
                              <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary" />
                            ))}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Week events */}
                  <div className="border-t border-border pt-4">
                    <h4 className="font-medium mb-3">
                      Événements du {format(selectedDate, "d MMMM", { locale: fr })}
                    </h4>
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : selectedDateEvents.length > 0 ? (
                      <div className="space-y-3">
                        {selectedDateEvents.map((mission) => (
                          <div
                            key={mission.id}
                            className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className={`${typeConfig[mission.type as keyof typeof typeConfig]?.color || typeConfig.mission.color}`}>
                                    {typeConfig[mission.type as keyof typeof typeConfig]?.label || typeConfig.mission.label}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(mission.start_date), "HH:mm")} - {format(new Date(mission.end_date), "HH:mm")}
                                  </span>
                                </div>
                                <h5 className="font-medium">{mission.titre}</h5>
                                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {mission.client_name}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {mission.localisation}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    setSelectedEvent(mission);
                                    setShowEventDetailsModal(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Aucun événement prévu pour cette date
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={fr}
                  className="rounded-md border w-full"
                />
              )}
            </CardContent>
          </Card>

          {/* Upcoming events */}
          <Card>
            <CardHeader>
              <CardTitle>Prochains événements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : missions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucun événement prévu
                </p>
              ) : missions
                .filter((m) => {
                  const eventDate = new Date(m.start_date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return eventDate >= today;
                })
                .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                .slice(0, 5)
                .length > 0 ? (
                missions
                  .filter((m) => {
                    const eventDate = new Date(m.start_date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return eventDate >= today;
                  })
                  .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                  .slice(0, 5)
                  .map((mission) => (
                  <div
                    key={mission.id}
                    className="p-3 border border-border rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`${typeConfig[mission.type as keyof typeof typeConfig]?.color || typeConfig.mission.color} text-xs`}>
                        {typeConfig[mission.type as keyof typeof typeConfig]?.label || typeConfig.mission.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(mission.start_date), "d MMM", { locale: fr })}
                      </span>
                    </div>
                    <h5 className="font-medium text-sm">{mission.titre}</h5>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(mission.start_date), "HH:mm")} - {format(new Date(mission.end_date), "HH:mm")}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {mission.client_name}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Aucun événement à venir
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* New Event Modal */}
        {showNewEventModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Ajouter un événement</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    setShowNewEventModal(false);
                    setNewEventData({
                      title: "",
                      type: "rdv",
                      startTime: "",
                      endTime: "",
                      clientName: "",
                      location: ""
                    });
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input 
                    type="text" 
                    value={format(selectedDate, "d MMMM yyyy", { locale: fr })}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Titre *</Label>
                  <Input 
                    placeholder="Ex: Visite technique, RDV client..." 
                    value={newEventData.title}
                    onChange={(e) => setNewEventData({...newEventData, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select 
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background"
                    value={newEventData.type}
                    onChange={(e) => setNewEventData({...newEventData, type: e.target.value as any})}
                  >
                    <option value="rdv">RDV</option>
                    <option value="visite">Visite</option>
                    <option value="mission">Mission</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Heure début *</Label>
                    <Input 
                      type="time" 
                      value={newEventData.startTime}
                      onChange={(e) => setNewEventData({...newEventData, startTime: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Heure fin *</Label>
                    <Input 
                      type="time" 
                      value={newEventData.endTime}
                      onChange={(e) => setNewEventData({...newEventData, endTime: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Client (optionnel)</Label>
                  <Input 
                    placeholder="Nom du client" 
                    value={newEventData.clientName}
                    onChange={(e) => setNewEventData({...newEventData, clientName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Localisation (optionnel)</Label>
                  <Input 
                    placeholder="Adresse" 
                    value={newEventData.location}
                    onChange={(e) => setNewEventData({...newEventData, location: e.target.value})}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => {
                      setShowNewEventModal(false);
                      setNewEventData({
                        title: "",
                        type: "rdv",
                        startTime: "",
                        endTime: "",
                        clientName: "",
                        location: ""
                      });
                    }}
                    disabled={creating}
                  >
                    Annuler
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleCreateEvent}
                    disabled={creating || !newEventData.title || !newEventData.startTime || !newEventData.endTime}
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Création...
                      </>
                    ) : (
                      "Créer"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Event Details Modal */}
        {showEventDetailsModal && selectedEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{selectedEvent.titre}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowEventDetailsModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <Badge variant="outline" className={`${typeConfig[selectedEvent.type as keyof typeof typeConfig]?.color || typeConfig.mission.color}`}>
                      {typeConfig[selectedEvent.type as keyof typeof typeConfig]?.label || typeConfig.mission.label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Horaire</p>
                    <p className="font-medium">
                      {format(new Date(selectedEvent.start_date), "HH:mm")} - {format(new Date(selectedEvent.end_date), "HH:mm")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="font-medium">{selectedEvent.client_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Localisation</p>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {selectedEvent.localisation}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Statut</p>
                    <Badge variant="outline">{selectedEvent.db_status || selectedEvent.status}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowEventDetailsModal(false)}>
                    Fermer
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  <Button variant="destructive" className="flex-1">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
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
