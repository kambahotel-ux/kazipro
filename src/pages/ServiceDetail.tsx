import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Wrench } from "lucide-react";
import { professionsApi, prestatairesApi } from "@/lib/api";
import {
  isProfessionIdUuid,
  professionNomFromSlugParam,
  resolveProfessionFromQuery,
} from "@/lib/service-routes";
import { mapPrestataireToUi } from "@/lib/client-helpers";
import {
  PublicPrestataireCard,
  type PublicPrestataireCardData,
} from "@/components/providers/PublicPrestataireCard";
import { toast } from "sonner";

interface LaravelPrestataire {
  id: number;
  profession?: { nom?: string; categorie?: string };
  nb_missions?: number;
}

interface PaginatedPrestataires {
  data: LaravelPrestataire[];
  total: number;
}

interface Profession {
  id: number;
  nom: string;
}

const isProfessionIdNumeric = (segment: string | undefined): boolean =>
  Boolean(segment && /^\d+$/.test(segment));

function mapToPublicCard(p: Record<string, unknown>): PublicPrestataireCardData {
  const mapped = mapPrestataireToUi(p);
  const prof = p.profession as { nom?: string; categorie?: string } | undefined;
  return {
    id: String(mapped.id ?? p.id),
    full_name: String(mapped.full_name),
    profession: String(mapped.profession || prof?.nom || ""),
    profession_categorie: prof?.categorie,
    bio: mapped.bio != null ? String(mapped.bio) : undefined,
    city: mapped.city ? String(mapped.city) : undefined,
    photo_url: mapped.photo_url ? String(mapped.photo_url) : undefined,
    verified: Boolean(mapped.verified),
    rating: Number(mapped.rating) || 0,
    reviews_count: Number(mapped.reviews_count) || 0,
    missions_completed: Number(p.nb_missions ?? 0),
    hourly_rate: Number(mapped.hourly_rate) || undefined,
    disponible: Boolean(mapped.disponible),
  };
}

const ServiceDetail = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [searchParams] = useSearchParams();
  const villeFilter = searchParams.get("ville")?.trim() || "";
  const navigate = useNavigate();
  const [providers, setProviders] = useState<PublicPrestataireCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceName, setServiceName] = useState("Chargement...");

  useEffect(() => {
    if (!serviceId) {
      setLoading(false);
      return;
    }

    fetchServiceAndProviders();
  }, [serviceId, villeFilter]);

  const fetchServiceAndProviders = async () => {
    try {
      setLoading(true);

      let profession: Profession | null = null;

      if (isProfessionIdUuid(serviceId) || isProfessionIdNumeric(serviceId)) {
        profession = (await professionsApi.getById(serviceId!)) as Profession;
      } else {
        const allProfessions = (await professionsApi.getAll()) as Profession[];
        profession =
          resolveProfessionFromQuery(serviceId!, allProfessions) ??
          (() => {
            const nom = professionNomFromSlugParam(serviceId);
            return nom
              ? allProfessions.find((p) => p.nom === nom) ?? null
              : null;
          })();
      }

      if (!profession) {
        setServiceName("Service non trouvé");
        setLoading(false);
        return;
      }

      setServiceName(profession.nom);

      const response = (await prestatairesApi.getAll({
        profession_id: profession.id,
        ville: villeFilter || undefined,
        per_page: 20,
      })) as PaginatedPrestataires;

      let cards = (response.data || []).map((p) =>
        mapToPublicCard(p as Record<string, unknown>),
      );

      // Filtre client de secours si l’API ignore `ville`
      if (villeFilter) {
        const v = villeFilter.toLowerCase();
        const filtered = cards.filter((c) =>
          (c.city || "").toLowerCase().includes(v),
        );
        if (filtered.length > 0) {
          cards = filtered;
        }
      }

      setProviders(cards);
    } catch (error: unknown) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue");
      setServiceName("Service non trouvé");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <section className="relative overflow-hidden gradient-hero py-7 sm:py-10 lg:py-14">
        <div className="pointer-events-none absolute inset-0 opacity-[0.09]">
          <div className="absolute top-10 right-6 h-40 w-40 rounded-full bg-secondary blur-3xl max-sm:hidden" />
        </div>
        <div className="container relative z-10 mx-auto px-3 sm:px-4 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/services")}
            className="mb-4 h-9 -ml-2 px-2 font-medium text-primary-foreground text-sm hover:text-primary-foreground/85 hover:bg-white/10 sm:mb-5 sm:ml-0 sm:px-4"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4 sm:mr-2" />
            Catalogue
          </Button>

          <div className="mb-2 flex items-start gap-3 sm:items-center sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm sm:h-14 sm:w-16 sm:rounded-xl">
              <Wrench className="h-5 w-5 text-white sm:h-7 sm:w-8" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-[1.375rem] font-bold leading-tight text-primary-foreground sm:text-3xl md:text-4xl">
                {serviceName}
              </h1>
              <p className="mt-1 text-sm text-primary-foreground/80 sm:text-base">
                {providers.length} professionnel{providers.length > 1 ? "s" : ""} vérifié
                {providers.length > 1 ? "s" : ""} disponible{providers.length > 1 ? "s" : ""}
                {villeFilter ? ` · ${villeFilter}` : ""}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/40 bg-muted/20 py-8 sm:py-12 lg:py-14">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden rounded-2xl border-l-[3px] border-l-muted">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex gap-3">
                      <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
                      <div className="min-w-0 flex-1 space-y-2 pt-1">
                        <Skeleton className="h-5 w-3/5" />
                        <Skeleton className="h-4 w-2/5" />
                      </div>
                    </div>
                    <Skeleton className="h-14 w-full rounded-lg" />
                    <div className="flex gap-2">
                      <Skeleton className="h-7 w-24 rounded-md" />
                      <Skeleton className="h-7 w-20 rounded-md" />
                    </div>
                    <Skeleton className="h-9 w-full rounded-xl" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : providers.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="py-12 text-center">
                <p className="mb-4 text-muted-foreground">
                  Aucun prestataire vérifié pour ce service pour le moment.
                </p>
                <Link to="/inscription/client">
                  <Button>Publier une demande</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-5 lg:gap-6">
              {providers.map((provider) => (
                <PublicPrestataireCard
                  key={provider.id}
                  provider={provider}
                  profileHref={`/prestataires/${provider.id}`}
                  contactHref="/inscription/client"
                  contactLabel="Demander un devis"
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-border/50 bg-muted/45 py-8 sm:py-12 lg:py-14">
        <div className="container mx-auto max-w-xl px-3 text-center sm:max-w-none sm:px-4 lg:px-8">
          <h2 className="mb-3 px-1 font-display text-lg font-bold text-foreground sm:mb-4 sm:text-2xl md:text-3xl">
            Besoin d&apos;un{" "}
            {["Chargement...", "Service non trouvé"].includes(serviceName)
              ? "professionnel"
              : serviceName.toLowerCase()}
            &nbsp;?
          </h2>
          <p className="mx-auto mb-6 max-w-lg text-sm text-muted-foreground sm:text-base">
            Publiez votre demande et recevez des devis sans engagement.
          </p>
          <Button size="lg" className="w-full max-w-xs rounded-xl sm:w-auto" asChild>
            <Link to="/inscription/client">Publier une demande</Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
};

export default ServiceDetail;
