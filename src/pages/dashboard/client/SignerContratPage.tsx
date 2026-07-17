import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { devisApi, contratsApi, clientsApi, prestatairesApi } from "@/lib/api";
import {
  getClientDisplayName,
  getClientId,
  mapDevisToUi,
  mapPrestataireToUi,
  unwrapPaginated,
} from "@/lib/client-helpers";
import { toast } from "sonner";
import { SlideToConfirm } from "@/components/ui/SlideToConfirm";
import SignatureCanvas from "react-signature-canvas";
import { downloadContratPdf } from "@/lib/contrat-pdf";
import type { ContractData } from "@/lib/pdf-generator";
import { ContractDocument } from "@/components/contrat/ContractDocument";
import {
  CheckCircle2,
  ArrowLeft,
  Download,
  Pen,
  Loader,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DetailPageSkeleton } from "@/components/dashboard/AdminLoadingSkeleton";

function buildConditionsPaiement(contrat: Record<string, unknown>) {
  const montantTtc = Number(contrat.montant_ttc ?? 0);
  const acompteMontant = Number(contrat.acompte_montant ?? 0);
  const soldeMontant = Number(contrat.solde_montant ?? 0);
  const acomptePct =
    montantTtc > 0 ? Math.round((acompteMontant / montantTtc) * 100) : 30;
  return {
    acompte: acomptePct,
    solde: 100 - acomptePct,
    acompte_montant: acompteMontant,
    solde_montant: soldeMontant,
  };
}

function mapClientForUi(raw: Record<string, unknown> | null, displayName: string) {
  if (!raw) return { full_name: displayName };
  return {
    ...raw,
    full_name:
      displayName ||
      `${raw.prenom ?? ""} ${raw.nom ?? ""}`.trim() ||
      "Client",
  };
}

export default function SignerContratPage() {
  const { devisId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const clientName = getClientDisplayName(user);
  const signatureRef = useRef<SignatureCanvas | null>(null);

  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [contrat, setContrat] = useState<Record<string, unknown> | null>(null);
  const [devis, setDevis] = useState<Record<string, unknown> | null>(null);
  const [clientInfo, setClientInfo] = useState<Record<string, unknown> | null>(null);
  const [prestataireInfo, setPrestataireInfo] = useState<Record<string, unknown> | null>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [dejaSigne, setDejaSigne] = useState(false);
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchContrat();
  }, [devisId]);

  const isContratSigneParClient = (c: Record<string, unknown>) =>
    Boolean(
      c.signe_client_at ||
        ["signe_client", "actif"].includes(String(c.statut ?? "")),
    );

  const fetchContrat = async () => {
    try {
      setLoading(true);

      const rawDevis = await devisApi.getById(String(devisId));
      if (!rawDevis) {
        toast.error("Devis introuvable");
        navigate("/dashboard/client/demandes");
        return;
      }

      const mappedDevis = mapDevisToUi(rawDevis as Record<string, unknown>);
      setDevis(mappedDevis as Record<string, unknown>);

      let contratData =
        (rawDevis as { contrat?: Record<string, unknown> }).contrat ?? null;
      if (!contratData) {
        const all = unwrapPaginated(await contratsApi.getAll({ per_page: 100 }));
        contratData =
          (all.find(
            (c) => String((c as { devis_id?: unknown }).devis_id) === String(devisId),
          ) as Record<string, unknown> | undefined) ?? null;
      }

      if (!contratData) {
        toast.error("Contrat introuvable — acceptez d'abord le devis");
        navigate(`/dashboard/client/devis/${devisId}/accepter`);
        return;
      }

      setContrat(contratData);

      const clientId =
        getClientId(user) ||
        (contratData.client_id != null ? String(contratData.client_id) : null);
      const prestataireId =
        mappedDevis.prestataire_id ??
        contratData.prestataire_id ??
        (mappedDevis.prestataire as { id?: unknown } | undefined)?.id;

      const [clientData, prestataireData] = await Promise.all([
        clientId
          ? clientsApi.getById(String(clientId)).catch(() => null)
          : Promise.resolve(null),
        prestataireId
          ? prestatairesApi
              .getById(String(prestataireId))
              .catch(() => mappedDevis.prestataire ?? null)
          : Promise.resolve(mappedDevis.prestataire ?? null),
      ]);

      setClientInfo(mapClientForUi(clientData as Record<string, unknown> | null, clientName));
      if (prestataireData) {
        setPrestataireInfo(
          mapPrestataireToUi(prestataireData as Record<string, unknown>) as Record<
            string,
            unknown
          >,
        );
      }

      const signed = isContratSigneParClient(contratData);
      setDejaSigne(signed);
      if (signed && typeof contratData.signature_client_url === "string") {
        setSignaturePreviewUrl(contratData.signature_client_url);
      }
    } catch (error: unknown) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement du contrat");
    } finally {
      setLoading(false);
    }
  };

  const clearSignature = () => {
    signatureRef.current?.clear();
    setHasSignature(false);
  };

  const handleDownloadPDF = async () => {
    if (!contrat || !devis) return;

    const conditions = buildConditionsPaiement(contrat);

    try {
      setDownloading(true);
      const fallback: ContractData = {
        numero: String(contrat.numero ?? ""),
        date: new Date(contrat.created_at as string | number || Date.now()).toLocaleDateString(
          "fr-FR",
          { day: "2-digit", month: "long", year: "numeric" },
        ),
        devisNumero: String(devis.numero ?? ""),
        titre: String(devis.titre ?? devis.title ?? "Prestation de services"),
        description: devis.description as string | undefined,
        montantTotal: Number(devis.montant_ttc ?? 0),
        devise: String(devis.devise ?? "FC"),
        acomptePercent: conditions.acompte,
        soldePercent: conditions.solde,
        delaiExecution: devis.delai_execution as string | undefined,
        garantie: devis.garantie as string | undefined,
        client: {
          nom: String(clientInfo?.full_name ?? clientName),
          email: user?.email,
          telephone: (clientInfo?.telephone ?? clientInfo?.phone) as string | undefined,
          ville: (clientInfo?.ville ?? clientInfo?.city) as string | undefined,
          signature_url: contrat.signature_client_url as string | undefined,
          date_signature: contrat.signe_client_at
            ? new Date(String(contrat.signe_client_at)).toLocaleDateString("fr-FR")
            : undefined,
        },
        prestataire: {
          nom: String(prestataireInfo?.full_name ?? ""),
          telephone: (prestataireInfo?.telephone ?? prestataireInfo?.phone) as string | undefined,
          ville: (prestataireInfo?.ville ?? prestataireInfo?.city) as string | undefined,
          profession: prestataireInfo?.profession as string | undefined,
          signature_url: contrat.signature_prestataire_url as string | undefined,
          date_signature: contrat.signe_prestataire_at
            ? new Date(String(contrat.signe_prestataire_at)).toLocaleDateString("fr-FR")
            : undefined,
        },
      };
      const via = await downloadContratPdf(String(contrat.id), fallback, `contrat-${contrat.numero}.pdf`);
      toast.success(via === "api" ? "PDF téléchargé (serveur)" : "PDF téléchargé");
    } catch (error: unknown) {
      console.error("Erreur génération PDF:", error);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setDownloading(false);
    }
  };

  const handleSign = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error("Veuillez signer le contrat");
      return;
    }

    if (!contrat?.id) return;

    try {
      setSigning(true);

      const signatureDataUrl = signatureRef.current.toDataURL();
      await contratsApi.signer(String(contrat.id), {
        signature: signatureDataUrl,
      });

      toast.success("Contrat signé avec succès");
      navigate(`/dashboard/client/paiement/${contrat.id}/acompte`);
    } catch (error: unknown) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la signature");
      throw error;
    } finally {
      setSigning(false);
    }
  };

  const contratForDoc = contrat
    ? {
        ...contrat,
        conditions_paiement: buildConditionsPaiement(contrat),
        date_signature_client: contrat.signe_client_at,
        date_signature_prestataire: contrat.signe_prestataire_at,
      }
    : null;

  const acomptePct = contratForDoc?.conditions_paiement?.acompte ?? 30;

  if (loading) {
    return (
      <DashboardLayout role="client" userName={clientName} userRole="Client">
        <DetailPageSkeleton />
      </DashboardLayout>
    );
  }

  if (!contrat || !devis || !contratForDoc) {
    return (
      <DashboardLayout role="client" userName={clientName} userRole="Client">
        <div className="p-6 text-center text-muted-foreground">
          Contrat en cours de génération…
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="client" userName={clientName} userRole="Client">
      <div className="mx-auto max-w-2xl space-y-4 pb-28 sm:pb-8 sm:space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="-ml-2 mb-1 h-8 px-2"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Retour
            </Button>
            <h1 className="font-display text-xl font-bold sm:text-2xl">
              {dejaSigne ? "Votre contrat" : "Signature du contrat"}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {dejaSigne
                ? "Contrat signé — vous pouvez consulter le document et poursuivre le paiement."
                : `Lisez le contrat, signez, puis payez l'acompte (${acomptePct} %).`}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="shrink-0"
          >
            {downloading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Download className="mr-1.5 h-4 w-4" />
                PDF
              </>
            )}
          </Button>
        </div>

        <ContractDocument
          contrat={contratForDoc as Parameters<typeof ContractDocument>[0]["contrat"]}
          devis={devis as Parameters<typeof ContractDocument>[0]["devis"]}
          client={clientInfo as Parameters<typeof ContractDocument>[0]["client"]}
          prestataire={prestataireInfo as Parameters<typeof ContractDocument>[0]["prestataire"]}
          clientEmailFallback={user?.email}
          hideSignatures={!dejaSigne}
        />

        <div
          className={cn(
            "rounded-xl border bg-card shadow-sm",
            !dejaSigne &&
              "fixed inset-x-0 bottom-0 z-40 border-x-0 border-b-0 rounded-b-none p-4 sm:static sm:rounded-xl sm:border sm:p-5",
            dejaSigne && "p-5",
          )}
        >
          <div className="mx-auto max-w-2xl space-y-3">
            {dejaSigne ? (
              <>
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="text-sm font-semibold">
                    Contrat signé le{" "}
                    {contrat.signe_client_at
                      ? new Date(String(contrat.signe_client_at)).toLocaleDateString("fr-FR")
                      : "—"}
                  </p>
                </div>

                {signaturePreviewUrl ? (
                  <div className="rounded-lg border bg-white p-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Votre signature enregistrée
                    </p>
                    <img
                      src={signaturePreviewUrl}
                      alt="Signature client"
                      className="mx-auto h-20 max-w-full object-contain"
                    />
                  </div>
                ) : null}

                <Button
                  className="w-full"
                  size="sm"
                  onClick={() =>
                    navigate(`/dashboard/client/paiement/${contrat.id}/acompte`)
                  }
                >
                  Continuer vers le paiement de l&apos;acompte
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Pen className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">Votre signature</p>
                </div>

                <div className="overflow-hidden rounded-lg border-2 border-dashed bg-white">
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                      className: "h-28 w-full cursor-crosshair sm:h-36",
                      style: { touchAction: "none" },
                    }}
                    onEnd={() => setHasSignature(true)}
                  />
                </div>

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSignature}
                    disabled={!hasSignature}
                    className="shrink-0"
                  >
                    Effacer
                  </Button>
                  <SlideToConfirm
                    label="Signer le contrat et procéder au paiement de l'acompte"
                    hint="Glisser pour signer"
                    variant="success"
                    disabled={!hasSignature}
                    loading={signing}
                    successMessage="Contrat signé"
                    onConfirm={handleSign}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
