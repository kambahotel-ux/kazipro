import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { prestataireIdFromUser, getProfil } from '@/lib/kazipro-profile';
import { fraisDeplacementApi } from '@/lib/api';
import { PrestatairePageShell } from '@/components/prestataire/PrestatairePageShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Car, MapPin, Plus, Trash2, Info, Loader2 } from 'lucide-react';
import { AdminListSkeleton, PageHeaderSkeleton } from '@/components/dashboard/AdminLoadingSkeleton';
import { PrestataireEmptyState } from '@/components/prestataire/PrestataireEmptyState';

interface FraisRow {
  id: string | number;
  ville_origine: string;
  ville_destination: string;
  montant: number;
  unite?: string;
  actif?: boolean;
}

const emptyForm = {
  ville_origine: 'Kinshasa',
  ville_destination: '',
  montant: 0,
  unite: 'forfait',
};

export default function FraisDeplacementPage({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuth();
  const prestataireId = prestataireIdFromUser(user);
  const villeBase = String(getProfil(user)?.ville ?? 'Kinshasa');

  const [rows, setRows] = useState<FraisRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm, ville_origine: villeBase });

  const fetchRows = useCallback(async () => {
    if (!prestataireId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await fraisDeplacementApi.get(prestataireId);
      const list = Array.isArray(data) ? data : data?.data ?? [];
      setRows(list as FraisRow[]);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [prestataireId]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleAdd = async () => {
    if (!prestataireId) return;
    if (!form.ville_destination.trim() || form.montant <= 0) {
      toast.error('Renseignez la destination et un montant > 0');
      return;
    }
    try {
      setSaving(true);
      await fraisDeplacementApi.save(prestataireId, {
        ville_origine: form.ville_origine.trim(),
        ville_destination: form.ville_destination.trim(),
        montant: form.montant,
        unite: form.unite,
      });
      toast.success('Tarif ajouté');
      setForm({ ...emptyForm, ville_origine: villeBase });
      await fetchRows();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Supprimer ce tarif de déplacement ?')) return;
    try {
      await fraisDeplacementApi.delete(id);
      toast.success('Tarif supprimé');
      await fetchRows();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    }
  };

  if (loading) {
    return (
      <PrestatairePageShell embedded={embedded} userName={user?.email || ''} userRole="Prestataire">
        <div className="container mx-auto max-w-3xl space-y-6 p-4 md:p-6">
          <PageHeaderSkeleton />
          <AdminListSkeleton items={3} />
        </div>
      </PrestatairePageShell>
    );
  }

  return (
    <PrestatairePageShell embedded={embedded} userName={user?.email || ''} userRole="Prestataire">
      <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Car className="w-7 h-7" />
            Frais de déplacement
          </h1>
          <p className="text-muted-foreground mt-1">
            Tarifs forfaitaires par trajet (ville de départ → destination).
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Définissez un montant pour chaque destination depuis votre ville d&apos;origine.
            Ces tarifs peuvent être repris dans vos devis (ligne transport).
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ajouter un tarif</CardTitle>
            <CardDescription>Ex. Kinshasa → Gombe : 15 000 FC</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ville d&apos;origine</Label>
                <Input
                  value={form.ville_origine}
                  onChange={(e) => setForm({ ...form, ville_origine: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ville / quartier destination</Label>
                <Input
                  placeholder="Gombe, Limete…"
                  value={form.ville_destination}
                  onChange={(e) => setForm({ ...form, ville_destination: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Montant (FC)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.montant || ''}
                  onChange={(e) => setForm({ ...form, montant: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Unité</Label>
                <Select value={form.unite} onValueChange={(v) => setForm({ ...form, unite: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="forfait">Forfait</SelectItem>
                    <SelectItem value="par_km">Par km</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Ajouter
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Mes tarifs ({rows.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <PrestataireEmptyState context="frais" hasActiveFilters={false} />
            ) : (
              <div className="space-y-2">
                {rows.map((row) => (
                  <div
                    key={String(row.id)}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {row.ville_origine} → {row.ville_destination}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Number(row.montant).toLocaleString('fr-FR')} FC
                        {row.unite === 'par_km' ? ' / km' : ' (forfait)'}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(row.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PrestatairePageShell>
  );
}
