import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, ArrowLeft, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { adminMaterielCategoriesApi, materielCategoriesApi } from "@/lib/api";
import { toast } from "sonner";
import { FormDrawer } from "@/components/ui/FormDrawer";
import { SlideToConfirm } from "@/components/ui/SlideToConfirm";

interface MaterielCategorie {
  id: string;
  nom: string;
  slug: string;
  icone?: string;
  ordre: number;
  caution_pct_min: number;
  caution_pct_max: number;
  caution_pct_defaut: number;
}

const defaultForm = {
  nom: "",
  icone: "package",
  ordre: "",
  caution_pct_min: "20",
  caution_pct_max: "80",
  caution_pct_defaut: "30",
};

function mapCategorie(raw: Record<string, unknown>): MaterielCategorie {
  return {
    id: String(raw.id),
    nom: String(raw.nom ?? ""),
    slug: String(raw.slug ?? ""),
    icone: raw.icone != null ? String(raw.icone) : undefined,
    ordre: Number(raw.ordre ?? 0),
    caution_pct_min: Number(raw.caution_pct_min ?? 20),
    caution_pct_max: Number(raw.caution_pct_max ?? 80),
    caution_pct_defaut: Number(raw.caution_pct_defaut ?? 30),
  };
}

export default function MaterielCategoriesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<MaterielCategorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editing, setEditing] = useState<MaterielCategorie | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MaterielCategorie | null>(null);
  const [formData, setFormData] = useState(defaultForm);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await materielCategoriesApi.getAll();
      const list = Array.isArray(data) ? data : [];
      setCategories(
        list
          .filter((item): item is Record<string, unknown> => item != null && typeof item === "object")
          .map(mapCategorie)
          .sort((a, b) => a.ordre - b.ordre || a.nom.localeCompare(b.nom)),
      );
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des catégories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchCategories();
  }, [user]);

  const buildPayload = () => ({
    nom: formData.nom.trim(),
    icone: formData.icone.trim() || "package",
    ordre: formData.ordre.trim() ? Number(formData.ordre) : undefined,
    caution_pct_min: Number(formData.caution_pct_min),
    caution_pct_max: Number(formData.caution_pct_max),
    caution_pct_defaut: Number(formData.caution_pct_defaut),
  });

  const handleAdd = async () => {
    if (!formData.nom.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    await adminMaterielCategoriesApi.create(buildPayload());
    toast.success("Catégorie ajoutée");
    setShowAddModal(false);
    setFormData(defaultForm);
    await fetchCategories();
  };

  const handleUpdate = async () => {
    if (!editing || !formData.nom.trim()) return;
    await adminMaterielCategoriesApi.update(editing.id, buildPayload());
    toast.success("Catégorie modifiée");
    setEditing(null);
    setFormData(defaultForm);
    await fetchCategories();
  };

  const handleDelete = async (id: string) => {
    await adminMaterielCategoriesApi.delete(id);
    toast.success("Catégorie supprimée");
    setDeleteTarget(null);
    await fetchCategories();
  };

  const openEdit = (cat: MaterielCategorie) => {
    setEditing(cat);
    setFormData({
      nom: cat.nom,
      icone: cat.icone ?? "package",
      ordre: String(cat.ordre),
      caution_pct_min: String(cat.caution_pct_min),
      caution_pct_max: String(cat.caution_pct_max),
      caution_pct_defaut: String(cat.caution_pct_defaut),
    });
  };

  const formFields = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nom">Nom *</Label>
        <Input
          id="nom"
          value={formData.nom}
          onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
          placeholder="Ex. Outillage électroportatif"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="icone">Icône</Label>
          <Input
            id="icone"
            value={formData.icone}
            onChange={(e) => setFormData({ ...formData, icone: e.target.value })}
            placeholder="drill, package…"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ordre">Ordre</Label>
          <Input
            id="ordre"
            type="number"
            min={0}
            value={formData.ordre}
            onChange={(e) => setFormData({ ...formData, ordre: e.target.value })}
            placeholder="Auto"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label>Caution % min</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={formData.caution_pct_min}
            onChange={(e) => setFormData({ ...formData, caution_pct_min: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Caution % défaut</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={formData.caution_pct_defaut}
            onChange={(e) => setFormData({ ...formData, caution_pct_defaut: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Caution % max</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={formData.caution_pct_max}
            onChange={(e) => setFormData({ ...formData, caution_pct_max: e.target.value })}
          />
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout role="admin" userName="Admin" userRole="Administrateur">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
              <Link to="/dashboard/admin/location">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Retour Location
              </Link>
            </Button>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Package className="w-6 h-6" />
              Catégories matériel
            </h1>
            <p className="text-muted-foreground">
              Gérez les catégories proposées aux loueurs lors de la création d&apos;annonce
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une catégorie
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste ({categories.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Chargement…</p>
            ) : categories.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucune catégorie. Ajoutez-en une pour le mobile.</p>
            ) : (
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{cat.nom}</p>
                      <p className="text-xs text-muted-foreground">
                        slug: {cat.slug} · ordre {cat.ordre} · caution {cat.caution_pct_min}–
                        {cat.caution_pct_max}% (déf. {cat.caution_pct_defaut}%)
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => openEdit(cat)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(cat)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <FormDrawer
          open={showAddModal}
          onOpenChange={(open) => {
            setShowAddModal(open);
            if (!open) setFormData(defaultForm);
          }}
          title="Ajouter une catégorie"
        >
          {formFields}
          <SlideToConfirm
            label="Créer la catégorie"
            hint="Glisser pour ajouter"
            variant="success"
            disabled={!formData.nom.trim()}
            successMessage="Catégorie ajoutée"
            onConfirm={async () => {
              await handleAdd();
              setShowAddModal(false);
            }}
          />
        </FormDrawer>

        <FormDrawer
          open={!!editing}
          onOpenChange={(open) => {
            if (!open) {
              setEditing(null);
              setFormData(defaultForm);
            }
          }}
          title="Modifier la catégorie"
        >
          {formFields}
          <SlideToConfirm
            label="Enregistrer"
            hint="Glisser pour modifier"
            variant="success"
            disabled={!formData.nom.trim()}
            successMessage="Catégorie modifiée"
            onConfirm={async () => {
              await handleUpdate();
              setEditing(null);
            }}
          />
        </FormDrawer>

        <FormDrawer
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          title="Supprimer la catégorie"
          description={deleteTarget ? `« ${deleteTarget.nom} » sera supprimée.` : undefined}
        >
          {deleteTarget && (
            <SlideToConfirm
              label="Confirmer la suppression"
              hint="Glisser pour supprimer"
              variant="destructive"
              successMessage="Catégorie supprimée"
              onConfirm={() => handleDelete(deleteTarget.id)}
            />
          )}
        </FormDrawer>
      </div>
    </DashboardLayout>
  );
}
