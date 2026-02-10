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
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
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

export default function PaiementAcomptePage() {
  const { contratId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [contrat, setContrat] = useState<any>(null);
  const [devis, setDevis] = useState<any>(null);
  const [methodePaiement, setMethodePaiement] = useState<MethodePaiement>('mpesa');
  const [numeroTelephone, setNumeroTelephone] = useState('');
  const [montantAcompte, setMontantAcompte] = useState(0);

  useEffect(() => {
    fetchContrat();
  }, [contratId]);

  const fetchContrat = async () => {
    try {
      setLoading(true);
      
      // Récupérer le contrat
      const { data: contratData, error: contratError } = await supabase
        .from('contrats')
        .select('*')
        .eq('id', contratId)
        .single();

      if (contratError) throw contratError;
      setContrat(contratData);

      // Essayer d'abord dans devis_pro (nouvelle table)
      let { data: devisData, error: devisError } = await supabase
        .from('devis_pro')
        .select(`
          *,
          prestataires (
            full_name,
            profession
          )
        `)
        .eq('id', contratData.devis_id)
        .maybeSingle();

      // Si pas trouvé dans devis_pro, essayer dans devis (ancienne table)
      if (!devisData) {
        const { data: oldDevisData, error: oldDevisError } = await supabase
          .from('devis')
          .select(`
            *,
            prestataire:prestataires (
              full_name,
              profession
            )
          `)
          .eq('id', contratData.devis_id)
          .maybeSingle();

        if (oldDevisError) throw oldDevisError;
        
        // Normaliser la structure pour compatibilité
        if (oldDevisData) {
          devisData = {
            ...oldDevisData,
            prestataires: Array.isArray(oldDevisData.prestataire) 
              ? oldDevisData.prestataire[0] 
              : oldDevisData.prestataire
          };
        }
      }

      if (devisError && devisError.code !== 'PGRST116') throw devisError;
      
      if (!devisData) {
        toast.error('Devis introuvable');
        navigate('/dashboard/client/demandes');
        return;
      }
      
      setDevis(devisData);

      // Calculer le montant de l'acompte
      const pourcentageAcompte = contratData.conditions_paiement?.acompte || 30;
      const montant = (devisData.montant_ttc * pourcentageAcompte) / 100;
      setMontantAcompte(Math.round(montant));

    } catch (error: any) {
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

      // Générer le numéro de paiement
      const { data: numeroData, error: numeroError } = await supabase
        .rpc('generate_paiement_numero');

      if (numeroError) throw numeroError;

      // Créer l'enregistrement de paiement
      const { data: paiementData, error: paiementError } = await supabase
        .from('paiements')
        .insert({
          numero: numeroData,
          contrat_id: contratId,
          devis_id: devis.id,
          client_id: contrat.client_id,
          prestataire_id: contrat.prestataire_id,
          type_paiement: 'acompte',
          montant_travaux: montantAcompte,
          montant_materiel: 0,
          montant_deplacement: 0,
          montant_total: montantAcompte,
          methode_paiement: methodePaiement,
          statut: 'en_cours',
          metadata: {
            numero_telephone: numeroTelephone,
            devis_id: devis.id
          }
        })
        .select()
        .single();

      if (paiementError) throw paiementError;

      // TODO: Intégration réelle avec M-Pesa/Airtel Money
      // Pour l'instant, simulation d'un paiement réussi après 2 secondes
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mettre à jour le statut du paiement
      const { error: updateError } = await supabase
        .from('paiements')
        .update({
          statut: 'valide',
          date_paiement: new Date().toISOString(),
          transaction_id: `SIM-${Date.now()}`, // Simulation
          reference_paiement: `REF-${Date.now()}` // Simulation
        })
        .eq('id', paiementData.id);

      if (updateError) {
        console.error('Erreur mise à jour paiement:', updateError);
        throw updateError;
      }

      // Attendre un peu pour que le trigger se déclenche
      await new Promise(resolve => setTimeout(resolve, 500));

      // Créer la mission
      const { error: missionError } = await supabase
        .from('missions')
        .insert({
          demande_id: devis.demande_id,
          devis_id: devis.id,
          contrat_id: contratId,
          client_id: contrat.client_id,
          prestataire_id: contrat.prestataire_id,
          status: 'in_progress',
          start_date: new Date().toISOString()
        });

      if (missionError) {
        console.error('Erreur création mission:', missionError);
        // Ne pas bloquer si la mission échoue, le paiement est déjà validé
      }

      toast.success('Paiement effectué avec succès!');
      
      // Rediriger vers la page de confirmation
      navigate(`/dashboard/client/paiement/${paiementData.id}/confirmation`);

    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du paiement');
    } finally {
      setProcessing(false);
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

  if (!contrat || !devis) {
    return (
      <DashboardLayout role="client" userName={user?.email || ''} userRole="Client">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Contrat introuvable</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const pourcentageAcompte = contrat.conditions_paiement?.acompte || 30;

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
            <h1 className="text-3xl font-bold">Paiement de l'acompte</h1>
            <p className="text-muted-foreground mt-1">
              Contrat N° {contrat.numero}
            </p>
          </div>
        </div>

        {/* Alert sécurité */}
        <Alert className="bg-green-50 border-green-200">
          <Shield className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            <strong>Paiement sécurisé</strong>
            <br />
            Votre acompte est bloqué jusqu'au début des travaux. En cas de problème, 
            vous pouvez demander un remboursement.
          </AlertDescription>
        </Alert>

        {/* Résumé */}
        <Card>
          <CardHeader>
            <CardTitle>Résumé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prestataire</span>
              <span className="font-medium">{devis.prestataires?.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Profession</span>
              <span className="font-medium">{devis.prestataires?.profession}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Montant total</span>
              <span className="font-medium">{devis.montant_ttc.toLocaleString()} FC</span>
            </div>
            <div className="flex justify-between text-lg font-semibold text-primary">
              <span>Acompte à payer ({pourcentageAcompte}%)</span>
              <span>{montantAcompte.toLocaleString()} FC</span>
            </div>
          </CardContent>
        </Card>

        {/* Méthode de paiement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Méthode de paiement
            </CardTitle>
            <CardDescription>
              Choisissez votre méthode de paiement mobile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={methodePaiement} onValueChange={(value) => setMethodePaiement(value as MethodePaiement)}>
              <div className="space-y-3">
                {/* M-Pesa */}
                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="mpesa" id="mpesa" />
                  <Label htmlFor="mpesa" className="flex items-center gap-3 cursor-pointer flex-1">
                    <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold">M-Pesa</p>
                      <p className="text-sm text-muted-foreground">Vodacom M-Pesa</p>
                    </div>
                  </Label>
                </div>

                {/* Airtel Money */}
                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="airtel_money" id="airtel" />
                  <Label htmlFor="airtel" className="flex items-center gap-3 cursor-pointer flex-1">
                    <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Airtel Money</p>
                      <p className="text-sm text-muted-foreground">Airtel Money</p>
                    </div>
                  </Label>
                </div>

                {/* Orange Money */}
                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="orange_money" id="orange" />
                  <Label htmlFor="orange" className="flex items-center gap-3 cursor-pointer flex-1">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Orange Money</p>
                      <p className="text-sm text-muted-foreground">Orange Money</p>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            {/* Numéro de téléphone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+243 812 345 678"
                value={numeroTelephone}
                onChange={(e) => setNumeroTelephone(e.target.value)}
                disabled={processing}
              />
              <p className="text-sm text-muted-foreground">
                Vous recevrez une notification pour confirmer le paiement
              </p>
            </div>

            {/* Bouton payer */}
            <Button
              onClick={handlePaiement}
              disabled={processing || !numeroTelephone}
              size="lg"
              className="w-full"
            >
              {processing ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Traitement en cours...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Payer {montantAcompte.toLocaleString()} FC
                </>
              )}
            </Button>

            {/* Info */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Mode simulation:</strong> Le paiement est actuellement simulé. 
                L'intégration réelle avec M-Pesa/Airtel Money sera ajoutée prochainement.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
