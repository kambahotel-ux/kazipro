import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Shield, Clock, Star, ArrowRight, Users, BadgeCheck, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface FeaturedProvider {
  id: string;
  full_name: string;
  profession: string;
  rating: number;
  missions_completed: number;
}

const HeroSection = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredProvider, setFeaturedProvider] = useState<FeaturedProvider | null>(null);
  const [totalProviders, setTotalProviders] = useState(500);
  const [onlineProviders, setOnlineProviders] = useState(0);
  const [completedProjects, setCompletedProjects] = useState(1200);

  useEffect(() => {
    fetchFeaturedProvider();
    fetchTotalProviders();
    fetchOnlineProviders();
    fetchCompletedProjects();
    
    // Mettre à jour le compteur en ligne toutes les 30 secondes
    const interval = setInterval(fetchOnlineProviders, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchFeaturedProvider = async () => {
    try {
      // Get a random verified provider with good rating
      const { data, error } = await supabase
        .from("prestataires")
        .select("id, full_name, profession, rating")
        .eq("verified", true)
        .gte("rating", 4.0)
        .limit(10);

      if (error) throw error;

      if (data && data.length > 0) {
        // Pick a random one from the top 10
        const randomIndex = Math.floor(Math.random() * data.length);
        const provider = data[randomIndex];
        
        // Count missions for this provider
        const { count } = await supabase
          .from("missions")
          .select("*", { count: "exact", head: true })
          .eq("prestataire_id", provider.id)
          .eq("status", "completed");

        setFeaturedProvider({
          ...provider,
          missions_completed: count || 0
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement du prestataire:", error);
    }
  };

  const fetchOnlineProviders = async () => {
    try {
      const { count, error } = await supabase
        .from("prestataires")
        .select("*", { count: "exact", head: true })
        .eq("verified", true)
        .eq("is_online", true);

      if (error) {
        console.error("Erreur RLS ou colonnes:", error);
        return;
      }

      console.log("Prestataires en ligne:", count);
      setOnlineProviders(count || 0);
    } catch (error) {
      console.error("Erreur lors du comptage des prestataires en ligne:", error);
    }
  };

  const fetchTotalProviders = async () => {
    try {
      const { count: totalCount } = await supabase
        .from("prestataires")
        .select("*", { count: "exact", head: true })
        .eq("verified", true);
      
      if (totalCount) setTotalProviders(totalCount);
    } catch (error) {
      console.error("Erreur lors du comptage des prestataires:", error);
    }
  };

  const fetchCompletedProjects = async () => {
    try {
      const { count: completedCount } = await supabase
        .from("missions")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed");
      
      if (completedCount) {
        setCompletedProjects(completedCount);
      }
    } catch (error) {
      console.error("Erreur lors du comptage des projets:", error);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/services?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate("/services");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-br from-primary via-primary to-primary/90 overflow-hidden">
      {/* Enhanced Background Pattern - Optimized for mobile */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 bg-[radial-gradient(circle,rgba(255,255,255,0.1),transparent_70%)] animate-pulse" />
      </div>

      {/* Floating Elements - Hidden on mobile for better performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        <div className="absolute top-20 left-10 w-2 h-2 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <div className="absolute top-40 right-20 w-3 h-3 bg-secondary/30 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }} />
        <div className="absolute bottom-32 left-20 w-2 h-2 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '2s', animationDuration: '5s' }} />
        <div className="absolute bottom-20 right-32 w-4 h-4 bg-secondary/20 rounded-full animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }} />
      </div>

      <div className="container mx-auto px-4 py-8 md:py-20 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Main Content - Centered and Mobile Optimized */}
          <div className="text-center text-primary-foreground space-y-6 md:space-y-8 mb-12 md:mb-16">
            {/* Online Badge - Smaller on mobile */}
            {onlineProviders > 0 && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-xs md:text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                </span>
                <span className="hidden sm:inline">{onlineProviders} professionnel{onlineProviders > 1 ? 's' : ''} disponible{onlineProviders > 1 ? 's' : ''} en ce moment</span>
                <span className="sm:hidden">{onlineProviders} en ligne</span>
              </div>
            )}
            
            {/* Main Heading - Mobile optimized sizes */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold leading-tight max-w-4xl mx-auto px-2">
              Trouvez le professionnel qu'il vous faut
            </h1>
            
            {/* Subheading - Mobile optimized */}
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-primary-foreground/90 max-w-3xl mx-auto leading-relaxed px-4">
              Des prestataires qualifiés et vérifiés pour tous vos projets en RDC. Paiement sécurisé, satisfaction garantie.
            </p>

            {/* Search Bar - Mobile First Design */}
            <div className="max-w-3xl mx-auto pt-2 md:pt-4 px-2">
              <div className="flex flex-col gap-3 p-2 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Quel service recherchez-vous ?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full h-12 md:h-14 pl-12 pr-4 rounded-xl bg-white text-foreground placeholder:text-muted-foreground border-0 focus:outline-none focus:ring-2 focus:ring-secondary text-sm md:text-base"
                  />
                </div>
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="group bg-secondary hover:bg-secondary/90 text-secondary-foreground h-12 md:h-14 px-6 md:px-8 w-full" 
                  onClick={handleSearch}
                >
                  Rechercher
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>

            {/* Trust Indicators - Mobile optimized */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8 pt-6 md:pt-8 px-4">
              <div className="flex items-center gap-2 text-primary-foreground/90">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 md:w-5 md:h-5 text-secondary" />
                </div>
                <span className="text-xs md:text-sm font-medium">Paiement sécurisé</span>
              </div>
              <div className="flex items-center gap-2 text-primary-foreground/90">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-secondary" />
                </div>
                <span className="text-xs md:text-sm font-medium">Réponse rapide</span>
              </div>
              <div className="flex items-center gap-2 text-primary-foreground/90">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Star className="w-4 h-4 md:w-5 md:h-5 text-secondary fill-secondary" />
                </div>
                <span className="text-xs md:text-sm font-medium">4.8/5 satisfaction</span>
              </div>
            </div>
          </div>

          {/* Stats Cards - Mobile First Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 max-w-5xl mx-auto px-2">
            {/* Online Providers */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/20 text-center hover:bg-white/15 transition-all duration-300 group animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-2 md:mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4 md:w-6 md:h-6 text-green-400" />
              </div>
              <div className="text-xl md:text-3xl font-bold text-white mb-1">{onlineProviders}</div>
              <div className="text-xs md:text-sm text-primary-foreground/80 leading-tight">En ligne maintenant</div>
            </div>

            {/* Total Providers */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/20 text-center hover:bg-white/15 transition-all duration-300 group animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-2 md:mb-4 group-hover:scale-110 transition-transform">
                <BadgeCheck className="w-4 h-4 md:w-6 md:h-6 text-secondary" />
              </div>
              <div className="text-xl md:text-3xl font-bold text-white mb-1">{totalProviders}+</div>
              <div className="text-xs md:text-sm text-primary-foreground/80 leading-tight">Prestataires vérifiés</div>
            </div>

            {/* Average Rating */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/20 text-center hover:bg-white/15 transition-all duration-300 group animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-2 md:mb-4 group-hover:scale-110 transition-transform">
                <Star className="w-4 h-4 md:w-6 md:h-6 text-yellow-400 fill-yellow-400" />
              </div>
              <div className="text-xl md:text-3xl font-bold text-white mb-1">4.8</div>
              <div className="text-xs md:text-sm text-primary-foreground/80 leading-tight">Note moyenne</div>
            </div>

            {/* New Card: Completed Projects */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/20 text-center hover:bg-white/15 transition-all duration-300 group animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-2 md:mb-4 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-4 h-4 md:w-6 md:h-6 text-blue-400" />
              </div>
              <div className="text-xl md:text-3xl font-bold text-white mb-1">{completedProjects.toLocaleString()}+</div>
              <div className="text-xs md:text-sm text-primary-foreground/80 leading-tight">Projets réalisés</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
