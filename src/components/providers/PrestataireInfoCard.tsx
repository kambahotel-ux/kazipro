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
  /** Masque téléphone / e-mail (vue publique visiteurs) */
  hideContact?: boolean;
}

export default function PrestataireInfoCard({ 
  prestataire, 
  showDetails = false,
  showPortfolio = false,
  hideContact = false,
}: PrestataireInfoCardProps) {
  const displayName = getPrestataireDisplayName(prestataire);
  
  return (
    <Card>
      <CardHeader className="pb-3 md:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg md:text-2xl truncate">{displayName}</CardTitle>
            <CardDescription className="mt-1 md:mt-2 text-sm">
              {prestataire.profession}
              {isPersonneMorale(prestataire) && prestataire.forme_juridique && (
                <span className="ml-2 text-xs">({prestataire.forme_juridique})</span>
              )}
            </CardDescription>
          </div>
          <div className="shrink-0">
            <PrestataireTypeBadge type={prestataire.type_prestataire} />
          </div>
        </div>
        
        {/* Rating - Mobile Optimized */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <div className="flex items-center">
            <Star className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />
            <span className="ml-1 font-semibold text-sm md:text-base">{prestataire.rating.toFixed(1)}</span>
          </div>
          {prestataire.verified && (
            <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
              ✓ Vérifié
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 md:space-y-4">
        {/* Bio - Mobile Optimized */}
        {prestataire.bio && (
          <p className="text-xs md:text-sm text-muted-foreground">{prestataire.bio}</p>
        )}
        
        {/* Contact - Mobile Optimized */}
        {!hideContact && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <Phone className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />
              <span className="truncate">{prestataire.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <Mail className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />
              <span className="truncate">{prestataire.email}</span>
            </div>
          </div>
        )}
        
        {/* Détails spécifiques selon le type - Mobile Optimized */}
        {showDetails && (
          <>
            {isPersonnePhysique(prestataire) && (
              <div className="pt-3 md:pt-4 border-t space-y-2">
                <h4 className="font-semibold text-xs md:text-sm flex items-center gap-2">
                  <User className="h-3 w-3 md:h-4 md:w-4" />
                  Informations personnelles
                </h4>
                <div className="text-xs md:text-sm space-y-1 text-muted-foreground">
                  <p className="truncate">Nom complet : {prestataire.prenom} {prestataire.nom}</p>
                  {prestataire.date_naissance && (
                    <p>Date de naissance : {new Date(prestataire.date_naissance).toLocaleDateString('fr-FR')}</p>
                  )}
                  {prestataire.numero_cni && (
                    <p className="truncate">N° CNI : {prestataire.numero_cni}</p>
                  )}
                </div>
              </div>
            )}
            
            {isPersonneMorale(prestataire) && (
              <div className="pt-3 md:pt-4 border-t space-y-3 md:space-y-4">
                {/* Informations entreprise - Mobile Optimized */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-xs md:text-sm flex items-center gap-2">
                    <Building2 className="h-3 w-3 md:h-4 md:w-4" />
                    Informations entreprise
                  </h4>
                  <div className="text-xs md:text-sm space-y-1 text-muted-foreground">
                    <p className="truncate">Raison sociale : {prestataire.raison_sociale}</p>
                    {prestataire.forme_juridique && (
                      <p className="truncate">Forme juridique : {prestataire.forme_juridique}</p>
                    )}
                    {prestataire.numero_rccm && (
                      <p className="truncate">N° RCCM : {prestataire.numero_rccm}</p>
                    )}
                    {prestataire.numero_impot && (
                      <p className="truncate">N° Fiscal : {prestataire.numero_impot}</p>
                    )}
                    {prestataire.numero_id_nat && (
                      <p className="truncate">N° ID Nationale : {prestataire.numero_id_nat}</p>
                    )}
                  </div>
                </div>
                
                {/* Représentant légal - Mobile Optimized */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-xs md:text-sm flex items-center gap-2">
                    <User className="h-3 w-3 md:h-4 md:w-4" />
                    Représentant légal
                  </h4>
                  <div className="text-xs md:text-sm space-y-1 text-muted-foreground">
                    <p className="truncate">
                      {prestataire.representant_legal_prenom} {prestataire.representant_legal_nom}
                    </p>
                    {prestataire.representant_legal_fonction && (
                      <p className="truncate">Fonction : {prestataire.representant_legal_fonction}</p>
                    )}
                  </div>
                </div>
                
                {/* Siège social - Mobile Optimized */}
                {(prestataire.adresse_siege || prestataire.ville_siege) && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-xs md:text-sm flex items-center gap-2">
                      <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                      Siège social
                    </h4>
                    <div className="text-xs md:text-sm space-y-1 text-muted-foreground">
                      {prestataire.adresse_siege && <p className="truncate">{prestataire.adresse_siege}</p>}
                      {prestataire.ville_siege && (
                        <p className="truncate">
                          {prestataire.ville_siege}
                          {prestataire.pays_siege && `, ${prestataire.pays_siege}`}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Documents - Mobile Optimized */}
                {(prestataire.document_rccm || prestataire.document_id_nat || prestataire.document_statuts) && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-xs md:text-sm flex items-center gap-2">
                      <FileText className="h-3 w-3 md:h-4 md:w-4" />
                      Documents
                    </h4>
                    <div className="flex flex-wrap gap-1 md:gap-2">
                      {prestataire.document_rccm && (
                        <Badge variant="outline" className="text-xs">RCCM</Badge>
                      )}
                      {prestataire.document_id_nat && (
                        <Badge variant="outline" className="text-xs">ID Nationale</Badge>
                      )}
                      {prestataire.document_statuts && (
                        <Badge variant="outline" className="text-xs">Statuts</Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
      
      {/* Portfolio - Visible pour les clients - Mobile Optimized */}
      {showPortfolio && (
        <div className="px-3 md:px-6 pb-3 md:pb-6">
          <PrestatairePortfolio prestataireId={prestataire.id} />
        </div>
      )}
    </Card>
  );
}
