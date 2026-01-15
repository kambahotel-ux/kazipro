import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  ArrowLeft, Star, MapPin, Award, CheckCircle, Wrench
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Provider {
  id: string;
  full_name: string;
  profession: string;
  bio?: string;
  localisation?: string;
  rating: number;
  missions_completed: number;
  verified: boolean;
  annees_experience?: number;
}

const ServiceDetail = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceName, setServiceName] = useState("Chargement...");

  useEffect(() => {
    if (!serviceId) {
      setLoading(false);
      return;
    }
    
    fetchServiceAndProviders();
  }, [serviceId]);

  const fetchServiceAndProviders = async () => {
    try {
      setLoading(true);
      
      // Find profession by ID
      const { data: profession, error: profError } = await supabase
        .from("professions")
        .select("*")
        .eq("id", serviceId)
        .eq("actif", true)
        .maybeSingle();

      if (profError) {
        console.error("Erreur lors du chargement du service:", profError);
        toast.error("Erreur lors du chargement du service");
        setServiceName("Service non trouvé");
        setLoading(false);
        return;
      }

      if (!profession) {
        setServiceName("Service non trouvé");
        setLoading(false);
        return;
      }

      setServiceName(profession.nom);

      // Fetch providers for this profession
      const { data, error } = await supabase
        .from("prestataires")
        .select("*")
        .eq("profession", profession.nom)
        .eq("verified", true)
        .order("rating", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Erreur lors du chargement des prestataires:", error);
        toast.error("Erreur lors du chargement des prestataires");
      }
      
      setProviders(data || []);
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero */}
        <section className="py-12 lg:py-16 gradient-hero">
          <div className="container mx-auto px-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/services")}
              className="mb-6 text-primary-foreground hover:text-primary-foreground/80"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux services
            </Button>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Wrench className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground">
                  {serviceName}
                </h1>
                <p className="text-primary-foreground/80 mt-1">
                  {providers.length} professionnel{providers.length > 1 ? 's' : ''} disponible{providers.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Providers List */}
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-muted-foreground mt-4">Chargement...</p>
              </div>
            ) : providers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    Aucun prestataire trouvé pour ce service
                  </p>
                  <Link to="/inscription/client">
                    <Button>
                      Publier une demande
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {providers.map((provider) => (
                  <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="w-16 h-16">
                          <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                            {getInitials(provider.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg truncate">
                              {provider.full_name}
                            </h3>
                            {provider.verified && (
                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {provider.profession}
                          </p>
                        </div>
                      </div>

                      {provider.bio && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {provider.bio}
                        </p>
                      )}

                      <div className="space-y-2 mb-4">
                        {provider.localisation && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            {provider.localisation}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">{provider.rating.toFixed(1)}</span>
                          <span className="text-muted-foreground">
                            ({provider.missions_completed} missions)
                          </span>
                        </div>

                        {provider.annees_experience && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Award className="w-4 h-4" />
                            {provider.annees_experience} ans d'expérience
                          </div>
                        )}
                      </div>

                      <Link to="/inscription/client">
                        <Button className="w-full">
                          Contacter
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 bg-muted/50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              Besoin d'un {serviceName.toLowerCase()} ?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Publiez votre demande gratuitement et recevez des devis de professionnels qualifiés.
            </p>
            <Link to="/inscription/client">
              <Button size="lg">
                Publier une demande gratuite
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ServiceDetail;
