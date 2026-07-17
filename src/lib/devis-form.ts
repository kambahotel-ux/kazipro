export type DevisDevise = 'CDF' | 'USD';

export const DEVISE_OPTIONS: { value: DevisDevise; label: string }[] = [
  { value: 'CDF', label: 'Franc congolais (CDF)' },
  { value: 'USD', label: 'Dollar US (USD)' },
];

export type DevisLigneType =
  | 'main_oeuvre'
  | 'transport'
  | 'fourniture'
  | 'forfait'
  | 'autre';

export interface DevisLigneForm {
  id: string;
  type_ligne: DevisLigneType;
  designation: string;
  quantite: number;
  unite: string;
  prix_unitaire: number;
}

export const DEVIS_LIGNE_TYPES: DevisLigneType[] = [
  'main_oeuvre',
  'transport',
  'fourniture',
  'forfait',
  'autre',
];

export const TYPE_LIGNE_LABEL: Record<DevisLigneType, string> = {
  main_oeuvre: "Main d'œuvre",
  transport: 'Transport / déplacement',
  fourniture: 'Fourniture',
  forfait: 'Forfait',
  autre: 'Autre',
};

export function ligneTotal(ligne: DevisLigneForm): number {
  return ligne.quantite * ligne.prix_unitaire;
}

export function sumByType(lignes: DevisLigneForm[], type: DevisLigneType): number {
  return lignes
    .filter((l) => l.type_ligne === type)
    .reduce((sum, l) => sum + ligneTotal(l), 0);
}

export function computeDevisTotals(lignes: DevisLigneForm[], tvaPercent: number) {
  const montantHt = lignes.reduce((sum, l) => sum + ligneTotal(l), 0);
  const tva = Number.isFinite(tvaPercent) ? tvaPercent : 0;
  const montantTva = montantHt * (tva / 100);
  const montantTtc = montantHt + montantTva;
  const mainOeuvreHt = sumByType(lignes, 'main_oeuvre');
  const mainOeuvreTtc = mainOeuvreHt * (1 + tva / 100);

  return {
    montantHt,
    montantTva,
    montantTtc,
    mainOeuvreHt,
    mainOeuvreTtc,
    transportHt: sumByType(lignes, 'transport'),
    fournitureHt: sumByType(lignes, 'fourniture'),
  };
}

/** Acompte = % appliqué uniquement sur la main d'œuvre TTC (règle métier KaziPro). */
export function computeAcompte(
  mainOeuvreTtc: number,
  montantTtc: number,
  pourcentage: number,
  actif: boolean
) {
  if (!actif || pourcentage <= 0) {
    return { montantAcompte: 0, montantSolde: montantTtc };
  }
  const montantAcompte = Math.round(mainOeuvreTtc * (pourcentage / 100) * 100) / 100;
  const montantSolde = Math.round((montantTtc - montantAcompte) * 100) / 100;
  return { montantAcompte, montantSolde };
}

export function createEmptyLigne(type: DevisLigneType = 'main_oeuvre'): DevisLigneForm {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type_ligne: type,
    designation: '',
    quantite: 1,
    unite: type === 'main_oeuvre' ? 'forfait' : 'unité',
    prix_unitaire: 0,
  };
}

export function parseDecimalInput(raw: string, fallback = 0): number {
  const parsed = parseFloat(raw.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function formatMontant(value: number, devise: DevisDevise | string = 'CDF'): string {
  const hasDecimals = Math.abs(value % 1) > 0.001;
  const fractionDigits = devise === 'USD' || hasDecimals ? 2 : 0;
  return `${value.toLocaleString('fr-FR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
  })} ${devise}`;
}
