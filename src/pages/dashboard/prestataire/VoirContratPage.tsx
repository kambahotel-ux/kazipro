import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { contratsApi, devisApi, prestatairesApi } from "@/lib/api";
import { displayNameFromProfil } from "@/lib/kazipro-profile";
import { downloadContratPdf } from "@/lib/contrat-pdf";
import type { ContractData } from "@/lib/pdf-generator";
import { ContractDocument } from "@/components/contrat/ContractDocument";
import { toast } from "sonner";
import { ArrowLeft, Download, Loader, AlertCircle } from "lucide-react";
import { DetailPageSkeleton } from "@/components/dashboard/AdminLoadingSkeleton";

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
      const contratData = await contratsApi.getById(String(contratId));
      if (!contratData) {
        toast.error("Contrat introuvable");
        navigate("/dashboard/prestataire/chantiers/contrats");
        return;
      }
      setContrat(contratData);
      setClient(contratData.client ?? null);
      setPrestataire(contratData.prestataire ?? null);
      if (contratData.devis_id) {
        const devisData = await devisApi.getById(String(contratData.devis_id));
        setDevis(devisData);
      }
    } catch (error: unknown) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement du contrat");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!contrat || !devis) return;

    try {
      setDownloading(true);

      const fallback: ContractData = {
        numero: contrat.numero,
        date: new Date(contrat.created_at || Date.now()).toLocaleDateString(
          "fr-FR",
          { day: "2-digit", month: "long", year: "numeric" },
        ),
        devisNumero: devis.numero,
        titre: devis.titre || "Prestation de services",
        description: devis.description,
        montantTotal: devis.montant_ttc || 0,
        devise: devis.devise || "FC",
        acomptePercent: contrat.conditions_paiement?.acompte || 30,
        soldePercent: contrat.conditions_paiement?.solde || 70,
        delaiExecution: devis.delai_execution,
        garantie: devis.garantie,
        client: {
          nom:
            client?.full_name ||
            [client?.prenom, client?.nom].filter(Boolean).join(" "),
          telephone: client?.telephone,
          ville: client?.ville,
          signature_url: contrat.signature_client_url,
          date_signature: contrat.date_signature_client
            ? new Date(contrat.date_signature_client).toLocaleDateString("fr-FR")
            : undefined,
        },
        prestataire: {
          nom: prestataire?.full_name,
          email: prestataire?.email,
          telephone: prestataire?.telephone,
          ville: prestataire?.ville,
          profession: prestataire?.profession,
          signature_url: contrat.signature_prestataire_url,
          date_signature: contrat.date_signature_prestataire
            ? new Date(contrat.date_signature_prestataire).toLocaleDateString(
                "fr-FR",
              )
            : undefined,
        },
      };

      const via = await downloadContratPdf(String(contratId), fallback, `contrat-${contrat.numero}.pdf`);
      toast.success(via === "api" ? "Contrat téléchargé (PDF serveur)" : "Contrat téléchargé (PDF local)");
    } catch (error: unknown) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        role="prestataire"
        userName={user?.email || ""}
        userRole="Prestataire"
      >
        <DetailPageSkeleton />
      </DashboardLayout>
    );
  }

  if (!contrat || !devis) {
    return (
      <DashboardLayout
        role="prestataire"
        userName={user?.email || ""}
        userRole="Prestataire"
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Contrat introuvable</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="prestataire"
      userName={user?.email || ""}
      userRole="Prestataire"
    >
      <div className="mx-auto max-w-2xl space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard/prestataire/chantiers/contrats")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <Button onClick={handleDownloadPDF} disabled={downloading} size="sm">
            {downloading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                PDF
              </>
            )}
          </Button>
        </div>

        <ContractDocument
          contrat={contrat}
          devis={devis}
          client={client}
          prestataire={prestataire}
        />
      </div>
    </DashboardLayout>
  );
}
