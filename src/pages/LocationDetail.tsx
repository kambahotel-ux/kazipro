import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, Shield, Calendar, User, Truck, Package2 } from "lucide-react";
import { materielsApi } from "@/lib/api";
import {
  extractMaterielImageUrls,
  formatFc,
  etatLabel,
  modeRemiseLabel,
} from "@/lib/materiel-display";
import { MaterielImageGallery } from "@/components/location/MaterielImageGallery";
import { toast } from "sonner";

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === "" || value === "—") return null;
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/60 py-2.5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground sm:text-right">{value}</span>
    </div>
  );
}

export default function LocationDetail() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [materiel, setMateriel] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!id) return;
    void load(id);
  }, [id]);

  const load = async (materielId: string) => {
    try {
      setLoading(true);
      const raw = await materielsApi.getById(materielId);
      setMateriel(raw as Record<string, unknown>);
    } catch {
      toast.error("Annonce introuvable");
      setMateriel(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="container mx-auto max-w-5xl px-4 py-10">
          <Skeleton className="mb-6 h-8 w-48" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="aspect-[4/3] rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!materiel) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Cette annonce n&apos;est plus disponible.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/location">Retour au catalogue</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  const categorie = materiel.categorie as Record<string, unknown> | undefined;
  const loueur = materiel.loueur as Record<string, unknown> | undefined;
  const user = loueur?.user as Record<string, unknown> | undefined;
  const cautionInfo = materiel.caution_info as Record<string, unknown> | undefined;
  const modesRemise = Array.isArray(materiel.modes_remise)
    ? (materiel.modes_remise as string[]).map(modeRemiseLabel).join(" · ")
    : undefined;

  const images = extractMaterielImageUrls(materiel.medias_publics ?? materiel.medias);
  const titre = String(materiel.titre ?? "");

  const cautionMontant =
    cautionInfo?.montant != null
      ? Number(cautionInfo.montant)
      : materiel.caution_calculee != null
        ? Number(materiel.caution_calculee)
        : undefined;

  return (
    <PublicLayout>
      <div className="container mx-auto max-w-5xl px-3 py-8 sm:px-4 lg:px-8">
        <Link
          to="/location"
          className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Catalogue location
        </Link>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <MaterielImageGallery images={images} alt={titre} />

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {categorie?.nom && <Badge variant="secondary">{String(categorie.nom)}</Badge>}
              {materiel.etat && <Badge variant="outline">{etatLabel(String(materiel.etat))}</Badge>}
            </div>

            <h1 className="font-display text-2xl font-bold leading-tight sm:text-3xl">{titre}</h1>

            {(materiel.ville || materiel.quartier) && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                {[materiel.ville, materiel.quartier].filter(Boolean).join(" · ")}
              </p>
            )}

            <div className="rounded-xl border bg-muted/30 p-4">
              {materiel.prix_jour != null && (
                <p className="text-2xl font-bold text-primary">
                  {formatFc(Number(materiel.prix_jour))}
                  <span className="text-base font-normal text-muted-foreground"> / jour</span>
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {materiel.prix_semaine != null && (
                  <span>Semaine : {formatFc(Number(materiel.prix_semaine))}</span>
                )}
                {materiel.prix_heure != null && (
                  <span>Heure : {formatFc(Number(materiel.prix_heure))}</span>
                )}
              </div>
              {cautionMontant != null && cautionMontant > 0 && (
                <p className="mt-2 text-sm">
                  <Shield className="mr-1 inline h-3.5 w-3.5 text-primary" />
                  Caution : <span className="font-semibold text-foreground">{formatFc(cautionMontant)}</span>
                </p>
              )}
            </div>

            {user?.name && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                Loueur : <span className="font-medium text-foreground">{String(user.name)}</span>
              </p>
            )}

            {materiel.description && (
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {String(materiel.description)}
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild size="lg" className="flex-1">
                <Link to="/connexion">Se connecter pour réserver</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="flex-1">
                <Link to="/inscription/client">Créer un compte</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package2 className="h-4 w-4 text-primary" />
                Caractéristiques
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <InfoRow label="Marque" value={materiel.marque != null ? String(materiel.marque) : undefined} />
              <InfoRow label="Modèle" value={materiel.modele != null ? String(materiel.modele) : undefined} />
              <InfoRow label="État" value={materiel.etat ? etatLabel(String(materiel.etat)) : undefined} />
              <InfoRow
                label="Stock disponible"
                value={materiel.quantite_stock != null ? String(materiel.quantite_stock) : undefined}
              />
              <InfoRow
                label="Valeur de remplacement"
                value={
                  materiel.valeur_remplacement != null
                    ? formatFc(Number(materiel.valeur_remplacement))
                    : undefined
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-4 w-4 text-primary" />
                Tarifs & remise
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <InfoRow
                label="Prix / jour"
                value={materiel.prix_jour != null ? formatFc(Number(materiel.prix_jour)) : undefined}
              />
              <InfoRow
                label="Prix / semaine"
                value={materiel.prix_semaine != null ? formatFc(Number(materiel.prix_semaine)) : undefined}
              />
              <InfoRow
                label="Prix / heure"
                value={materiel.prix_heure != null ? formatFc(Number(materiel.prix_heure)) : undefined}
              />
              <InfoRow
                label="Frais de livraison"
                value={
                  materiel.frais_livraison != null && Number(materiel.frais_livraison) > 0
                    ? formatFc(Number(materiel.frais_livraison))
                    : "Gratuit ou sur devis"
                }
              />
              <InfoRow label="Modes de remise" value={modesRemise} />
            </CardContent>
          </Card>

          {materiel.conditions && (
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Conditions de location</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {String(materiel.conditions)}
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-primary" />
                Garanties KaziPro
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 pt-0">
              <Badge variant="outline" className="gap-1">
                <Shield className="h-3 w-3" />
                Caution séquestrée
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Calendar className="h-3 w-3" />
                Contrat de location
              </Badge>
              <Badge variant="outline">Paiement Mobile Money</Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
}
