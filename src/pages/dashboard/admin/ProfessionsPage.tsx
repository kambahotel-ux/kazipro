import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Check, X, Users, FileText, TrendingUp, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Profession {
  id: string;
  nom: string;
  description: string | null;
  actif: boolean;
  created_at: string;
}

interface ProfessionStats {
  profession: string;
  total_prestataires: number;
  prestataires_verifies: number;
  prestataires_en_attente: number;
  total_demandes: number;
}

export default function ProfessionsPage() {
  const { user } = useAuth();
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [stats, setStats] = useState<ProfessionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [editingProfession, setEditingProfession] = useState<Profession | null>(null);
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfessions();
      fetchStats();
    }
  }, [user]);

  const fetchProfessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("professions")
        .select("*")
        .order("nom");

      if (error) throw error;
      setProfessions(data || []);
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des professions");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Récupérer les stats des prestataires par profession
      const { data: prestatairesData, error: prestataireError } = await supabase
        .from("prestataires")
        .select("profession, verified");

      if (prestataireError) throw prestataireError;

      // Récupérer les stats des demandes par profession
      const { data: demandesData, error: demandesError } = await supabase
        .from("demandes")
        .select("profession");

      if (demandesError) {
        console.error("Erreur demandes:", demandesError);
      }

      // Calculer les statistiques
      const statsMap = new Map<string, ProfessionStats>();

      // Compter les prestataires
      prestatairesData?.forEach((p) => {
        if (!statsMap.has(p.profession)) {
          statsMap.set(p.profession, {
            profession: p.profession,
            total_prestataires: 0,
            prestataires_verifies: 0,
            prestataires_en_attente: 0,
            total_demandes: 0,
          });
        }
        const stat = statsMap.get(p.profession)!;
        stat.total_prestataires++;
        if (p.verified) {
          stat.prestataires_verifies++;
        } else {
          stat.prestataires_en_attente++;
        }
      });

      // Compter les demandes
      demandesData?.forEach((d) => {
        if (statsMap.has(d.profession)) {
          statsMap.get(d.profession)!.total_demandes++;
        }
      });

      setStats(Array.from(statsMap.values()));
    } catch (error: any) {
      console.error("Erreur stats:", error);
    }
  };

  const handleAdd = async () => {
    if (!formData.nom.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    try {
      const { error } = await supabase
        .from("professions")
        .insert({
          nom: formData.nom.trim(),
          description: formData.description.trim() || null,
          actif: true,
        });

      if (error) throw error;

      toast.success("Profession ajoutée");
      setShowAddModal(false);
      setFormData({ nom: "", description: "" });
      fetchProfessions();
      fetchStats();
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error(error.message || "Erreur lors de l'ajout");
    }
  };

  const handleUpdate = async () => {
    if (!editingProfession || !formData.nom.trim()) return;

    try {
      const { error } = await supabase
        .from("professions")
        .update({
          nom: formData.nom.trim(),
          description: formData.description.trim() || null,
        })
        .eq("id", editingProfession.id);

      if (error) throw error;

      toast.success("Profession modifiée");
      setEditingProfession(null);
      setFormData({ nom: "", description: "" });
      fetchProfessions();
      fetchStats();
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error(error.message || "Erreur lors de la modification");
    }
  };

  const handleToggleActif = async (profession: Profession) => {
    try {
      const { error } = await supabase
        .from("professions")
        .update({ actif: !profession.actif })
        .eq("id", profession.id);

      if (error) throw error;

      toast.success(profession.actif ? "Profession désactivée" : "Profession activée");
      fetchProfessions();
      fetchStats();
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la modification");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette profession?")) return;

    try {
      const { error } = await supabase
        .from("professions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Profession supprimée");
      fetchProfessions();
      fetchStats();
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const openEditModal = (profession: Profession) => {
    setEditingProfession(profession);
    setFormData({
      nom: profession.nom,
      description: profession.description || "",
    });
  };

  const getStatsForProfession = (professionNom: string) => {
    return stats.find(s => s.profession === professionNom) || {
      profession: professionNom,
      total_prestataires: 0,
      prestataires_verifies: 0,
      prestataires_en_attente: 0,
      total_demandes: 0,
    };
  };

  const totalPrestataires = stats.reduce((sum, s) => sum + s.total_prestataires, 0);
  const totalDemandes = stats.reduce((sum, s) => sum + s.total_demandes, 0);

  return (
    <DashboardLayout role="admin" userName="Admin" userRole="Administrateur">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Gestion des Professions</h1>
            <p className="text-muted-foreground">Gérez les professions disponibles pour les prestataires</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowStatsModal(true)}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Statistiques détaillées
            </Button>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une profession
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold">{professions.length}</p>
                <p className="text-sm text-muted-foreground">Total professions</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {professions.filter(p => p.actif).length}
                </p>
                <p className="text-sm text-muted-foreground">Actives</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {totalPrestataires}
                </p>
                <p className="text-sm text-muted-foreground">Total prestataires</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {totalDemandes}
                </p>
                <p className="text-sm text-muted-foreground">Total demandes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des professions */}
        <Card>
          <CardHeader>
            <CardTitle>Professions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {professions.map((profession) => {
                const profStats = getStatsForProfession(profession.nom);
                return (
                  <div
                    key={profession.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{profession.nom}</h3>
                        <Badge variant={profession.actif ? "default" : "secondary"}>
                          {profession.actif ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                      {profession.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {profession.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{profStats.total_prestataires} prestataires</span>
                          <span className="text-green-600">({profStats.prestataires_verifies} vérifiés)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          <span>{profStats.total_demandes} demandes</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActif(profession)}
                      >
                        {profession.actif ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(profession)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(profession.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Modal Ajouter */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Ajouter une profession</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="Ex: Électricien"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Installation et réparation électrique"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowAddModal(false);
                      setFormData({ nom: "", description: "" });
                    }}
                  >
                    Annuler
                  </Button>
                  <Button className="flex-1" onClick={handleAdd}>
                    Ajouter
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal Modifier */}
        {editingProfession && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Modifier la profession</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-nom">Nom *</Label>
                  <Input
                    id="edit-nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setEditingProfession(null);
                      setFormData({ nom: "", description: "" });
                    }}
                  >
                    Annuler
                  </Button>
                  <Button className="flex-1" onClick={handleUpdate}>
                    Modifier
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal Statistiques Détaillées */}
        {showStatsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Statistiques Détaillées par Profession</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Stats globales */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-blue-50 dark:bg-blue-950">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <Users className="w-8 h-8 text-blue-600" />
                          <div>
                            <p className="text-2xl font-bold">{totalPrestataires}</p>
                            <p className="text-sm text-muted-foreground">Total prestataires</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-purple-50 dark:bg-purple-950">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <FileText className="w-8 h-8 text-purple-600" />
                          <div>
                            <p className="text-2xl font-bold">{totalDemandes}</p>
                            <p className="text-sm text-muted-foreground">Total demandes</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-green-50 dark:bg-green-950">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="w-8 h-8 text-green-600" />
                          <div>
                            <p className="text-2xl font-bold">{professions.filter(p => p.actif).length}</p>
                            <p className="text-sm text-muted-foreground">Professions actives</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Tableau détaillé */}
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3 font-medium">Profession</th>
                          <th className="text-center p-3 font-medium">Prestataires</th>
                          <th className="text-center p-3 font-medium">Vérifiés</th>
                          <th className="text-center p-3 font-medium">En attente</th>
                          <th className="text-center p-3 font-medium">Demandes</th>
                          <th className="text-center p-3 font-medium">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {professions
                          .sort((a, b) => {
                            const statsA = getStatsForProfession(a.nom);
                            const statsB = getStatsForProfession(b.nom);
                            return statsB.total_prestataires - statsA.total_prestataires;
                          })
                          .map((profession) => {
                            const profStats = getStatsForProfession(profession.nom);
                            return (
                              <tr key={profession.id} className="border-t border-border hover:bg-muted/50">
                                <td className="p-3">
                                  <div>
                                    <p className="font-medium">{profession.nom}</p>
                                    {profession.description && (
                                      <p className="text-xs text-muted-foreground">{profession.description}</p>
                                    )}
                                  </div>
                                </td>
                                <td className="text-center p-3">
                                  <Badge variant="outline">{profStats.total_prestataires}</Badge>
                                </td>
                                <td className="text-center p-3">
                                  <Badge className="bg-green-600">{profStats.prestataires_verifies}</Badge>
                                </td>
                                <td className="text-center p-3">
                                  <Badge variant="secondary">{profStats.prestataires_en_attente}</Badge>
                                </td>
                                <td className="text-center p-3">
                                  <Badge className="bg-purple-600">{profStats.total_demandes}</Badge>
                                </td>
                                <td className="text-center p-3">
                                  <Badge variant={profession.actif ? "default" : "secondary"}>
                                    {profession.actif ? "Actif" : "Inactif"}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {/* Professions sans prestataires */}
                  {professions.filter(p => getStatsForProfession(p.nom).total_prestataires === 0).length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
                        ⚠️ Professions sans prestataires:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {professions
                          .filter(p => getStatsForProfession(p.nom).total_prestataires === 0)
                          .map(p => (
                            <Badge key={p.id} variant="outline">{p.nom}</Badge>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-6">
                  <Button onClick={() => setShowStatsModal(false)}>
                    Fermer
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
