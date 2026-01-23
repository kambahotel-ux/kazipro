import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Camera, Calendar, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface PortfolioItem {
  id: string;
  titre: string;
  description: string;
  categorie: string;
  date_realisation: string;
  images: string[];
  created_at: string;
}

interface PrestatairePortfolioProps {
  prestataireId: string;
}

export default function PrestatairePortfolio({ prestataireId }: PrestatairePortfolioProps) {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    fetchPortfolio();
  }, [prestataireId]);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("portfolio_items")
        .select("*")
        .eq("prestataire_id", prestataireId)
        .order("date_realisation", { ascending: false });

      if (error) throw error;
      setPortfolio(data || []);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Réalisations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (portfolio.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Réalisations</CardTitle>
          <CardDescription>
            Les réalisations de ce prestataire apparaîtront ici
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Aucune réalisation pour le moment</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Réalisations ({portfolio.length})</CardTitle>
          <CardDescription>
            Découvrez les travaux réalisés par ce prestataire
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolio.map((item) => (
              <div
                key={item.id}
                className="group relative border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                {/* Image principale */}
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt={item.titre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  {/* Badge nombre d'images */}
                  {item.images && item.images.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      {item.images.length}
                    </div>
                  )}
                </div>

                {/* Infos */}
                <div className="p-3">
                  <h4 className="font-semibold text-sm mb-1 line-clamp-1">{item.titre}</h4>
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.date_realisation).toLocaleDateString('fr-FR', { 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {item.categorie}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de détails */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedItem.titre}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {/* Carousel d'images */}
                {selectedItem.images && selectedItem.images.length > 0 && (
                  <div className="space-y-2">
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                      <img
                        src={selectedItem.images[0]}
                        alt={selectedItem.titre}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {selectedItem.images.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {selectedItem.images.slice(1).map((img, idx) => (
                          <div 
                            key={idx} 
                            className="aspect-square rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-80"
                          >
                            <img
                              src={img}
                              alt={`${selectedItem.titre} ${idx + 2}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Description */}
                {selectedItem.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {selectedItem.description}
                    </p>
                  </div>
                )}

                {/* Métadonnées */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {new Date(selectedItem.date_realisation).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <Badge variant="outline">{selectedItem.categorie}</Badge>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
