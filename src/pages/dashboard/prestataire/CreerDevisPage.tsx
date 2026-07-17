import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { devisApi, demandesApi, configPaiementApi } from '@/lib/api';
import { getProfil, professionLabelFromProfil } from '@/lib/kazipro-profile';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Send, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { DetailPageSkeleton } from '@/components/dashboard/AdminLoadingSkeleton';
import { useToast } from '@/hooks/use-toast';
import {
  computeAcompte,
  computeDevisTotals,
  createEmptyLigne,
  DEVIS_LIGNE_TYPES,
  DEVISE_OPTIONS,
  formatMontant,
  parseDecimalInput,
  type DevisDevise,
  ligneTotal,
  TYPE_LIGNE_LABEL,
  type DevisLigneForm,
  type DevisLigneType,
} from '@/lib/devis-form';
import { demandeAccepteNouveauDevis, demandeDevisFermeRaison } from '@/lib/demande-eligibility';

export default function CreerDevisPage() {
  const { demandeId } = useParams<{ demandeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [demande, setDemande] = useState<Record<string, unknown> | null>(null);
  const [prestataire, setPrestataire] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [description, setDescription] = useState('');
  const [devise, setDevise] = useState<DevisDevise>('CDF');
  const [lignes, setLignes] = useState<DevisLigneForm[]>([]);
  const [tva, setTva] = useState('16');
  const [dateDebut, setDateDebut] = useState('');
  const [dureeJours, setDureeJours] = useState('2');
  const [validiteJours, setValiditeJours] = useState('30');
  const [acompteActif, setAcompteActif] = useState(true);
  const [pourcentageAcompte, setPourcentageAcompte] = useState('30');

  useEffect(() => {
    loadData();
  }, [demandeId, user]);

  const loadData = async () => {
    if (!demandeId || !user) return;

    try {
      setLoading(true);
      setPrestataire(getProfil(user) as Record<string, unknown>);
      const demandeData = (await demandesApi.getById(String(demandeId))) as Record<string, unknown>;
      setDemande(demandeData);

      const titre = String(demandeData.title ?? demandeData.titre ?? 'cette demande');
      setDescription(
        `Proposition pour : ${titre}\n\n` +
          '• Diagnostic et réparation\n' +
          '• Fournitures si nécessaire (hors main d\'œuvre)\n'
      );

      try {
        const config = await configPaiementApi.get();
        const pct = config?.acompte_pourcentage_defaut;
        if (pct != null) setPourcentageAcompte(String(Math.round(Number(pct))));
      } catch {
        /* config optionnelle */
      }

      setLignes([
        createEmptyLigne('main_oeuvre'),
        createEmptyLigne('fourniture'),
      ]);
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les informations',
        variant: 'destructive',
      });
      navigate('/dashboard/prestataire/marche/opportunites');
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(
    () => computeDevisTotals(lignes, parseFloat(tva) || 0),
    [lignes, tva]
  );

  const acompte = useMemo(
    () =>
      computeAcompte(
        totals.mainOeuvreTtc,
        totals.montantTtc,
        parseFloat(pourcentageAcompte) || 0,
        acompteActif
      ),
    [totals, pourcentageAcompte, acompteActif]
  );

  const addLigne = (type: DevisLigneType) => {
    setLignes((prev) => [...prev, createEmptyLigne(type)]);
  };

  const removeLigne = (id: string) => {
    setLignes((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)));
  };

  const updateLigne = (id: string, patch: Partial<DevisLigneForm>) => {
    setLignes((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
  };

  const demandeTitre =
    demande != null ? String(demande.title ?? demande.titre ?? '') : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demande || !demandeId) return;

    const lignesValides = lignes.filter(
      (l) => l.designation.trim() && l.quantite > 0 && l.prix_unitaire > 0
    );

    if (lignesValides.length === 0) {
      toast({
        title: 'Lignes manquantes',
        description: 'Ajoutez au moins une ligne avec désignation, quantité et prix.',
        variant: 'destructive',
      });
      return;
    }

    if (acompteActif && totals.mainOeuvreHt <= 0) {
      toast({
        title: 'Main d\'œuvre requise',
        description:
          "L'acompte est calculé sur la main d'œuvre : ajoutez une ligne « Main d'œuvre ».",
        variant: 'destructive',
      });
      return;
    }

    if (!dateDebut) {
      toast({
        title: 'Date de début',
        description: 'Indiquez la date prévue de début des travaux.',
        variant: 'destructive',
      });
      return;
    }

    const duree = parseInt(dureeJours, 10);
    if (!duree || duree < 1) {
      toast({
        title: 'Durée invalide',
        description: 'La durée en jours doit être au moins 1.',
        variant: 'destructive',
      });
      return;
    }

    const validite = new Date();
    validite.setDate(validite.getDate() + parseInt(validiteJours, 10) || 30);

    try {
      setSubmitting(true);

      await devisApi.create({
        demande_id: Number(demandeId),
        description: description.trim() || null,
        tva: parseFloat(tva) || 0,
        acompte_pourcentage: acompteActif ? parseFloat(pourcentageAcompte) : 0,
        devise,
        date_debut: dateDebut,
        duree_jours: duree,
        validite: validite.toISOString().split('T')[0],
        items: lignesValides.map((l) => ({
          type_ligne: l.type_ligne,
          designation: l.designation.trim(),
          quantite: Math.round(l.quantite * 100) / 100,
          unite: l.unite || 'forfait',
          prix_unitaire: Math.round(l.prix_unitaire * 100) / 100,
        })),
      });

      toast({
        title: 'Devis envoyé',
        description: 'Le client peut maintenant consulter votre proposition.',
      });
      navigate('/dashboard/prestataire/marche/devis');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Impossible de soumettre le devis';
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="prestataire" userName="Prestataire" userRole="Prestataire">
        <DetailPageSkeleton />
      </DashboardLayout>
    );
  }

  if (!demande) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Demande introuvable</h2>
        <Button onClick={() => navigate('/dashboard/prestataire/marche/opportunites')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>
    );
  }

  const demandeStatut = String(demande.statut ?? demande.status ?? '');
  const devisFermeRaison = !demandeAccepteNouveauDevis(demandeStatut)
    ? demandeDevisFermeRaison(demandeStatut)
    : null;

  if (devisFermeRaison) {
    return (
      <DashboardLayout
        role="prestataire"
        userName={String(prestataire?.full_name ?? 'Prestataire')}
        userRole={professionLabelFromProfil(prestataire) || 'Prestataire'}
      >
        <div className="mx-auto flex max-w-lg flex-col items-center py-16 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-amber-600" />
          <h2 className="mb-2 text-xl font-bold">Devis fermé</h2>
          <p className="mb-6 text-muted-foreground">{devisFermeRaison}</p>
          <Button onClick={() => navigate(`/dashboard/prestataire/demandes/${demandeId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l&apos;opportunité
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="prestataire"
      userName={String(prestataire?.full_name ?? 'Prestataire')}
      userRole={professionLabelFromProfil(prestataire) || 'Prestataire'}
    >
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto pb-24">
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-2 h-8 px-2"
              onClick={() => navigate(`/dashboard/prestataire/demandes/${demandeId}`)}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Retour
            </Button>
            <h1 className="text-xl font-semibold tracking-tight">Créer un devis</h1>
            <p className="text-sm text-muted-foreground">{demandeTitre}</p>
          </div>
        </header>

        <div className="space-y-4">
          {/* Description + planning */}
          <section className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Description & planning</h2>
              <div className="flex items-center gap-2">
                <Label htmlFor="devise" className="text-xs whitespace-nowrap">
                  Devise
                </Label>
                <Select value={devise} onValueChange={(v) => setDevise(v as DevisDevise)}>
                  <SelectTrigger id="devise" className="h-9 w-[180px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVISE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs">
                Description des travaux
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="resize-y min-h-[88px] text-sm"
                placeholder="Détaillez votre intervention…"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="dateDebut" className="text-xs">
                  Date de début *
                </Label>
                <Input
                  id="dateDebut"
                  type="date"
                  required
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="duree" className="text-xs">
                  Durée (jours) *
                </Label>
                <Input
                  id="duree"
                  type="number"
                  min={1}
                  required
                  value={dureeJours}
                  onChange={(e) => setDureeJours(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="validite" className="text-xs">
                  Validité (jours)
                </Label>
                <Input
                  id="validite"
                  type="number"
                  min={1}
                  value={validiteJours}
                  onChange={(e) => setValiditeJours(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          </section>

          {/* Lignes du devis */}
          <section className="rounded-lg border bg-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 bg-muted/40">
              <div>
                <h2 className="text-sm font-semibold">Lignes du devis</h2>
                <p className="text-xs text-muted-foreground">
                  Ventilation obligatoire (main d&apos;œuvre, fournitures, transport…)
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {(['main_oeuvre', 'fourniture', 'transport'] as const).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => addLigne(type)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {TYPE_LIGNE_LABEL[type].split(' /')[0]}
                  </Button>
                ))}
              </div>
            </div>

            <div className="divide-y">
              {lignes.map((ligne, index) => (
                <div key={ligne.id} className="px-3 py-2.5 sm:px-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Ligne {index + 1}
                    </span>
                    {lignes.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeLigne(ligne.id)}
                        aria-label="Supprimer la ligne"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-12 sm:items-end">
                    <div className="sm:col-span-3 space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={ligne.type_ligne}
                        onValueChange={(v) =>
                          updateLigne(ligne.id, { type_ligne: v as DevisLigneType })
                        }
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DEVIS_LIGNE_TYPES.map((t) => (
                            <SelectItem key={t} value={t} className="text-xs">
                              {TYPE_LIGNE_LABEL[t]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-4 space-y-1">
                      <Label className="text-xs">Désignation</Label>
                      <Input
                        className="h-9 text-sm"
                        value={ligne.designation}
                        onChange={(e) =>
                          updateLigne(ligne.id, { designation: e.target.value })
                        }
                        placeholder={
                          ligne.type_ligne === 'main_oeuvre'
                            ? "Ex. Main d'œuvre réparation"
                            : 'Ex. Mastique, joints…'
                        }
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:col-span-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Qté</Label>
                        <Input
                          type="number"
                          min={0.01}
                          step={0.01}
                          className="h-9"
                          value={ligne.quantite}
                          onChange={(e) =>
                            updateLigne(ligne.id, {
                              quantite: Math.max(0.01, parseDecimalInput(e.target.value, 0.01)),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <Label className="text-xs">Prix unit. ({devise})</Label>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          className="h-9"
                          value={ligne.prix_unitaire || ''}
                          onChange={(e) =>
                            updateLigne(ligne.id, {
                              prix_unitaire: Math.max(0, parseDecimalInput(e.target.value, 0)),
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-1 text-right text-xs font-medium tabular-nums pt-1 sm:pt-0">
                      {formatMontant(ligneTotal(ligne), devise)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Récap + acompte */}
          <section className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5 w-24">
                <Label htmlFor="tva" className="text-xs">
                  TVA (%)
                </Label>
                <Input
                  id="tva"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  className="h-9"
                  value={tva}
                  onChange={(e) => setTva(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-md bg-muted/50 px-3 py-2 text-sm space-y-1">
              {totals.mainOeuvreHt > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Main d&apos;œuvre HT</span>
                  <span>{formatMontant(totals.mainOeuvreHt, devise)}</span>
                </div>
              )}
              {totals.fournitureHt > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Fournitures HT</span>
                  <span>{formatMontant(totals.fournitureHt, devise)}</span>
                </div>
              )}
              {totals.transportHt > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Transport HT</span>
                  <span>{formatMontant(totals.transportHt, devise)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total HT</span>
                <span>{formatMontant(totals.montantHt, devise)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">TVA</span>
                <span>{formatMontant(totals.montantTva, devise)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-1 border-t border-border/60">
                <span>Total TTC</span>
                <span className="text-primary">{formatMontant(totals.montantTtc, devise)}</span>
              </div>
            </div>

            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Acompte</p>
                  <p className="text-xs text-muted-foreground">
                    {pourcentageAcompte}% de la main d&apos;œuvre TTC uniquement
                  </p>
                </div>
                <Switch checked={acompteActif} onCheckedChange={setAcompteActif} />
              </div>
              {acompteActif && (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Select value={pourcentageAcompte} onValueChange={setPourcentageAcompte}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="%" />
                    </SelectTrigger>
                    <SelectContent>
                      {['20', '30', '40', '50'].map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="rounded-md border border-amber-200/80 bg-amber-50/80 dark:bg-amber-950/30 px-3 py-2 text-xs space-y-0.5">
                    <div className="flex justify-between">
                      <span>Acompte ({pourcentageAcompte}% MO)</span>
                      <span className="font-semibold tabular-nums">
                        {formatMontant(acompte.montantAcompte, devise)}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Solde (reste du devis)</span>
                      <span className="font-medium tabular-nums">
                        {formatMontant(acompte.montantSolde, devise)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:left-[var(--sidebar-width,16rem)]">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 px-4 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate(`/dashboard/prestataire/demandes/${demandeId}`)}
            >
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              <Send className="mr-2 h-4 w-4" />
              {submitting ? 'Envoi…' : 'Soumettre le devis'}
            </Button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
