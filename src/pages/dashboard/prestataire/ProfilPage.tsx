import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Camera, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Award, 
  Shield, 
  Edit, 
  Plus,
  Briefcase,
  CheckCircle,
  Share2,
  Download,
  Trash2,
  Loader2,
  Save,
  X
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ProviderProfile {
  id: string;
  user_id: string;
  full_name: string;
  profession: string;
  bio?: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  verified: boolean;
  created_at: string;
  experience_years?: number;
  hourly_rate?: number;
  availability?: string;
  // Documents
  id_document_url?: string;
  qualification_url?: string;
  // Champs personne physique/morale
  type_prestataire?: 'physique' | 'morale';
  // Personne physique
  nom?: string;
  prenom?: string;
  date_naissance?: string;
  numero_cni?: string;
  // Personne morale
  raison_sociale?: string;
  forme_juridique?: string;
  numero_rccm?: string;
  numero_impot?: string;
  numero_id_nat?: string;
  representant_legal_nom?: string;
  representant_legal_prenom?: string;
  representant_legal_fonction?: string;
  adresse_siege?: string;
  ville_siege?: string;
  pays_siege?: string;
}

interface Avis {
  id: string;
  rating: number;
  commentaire: string;
  created_at: string;
  client_id: string;
  demande_id?: string;
}

interface ProviderService {
  id: string;
  service: string;
  niveau_competence: string;
  annees_experience: number;
  tarif_horaire?: number;
  principal: boolean;
}

const professions = [
  "Électricien",
  "Plombier",
  "Menuisier",
  "Maçon",
  "Peintre",
  "Mécanicien",
  "Informaticien",
  "Jardinier",
  "Couturier/Couturière",
  "Coiffeur/Coiffeuse",
];

const communes = [
  "Bandalungwa", "Barumbu", "Bumbu", "Gombe", "Kalamu",
  "Kasa-Vubu", "Kimbanseke", "Kinshasa", "Kintambo", "Kisenso",
  "Lemba", "Limete", "Lingwala", "Makala", "Maluku",
  "Masina", "Matete", "Mont-Ngafula", "Ndjili", "Ngaba",
  "Ngaliema", "Ngiri-Ngiri", "Nsele", "Selembao"
];

export default function ProfilPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [services, setServices] = useState<ProviderService[]>([]);
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({
    service: "",
    niveau: "intermediaire",
    experience: 0,
    tarif: 0,
  });
  
  // Stats
  const [stats, setStats] = useState({
    rating: 0,
    reviewsCount: 0,
    missionsCompleted: 0,
    satisfactionRate: 0,
  });
  
  // Reviews
  const [reviews, setReviews] = useState<Avis[]>([]);
  
  // Form data
  const [formData, setFormData] = useState({
    full_name: "",
    profession: "",
    bio: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    experience_years: 0,
    hourly_rate: 0,
    availability: "disponible",
    // Personne physique
    nom: "",
    prenom: "",
    date_naissance: "",
    numero_cni: "",
    // Personne morale
    raison_sociale: "",
    forme_juridique: "",
    numero_rccm: "",
    numero_impot: "",
    numero_id_nat: "",
    representant_legal_nom: "",
    representant_legal_prenom: "",
    representant_legal_fonction: "",
    adresse_siege: "",
    ville_siege: "",
    pays_siege: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Récupérer le profil
      const { data: profileData, error: profileError } = await supabase
        .from("prestataires")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (!profileData) {
        console.log("No provider profile found for user:", user.id);
        setLoading(false);
        return;
      }

      if (profileData) {
        setProfile(profileData);
        setFormData({
          full_name: profileData.full_name || "",
          profession: profileData.profession || "",
          bio: profileData.bio || "",
          phone: profileData.phone || "",
          email: profileData.email || user.email || "",
          address: profileData.address || "",
          city: profileData.city || "",
          experience_years: profileData.experience_years || 0,
          hourly_rate: profileData.hourly_rate || 0,
          availability: profileData.availability || "disponible",
          // Personne physique
          nom: profileData.nom || "",
          prenom: profileData.prenom || "",
          date_naissance: profileData.date_naissance || "",
          numero_cni: profileData.numero_cni || "",
          // Personne morale
          raison_sociale: profileData.raison_sociale || "",
          forme_juridique: profileData.forme_juridique || "",
          numero_rccm: profileData.numero_rccm || "",
          numero_impot: profileData.numero_impot || "",
          numero_id_nat: profileData.numero_id_nat || "",
          representant_legal_nom: profileData.representant_legal_nom || "",
          representant_legal_prenom: profileData.representant_legal_prenom || "",
          representant_legal_fonction: profileData.representant_legal_fonction || "",
          adresse_siege: profileData.adresse_siege || "",
          ville_siege: profileData.ville_siege || "",
          pays_siege: profileData.pays_siege || "RDC",
        });

        // Récupérer les services
        await fetchServices(profileData.id);
        
        // Récupérer les stats
        await fetchStats(profileData.id);
        
        // Récupérer les avis
        await fetchReviews(profileData.id);
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast.error("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async (providerId: string) => {
    try {
      const { data, error } = await supabase
        .from("prestataire_services")
        .select("*")
        .eq("prestataire_id", providerId)
        .order("principal", { ascending: false })
        .order("service", { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const handleAddService = async () => {
    if (!profile || !newService.service) {
      toast.error("Veuillez sélectionner un service");
      return;
    }

    try {
      const { error } = await supabase
        .from("prestataire_services")
        .insert({
          prestataire_id: profile.id,
          service: newService.service,
          niveau_competence: newService.niveau,
          annees_experience: newService.experience,
          tarif_horaire: newService.tarif || null,
          principal: false,
        });

      if (error) throw error;

      toast.success("Service ajouté avec succès");
      setShowAddService(false);
      setNewService({ service: "", niveau: "intermediaire", experience: 0, tarif: 0 });
      fetchServices(profile.id);
    } catch (error: any) {
      console.error("Error adding service:", error);
      toast.error("Erreur lors de l'ajout du service");
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from("prestataire_services")
        .delete()
        .eq("id", serviceId);

      if (error) throw error;

      toast.success("Service supprimé");
      fetchServices(profile.id);
    } catch (error: any) {
      console.error("Error deleting service:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleSetPrincipal = async (serviceId: string, serviceName: string) => {
    if (!profile) return;

    try {
      // Appeler la fonction SQL pour définir le service principal
      const { error } = await supabase.rpc('set_principal_service', {
        p_prestataire_id: profile.id,
        p_service: serviceName,
      });

      if (error) throw error;

      toast.success("Service principal mis à jour");
      fetchProfile();
    } catch (error: any) {
      console.error("Error setting principal service:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const fetchStats = async (providerId: string) => {
    try {
      // Récupérer les avis
      const { data: avisData } = await supabase
        .from("avis")
        .select("rating")
        .eq("prestataire_id", providerId);

      if (avisData && avisData.length > 0) {
        const avgRating = avisData.reduce((sum, a) => sum + a.rating, 0) / avisData.length;
        const satisfaction = (avgRating / 5) * 100;
        
        setStats(prev => ({
          ...prev,
          rating: Math.round(avgRating * 10) / 10,
          reviewsCount: avisData.length,
          satisfactionRate: Math.round(satisfaction),
        }));
      }

      // Récupérer les missions complétées
      const { data: missionsData } = await supabase
        .from("missions")
        .select("id")
        .eq("prestataire_id", providerId)
        .eq("status", "terminee");

      if (missionsData) {
        setStats(prev => ({
          ...prev,
          missionsCompleted: missionsData.length,
        }));
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchReviews = async (providerId: string) => {
    try {
      const { data, error } = await supabase
        .from("avis")
        .select(`
          id,
          rating,
          commentaire,
          created_at,
          client_id,
          demande_id
        `)
        .eq("prestataire_id", providerId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setReviews(data as any || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setSaving(true);

      const updateData: any = {
        full_name: formData.full_name,
        profession: formData.profession,
        bio: formData.bio,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        experience_years: formData.experience_years,
        hourly_rate: formData.hourly_rate,
        availability: formData.availability,
      };

      // Ajouter les champs selon le type
      if (profile.type_prestataire === 'physique') {
        updateData.nom = formData.nom;
        updateData.prenom = formData.prenom;
        updateData.date_naissance = formData.date_naissance || null;
        updateData.numero_cni = formData.numero_cni || null;
      } else if (profile.type_prestataire === 'morale') {
        updateData.raison_sociale = formData.raison_sociale;
        updateData.forme_juridique = formData.forme_juridique || null;
        updateData.numero_rccm = formData.numero_rccm || null;
        updateData.numero_impot = formData.numero_impot || null;
        updateData.numero_id_nat = formData.numero_id_nat || null;
        updateData.representant_legal_nom = formData.representant_legal_nom || null;
        updateData.representant_legal_prenom = formData.representant_legal_prenom || null;
        updateData.representant_legal_fonction = formData.representant_legal_fonction || null;
        updateData.adresse_siege = formData.adresse_siege || null;
        updateData.ville_siege = formData.ville_siege || null;
        updateData.pays_siege = formData.pays_siege || "RDC";
      }

      const { error } = await supabase
        .from("prestataires")
        .update(updateData)
        .eq("id", profile.id);

      if (error) throw error;

      toast.success("Profil mis à jour avec succès");
      setIsEditing(false);
      fetchProfile();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Erreur lors de la mise à jour du profil");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        profession: profile.profession || "",
        bio: profile.bio || "",
        phone: profile.phone || "",
        email: profile.email || "",
        address: profile.address || "",
        city: profile.city || "",
        experience_years: profile.experience_years || 0,
        hourly_rate: profile.hourly_rate || 0,
        availability: profile.availability || "disponible",
        // Personne physique
        nom: profile.nom || "",
        prenom: profile.prenom || "",
        date_naissance: profile.date_naissance || "",
        numero_cni: profile.numero_cni || "",
        // Personne morale
        raison_sociale: profile.raison_sociale || "",
        forme_juridique: profile.forme_juridique || "",
        numero_rccm: profile.numero_rccm || "",
        numero_impot: profile.numero_impot || "",
        numero_id_nat: profile.numero_id_nat || "",
        representant_legal_nom: profile.representant_legal_nom || "",
        representant_legal_prenom: profile.representant_legal_prenom || "",
        representant_legal_fonction: profile.representant_legal_fonction || "",
        adresse_siege: profile.adresse_siege || "",
        ville_siege: profile.ville_siege || "",
        pays_siege: profile.pays_siege || "RDC",
      });
    }
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  if (loading) {
    return (
      <DashboardLayout role="prestataire" userName="Prestataire" userRole="Prestataire">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout role="prestataire" userName="Prestataire" userRole="Prestataire">
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
              <Shield className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Profil prestataire non trouvé</h3>
              <p className="text-muted-foreground mb-4">
                Aucun profil prestataire n'est associé à ce compte.
              </p>
              <p className="text-sm text-muted-foreground">
                Assurez-vous d'être connecté avec un compte prestataire valide.
              </p>
            </div>
            <Button variant="outline" onClick={() => window.location.href = '/login'}>
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="prestataire" userName={profile.full_name} userRole={profile.profession}>
      <div className="space-y-6">
        {/* Profile header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="relative">
                <Avatar className="w-32 h-32">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-3xl">{getInitials(profile.full_name)}</AvatarFallback>
                </Avatar>
                <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 rounded-full">
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl font-display font-bold">{profile.full_name}</h1>
                      {profile.verified && (
                        <Badge variant="default" className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Vérifié
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">{profile.profession}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {isEditing ? (
                      <>
                        <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                          <X className="w-4 h-4 mr-2" />
                          Annuler
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={saving}>
                          {saving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          Enregistrer
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" size="sm">
                          <Share2 className="w-4 h-4 mr-2" />
                          Partager
                        </Button>
                        <Button size="sm" onClick={() => setIsEditing(true)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {profile.city || "Non renseigné"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {profile.phone || "Non renseigné"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {profile.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Membre depuis {new Date(profile.created_at).toLocaleDateString("fr-FR", { year: "numeric", month: "short" })}
                  </span>
                </div>

                <div className="flex flex-wrap gap-6">
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span className="text-2xl font-bold">{stats.rating || "-"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Note moyenne</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{stats.missionsCompleted}</p>
                    <p className="text-xs text-muted-foreground">Missions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{stats.satisfactionRate}%</p>
                    <p className="text-xs text-muted-foreground">Satisfaction</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{profile.experience_years || 0} ans</p>
                    <p className="text-xs text-muted-foreground">Expérience</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="about" className="space-y-4">
          <TabsList>
            <TabsTrigger value="about">À propos</TabsTrigger>
            <TabsTrigger value="services">Services ({services.length})</TabsTrigger>
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="reviews">Avis ({stats.reviewsCount})</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Décrivez votre expérience, vos compétences et ce qui vous distingue..."
                    className="min-h-[120px]"
                  />
                ) : (
                  <p className="text-muted-foreground whitespace-pre-line">
                    {profile.bio || "Aucune description pour le moment."}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Disponibilité</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Select value={formData.availability} onValueChange={(value) => setFormData({ ...formData, availability: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disponible">Disponible</SelectItem>
                      <SelectItem value="occupe">Occupé</SelectItem>
                      <SelectItem value="indisponible">Indisponible</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={
                    profile.availability === 'disponible' ? 'default' :
                    profile.availability === 'occupe' ? 'secondary' : 'outline'
                  }>
                    {profile.availability === 'disponible' ? 'Disponible' :
                     profile.availability === 'occupe' ? 'Occupé' : 'Indisponible'}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Mes services</CardTitle>
                <Dialog open={showAddService} onOpenChange={setShowAddService}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter un service
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ajouter un nouveau service</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-service">Service *</Label>
                        <Select value={newService.service} onValueChange={(value) => setNewService({ ...newService, service: value })}>
                          <SelectTrigger id="new-service">
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            {professions.filter(p => !services.some(s => s.service === p)).map((prof) => (
                              <SelectItem key={prof} value={prof}>{prof}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-niveau">Niveau de compétence</Label>
                        <Select value={newService.niveau} onValueChange={(value) => setNewService({ ...newService, niveau: value })}>
                          <SelectTrigger id="new-niveau">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="debutant">Débutant</SelectItem>
                            <SelectItem value="intermediaire">Intermédiaire</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-experience">Années d'expérience</Label>
                        <Input
                          id="new-experience"
                          type="number"
                          value={newService.experience}
                          onChange={(e) => setNewService({ ...newService, experience: parseInt(e.target.value) || 0 })}
                          min="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-tarif">Tarif horaire (FC) - optionnel</Label>
                        <Input
                          id="new-tarif"
                          type="number"
                          value={newService.tarif}
                          onChange={(e) => setNewService({ ...newService, tarif: parseInt(e.target.value) || 0 })}
                          min="0"
                        />
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button variant="outline" onClick={() => setShowAddService(false)} className="flex-1">
                          Annuler
                        </Button>
                        <Button onClick={handleAddService} className="flex-1">
                          Ajouter
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {services.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun service ajouté</p>
                    <p className="text-sm mt-1">Ajoutez vos services pour recevoir plus d'opportunités</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className={`p-4 border rounded-lg ${
                          service.principal ? 'border-secondary bg-secondary/5' : 'border-border'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{service.service}</h4>
                              {service.principal && (
                                <Badge variant="default" className="text-xs">
                                  Principal
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {service.niveau_competence === 'debutant' ? 'Débutant' :
                                 service.niveau_competence === 'intermediaire' ? 'Intermédiaire' : 'Expert'}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span>{service.annees_experience} ans d'expérience</span>
                              {service.tarif_horaire && (
                                <span>{service.tarif_horaire.toLocaleString()} FC/h</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!service.principal && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSetPrincipal(service.id, service.service)}
                                title="Définir comme service principal"
                              >
                                <Star className="w-4 h-4" />
                              </Button>
                            )}
                            {!service.principal && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteService(service.id)}
                                title="Supprimer ce service"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    💡 <strong>Astuce:</strong> Ajoutez plusieurs services pour recevoir plus d'opportunités. Votre service principal apparaîtra en premier sur votre profil.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info" className="space-y-6">
            {/* Type de prestataire */}
            {profile.type_prestataire && (
              <Card>
                <CardHeader>
                  <CardTitle>Type de prestataire</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <span className="text-3xl">
                      {profile.type_prestataire === 'physique' ? '👤' : '🏢'}
                    </span>
                    <div>
                      <p className="font-semibold">
                        {profile.type_prestataire === 'physique' 
                          ? 'Personne Physique (Individu)' 
                          : 'Personne Morale (Entreprise)'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {profile.type_prestataire === 'physique'
                          ? 'Vous êtes inscrit en tant qu\'individu'
                          : 'Vous êtes inscrit en tant qu\'entreprise'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informations selon le type */}
            {profile.type_prestataire === 'physique' && (
              <Card>
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prenom">Prénom</Label>
                      {isEditing ? (
                        <Input
                          id="prenom"
                          value={formData.prenom}
                          onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                          placeholder="Prénom"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">{profile.prenom || "Non renseigné"}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nom">Nom</Label>
                      {isEditing ? (
                        <Input
                          id="nom"
                          value={formData.nom}
                          onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                          placeholder="Nom"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">{profile.nom || "Non renseigné"}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="date_naissance">Date de naissance</Label>
                      {isEditing ? (
                        <Input
                          id="date_naissance"
                          type="date"
                          value={formData.date_naissance}
                          onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {profile.date_naissance 
                            ? new Date(profile.date_naissance).toLocaleDateString('fr-FR')
                            : "Non renseigné"}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="numero_cni">Numéro CNI / Passeport</Label>
                      {isEditing ? (
                        <Input
                          id="numero_cni"
                          value={formData.numero_cni}
                          onChange={(e) => setFormData({ ...formData, numero_cni: e.target.value })}
                          placeholder="Numéro CNI"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">{profile.numero_cni || "Non renseigné"}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {profile.type_prestataire === 'morale' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Informations de l'entreprise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="raison_sociale">Raison sociale</Label>
                        {isEditing ? (
                          <Input
                            id="raison_sociale"
                            value={formData.raison_sociale}
                            onChange={(e) => setFormData({ ...formData, raison_sociale: e.target.value })}
                            placeholder="Raison sociale"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{profile.raison_sociale || "Non renseigné"}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="forme_juridique">Forme juridique</Label>
                        {isEditing ? (
                          <Select value={formData.forme_juridique} onValueChange={(value) => setFormData({ ...formData, forme_juridique: value })}>
                            <SelectTrigger id="forme_juridique">
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SARL">SARL</SelectItem>
                              <SelectItem value="SA">SA</SelectItem>
                              <SelectItem value="SUARL">SUARL</SelectItem>
                              <SelectItem value="SNC">SNC</SelectItem>
                              <SelectItem value="Entreprise Individuelle">Entreprise Individuelle</SelectItem>
                              <SelectItem value="Autre">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm text-muted-foreground">{profile.forme_juridique || "Non renseigné"}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="numero_rccm">Numéro RCCM</Label>
                        {isEditing ? (
                          <Input
                            id="numero_rccm"
                            value={formData.numero_rccm}
                            onChange={(e) => setFormData({ ...formData, numero_rccm: e.target.value })}
                            placeholder="CD/KIN/RCCM/..."
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{profile.numero_rccm || "Non renseigné"}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="numero_impot">Numéro fiscal</Label>
                        {isEditing ? (
                          <Input
                            id="numero_impot"
                            value={formData.numero_impot}
                            onChange={(e) => setFormData({ ...formData, numero_impot: e.target.value })}
                            placeholder="A1234567Z"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{profile.numero_impot || "Non renseigné"}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="numero_id_nat">Numéro ID Nationale</Label>
                        {isEditing ? (
                          <Input
                            id="numero_id_nat"
                            value={formData.numero_id_nat}
                            onChange={(e) => setFormData({ ...formData, numero_id_nat: e.target.value })}
                            placeholder="ID-NAT-123456"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{profile.numero_id_nat || "Non renseigné"}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Représentant légal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="representant_legal_nom">Nom</Label>
                        {isEditing ? (
                          <Input
                            id="representant_legal_nom"
                            value={formData.representant_legal_nom}
                            onChange={(e) => setFormData({ ...formData, representant_legal_nom: e.target.value })}
                            placeholder="Nom du représentant"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{profile.representant_legal_nom || "Non renseigné"}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="representant_legal_prenom">Prénom</Label>
                        {isEditing ? (
                          <Input
                            id="representant_legal_prenom"
                            value={formData.representant_legal_prenom}
                            onChange={(e) => setFormData({ ...formData, representant_legal_prenom: e.target.value })}
                            placeholder="Prénom du représentant"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{profile.representant_legal_prenom || "Non renseigné"}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="representant_legal_fonction">Fonction</Label>
                        {isEditing ? (
                          <Input
                            id="representant_legal_fonction"
                            value={formData.representant_legal_fonction}
                            onChange={(e) => setFormData({ ...formData, representant_legal_fonction: e.target.value })}
                            placeholder="Gérant, PDG, etc."
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{profile.representant_legal_fonction || "Non renseigné"}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Siège social</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="adresse_siege">Adresse</Label>
                        {isEditing ? (
                          <Input
                            id="adresse_siege"
                            value={formData.adresse_siege}
                            onChange={(e) => setFormData({ ...formData, adresse_siege: e.target.value })}
                            placeholder="123 Avenue..."
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{profile.adresse_siege || "Non renseigné"}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="ville_siege">Ville</Label>
                        {isEditing ? (
                          <Input
                            id="ville_siege"
                            value={formData.ville_siege}
                            onChange={(e) => setFormData({ ...formData, ville_siege: e.target.value })}
                            placeholder="Kinshasa"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{profile.ville_siege || "Non renseigné"}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="pays_siege">Pays</Label>
                        {isEditing ? (
                          <Input
                            id="pays_siege"
                            value={formData.pays_siege}
                            onChange={(e) => setFormData({ ...formData, pays_siege: e.target.value })}
                            placeholder="RDC"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{profile.pays_siege || "RDC"}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Informations professionnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nom complet *</Label>
                    {isEditing ? (
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Votre nom complet"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{profile.full_name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profession">Profession *</Label>
                    {isEditing ? (
                      <Select value={formData.profession} onValueChange={(value) => setFormData({ ...formData, profession: value })}>
                        <SelectTrigger id="profession">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {professions.map((prof) => (
                            <SelectItem key={prof} value={prof}>{prof}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-muted-foreground">{profile.profession}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone *</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+243 XXX XXX XXX"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{profile.phone || "Non renseigné"}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@example.com"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Commune</Label>
                    {isEditing ? (
                      <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
                        <SelectTrigger id="city">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {communes.map((commune) => (
                            <SelectItem key={commune} value={commune}>{commune}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-muted-foreground">{profile.city || "Non renseigné"}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse</Label>
                    {isEditing ? (
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Votre adresse"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{profile.address || "Non renseigné"}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience_years">Années d'expérience</Label>
                    {isEditing ? (
                      <Input
                        id="experience_years"
                        type="number"
                        value={formData.experience_years}
                        onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                        min="0"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{profile.experience_years || 0} ans</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate">Tarif horaire (FC)</Label>
                    {isEditing ? (
                      <Input
                        id="hourly_rate"
                        type="number"
                        value={formData.hourly_rate}
                        onChange={(e) => setFormData({ ...formData, hourly_rate: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                        min="0"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {profile.hourly_rate ? `${profile.hourly_rate.toLocaleString()} FC/h` : "Non renseigné"}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Mes documents</CardTitle>
              </CardHeader>
              <CardContent>
                {(profile.id_document_url || profile.qualification_url) ? (
                  <div className="space-y-4">
                    {profile.id_document_url && (
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm font-medium mb-3 flex items-center gap-2">
                          📄 Carte d'électeur / Passeport
                        </p>
                        {profile.id_document_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <div className="space-y-2">
                            <img
                              src={profile.id_document_url}
                              alt="Document d'identité"
                              className="w-full h-auto rounded border border-border max-h-96 object-contain bg-white"
                            />
                            <a
                              href={profile.id_document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-secondary hover:underline inline-flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              Télécharger
                            </a>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                            <FileText className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-2">Document PDF</p>
                            <a
                              href={profile.id_document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-secondary hover:underline inline-flex items-center gap-1"
                            >
                              <Download className="w-4 h-4" />
                              Télécharger le PDF
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {profile.qualification_url && (
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm font-medium mb-3 flex items-center gap-2">
                          🎓 Document de qualification
                        </p>
                        {profile.qualification_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <div className="space-y-2">
                            <img
                              src={profile.qualification_url}
                              alt="Document de qualification"
                              className="w-full h-auto rounded border border-border max-h-96 object-contain bg-white"
                            />
                            <a
                              href={profile.qualification_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-secondary hover:underline inline-flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              Télécharger
                            </a>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                            <FileText className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-2">Document PDF</p>
                            <a
                              href={profile.qualification_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-secondary hover:underline inline-flex items-center gap-1"
                            >
                              <Download className="w-4 h-4" />
                              Télécharger le PDF
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun document disponible</p>
                    <p className="text-sm mt-1">Les documents uploadés lors de l'inscription apparaîtront ici</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Avis clients</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun avis pour le moment</p>
                    <p className="text-sm mt-1">Les avis de vos clients apparaîtront ici</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="p-4 border border-border rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                C
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">Client</h4>
                              <p className="text-xs text-muted-foreground">
                                Mission
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(review.created_at)}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.commentaire}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
