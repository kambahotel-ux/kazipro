/**
 * La page `/services/:id` accepte un UUID OU un slug lisible (ex. footer: electricite → Électricien).
 * Les valeurs correspondent au champ `nom` de la table `professions` (seed sql/create_professions_table.sql).
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isProfessionIdUuid(segment: string | undefined): boolean {
  return Boolean(segment && UUID_REGEX.test(segment));
}

/** slug URL (sans accents, minuscule) → `professions.nom` */
export const SERVICE_SLUG_TO_PROFESSION_NOM: Record<string, string> = {
  electricite: "Électricien",
  electricien: "Électricien",
  plomberie: "Plombier",
  plombier: "Plombier",
  menuiserie: "Menuisier",
  menuisier: "Menuisier",
  peinture: "Peintre",
  peintre: "Peintre",
  climatisation: "Climatisation",
  climaticien: "Climatisation",
  maconnerie: "Maçon",
  macon: "Maçon",
  carrelage: "Carreleur",
  carreleur: "Carreleur",
  mecanique: "Mécanicien",
  mecanicien: "Mécanicien",
  informatique: "Informatique",
  informaticien: "Informatique",
  jardinage: "Jardinage",
  nettoyage: "Nettoyage",
  securite: "Sécurité",
};

export function professionNomFromSlugParam(param: string | undefined): string | null {
  if (!param) return null;
  const slug = decodeURIComponent(param).toLowerCase().trim();
  return SERVICE_SLUG_TO_PROFESSION_NOM[slug] ?? null;
}
