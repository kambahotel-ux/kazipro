import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateDevisPDF } from '@/lib/pdf-generator';
import { toast } from 'sonner';

interface DevisItem {
  designation: string;
  quantite: number;
  prix_unitaire: number;
  montant: number;
}

interface GeneratePDFButtonProps {
  devisId: string;
  devisNumero: string;
  prestataireId: string;
  clientId?: string;
  items: DevisItem[];
  montantHT: number;
  tva?: number;
  montantTTC: number;
  devise: string;
  titre?: string;
  delaiExecution?: string;
  conditionsPaiement?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function GeneratePDFButton({
  devisId,
  devisNumero,
  prestataireId,
  clientId,
  items,
  montantHT,
  tva,
  montantTTC,
  devise,
  titre,
  delaiExecution,
  conditionsPaiement,
  variant = 'outline',
  size = 'default'
}: GeneratePDFButtonProps) {
  const [generating, setGenerating] = useState(false);

  const handleGeneratePDF = async () => {
    try {
      setGenerating(true);

      // 1. Récupérer les infos entreprise du prestataire
      const { data: entrepriseData, error: entrepriseError } = await supabase
        .from('entreprise_info')
        .select('*')
        .eq('prestataire_id', prestataireId)
        .maybeSingle();

      if (entrepriseError && entrepriseError.code !== 'PGRST116') {
        throw entrepriseError;
      }

      // 2. Récupérer les infos du prestataire (fallback si pas d'entreprise_info)
      const { data: prestataireData } = await supabase
        .from('prestataires')
        .select('full_name')
        .eq('id', prestataireId)
        .maybeSingle();

      // 3. Récupérer les infos du client
      let clientInfo = {
        nom: 'Client',
        adresse: '',
        ville: ''
      };

      if (clientId) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('full_name, address, city')
          .eq('id', clientId)
          .maybeSingle();

        if (clientData) {
          clientInfo = {
            nom: clientData.full_name || 'Client',
            adresse: clientData.address || '',
            ville: clientData.city || ''
          };
        }
      }

      // 4. Préparer les données pour le PDF
      const pdfData = {
        numero: devisNumero,
        date: new Date().toLocaleDateString('fr-FR'),
        entreprise: {
          nom_entreprise: entrepriseData?.nom_entreprise || prestataireData?.full_name || 'Prestataire',
          logo_url: entrepriseData?.logo_url,
          adresse: entrepriseData?.adresse,
          ville: entrepriseData?.ville,
          telephone: entrepriseData?.telephone,
          email_professionnel: entrepriseData?.email_professionnel,
          numero_fiscal: entrepriseData?.numero_fiscal,
          conditions_generales: entrepriseData?.conditions_generales
        },
        client: clientInfo,
        items: items.map(item => ({
          description: item.designation,
          quantite: item.quantite,
          prix_unitaire: item.prix_unitaire,
          montant: item.montant
        })),
        montant_ht: montantHT,
        tva: tva,
        montant_ttc: montantTTC,
        devise: devise,
        delai_execution: delaiExecution,
        conditions_paiement: conditionsPaiement
      };

      // 5. Générer le PDF
      await generateDevisPDF(pdfData);

      toast.success('PDF généré avec succès');
    } catch (error: any) {
      console.error('Erreur génération PDF:', error);
      toast.error(error.message || 'Erreur lors de la génération du PDF');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleGeneratePDF}
      disabled={generating}
    >
      {generating ? (
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
  );
}
