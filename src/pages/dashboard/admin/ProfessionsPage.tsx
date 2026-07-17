import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { professionsApi, adminProfessionsApi } from "@/lib/api";
import { unwrapPaginated } from "@/lib/api-utils";
import { toast } from "sonner";
import { FormDrawer } from "@/components/ui/FormDrawer";
import { SlideToConfirm } from "@/components/ui/SlideToConfirm";

interface Profession {
  id: string;
  nom: string;
  description: string | null;
  actif: boolean;
  created_at: string;
}

export default function ProfessionsPage() {
  const { user } = useAuth();
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProfession, setEditingProfession] = useState<Profession | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Profession | null>(null);
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfessions();
    }
  }, [user]);

  const fetchProfessions = async () => {
    try {
      setLoading(true);
      const data = unwrapPaginated<Profession>(await professionsApi.getAll());
      setProfessions(data || []);
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des professions");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.nom.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    try {
      await adminProfessionsApi.create({
        nom: formData.nom.trim(),
        description: formData.description.trim() || null,
        actif: true,
      });

      toast.success("Profession ajoutée");
      setShowAddModal(false);
      setFormData({ nom: "", description: "" });
      fetchProfessions();
    } catch (error: unknown) {
      console.error("Erreur:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'ajout");
      throw error;
    }
  };

  const handleUpdate = async () => {
    if (!editingProfession || !formData.nom.trim()) return;

    try {
      await adminProfessionsApi.update(String(editingProfession.id), {
        nom: formData.nom.trim(),
        description: formData.description.trim() || null,
      });

      toast.success("Profession modifiée");
      setEditingProfession(null);
      setFormData({ nom: "", description: "" });
      fetchProfessions();
    } catch (error: unknown) {
      console.error("Erreur:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la modification");
      throw error;
    }
  };

  const handleToggleActif = async (profession: Profession) => {
    try {
      await adminProfessionsApi.update(String(profession.id), { actif: !profession.actif });

      toast.success(profession.actif ? "Profession désactivée" : "Profession activée");
      fetchProfessions();
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la modification");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminProfessionsApi.delete(id);
      toast.success("Profession supprimée");
      fetchProfessions();
      setDeleteTarget(null);
    } catch (error: unknown) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la suppression");
      throw error;
    }
  };

  const openEditModal = (profession: Profession) => {
    setEditingProfession(profession);
    setFormData({
      nom: profession.nom,
      description: profession.description || "",
    });
  };

  return (
    <DashboardLayout role="admin" userName="Admin" userRole="Administrateur">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Gestion des Professions</h1>
            <p className="text-muted-foreground">Gérez les professions disponibles pour les prestataires</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une profession
            </Button>
          </div>
        </div>

        {/* Liste des professions */}
        <Card>
          <CardHeader>
            <CardTitle>Professions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {professions.map((profession) => {
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
                        onClick={() => setDeleteTarget(profession)}
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

        <FormDrawer
          open={showAddModal}
          onOpenChange={(open) => {
            setShowAddModal(open);
            if (!open) setFormData({ nom: "", description: "" });
          }}
          title="Ajouter une profession"
        >
          <div className="space-y-4">
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
            <SlideToConfirm
              label="Créer cette profession"
              hint="Glisser pour ajouter"
              variant="success"
              disabled={!formData.nom.trim()}
              successMessage="Profession ajoutée"
              onConfirm={async () => {
                await handleAdd();
                setShowAddModal(false);
              }}
            />
          </div>
        </FormDrawer>

        <FormDrawer
          open={!!editingProfession}
          onOpenChange={(open) => {
            if (!open) {
              setEditingProfession(null);
              setFormData({ nom: "", description: "" });
            }
          }}
          title="Modifier la profession"
        >
          <div className="space-y-4">
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
            <SlideToConfirm
              label="Enregistrer les modifications"
              hint="Glisser pour modifier"
              variant="success"
              disabled={!formData.nom.trim()}
              successMessage="Profession modifiée"
              onConfirm={async () => {
                await handleUpdate();
                setEditingProfession(null);
              }}
            />
          </div>
        </FormDrawer>

        <FormDrawer
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          title="Supprimer la profession"
          description={deleteTarget ? `« ${deleteTarget.nom} » sera supprimée définitivement.` : undefined}
        >
          {deleteTarget && (
            <SlideToConfirm
              label="Confirmer la suppression de cette profession"
              hint="Glisser pour supprimer"
              variant="destructive"
              successMessage="Profession supprimée"
              onConfirm={() => handleDelete(deleteTarget.id)}
            />
          )}
        </FormDrawer>
      </div>
    </DashboardLayout>
  );
}
