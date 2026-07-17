import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DevisDetailCard } from '@/components/client/DevisDetailCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { devisApi, contratsApi } from '@/lib/api';
import { getClientDisplayName, mapDevisToUi, unwrapPaginated } from '@/lib/client-helpers';
import { toast } from 'sonner';
import { DetailPageSkeleton } from '@/components/dashboard/AdminLoadingSkeleton';
import {
  FileSignature,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Shield,
} from 'lucide-react';

/** Contenu carte + métadonnées pour mise à jour / affichage */
interface LoadedDevis {
  demande_id: string | null;
  prestataires: { full_name?: string; profession?: string; email?: string } | undefined;
  detail: {
    numero: string;
    montant_ht: number;
    montant_tva: number;
    montant_ttc: number;
    taux_tva: number;
    statut: string;
    validite_jours: number;
    created_at: string;
    items?: Array<{
      description: string;
      quantite: number;
      prix_unitaire: number;
      montant: number;
    }>;
    notes?: string;
  };
}

export default function AccepterDevisPage() {
  const { devisId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const clientName = getClientDisplayName(user);

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [loaded, setLoaded] = useState<LoadedDevis | null>(null);
  const [contrat, setContrat] = useState<Record<string, unknown> | null>(null);
  const [montants, setMontants] = useState<Record<string, number> | null>(null);
  const [acceptConditions, setAcceptConditions] = useState(false);
  const [acceptPaiement, setAcceptPaiement] = useState(false);

  useEffect(() => {
    fetchDevis();
  }, [devisId]);

  const fetchDevis = async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!devisId) return;
    try {
      if (!silent) setLoading(true);

      const raw = await devisApi.getById(devisId);
      if (!raw) {
        if (!silent) {
          toast.error('Devis introuvable');
          navigate('/dashboard/client/demandes');
        }
        return;
      }

      const mapped = mapDevisToUi(raw as Record<string, unknown>);
      const rawStatut = String(mapped.statut ?? 'envoye');
      const statutUi =
        rawStatut === 'accepted' || rawStatut === 'accepte'
          ? 'accepte'
          : rawStatut;

      const detail: LoadedDevis['detail'] = {
        numero: String(mapped.numero ?? '—'),
        montant_ht: Number(mapped.montant_ht ?? 0),
        montant_tva: Number(mapped.montant_tva ?? 0),
        montant_ttc: Number(mapped.montant_ttc ?? 0),
        taux_tva: Number(mapped.taux_tva ?? 16),
        statut: statutUi,
        validite_jours: Number(mapped.validite_jours ?? 30),
        created_at: String(mapped.created_at ?? new Date().toISOString()),
        items: (mapped.items ?? []).map((it) => ({
          description: String(it.designation ?? it.description ?? '—'),
          quantite: Number(it.quantite ?? 1),
          prix_unitaire: Number(it.prix_unitaire ?? 0),
          montant: Number(it.montant ?? 0),
        })),
        notes: typeof mapped.notes === 'string' ? mapped.notes : undefined,
      };

      const demandeId =
        mapped.demande_id != null ? String(mapped.demande_id) : null;

      setLoaded({
        demande_id: demandeId,
        prestataires: mapped.prestataires as LoadedDevis['prestataires'],
        detail,
      });

      if (statutUi === 'accepte') {
        let contratData = (raw as { contrat?: Record<string, unknown> }).contrat ?? null;
        if (!contratData) {
          const all = unwrapPaginated(await contratsApi.getAll({ per_page: 100 }));
          contratData =
            all.find((c) => String((c as { devis_id?: unknown }).devis_id) === devisId) ??
            null;
        }
        setContrat(contratData as Record<string, unknown> | null);
      } else {
        setContrat(null);
      }

      const montantTTC = detail.montant_ttc || 0;
      const contratRow = (raw as { contrat?: { acompte_montant?: number; solde_montant?: number } })
        .contrat;
      const montantAcompte =
        contratRow?.acompte_montant != null
          ? Number(contratRow.acompte_montant)
          : (montantTTC * 30) / 100;
      const montantSolde =
        contratRow?.solde_montant != null
          ? Number(contratRow.solde_montant)
          : montantTTC - montantAcompte;
      const pourcentageAcompte =
        montantTTC > 0 ? Math.round((montantAcompte / montantTTC) * 100) : 30;
      const pourcentageSolde = 100 - pourcentageAcompte;

      setMontants({
        montant_travaux_ht: detail.montant_ht,
        montant_materiel_ht: 0,
        frais_deplacement: 0,
        commission_totale: 0,
        montant_acompte: montantAcompte,
        montant_solde: montantSolde,
        pourcentage_acompte: pourcentageAcompte,
        pourcentage_solde: pourcentageSolde,
      });
    } catch (error: unknown) {
      console.error('Erreur:', error);
      if (!silent) {
        toast.error('Erreur lors du chargement du devis');
        setLoaded(null);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!loaded || !devisId) return;
    if (!acceptConditions || !acceptPaiement) {
      toast.error('Veuillez accepter les conditions');
      return;
    }

    try {
      setAccepting(true);
      await devisApi.accepter(devisId);
      await fetchDevis({ silent: true });
      toast.success(
        'Devis accepté avec succès! Cliquez sur "Voir le contrat" pour continuer.',
      );
    } catch (error: unknown) {
      console.error('Erreur:', error);
      toast.error("Erreur lors de l'acceptation du devis");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="client" userName={clientName} userRole="Client">
        <DetailPageSkeleton />
      </DashboardLayout>
    );
  }

  if (!loaded) {
    return (
      <DashboardLayout role="client" userName={clientName} userRole="Client">
        <div className="p-3 md:p-6">
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <AlertDescription className="text-sm">Devis introuvable</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  const statutCourant = loaded.detail.statut;

  return (
    <DashboardLayout role="client" userName={clientName} userRole="Client">
      <div className="container mx-auto p-3 md:p-6 space-y-4 md:space-y-6 max-w-4xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="w-fit"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-3xl font-bold truncate">Accepter le devis</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1 truncate">
              Prestataire: {loaded.prestataires?.full_name ?? '—'}
            </p>
          </div>
        </div>

        <DevisDetailCard devis={loaded.detail} montants={montants} paiementViaKazipro={true} />

        {statutCourant === 'accepte' && (
          <Alert className="bg-blue-50 border-blue-200">
            <CheckCircle2 className="w-4 h-4 md:w-5 md:w-5 text-blue-600 shrink-0" />
            <AlertDescription className="text-blue-900 text-sm">
              <strong>Devis déjà accepté</strong>
              <br />
              Ce devis a été accepté.
              {contrat
                ? ' Le contrat a été généré et est prêt à être signé.'
                : ' Le contrat est en cours de génération.'}
            </AlertDescription>
          </Alert>
        )}

        {statutCourant === 'accepte' && contrat && (
          <Card className="border-green-500 bg-green-50">
            <CardContent className="pt-4 md:pt-6">
              <div className="flex flex-col gap-3 md:gap-4">
                <div>
                  <h3 className="font-semibold text-base md:text-lg">Contrat prêt à signer</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Contrat N° {String(contrat.numero ?? '—')} - Statut:{' '}
                    {contrat.statut === 'en_attente' ? 'En attente de signature' : String(contrat.statut ?? '')}
                  </p>
                </div>
                <Button
                  onClick={() =>
                    navigate(
                      `/dashboard/client/contrat/${devisId}`,
                    )}
                  size="sm"
                  className="w-full"
                >
                  <FileSignature className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                  <span className="text-xs md:text-sm">Voir le contrat et signer</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {statutCourant !== 'accepte' && (
          <Card className="border-primary">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <FileSignature className="w-4 h-4 md:w-5 md:h-5" />
                Acceptation du devis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="conditions"
                  checked={acceptConditions}
                  onCheckedChange={(checked) => setAcceptConditions(checked as boolean)}
                  className="shrink-0 mt-1"
                />
                <div className="space-y-1 flex-1 min-w-0">
                  <Label
                    htmlFor="conditions"
                    className="text-xs md:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    J'accepte les conditions générales
                  </Label>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    J'ai lu et j'accepte les conditions générales de prestation de services
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="paiement"
                  checked={acceptPaiement}
                  onCheckedChange={(checked) => setAcceptPaiement(checked as boolean)}
                  className="shrink-0 mt-1"
                />
                <div className="space-y-1 flex-1 min-w-0">
                  <Label
                    htmlFor="paiement"
                    className="text-xs md:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    J'accepte les conditions de paiement
                  </Label>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Je m'engage à payer l'acompte de {montants?.montant_acompte?.toLocaleString()}{' '}
                    FC avant le début des travaux, et le solde de{' '}
                    {montants?.montant_solde?.toLocaleString()} FC après validation des travaux
                  </p>
                </div>
              </div>

              <Alert className="bg-green-50 border-green-200">
                <Shield className="w-4 h-4 md:w-5 md:h-5 text-green-600 shrink-0" />
                <AlertDescription className="text-green-900 text-xs md:text-sm">
                  <strong>Votre paiement est protégé</strong>
                  <br />
                  L'acompte est bloqué jusqu'au début des travaux. Le solde n'est versé au prestataire
                  qu'après votre validation. En cas de litige, KaziPro intervient pour vous protéger.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col gap-3 md:gap-4">
                <Button
                  onClick={handleAccept}
                  disabled={!acceptConditions || !acceptPaiement || accepting}
                  size="sm"
                  className="w-full"
                >
                  {accepting ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:h-4 border-b-2 border-white mr-2" />
                      <span className="text-xs md:text-sm">Traitement...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                      <span className="text-xs md:text-sm">Accepter et continuer</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(-1)}
                  disabled={accepting}
                  className="w-full"
                >
                  <span className="text-xs md:text-sm">Annuler</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
