import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { contratsApi, paiementsApi } from '@/lib/api';
import { getClientDisplayName, mapDevisToUi } from '@/lib/client-helpers';
import {
  PAYMENTS_SIMULATION_ENABLED,
  finalizePaiementSimulation,
} from '@/lib/payments';
import { reportError, trackEvent } from '@/lib/monitoring';
import { toast } from 'sonner';
import { DetailPageSkeleton } from '@/components/dashboard/AdminLoadingSkeleton';
import { SlideToConfirm } from '@/components/ui/SlideToConfirm';
import { 
  CreditCard, 
  Smartphone,
  Shield,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader
} from 'lucide-react';

type MethodePaiement = 'mpesa' | 'airtel_money' | 'orange_money';

export default function PaiementSoldePage() {
  const { contratId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const clientName = getClientDisplayName(user);
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [contrat, setContrat] = useState<Record<string, unknown> | null>(null);
  const [devis, setDevis] = useState<Record<string, unknown> | null>(null);
  const [methodePaiement, setMethodePaiement] = useState<MethodePaiement>('mpesa');
  const [numeroTelephone, setNumeroTelephone] = useState('');
  const [montantSolde, setMontantSolde] = useState(0);
  const [montantAcomptePaye, setMontantAcomptePaye] = useState(0);

  useEffect(() => {
    fetchContrat();
  }, [contratId]);

  const fetchContrat = async () => {
    try {
      setLoading(true);
      
      const contratData = await contratsApi.getById(String(contratId));
      setContrat(contratData as Record<string, unknown>);

      const paiements = await paiementsApi.getByContrat(String(contratId));
      const acompteValide = paiements.find(
        (p) =>
          String((p as { type?: string; type_paiement?: string }).type ?? (p as { type_paiement?: string }).type_paiement) === 'acompte' &&
          String((p as { statut?: string }).statut) === 'valide',
      );

      if (!acompteValide) {
        toast.error("L'acompte doit être payé avant de payer le solde");
        navigate('/dashboard/client');
        return;
      }

      const devisRaw = (contratData as { devis?: Record<string, unknown> }).devis;
      if (!devisRaw) {
        toast.error('Devis introuvable');
        navigate('/dashboard/client');
        return;
      }

      const devisData = mapDevisToUi(devisRaw);
      setDevis(devisData as Record<string, unknown>);

      const acomptePaye = Number(
        (acompteValide as { montant?: number; montant_total?: number }).montant ??
          (acompteValide as { montant_total?: number }).montant_total ??
          (contratData as { acompte_montant?: number }).acompte_montant ??
          0,
      );
      setMontantAcomptePaye(acomptePaye);

      const soldeMontant =
        Number((contratData as { solde_montant?: number }).solde_montant) ||
        Number(devisData.montant_ttc) - acomptePaye;
      setMontantSolde(Math.round(soldeMontant));

    } catch (error: unknown) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handlePaiement = async () => {
    if (!numeroTelephone || numeroTelephone.length < 10) {
      toast.error('Veuillez entrer un numéro de téléphone valide');
      return;
    }

    try {
      setProcessing(true);

      const existing = await paiementsApi.getByContrat(String(contratId));
      const succes = existing.find(
        (p) =>
          String((p as { type?: string; type_paiement?: string }).type ?? (p as { type_paiement?: string }).type_paiement) === 'solde' &&
          ['valide', 'complete'].includes(String((p as { statut?: string }).statut ?? '')),
      );
      if (succes?.id) {
        toast.info('Le solde a déjà été payé.');
        navigate(`/dashboard/client/paiement/${succes.id}/confirmation`);
        return;
      }

      const created = await paiementsApi.payerSolde({
        contrat_id: String(contratId),
        methode: methodePaiement,
        reference_externe: numeroTelephone,
      });

      const paiementId = String((created as { id?: string | number }).id ?? '');
      if (!paiementId) throw new Error('Réponse paiement invalide');

      trackEvent('payment_solde_created', { contratId, paiementId });

      if (!PAYMENTS_SIMULATION_ENABLED) {
        toast.error('Paiement réel non activé. Contactez le support.');
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 800));
      const result = await finalizePaiementSimulation(paiementId);

      if (result.ok) {
        toast.success('Paiement du solde effectué avec succès!');
      } else {
        toast.info(
          'Paiement enregistré. Un administrateur doit le valider pour finaliser le contrat.',
        );
      }
      trackEvent('payment_solde_validated', { contratId, paiementId });
      navigate(`/dashboard/client/paiement/${paiementId}/confirmation`);

    } catch (error: unknown) {
      reportError('PaiementSoldePage.handlePaiement', error, 'error', { contratId });
      toast.error('Erreur lors du paiement');
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="client" userName={clientName} userRole="Client">
        <DetailPageSkeleton />
      </DashboardLayout>
    );
  }

  if (!contrat || !devis) {
    return (
      <DashboardLayout role="client" userName={clientName} userRole="Client">
        <div className="p-3 md:p-6">
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <AlertDescription className="text-sm">Contrat introuvable</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  const montantTtc = Number(devis.montant_ttc ?? 0);
  const pourcentageSolde =
    montantTtc > 0 ? Math.round((montantSolde / montantTtc) * 100) : 70;
  const prest = (devis.prestataires ?? devis.prestataire) as
    | { full_name?: string; profession?: string }
    | undefined;

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
            <h1 className="text-xl md:text-3xl font-bold truncate">Paiement du solde</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1 truncate">
              Contrat N° {String(contrat.numero ?? '')}
            </p>
          </div>
        </div>

        <Alert className="bg-green-50 border-green-200">
          <Shield className="w-4 h-4 md:w-5 md:h-5 text-green-600 shrink-0" />
          <AlertDescription className="text-green-900 text-sm">
            <strong>Paiement final sécurisé</strong>
            <br className="hidden sm:block" />
            <span className="sm:hidden"> - </span>
            Ce paiement finalise le contrat. Le prestataire recevra le montant total 
            après validation des travaux.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="text-base md:text-lg">Résumé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 md:space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="text-sm text-muted-foreground">Prestataire</span>
              <span className="font-medium text-sm truncate">{prest?.full_name}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="text-sm text-muted-foreground">Profession</span>
              <span className="font-medium text-sm truncate">{prest?.profession}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="text-sm text-muted-foreground">Montant total du contrat</span>
              <span className="font-medium text-sm">{montantTtc.toLocaleString()} FC</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="text-xs md:text-sm text-muted-foreground">Acompte déjà payé</span>
              <span className="font-medium text-xs md:text-sm text-green-600">- {montantAcomptePaye.toLocaleString()} FC</span>
            </div>
            <div className="border-t pt-2 md:pt-3 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-base md:text-lg font-semibold text-primary">
              <span className="text-sm md:text-base">Solde à payer ({pourcentageSolde}%)</span>
              <span className="text-lg md:text-xl">{montantSolde.toLocaleString()} FC</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <CreditCard className="w-4 h-4 md:w-5 md:h-5" />
              Méthode de paiement
            </CardTitle>
            <CardDescription className="text-sm">
              Choisissez votre méthode de paiement mobile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6">
            <RadioGroup value={methodePaiement} onValueChange={(value) => setMethodePaiement(value as MethodePaiement)}>
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center space-x-2 md:space-x-3 p-3 md:p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="mpesa" id="mpesa" className="shrink-0" />
                  <Label htmlFor="mpesa" className="flex items-center gap-2 md:gap-3 cursor-pointer flex-1 min-w-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <Smartphone className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm md:text-base">M-Pesa</p>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">Vodacom M-Pesa</p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 md:space-x-3 p-3 md:p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="airtel_money" id="airtel" className="shrink-0" />
                  <Label htmlFor="airtel" className="flex items-center gap-2 md:gap-3 cursor-pointer flex-1 min-w-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-red-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <Smartphone className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm md:text-base">Airtel Money</p>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">Airtel Money</p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 md:space-x-3 p-3 md:p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="orange_money" id="orange" className="shrink-0" />
                  <Label htmlFor="orange" className="flex items-center gap-2 md:gap-3 cursor-pointer flex-1 min-w-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <Smartphone className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm md:text-base">Orange Money</p>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">Orange Money</p>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm md:text-base">Numéro de téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+243 812 345 678"
                value={numeroTelephone}
                onChange={(e) => setNumeroTelephone(e.target.value)}
                disabled={processing}
                className="text-sm md:text-base"
              />
              <p className="text-xs md:text-sm text-muted-foreground">
                Vous recevrez une notification pour confirmer le paiement
              </p>
            </div>

            <SlideToConfirm
              label={`Payer le solde de ${montantSolde.toLocaleString()} FC via ${methodePaiement}`}
              hint="Glisser pour payer"
              variant="success"
              disabled={!numeroTelephone || numeroTelephone.length < 10}
              loading={processing}
              successMessage="Paiement initié"
              onConfirm={handlePaiement}
            />

            <Alert>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <AlertDescription className="text-xs md:text-sm">
                <strong>Mode simulation:</strong> Activez <code>VITE_PAYMENTS_SIMULATION=true</code> uniquement en dev.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
