import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import SignatureCanvas from 'react-signature-canvas';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
  FileSignature, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  Download,
  Pen
} from 'lucide-react';

export default function SignerContratPage() {
  const { devisId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const signatureRef = useRef<any>(null);
  const contratRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [contrat, setContrat] = useState<any>(null);
  const [devis, setDevis] = useState<any>(null);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    fetchContrat();
  }, [devisId]);

  const fetchContrat = async () => {
    try {
      setLoading(true);
      
      // Essayer d'abord dans devis_pro (nouvelle table)
      let { data: devisData, error: devisError } = await supabase
        .from('devis_pro')
        .select('*')
        .eq('id', devisId)
        .maybeSingle();

      // Si pas trouvé dans devis_pro, essayer dans devis (ancienne table)
      if (!devisData) {
        const { data: oldDevisData, error: oldDevisError } = await supabase
          .from('devis')
          .select('*')
          .eq('id', devisId)
          .maybeSingle();

        if (oldDevisError) throw oldDevisError;
        devisData = oldDevisData;
      }

      if (devisError && devisError.code !== 'PGRST116') throw devisError;
      
      if (!devisData) {
        toast.error('Devis introuvable');
        navigate('/dashboard/client/demandes');
        return;
      }
      
      setDevis(devisData);

      // Récupérer le contrat
      const { data: contratData, error: contratError } = await supabase
        .from('contrats')
        .select('*')
        .eq('devis_id', devisId)
        .maybeSingle();

      if (contratData) {
        setContrat(contratData);
      } else {
        // Le contrat n'existe pas, le créer automatiquement
        console.log('Contrat inexistant, création automatique...');
        await createContrat(devisData);
      }

    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement du contrat');
    } finally {
      setLoading(false);
    }
  };

  const createContrat = async (devisData: any) => {
    try {
      const numero = `CTR-${Date.now()}`;
      const montantAcompte = Math.round(devisData.montant_ttc * 0.30);
      const montantSolde = Math.round(devisData.montant_ttc * 0.70);
      
      // Récupérer le client_id depuis le profil de l'utilisateur connecté
      let clientId = devisData.client_id;
      
      if (!clientId) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('id, full_name, email, city')
          .eq('user_id', user?.id)
          .maybeSingle();
        
        clientId = clientData?.id;
      }
      
      // Récupérer les informations complètes du client et du prestataire
      const { data: clientInfo } = await supabase
        .from('clients')
        .select('full_name, email, city, phone')
        .eq('id', clientId)
        .maybeSingle();

      const { data: prestataireInfo } = await supabase
        .from('prestataires')
        .select('full_name, email, phone, profession, city')
        .eq('id', devisData.prestataire_id)
        .maybeSingle();
      
      // Si toujours pas de client_id, on ne peut pas créer le contrat
      if (!clientId) {
        throw new Error('Impossible de déterminer le client_id');
      }
      
      const contenuHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; background: white; color: #333;">
          <!-- En-tête -->
          <div style="text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #2563eb; font-size: 32px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 2px;">
              Contrat de Prestation de Services
            </h1>
            <p style="color: #64748b; font-size: 14px; margin: 5px 0;">
              Contrat N° <strong>${numero}</strong>
            </p>
            <p style="color: #64748b; font-size: 14px; margin: 5px 0;">
              Date d'établissement: <strong>${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
            </p>
          </div>

          <!-- Parties contractantes -->
          <div style="margin: 30px 0;">
            <h2 style="color: #1e40af; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px;">
              Entre les soussignés
            </h2>
            
            <div style="background: #f8fafc; padding: 20px; border-left: 4px solid #2563eb; margin-bottom: 20px; border-radius: 4px;">
              <h3 style="color: #2563eb; font-size: 16px; margin: 0 0 15px 0;">Le Prestataire</h3>
              <p style="margin: 5px 0; line-height: 1.6;">
                <strong>Nom:</strong> ${prestataireInfo?.full_name || 'N/A'}<br/>
                <strong>Profession:</strong> ${prestataireInfo?.profession || 'N/A'}<br/>
                <strong>Email:</strong> ${prestataireInfo?.email || 'N/A'}<br/>
                ${prestataireInfo?.phone ? `<strong>Téléphone:</strong> ${prestataireInfo.phone}<br/>` : ''}
                ${prestataireInfo?.city ? `<strong>Ville:</strong> ${prestataireInfo.city}` : ''}
              </p>
              <p style="margin-top: 10px; font-style: italic; color: #64748b; font-size: 14px;">
                Ci-après dénommé "le Prestataire"
              </p>
            </div>

            <div style="background: #f8fafc; padding: 20px; border-left: 4px solid #10b981; margin-bottom: 20px; border-radius: 4px;">
              <h3 style="color: #10b981; font-size: 16px; margin: 0 0 15px 0;">Le Client</h3>
              <p style="margin: 5px 0; line-height: 1.6;">
                <strong>Nom:</strong> ${clientInfo?.full_name || 'N/A'}<br/>
                <strong>Email:</strong> ${clientInfo?.email || 'N/A'}<br/>
                ${clientInfo?.phone ? `<strong>Téléphone:</strong> ${clientInfo.phone}<br/>` : ''}
                ${clientInfo?.city ? `<strong>Ville:</strong> ${clientInfo.city}` : ''}
              </p>
              <p style="margin-top: 10px; font-style: italic; color: #64748b; font-size: 14px;">
                Ci-après dénommé "le Client"
              </p>
            </div>
          </div>

          <!-- Objet du contrat -->
          <div style="margin: 30px 0;">
            <h2 style="color: #1e40af; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px;">
              Article 1 - Objet du contrat
            </h2>
            <p style="line-height: 1.8; text-align: justify;">
              Le présent contrat a pour objet la réalisation des prestations de services décrites dans le devis 
              N° <strong>${devisData.numero || 'N/A'}</strong> accepté par le Client le 
              <strong>${devisData.date_acceptation ? new Date(devisData.date_acceptation).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</strong>.
            </p>
            ${devisData.description ? `
              <div style="background: #fef3c7; padding: 15px; border-radius: 4px; margin-top: 15px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; line-height: 1.6;"><strong>Description des travaux:</strong></p>
                <p style="margin: 10px 0 0 0; line-height: 1.6;">${devisData.description}</p>
              </div>
            ` : ''}
          </div>

          <!-- Montant et modalités de paiement -->
          <div style="margin: 30px 0;">
            <h2 style="color: #1e40af; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px;">
              Article 2 - Montant et modalités de paiement
            </h2>
            
            <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="font-size: 18px; margin: 0 0 15px 0; color: #1e40af;">
                <strong>Montant total des prestations:</strong>
              </p>
              <p style="font-size: 32px; font-weight: bold; color: #2563eb; margin: 0;">
                ${devisData.montant_ttc.toLocaleString()} ${devisData.devise || 'FC'}
              </p>
            </div>

            <p style="line-height: 1.8; margin: 20px 0;">
              Le paiement s'effectuera selon les modalités suivantes:
            </p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="padding: 12px; text-align: left; border: 1px solid #e2e8f0;">Échéance</th>
                  <th style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">Montant</th>
                  <th style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">Pourcentage</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 12px; border: 1px solid #e2e8f0;">
                    <strong>Acompte</strong><br/>
                    <span style="font-size: 14px; color: #64748b;">Payable avant le début des travaux</span>
                  </td>
                  <td style="padding: 12px; text-align: right; border: 1px solid #e2e8f0; font-weight: bold; color: #2563eb;">
                    ${montantAcompte.toLocaleString()} ${devisData.devise || 'FC'}
                  </td>
                  <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0; font-weight: bold;">
                    30%
                  </td>
                </tr>
                <tr style="background: #f8fafc;">
                  <td style="padding: 12px; border: 1px solid #e2e8f0;">
                    <strong>Solde</strong><br/>
                    <span style="font-size: 14px; color: #64748b;">Payable après validation des travaux</span>
                  </td>
                  <td style="padding: 12px; text-align: right; border: 1px solid #e2e8f0; font-weight: bold; color: #10b981;">
                    ${montantSolde.toLocaleString()} ${devisData.devise || 'FC'}
                  </td>
                  <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0; font-weight: bold;">
                    70%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Délais et garanties -->
          <div style="margin: 30px 0;">
            <h2 style="color: #1e40af; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px;">
              Article 3 - Délais d'exécution et garanties
            </h2>
            <ul style="line-height: 2; padding-left: 20px;">
              ${devisData.delai_intervention ? `<li><strong>Délai d'intervention:</strong> ${devisData.delai_intervention}</li>` : ''}
              ${devisData.delai_execution ? `<li><strong>Durée des travaux:</strong> ${devisData.delai_execution}</li>` : ''}
              ${devisData.garantie ? `<li><strong>Garantie:</strong> ${devisData.garantie}</li>` : ''}
              <li><strong>Délai de validation:</strong> 7 jours après achèvement des travaux</li>
            </ul>
          </div>

          <!-- Obligations des parties -->
          <div style="margin: 30px 0;">
            <h2 style="color: #1e40af; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px;">
              Article 4 - Obligations des parties
            </h2>
            
            <h3 style="color: #2563eb; font-size: 16px; margin: 20px 0 10px 0;">4.1 - Obligations du Prestataire</h3>
            <ul style="line-height: 2; padding-left: 20px;">
              <li>Réaliser les prestations conformément au devis accepté</li>
              <li>Respecter les délais convenus</li>
              <li>Informer le Client de l'avancement des travaux</li>
              <li>Garantir la qualité des travaux réalisés</li>
            </ul>

            <h3 style="color: #10b981; font-size: 16px; margin: 20px 0 10px 0;">4.2 - Obligations du Client</h3>
            <ul style="line-height: 2; padding-left: 20px;">
              <li>Payer l'acompte avant le début des travaux</li>
              <li>Faciliter l'accès au lieu d'intervention</li>
              <li>Valider ou signaler les réserves dans les 7 jours suivant l'achèvement</li>
              <li>Payer le solde après validation des travaux</li>
            </ul>
          </div>

          <!-- Résiliation et litiges -->
          <div style="margin: 30px 0;">
            <h2 style="color: #1e40af; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px;">
              Article 5 - Résiliation et litiges
            </h2>
            <p style="line-height: 1.8; text-align: justify;">
              En cas de litige, les parties s'engagent à rechercher une solution amiable via la plateforme KaziPro. 
              À défaut d'accord, le litige sera soumis aux tribunaux compétents de Kinshasa.
            </p>
          </div>

          <!-- Signatures -->
          <div style="margin: 50px 0 30px 0; page-break-inside: avoid;">
            <h2 style="color: #1e40af; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 30px;">
              Signatures
            </h2>
            
            <div style="display: table; width: 100%; margin-top: 40px;">
              <div style="display: table-cell; width: 48%; vertical-align: top; padding-right: 2%;">
                <div style="border: 2px dashed #cbd5e1; padding: 20px; min-height: 150px; border-radius: 8px; background: #f8fafc;">
                  <p style="margin: 0 0 10px 0; font-weight: bold; color: #2563eb;">Le Prestataire</p>
                  <p style="margin: 0; font-size: 14px; color: #64748b;">
                    ${prestataireInfo?.full_name || 'N/A'}
                  </p>
                  <p style="margin: 40px 0 0 0; font-size: 12px; color: #94a3b8; font-style: italic;">
                    Signature électronique à apposer
                  </p>
                </div>
              </div>
              
              <div style="display: table-cell; width: 48%; vertical-align: top; padding-left: 2%;">
                <div style="border: 2px dashed #cbd5e1; padding: 20px; min-height: 150px; border-radius: 8px; background: #f8fafc;">
                  <p style="margin: 0 0 10px 0; font-weight: bold; color: #10b981;">Le Client</p>
                  <p style="margin: 0; font-size: 14px; color: #64748b;">
                    ${clientInfo?.full_name || 'N/A'}
                  </p>
                  <p style="margin: 40px 0 0 0; font-size: 12px; color: #94a3b8; font-style: italic;">
                    Signature électronique à apposer
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Pied de page -->
          <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #94a3b8; font-size: 12px;">
            <p style="margin: 5px 0;">
              <strong>KaziPro</strong> - Plateforme de mise en relation professionnelle
            </p>
            <p style="margin: 5px 0;">
              Kinshasa, République Démocratique du Congo
            </p>
            <p style="margin: 5px 0;">
              Document généré électroniquement le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
            </p>
          </div>
        </div>
      `;

      const { data: newContrat, error: createError } = await supabase
        .from('contrats')
        .insert({
          numero,
          devis_id: devisId,
          client_id: clientId,
          prestataire_id: devisData.prestataire_id,
          contenu_html: contenuHtml,
          statut: 'genere',
          conditions_paiement: {
            type: 'acompte_solde',
            acompte: 30,
            solde: 70,
            delai_validation: 7
          }
        })
        .select()
        .single();

      if (createError) throw createError;
      
      setContrat(newContrat);
      toast.success('Contrat généré avec succès!');
    } catch (error: any) {
      console.error('Erreur création contrat:', error);
      toast.error('Erreur lors de la génération du contrat');
    }
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setHasSignature(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!contratRef.current) {
      toast.error('Contrat non disponible');
      return;
    }

    try {
      setDownloading(true);
      toast.info('Génération du PDF en cours...');

      // Capturer le contenu HTML en canvas
      const canvas = await html2canvas(contratRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Calculer les dimensions pour le PDF
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      // Créer le PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Convertir le canvas en image
      const imgData = canvas.toDataURL('image/png');

      // Ajouter la première page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Ajouter des pages supplémentaires si nécessaire
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Télécharger le PDF
      const fileName = `Contrat_${contrat.numero}_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);

      toast.success('PDF téléchargé avec succès!');
    } catch (error: any) {
      console.error('Erreur génération PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleSign = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error('Veuillez signer le contrat');
      return;
    }

    try {
      setSigning(true);

      // Convertir la signature en base64
      const signatureDataUrl = signatureRef.current.toDataURL();
      
      // Convertir en blob pour upload
      const response = await fetch(signatureDataUrl);
      const blob = await response.blob();
      
      // Upload de la signature
      const fileName = `signature-client-${contrat.id}-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('signatures')
        .getPublicUrl(fileName);

      // Mettre à jour le contrat
      const { error: updateError } = await supabase
        .from('contrats')
        .update({
          signature_client_url: publicUrl,
          date_signature_client: new Date().toISOString(),
          statut: 'signe_client',
          updated_at: new Date().toISOString()
        })
        .eq('id', contrat.id);

      if (updateError) throw updateError;

      toast.success('Contrat signé avec succès!');
      
      // Rediriger vers la page de paiement de l'acompte
      navigate(`/dashboard/client/paiement/${contrat.id}/acompte`);

    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la signature');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="client" userName={user?.email || ''} userRole="Client">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Génération du contrat...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!contrat) {
    return (
      <DashboardLayout role="client" userName={user?.email || ''} userRole="Client">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Le contrat est en cours de génération. Veuillez patienter...
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="client" userName={user?.email || ''} userRole="Client">
      <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-5xl">
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
            <h1 className="text-3xl font-bold">Signature du contrat</h1>
            <p className="text-muted-foreground mt-1">
              Contrat N° {contrat.numero}
            </p>
          </div>
        </div>

        {/* Alert info */}
        <Alert>
          <FileSignature className="h-4 w-4" />
          <AlertDescription>
            Veuillez lire attentivement le contrat avant de le signer. 
            Votre signature engage votre responsabilité.
          </AlertDescription>
        </Alert>

        {/* Contrat */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Contrat de prestation</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownloadPDF}
                disabled={downloading}
              >
                {downloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
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
          </CardHeader>
          <CardContent>
            <div 
              ref={contratRef}
              className="prose max-w-none p-6 bg-white border rounded-lg"
              dangerouslySetInnerHTML={{ __html: contrat.contenu_html }}
            />
          </CardContent>
        </Card>

        {/* Zone de signature */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pen className="w-5 h-5" />
              Votre signature
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white">
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  className: 'w-full h-48 cursor-crosshair',
                  style: { touchAction: 'none' }
                }}
                onEnd={() => setHasSignature(true)}
              />
            </div>
            
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={clearSignature}
                disabled={!hasSignature}
              >
                Effacer
              </Button>
              <Button
                onClick={handleSign}
                disabled={!hasSignature || signing}
                className="flex-1"
                size="lg"
              >
                {signing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signature en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Signer et continuer vers le paiement
                  </>
                )}
              </Button>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-900">
                <strong>Prochaine étape:</strong> Après la signature, vous serez redirigé 
                vers la page de paiement de l'acompte ({contrat.conditions_paiement?.acompte || 30}%).
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
