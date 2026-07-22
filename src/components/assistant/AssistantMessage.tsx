import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { AssistantAction, AssistantResult } from '@/lib/assistant-api';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { AssistantResultCard } from '@/components/assistant/AssistantResultCard';

export function AssistantMessageBubble({
  role,
  text,
}: {
  role: 'user' | 'assistant';
  text: string;
}) {
  const isUser = role === 'user';
  const lines = text.split('\n');

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm',
          isUser
            ? 'rounded-br-md bg-primary text-primary-foreground'
            : 'rounded-bl-md border border-border/70 bg-card text-foreground',
        )}
      >
        {lines.map((line, i) => (
          <p key={i} className={cn(i > 0 && (line === '' ? 'mt-2' : 'mt-1'))}>
            {line === '' ? '\u00a0' : renderInlineBold(line)}
          </p>
        ))}
      </div>
    </div>
  );
}

function renderInlineBold(line: string) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function AssistantSuggestions({
  actions,
  onSuggestion,
  disabled,
}: {
  actions?: AssistantAction[];
  onSuggestion: (message: string) => void;
  disabled?: boolean;
}) {
  const suggestions = (actions ?? []).filter(
    (a) => a.type === 'suggestion' && a.message && a.label,
  );
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 pl-0.5">
      {suggestions.map((s, i) => (
        <button
          key={`${s.label}-${i}`}
          type="button"
          disabled={disabled}
          onClick={() => onSuggestion(s.message!)}
          className={cn(
            'rounded-full border border-secondary/40 bg-secondary/10 px-3 py-1.5 text-xs font-medium text-secondary transition',
            'hover:bg-secondary hover:text-secondary-foreground',
            'disabled:pointer-events-none disabled:opacity-50',
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

export function AssistantCtas({ actions }: { actions?: AssistantAction[] }) {
  const ctas = (actions ?? []).filter((a) => a.type === 'cta' && a.href && a.label);
  if (ctas.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {ctas.map((c, i) => (
        <Button key={`${c.href}-${i}`} asChild size="sm" variant={i === 0 ? 'default' : 'outline'}>
          <Link to={c.href!}>
            {c.label}
            <ExternalLink className="ml-1.5 h-3.5 w-3.5 opacity-70" />
          </Link>
        </Button>
      ))}
    </div>
  );
}

export function AssistantResults({ results }: { results: AssistantResult[] }) {
  if (!results.length) return null;

  return (
    <div className="space-y-2.5">
      {results.map((r) => (
        <AssistantResultCard key={r.id} result={r} />
      ))}
    </div>
  );
}

export function AssistantTyping() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-border/70 bg-card px-4 py-3 shadow-sm">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.2s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.1s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70" />
      </div>
    </div>
  );
}
