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
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  FileSignature, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  Shield
} from 'lucide-react';

export default function AccepterDevisPage() {
  const { devisId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [devis, setDevis] = useState<any>(null);
  const [contrat, setContrat] = useState<any>(null);
  const [montants, setMontants] = useState<any>(null);
  const [acceptConditions, setAcceptConditions] = useState(false);
  const [acceptPaiement, setAcceptPaiement] = useState(false);

  useEffect(() => {
    fetchDevis();
  }, [devisId]);

  const fetchDevis = async () => {
    try {
      setLoading(true);
      
      // Récupérer le devis avec les infos du prestataire
      const { data: devisData, error: devisError } = await supabase
        .from('devis_pro')
        .select(`
          *,
          prestataires (
            full_name,
            email,
            profession
          )
        `)
        .eq('id', devisId)
        .single();

      if (devisError) throw devisError;
      
      if (!devisData) {
        toast.error('Devis introuvable');
        navigate('/dashboard/client/demandes');
        return;
      }

      setDevis(devisData);

      // Vérifier si un contrat existe déjà
      if (devisData.statut === 'accepte') {
        const { data: contratData } = await supabase
          .from('contrats')
          .select('*')
          .eq('devis_id', devisId)
          .maybeSingle();
        
        if (contratData) {
          setContrat(contratData);
        }
      }

      // Calculer les montants de paiement
      const montantTTC = devisData.montant_ttc || 0;
      const pourcentageAcompte = 30; // Par défaut, à récupérer de la config
      const pourcentageSolde = 70;

      setMontants({
        montant_travaux_ht: devisData.montant_ht || 0,
        montant_materiel_ht: 0,
        frais_deplacement: 0,
        commission_totale: 0,
        montant_acompte: (montantTTC * pourcentageAcompte) / 100,
        montant_solde: (montantTTC * pourcentageSolde) / 100,
        pourcentage_acompte: pourcentageAcompte,
        pourcentage_solde: pourcentageSolde,
      });

    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement du devis');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!acceptConditions || !acceptPaiement) {
      toast.error('Veuillez accepter les conditions');
      return;
    }

    try {
      setAccepting(true);

      // Mettre à jour le statut du devis
      const { error: updateError } = await supabase
        .from('devis_pro')
        .update({ 
          statut: 'accepte',
          date_acceptation: new Date().toISOString()
        })
        .eq('id', devisId);

      if (updateError) throw updateError;

      toast.success('Devis accepté avec succès! Cliquez sur "Voir le contrat" pour continuer.');
      
      // Recharger les données pour afficher le bouton "Voir le contrat"
      fetchDevis();

    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'acceptation du devis');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="client" userName={user?.email || ''} userRole="Client">
        <div className="flex items-center justify-center h-64 md:h-96 px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-primary mx-auto mb-3 md:mb-4"></div>
            <p className="text-sm md:text-base text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!devis) {
    return (
      <DashboardLayout role="client" userName={user?.email || ''} userRole="Client">
        <div className="p-3 md:p-6">
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <AlertDescription className="text-sm">Devis introuvable</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="client" userName={user?.email || ''} userRole="Client">
      <div className="container mx-auto p-3 md:p-6 space-y-4 md:space-y-6 max-w-4xl">
        {/* Header - Mobile Optimized */}
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
              Prestataire: {devis.prestataires?.full_name}
            </p>
          </div>
        </div>

        {/* Détails du devis */}
        <DevisDetailCard 
          devis={devis} 
          montants={montants}
          paiementViaKazipro={true}
        />

        {/* Si le devis est déjà accepté, afficher un message et le bouton pour voir le contrat - Mobile Optimized */}
        {devis.statut === 'accepte' && (
          <Alert className="bg-blue-50 border-blue-200">
            <CheckCircle2 className="w-4 h-4 md:h-5 md:h-5 text-blue-600 shrink-0" />
            <AlertDescription className="text-blue-900 text-sm">
              <strong>Devis déjà accepté</strong>
              <br />
              Ce devis a été accepté le {new Date(devis.date_acceptation).toLocaleDateString('fr-FR')}. 
              {contrat ? ' Le contrat a été généré et est prêt à être signé.' : ' Le contrat est en cours de génération.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Bouton pour voir le contrat si déjà accepté - Mobile Optimized */}
        {devis.statut === 'accepte' && contrat && (
          <Card className="border-green-500 bg-green-50">
            <CardContent className="pt-4 md:pt-6">
              <div className="flex flex-col gap-3 md:gap-4">
                <div>
                  <h3 className="font-semibold text-base md:text-lg">Contrat prêt à signer</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Contrat N° {contrat.numero} - Statut: {contrat.statut === 'genere' ? 'En attente de signature' : contrat.statut}
                  </p>
                </div>
                <Button
                  onClick={() => navigate(`/dashboard/client/contrat/${devisId}`)}
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

        {/* Acceptation - Afficher seulement si le devis n'est pas encore accepté - Mobile Optimized */}
        {devis.statut !== 'accepte' && (
          <Card className="border-primary">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <FileSignature className="w-4 h-4 md:w-5 md:h-5" />
                Acceptation du devis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              {/* Conditions générales - Mobile Optimized */}
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

              {/* Conditions de paiement - Mobile Optimized */}
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
                    Je m'engage à payer l'acompte de {montants?.montant_acompte.toLocaleString()} FC 
                    avant le début des travaux, et le solde de {montants?.montant_solde.toLocaleString()} FC 
                    après validation des travaux
                  </p>
                </div>
              </div>

              {/* Alert sécurité - Mobile Optimized */}
              <Alert className="bg-green-50 border-green-200">
                <Shield className="w-4 h-4 md:w-5 md:h-5 text-green-600 shrink-0" />
                <AlertDescription className="text-green-900 text-xs md:text-sm">
                  <strong>Votre paiement est protégé</strong>
                  <br />
                  L'acompte est bloqué jusqu'au début des travaux. Le solde n'est versé au prestataire 
                  qu'après votre validation. En cas de litige, KaziPro intervient pour vous protéger.
                </AlertDescription>
              </Alert>

              {/* Boutons - Mobile Optimized */}
              <div className="flex flex-col gap-3 md:gap-4">
                <Button
                  onClick={handleAccept}
                  disabled={!acceptConditions || !acceptPaiement || accepting}
                  size="sm"
                  className="w-full"
                >
                  {accepting ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white mr-2"></div>
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
