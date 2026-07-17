import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Search,
  Shield,
  Clock,
  Star,
  ArrowRight,
  Users,
  BadgeCheck,
  ChevronRight,
  Sparkles,
  Package,
  Briefcase,
} from "lucide-react";
import { prestatairesApi, materielsApi } from "@/lib/api";
import {
  prestataireDisplayName,
  useHomePrestataires,
  type LaravelPrestataire,
} from "@/contexts/HomePrestatairesContext";

interface FeaturedProvider {
  id: string;
  full_name: string;
  profession: string;
  rating: number;
  missions_completed: number;
}

const HeroSection = () => {
  const navigate = useNavigate();
  const homeStats = useHomePrestataires();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"services" | "location">("services");
  const [featuredProvider, setFeaturedProvider] = useState<FeaturedProvider | null>(null);
  const [materielCount, setMaterielCount] = useState(0);

  const totalProviders = homeStats?.totalProviders ?? 500;
  const onlineProviders = homeStats?.onlineProviders ?? 0;
  const completedProjects = homeStats?.completedProjects ?? 1200;

  useEffect(() => {
    void materielsApi.getAll({ per_page: 1 }).then((res) => {
      const total = (res as { total?: number }).total;
      if (typeof total === "number") setMaterielCount(total);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (homeStats?.providers?.length) {
      pickFeatured(homeStats.providers);
      return;
    }
    if (!homeStats) {
      void fetchFeaturedFallback();
    }
  }, [homeStats?.providers]);

  const pickFeatured = (list: LaravelPrestataire[]) => {
    const candidates = list.filter((p) => Number(p.note_moyenne) >= 4.0);
    const pool = candidates.length > 0 ? candidates : list;
    if (pool.length === 0) return;
    const provider = pool[Math.floor(Math.random() * pool.length)];
    setFeaturedProvider({
      id: String(provider.id),
      full_name: prestataireDisplayName(provider),
      profession: provider.profession?.nom || "",
      rating: Number(provider.note_moyenne) || 0,
      missions_completed: provider.nb_missions || 0,
    });
  };

  const fetchFeaturedFallback = async () => {
    try {
      const response = await prestatairesApi.getAll({ per_page: 10 });
      const list = (response as { data?: LaravelPrestataire[] }).data ?? [];
      pickFeatured(list);
    } catch {
      /* empty */
    }
  };

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (searchMode === "location") {
      navigate(q ? `/location?q=${encodeURIComponent(q)}` : "/location");
      return;
    }
    if (q) {
      navigate(`/services?q=${encodeURIComponent(q)}`);
    } else {
      navigate("/services");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <section className="relative max-sm:min-h-0 sm:min-h-[min(100dvh,920px)] flex max-sm:items-start sm:items-center bg-gradient-to-b from-primary via-primary to-primary/95 overflow-hidden pb-10 sm:pb-0">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 opacity-[0.055] max-sm:bg-[length:36px_36px] sm:bg-[length:56px_56px] bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)]" />
        <div className="absolute -top-32 right-[-10%] w-[min(80vw,640px)] aspect-square rounded-full bg-secondary/25 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-5%] w-[min(70vw,520px)] aspect-square rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-10 sm:py-16 md:py-24 lg:py-28 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-10 items-start lg:items-center">
            {/* Col gauche */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-5 sm:space-y-6 md:space-y-8">
              {onlineProviders > 0 && (
                <div className="inline-flex lg:mx-0 mx-auto items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-emerald-100 text-xs md:text-sm font-medium backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <span className="hidden sm:inline">
                    {onlineProviders} professionnel
                    {onlineProviders > 1 ? "s" : ""} disponible
                    {onlineProviders > 1 ? "s" : ""} en ce moment
                  </span>
                  <span className="sm:hidden">{onlineProviders} en ligne</span>
                </div>
              )}

              <div className="space-y-3 sm:space-y-4">
                <p className="inline-flex lg:justify-start justify-center items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.14em] sm:tracking-[0.2em] text-primary-foreground/70 max-sm:text-pretty px-2 sm:px-0">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                  <span className="sm:hidden">Services &amp; location — RDC</span>
                  <span className="hidden sm:inline">Services professionnels et location matériel en RDC</span>
                </p>
                <h1 className="text-[1.55rem] leading-[1.12] sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-6xl font-display font-bold tracking-tight text-primary-foreground px-1 sm:px-0">
                  Pros vérifiés et matériel à louer pour{" "}
                  <span className="text-secondary">chaque projet</span>
                </h1>
                <p className="text-sm sm:text-lg md:text-xl text-primary-foreground/85 max-w-xl mx-auto lg:mx-0 leading-relaxed max-sm:max-w-[20rem] sm:max-w-none">
                  <span className="sm:hidden">Missions, devis, location d&apos;outils — contrat et Mobile Money.</span>
                  <span className="hidden sm:inline">
                  Trouvez un artisan ou louez du matériel : devis, contrats, caution sécurisée et paiement Mobile Money.
                  </span>
                </p>
              </div>

              <div className="max-w-xl mx-auto lg:mx-0 px-1 sm:px-0 space-y-2">
                <div className="inline-flex rounded-lg bg-white/10 p-1 border border-white/15">
                  <button
                    type="button"
                    onClick={() => setSearchMode("services")}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
                      searchMode === "services"
                        ? "bg-white text-primary shadow-sm"
                        : "text-primary-foreground/80 hover:text-primary-foreground"
                    }`}
                  >
                    <Briefcase className="h-3.5 w-3.5" />
                    Services
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchMode("location")}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
                      searchMode === "location"
                        ? "bg-white text-primary shadow-sm"
                        : "text-primary-foreground/80 hover:text-primary-foreground"
                    }`}
                  >
                    <Package className="h-3.5 w-3.5" />
                    Location
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-white/[0.12] backdrop-blur-md border border-white/15 shadow-lg shadow-black/10">
                  <div className="flex-1 relative min-w-0">
                    <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground pointer-events-none" />
                    <input
                      type="search"
                      name="hero-search"
                      autoComplete="off"
                      placeholder={
                        searchMode === "location"
                          ? "Ex. perceuse, échafaudage…"
                          : "Ex. électricité, peinture…"
                      }
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full h-11 sm:h-12 md:h-[3.25rem] pl-10 sm:pl-12 pr-3 sm:pr-4 rounded-lg sm:rounded-xl bg-background text-foreground placeholder:text-muted-foreground border border-border/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary text-sm md:text-base"
                    />
                  </div>
                  <Button
                    variant="hero"
                    size="lg"
                    type="button"
                    className="group shrink-0 bg-secondary hover:bg-secondary/90 text-secondary-foreground h-11 sm:h-12 md:h-[3.25rem] px-6 sm:px-8 font-semibold text-sm sm:text-base"
                    onClick={handleSearch}
                  >
                    Rechercher
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 sm:gap-x-8 gap-y-3 pt-1 sm:pt-2 text-primary-foreground/90 text-xs sm:text-sm max-sm:px-1">
                <span className="inline-flex items-center gap-1.5 sm:gap-2">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-secondary shrink-0" />
                  <span className="sm:hidden">Contrats · signatures</span>
                  <span className="hidden sm:inline">Contrats et signatures</span>
                </span>
                <span className="inline-flex items-center gap-1.5 sm:gap-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-secondary shrink-0" />
                  <span className="sm:hidden">Réponses rapides</span>
                  <span className="hidden sm:inline">Réponses rapides des pros</span>
                </span>
                <span className="inline-flex items-center gap-1.5 sm:gap-2">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-secondary shrink-0" />
                  <span className="sm:hidden">Location matériel</span>
                  <span className="hidden sm:inline">Location avec contrat &amp; caution</span>
                </span>
              </div>
            </div>

            {/* Carte mise en avant – droite */}
            <div className="lg:col-span-5 max-w-md mx-auto lg:max-w-none w-full space-y-3 sm:space-y-4">
              <div className="rounded-xl sm:rounded-2xl border border-white/20 bg-white/[0.08] backdrop-blur-xl p-4 sm:p-6 md:p-8 shadow-xl shadow-black/20 text-left">
                <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-primary-foreground/60 mb-0.5 sm:mb-1">
                      Exemple récent
                    </p>
                    <p className="text-base sm:text-lg md:text-xl font-display font-semibold text-primary-foreground truncate">
                      Profils vérifiés
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-primary-foreground border border-white/10">
                    <Star className="w-3.5 h-3.5 text-secondary fill-secondary" />
                    Qualité
                  </div>
                </div>

                {featuredProvider ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 sm:gap-4 rounded-lg sm:rounded-xl bg-white/[0.07] border border-white/10 p-3 sm:p-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary/30 flex items-center justify-center shrink-0">
                        <BadgeCheck className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-display font-semibold text-primary-foreground truncate">
                          {featuredProvider.full_name}
                        </p>
                        <p className="text-sm text-primary-foreground/75">
                          {featuredProvider.profession}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-primary-foreground/65">
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-secondary fill-secondary" />{" "}
                            {(Number(featuredProvider.rating) || 0).toFixed(1)}/5
                          </span>
                          <span className="whitespace-nowrap sm:whitespace-normal">
                            <span className="sm:hidden">
                              {featuredProvider.missions_completed} missions faites
                            </span>
                            <span className="hidden sm:inline">
                              {featuredProvider.missions_completed} missions terminées
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-primary-foreground/70 leading-relaxed">
                    Nos prestataires passent une vérification avant d’être visibles sur
                    KaziPro. Parcourez les métiers et les avis depuis la liste des services.
                  </p>
                )}

                <div className="mt-4 sm:mt-6 flex flex-col gap-2">
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-between rounded-lg sm:rounded-xl bg-white/[0.1] hover:bg-white/[0.16] border border-white/15 text-primary-foreground h-auto py-2.5 sm:py-3 px-3 sm:px-4 text-sm sm:text-base font-semibold"
                  >
                    <Link to="/services">
                      Explorer les professions
                      <ChevronRight className="w-5 h-5 opacity-70" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-between rounded-lg sm:rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-primary-foreground h-auto py-2.5 sm:py-3 px-3 sm:px-4 text-sm sm:text-base font-semibold"
                  >
                    <Link to="/location">
                      Louer du matériel
                      <ChevronRight className="w-5 h-5 opacity-70" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 text-center lg:text-left">
                <div className="rounded-lg sm:rounded-xl border border-white/15 bg-white/[0.05] backdrop-blur-sm px-2.5 py-2.5 sm:px-3 sm:py-3 md:py-4">
                  <div className="text-base sm:text-lg md:text-2xl font-display font-bold text-primary-foreground tabular-nums">
                    {materielCount > 0 ? `${materielCount}+` : "—"}
                  </div>
                  <div className="text-[10px] sm:text-[11px] md:text-xs text-primary-foreground/65 leading-snug mt-0.5">
                    <span className="sm:hidden">Annonces location</span>
                    <span className="hidden sm:inline">Matériels en location</span>
                  </div>
                </div>
                <div className="rounded-lg sm:rounded-xl border border-white/15 bg-white/[0.05] backdrop-blur-sm px-2.5 py-2.5 sm:px-3 sm:py-3 md:py-4">
                  <div className="text-base sm:text-lg md:text-2xl font-display font-bold text-primary-foreground tabular-nums truncate">
                    {completedProjects.toLocaleString("fr-FR")}+
                  </div>
                  <div className="text-[10px] sm:text-[11px] md:text-xs text-primary-foreground/65 leading-snug mt-0.5">
                    <span className="sm:hidden">Missions</span>
                    <span className="hidden sm:inline">Missions réalisées</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bandeau statistiques bas de hero */}
          <div className="hidden sm:grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 max-w-5xl mx-auto mt-10 md:mt-14 lg:mt-20 pt-8 md:pt-10 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 rounded-xl bg-white/[0.06] border border-white/10 px-4 py-4 text-center sm:text-left">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-primary-foreground tabular-nums">
                  {onlineProviders}
                </div>
                <div className="text-xs text-primary-foreground/65">
                  En ligne
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 rounded-xl bg-white/[0.06] border border-white/10 px-4 py-4 text-center sm:text-left">
              <div className="w-10 h-10 rounded-lg bg-secondary/25 flex items-center justify-center shrink-0">
                <BadgeCheck className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-primary-foreground tabular-nums">
                  {totalProviders}+
                </div>
                <div className="text-xs text-primary-foreground/65">
                  Référencés
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 rounded-xl bg-white/[0.06] border border-white/10 px-4 py-4 text-center sm:text-left">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 text-amber-300 fill-amber-300/50" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-primary-foreground tabular-nums">
                  4,8
                </div>
                <div className="text-xs text-primary-foreground/65">
                  Note moyenne
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 rounded-xl bg-white/[0.06] border border-white/10 px-4 py-4 text-center sm:text-left col-span-2 sm:col-span-1">
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-violet-200" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-primary-foreground tabular-nums">
                  {materielCount > 0 ? materielCount : "—"}
                </div>
                <div className="text-xs text-primary-foreground/65">
                  Matériels en location
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
