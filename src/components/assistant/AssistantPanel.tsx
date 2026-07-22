import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle,
  Mic,
  MicOff,
  Send,
  Sparkles,
  RotateCcw,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useAssistantSession } from '@/hooks/useAssistantSession';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import {
  AssistantCtas,
  AssistantMessageBubble,
  AssistantResults,
  AssistantSuggestions,
  AssistantTyping,
} from '@/components/assistant/AssistantMessage';
import { cn } from '@/lib/utils';

type AssistantPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPrompt?: string | null;
};

export function AssistantPanel({ open, onOpenChange, initialPrompt }: AssistantPanelProps) {
  const { messages, loading, send, reset, error } = useAssistantSession();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sentInitial = useRef(false);
  const {
    supported: speechSupported,
    listening,
    transcript,
    error: speechError,
    toggle: toggleMic,
    stop: stopMic,
    clearError: clearSpeechError,
  } = useSpeechToText('fr-FR');

  useEffect(() => {
    if (!open) {
      sentInitial.current = false;
      stopMic();
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 280);
    return () => window.clearTimeout(t);
  }, [open, stopMic]);

  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading, open]);

  useEffect(() => {
    if (!open || !initialPrompt?.trim() || sentInitial.current || loading) return;
    sentInitial.current = true;
    void send(initialPrompt.trim());
  }, [open, initialPrompt, loading, send]);

  const submit = () => {
    const value = input.trim();
    if (!value) return;
    stopMic();
    setInput('');
    void send(value);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 border-l border-border/60 p-0 sm:max-w-md [&>button]:text-primary-foreground [&>button]:hover:bg-white/15 [&>button]:right-3 [&>button]:top-3"
      >
        <SheetHeader className="space-y-0 border-b border-border/60 bg-gradient-to-br from-primary/95 via-primary to-primary/90 px-4 py-4 text-left">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground shadow-md">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="text-base font-semibold text-primary-foreground">
                  Assistant KaziPro
                </SheetTitle>
                <SheetDescription className="text-xs text-primary-foreground/75">
                  Texte ou voix · on trouve le bon pro
                </SheetDescription>
              </div>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-primary-foreground/80 hover:bg-white/15 hover:text-primary-foreground"
              onClick={() => {
                stopMic();
                reset();
              }}
              title="Nouvelle conversation"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto bg-muted/25 px-3 py-4 sm:px-4">
          {messages.map((m) => (
            <div key={m.id} className="space-y-2.5">
              <AssistantMessageBubble role={m.role} text={m.text} />
              {m.role === 'assistant' && m.results && m.results.length > 0 && (
                <AssistantResults results={m.results} />
              )}
              {m.role === 'assistant' && (
                <>
                  <AssistantSuggestions
                    actions={m.actions}
                    disabled={loading || listening}
                    onSuggestion={(msg) => void send(msg)}
                  />
                  <AssistantCtas actions={m.actions} />
                </>
              )}
            </div>
          ))}
          {loading && <AssistantTyping />}
          {(error || speechError) && (
            <p className="px-1 text-xs text-destructive">{error || speechError}</p>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border/60 bg-background p-3 sm:p-4">
          {listening && (
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Micro actif — parlez maintenant, puis appuyez sur stop ou Envoyer.
            </div>
          )}
          {!speechSupported && (
            <p className="mb-2 text-[11px] text-muted-foreground">
              Dictée disponible sur <span className="font-medium text-foreground">Chrome</span> ou{' '}
              <span className="font-medium text-foreground">Edge</span> (HTTPS / localhost).
            </p>
          )}
          <div className="mb-2 flex items-center gap-2 text-[11px] text-muted-foreground">
            <Wrench className="h-3 w-3" />
            <span>
              Besoin d’autre chose ?{' '}
              <Link
                to="/services"
                className="font-medium text-secondary hover:underline"
                onClick={() => onOpenChange(false)}
              >
                Catalogue
              </Link>
              {' · '}
              <Link
                to="/inscription/client"
                className="font-medium text-secondary hover:underline"
                onClick={() => onOpenChange(false)}
              >
                Publier une demande
              </Link>
            </span>
          </div>
          <div className="flex items-end gap-2">
            <Button
              type="button"
              size="icon"
              variant={listening ? 'destructive' : 'outline'}
              className={cn('h-11 w-11 shrink-0 rounded-xl', listening && 'animate-pulse')}
              disabled={loading || !speechSupported}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Évite que le focus textarea coupe le micro
                (e.currentTarget as HTMLButtonElement).focus();
                toggleMic();
              }}
              aria-label={
                !speechSupported
                  ? 'Dictée non disponible sur ce navigateur'
                  : listening
                    ? 'Arrêter le micro'
                    : 'Dicter mon problème'
              }
              title={
                !speechSupported
                  ? 'Utilisez Chrome ou Edge'
                  : listening
                    ? 'Arrêter'
                    : 'Parler'
              }
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                clearSpeechError();
                setInput(e.target.value);
              }}
              onKeyDown={onKeyDown}
              placeholder={
                listening
                  ? 'Parlez… la transcription apparaît ici'
                  : speechSupported
                    ? 'Écrivez ou dictez votre problème…'
                    : 'Ex. : fuite d’eau à Kinshasa…'
              }
              rows={1}
              disabled={loading}
              className="min-h-[44px] max-h-28 resize-none rounded-xl text-sm"
            />
            <Button
              type="button"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-xl"
              disabled={loading || !input.trim()}
              onClick={submit}
              aria-label="Envoyer"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function AssistantFab({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Ouvrir l’assistant KaziPro — trouvez un pro en quelques secondes"
      className={cn(
        'group fixed bottom-5 right-4 z-40 max-w-[min(100vw-2rem,20rem)]',
        'flex items-center gap-3 rounded-2xl border-2 border-white/40 bg-secondary px-4 py-3.5',
        'text-left text-secondary-foreground shadow-[0_12px_40px_-8px_rgba(0,0,0,0.45)]',
        'transition duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-secondary/95 hover:shadow-[0_16px_48px_-8px_rgba(0,0,0,0.5)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
        'sm:bottom-7 sm:right-7 sm:gap-3.5 sm:px-5 sm:py-4',
        'animate-in fade-in slide-in-from-bottom-4 duration-500',
        className,
      )}
    >
      <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary-foreground/15 sm:h-14 sm:w-14">
        <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.25} />
        <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
          <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-secondary" />
        </span>
      </span>
      <span className="min-w-0 flex-1 pr-0.5">
        <span className="block text-[15px] font-bold leading-tight tracking-tight sm:text-base">
          Trouvez votre pro maintenant
        </span>
        <span className="mt-0.5 block text-[11px] font-medium leading-snug text-secondary-foreground/85 sm:text-xs">
          Décrivez votre panne — on vous oriente en 30&nbsp;s
        </span>
      </span>
      <Sparkles className="h-4 w-4 shrink-0 opacity-90 transition duration-300 group-hover:rotate-12 group-hover:scale-110 sm:h-5 sm:w-5" />
    </button>
  );
}
