import { useState, useEffect } from "react";
import { PrestatairePageShell } from "@/components/prestataire/PrestatairePageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Clock, MapPin, User, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { missionsApi, prestatairesApi } from "@/lib/api";
import { unwrapPaginated } from "@/lib/api-utils";
import { displayNameFromProfil, getProfil, prestataireIdFromUser } from "@/lib/kazipro-profile";
import { toast } from "sonner";
import { FormDrawer } from "@/components/ui/FormDrawer";
import { CalendrierPageSkeleton } from "@/components/dashboard/AdminLoadingSkeleton";
import { PrestataireEmptyState } from "@/components/prestataire/PrestataireEmptyState";

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

export default function CalendrierPage({ embedded = false }: { embedded?: boolean }) {
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
    const profil = getProfil(user);
    if (profil) setProviderName(displayNameFromProfil(profil, user.name || "Prestataire"));
  };

  const fetchMissions = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await missionsApi.getAll({ per_page: 100 });
      const data = unwrapPaginated<Record<string, unknown>>(res);
      const transformedData = data.map((m) => ({
        id: String(m.id),
        titre: String((m.demande as { titre?: string })?.titre ?? (m.demandes as { titre?: string })?.titre ?? 'Mission'),
        client_name: String((m.client as { nom?: string })?.nom ?? 'Client'),
        localisation: String((m.demande as { localisation?: string })?.localisation ?? 'Non spécifié'),
        start_date: String(m.start_date ?? m.date_debut ?? m.created_at ?? new Date().toISOString()),
        end_date: String(m.end_date ?? m.date_fin ?? m.start_date ?? m.created_at ?? new Date().toISOString()),
        status: (['pending', 'in_progress', 'completed', 'cancelled'].includes(String(m.statut ?? m.status))
          ? String(m.statut ?? m.status) : 'pending') as Mission['status'],
        type: 'mission',
        db_status: String(m.statut ?? m.status),
      }));
      setMissions(transformedData);
    } catch (error: unknown) {
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

      toast.info("Création d'événements calendrier via missions — fonctionnalité locale");
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
    <PrestatairePageShell embedded={embedded} userName={providerName} userRole="Prestataire">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {!embedded && (
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Mon Calendrier</h1>
            <p className="text-muted-foreground">Planifiez et gérez vos rendez-vous et missions</p>
          </div>
          )}
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

        {loading ? (
          <CalendrierPageSkeleton />
        ) : (
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
                    {selectedDateEvents.length > 0 ? (
                      <div className="space-y-3">
                        {selectedDateEvents.map((mission) => (
                          <div
                            key={mission.id}
                            className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-4">
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
              {missions.length === 0 ? (
                <PrestataireEmptyState context="calendrier" hasActiveFilters={false} />
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
                <PrestataireEmptyState
                  context="calendrier"
                  hasActiveFilters={false}
                  className="border-none bg-transparent shadow-none"
                />
              )}
            </CardContent>
          </Card>
        </div>
        )}

        <FormDrawer
          open={showNewEventModal}
          onOpenChange={(open) => {
            setShowNewEventModal(open);
            if (!open) {
              setNewEventData({
                title: "",
                type: "rdv",
                startTime: "",
                endTime: "",
                clientName: "",
                location: "",
              });
            }
          }}
          title="Ajouter un événement"
          footer={
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowNewEventModal(false)}
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
          }
        >
          <div className="space-y-4">
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
          </div>
        </FormDrawer>

        <FormDrawer
          open={showEventDetailsModal && !!selectedEvent}
          onOpenChange={(open) => {
            if (!open) {
              setShowEventDetailsModal(false);
              setSelectedEvent(null);
            }
          }}
          title={selectedEvent?.titre ?? "Événement"}
          footer={
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
              <Button variant="destructive" className="flex-1">
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            </div>
          }
        >
          {selectedEvent && (
            <div className="space-y-4">
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
            </div>
          )}
        </FormDrawer>
      </div>
    </PrestatairePageShell>
  );
}
