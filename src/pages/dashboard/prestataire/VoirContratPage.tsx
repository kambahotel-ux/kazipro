import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  ArrowLeft,
  Download,
  Loader,
  AlertCircle,
  FileText
} from 'lucide-react';

export default function VoirContratPage() {
  const { contratId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [contrat, setContrat] = useState<any>(null);
  const [devis, setDevis] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [prestataire, setPrestataire] = useState<any>(null);

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
        .maybeSingle();

      if (contratError) throw contratError;
      
      if (!contratData) {
        toast.error('Contrat introuvable');
        navigate('/dashboard/prestataire/contrats');
        return;
      }
      
      setContrat(contratData);

      // Récupérer le client
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('id', contratData.client_id)
        .maybeSingle();
      
      setClient(clientData);

      // Récupérer le prestataire
      const { data: prestataireData } = await supabase
        .from('prestataires')
        .select('*')
        .eq('id', contratData.prestataire_id)
        .maybeSingle();
      
      setPrestataire(prestataireData);

      // Récupérer le devis (essayer les deux tables)
      let { data: devisData } = await supabase
        .from('devis_pro')
        .select('*')
        .eq('id', contratData.devis_id)
        .maybeSingle();

      if (!devisData) {
        const { data: oldDevisData } = await supabase
          .from('devis')
          .select('*')
          .eq('id', contratData.devis_id)
          .maybeSingle();
        
        devisData = oldDevisData;
      }

      setDevis(devisData);

    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement du contrat');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const contratElement = document.getElementById('contrat-content');
      if (!contratElement) {
        toast.error('Erreur lors de la génération du PDF');
        return;
      }

      const canvas = await html2canvas(contratElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

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

      const fileName = `Contrat_${contrat.numero}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast.success('Contrat téléchargé avec succès!');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="prestataire" userName={user?.email || ''} userRole="Prestataire">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement du contrat...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!contrat || !devis) {
    return (
      <DashboardLayout role="prestataire" userName={user?.email || ''} userRole="Prestataire">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Contrat introuvable</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const montantAcompte = Math.round((devis.montant_ttc * (contrat.conditions_paiement?.acompte || 30)) / 100);
  const montantSolde = devis.montant_ttc - montantAcompte;

  return (
    <DashboardLayout role="prestataire" userName={user?.email || ''} userRole="Prestataire">
      <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/prestataire/contrats')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux contrats
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Télécharger PDF
              </>
            )}
          </Button>
        </div>

        {/* Contrat Content */}
        <Card>
          <CardContent className="p-8" id="contrat-content">
            <div className="space-y-6">
              {/* En-tête */}
              <div className="text-center border-b-4 border-primary pb-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <FileText className="w-10 h-10 text-primary" />
                  <h1 className="text-3xl font-bold text-primary">CONTRAT DE PRESTATION</h1>
                </div>
                <p className="text-lg font-semibold">N° {contrat.numero}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Établi le {new Date(contrat.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>

              {/* Parties */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Client */}
                <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                  <h3 className="font-bold text-lg mb-3 text-blue-900">LE CLIENT</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-semibold">Nom:</span> {client?.full_name || 'N/A'}</p>
                    <p><span className="font-semibold">Email:</span> {client?.email || 'N/A'}</p>
                    {client?.phone && <p><span className="font-semibold">Téléphone:</span> {client.phone}</p>}
                  </div>
                </div>

                {/* Prestataire */}
                <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                  <h3 className="font-bold text-lg mb-3 text-green-900">LE PRESTATAIRE</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-semibold">Nom:</span> {prestataire?.full_name || 'N/A'}</p>
                    <p><span className="font-semibold">Profession:</span> {prestataire?.profession || 'N/A'}</p>
                    <p><span className="font-semibold">Email:</span> {prestataire?.email || 'N/A'}</p>
                    {prestataire?.phone && <p><span className="font-semibold">Téléphone:</span> {prestataire.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Objet du contrat */}
              <div>
                <h3 className="font-bold text-lg mb-3 border-b-2 border-gray-200 pb-2">ARTICLE 1 - OBJET DU CONTRAT</h3>
                <p className="text-sm leading-relaxed">
                  Le présent contrat a pour objet la réalisation de la prestation suivante : <strong>{devis.titre || 'Prestation de service'}</strong>
                </p>
                {devis.description && (
                  <p className="text-sm leading-relaxed mt-2 text-muted-foreground">
                    {devis.description}
                  </p>
                )}
              </div>

              {/* Conditions financières */}
              <div>
                <h3 className="font-bold text-lg mb-3 border-b-2 border-gray-200 pb-2">ARTICLE 2 - CONDITIONS FINANCIÈRES</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 font-semibold">Montant total de la prestation:</td>
                        <td className="py-2 text-right font-bold text-lg">{devis.montant_ttc.toLocaleString()} FC</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Acompte ({contrat.conditions_paiement?.acompte || 30}%):</td>
                        <td className="py-2 text-right">{montantAcompte.toLocaleString()} FC</td>
                      </tr>
                      <tr>
                        <td className="py-2">Solde ({contrat.conditions_paiement?.solde || 70}%):</td>
                        <td className="py-2 text-right">{montantSolde.toLocaleString()} FC</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modalités de paiement */}
              <div>
                <h3 className="font-bold text-lg mb-3 border-b-2 border-gray-200 pb-2">ARTICLE 3 - MODALITÉS DE PAIEMENT</h3>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>L'acompte de {contrat.conditions_paiement?.acompte || 30}% est payable à la signature du contrat</li>
                  <li>Le solde de {contrat.conditions_paiement?.solde || 70}% est payable à la fin des travaux</li>
                  <li>Les paiements sont effectués via mobile money (M-Pesa, Airtel Money, Orange Money)</li>
                </ul>
              </div>

              {/* Délais */}
              {devis.delai_execution && (
                <div>
                  <h3 className="font-bold text-lg mb-3 border-b-2 border-gray-200 pb-2">ARTICLE 4 - DÉLAIS D'EXÉCUTION</h3>
                  <p className="text-sm">
                    Le prestataire s'engage à réaliser la prestation dans un délai de <strong>{devis.delai_execution}</strong> 
                    à compter de la réception de l'acompte.
                  </p>
                </div>
              )}

              {/* Obligations */}
              <div>
                <h3 className="font-bold text-lg mb-3 border-b-2 border-gray-200 pb-2">ARTICLE 5 - OBLIGATIONS DES PARTIES</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold mb-1">Le prestataire s'engage à :</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Réaliser la prestation avec professionnalisme</li>
                      <li>Respecter les délais convenus</li>
                      <li>Informer le client de l'avancement des travaux</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Le client s'engage à :</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Payer les montants convenus aux échéances prévues</li>
                      <li>Fournir les informations nécessaires à la réalisation de la prestation</li>
                      <li>Faciliter l'accès au lieu de la prestation si nécessaire</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Litiges */}
              <div>
                <h3 className="font-bold text-lg mb-3 border-b-2 border-gray-200 pb-2">ARTICLE 6 - RÈGLEMENT DES LITIGES</h3>
                <p className="text-sm">
                  En cas de litige, les parties s'engagent à rechercher une solution amiable. 
                  À défaut, le litige sera soumis aux tribunaux compétents de Kinshasa.
                </p>
              </div>

              {/* Signatures */}
              <div className="grid md:grid-cols-2 gap-6 mt-8 pt-6 border-t-2">
                <div>
                  <p className="font-semibold mb-4">Signature du Client</p>
                  {contrat.signature_client_url ? (
                    <img 
                      src={contrat.signature_client_url} 
                      alt="Signature client" 
                      className="border-2 border-gray-300 rounded p-2 h-24 object-contain"
                    />
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded p-4 h-24 flex items-center justify-center text-muted-foreground">
                      En attente de signature
                    </div>
                  )}
                  {contrat.date_signature_client && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Signé le {new Date(contrat.date_signature_client).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>

                <div>
                  <p className="font-semibold mb-4">Signature du Prestataire</p>
                  {contrat.signature_prestataire_url ? (
                    <img 
                      src={contrat.signature_prestataire_url} 
                      alt="Signature prestataire" 
                      className="border-2 border-gray-300 rounded p-2 h-24 object-contain"
                    />
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded p-4 h-24 flex items-center justify-center text-muted-foreground">
                      En attente de signature
                    </div>
                  )}
                  {contrat.date_signature_prestataire && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Signé le {new Date(contrat.date_signature_prestataire).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-muted-foreground pt-6 border-t">
                <p>Document généré automatiquement par KaziPro</p>
                <p>Date de génération: {new Date().toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
