import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Prestataire, getPrestataireDisplayName, isPersonnePhysique, isPersonneMorale } from '@/types/prestataire';
import PrestataireTypeBadge from './PrestataireTypeBadge';
import PrestatairePortfolio from './PrestatairePortfolio';
import { Star, Phone, Mail, MapPin, Building2, User, FileText } from 'lucide-react';

interface PrestataireInfoCardProps {
  prestataire: Prestataire;
  showDetails?: boolean;
  showPortfolio?: boolean;
}

export default function PrestataireInfoCard({ 
  prestataire, 
  showDetails = false,
  showPortfolio = false
}: PrestataireInfoCardProps) {
  const displayName = getPrestataireDisplayName(prestataire);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-2xl">{displayName}</CardTitle>
            <CardDescription className="mt-2">
              {prestataire.profession}
              {isPersonneMorale(prestataire) && prestataire.forme_juridique && (
                <span className="ml-2 text-xs">({prestataire.forme_juridique})</span>
              )}
            </CardDescription>
          </div>
          <PrestataireTypeBadge type={prestataire.type_prestataire} />
        </div>
        
        {/* Rating */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="ml-1 font-semibold">{prestataire.rating.toFixed(1)}</span>
          </div>
          {prestataire.verified && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              ✓ Vérifié
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Bio */}
        {prestataire.bio && (
          <p className="text-sm text-muted-foreground">{prestataire.bio}</p>
        )}
        
        {/* Contact */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{prestataire.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{prestataire.email}</span>
          </div>
        </div>
        
        {/* Détails spécifiques selon le type */}
        {showDetails && (
          <>
            {isPersonnePhysique(prestataire) && (
              <div className="pt-4 border-t space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informations personnelles
                </h4>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p>Nom complet : {prestataire.prenom} {prestataire.nom}</p>
                  {prestataire.date_naissance && (
                    <p>Date de naissance : {new Date(prestataire.date_naissance).toLocaleDateString('fr-FR')}</p>
                  )}
                  {prestataire.numero_cni && (
                    <p>N° CNI : {prestataire.numero_cni}</p>
                  )}
                </div>
              </div>
            )}
            
            {isPersonneMorale(prestataire) && (
              <div className="pt-4 border-t space-y-4">
                {/* Informations entreprise */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Informations entreprise
                  </h4>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p>Raison sociale : {prestataire.raison_sociale}</p>
                    {prestataire.forme_juridique && (
                      <p>Forme juridique : {prestataire.forme_juridique}</p>
                    )}
                    {prestataire.numero_rccm && (
                      <p>N° RCCM : {prestataire.numero_rccm}</p>
                    )}
                    {prestataire.numero_impot && (
                      <p>N° Fiscal : {prestataire.numero_impot}</p>
                    )}
                    {prestataire.numero_id_nat && (
                      <p>N° ID Nationale : {prestataire.numero_id_nat}</p>
                    )}
                  </div>
                </div>
                
                {/* Représentant légal */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Représentant légal
                  </h4>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p>
                      {prestataire.representant_legal_prenom} {prestataire.representant_legal_nom}
                    </p>
                    {prestataire.representant_legal_fonction && (
                      <p>Fonction : {prestataire.representant_legal_fonction}</p>
                    )}
                  </div>
                </div>
                
                {/* Siège social */}
                {(prestataire.adresse_siege || prestataire.ville_siege) && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Siège social
                    </h4>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      {prestataire.adresse_siege && <p>{prestataire.adresse_siege}</p>}
                      {prestataire.ville_siege && (
                        <p>
                          {prestataire.ville_siege}
                          {prestataire.pays_siege && `, ${prestataire.pays_siege}`}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Documents */}
                {(prestataire.document_rccm || prestataire.document_id_nat || prestataire.document_statuts) && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Documents
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {prestataire.document_rccm && (
                        <Badge variant="outline">RCCM</Badge>
                      )}
                      {prestataire.document_id_nat && (
                        <Badge variant="outline">ID Nationale</Badge>
                      )}
                      {prestataire.document_statuts && (
                        <Badge variant="outline">Statuts</Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
      
      {/* Portfolio - Visible pour les clients */}
      {showPortfolio && (
        <div className="px-6 pb-6">
          <PrestatairePortfolio prestataireId={prestataire.id} />
        </div>
      )}
    </Card>
  );
}
