import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  Shield, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';

interface DevisItem {
  description: string;
  quantite: number;
  prix_unitaire: number;
  montant: number;
}

interface DevisDetailCardProps {
  devis: {
    numero: string;
    montant_ht: number;
    montant_tva: number;
    montant_ttc: number;
    taux_tva: number;
    statut: string;
    validite_jours: number;
    created_at: string;
    items?: DevisItem[];
    notes?: string;
  };
  montants?: {
    montant_travaux_ht: number;
    montant_materiel_ht: number;
    frais_deplacement: number;
    commission_totale: number;
    montant_acompte: number;
    montant_solde: number;
    pourcentage_acompte: number;
    pourcentage_solde: number;
  };
  paiementViaKazipro?: boolean;
}

export function DevisDetailCard({ devis, montants, paiementViaKazipro = true }: DevisDetailCardProps) {
  const getStatutBadge = (statut: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      'en_attente': { variant: 'secondary', label: 'En attente' },
      'envoye': { variant: 'default', label: 'Envoyé' },
      'accepte': { variant: 'default', label: 'Accepté' },
      'refuse': { variant: 'destructive', label: 'Refusé' },
      'expire': { variant: 'secondary', label: 'Expiré' },
    };
    const config = variants[statut] || { variant: 'secondary', label: statut };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const dateExpiration = new Date(devis.created_at);
  dateExpiration.setDate(dateExpiration.getDate() + devis.validite_jours);
  const isExpired = dateExpiration < new Date();

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Devis {devis.numero}
              </CardTitle>
              <CardDescription className="mt-2">
                Créé le {new Date(devis.created_at).toLocaleDateString('fr-FR')}
              </CardDescription>
            </div>
            {getStatutBadge(devis.statut)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              Valide jusqu'au {dateExpiration.toLocaleDateString('fr-FR')}
              {isExpired && <span className="text-red-500 ml-2">(Expiré)</span>}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Détails du devis */}
      {devis.items && devis.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Détails</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {devis.items.map((item, index) => (
                <div key={index} className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium">{item.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantite} × {item.prix_unitaire.toLocaleString()} FC
                    </p>
                  </div>
                  <p className="font-semibold">{item.montant.toLocaleString()} FC</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Montants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Montants
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Montant HT</span>
            <span className="font-medium">{devis.montant_ht.toLocaleString()} FC</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">TVA ({devis.taux_tva}%)</span>
            <span className="font-medium">{devis.montant_tva.toLocaleString()} FC</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="font-semibold">Total TTC</span>
            <span className="text-xl font-bold text-primary">
              {devis.montant_ttc.toLocaleString()} FC
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Paiement via KaziPro */}
      {paiementViaKazipro && montants && (
        <>
          <Alert className="bg-blue-50 border-blue-200">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>Paiement sécurisé via KaziPro</strong>
              <br />
              Votre paiement est protégé. L'acompte est versé avant le début des travaux, 
              et le solde après validation de votre part.
            </AlertDescription>
          </Alert>

          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Conditions de paiement
              </CardTitle>
              <CardDescription>
                Paiement en 2 fois pour votre sécurité
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Acompte */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-900">
                      Acompte ({montants.pourcentage_acompte}%)
                    </span>
                  </div>
                  <span className="text-xl font-bold text-green-700">
                    {montants.montant_acompte.toLocaleString()} FC
                  </span>
                </div>
                <p className="text-sm text-green-800 ml-7">
                  À payer avant le début des travaux
                </p>
              </div>

              {/* Solde */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">
                      Solde ({montants.pourcentage_solde}%)
                    </span>
                  </div>
                  <span className="text-xl font-bold text-blue-700">
                    {montants.montant_solde.toLocaleString()} FC
                  </span>
                </div>
                <p className="text-sm text-blue-800 ml-7">
                  À payer après validation des travaux
                </p>
              </div>

              {/* Commission */}
              {montants.commission_totale > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Frais de service KaziPro:</strong> {montants.commission_totale.toLocaleString()} FC
                    <br />
                    <span className="text-sm text-muted-foreground">
                      Inclus dans le montant total pour la sécurité de la transaction
                    </span>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Notes */}
      {devis.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {devis.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
