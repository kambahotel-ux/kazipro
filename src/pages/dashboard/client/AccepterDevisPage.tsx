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
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!devis) {
    return (
      <DashboardLayout role="client" userName={user?.email || ''} userRole="Client">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Devis introuvable</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="client" userName={user?.email || ''} userRole="Client">
      <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Accepter le devis</h1>
            <p className="text-muted-foreground mt-1">
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

        {/* Si le devis est déjà accepté, afficher un message et le bouton pour voir le contrat */}
        {devis.statut === 'accepte' && (
          <Alert className="bg-blue-50 border-blue-200">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>Devis déjà accepté</strong>
              <br />
              Ce devis a été accepté le {new Date(devis.date_acceptation).toLocaleDateString('fr-FR')}. 
              {contrat ? ' Le contrat a été généré et est prêt à être signé.' : ' Le contrat est en cours de génération.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Bouton pour voir le contrat si déjà accepté */}
        {devis.statut === 'accepte' && contrat && (
          <Card className="border-green-500 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg">Contrat prêt à signer</h3>
                  <p className="text-sm text-muted-foreground">
                    Contrat N° {contrat.numero} - Statut: {contrat.statut === 'genere' ? 'En attente de signature' : contrat.statut}
                  </p>
                </div>
                <Button
                  onClick={() => navigate(`/dashboard/client/contrat/${devisId}`)}
                  size="lg"
                >
                  <FileSignature className="w-4 h-4 mr-2" />
                  Voir le contrat et signer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Acceptation - Afficher seulement si le devis n'est pas encore accepté */}
        {devis.statut !== 'accepte' && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="w-5 h-5" />
                Acceptation du devis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Conditions générales */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="conditions"
                  checked={acceptConditions}
                  onCheckedChange={(checked) => setAcceptConditions(checked as boolean)}
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="conditions"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    J'accepte les conditions générales
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    J'ai lu et j'accepte les conditions générales de prestation de services
                  </p>
                </div>
              </div>

              {/* Conditions de paiement */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="paiement"
                  checked={acceptPaiement}
                  onCheckedChange={(checked) => setAcceptPaiement(checked as boolean)}
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="paiement"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    J'accepte les conditions de paiement
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Je m'engage à payer l'acompte de {montants?.montant_acompte.toLocaleString()} FC 
                    avant le début des travaux, et le solde de {montants?.montant_solde.toLocaleString()} FC 
                    après validation des travaux
                  </p>
                </div>
              </div>

              {/* Alert sécurité */}
              <Alert className="bg-green-50 border-green-200">
                <Shield className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  <strong>Votre paiement est protégé</strong>
                  <br />
                  L'acompte est bloqué jusqu'au début des travaux. Le solde n'est versé au prestataire 
                  qu'après votre validation. En cas de litige, KaziPro intervient pour vous protéger.
                </AlertDescription>
              </Alert>

              {/* Boutons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleAccept}
                  disabled={!acceptConditions || !acceptPaiement || accepting}
                  size="lg"
                  className="flex-1"
                >
                  {accepting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Traitement...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Accepter et continuer
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate(-1)}
                  disabled={accepting}
                >
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
