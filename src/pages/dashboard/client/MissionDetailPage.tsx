import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MissionProgressCard } from '@/components/mission/MissionProgressCard';
import { missionsApi } from '@/lib/api';
import { getClientDisplayName, mapMissionToUi } from '@/lib/client-helpers';
import { getClientMissionLabel } from '@/lib/missions';
import { toast } from 'sonner';
import { DetailPageSkeleton } from '@/components/dashboard/AdminLoadingSkeleton';
import { SlideToConfirm } from '@/components/ui/SlideToConfirm';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  CheckCircle2,
  AlertCircle,
  CreditCard,
} from 'lucide-react';

export default function MissionDetailPage() {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const clientName = getClientDisplayName(user);

  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [mission, setMission] = useState<any>(null);

  useEffect(() => {
    if (missionId) void fetchMission();
  }, [missionId]);

  const fetchMission = async () => {
    try {
      setLoading(true);
      const data = await missionsApi.getById(String(missionId));
      setMission(mapMissionToUi(data as Record<string, unknown>));
    } catch (error: unknown) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const rawStatus = String(mission?.status ?? mission?.statut ?? '');
  const needsClientValidation = rawStatus === 'terminee_prestataire';
  const contrat = mission?.contrats as Record<string, unknown> | undefined;
  const soldeValide = contrat?.solde_valide === true;
  const contratId = mission?.contrat_id || contrat?.id;

  const handleValidateMission = async () => {
    if (!soldeValide) {
      toast.error('Payez le solde avant de valider la mission');
      return;
    }
    try {
      setValidating(true);
      await missionsApi.valider(String(missionId));
      toast.success('Travaux validés — fonds libérés au prestataire');
      await fetchMission();
    } catch (error: unknown) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la validation');
      throw error;
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="client" userName={clientName} userRole="Client">
        <DetailPageSkeleton />
      </DashboardLayout>
    );
  }

  if (!mission) {
    return (
      <DashboardLayout role="client" userName={clientName} userRole="Client">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Mission introuvable</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const montant =
    mission.devis?.montant_ttc ??
    mission.contrats?.montant_ttc ??
    0;
  const titre =
    mission.demandes?.titre ||
    mission.demandes?.title ||
    'Mission';

  return (
    <DashboardLayout role="client" userName={clientName} userRole="Client">
      <div className="mx-auto max-w-3xl space-y-6 pb-8">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
            <Link to="/dashboard/client/missions">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Suivi missions
            </Link>
          </Button>
          <h1 className="font-display text-2xl font-bold">{titre}</h1>
          <p className="text-sm text-muted-foreground">
            Contrat {mission.contrats?.numero ? `N° ${mission.contrats.numero}` : ''}
          </p>
        </div>

        <MissionProgressCard mission={mission} compact />

        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Prestataire</p>
                <p className="font-medium">{mission.prestataires?.full_name}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Début</p>
                <p className="font-medium">
                  {mission.start_date
                    ? new Date(mission.start_date).toLocaleDateString('fr-FR')
                    : '—'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Montant devis</p>
                <p className="font-medium">
                  {Number(montant).toLocaleString('fr-FR')} FC
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Statut mission</p>
              <Badge variant="outline" className="mt-1">
                {getClientMissionLabel(mission)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {needsClientValidation && !soldeValide && contratId && (
          <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <CreditCard className="h-5 w-5" />
                Payer le solde
              </CardTitle>
              <CardDescription>
                Le prestataire a terminé les travaux. Réglez le solde via KaziPro avant de valider la mission.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate(`/dashboard/client/paiement/${contratId}/solde`)}>
                Payer le solde
              </Button>
            </CardContent>
          </Card>
        )}

        {needsClientValidation && soldeValide && (
          <Card className="border-success/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-5 w-5" />
                Valider les travaux
              </CardTitle>
              <CardDescription>
                Le solde est réglé. Vérifiez les travaux puis validez pour libérer les fonds au prestataire.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SlideToConfirm
                label="Confirmez que les travaux sont conformes"
                hint="Glisser pour valider les travaux"
                variant="success"
                loading={validating}
                successMessage="Travaux validés"
                onConfirm={handleValidateMission}
              />
            </CardContent>
          </Card>
        )}

        {mission.demande_id && (
          <Button variant="outline" asChild className="w-full">
            <Link to={`/dashboard/client/demandes/${mission.demande_id}`}>Retour à la demande</Link>
          </Button>
        )}
      </div>
    </DashboardLayout>
  );
}
