import { useCallback, useEffect, useRef, useState } from 'react';
import {
  assistantSession,
  assistantTurn,
  type AssistantAction,
  type AssistantHistoryEntry,
  type AssistantResult,
  type AssistantTurnResponse,
} from '@/lib/assistant-api';

const SESSION_KEY = 'kazipro_assistant_session_v1';
const CHAT_STORAGE_KEY = 'kazipro_assistant_chat_v1';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  results?: AssistantResult[];
  actions?: AssistantAction[];
  createdAt: number;
};

type StoredChat = {
  sessionId: string | null;
  messages: ChatMessage[];
};

function loadStoredChat(): StoredChat | null {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredChat;
    if (!parsed || !Array.isArray(parsed.messages)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveStoredChat(data: StoredChat) {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(data));
    if (data.sessionId) {
      localStorage.setItem(SESSION_KEY, data.sessionId);
    }
  } catch {
    /* ignore */
  }
}

function clearStoredChat() {
  try {
    localStorage.removeItem(CHAT_STORAGE_KEY);
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text: "Bonjour ! Je suis l’assistant KaziPro.\n\nDécrivez votre problème en une phrase — je trouve le bon technicien pour vous.",
  actions: [
    { type: 'suggestion', label: 'Panne électrique', message: 'Mon disjoncteur saute souvent' },
    { type: 'suggestion', label: 'Fuite d’eau', message: 'J’ai une fuite sous l’évier' },
    { type: 'suggestion', label: 'Clim en panne', message: 'Ma climatisation ne refroidit plus' },
  ],
  createdAt: Date.now(),
};

function historyToMessages(history: AssistantHistoryEntry[]): ChatMessage[] {
  if (!history.length) return [{ ...WELCOME, id: uid(), createdAt: Date.now() }];

  return history.map((entry, index) => ({
    id: `hist-${index}-${uid()}`,
    role: entry.role,
    text: entry.text,
    createdAt: entry.at ? Date.parse(entry.at) || Date.now() : Date.now(),
  }));
}

export function useAssistantSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const stored = loadStoredChat();
      if (stored?.messages?.length) {
        setSessionId(stored.sessionId);
        setMessages(stored.messages);
        setHydrated(true);
        return;
      }

      const legacySessionId = (() => {
        try {
          return localStorage.getItem(SESSION_KEY);
        } catch {
          return null;
        }
      })();

      if (legacySessionId) {
        try {
          const remote = await assistantSession(legacySessionId);
          if (!cancelled && remote.history?.length) {
            setSessionId(remote.session_id);
            setMessages(historyToMessages(remote.history));
            setHydrated(true);
            return;
          }
        } catch {
          /* session expirée ou API indisponible */
        }
        if (!cancelled) setSessionId(legacySessionId);
      }

      if (!cancelled) setHydrated(true);
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveStoredChat({ sessionId, messages });
  }, [hydrated, messages, sessionId]);

  const applyResponse = useCallback((data: AssistantTurnResponse) => {
    setSessionId(data.session_id);
    setMessages((prev) => [
      ...prev,
      {
        id: uid(),
        role: 'assistant',
        text: data.reply,
        results: data.results?.length ? data.results : undefined,
        actions: data.actions,
        createdAt: Date.now(),
      },
    ]);
  }, []);

  const send = useCallback(
    async (raw: string) => {
      const message = raw.trim();
      if (!message || loading) return;

      setError(null);
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: 'user', text: message, createdAt: Date.now() },
      ]);
      setLoading(true);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const data = await assistantTurn({
          sessionId,
          message,
          signal: controller.signal,
        });
        applyResponse(data);
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        setError(
          e instanceof Error
            ? e.message
            : 'Impossible de joindre l’assistant. Réessayez.',
        );
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: 'assistant',
            text: 'Désolé, une erreur est survenue. Réessayez dans un instant, ou parcourez les services.',
            actions: [
              { type: 'cta', label: 'Voir les services', href: '/services' },
              { type: 'suggestion', label: 'Réessayer', message: message },
            ],
            createdAt: Date.now(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [applyResponse, loading, sessionId],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    clearStoredChat();
    setSessionId(null);
    setMessages([{ ...WELCOME, id: uid(), createdAt: Date.now() }]);
    setError(null);
    setLoading(false);
  }, []);

  return { messages, loading, error, send, reset, sessionId };
}
