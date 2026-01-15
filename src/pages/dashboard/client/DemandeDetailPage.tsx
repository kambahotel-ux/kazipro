import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, MapPin, Calendar, FileText, Eye, CheckCircle, 
  XCircle, Clock, Loader, AlertCircle, Image as ImageIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface DevisItem {
  id: string;
  designation: string;
  quantite: number;
  unite: string;
  prix_unitaire: number;
  montant: number;
}

interface Devis {
  id: string;
  numero: string;
  titre: string;
  prestataire_id: string;
  description?: string;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  devise?: string;
  frais_deplacement?: number;
  statut: string;
  date_creation: string;
  date_envoi?: string;
  delai_execution?: string;
  delai_intervention?: string;
  garantie?: string;
  conditions_paiement?: any;
  items?: DevisItem[];
  prestataire?: {
    full_name: string;
    profession: string;
  };
}

export default function ClientDemandeDetailPage() {
  const { demandeId } = useParams<{ demandeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [demande, setDemande] = useState<any>(null);
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevis, setSelectedDevis] = useState<Devis | null>(null);
  const [showDevisModal, setShowDevisModal] = useState(false);

  useEffect(() => {
    if (user && demandeId) {
      loadData();
    }
  }, [user, demandeId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger la demande (RLS handles access control automatically)
      const { data: demandeData, error: demandeError } = await supabase
        .from('demandes')
        .select('*')
        .eq('id', demandeId)
        .maybeSingle();

      if (demandeError) throw demandeError;
      if (!demandeData) {
        toast.error('Demande introuvable');
        navigate('/dashboard/client/demandes');
        return;
      }

      setDemande(demandeData);

      // Charger les devis pour cette demande
      const { data: devisData, error: devisError } = await supabase
        .from('devis')
        .select(`
          *,
          prestataire:prestataires(full_name, profession)
        `)
        .eq('demande_id', demandeId)
        .order('created_at', { ascending: false });

      if (devisError) throw devisError;

      // Charger les items pour chaque devis
      const devisWithItems = await Promise.all(
        (devisData || []).map(async (devis) => {
          const { data: itemsData } = await supabase
            .from('devis_pro_items')
            .select('*')
            .eq('devis_id', devis.id)
            .order('created_at', { ascending: true });
          
          return { 
            ...devis, 
            items: itemsData || [],
            prestataire: Array.isArray(devis.prestataire) ? devis.prestataire[0] : devis.prestataire
          };
        })
      );

      setDevisList(devisWithItems);
    } catch (error: any) {
      console.error('Erreur chargement:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptDevis = async (devisId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir accepter ce devis ?')) return;

    try {
      // Récupérer le nom du client
      const { data: clientData } = await supabase
        .from('clients')
        .select('full_name')
        .eq('user_id', user?.id)
        .maybeSingle();

      const clientSignature = clientData?.full_name || 'Client';

      // Mettre à jour le devis avec signature
      const { error: devisError } = await supabase
        .from('devis')
        .update({ 
          statut: 'accepte',
          status: 'accepted',
          date_acceptation: new Date().toISOString(),
          client_signature: clientSignature
        })
        .eq('id', devisId);

      if (devisError) throw devisError;

      // Mettre à jour la demande
      const { error: demandeError } = await supabase
        .from('demandes')
        .update({ 
          status: 'in_progress',
          devis_accepte_id: devisId
        })
        .eq('id', demandeId);

      if (demandeError) throw demandeError;

      toast.success('Devis accepté avec succès!');
      loadData();
    } catch (error: any) {
      console.error('Erreur acceptation:', error);
      toast.error('Erreur lors de l\'acceptation du devis');
    }
  };

  const handleRejectDevis = async (devisId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir refuser ce devis ?')) return;

    try {
      const { error } = await supabase
        .from('devis')
        .update({ 
          statut: 'refuse',
          status: 'rejected',
          date_refus: new Date().toISOString()
        })
        .eq('id', devisId);

      if (error) throw error;

      toast.success('Devis refusé');
      loadData();
    } catch (error: any) {
      console.error('Erreur refus:', error);
      toast.error('Erreur lors du refus du devis');
    }
  };

  const getStatusBadge = (statut: string) => {
    const badges: Record<string, JSX.Element> = {
      brouillon: <Badge variant="secondary">Brouillon</Badge>,
      en_attente: <Badge className="bg-yellow-600">En attente</Badge>,
      envoye: <Badge className="bg-blue-600">Envoyé</Badge>,
      accepte: <Badge className="bg-green-600">Accepté</Badge>,
      refuse: <Badge variant="destructive">Refusé</Badge>,
      expire: <Badge variant="outline">Expiré</Badge>,
    };
    return badges[statut] || <Badge>{statut}</Badge>;
  };

  const getDemandeStatusBadge = (status: string) => {
    const badges: Record<string, JSX.Element> = {
      pending: <Badge className="bg-yellow-600">En attente</Badge>,
      in_progress: <Badge className="bg-blue-600">En cours</Badge>,
      completed: <Badge className="bg-green-600">Terminée</Badge>,
      cancelled: <Badge variant="destructive">Annulée</Badge>,
    };
    return badges[status] || <Badge>{status}</Badge>;
  };

  if (loading) {
    return (
      <DashboardLayout role="client" userName="Client" userRole="Client">
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!demande) {
    return (
      <DashboardLayout role="client" userName="Client" userRole="Client">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Demande introuvable</h2>
          <Button onClick={() => navigate('/dashboard/client/demandes')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux demandes
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="client" userName="Client" userRole="Client">
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/client/demandes')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux demandes
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{demande.title || demande.titre}</h1>
              <p className="text-muted-foreground mt-1">
                Créée le {new Date(demande.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
            {getDemandeStatusBadge(demande.status)}
          </div>
        </div>

        {/* Détails de la demande */}
        <Card>
          <CardHeader>
            <CardTitle>Détails de la demande</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {demande.description}
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Localisation</p>
                  <p className="text-sm text-muted-foreground">{demande.location || demande.localisation}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Date souhaitée</p>
                  <p className="text-sm text-muted-foreground">
                    {demande.preferred_date 
                      ? new Date(demande.preferred_date).toLocaleDateString('fr-FR')
                      : demande.deadline
                      ? new Date(demande.deadline).toLocaleDateString('fr-FR')
                      : demande.date_limite
                      ? new Date(demande.date_limite).toLocaleDateString('fr-FR')
                      : 'Non spécifiée'}
                  </p>
                </div>
              </div>

              {demande.budget && (
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Budget indicatif</p>
                    <p className="text-sm text-muted-foreground">{demande.budget} FC</p>
                  </div>
                </div>
              )}

              {(demande.urgency || demande.urgence) && (
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Urgence</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {demande.urgency || demande.urgence}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Images de la demande */}
            {demande.images && Array.isArray(demande.images) && demande.images.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Images ({demande.images.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {demande.images.map((imageUrl: string, index: number) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-border hover:border-primary transition-colors cursor-pointer"
                          onClick={() => window.open(imageUrl, '_blank')}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Eye className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Devis reçus */}
        <Card>
          <CardHeader>
            <CardTitle>Devis reçus ({devisList.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {devisList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun devis reçu pour le moment</p>
                <p className="text-sm mt-2">Les prestataires intéressés vous enverront leurs devis</p>
              </div>
            ) : (
              <div className="space-y-4">
                {devisList.map((devis) => (
                  <Card key={devis.id} className="border-2">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-start gap-3 flex-wrap">
                            <div>
                              <h3 className="font-semibold text-lg">{devis.titre || 'Sans titre'}</h3>
                              <p className="text-sm text-muted-foreground">{devis.numero || 'N/A'}</p>
                            </div>
                            {getStatusBadge(devis.statut)}
                          </div>

                          <div>
                            <p className="text-sm font-medium">{devis.prestataire?.full_name || 'N/A'}</p>
                            {devis.prestataire?.profession && (
                              <p className="text-sm text-muted-foreground">{devis.prestataire.profession}</p>
                            )}
                          </div>

                          {devis.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {devis.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Délai: </span>
                              <span className="font-medium">{devis.delai_execution || 'N/A'}</span>
                            </div>
                            {devis.garantie && (
                              <div>
                                <span className="text-muted-foreground">Garantie: </span>
                                <span className="font-medium">{devis.garantie}</span>
                              </div>
                            )}
                          </div>

                          <div className="text-lg font-bold text-primary">
                            Total: {devis.montant_ttc.toLocaleString()} {devis.devise || 'FC'}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDevis(devis);
                              setShowDevisModal(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Voir détails
                          </Button>

                          {devis.statut === 'envoye' || devis.statut === 'en_attente' ? (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleAcceptDevis(devis.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Accepter
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive"
                                onClick={() => handleRejectDevis(devis.id)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Refuser
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal Détails Devis */}
        {showDevisModal && selectedDevis && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Détails du Devis</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setShowDevisModal(false); setSelectedDevis(null); }}>
                  <XCircle className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="bg-white border rounded-lg p-8 space-y-6">
                  {/* Header */}
                  <div className="flex justify-between items-start border-b pb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-primary">KAZIPRO</h2>
                      <p className="text-sm text-muted-foreground">Plateforme de services professionnels</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">DEVIS</div>
                      <div className="text-sm text-muted-foreground">{selectedDevis.numero || 'N/A'}</div>
                      {getStatusBadge(selectedDevis.statut)}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">Prestataire</h3>
                      <p className="text-sm">{selectedDevis.prestataire?.full_name || 'N/A'}</p>
                      {selectedDevis.prestataire?.profession && (
                        <p className="text-sm text-muted-foreground">{selectedDevis.prestataire.profession}</p>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Dates et délais</h3>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Envoyé le: </span>
                        {selectedDevis.date_envoi 
                          ? new Date(selectedDevis.date_envoi).toLocaleDateString('fr-FR')
                          : 'N/A'}
                      </p>
                      {selectedDevis.delai_intervention && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Délai d'intervention: </span>
                          {selectedDevis.delai_intervention}
                        </p>
                      )}
                      {selectedDevis.delai_execution && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Durée des travaux: </span>
                          {selectedDevis.delai_execution}
                        </p>
                      )}
                      {selectedDevis.garantie && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Garantie: </span>
                          {selectedDevis.garantie}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Titre et description */}
                  <div>
                    <h3 className="text-xl font-bold mb-2">{selectedDevis.titre || 'Sans titre'}</h3>
                    {selectedDevis.description && (
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedDevis.description}</p>
                    )}
                  </div>

                  {/* Items */}
                  {selectedDevis.items && selectedDevis.items.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-3 text-sm font-medium">Désignation</th>
                            <th className="text-center p-3 text-sm font-medium w-20">Qté</th>
                            <th className="text-center p-3 text-sm font-medium w-24">Unité</th>
                            <th className="text-right p-3 text-sm font-medium w-28">P.U.</th>
                            <th className="text-right p-3 text-sm font-medium w-32">Montant</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDevis.items.map((item, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-3 text-sm">{item.designation}</td>
                              <td className="p-3 text-sm text-center">{item.quantite}</td>
                              <td className="p-3 text-sm text-center">{item.unite || 'unité'}</td>
                              <td className="p-3 text-sm text-right">{item.prix_unitaire.toLocaleString()} {selectedDevis.devise || 'FC'}</td>
                              <td className="p-3 text-sm text-right font-medium">{item.montant.toLocaleString()} {selectedDevis.devise || 'FC'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Totaux */}
                  <div className="flex justify-end">
                    <div className="w-80 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Montant HT:</span>
                        <span className="font-medium">{selectedDevis.montant_ht.toLocaleString()} {selectedDevis.devise || 'FC'}</span>
                      </div>
                      {selectedDevis.frais_deplacement && selectedDevis.frais_deplacement > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Frais de déplacement:</span>
                          <span className="font-medium">{selectedDevis.frais_deplacement.toLocaleString()} {selectedDevis.devise || 'FC'}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span>TVA ({selectedDevis.tva}%):</span>
                        <span className="font-medium">{(selectedDevis.montant_ttc - selectedDevis.montant_ht).toLocaleString()} {selectedDevis.devise || 'FC'}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total TTC:</span>
                        <span className="text-primary">{selectedDevis.montant_ttc.toLocaleString()} {selectedDevis.devise || 'FC'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Conditions de paiement */}
                  {selectedDevis.conditions_paiement && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-2">Conditions de paiement</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedDevis.conditions_paiement.modalites}
                      </p>
                      {selectedDevis.conditions_paiement.acompte_requis && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Acompte: {selectedDevis.conditions_paiement.montant_acompte?.toLocaleString()} {selectedDevis.devise || 'FC'} 
                          ({selectedDevis.conditions_paiement.pourcentage_acompte}%)
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => { setShowDevisModal(false); setSelectedDevis(null); }}>
                    Fermer
                  </Button>
                  {(selectedDevis.statut === 'envoye' || selectedDevis.statut === 'en_attente') && (
                    <>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          setShowDevisModal(false);
                          handleAcceptDevis(selectedDevis.id);
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accepter ce devis
                      </Button>
                      <Button
                        variant="outline"
                        className="text-destructive"
                        onClick={() => {
                          setShowDevisModal(false);
                          handleRejectDevis(selectedDevis.id);
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Refuser
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
