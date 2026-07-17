import { materielMediaSrc } from "@/lib/media-url";

export interface MaterielListItem {
  id: string;
  titre: string;
  ville?: string;
  quartier?: string;
  prix_jour?: number;
  prix_semaine?: number;
  marque?: string;
  modele?: string;
  etat?: string;
  image?: string;
  imageCount?: number;
  categorie?: string;
}

export function extractMaterielImageUrls(medias: unknown): string[] {
  if (!Array.isArray(medias)) return [];
  return medias
    .filter((raw) => {
      const row = raw as Record<string, unknown>;
      const type = String(row.type ?? "image").toLowerCase();
      return type === "image";
    })
    .map((raw) => materielMediaSrc(raw as Parameters<typeof materielMediaSrc>[0]))
    .filter((url) => Boolean(url) && !url.startsWith("data:text"));
}

export function mapMaterielListItem(row: Record<string, unknown>): MaterielListItem {
  const categorie = row.categorie as Record<string, unknown> | undefined;
  const medias = row.medias_publics ?? row.medias;
  const images = extractMaterielImageUrls(medias);

  return {
    id: String(row.id),
    titre: String(row.titre ?? "Matériel"),
    ville: row.ville != null ? String(row.ville) : undefined,
    quartier: row.quartier != null ? String(row.quartier) : undefined,
    prix_jour: row.prix_jour != null ? Number(row.prix_jour) : undefined,
    prix_semaine: row.prix_semaine != null ? Number(row.prix_semaine) : undefined,
    marque: row.marque != null ? String(row.marque) : undefined,
    modele: row.modele != null ? String(row.modele) : undefined,
    etat: row.etat != null ? String(row.etat) : undefined,
    image: images[0],
    imageCount: images.length,
    categorie: categorie?.nom != null ? String(categorie.nom) : undefined,
  };
}

export function formatFc(value?: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toLocaleString("fr-FR")} FC`;
}

export function etatLabel(etat?: string): string {
  return (
    {
      neuf: "Neuf",
      tres_bon: "Très bon",
      bon: "Bon",
      usage: "Usagé",
    }[etat ?? ""] ?? etat ?? "—"
  );
}

export function modeRemiseLabel(mode: string): string {
  return (
    {
      retrait_loueur: "Retrait chez le loueur",
      livraison_loueur: "Livraison par le loueur",
    }[mode] ?? mode
  );
}
