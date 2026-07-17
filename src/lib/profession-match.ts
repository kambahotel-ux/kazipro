/**
 * Étend les libellés de profession pour l’alignement demande ↔ prestataire
 * lorsque la table `professions` ou les données métier utilisent des variantes (ex. Électrique / Électricien).
 */
const EQUIVALENT_GROUPS: string[][] = [
  ['Électricien', 'Électrique'],
  ['Mécanicien automobile', 'Mécanicien', 'Mécanique automobile', 'Automobile'],
  ['Designer Graphique', 'Design graphique'],
  ['Développeur Web', 'Développeur', 'Informaticien'],
];

/** Termes distincts utilisés dans les filtres PostgREST (profession OU service sur la demande). */
export function professionTermsForMatch(prestProfession: string | null | undefined): string[] {
  const p = prestProfession?.trim();
  if (!p) return [];
  for (const group of EQUIVALENT_GROUPS) {
    const hit = group.find((g) => g.toLowerCase() === p.toLowerCase());
    if (hit !== undefined) {
      return [...new Set([prestProfession.trim(), ...group])];
    }
  }
  return [p];
}

/** Échapper une valeur pour un filtre .in.(...) PostgREST. */
function quoteToken(v: string): string {
  const s = String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${s}"`;
}

/** Filtre OR : profession OU service ∈ terms (pour une même liste de synonymes). */
export function professionOrServiceInTermsFilter(terms: string[]): string {
  if (terms.length === 0) return '';
  const list = '(' + terms.map(quoteToken).join(',') + ')';
  return `profession.in.${list},service.in.${list}`;
}
