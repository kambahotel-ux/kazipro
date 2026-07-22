/**
 * La page `/services/:id` accepte un UUID OU un slug lisible.
 * Matching NL : symptômes / synonymes (fallback offline si API search indisponible).
 */

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isProfessionIdUuid(segment: string | undefined): boolean {
  return Boolean(segment && UUID_REGEX.test(segment));
}

export function normalizeProfessionQuery(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** slug / synonymes → `professions.nom` */
export const SERVICE_SLUG_TO_PROFESSION_NOM: Record<string, string> = {
  electricite: "Électricité",
  electricien: "Électricité",
  plomberie: "Plomberie",
  plombier: "Plomberie",
  plombien: "Plomberie",
  menuiserie: "Menuiserie",
  menuisier: "Menuiserie",
  peinture: "Peinture",
  peintre: "Peinture",
  climatisation: "Climatisation",
  climaticien: "Climatisation",
  clim: "Climatisation",
  maconnerie: "Maçonnerie",
  macon: "Maçonnerie",
  carrelage: "Carrelage",
  carreleur: "Carrelage",
  mecanique: "Mécanique",
  mecanicien: "Mécanique",
  soudure: "Soudure",
  soudeur: "Soudure",
  informatique: "Informatique",
  informaticien: "Informatique",
  jardinage: "Jardinage",
  nettoyage: "Nettoyage",
  securite: "Sécurité",
};

/** Symptômes / phrases → métier (compréhension langage naturel) */
export const SERVICE_SYMPTOM_KEYWORDS: Record<string, string[]> = {
  Électricité: [
    "disjoncteur",
    "prise",
    "cable",
    "câble",
    "court-circuit",
    "courant",
    "ampoule",
    "eclairage",
    "éclairage",
    "electrique",
    "électrique",
    "interrupteur",
    "panne electrique",
    "panne électrique",
  ],
  Plomberie: [
    "fuite",
    "robinet",
    "canalisation",
    "tuyau",
    "evier",
    "évier",
    "lavabo",
    "chasse",
    "sanitaire",
    "debouch",
    "débouch",
    "toilette",
    "wc",
    "plomb",
  ],
  Peinture: ["peint", "enduit", "badigeon", "relooking"],
  Climatisation: [
    "clim",
    "climatis",
    "split",
    "ventilation",
    "ne refroidit",
    "froid",
  ],
  Menuiserie: ["menuis", "placard", "fenetre", "fenêtre", "porte bois"],
  Maçonnerie: ["macon", "maçon", "beton", "béton", "carrelage", "dalle", "ciment"],
  Soudure: ["soud", "grille metal", "grille métal"],
  Mécanique: [
    "mecan",
    "mécan",
    "voiture",
    "moteur",
    "vehicule",
    "véhicule",
    "auto",
  ],
};

export function professionNomFromSlugParam(param: string | undefined): string | null {
  if (!param) return null;
  const slug = normalizeProfessionQuery(decodeURIComponent(param));
  return SERVICE_SLUG_TO_PROFESSION_NOM[slug] ?? null;
}

type ProfessionLike = { id: number | string; nom: string };

/**
 * Résout une saisie libre / phrase → profession API (client-side).
 */
export function resolveProfessionFromQuery<T extends ProfessionLike>(
  query: string,
  professions: T[],
): T | null {
  const q = normalizeProfessionQuery(query);
  if (!q || professions.length === 0) return null;

  // 1) Phrase entière = slug / synonyme
  const bySlug = professionNomFromSlugParam(q);
  if (bySlug) {
    const hit = findProfessionByNom(professions, bySlug);
    if (hit) return hit;
  }

  // 2) Tokens de la phrase (plombier, electricien…)
  const tokens = q.split(/[^a-z0-9]+/).filter((t) => t.length >= 4);
  for (const token of tokens) {
    const mapped = professionNomFromSlugParam(token);
    if (mapped) {
      const hit = findProfessionByNom(professions, mapped);
      if (hit) return hit;
    }
  }

  // 3) Symptômes NL
  let bestNom: string | null = null;
  let bestScore = 0;
  for (const [nom, keywords] of Object.entries(SERVICE_SYMPTOM_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      const k = normalizeProfessionQuery(kw);
      if (k && q.includes(k)) {
        score += k.length >= 8 ? 4 : 3;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestNom = nom;
    }
  }
  if (bestNom && bestScore >= 3) {
    const hit = findProfessionByNom(professions, bestNom);
    if (hit) return hit;
  }

  // 4) Match sur noms BDD
  const exact = professions.find((p) => normalizeProfessionQuery(p.nom) === q);
  if (exact) return exact;

  const includes = professions.find((p) => {
    const nom = normalizeProfessionQuery(p.nom);
    return nom.length >= 4 && (q.includes(nom) || nom.includes(q));
  });
  if (includes) return includes;

  for (const token of tokens) {
    const hit = professions.find((p) => {
      const nom = normalizeProfessionQuery(p.nom);
      return nom.includes(token) || token.includes(nom.replace(/ie$/, ""));
    });
    if (hit) return hit;
  }

  return null;
}

function findProfessionByNom<T extends ProfessionLike>(
  professions: T[],
  targetNom: string,
): T | null {
  const target = normalizeProfessionQuery(targetNom);
  return (
    professions.find((p) => normalizeProfessionQuery(p.nom) === target) ??
    professions.find((p) => {
      const nom = normalizeProfessionQuery(p.nom);
      return nom.includes(target) || target.includes(nom);
    }) ??
    null
  );
}

/** Extraire une ville RDC connue (typos inclus) depuis une phrase. */
export function extractCityFromQuery(query: string): string | null {
  const cities = [
    "Kinshasa",
    "Lubumbashi",
    "Goma",
    "Bukavu",
    "Kisangani",
    "Matadi",
    "Kolwezi",
    "Mbuji-Mayi",
    "Kananga",
    "Bunia",
  ];
  const aliases: Record<string, string> = {
    kishasa: "Kinshasa",
    kinshsa: "Kinshasa",
    kinshassa: "Kinshasa",
    kinsasa: "Kinshasa",
    lubumashi: "Lubumbashi",
    lubumbash: "Lubumbashi",
    lushi: "Lubumbashi",
  };

  const raw = query.trim();
  for (const city of cities) {
    if (new RegExp(`\\b${city}\\b`, "i").test(raw)) return city;
  }

  const norm = normalizeProfessionQuery(raw);
  if (aliases[norm]) return aliases[norm];

  const tokens = norm.split(/[^a-z0-9]+/).filter(Boolean);
  for (const t of tokens) {
    if (aliases[t]) return aliases[t];
    for (const city of cities) {
      const c = normalizeProfessionQuery(city);
      if (t.length >= 4 && levenshtein(t, c) <= (c.length <= 5 ? 1 : 2)) {
        return city;
      }
    }
  }

  return null;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => 0),
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n];
}
