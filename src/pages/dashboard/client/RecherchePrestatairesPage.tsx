import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  MapPin, 
  Star, 
  Shield, 
  Loader2, 
  User,
  Briefcase,
  Filter,
  X
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Prestataire {
  id: string;
  full_name: string;
  profession: string;
  city: string;
  bio?: string;
  verified: boolean;
  photo_url?: string;
  experience_years?: number;
  hourly_rate?: number;
  disponible?: boolean;
  rating?: number;
  reviews_count?: number;
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

export default function RecherchePrestatairesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [prestataires, setPrestataires] = useState<Prestataire[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState("Client");
  
  // Filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfession, setSelectedProfession] = useState<string>(searchParams.get("profession") || "");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false); // Désactivé par défaut
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user) {
      fetchClientName();
      fetchPrestataires();
    }
  }, [user, selectedProfession, selectedCity, showVerifiedOnly, showAvailableOnly]);

  const fetchClientName = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from("clients")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setClientName(data.full_name);
      }
    } catch (error) {
      console.error("Error fetching client name:", error);
    }
  };

  const fetchPrestataires = async () => {
    try {
      setLoading(true);
      console.log("Fetching prestataires with filters:", { 
        selectedProfession, 
        selectedCity, 
        showVerifiedOnly, 
        showAvailableOnly 
      });

      let query = supabase
        .from("prestataires")
        .select("*")
        .eq("profile_completed", true);

      // Filtres
      if (selectedProfession) {
        query = query.eq("profession", selectedProfession);
      }

      if (selectedCity) {
        query = query.eq("city", selectedCity);
      }

      if (showVerifiedOnly) {
        query = query.eq("verified", true);
      }

      if (showAvailableOnly) {
        query = query.eq("disponible", true);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      console.log("Prestataires query result:", { data, error, filters: { selectedProfession, selectedCity, showVerifiedOnly, showAvailableOnly } });

      if (error) {
        console.error("Error fetching prestataires:", error);
        throw error;
      }

      // Enrichir avec les stats
      const prestataireWithStats = await Promise.all(
        (data || []).map(async (prestataire) => {
          try {
            // Récupérer les avis
            const { data: avisData } = await supabase
              .from("avis")
              .select("rating")
              .eq("prestataire_id", prestataire.id);

            let rating = 0;
            let reviews_count = 0;

            if (avisData && avisData.length > 0) {
              rating = avisData.reduce((sum, a) => sum + a.rating, 0) / avisData.length;
              reviews_count = avisData.length;
            }

            return {
              ...prestataire,
              rating: Math.round(rating * 10) / 10,
              reviews_count,
            };
          } catch (err) {
            console.error("Error fetching stats for prestataire:", prestataire.id, err);
            return {
              ...prestataire,
              rating: 0,
              reviews_count: 0,
            };
          }
        })
      );

      console.log("Final prestataires with stats:", prestataireWithStats.length);
      setPrestataires(prestataireWithStats);
    } catch (error: any) {
      console.error("Error fetching prestataires:", error);
      toast.error("Erreur lors du chargement des prestataires");
      setPrestataires([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrestataires = prestataires.filter((p) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.full_name.toLowerCase().includes(query) ||
      p.profession.toLowerCase().includes(query) ||
      p.city?.toLowerCase().includes(query) ||
      p.bio?.toLowerCase().includes(query)
    );
  });

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedProfession("");
    setSelectedCity("");
    setShowVerifiedOnly(false);
    setShowAvailableOnly(true);
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const hasActiveFilters = selectedProfession || selectedCity || showVerifiedOnly || showAvailableOnly;

  return (
    <DashboardLayout role="client" userName={clientName} userRole="Client">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Trouver un prestataire</h1>
          <p className="text-muted-foreground mt-1">
            Recherchez parmi {prestataires.length} prestataires qualifiés
          </p>
        </div>

        {/* Barre de recherche et filtres */}
        <Card>
          <CardContent className="p-6 space-y-4">
            {/* Recherche */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, profession, ville..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtres
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">
                    {[selectedProfession, selectedCity, showVerifiedOnly, showAvailableOnly].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Filtres avancés */}
            {showFilters && (
              <div className="border-t pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Profession */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Profession</label>
                    <Select value={selectedProfession} onValueChange={(value) => setSelectedProfession(value === "all" ? "" : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        {professions.map((prof) => (
                          <SelectItem key={prof} value={prof}>
                            {prof}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Ville */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Commune</label>
                    <Select value={selectedCity} onValueChange={(value) => setSelectedCity(value === "all" ? "" : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        {communes.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Vérifiés uniquement */}
                  <div className="flex items-end">
                    <Button
                      variant={showVerifiedOnly ? "default" : "outline"}
                      onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
                      className="w-full"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Vérifiés uniquement
                    </Button>
                  </div>

                  {/* Disponibles uniquement */}
                  <div className="flex items-end">
                    <Button
                      variant={showAvailableOnly ? "default" : "outline"}
                      onClick={() => setShowAvailableOnly(!showAvailableOnly)}
                      className="w-full"
                    >
                      Disponibles uniquement
                    </Button>
                  </div>
                </div>

                {/* Bouton réinitialiser */}
                {hasActiveFilters && (
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                      <X className="w-4 h-4 mr-2" />
                      Réinitialiser les filtres
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Résultats */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredPrestataires.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Aucun prestataire trouvé</h3>
              <p className="text-muted-foreground mb-4">
                Essayez de modifier vos critères de recherche
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={handleClearFilters}>
                  Réinitialiser les filtres
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrestataires.map((prestataire) => (
              <Card
                key={prestataire.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/dashboard/client/prestataire/${prestataire.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={prestataire.photo_url || ""} />
                      <AvatarFallback className="text-lg">
                        {getInitials(prestataire.full_name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-lg truncate">
                          {prestataire.full_name}
                        </h3>
                        {prestataire.verified && (
                          <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Briefcase className="w-3 h-3" />
                        {prestataire.profession}
                      </p>

                      {prestataire.city && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {prestataire.city}
                        </p>
                      )}

                      {/* Rating */}
                      {prestataire.reviews_count && prestataire.reviews_count > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{prestataire.rating}</span>
                          <span className="text-xs text-muted-foreground">
                            ({prestataire.reviews_count} avis)
                          </span>
                        </div>
                      )}

                      {/* Bio */}
                      {prestataire.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                          {prestataire.bio}
                        </p>
                      )}

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {prestataire.experience_years && prestataire.experience_years > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {prestataire.experience_years} ans d'exp.
                          </Badge>
                        )}
                        {prestataire.disponible && (
                          <Badge variant="default" className="text-xs bg-green-600">
                            Disponible
                          </Badge>
                        )}
                        {prestataire.hourly_rate && (
                          <Badge variant="outline" className="text-xs">
                            {prestataire.hourly_rate} FC/h
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bouton */}
                  <Button className="w-full mt-4" size="sm">
                    Voir le profil
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
