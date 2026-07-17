/** Champs alignés sur `config_paiement` (Laravel) — GET/PUT /admin/config-paiement */

export interface ConfigPaiementAdmin {
  id?: number;
  escrow_main_oeuvre: boolean;
  escrow_main_oeuvre_pct_min: number;
  escrow_transport: boolean;
  escrow_montant_devis_total: boolean;
  acompte_pourcentage_defaut: number;
  acompte_base: 'total_ttc' | 'main_oeuvre';
  commission_plateforme_pct: number;
  delai_liberation_jours: number | null;
  modes_paiement: string[];
  // Location matériel
  escrow_location_loyer: boolean;
  escrow_caution_obligatoire: boolean;
  escrow_livraison_materiel: boolean;
  escrow_livraison_liberation: 'remise' | 'retour';
  caution_mode_defaut: 'pourcentage' | 'fixe';
  caution_pct_defaut: number;
  caution_pct_min: number;
  caution_pct_max: number;
  caution_plafond_fc: number;
  caution_plancher_fc: number;
  caution_base: 'valeur_remplacement' | 'loyer_total';
  commission_location_pct: number;
  delai_inspection_retour_jours: number;
  moderation_medias_active: boolean;
  video_max_mo_annonce: number;
  video_max_mo_checklist: number;
  video_duree_max_secondes: number;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_CONFIG_PAIEMENT: ConfigPaiementAdmin = {
  escrow_main_oeuvre: true,
  escrow_main_oeuvre_pct_min: 100,
  escrow_transport: true,
  escrow_montant_devis_total: true,
  acompte_pourcentage_defaut: 30,
  acompte_base: "total_ttc",
  commission_plateforme_pct: 5,
  delai_liberation_jours: null,
  modes_paiement: ["mobile_money"],
  escrow_location_loyer: true,
  escrow_caution_obligatoire: true,
  escrow_livraison_materiel: true,
  escrow_livraison_liberation: "retour",
  caution_mode_defaut: "pourcentage",
  caution_pct_defaut: 30,
  caution_pct_min: 20,
  caution_pct_max: 80,
  caution_plafond_fc: 500000,
  caution_plancher_fc: 5000,
  caution_base: "valeur_remplacement",
  commission_location_pct: 8,
  delai_inspection_retour_jours: 3,
  moderation_medias_active: false,
  video_max_mo_annonce: 50,
  video_max_mo_checklist: 50,
  video_duree_max_secondes: 60,
};

export const MODES_PAIEMENT_OPTIONS = [
  { value: "mobile_money", label: "Mobile Money" },
  { value: "carte", label: "Carte bancaire" },
  { value: "virement", label: "Virement" },
] as const;

function num(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1" || value === "true") return true;
  if (value === 0 || value === "0" || value === "false") return false;
  return fallback;
}

export function mapConfigPaiementFromApi(raw: Record<string, unknown>): ConfigPaiementAdmin {
  const modesRaw = raw.modes_paiement;
  const modes = Array.isArray(modesRaw)
    ? modesRaw.map(String)
    : DEFAULT_CONFIG_PAIEMENT.modes_paiement;

  const d = DEFAULT_CONFIG_PAIEMENT;

  return {
    id: raw.id != null ? Number(raw.id) : undefined,
    escrow_main_oeuvre: bool(raw.escrow_main_oeuvre, d.escrow_main_oeuvre),
    escrow_main_oeuvre_pct_min: num(raw.escrow_main_oeuvre_pct_min, d.escrow_main_oeuvre_pct_min),
    escrow_transport: bool(raw.escrow_transport, d.escrow_transport),
    escrow_montant_devis_total: bool(raw.escrow_montant_devis_total, d.escrow_montant_devis_total),
    acompte_pourcentage_defaut: num(raw.acompte_pourcentage_defaut, d.acompte_pourcentage_defaut),
    acompte_base: raw.acompte_base === "main_oeuvre" ? "main_oeuvre" : "total_ttc",
    commission_plateforme_pct: num(
      raw.commission_plateforme_pct ?? raw.commission_plateforme,
      d.commission_plateforme_pct,
    ),
    delai_liberation_jours:
      raw.delai_liberation_jours == null || raw.delai_liberation_jours === ""
        ? null
        : num(raw.delai_liberation_jours, 0),
    modes_paiement: modes.length > 0 ? modes : d.modes_paiement,
    escrow_location_loyer: bool(raw.escrow_location_loyer, d.escrow_location_loyer),
    escrow_caution_obligatoire: bool(raw.escrow_caution_obligatoire, d.escrow_caution_obligatoire),
    escrow_livraison_materiel: bool(raw.escrow_livraison_materiel, d.escrow_livraison_materiel),
    escrow_livraison_liberation:
      raw.escrow_livraison_liberation === "remise" ? "remise" : "retour",
    caution_mode_defaut: raw.caution_mode_defaut === "fixe" ? "fixe" : "pourcentage",
    caution_pct_defaut: num(raw.caution_pct_defaut, d.caution_pct_defaut),
    caution_pct_min: num(raw.caution_pct_min, d.caution_pct_min),
    caution_pct_max: num(raw.caution_pct_max, d.caution_pct_max),
    caution_plafond_fc: num(raw.caution_plafond_fc, d.caution_plafond_fc),
    caution_plancher_fc: num(raw.caution_plancher_fc, d.caution_plancher_fc),
    caution_base: raw.caution_base === "loyer_total" ? "loyer_total" : "valeur_remplacement",
    commission_location_pct: num(raw.commission_location_pct, d.commission_location_pct),
    delai_inspection_retour_jours: num(raw.delai_inspection_retour_jours, d.delai_inspection_retour_jours),
    moderation_medias_active: bool(raw.moderation_medias_active, d.moderation_medias_active),
    video_max_mo_annonce: num(raw.video_max_mo_annonce, d.video_max_mo_annonce),
    video_max_mo_checklist: num(raw.video_max_mo_checklist, d.video_max_mo_checklist),
    video_duree_max_secondes: num(raw.video_duree_max_secondes, d.video_duree_max_secondes),
    created_at: raw.created_at != null ? String(raw.created_at) : undefined,
    updated_at: raw.updated_at != null ? String(raw.updated_at) : undefined,
  };
}

export function mapConfigPaiementToApi(form: ConfigPaiementAdmin): Record<string, unknown> {
  return {
    escrow_main_oeuvre: form.escrow_main_oeuvre,
    escrow_main_oeuvre_pct_min: form.escrow_main_oeuvre_pct_min,
    escrow_transport: form.escrow_transport,
    escrow_montant_devis_total: form.escrow_montant_devis_total,
    acompte_pourcentage_defaut: form.acompte_pourcentage_defaut,
    acompte_base: form.acompte_base,
    commission_plateforme_pct: form.commission_plateforme_pct,
    delai_liberation_jours: form.delai_liberation_jours,
    modes_paiement: form.modes_paiement,
    escrow_location_loyer: form.escrow_location_loyer,
    escrow_caution_obligatoire: form.escrow_caution_obligatoire,
    escrow_livraison_materiel: form.escrow_livraison_materiel,
    escrow_livraison_liberation: form.escrow_livraison_liberation,
    caution_mode_defaut: form.caution_mode_defaut,
    caution_pct_defaut: form.caution_pct_defaut,
    caution_pct_min: form.caution_pct_min,
    caution_pct_max: form.caution_pct_max,
    caution_plafond_fc: form.caution_plafond_fc,
    caution_plancher_fc: form.caution_plancher_fc,
    caution_base: form.caution_base,
    commission_location_pct: form.commission_location_pct,
    delai_inspection_retour_jours: form.delai_inspection_retour_jours,
    moderation_medias_active: form.moderation_medias_active,
    video_max_mo_annonce: form.video_max_mo_annonce,
    video_max_mo_checklist: form.video_max_mo_checklist,
    video_duree_max_secondes: form.video_duree_max_secondes,
  };
}

export function modePaiementLabel(mode: string): string {
  return MODES_PAIEMENT_OPTIONS.find((m) => m.value === mode)?.label ?? mode;
}
