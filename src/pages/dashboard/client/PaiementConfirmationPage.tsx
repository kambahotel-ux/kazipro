import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
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
  
  const [loading, setLoading] = useState(true);
  const [paiement, setPaiement] = useState<any>(null);
  const [contrat, setContrat] = useState<any>(null);
  const [mission, setMission] = useState<any>(null);

  useEffect(() => {
    fetchPaiement();
  }, [paiementId]);

  const fetchPaiement = async () => {
    try {
      setLoading(true);
      
      // Récupérer le paiement
      const { data: paiementData, error: paiementError } = await supabase
        .from('paiements')
        .select(`
          *,
          prestataires (
            full_name,
            profession
          )
        `)
        .eq('id', paiementId)
        .single();

      if (paiementError) throw paiementError;
      setPaiement(paiementData);

      // Récupérer le contrat
      const { data: contratData, error: contratError } = await supabase
        .from('contrats')
        .select('*')
        .eq('id', paiementData.contrat_id)
        .single();

      if (contratError) throw contratError;
      setContrat(contratData);

      // Récupérer la mission
      const { data: missionData, error: missionError } = await supabase
        .from('missions')
        .select('*')
        .eq('contrat_id', paiementData.contrat_id)
        .single();

      if (missionError) {
        console.log('Mission pas encore créée:', missionError);
      } else {
        setMission(missionData);
      }

    } catch (error: any) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      // Créer un élément temporaire pour le reçu
      const receiptElement = document.createElement('div');
      receiptElement.style.position = 'absolute';
      receiptElement.style.left = '-9999px';
      receiptElement.style.width = '210mm';
      receiptElement.style.padding = '20mm';
      receiptElement.style.backgroundColor = 'white';
      receiptElement.style.fontFamily = 'Arial, sans-serif';

      // Contenu du reçu
      receiptElement.innerHTML = `
        <div style="max-width: 170mm; margin: 0 auto;">
          <!-- En-tête -->
          <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #2563eb;">
            <h1 style="color: #2563eb; font-size: 32px; margin: 0 0 10px 0;">REÇU DE PAIEMENT</h1>
            <p style="color: #64748b; font-size: 14px; margin: 0;">KaziPro - Plateforme de services professionnels</p>
          </div>

          <!-- Informations du reçu -->
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <p style="color: #64748b; font-size: 12px; margin: 0 0 5px 0;">Numéro de reçu</p>
                <p style="color: #0f172a; font-size: 16px; font-weight: bold; margin: 0;">${paiement.numero}</p>
              </div>
              <div>
                <p style="color: #64748b; font-size: 12px; margin: 0 0 5px 0;">Date de paiement</p>
                <p style="color: #0f172a; font-size: 16px; font-weight: bold; margin: 0;">
                  ${new Date(paiement.date_paiement || paiement.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p style="color: #64748b; font-size: 12px; margin: 0 0 5px 0;">Statut</p>
                <p style="color: #16a34a; font-size: 16px; font-weight: bold; margin: 0; text-transform: uppercase;">
                  ${paiement.statut}
                </p>
              </div>
              <div>
                <p style="color: #64748b; font-size: 12px; margin: 0 0 5px 0;">Méthode de paiement</p>
                <p style="color: #0f172a; font-size: 16px; font-weight: bold; margin: 0; text-transform: capitalize;">
                  ${paiement.methode_paiement.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          <!-- Montant -->
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px; border-radius: 8px; margin-bottom: 30px; text-align: center;">
            <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 10px 0;">MONTANT PAYÉ</p>
            <p style="color: white; font-size: 42px; font-weight: bold; margin: 0;">
              ${paiement.montant_total.toLocaleString()} FC
            </p>
            <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 10px 0 0 0;">
              Type: ${paiement.type_paiement === 'acompte' ? 'Acompte (30%)' : paiement.type_paiement}
            </p>
          </div>

          <!-- Détails du prestataire -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #0f172a; font-size: 16px; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0;">
              Prestataire
            </h3>
            <div style="padding-left: 15px;">
              <p style="color: #0f172a; font-size: 16px; font-weight: bold; margin: 0 0 5px 0;">
                ${paiement.prestataires?.full_name || 'N/A'}
              </p>
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                ${paiement.prestataires?.profession || 'N/A'}
              </p>
            </div>
          </div>

          ${paiement.transaction_id || paiement.reference_paiement ? `
          <!-- Référence de transaction -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #0f172a; font-size: 16px; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0;">
              Référence de transaction
            </h3>
            <p style="color: #64748b; font-family: monospace; font-size: 12px; margin: 0; padding: 10px; background: #f8fafc; border-radius: 4px;">
              ${paiement.transaction_id || paiement.reference_paiement}
            </p>
          </div>
          ` : ''}

          <!-- Informations importantes -->
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 30px;">
            <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.6;">
              <strong>Note importante:</strong> Ce reçu confirme que votre paiement a été reçu et sécurisé. 
              Les fonds seront libérés au prestataire selon les termes du contrat.
            </p>
          </div>

          <!-- Pied de page -->
          <div style="text-align: center; padding-top: 20px; border-top: 2px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 11px; margin: 0 0 5px 0;">
              Document généré automatiquement le ${new Date().toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <p style="color: #64748b; font-size: 11px; margin: 0;">
              KaziPro - Tous droits réservés
            </p>
          </div>
        </div>
      `;

      document.body.appendChild(receiptElement);

      // Générer le PDF
      const canvas = await html2canvas(receiptElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(receiptElement);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      const fileName = `Recu_${paiement.numero}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast.success('Reçu téléchargé avec succès!');
    } catch (error) {
      console.error('Erreur lors de la génération du reçu:', error);
      toast.error('Erreur lors de la génération du reçu');
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

  if (!paiement) {
    return (
      <DashboardLayout role="client" userName={user?.email || ''} userRole="Client">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Paiement introuvable</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const isSuccess = paiement.statut === 'valide';

  return (
    <DashboardLayout role="client" userName={user?.email || ''} userRole="Client">
      <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-3xl">
        {/* Success Header */}
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
                ? 'Votre acompte a été payé avec succès'
                : 'Votre paiement est en cours de traitement'
              }
            </p>
          </div>
        </div>

        {/* Détails du paiement */}
        <Card>
          <CardHeader>
            <CardTitle>Détails du paiement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Numéro de paiement</p>
                <p className="font-semibold">{paiement.numero}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-semibold">
                  {new Date(paiement.date_paiement || paiement.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Montant</p>
                <p className="font-semibold text-lg text-primary">
                  {paiement.montant_total.toLocaleString()} FC
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Méthode</p>
                <p className="font-semibold capitalize">
                  {paiement.methode_paiement.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-semibold capitalize">{paiement.type_paiement}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Statut</p>
                <p className={`font-semibold capitalize ${
                  isSuccess ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {paiement.statut}
                </p>
              </div>
            </div>

            {(paiement.transaction_id || paiement.reference_paiement) && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Référence de transaction</p>
                <p className="font-mono text-sm">
                  {paiement.transaction_id || paiement.reference_paiement}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prestataire */}
        <Card>
          <CardHeader>
            <CardTitle>Prestataire</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-primary">
                  {paiement.prestataires?.full_name?.charAt(0) || 'P'}
                </span>
              </div>
              <div>
                <p className="font-semibold">{paiement.prestataires?.full_name}</p>
                <p className="text-sm text-muted-foreground">{paiement.prestataires?.profession}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prochaines étapes */}
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
                  <p className="font-medium">Acompte payé</p>
                  <p className="text-sm text-muted-foreground">
                    Votre acompte est sécurisé et sera libéré au prestataire au début des travaux
                  </p>
                </div>
              </div>
              
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

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Suivi des travaux</p>
                  <p className="text-sm text-muted-foreground">
                    Vous pourrez suivre l'avancement et communiquer avec le prestataire
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleDownloadReceipt}
            variant="outline"
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Télécharger le reçu
          </Button>
          <Button
            onClick={() => navigate('/dashboard/client')}
            className="flex-1"
          >
            <Home className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Button>
        </div>

        {/* Info */}
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
