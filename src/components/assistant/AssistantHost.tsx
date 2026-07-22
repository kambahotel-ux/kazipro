import { useCallback, useEffect, useState } from 'react';
import { AssistantFab, AssistantPanel } from '@/components/assistant/AssistantPanel';

/**
 * Point d’entrée global de l’assistant (pages publiques).
 */
export function AssistantHost() {
  const [open, setOpen] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);

  const openAssistant = useCallback((prompt?: string) => {
    setInitialPrompt(prompt?.trim() || null);
    setOpen(true);
  }, []);

  useEffect(() => {
    (window as unknown as { __openKaziAssistant?: (p?: string) => void }).__openKaziAssistant =
      openAssistant;
    return () => {
      delete (window as unknown as { __openKaziAssistant?: (p?: string) => void }).__openKaziAssistant;
    };
  }, [openAssistant]);

  return (
    <>
      {!open && <AssistantFab onClick={() => openAssistant()} />}
      <AssistantPanel
        open={open}
        onOpenChange={setOpen}
        initialPrompt={initialPrompt}
      />
    </>
  );
}

export function openKaziAssistant(prompt?: string) {
  const fn = (window as unknown as { __openKaziAssistant?: (p?: string) => void })
    .__openKaziAssistant;
  fn?.(prompt);
}
