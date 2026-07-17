import { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Award, Upload, Loader2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { prestatairesApi, uploadApi } from "@/lib/api";
import { getProfil, prestataireIdFromUser } from "@/lib/kazipro-profile";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { SlideToConfirm } from "@/components/ui/SlideToConfirm";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  certifie: { label: "Certifié", variant: "default" },
  en_attente: { label: "En cours d'examen", variant: "secondary" },
  rejete: { label: "Rejetée", variant: "destructive" },
  non_demande: { label: "Non certifié", variant: "outline" },
};

export function CertificationRequestCard() {
  const { user, refreshUser } = useAuth();
  const prestataireId = prestataireIdFromUser(user);
  const profil = getProfil(user);
  const typePersonne = String(profil?.type_personne ?? "physique");
  const statut = String(profil?.statut_certification ?? "non_demande");
  const isMorale = typePersonne === "morale";

  const [numeroRccm, setNumeroRccm] = useState(String(profil?.numero_rccm ?? ""));
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const statusInfo = STATUS_LABELS[statut] ?? STATUS_LABELS.non_demande;
  const canSubmit = statut !== "certifie" && statut !== "en_attente" && prestataireId;

  const handleSubmit = async () => {
    if (!prestataireId || !file) {
      toast.error("Veuillez joindre un document");
      return;
    }
    try {
      setSubmitting(true);
      const dossier = isMorale ? "rccm" : "cni";
      const uploaded = await uploadApi.uploadDocument(file, dossier);
      const url = String(uploaded.url ?? "");

      if (isMorale) {
        await prestatairesApi.certifier(prestataireId, {
          numero_rccm: numeroRccm || undefined,
          document_rccm_url: url,
        });
      } else {
        await prestatairesApi.certifier(prestataireId, {
          piece_identite_url: url,
        });
      }

      toast.success("Demande de certification envoyée");
      await refreshUser();
      setFile(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur");
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  if (!prestataireId) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5" />
          Certification KaziPro
        </CardTitle>
        <CardDescription>
          Obtenez le badge certifié après validation de vos documents par l&apos;équipe admin.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          {statut === "certifie" && <CheckCircle2 className="w-4 h-4 text-green-600" />}
          {statut === "en_attente" && <Clock className="w-4 h-4 text-amber-600" />}
          {statut === "rejete" && <XCircle className="w-4 h-4 text-red-600" />}
        </div>

        {profil?.motif_rejet_certification && statut === "rejete" && (
          <Alert variant="destructive">
            <AlertDescription>{String(profil.motif_rejet_certification)}</AlertDescription>
          </Alert>
        )}

        {canSubmit && (
          <div className="space-y-4 border-t pt-4">
            {isMorale && (
              <div className="space-y-2">
                <Label htmlFor="numero_rccm">Numéro RCCM (optionnel)</Label>
                <Input
                  id="numero_rccm"
                  value={numeroRccm}
                  onChange={(e) => setNumeroRccm(e.target.value)}
                  placeholder="RCCM-..."
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>{isMorale ? "Document RCCM (PDF ou image)" : "Pièce d'identité (PDF ou image)"}</Label>
              <input
                ref={inputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                {file ? file.name : "Choisir un fichier"}
              </Button>
            </div>
            <SlideToConfirm
              label="Envoyer votre dossier de certification à l'équipe admin"
              hint="Glisser pour envoyer"
              variant="success"
              disabled={!file}
              loading={submitting}
              successMessage="Demande envoyée"
              onConfirm={handleSubmit}
            />
          </div>
        )}

        {statut === "en_attente" && (
          <p className="text-sm text-muted-foreground">
            Votre dossier est en cours de vérification (24–48 h ouvrées).
          </p>
        )}
      </CardContent>
    </Card>
  );
}
