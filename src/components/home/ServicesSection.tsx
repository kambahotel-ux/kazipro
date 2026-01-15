import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  Zap, 
  Droplets, 
  Hammer, 
  PaintBucket, 
  Wind, 
  Wrench,
  ArrowRight,
  HardHat,
  Sofa,
  Car,
  Laptop,
  Briefcase
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// Icon mapping
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
  description: string;
  icon: any;
  color: string;
  providers: number;
}

const ServicesSection = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      // Fetch top 6 professions
      const { data: professions, error } = await supabase
        .from("professions")
        .select("*")
        .eq("actif", true)
        .order("nom")
        .limit(6);

      if (error) throw error;

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
    } catch (error) {
      console.error("Erreur lors du chargement des services:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
            Nos services professionnels
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
            Des experts qualifiés dans tous les domaines pour répondre à vos besoins.
          </p>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-secondary border-t-transparent"></div>
            <p className="text-muted-foreground mt-4 text-lg">Chargement des services...</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
              {services.map((service, index) => (
                <Link
                  key={service.id}
                  to={`/services/${service.id}`}
                  className="group relative bg-card rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-border"
                >
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <service.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-display font-bold text-foreground mb-3 group-hover:text-secondary transition-colors">
                    {service.nom}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-6 line-clamp-2">
                    {service.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-6 border-t border-border">
                    <span className="text-sm text-muted-foreground">
                      <span className="font-bold text-lg text-foreground">{service.providers}</span> pro{service.providers > 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center text-secondary font-semibold">
                      Découvrir
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center mt-16">
              <Link 
                to="/services" 
                className="inline-flex items-center gap-3 px-8 py-4 bg-secondary text-secondary-foreground rounded-xl font-semibold hover:bg-secondary/90 transition-all hover:gap-5 shadow-lg hover:shadow-xl"
              >
                Voir tous les services
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default ServicesSection;
