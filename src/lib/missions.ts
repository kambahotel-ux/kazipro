import { demandesApi, missionsApi } from "@/lib/api";
import { unwrapPaginated } from "@/lib/api-utils";

export type MissionRow = {
  id: string;
  status?: string | null;
  statut?: string | null;
  contrat_id?: string | null;
  demande_id?: string;
  prestataire_id?: string;
  created_at?: string;
};

export type EnsureMissionInput = {
  demandeId: string;
  devisId: string;
  contratId: string;
  clientId: string;
  prestataireId: string;
  status?: string;
};

const STATUS_RANK: Record<string, number> = {
  cancelled: 0,
  canceled: 0,
  annulee: 0,
  pending: 1,
  en_attente: 1,
  in_progress: 2,
  en_cours: 2,
  terminee_attente_validation_client: 3,
  terminee_validee_client: 4,
  completed: 5,
  complete: 5,
  terminee: 5,
  terminee_prestataire: 3,
  validee: 5,
};

export function normalizeMissionStatus(raw?: string | null): string {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase();
  const map: Record<string, string> = {
    en_attente: "pending",
    pending: "pending",
    en_cours: "in_progress",
    in_progress: "in_progress",
    terminee_attente_validation_client: "in_progress",
    terminee_validee_client: "completed",
    terminee_prestataire: "in_progress",
    terminee: "completed",
    validee: "completed",
    completed: "completed",
    complete: "completed",
    annulee: "cancelled",
    cancelled: "cancelled",
    canceled: "cancelled",
    litige: "in_progress",
  };
  return map[s] ?? s;
}

export function getMissionStatus(row: Pick<MissionRow, "status" | "statut">): string {
  return normalizeMissionStatus(row.status ?? row.statut);
}

function statusRank(row: Pick<MissionRow, "status" | "statut">): number {
  const key = String(row.status ?? row.statut ?? "")
    .trim()
    .toLowerCase();
  const normalized = normalizeMissionStatus(key);
  return STATUS_RANK[key] ?? STATUS_RANK[normalized] ?? 1;
}

function pickBestMission<T extends MissionRow>(rows: T[]): T | null {
  if (!rows.length) return null;
  return rows.reduce((best, row) => {
    const br = statusRank(best);
    const rr = statusRank(row);
    if (rr > br) return row;
    if (rr < br) return best;
    const bt = best.created_at ? Date.parse(best.created_at) : 0;
    const rt = row.created_at ? Date.parse(row.created_at) : 0;
    return rt >= bt ? row : best;
  });
}

function missionGroupKey(row: MissionRow): string {
  if (row.contrat_id) return `c:${row.contrat_id}`;
  if (row.demande_id && row.prestataire_id) {
    return `d:${row.demande_id}:${row.prestataire_id}`;
  }
  return `id:${row.id}`;
}

export async function cancelDuplicateMissions(
  _keepId: string,
  _input: Pick<EnsureMissionInput, "demandeId" | "prestataireId" | "contratId">,
): Promise<void> {
  // Géré côté serveur Laravel
}

async function findMissionCandidates(input: EnsureMissionInput): Promise<MissionRow[]> {
  const res = await missionsApi.getAll({ per_page: 100 });
  const rows = unwrapPaginated<MissionRow>(res);
  return rows.filter((row) => {
    if (getMissionStatus(row) === "cancelled") return false;
    if (row.contrat_id && String(row.contrat_id) === String(input.contratId)) return true;
    return (
      String(row.demande_id) === String(input.demandeId) &&
      String(row.prestataire_id) === String(input.prestataireId)
    );
  });
}

/** Mission créée côté API à la signature — retrouve l'existante. */
export async function ensureMissionForContrat(
  input: EnsureMissionInput,
): Promise<{ id: string | null; created: boolean }> {
  const candidates = await findMissionCandidates(input);
  const existing = pickBestMission(candidates);
  if (existing?.id) {
    return { id: String(existing.id), created: false };
  }
  return { id: null, created: false };
}

export function dedupeMissionsByContrat<T extends MissionRow>(rows: T[]): T[] {
  const groups = new Map<string, T[]>();

  for (const row of rows) {
    if (getMissionStatus(row) === "cancelled") continue;
    const key = missionGroupKey(row);
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  const kept: T[] = [];
  for (const group of groups.values()) {
    const best = pickBestMission(group);
    if (best) kept.push(best);
  }

  return kept.sort((a, b) => {
    const ta = a.created_at ? Date.parse(a.created_at) : 0;
    const tb = b.created_at ? Date.parse(b.created_at) : 0;
    return tb - ta;
  });
}

export const MISSION_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  in_progress: "En cours",
  terminee_attente_validation_client: "Travaux terminés — à valider",
  terminee_validee_client: "Validée par le client",
  completed: "Complétée",
  cancelled: "Annulée",
};

export const CLIENT_MISSION_STATUS_LABELS: Record<string, string> = {
  pending: "Mission planifiée",
  in_progress: "Travaux en cours",
  terminee_attente_validation_client: "Travaux terminés — votre validation",
  terminee_prestataire: "Travaux terminés — votre validation",
  terminee_validee_client: "Travaux validés",
  validee: "Mission validée",
  completed: "Mission terminée",
  cancelled: "Mission annulée",
};

/** Le client doit encore valider les travaux (paiement solde ensuite). */
export function missionNeedsClientValidation(
  row: Pick<MissionRow, "status" | "statut">,
): boolean {
  const raw = String(row.status ?? row.statut ?? "").toLowerCase();
  return raw === "terminee_prestataire" || raw === "terminee_attente_validation_client";
}

export function getClientMissionLabel(row: Pick<MissionRow, "status" | "statut">): string {
  const key = getMissionStatus(row);
  const raw = String(row.status ?? row.statut ?? "").toLowerCase();
  return (
    CLIENT_MISSION_STATUS_LABELS[raw] ??
    CLIENT_MISSION_STATUS_LABELS[key] ??
    MISSION_STATUS_LABELS[key] ??
    "Mission"
  );
}

export function prestataireCompleteMissionStatus(): string {
  return "terminee_prestataire";
}

export async function syncDemandeWithMissionStatus(
  demandeId: string,
  missionRawStatus: string,
): Promise<void> {
  const raw = String(missionRawStatus ?? "").toLowerCase();
  const normalized = normalizeMissionStatus(raw);

  let statut = "active";
  if (
    raw === "terminee_attente_validation_client" ||
    raw === "terminee_prestataire" ||
    (normalized === "completed" && raw !== "terminee_validee_client" && raw !== "validee")
  ) {
    statut = "en_validation";
  } else if (raw === "terminee_validee_client" || raw === "validee" || normalized === "completed") {
    statut = "terminee";
  } else if (normalized === "cancelled") {
    statut = "annulee";
  }

  try {
    await demandesApi.update(demandeId, { statut });
  } catch (e) {
    console.warn("syncDemandeWithMissionStatus:", demandeId, missionRawStatus, e);
  }
}

export async function fetchMissionForDemande(demandeId: string): Promise<MissionRow | null> {
  try {
    const res = await missionsApi.getAll({ per_page: 100 });
    const rows = unwrapPaginated<MissionRow>(res).filter(
      (m) => String(m.demande_id) === String(demandeId) && getMissionStatus(m) !== "cancelled",
    );
    const deduped = dedupeMissionsByContrat(rows);
    return deduped[0] ?? null;
  } catch (e) {
    console.warn("fetchMissionForDemande:", e);
    return null;
  }
}
