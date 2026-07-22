import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives?: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<
    ArrayLike<{ transcript: string }> & { isFinal?: boolean; length: number }
  > & { length: number };
};

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function isSecureEnough(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.isSecureContext ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
}

function mapSpeechError(code: string): string | null {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Autorisez le micro dans le navigateur (cadenas → Micro → Autoriser), puis réessayez.';
    case 'audio-capture':
      return 'Aucun micro détecté. Vérifiez les réglages système.';
    case 'network':
      return 'Connexion requise pour la dictée (service Google). Vérifiez votre réseau.';
    case 'no-speech':
    case 'aborted':
      return null;
    case 'language-not-supported':
      return 'Langue non supportée. Utilisez Chrome en français.';
    default:
      return 'Dictée interrompue. Réessayez ou tapez votre message.';
  }
}

/**
 * Dictée vocale robuste :
 * - garde le flux micro ouvert pendant toute l’écoute
 * - relance automatiquement quand Chrome coupe (~1–2 s de silence)
 * - s’arrête uniquement sur action utilisateur (Stop / Envoyer)
 */
export function useSpeechToText(locale = 'fr-FR') {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wantListeningRef = useRef(false);
  const finalBufferRef = useRef('');
  const restartTimerRef = useRef<number | null>(null);
  const networkRetriesRef = useRef(0);
  // Évite les boucles startRecognitionEngine via useCallback deps
  const startEngineRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognitionCtor()) && isSecureEnough());
  }, []);

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current != null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const releaseMicStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const detachRecognition = useCallback((hard = false) => {
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (!rec) return;
    rec.onresult = null;
    rec.onerror = null;
    rec.onend = null;
    rec.onstart = null;
    try {
      if (hard) rec.abort();
      else rec.stop();
    } catch {
      /* ignore */
    }
  }, []);

  const stop = useCallback(() => {
    wantListeningRef.current = false;
    clearRestartTimer();
    detachRecognition(true);
    releaseMicStream();
    setListening(false);
    setStarting(false);
    setInterim('');
  }, [clearRestartTimer, detachRecognition, releaseMicStream]);

  const scheduleRestart = useCallback(() => {
    clearRestartTimer();
    restartTimerRef.current = window.setTimeout(() => {
      restartTimerRef.current = null;
      if (wantListeningRef.current) {
        startEngineRef.current();
      }
    }, 280);
  }, [clearRestartTimer]);

  const startRecognitionEngine = useCallback(() => {
    if (!wantListeningRef.current) return;

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    // Détache l’ancienne instance sans abort (évite course onend/aborted)
    detachRecognition(false);

    const recognition = new Ctor();
    recognition.lang = locale;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      if (!wantListeningRef.current) return;
      setListening(true);
      setStarting(false);
      setError(null);
      networkRetriesRef.current = 0;
    };

    recognition.onresult = (event) => {
      if (!wantListeningRef.current) return;
      let interimText = '';
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const piece = result[0]?.transcript ?? '';
        if (result.isFinal) finalChunk += piece;
        else interimText += piece;
      }
      if (finalChunk) {
        const joined = `${finalBufferRef.current} ${finalChunk}`.replace(/\s+/g, ' ').trim();
        finalBufferRef.current = joined;
        setTranscript(joined);
      }
      setInterim(interimText.trim());
    };

    recognition.onerror = (event) => {
      if (!wantListeningRef.current) return;
      const code = event.error;

      // Silence / abort : Chrome enchaîne avec onend → on relance
      if (code === 'no-speech' || code === 'aborted') {
        return;
      }

      // Réseau instable : quelques retries silencieux
      if (code === 'network' && networkRetriesRef.current < 3) {
        networkRetriesRef.current += 1;
        return;
      }

      wantListeningRef.current = false;
      clearRestartTimer();
      setListening(false);
      setStarting(false);
      setInterim('');
      releaseMicStream();
      setError(mapSpeechError(code));
    };

    recognition.onend = () => {
      // Chrome coupe souvent après ~1–2 s : relancer tant que l’utilisateur n’a pas stoppé
      if (!wantListeningRef.current) {
        setListening(false);
        setStarting(false);
        setInterim('');
        return;
      }
      // Toujours une NOUVELLE instance après délai (reuse start() est très instable)
      scheduleRestart();
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      // Instance déjà démarrée / pas prête → retenter
      scheduleRestart();
    }
  }, [clearRestartTimer, detachRecognition, locale, releaseMicStream, scheduleRestart]);

  useEffect(() => {
    startEngineRef.current = startRecognitionEngine;
  }, [startRecognitionEngine]);

  const start = useCallback(async () => {
    if (!isSecureEnough()) {
      setError('La dictée nécessite HTTPS (ou localhost).');
      return;
    }
    if (!getSpeechRecognitionCtor()) {
      setError('Dictée non supportée. Utilisez Chrome ou Edge.');
      return;
    }

    setError(null);
    setStarting(true);
    finalBufferRef.current = '';
    setTranscript('');
    setInterim('');
    networkRetriesRef.current = 0;

    try {
      if (!streamRef.current) {
        if (!navigator.mediaDevices?.getUserMedia) {
          setStarting(false);
          setError('Micro indisponible sur cet appareil.');
          return;
        }
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
      }
    } catch (e) {
      setStarting(false);
      const name = e instanceof DOMException ? e.name : '';
      if (name === 'NotFoundError') {
        setError('Aucun micro détecté sur cet appareil.');
      } else {
        setError('Autorisez le micro dans le navigateur, puis réessayez.');
      }
      return;
    }

    wantListeningRef.current = true;
    startRecognitionEngine();
  }, [startRecognitionEngine]);

  const toggle = useCallback(() => {
    if (listening || starting || wantListeningRef.current) {
      stop();
    } else {
      void start();
    }
  }, [listening, starting, start, stop]);

  useEffect(
    () => () => {
      wantListeningRef.current = false;
      clearRestartTimer();
      detachRecognition(true);
      releaseMicStream();
    },
    [clearRestartTimer, detachRecognition, releaseMicStream],
  );

  const displayTranscript = [transcript, interim].filter(Boolean).join(' ').trim();

  return {
    supported,
    listening: listening || starting,
    starting,
    transcript: displayTranscript,
    finalTranscript: transcript,
    error,
    start,
    stop,
    toggle,
    setTranscript,
    clearError: () => setError(null),
  };
}
