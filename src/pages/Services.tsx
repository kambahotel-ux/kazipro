import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { 
  Zap, Droplets, Hammer, PaintBucket, Wind, Wrench, 
  HardHat, Sofa, Car, Laptop, ArrowRight, Search, Briefcase
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// Icon mapping for professions
const iconMap: Record<string, any> = {
  "Électricité": Zap,
  "Électricien": Zap,
  "Plomberie": Droplets,
  "Plombier": Droplets,
  "Menuiserie": Hammer,
  "Menuisier": Hammer,
  "Peinture": PaintBucket,
  "Peintre": PaintBucket,
  "Climatisation": Wind,
  "Climaticien": Wind,
  "Mécanique": Car,
  "Mécanicien": Car,
  "Maçonnerie": HardHat,
  "Maçon": HardHat,
  "Tapisserie": Sofa,
  "Tapissier": Sofa,
  "Informatique": Laptop,
  "Informaticien": Laptop,
};

// Color mapping
const colorMap: Record<string, string> = {
  "Électricité": "from-yellow-400 to-orange-500",
  "Électricien": "from-yellow-400 to-orange-500",
  "Plomberie": "from-blue-400 to-cyan-500",
  "Plombier": "from-blue-400 to-cyan-500",
  "Menuiserie": "from-amber-500 to-orange-600",
  "Menuisier": "from-amber-500 to-orange-600",
  "Peinture": "from-purple-400 to-pink-500",
  "Peintre": "from-purple-400 to-pink-500",
  "Climatisation": "from-teal-400 to-blue-500",
  "Climaticien": "from-teal-400 to-blue-500",
  "Mécanique": "from-gray-500 to-gray-700",
  "Mécanicien": "from-gray-500 to-gray-700",
  "Maçonnerie": "from-orange-400 to-red-500",
  "Maçon": "from-orange-400 to-red-500",
  "Tapisserie": "from-rose-400 to-pink-600",
  "Tapissier": "from-rose-400 to-pink-600",
  "Informatique": "from-indigo-400 to-purple-500",
  "Informaticien": "from-indigo-400 to-purple-500",
};

interface Service {
  id: string;
  nom: string;
  description?: string;
  icon: any;
  color: string;
  providers: number;
}

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      
      // Fetch professions from database
      const { data: professions, error } = await supabase
        .from("professions")
        .select("*")
        .eq("actif", true)
        .order("nom");

      if (error) {
        console.error("Erreur lors du chargement des professions:", error);
        throw error;
      }

      // Count providers for each profession
      const servicesWithCounts = await Promise.all(
        (professions || []).map(async (profession) => {
          const { count } = await supabase
            .from("prestataires")
            .select("*", { count: "exact", head: true })
            .eq("profession", profession.nom)
            .eq("verified", true);

          return {
            id: profession.id,
            nom: profession.nom,
            description: profession.description || `Services de ${profession.nom.toLowerCase()}`,
            icon: iconMap[profession.nom] || Briefcase,
            color: colorMap[profession.nom] || "from-gray-400 to-gray-600",
            providers: count || 0,
          };
        })
      );

      setServices(servicesWithCounts);
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des services");
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service =>
    service.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero */}
        <section className="py-16 lg:py-24 gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-72 h-72 bg-secondary rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center text-primary-foreground">
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
                Tous nos services
              </h1>
              <p className="text-xl text-primary-foreground/80 mb-8">
                Découvrez l'ensemble de nos catégories de services et trouvez le professionnel qu'il vous faut.
              </p>
              
              {/* Search */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher un service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 rounded-xl bg-card text-foreground placeholder:text-muted-foreground border-0 focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-muted-foreground mt-4">Chargement des services...</p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Aucun service trouvé</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {filteredServices.map((service) => (
                  <Link
                    key={service.id}
                    to={`/services/${service.id}`}
                    className="group bg-card rounded-2xl p-6 shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-border/50"
                  >
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                      <service.icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-display font-semibold text-foreground mb-2 group-hover:text-secondary transition-colors">
                      {service.nom}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2">
                      {service.description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <span className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">{service.providers}</span> prestataire{service.providers > 1 ? 's' : ''}
                      </span>
                      <div className="flex items-center text-secondary font-medium text-sm">
                        Voir
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
              Vous ne trouvez pas votre service ?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Décrivez votre besoin et nous vous mettrons en contact avec les bons professionnels.
            </p>
            <Link to="/inscription/client">
              <Button variant="secondary" size="lg">
                Publier une demande
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Services;
