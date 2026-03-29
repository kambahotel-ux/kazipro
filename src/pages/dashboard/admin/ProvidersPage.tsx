import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Eye, Loader2, Star, Award, MapPin, FileText, Search, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { DateRangeFilter } from "@/components/filters/DateRangeFilter";

interface Provider {
  id: string;
  user_id: string;
  full_name: string;
  profession: string;
  bio?: string;
  localisation?: string;
  verified: boolean;
  documents_verified: boolean;
  rating: number;
  missions_completed?: number;
  created_at: string;
  id_document_url?: string;
  qualification_url?: string;
  email?: string;
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

export default function ProvidersPage() {
  const { user } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
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
      
      // Récupérer les prestataires
      const { data: prestatairesData, error: prestatairesError } = await supabase
        .from("prestataires")
        .select("*")
        .order("created_at", { ascending: false });

      if (prestatairesError) throw prestatairesError;

      // Mapper les données avec valeurs par défaut
      const providersWithDefaults = (prestatairesData || []).map((prestataire: any) => ({
        ...prestataire,
        email: prestataire.email || "Email non disponible",
        missions_completed: prestataire.missions_completed || 0,
        localisation: prestataire.localisation || "Non spécifié",
      }));

      setProviders(providersWithDefaults);
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des prestataires");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (providerId: string) => {
    try {
      console.log("🔄 Tentative de vérification du prestataire:", providerId);
      
      const { data, error } = await supabase
        .from("prestataires")
        .update({ 
          verified: true,
          documents_verified: true 
        })
        .eq("id", providerId)
        .select();

      if (error) {
        console.error("❌ Erreur vérification:", error);
        throw error;
      }
      
      console.log("✅ Prestataire vérifié:", data);
      toast.success("Prestataire vérifié avec succès");
      await fetchProviders();
    } catch (error: any) {
      console.error("❌ Erreur complète:", error);
      toast.error(`Erreur: ${error.message || "Erreur lors de la vérification"}`);
    }
  };

  const handleReject = async (providerId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir rejeter ce prestataire? Cette action est irréversible.")) return;
    
    try {
      console.log("🔄 Tentative de rejet du prestataire:", providerId);
      
      // Marquer comme non vérifié au lieu de supprimer
      const { data, error } = await supabase
        .from("prestataires")
        .update({ 
          verified: false,
          documents_verified: false 
        })
        .eq("id", providerId)
        .select();

      if (error) {
        console.error("❌ Erreur rejet:", error);
        throw error;
      }
      
      console.log("✅ Prestataire rejeté:", data);
      toast.success("Prestataire rejeté");
      await fetchProviders();
    } catch (error: any) {
      console.error("❌ Erreur complète:", error);
      toast.error(`Erreur: ${error.message || "Erreur lors du rejet"}`);
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
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-4 sm:pt-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
          <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full">
            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
              <AvatarFallback className="text-xs sm:text-sm">{provider.full_name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
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
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedProvider(provider);
                setShowDetailsModal(true);
              }}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Détails
            </Button>
            {isPending && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleVerify(provider.id)}
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Vérifier
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleReject(provider.id)}
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <XCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Rejeter
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

        {/* Stats */}
        <div className="block sm:hidden">
          {/* Version mobile compacte */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-lg font-bold">{filteredProviders.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {hasActiveFilters ? 'Filtrés' : 'Total'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-yellow-600">{pendingProviders.length}</p>
                  <p className="text-xs text-muted-foreground">En attente</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">{verifiedProviders.length}</p>
                  <p className="text-xs text-muted-foreground">Vérifiés</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="hidden sm:grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Version desktop */}
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold">{filteredProviders.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {hasActiveFilters ? 'Résultats filtrés' : 'Total prestataires'}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{pendingProviders.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">En attente de vérification</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{verifiedProviders.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Vérifiés</p>
              </div>
            </CardContent>
          </Card>
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
            <CardContent className="pt-4 sm:pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Nom ou email..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="pl-10 h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
              
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
              <div className="flex items-center justify-center py-8 sm:py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
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
              <div className="flex items-center justify-center py-8 sm:py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
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

        {/* Details Modal */}
        {showDetailsModal && selectedProvider && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-auto">
            <Card className="w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg sm:text-xl">{selectedProvider.full_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                {/* Type de prestataire */}
                {selectedProvider.type_prestataire && (
                  <div className="bg-muted p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xl sm:text-2xl">
                        {selectedProvider.type_prestataire === 'physique' ? '👤' : '🏢'}
                      </span>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Type de prestataire</p>
                        <p className="font-semibold text-sm sm:text-base">
                          {selectedProvider.type_prestataire === 'physique' 
                            ? 'Personne Physique (Individu)' 
                            : 'Personne Morale (Entreprise)'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Informations selon le type */}
                {selectedProvider.type_prestataire === 'physique' ? (
                  // PERSONNE PHYSIQUE
                  <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3 sm:p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800 space-y-3 sm:space-y-4">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm sm:text-base">
                      Informations personnelles
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {selectedProvider.prenom && (
                        <div>
                          <p className="text-xs sm:text-sm text-muted-foreground">Prénom</p>
                          <p className="font-medium text-sm sm:text-base">{selectedProvider.prenom}</p>
                        </div>
                      )}
                      {selectedProvider.nom && (
                        <div>
                          <p className="text-xs sm:text-sm text-muted-foreground">Nom</p>
                          <p className="font-medium text-sm sm:text-base">{selectedProvider.nom}</p>
                        </div>
                      )}
                      {selectedProvider.date_naissance && (
                        <div>
                          <p className="text-xs sm:text-sm text-muted-foreground">Date de naissance</p>
                          <p className="font-medium text-sm sm:text-base">
                            {new Date(selectedProvider.date_naissance).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      )}
                      {selectedProvider.numero_cni && (
                        <div>
                          <p className="text-xs sm:text-sm text-muted-foreground">Numéro CNI / Passeport</p>
                          <p className="font-medium text-sm sm:text-base">{selectedProvider.numero_cni}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : selectedProvider.type_prestataire === 'morale' ? (
                  // PERSONNE MORALE
                  <div className="bg-green-50/50 dark:bg-green-950/20 p-3 sm:p-4 rounded-lg border-2 border-green-200 dark:border-green-800 space-y-3 sm:space-y-4">
                    <div>
                      <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3 text-sm sm:text-base">
                        Informations de l'entreprise
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {selectedProvider.raison_sociale && (
                          <div>
                            <p className="text-xs sm:text-sm text-muted-foreground">Raison sociale</p>
                            <p className="font-medium text-sm sm:text-base">{selectedProvider.raison_sociale}</p>
                          </div>
                        )}
                        {selectedProvider.forme_juridique && (
                          <div>
                            <p className="text-xs sm:text-sm text-muted-foreground">Forme juridique</p>
                            <p className="font-medium text-sm sm:text-base">{selectedProvider.forme_juridique}</p>
                          </div>
                        )}
                        {selectedProvider.numero_rccm && (
                          <div>
                            <p className="text-xs sm:text-sm text-muted-foreground">Numéro RCCM</p>
                            <p className="font-medium text-sm sm:text-base">{selectedProvider.numero_rccm}</p>
                          </div>
                        )}
                        {selectedProvider.numero_impot && (
                          <div>
                            <p className="text-xs sm:text-sm text-muted-foreground">Numéro fiscal</p>
                            <p className="font-medium text-sm sm:text-base">{selectedProvider.numero_impot}</p>
                          </div>
                        )}
                        {selectedProvider.numero_id_nat && (
                          <div>
                            <p className="text-xs sm:text-sm text-muted-foreground">Numéro ID Nationale</p>
                            <p className="font-medium text-sm sm:text-base">{selectedProvider.numero_id_nat}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {(selectedProvider.representant_legal_nom || selectedProvider.representant_legal_prenom) && (
                      <div>
                        <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3 text-sm sm:text-base">
                          Représentant légal
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          {selectedProvider.representant_legal_nom && (
                            <div>
                              <p className="text-xs sm:text-sm text-muted-foreground">Nom</p>
                              <p className="font-medium text-sm sm:text-base">{selectedProvider.representant_legal_nom}</p>
                            </div>
                          )}
                          {selectedProvider.representant_legal_prenom && (
                            <div>
                              <p className="text-xs sm:text-sm text-muted-foreground">Prénom</p>
                              <p className="font-medium text-sm sm:text-base">{selectedProvider.representant_legal_prenom}</p>
                            </div>
                          )}
                          {selectedProvider.representant_legal_fonction && (
                            <div>
                              <p className="text-xs sm:text-sm text-muted-foreground">Fonction</p>
                              <p className="font-medium text-sm sm:text-base">{selectedProvider.representant_legal_fonction}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {(selectedProvider.adresse_siege || selectedProvider.ville_siege) && (
                      <div>
                        <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3 text-sm sm:text-base">
                          Siège social
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          {selectedProvider.adresse_siege && (
                            <div>
                              <p className="text-xs sm:text-sm text-muted-foreground">Adresse</p>
                              <p className="font-medium text-sm sm:text-base">{selectedProvider.adresse_siege}</p>
                            </div>
                          )}
                          {selectedProvider.ville_siege && (
                            <div>
                              <p className="text-xs sm:text-sm text-muted-foreground">Ville</p>
                              <p className="font-medium text-sm sm:text-base">{selectedProvider.ville_siege}</p>
                            </div>
                          )}
                          {selectedProvider.pays_siege && (
                            <div>
                              <p className="text-xs sm:text-sm text-muted-foreground">Pays</p>
                              <p className="font-medium text-sm sm:text-base">{selectedProvider.pays_siege}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Informations professionnelles */}
                <div className="bg-muted p-3 sm:p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 text-sm sm:text-base">Informations professionnelles</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Email</p>
                      <p className="font-medium text-sm sm:text-base break-all">{selectedProvider.email}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Profession</p>
                      <p className="font-medium text-sm sm:text-base">{selectedProvider.profession}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Localisation</p>
                      <p className="font-medium text-sm sm:text-base">{selectedProvider.localisation || "Non spécifié"}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Note moyenne</p>
                      <p className="font-medium text-sm sm:text-base flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        {selectedProvider.rating?.toFixed(1) || "0.0"}/5
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Missions complétées</p>
                      <p className="font-medium text-sm sm:text-base">{selectedProvider.missions_completed || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Statut vérification</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={selectedProvider.verified ? "default" : "secondary"} className="text-xs">
                          {selectedProvider.verified ? "✅ Vérifié" : "⏳ En attente"}
                        </Badge>
                        <Badge variant={selectedProvider.documents_verified ? "default" : "secondary"} className="text-xs">
                          {selectedProvider.documents_verified ? "📄 Docs OK" : "📄 Docs à vérifier"}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Inscrit le</p>
                      <p className="font-medium text-sm sm:text-base">
                        {new Date(selectedProvider.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
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
                            📄 Carte d'électeur / Passeport
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
                                className="text-xs text-secondary hover:underline inline-flex items-center gap-1"
                              >
                                Ouvrir en plein écran →
                              </a>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-border rounded-lg p-4 sm:p-6 text-center">
                              <FileText className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-xs sm:text-sm text-muted-foreground mb-2">Document PDF</p>
                              <a
                                href={selectedProvider.id_document_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs sm:text-sm text-secondary hover:underline inline-flex items-center gap-1"
                              >
                                Ouvrir le PDF →
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                      {selectedProvider.qualification_url && (
                        <div className="bg-muted p-3 sm:p-4 rounded-lg">
                          <p className="text-xs sm:text-sm font-medium mb-3 flex items-center gap-2">
                            🎓 Document de qualification
                          </p>
                          {selectedProvider.qualification_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <div className="space-y-2">
                              <img
                                src={selectedProvider.qualification_url}
                                alt="Document de qualification"
                                className="w-full h-auto rounded border border-border max-h-64 sm:max-h-96 object-contain bg-white"
                              />
                              <a
                                href={selectedProvider.qualification_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-secondary hover:underline inline-flex items-center gap-1"
                              >
                                Ouvrir en plein écran →
                              </a>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-border rounded-lg p-4 sm:p-6 text-center">
                              <FileText className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-xs sm:text-sm text-muted-foreground mb-2">Document PDF</p>
                              <a
                                href={selectedProvider.qualification_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs sm:text-sm text-secondary hover:underline inline-flex items-center gap-1"
                              >
                                Ouvrir le PDF →
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-muted p-3 sm:p-4 rounded-lg text-center text-xs sm:text-sm text-muted-foreground">
                      <p>📎 Aucun document soumis</p>
                      <p className="text-xs mt-1">Le prestataire n'a pas encore uploadé ses documents</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    className="flex-1 text-sm"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    Fermer
                  </Button>
                  {!selectedProvider.verified && (
                    <>
                      <Button
                        className="flex-1 text-sm"
                        onClick={async () => {
                          await handleVerify(selectedProvider.id);
                          setShowDetailsModal(false);
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Vérifier
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1 text-sm"
                        onClick={async () => {
                          await handleReject(selectedProvider.id);
                          setShowDetailsModal(false);
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rejeter
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
