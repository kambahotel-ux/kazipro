import { useState } from "react";
import { useAbortableFetch } from "@/hooks/useAbortableFetch";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Star, Edit, Trash2 } from "lucide-react";
import { AdminListSkeleton } from "@/components/dashboard/AdminLoadingSkeleton";
import { useAuth } from "@/contexts/AuthContext";
import { avisApi } from "@/lib/api";
import { getClientDisplayName, mapAvisToUi } from "@/lib/client-helpers";
import { toast } from "sonner";

interface Avis {
  id: string;
  mission_id: string;
  rating: number;
  comment: string;
  created_at: string;
  to_user?: {
    full_name: string;
  };
}

export default function AvisPage() {
  const { user } = useAuth();
  const clientName = getClientDisplayName(user);
  const [avis, setAvis] = useState<Avis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAvis, setSelectedAvis] = useState<Avis | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");

  useAbortableFetch(Boolean(user), [user], async (signal) => {
    if (!user || signal.aborted) return;
    try {
      setLoading(true);
      const data = await avisApi.getMine();
      if (signal.aborted) return;
      setAvis(
        (Array.isArray(data) ? data : []).map((item) => {
          const mapped = mapAvisToUi(item as Record<string, unknown>);
          return {
            id: String(mapped.id),
            mission_id: String(mapped.mission_id ?? ""),
            rating: Number(mapped.rating ?? 0),
            comment: String(mapped.comment ?? ""),
            created_at: String(mapped.created_at ?? new Date().toISOString()),
            to_user: mapped.to_user as Avis["to_user"],
          };
        }),
      );
    } catch (error: unknown) {
      if (signal.aborted) return;
      const message = error instanceof Error ? error.message : "Erreur lors du chargement des avis";
      toast.error(message);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  });

  const handleDeleteAvis = async (_avisId: string) => {
    toast.info("La suppression d'avis n'est pas encore disponible via l'API.");
  };

  const handleUpdateAvis = async () => {
    toast.info("La modification d'avis n'est pas encore disponible via l'API.");
    setShowEditModal(false);
  };

  const filteredAvis = avis.filter(
    (a) =>
      a.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.id.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <DashboardLayout role="client" userName={clientName} userRole="Client">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Mes Avis</h1>
          <p className="text-muted-foreground">Consultez et gérez vos avis sur les prestataires</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher un avis..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <AdminListSkeleton items={3} />
        ) : avis.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Aucun avis trouvé</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAvis.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar>
                        <AvatarFallback>
                          {item.to_user?.full_name?.split(" ").map((n) => n[0]).join("") || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold">{item.to_user?.full_name || "Prestataire"}</h4>
                          <Badge variant="outline" className="text-xs">
                            Vérifié
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < item.rating ? "text-yellow-500 fill-yellow-500" : "text-muted"
                              }`}
                            />
                          ))}
                          <span className="text-sm text-muted-foreground ml-2">({item.rating}/5)</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{item.comment}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedAvis(item);
                          setEditRating(item.rating);
                          setEditComment(item.comment);
                          setShowEditModal(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteAvis(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {showEditModal && selectedAvis && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Modifier l'avis</CardTitle>
                <Button variant="ghost" onClick={() => setShowEditModal(false)}>
                  ✕
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Prestataire</p>
                  <p className="font-medium">{selectedAvis.to_user?.full_name || "Prestataire"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Note</p>
                  <div className="flex gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button key={i} onClick={() => setEditRating(i + 1)} className="p-1 hover:scale-110 transition-transform">
                        <Star
                          className={`w-6 h-6 ${
                            i < editRating ? "text-yellow-500 fill-yellow-500" : "text-muted"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Commentaire</label>
                  <Textarea value={editComment} onChange={(e) => setEditComment(e.target.value)} className="min-h-[100px]" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowEditModal(false)}>
                    Annuler
                  </Button>
                  <Button className="flex-1" onClick={handleUpdateAvis}>
                    Mettre à jour
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
