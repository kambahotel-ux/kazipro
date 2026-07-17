import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { paiementsApi, contratsApi } from '@/lib/api';
import {
  getClientDisplayName,
  mapMissionToUi,
  mapPaiementToUi,
} from '@/lib/client-helpers';
import {
  PAYMENTS_SIMULATION_ENABLED,
  finalizePaiementSimulation,
  formatPaiementStatut,
  validerPaiementAdmin,
} from '@/lib/payments';
import { generateReceiptPDF } from '@/lib/pdf-generator';
import { toast } from 'sonner';
import { DetailPageSkeleton } from '@/components/dashboard/AdminLoadingSkeleton';
import { SlideToConfirm } from '@/components/ui/SlideToConfirm';
import { 
  CheckCircle2, 
  Download,
  Home,
  FileText,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function PaiementConfirmationPage() {
  const { paiementId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const clientName = getClientDisplayName(user);
  const isAdmin = user?.role === 'admin';
  
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [paiement, setPaiement] = useState<Record<string, unknown> | null>(null);
  const [contrat, setContrat] = useState<Record<string, unknown> | null>(null);
  const [mission, setMission] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetchPaiement();
  }, [paiementId]);

  const fetchPaiement = async () => {
    try {
      setLoading(true);
      
      const rawPaiement = await paiementsApi.getById(String(paiementId));
      let paiementCourant = mapPaiementToUi(rawPaiement as Record<string, unknown>);

      const st = String(paiementCourant.statut ?? '');
      if (
        PAYMENTS_SIMULATION_ENABLED &&
        ['en_cours', 'en_attente', 'echoue'].includes(st)
      ) {
        try {
          await finalizePaiementSimulation(String(paiementId));
          const refreshed = await paiementsApi.getById(String(paiementId));
          paiementCourant = mapPaiementToUi(refreshed as Record<string, unknown>);
        } catch (recoveryErr) {
          console.warn('Recovery simulation:', recoveryErr);
        }
      }

      setPaiement(paiementCourant as Record<string, unknown>);

      if (paiementCourant.contrat_id) {
        const contratData = await contratsApi.getById(String(paiementCourant.contrat_id));
        setContrat(contratData as Record<string, unknown>);

        const missionRaw = (contratData as { mission?: Record<string, unknown> }).mission;
        if (missionRaw) {
          setMission(mapMissionToUi(missionRaw) as Record<string, unknown>);
        }
      }

    } catch (error: unknown) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeSimulation = async () => {
    if (!paiementId) return;
    try {
      setFinalizing(true);
      if (isAdmin) {
        await validerPaiementAdmin(paiementId);
        toast.success('Paiement validé par l\'administrateur');
      } else {
        const result = await finalizePaiementSimulation(paiementId);
        if (result.ok) {
          toast.success('Paiement validé avec succès');
        } else {
          toast.info(
            'En attente de validation admin. Connectez-vous en admin ou demandez la validation depuis Transactions.',
          );
        }
      }
      await fetchPaiement();
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Finalisation impossible';
      toast.error(message);
      throw error;
    } finally {
      setFinalizing(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!paiement) return;
    try {
      const prest = paiement.prestataires as { full_name?: string; profession?: string } | undefined;
      generateReceiptPDF({
        numero: String(paiement.numero ?? ''),
        date: new Date(String(paiement.date_paiement ?? paiement.created_at)).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        }),
        statut: String(paiement.statut ?? ''),
        methode_paiement: String(paiement.methode_paiement ?? ''),
        type_paiement: String(paiement.type_paiement ?? ''),
        montant_total: Number(paiement.montant_total ?? 0),
        devise: String(paiement.devise ?? 'FC'),
        prestataire: {
          nom: prest?.full_name,
          profession: prest?.profession,
        },
        transaction_id: paiement.transaction_id as string | undefined,
        reference_paiement: paiement.reference_paiement as string | undefined,
      });

      toast.success('Reçu téléchargé avec succès!');
    } catch (error) {
      console.error('Erreur lors de la génération du reçu:', error);
      toast.error('Erreur lors de la génération du reçu');
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="client" userName={clientName} userRole="Client">
        <DetailPageSkeleton />
      </DashboardLayout>
    );
  }

  if (!paiement) {
    return (
      <DashboardLayout role="client" userName={clientName} userRole="Client">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Paiement introuvable</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const isSuccess =
    paiement.statut === 'valide' || paiement.statut === 'complete';
  const estSolde = paiement.type_paiement === 'solde';
  const needsSimulationFinalize =
    PAYMENTS_SIMULATION_ENABLED &&
    !isSuccess &&
    ['en_cours', 'en_attente', 'echoue'].includes(String(paiement.statut ?? ''));

  return (
    <DashboardLayout role="client" userName={clientName} userRole="Client">
      <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-3xl">
        <div className="text-center space-y-4">
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${
            isSuccess ? 'bg-green-100' : 'bg-yellow-100'
          }`}>
            {isSuccess ? (
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            ) : (
              <AlertCircle className="w-12 h-12 text-yellow-600" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              {isSuccess ? 'Paiement réussi!' : 'Paiement en cours'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isSuccess
                ? estSolde
                  ? 'Le solde a été réglé avec succès.'
                  : "Votre acompte a été payé avec succès."
                : 'Votre paiement est en cours de traitement.'}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Détails du paiement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Numéro de paiement</p>
                <p className="font-semibold">{String(paiement.numero ?? '')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-semibold">
                  {new Date(String(paiement.date_paiement ?? paiement.created_at)).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Montant</p>
                <p className="font-semibold text-lg text-primary">
                  {Number(paiement.montant_total ?? 0).toLocaleString()} FC
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Méthode</p>
                <p className="font-semibold capitalize">
                  {String(paiement.methode_paiement ?? '').replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-semibold capitalize">{String(paiement.type_paiement ?? '')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Statut</p>
                <p className={`font-semibold ${
                  isSuccess ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {formatPaiementStatut(String(paiement.statut ?? ''))}
                </p>
              </div>
            </div>

            {(paiement.transaction_id || paiement.reference_paiement) && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Référence de transaction</p>
                <p className="font-mono text-sm">
                  {String(paiement.transaction_id ?? paiement.reference_paiement ?? '')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prestataire</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-primary">
                  {(paiement.prestataires as { full_name?: string } | undefined)?.full_name?.charAt(0) || 'P'}
                </span>
              </div>
              <div>
                <p className="font-semibold">
                  {(paiement.prestataires as { full_name?: string } | undefined)?.full_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {(paiement.prestataires as { profession?: string } | undefined)?.profession}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isSuccess && (
          <Card>
            <CardHeader>
              <CardTitle>Prochaines étapes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">
                    {estSolde ? 'Solde réglé' : 'Acompte payé'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {estSolde
                      ? 'Les fonds suivent les règles de versement prévues au contrat.'
                      : 'Votre acompte est sécurisé et sera libéré au prestataire au début des travaux'}
                  </p>
                </div>
              </div>
              
              {!estSolde && mission && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Mission créée</p>
                  <p className="text-sm text-muted-foreground">
                    Le prestataire va commencer les travaux selon le calendrier convenu
                  </p>
                </div>
              </div>
              )}

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Suivi des travaux</p>
                  <p className="text-sm text-muted-foreground">
                    {!estSolde
                      ? "Après réception des travaux, vous paierez le solde depuis le tableau de bord (action « Payer le solde ») ou depuis Paiements."
                      : 'Le contrat peut être clôturé selon vos échanges avec le prestataire et les règles KaziPro.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {needsSimulationFinalize && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-700" />
            <AlertDescription className="text-sm text-amber-950">
              {isAdmin
                ? 'Paiement en attente. Cliquez pour valider via l\'API admin (simulation, aucun débit réel).'
                : 'Paiement enregistré en attente. Un administrateur doit valider via le dashboard admin → Transactions.'}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {needsSimulationFinalize && (
            <div className="flex-1">
              <SlideToConfirm
                label={isAdmin ? 'Valider ce paiement en attente (simulation admin)' : 'Vérifier le statut du paiement'}
                hint="Glisser pour valider"
                variant="success"
                loading={finalizing}
                successMessage="Paiement validé"
                onConfirm={handleFinalizeSimulation}
              />
            </div>
          )}
          <Button
            onClick={handleDownloadReceipt}
            variant="outline"
            className="flex-1"
            disabled={!isSuccess}
          >
            <Download className="w-4 h-4 mr-2" />
            Télécharger le reçu
          </Button>
          <Button
            onClick={() => navigate('/dashboard/client')}
            className="flex-1"
            variant={needsSimulationFinalize ? 'outline' : 'default'}
          >
            <Home className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Button>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Un email de confirmation vous a été envoyé avec tous les détails de votre paiement.
          </AlertDescription>
        </Alert>
      </div>
    </DashboardLayout>
  );
}
