/**
 * Client API Assistant KaziPro
 */

import { API_BASE_URL } from '@/lib/api';

export type AssistantAction = {
  type: string;
  field?: string;
  label?: string;
  message?: string;
  href?: string;
};

export type AssistantResult = {
  id: number | string;
  full_name: string;
  profession?: string | null;
  ville?: string | null;
  quartier?: string | null;
  rating?: number;
  reviews_count?: number;
  verified?: boolean;
  disponible?: boolean;
  hourly_rate?: number | null;
  photo_url?: string | null;
  profile_url?: string;
};

export type AssistantTurnResponse = {
  session_id: string;
  reply: string;
  intent: string;
  needs_clarification: boolean;
  criteria: {
    profession_slug?: string | null;
    profession_id?: number | null;
    profession_nom?: string | null;
    ville?: string | null;
    urgence?: string | null;
  };
  results: AssistantResult[];
  actions: AssistantAction[];
  history?: AssistantHistoryEntry[];
};

export type AssistantHistoryEntry = {
  role: 'user' | 'assistant';
  text: string;
  at?: string;
};

export type AssistantSessionResponse = {
  session_id: string;
  criteria: AssistantTurnResponse['criteria'];
  history: AssistantHistoryEntry[];
};

export async function assistantTurn(params: {
  sessionId?: string | null;
  message: string;
  locale?: string;
  signal?: AbortSignal;
}): Promise<AssistantTurnResponse> {
  const res = await fetch(`${API_BASE_URL}/assistant/turn`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: params.sessionId || undefined,
      message: params.message,
      locale: params.locale ?? 'fr',
    }),
    signal: params.signal,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg =
      typeof body === 'object' && body && 'message' in body
        ? String((body as { message: string }).message)
        : `Erreur assistant (${res.status})`;
    throw new Error(msg);
  }

  return res.json() as Promise<AssistantTurnResponse>;
}

export async function assistantSession(sessionId: string): Promise<AssistantSessionResponse> {
  const params = new URLSearchParams({ session_id: sessionId });
  const res = await fetch(`${API_BASE_URL}/assistant/session?${params}`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Erreur assistant (${res.status})`);
  }

  return res.json() as Promise<AssistantSessionResponse>;
}
