import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ContractParty {
  full_name?: string;
  nom?: string;
  prenom?: string;
  email?: string;
  phone?: string;
  telephone?: string;
  city?: string;
  ville?: string;
  profession?: string;
}

export interface ContractDocumentProps {
  contrat: {
    numero: string;
    created_at?: string;
    montant_ttc?: number;
    acompte_montant?: number;
    solde_montant?: number;
    conditions_paiement?: { acompte?: number; solde?: number };
    signature_client_url?: string;
    signature_prestataire_url?: string;
    date_signature_client?: string;
    date_signature_prestataire?: string;
  };
  devis: {
    numero?: string;
    titre?: string;
    title?: string;
    description?: string;
    montant_ttc?: number;
    montant?: number;
    amount?: number;
    acompte_pourcentage?: number;
    devise?: string;
    delai_execution?: string;
    delai_intervention?: string;
    garantie?: string;
    date_acceptation?: string;
  };
  client?: ContractParty | null;
  prestataire?: ContractParty | null;
  /** Email de secours (ex. session auth) si absent du profil client */
  clientEmailFallback?: string;
  /** Masque la zone signatures du document (signature gérée en dehors) */
  hideSignatures?: boolean;
  className?: string;
  id?: string;
}

function partyName(party?: ContractParty | null, emailFallback?: string): string {
  if (party?.full_name?.trim()) return party.full_name.trim();
  const fromParts = [party?.prenom, party?.nom].filter(Boolean).join(" ").trim();
  if (fromParts) return fromParts;
  if (emailFallback) return emailFallback.split("@")[0];
  return "—";
}

function partyEmail(party?: ContractParty | null, emailFallback?: string): string | undefined {
  return party?.email?.trim() || emailFallback;
}

function partyCity(party?: ContractParty | null): string | undefined {
  return party?.ville || party?.city;
}

function partyPhone(party?: ContractParty | null): string | undefined {
  return party?.telephone || party?.phone;
}

function cleanDescription(text?: string): string {
  if (!text) return "";
  return text
    .replace(
      /^(-\s*)?Je propose de réaliser les travaux suivants pour votre demande\s*:\s*/gi,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function formatDate(value?: string) {
  if (!value) return new Date().toLocaleDateString("fr-FR");
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMoney(amount: number, devise = "FC") {
  return `${Number(amount).toLocaleString("fr-FR")} ${devise}`;
}

export function ContractDocument({
  contrat,
  devis,
  client,
  prestataire,
  clientEmailFallback,
  hideSignatures = false,
  className,
  id,
}: ContractDocumentProps) {
  const [legalOpen, setLegalOpen] = useState(false);

  const titre = devis.titre || devis.title || "Prestation de services";
  const description = cleanDescription(devis.description);
  const devise = devis.devise || "FC";
  const ttc = Number(
    devis.montant_ttc ?? devis.montant ?? devis.amount ?? 0,
  );
  const acomptePct = Number(
    devis.acompte_pourcentage ?? contrat.conditions_paiement?.acompte ?? 30,
  );
  const soldePct = 100 - acomptePct;
  const montantAcompte = Number(
    (contrat as { acompte_montant?: number }).acompte_montant
      ?? Math.round((ttc * acomptePct) / 100),
  );
  const montantSolde = Number(
    (contrat as { solde_montant?: number }).solde_montant ?? ttc - montantAcompte,
  );
  const delai =
    devis.delai_execution || devis.delai_intervention || null;

  const clientName = partyName(client, clientEmailFallback);
  const clientEmail = partyEmail(client, clientEmailFallback);
  const clientCity = partyCity(client);
  const clientPhone = partyPhone(client);
  const prestataireName = partyName(prestataire);
  const prestataireEmail = partyEmail(prestataire);
  const prestataireCity = partyCity(prestataire);

  return (
    <article
      id={id}
      className={cn(
        "rounded-xl border bg-card text-sm leading-relaxed text-foreground shadow-sm",
        className,
      )}
    >
      {/* En-tête */}
      <header className="border-b px-4 py-5 text-center sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          KaziPro
        </p>
        <h2 className="mt-1 font-display text-lg font-bold sm:text-xl">
          Contrat de prestation
        </h2>
        <p className="mt-2 text-xs text-muted-foreground">
          N° {contrat.numero}
          {devis.numero ? ` · Devis ${devis.numero}` : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(contrat.created_at)}
        </p>
      </header>

      {/* Résumé financier */}
      <div className="grid grid-cols-3 divide-x border-b bg-muted/30">
        <div className="px-3 py-3 text-center sm:px-4 sm:py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Total
          </p>
          <p className="mt-0.5 font-display text-sm font-bold tabular-nums sm:text-base">
            {formatMoney(ttc, devise)}
          </p>
        </div>
        <div className="px-3 py-3 text-center sm:px-4 sm:py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Acompte
          </p>
          <p className="mt-0.5 font-display text-sm font-bold tabular-nums text-primary sm:text-base">
            {formatMoney(montantAcompte, devise)}
          </p>
          <p className="text-[10px] text-muted-foreground">{acomptePct}%</p>
        </div>
        <div className="px-3 py-3 text-center sm:px-4 sm:py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Solde
          </p>
          <p className="mt-0.5 font-display text-sm font-bold tabular-nums sm:text-base">
            {formatMoney(montantSolde, devise)}
          </p>
          <p className="text-[10px] text-muted-foreground">{soldePct}%</p>
        </div>
      </div>

      <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-6">
        {/* Parties */}
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Parties
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                Prestataire
              </p>
              <p className="mt-1 font-medium">{prestataireName}</p>
              {prestataire?.profession && (
                <p className="text-xs text-muted-foreground">
                  {prestataire.profession}
                </p>
              )}
              {prestataireEmail && (
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {prestataireEmail}
                </p>
              )}
              {prestataireCity && (
                <p className="text-xs text-muted-foreground">{prestataireCity}</p>
              )}
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                Client
              </p>
              <p className="mt-1 font-medium">{clientName}</p>
              {clientEmail && (
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {clientEmail}
                </p>
              )}
              {clientCity && (
                <p className="text-xs text-muted-foreground">{clientCity}</p>
              )}
              {clientPhone && (
                <p className="text-xs text-muted-foreground">{clientPhone}</p>
              )}
            </div>
          </div>
        </section>

        {/* Objet */}
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Objet
          </h3>
          <p className="font-medium">{titre}</p>
          {description && (
            <p className="mt-2 text-muted-foreground">{description}</p>
          )}
        </section>

        {/* Paiement */}
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Paiement
          </h3>
          <ul className="space-y-1.5 text-muted-foreground">
            <li>
              • Acompte de {acomptePct}% ({formatMoney(montantAcompte, devise)})
              à la signature, avant le début des travaux.
            </li>
            <li>
              • Solde de {soldePct}% ({formatMoney(montantSolde, devise)})
              via KaziPro, avant validation des travaux.
            </li>
          </ul>
        </section>

        {delai && (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Délais
            </h3>
            <p className="text-muted-foreground">
              Exécution prévue : <span className="font-medium text-foreground">{delai}</span>
              {devis.garantie ? ` · Garantie : ${devis.garantie}` : ""}
            </p>
          </section>
        )}

        {/* Conditions légales repliables */}
        <Collapsible open={legalOpen} onOpenChange={setLegalOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50">
            Conditions générales et obligations
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                legalOpen && "rotate-180",
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-3 rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
            <p>
              Le prestataire réalise la prestation conformément au devis accepté,
              dans les délais convenus et avec le professionnalisme requis.
            </p>
            <p>
              Le client paie aux échéances prévues, facilite l&apos;accès au lieu
              d&apos;intervention et signale ses réserves dans les 7 jours suivant
              l&apos;achèvement des travaux.
            </p>
            <p>
              En cas de litige, les parties recherchent une solution amiable via
              KaziPro. À défaut, le litige est soumis aux tribunaux compétents de
              Kinshasa.
            </p>
          </CollapsibleContent>
        </Collapsible>

        {/* Signatures (vue seulement) */}
        {!hideSignatures &&
          (contrat.signature_client_url ||
            contrat.signature_prestataire_url) && (
            <section className="border-t pt-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Signatures
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {contrat.signature_client_url && (
                  <div>
                    <p className="mb-2 text-xs font-medium">Client</p>
                    <img
                      src={contrat.signature_client_url}
                      alt="Signature client"
                      className="h-16 rounded border bg-white object-contain p-1"
                    />
                    {contrat.date_signature_client && (
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {formatDate(contrat.date_signature_client)}
                      </p>
                    )}
                  </div>
                )}
                {contrat.signature_prestataire_url && (
                  <div>
                    <p className="mb-2 text-xs font-medium">Prestataire</p>
                    <img
                      src={contrat.signature_prestataire_url}
                      alt="Signature prestataire"
                      className="h-16 rounded border bg-white object-contain p-1"
                    />
                    {contrat.date_signature_prestataire && (
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {formatDate(contrat.date_signature_prestataire)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}
      </div>

      <footer className="border-t px-4 py-3 text-center text-[10px] text-muted-foreground sm:px-6">
        Document généré électroniquement par KaziPro · Kinshasa, RDC
      </footer>
    </article>
  );
}
