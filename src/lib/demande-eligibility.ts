const DEVIS_BLOCKED_STATUTS = ['annulee', 'terminee', 'acceptee', 'en_execution'] as const;

/** Aligné sur DevisController::store — statuts qui bloquent un nouveau devis. */
export function demandeAccepteNouveauDevis(statut: string): boolean {
  const s = String(statut ?? '').toLowerCase();
  return !(DEVIS_BLOCKED_STATUTS as readonly string[]).includes(s);
}

export function demandeDevisFermeRaison(statut: string): string | null {
  if (demandeAccepteNouveauDevis(statut)) return null;

  const s = String(statut ?? '').toLowerCase();
  const messages: Record<string, string> = {
    acceptee: 'Un devis a déjà été accepté — vous ne pouvez plus en soumettre.',
    en_execution: 'Mission en cours — les nouveaux devis ne sont plus acceptés.',
    terminee: 'Demande terminée — plus de devis acceptés.',
    annulee: 'Demande annulée.',
  };
  return messages[s] ?? 'Cette demande n\'accepte plus de nouveaux devis.';
}
