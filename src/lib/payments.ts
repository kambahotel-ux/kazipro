import { paiementsApi } from '@/lib/api';

const simFlag = import.meta.env.VITE_PAYMENTS_SIMULATION;
export const PAYMENTS_SIMULATION_ENABLED =
  simFlag === 'true' || (simFlag !== 'false' && Boolean(import.meta.env.DEV));

export type FinalizePaiementResult = {
  ok: boolean;
  via: 'poll' | 'admin' | 'pending';
};

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Erreur inconnue',
): string {
  if (!error || typeof error !== 'object') return fallback;
  const e = error as { message?: string };
  return e.message || fallback;
}

function isNetworkFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('load failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    error.name === 'TypeError'
  );
}

/** Paiement acompte via API Laravel (Sanctum). */
export async function payAcompteViaApi(params: {
  contratId: string;
  methodePaiement: string;
}): Promise<{ paiement?: { id?: string }; message?: string }> {
  try {
    const body = await paiementsApi.payerAcompte({
      contrat_id: params.contratId,
      methode: params.methodePaiement,
    });
    const paiementId = (body as { id?: string | number }).id;
    return {
      message: (body as { message?: string }).message,
      paiement: paiementId != null ? { id: String(paiementId) } : undefined,
    };
  } catch (error) {
    if (isNetworkFetchError(error)) {
      throw new Error(
        'API Laravel inaccessible. Lancez « php artisan serve --port=8002 » dans kazipro-api/.',
      );
    }
    throw error;
  }
}

export async function waitForPaiementStatut(
  paiementId: string,
  acceptable: readonly string[],
  opts?: { attempts?: number; delayMs?: number },
): Promise<boolean> {
  const attempts = opts?.attempts ?? 20;
  const delayMs = opts?.delayMs ?? 150;
  const want = new Set(acceptable.map((s) => String(s)));

  for (let i = 0; i < attempts; i++) {
    try {
      const row = await paiementsApi.getById(paiementId);
      const statut = String((row as { statut?: string }).statut ?? '');
      if (want.has(statut)) return true;
    } catch {
      // ignore transient fetch errors during poll
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }

  return false;
}

/** Valide un paiement via l'API admin (`POST /paiements/{id}/valider`). */
export async function validerPaiementAdmin(
  paiementId: string,
): Promise<{ ok: boolean; via: 'admin' }> {
  await paiementsApi.valider(paiementId);
  const ok = await waitForPaiementStatut(paiementId, ['valide', 'complete'], {
    attempts: 10,
    delayMs: 200,
  });
  if (!ok) {
    throw new Error('Validation envoyée mais le statut n\'a pas été mis à jour.');
  }
  return { ok: true, via: 'admin' };
}

/**
 * Attend la validation d'un paiement (poll GET /paiements/:id).
 * En simulation locale, retourne `pending` si toujours en attente — la validation
 * doit être faite par un admin via POST /paiements/{id}/valider.
 */
export async function finalizePaiementSimulation(
  paiementId: string,
): Promise<FinalizePaiementResult> {
  if (await waitForPaiementStatut(paiementId, ['valide', 'complete'])) {
    return { ok: true, via: 'poll' };
  }

  if (PAYMENTS_SIMULATION_ENABLED) {
    return { ok: false, via: 'pending' };
  }

  throw new Error(
    'Paiement non validé. Un administrateur doit confirmer le paiement.',
  );
}

export function formatPaiementStatut(statut?: string): string {
  const labels: Record<string, string> = {
    en_attente: 'En attente',
    en_cours: 'En cours',
    valide: 'Validé',
    complete: 'Complété',
    echoue: 'Échoué',
    annule: 'Annulé',
    rembourse: 'Remboursé',
  };
  return labels[String(statut ?? '')] ?? String(statut ?? '—');
}

export function createIdempotencyKey(prefix: 'acompte' | 'solde', contratId: string) {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${prefix}:${contratId}:${Date.now()}:${randomPart}`;
}
