import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Star, Shield, Loader2, User, Briefcase, Filter, X } from "lucide-react";
import { prestatairesApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { getClientDisplayName, getPaginatedTotal, mapPrestataireToUi, unwrapPaginated } from "@/lib/client-helpers";
import { toast } from "sonner";
import { AdminListSkeleton, PageHeaderSkeleton } from "@/components/dashboard/AdminLoadingSkeleton";
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
  "Ngaliema", "Ngiri-Ngiri", "Nsele", "Selembao",
];

export default function RecherchePrestatairesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [prestataires, setPrestataires] = useState<Prestataire[]>([]);
  const [totalPrestataires, setTotalPrestataires] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const clientName = getClientDisplayName(user);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfession, setSelectedProfession] = useState<string>(searchParams.get("profession") || "");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user) fetchPrestataires();
  }, [user, selectedProfession, selectedCity, showVerifiedOnly, showAvailableOnly]);

  const fetchPrestataires = async () => {
    try {
      setLoading(true);
      const res = await prestatairesApi.getAll({
        search: searchQuery || undefined,
        ville: selectedCity || undefined,
        disponible: showAvailableOnly ? true : undefined,
        per_page: 100,
      });
      let rows = unwrapPaginated(res).map((p) => mapPrestataireToUi(p as Record<string, unknown>)) as Prestataire[];

      if (selectedProfession) {
        rows = rows.filter((p) => p.profession?.toLowerCase().includes(selectedProfession.toLowerCase()));
      }
      if (showVerifiedOnly) {
        rows = rows.filter((p) => p.verified);
      }

      setTotalPrestataires(getPaginatedTotal(res));
      setPrestataires(rows);
    } catch (error: unknown) {
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
    setShowAvailableOnly(false);
  };

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase();
  const hasActiveFilters = selectedProfession || selectedCity || showVerifiedOnly || showAvailableOnly;

  return (
    <DashboardLayout role="client" userName={clientName} userRole="Client">
      <div className="space-y-4 md:space-y-6 p-3 md:p-0">
        <div>
          <h1 className="text-lg md:text-2xl lg:text-3xl font-bold">Trouver un prestataire</h1>
          <p className="text-xs md:text-sm lg:text-base text-muted-foreground mt-1">
            {loading
              ? "Chargement des prestataires..."
              : hasActiveFilters || searchQuery
                ? `${filteredPrestataires.length} prestataire${filteredPrestataires.length > 1 ? "s" : ""} trouvé${filteredPrestataires.length > 1 ? "s" : ""} sur ${totalPrestataires} disponible${totalPrestataires > 1 ? "s" : ""}`
                : `Recherchez parmi ${totalPrestataires} prestataire${totalPrestataires > 1 ? "s" : ""} qualifié${totalPrestataires > 1 ? "s" : ""}`}
          </p>
        </div>

        <Card>
          <CardContent className="p-3 md:p-6 space-y-3 md:space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, profession..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm md:text-base h-10"
                />
              </div>
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                size="sm"
                className="w-full sm:w-auto h-10"
              >
                <Filter className="w-4 h-4 mr-2" />
                <span className="text-sm">Filtres</span>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0.5">
                    {[selectedProfession, selectedCity, showVerifiedOnly, showAvailableOnly].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </div>

            {showFilters && (
              <div className="border-t pt-3 md:pt-4 space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="text-xs md:text-sm font-medium mb-2 block">Profession</label>
                    <Select value={selectedProfession} onValueChange={(v) => setSelectedProfession(v === "all" ? "" : v)}>
                      <SelectTrigger className="text-sm h-10">
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
                  <div>
                    <label className="text-xs md:text-sm font-medium mb-2 block">Commune</label>
                    <Select value={selectedCity} onValueChange={(v) => setSelectedCity(v === "all" ? "" : v)}>
                      <SelectTrigger className="text-sm h-10">
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
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    variant={showVerifiedOnly ? "default" : "outline"}
                    onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
                    className="w-full text-xs md:text-sm h-10"
                    size="sm"
                  >
                    <Shield className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                    Vérifiés uniquement
                  </Button>
                  <Button
                    variant={showAvailableOnly ? "default" : "outline"}
                    onClick={() => setShowAvailableOnly(!showAvailableOnly)}
                    className="w-full text-xs md:text-sm h-10"
                    size="sm"
                  >
                    Disponibles uniquement
                  </Button>
                </div>
                {hasActiveFilters && (
                  <div className="flex justify-center sm:justify-end pt-2 border-t">
                    <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-xs md:text-sm">
                      <X className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                      Réinitialiser les filtres
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-4">
            <PageHeaderSkeleton />
            <AdminListSkeleton items={4} />
          </div>
        ) : filteredPrestataires.length === 0 ? (
          <Card>
            <CardContent className="p-6 md:p-12 text-center">
              <User className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-base md:text-lg font-semibold mb-2">Aucun prestataire trouvé</h3>
              <p className="text-sm text-muted-foreground mb-3 md:mb-4">Essayez de modifier vos critères de recherche</p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={handleClearFilters} size="sm">
                  Réinitialiser les filtres
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {filteredPrestataires.map((prestataire) => (
              <Card
                key={prestataire.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/prestataires/${prestataire.id}`)}
              >
                <CardContent className="p-3 md:p-6">
                  <div className="flex items-start gap-3 md:gap-4">
                    <Avatar className="w-10 h-10 md:w-16 md:h-16 shrink-0">
                      <AvatarImage src={prestataire.photo_url || ""} />
                      <AvatarFallback className="text-xs md:text-lg">{getInitials(prestataire.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-sm md:text-base lg:text-lg truncate">{prestataire.full_name}</h3>
                        {prestataire.verified && <Shield className="w-3 h-3 md:w-4 md:h-4 text-primary flex-shrink-0" />}
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Briefcase className="w-3 h-3 shrink-0" />
                        <span className="truncate">{prestataire.profession}</span>
                      </p>
                      {prestataire.city && (
                        <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{prestataire.city}</span>
                        </p>
                      )}
                      {prestataire.reviews_count && prestataire.reviews_count > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <Star className="w-3 h-3 md:w-4 md:h-4 fill-yellow-400 text-yellow-400 shrink-0" />
                          <span className="text-xs md:text-sm font-medium">{prestataire.rating}</span>
                          <span className="text-xs text-muted-foreground truncate">({prestataire.reviews_count} avis)</span>
                        </div>
                      )}
                      {prestataire.bio && (
                        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mt-2 break-words">{prestataire.bio}</p>
                      )}
                      <div className="flex flex-wrap gap-1 md:gap-2 mt-2 md:mt-3">
                        {prestataire.disponible && (
                          <Badge variant="default" className="text-xs bg-green-600 px-2 py-0.5">
                            Disponible
                          </Badge>
                        )}
                        {prestataire.hourly_rate ? (
                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                            {prestataire.hourly_rate} FC/h
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <Button className="w-full mt-3 md:mt-4 h-9" size="sm">
                    <span className="text-xs md:text-sm">Voir le profil</span>
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
