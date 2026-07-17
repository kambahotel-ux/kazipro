import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AdminListSkeleton } from "@/components/dashboard/AdminLoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Eye, Star, Award, MapPin, FileText, Search, X, Phone, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { unwrapPaginated } from "@/lib/api-utils";
import { displayNameFromProfil, professionLabelFromProfil } from "@/lib/kazipro-profile";
import { toast } from "sonner";
import { DateRangeFilter } from "@/components/filters/DateRangeFilter";
import { FormDrawer } from "@/components/ui/FormDrawer";
import { SlideToConfirm } from "@/components/ui/SlideToConfirm";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Provider {
  id: string;
  user_id: string;
  full_name: string;
  profession: string;
  profession_categorie?: string;
  bio?: string;
  localisation?: string;
  ville?: string;
  quartier?: string;
  verified: boolean;
  statut_validation?: string;
  documents_verified: boolean;
  rating: number;
  nb_avis: number;
  missions_completed: number;
  created_at: string;
  id_document_url?: string;
  qualification_url?: string;
  piece_identite?: string;
  document_rccm?: string;
  statut_certification?: string;
  certifie?: boolean;
  certifie_le?: string;
  motif_rejet?: string;
  motif_rejet_certification?: string;
  type_personne?: "physique" | "morale";
  email?: string;
  telephone?: string;
  tarif_horaire?: number | null;
  zones_intervention?: string[];
  disponible?: boolean;
  photo?: string;
  nom?: string;
  prenom?: string;
  raison_sociale?: string;
  numero_rccm?: string;
}

function strOrUndef(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  const s = String(value).trim();
  return s && s !== "—" ? s : undefined;
}

function mapPrestataireRow(prestataire: Record<string, unknown>): Provider {
  const user = prestataire.user as Record<string, unknown> | undefined;
  const professionObj = prestataire.profession as Record<string, unknown> | undefined;
  const ville = strOrUndef(prestataire.ville);
  const quartier = strOrUndef(prestataire.quartier);
  const pieceIdentite = strOrUndef(prestataire.piece_identite);
  const documentRccm = strOrUndef(prestataire.document_rccm);
  const typePersonne = (prestataire.type_personne as "physique" | "morale") ?? "physique";

  return {
    id: String(prestataire.id),
    user_id: String(prestataire.user_id ?? ""),
    full_name: displayNameFromProfil(prestataire),
    nom: strOrUndef(prestataire.nom),
    prenom: strOrUndef(prestataire.prenom),
    profession: professionLabelFromProfil(prestataire) || strOrUndef(professionObj?.nom) || "Non renseignée",
    profession_categorie: strOrUndef(professionObj?.categorie),
    bio: strOrUndef(prestataire.bio),
    ville,
    quartier,
    localisation: [ville, quartier].filter(Boolean).join(" — ") || "Non spécifié",
    verified: prestataire.statut_validation === "valide",
    statut_validation: String(prestataire.statut_validation ?? ""),
    documents_verified: !!(pieceIdentite || documentRccm),
    email: strOrUndef(user?.email) ?? strOrUndef(prestataire.email) ?? "Email non disponible",
    telephone: strOrUndef(prestataire.telephone) ?? strOrUndef(user?.telephone),
    rating: Number(prestataire.note_moyenne ?? 0),
    nb_avis: Number(prestataire.nb_avis ?? 0),
    missions_completed: Number(prestataire.nb_missions ?? prestataire.missions_completees ?? 0),
    tarif_horaire: prestataire.tarif_horaire != null ? Number(prestataire.tarif_horaire) : null,
    zones_intervention: Array.isArray(prestataire.zones_intervention)
      ? (prestataire.zones_intervention as string[])
      : [],
    disponible: prestataire.disponible !== false,
    photo: strOrUndef(prestataire.photo) ?? strOrUndef(user?.avatar),
    created_at: String(prestataire.created_at ?? new Date().toISOString()),
    piece_identite: pieceIdentite,
    document_rccm: documentRccm,
    id_document_url: pieceIdentite,
    qualification_url: documentRccm,
    statut_certification: String(prestataire.statut_certification ?? "non_demande"),
    certifie: prestataire.certifie === true,
    certifie_le: strOrUndef(prestataire.certifie_le),
    motif_rejet: strOrUndef(prestataire.motif_rejet),
    motif_rejet_certification: strOrUndef(prestataire.motif_rejet_certification),
    type_personne: typePersonne,
    raison_sociale: strOrUndef(prestataire.raison_sociale),
    numero_rccm: strOrUndef(prestataire.numero_rccm),
  };
}

export default function ProvidersPage() {
  const { user } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; type: "provider" | "certification" } | null>(null);
  const [rejectMotif, setRejectMotif] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    profession: 'all',
    verified: 'all',
    city: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (user) {
      fetchProviders();
    }
  }, [user]);

  const fetchProviders = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await adminApi.getPrestataires({ per_page: 500 });
      const rows = unwrapPaginated<Record<string, unknown>>(res);
      setProviders(rows.map(mapPrestataireRow));
    } catch (error: unknown) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des prestataires");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (providerId: string) => {
    try {
      await adminApi.validerPrestataire(providerId);
      toast.success("Prestataire vérifié avec succès");
      await fetchProviders();
    } catch (error: unknown) {
      console.error("❌ Erreur complète:", error);
      toast.error(`Erreur: ${error instanceof Error ? error.message : "Erreur lors de la vérification"}`);
    }
  };

  const handleReject = async (providerId: string, motif?: string) => {
    const finalMotif = motif?.trim() || "Rejeté par l'administrateur";
    try {
      await adminApi.rejeterPrestataire(providerId, finalMotif);
      toast.success("Prestataire rejeté");
      await fetchProviders();
      setShowDetailsModal(false);
      setRejectTarget(null);
      setRejectMotif("");
    } catch (error: unknown) {
      console.error("❌ Erreur complète:", error);
      toast.error(`Erreur: ${error instanceof Error ? error.message : "Erreur lors du rejet"}`);
      throw error;
    }
  };

  const handleApprouverCertification = async (providerId: string) => {
    try {
      await adminApi.approuverCertification(providerId);
      toast.success("Certification approuvée");
      await fetchProviders();
      setShowDetailsModal(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur certification");
    }
  };

  const handleRejeterCertification = async (providerId: string, motif?: string) => {
    const finalMotif = motif?.trim() || "Documents non conformes";
    try {
      await adminApi.rejeterCertification(providerId, finalMotif);
      toast.success("Certification rejetée");
      await fetchProviders();
      setRejectTarget(null);
      setRejectMotif("");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur certification");
      throw error;
    }
  };

  // Filtered providers with useMemo for performance
  const filteredProviders = useMemo(() => {
    return providers.filter(provider => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!provider.full_name?.toLowerCase().includes(searchLower) &&
            !provider.email?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Profession filter
      if (filters.profession !== 'all' && provider.profession !== filters.profession) {
        return false;
      }
      
      // Verified filter
      if (filters.verified !== 'all') {
        if (filters.verified === 'verified' && !provider.verified) return false;
        if (filters.verified === 'unverified' && provider.verified) return false;
      }
      
      // City filter
      if (filters.city && !provider.localisation?.toLowerCase().includes(filters.city.toLowerCase())) {
        return false;
      }
      
      // Date range filter
      if (filters.startDate) {
        const providerDate = new Date(provider.created_at);
        const startDate = new Date(filters.startDate);
        if (providerDate < startDate) return false;
      }
      
      if (filters.endDate) {
        const providerDate = new Date(provider.created_at);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (providerDate > endDate) return false;
      }
      
      return true;
    });
  }, [providers, filters]);

  const pendingProviders = filteredProviders.filter(p => !p.verified);
  const verifiedProviders = filteredProviders.filter(p => p.verified);
  
  // Get unique professions for filter dropdown
  const professions = useMemo(() => {
    const uniqueProfessions = [...new Set(providers.map(p => p.profession).filter(Boolean))];
    return uniqueProfessions.sort();
  }, [providers]);
  
  // Check if any filters are active
  const hasActiveFilters = filters.search || filters.profession !== 'all' || 
    filters.verified !== 'all' || filters.city || filters.startDate || filters.endDate;
  
  const resetFilters = () => {
    setFilters({
      search: '',
      profession: 'all',
      verified: 'all',
      city: '',
      startDate: '',
      endDate: '',
    });
  };

  const ProviderCard = ({ provider, isPending }: { provider: Provider; isPending: boolean }) => (
    <Card className="transition-shadow hover:shadow-card">
      <CardContent className="px-4 pt-5 pb-3 sm:px-5 sm:pt-5 sm:pb-4">
        <div className="flex flex-col gap-3 sm:min-h-[112px] sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex w-full flex-1 items-center gap-3 sm:gap-4">
            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
              <AvatarFallback className="text-xs sm:text-sm">{provider.full_name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
            </Avatar>
            <div className="flex flex-1 min-w-0 flex-col justify-center">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                <h3 className="font-semibold text-sm sm:text-base truncate">{provider.full_name}</h3>
                {provider.verified && (
                  <Badge className="flex items-center gap-1 text-xs w-fit">
                    <CheckCircle className="w-3 h-3" />
                    Vérifié
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{provider.profession}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">📧 {provider.email}</p>
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate max-w-[100px]">{provider.localisation || "Non spécifié"}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500" />
                  {provider.rating?.toFixed(1) || "0.0"}
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  {provider.missions_completed || 0} missions
                </span>
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedProvider(provider);
                setShowDetailsModal(true);
              }}
              className="w-full sm:w-auto"
            >
              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
              Détails
            </Button>
            {isPending && (
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedProvider(provider);
                    setShowDetailsModal(true);
                  }}
                  className="w-full sm:w-auto"
                >
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  Examiner
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
          <h1 className="text-xl sm:text-2xl font-display font-bold">Gestion des Prestataires</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Vérifiez et gérez les prestataires</p>
        </div>

        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Nom ou email..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-10 h-10 sm:h-11 text-sm sm:text-base"
          />
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
              Filtres actifs: {filteredProviders.length} résultat(s)
            </Badge>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Filtres</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 sm:pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
              {/* Profession */}
              <Select value={filters.profession} onValueChange={(v) => setFilters({...filters, profession: v})}>
                <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                  <SelectValue placeholder="Profession" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les professions</SelectItem>
                  {professions.map(prof => (
                    <SelectItem key={prof} value={prof}>{prof}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Verified Status */}
              <Select value={filters.verified} onValueChange={(v) => setFilters({...filters, verified: v})}>
                <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="verified">✓ Vérifié</SelectItem>
                  <SelectItem value="unverified">⏳ Non vérifié</SelectItem>
                </SelectContent>
              </Select>
              
              {/* City */}
              <Input
                placeholder="Ville..."
                value={filters.city}
                onChange={(e) => setFilters({...filters, city: e.target.value})}
                className="h-10 sm:h-11 text-sm sm:text-base"
              />
            </div>
            
            {/* Date Range */}
            <div className="mb-4">
              <DateRangeFilter
                startDate={filters.startDate}
                endDate={filters.endDate}
                onStartDateChange={(d) => setFilters({...filters, startDate: d})}
                onEndDateChange={(d) => setFilters({...filters, endDate: d})}
                label="Période d'inscription"
              />
            </div>
            
            {/* Results bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <Badge variant="secondary" className="text-xs sm:text-sm">
                {filteredProviders.length} résultat(s)
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
              En attente ({pendingProviders.length})
            </TabsTrigger>
            <TabsTrigger value="verified" className="flex-1 sm:flex-none text-xs sm:text-sm">
              Vérifiés ({verifiedProviders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3 sm:space-y-4">
            {loading ? (
              <AdminListSkeleton items={3} />
            ) : pendingProviders.length === 0 ? (
              <Card>
                <CardContent className="py-8 sm:py-12 text-center text-muted-foreground text-sm sm:text-base">
                  Aucun prestataire en attente de vérification
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {pendingProviders.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} isPending={true} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="verified" className="space-y-3 sm:space-y-4">
            {loading ? (
              <AdminListSkeleton items={3} />
            ) : verifiedProviders.length === 0 ? (
              <Card>
                <CardContent className="py-8 sm:py-12 text-center text-muted-foreground text-sm sm:text-base">
                  Aucun prestataire vérifié
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {verifiedProviders.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} isPending={false} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <FormDrawer
          open={showDetailsModal && !!selectedProvider}
          onOpenChange={(open) => {
            if (!open) {
              setShowDetailsModal(false);
              setSelectedProvider(null);
            }
          }}
          title={selectedProvider?.full_name ?? "Prestataire"}
          description="Examen du dossier et validation"
        >
          {selectedProvider && (
            <div className="space-y-4 sm:space-y-6">
                <div className="bg-muted p-3 sm:p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl sm:text-2xl">
                      {selectedProvider.type_personne === "morale" ? "🏢" : "👤"}
                    </span>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Type de prestataire</p>
                      <p className="font-semibold text-sm sm:text-base">
                        {selectedProvider.type_personne === "morale"
                          ? "Personne morale (Entreprise)"
                          : "Personne physique (Individu)"}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedProvider.type_personne === "physique" ? (
                  <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3 sm:p-4 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm sm:text-base">
                      Identité
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedProvider.prenom && (
                        <div>
                          <p className="text-xs text-muted-foreground">Prénom</p>
                          <p className="font-medium text-sm">{selectedProvider.prenom}</p>
                        </div>
                      )}
                      {selectedProvider.nom && (
                        <div>
                          <p className="text-xs text-muted-foreground">Nom</p>
                          <p className="font-medium text-sm">{selectedProvider.nom}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50/50 dark:bg-green-950/20 p-3 sm:p-4 rounded-lg border border-green-200 dark:border-green-800 space-y-3">
                    <h3 className="font-semibold text-green-900 dark:text-green-100 text-sm sm:text-base">
                      Entreprise
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedProvider.raison_sociale && (
                        <div>
                          <p className="text-xs text-muted-foreground">Raison sociale</p>
                          <p className="font-medium text-sm">{selectedProvider.raison_sociale}</p>
                        </div>
                      )}
                      {selectedProvider.numero_rccm && (
                        <div>
                          <p className="text-xs text-muted-foreground">Numéro RCCM</p>
                          <p className="font-medium text-sm">{selectedProvider.numero_rccm}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-muted p-3 sm:p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 text-sm sm:text-base">Informations professionnelles</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Email</p>
                      <p className="font-medium text-sm sm:text-base break-all">{selectedProvider.email}</p>
                    </div>
                    {selectedProvider.telephone && (
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Téléphone</p>
                        <p className="font-medium text-sm sm:text-base flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {selectedProvider.telephone}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Profession</p>
                      <p className="font-medium text-sm sm:text-base">{selectedProvider.profession}</p>
                      {selectedProvider.profession_categorie && (
                        <p className="text-xs text-muted-foreground">{selectedProvider.profession_categorie}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Localisation</p>
                      <p className="font-medium text-sm sm:text-base">{selectedProvider.localisation}</p>
                    </div>
                    {selectedProvider.tarif_horaire != null && (
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Tarif horaire</p>
                        <p className="font-medium text-sm sm:text-base">
                          {selectedProvider.tarif_horaire.toLocaleString("fr-FR")} FC/h
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Disponibilité</p>
                      <Badge variant={selectedProvider.disponible ? "default" : "secondary"} className="text-xs">
                        {selectedProvider.disponible ? "Disponible" : "Indisponible"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Note moyenne</p>
                      <p className="font-medium text-sm sm:text-base flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        {selectedProvider.rating.toFixed(1)}/5
                        <span className="text-xs text-muted-foreground">({selectedProvider.nb_avis} avis)</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Missions complétées</p>
                      <p className="font-medium text-sm sm:text-base">{selectedProvider.missions_completed}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Statut vérification</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={selectedProvider.verified ? "default" : "secondary"} className="text-xs">
                          {selectedProvider.verified ? "Vérifié" : "En attente"}
                        </Badge>
                        <Badge variant={selectedProvider.documents_verified ? "default" : "secondary"} className="text-xs">
                          {selectedProvider.documents_verified ? "Docs OK" : "Docs à vérifier"}
                        </Badge>
                      </div>
                      {selectedProvider.motif_rejet && (
                        <p className="text-xs text-red-600 mt-1">Motif rejet : {selectedProvider.motif_rejet}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Inscrit le</p>
                      <p className="font-medium text-sm sm:text-base">
                        {new Date(selectedProvider.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>

                  {selectedProvider.zones_intervention && selectedProvider.zones_intervention.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        Zones d'intervention
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProvider.zones_intervention.map((zone) => (
                          <Badge key={zone} variant="outline" className="text-xs">
                            {zone}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {selectedProvider.bio && (
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2">Biographie</p>
                    <p className="text-xs sm:text-sm bg-muted p-3 rounded-lg">{selectedProvider.bio}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3">Documents soumis</p>
                  {(selectedProvider.id_document_url || selectedProvider.qualification_url) ? (
                    <div className="space-y-3 sm:space-y-4">
                      {selectedProvider.id_document_url && (
                        <div className="bg-muted p-3 sm:p-4 rounded-lg">
                          <p className="text-xs sm:text-sm font-medium mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Pièce d'identité
                          </p>
                          {selectedProvider.id_document_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <div className="space-y-2">
                              <img
                                src={selectedProvider.id_document_url}
                                alt="Document d'identité"
                                className="w-full h-auto rounded border border-border max-h-64 sm:max-h-96 object-contain bg-white"
                              />
                              <a
                                href={selectedProvider.id_document_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-secondary hover:underline"
                              >
                                Ouvrir en plein écran →
                              </a>
                            </div>
                          ) : (
                            <a
                              href={selectedProvider.id_document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-secondary hover:underline inline-flex items-center gap-1"
                            >
                              <FileText className="w-4 h-4" />
                              Ouvrir le document →
                            </a>
                          )}
                        </div>
                      )}
                      {selectedProvider.qualification_url && (
                        <div className="bg-muted p-3 sm:p-4 rounded-lg">
                          <p className="text-xs sm:text-sm font-medium mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Document RCCM
                          </p>
                          {selectedProvider.qualification_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <div className="space-y-2">
                              <img
                                src={selectedProvider.qualification_url}
                                alt="Document RCCM"
                                className="w-full h-auto rounded border border-border max-h-64 sm:max-h-96 object-contain bg-white"
                              />
                              <a
                                href={selectedProvider.qualification_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-secondary hover:underline"
                              >
                                Ouvrir en plein écran →
                              </a>
                            </div>
                          ) : (
                            <a
                              href={selectedProvider.qualification_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-secondary hover:underline inline-flex items-center gap-1"
                            >
                              <FileText className="w-4 h-4" />
                              Ouvrir le PDF →
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-muted p-3 sm:p-4 rounded-lg text-center text-xs sm:text-sm text-muted-foreground">
                      <p>Aucun document soumis</p>
                      <p className="text-xs mt-1">Le prestataire n'a pas encore uploadé ses documents</p>
                    </div>
                  )}
                </div>

                <div className="bg-muted p-3 sm:p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-sm flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Certification
                  </h3>
                  <Badge variant="outline" className="mb-2">
                    {selectedProvider.statut_certification === "certifie" || selectedProvider.certifie
                      ? "Certifié"
                      : selectedProvider.statut_certification === "en_attente"
                        ? "En attente"
                        : selectedProvider.statut_certification === "rejete"
                          ? "Rejetée"
                          : "Non demandée"}
                  </Badge>
                  {selectedProvider.certifie_le && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Certifié le {new Date(selectedProvider.certifie_le).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                  {selectedProvider.motif_rejet_certification && (
                    <p className="text-xs text-red-600 mt-1">
                      Motif rejet certification : {selectedProvider.motif_rejet_certification}
                    </p>
                  )}
                  {selectedProvider.statut_certification === "en_attente" && (
                    <div className="space-y-3 mt-2">
                      <SlideToConfirm
                        label="Approuver la certification de ce prestataire"
                        hint="Glisser pour approuver"
                        variant="success"
                        successMessage="Certification approuvée"
                        onConfirm={async () => {
                          await handleApprouverCertification(selectedProvider.id);
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setRejectTarget({ id: selectedProvider.id, type: "certification" });
                          setRejectMotif("");
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Rejeter la certification
                      </Button>
                    </div>
                  )}
                </div>

                {!selectedProvider.verified && (
                  <div className="space-y-3 pt-4 border-t border-border">
                    <SlideToConfirm
                      label="Valider et activer ce prestataire sur la plateforme"
                      hint="Glisser pour vérifier"
                      variant="success"
                      successMessage="Prestataire vérifié"
                      onConfirm={async () => {
                        await handleVerify(selectedProvider.id);
                        setShowDetailsModal(false);
                      }}
                    />
                    <Button
                      variant="outline"
                      className="w-full text-sm"
                      onClick={() => {
                        setRejectTarget({ id: selectedProvider.id, type: "provider" });
                        setRejectMotif("");
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeter le prestataire
                    </Button>
                  </div>
                )}
            </div>
          )}
        </FormDrawer>

        <FormDrawer
          open={!!rejectTarget}
          onOpenChange={(open) => {
            if (!open) {
              setRejectTarget(null);
              setRejectMotif("");
            }
          }}
          title={rejectTarget?.type === "certification" ? "Rejeter la certification" : "Rejeter le prestataire"}
          description="Cette action est irréversible. Indiquez un motif."
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject-motif">Motif du rejet</Label>
              <Textarea
                id="reject-motif"
                value={rejectMotif}
                onChange={(e) => setRejectMotif(e.target.value)}
                placeholder="Motif obligatoire…"
                rows={3}
              />
            </div>
            {rejectTarget && (
              <SlideToConfirm
                label="Confirmer le rejet définitif"
                hint="Glisser pour rejeter"
                variant="destructive"
                disabled={!rejectMotif.trim()}
                successMessage="Rejet enregistré"
                onConfirm={async () => {
                  if (rejectTarget.type === "certification") {
                    await handleRejeterCertification(rejectTarget.id, rejectMotif);
                  } else {
                    await handleReject(rejectTarget.id, rejectMotif);
                  }
                }}
              />
            )}
          </div>
        </FormDrawer>
      </div>
    </DashboardLayout>
  );
}
