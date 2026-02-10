import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { 
  Search, 
  Eye, 
  Download,
  FileText, 
  CheckCircle, 
  Clock,
  User,
  DollarSign,
  Calendar,
  Loader
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Contrat {
  id: string;
  numero: string;
  devis_id: string;
  client_id: string;
  prestataire_id: string;
  statut: string;
  date_signature_client: string | null;
  date_signature_prestataire: string | null;
  conditions_paiement: any;
  created_at: string;
  clients?: {
    full_name: string;
  };
  devis?: {
    montant_ttc: number;
    titre: string;
    description: string;
  };
}

export default function ContratsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [providerName, setProviderName] = useState('Prestataire');
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (user) {
      fetchProviderData();
    }
  }, [user]);

  const fetchProviderData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Récupérer l'ID du prestataire
      const { data: providerData, error: providerError } = await supabase
        .from('prestataires')
        .select('id, full_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (providerError) throw providerError;
      
      if (!providerData) {
        toast.error('Profil prestataire non trouvé');
        return;
      }

      setProviderName(providerData.full_name);

      // Récupérer les contrats du prestataire
      const { data: contratsData, error: contratsError } = await supabase
        .from('contrats')
        .select(`
          *,
          clients (
            full_name
          )
        `)
        .eq('prestataire_id', providerData.id)
        .order('created_at', { ascending: false });

      if (contratsError) throw contratsError;

      // Enrichir avec les données des devis (depuis les deux tables)
      if (contratsData) {
        const enrichedContrats = await Promise.all(
          contratsData.map(async (contrat) => {
            // Essayer d'abord dans devis_pro
            let { data: devisData } = await supabase
              .from('devis_pro')
              .select('montant_ttc, titre, description')
              .eq('id', contrat.devis_id)
              .maybeSingle();

            // Si pas trouvé, essayer dans devis (ancienne table)
            if (!devisData) {
              const { data: oldDevisData } = await supabase
                .from('devis')
                .select('montant_ttc, titre, description')
                .eq('id', contrat.devis_id)
                .maybeSingle();
              
              devisData = oldDevisData;
            }

            return {
              ...contrat,
              devis: devisData
            };
          })
        );

        setContrats(enrichedContrats);
      } else {
        setContrats([]);
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des contrats');
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const signes = contrats.filter(c => c.statut === 'signe').length;
    const enAttente = contrats.filter(c => c.statut === 'en_attente').length;
    const totalMontant = contrats
      .filter(c => c.statut === 'signe')
      .reduce((sum, c) => sum + (c.devis?.montant_ttc || 0), 0);

    return [
      { 
        title: 'Contrats signés', 
        value: signes.toString(), 
        subtitle: 'Actifs', 
        icon: <CheckCircle className="w-5 h-5" /> 
      },
      { 
        title: 'En attente', 
        value: enAttente.toString(), 
        subtitle: 'Signature client', 
        icon: <Clock className="w-5 h-5" /> 
      },
      { 
        title: 'Valeur totale', 
        value: `${totalMontant.toLocaleString()} FC`, 
        subtitle: 'Contrats signés', 
        icon: <DollarSign className="w-5 h-5" /> 
      },
    ];
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'signe':
        return <Badge variant="default">Signé</Badge>;
      case 'en_attente':
        return <Badge variant="secondary">En attente</Badge>;
      case 'annule':
        return <Badge variant="destructive">Annulé</Badge>;
      default:
        return <Badge>{statut}</Badge>;
    }
  };

  const getStatutPaiementBadge = (statutPaiement: string) => {
    switch (statutPaiement) {
      case 'totalement_paye':
        return <Badge className="bg-green-600">Totalement payé</Badge>;
      case 'acompte_paye':
        return <Badge className="bg-orange-500">Partiellement payé</Badge>;
      case 'non_paye':
        return <Badge variant="secondary">Non payé</Badge>;
      default:
        return <Badge variant="secondary">Non payé</Badge>;
    }
  };

  const handleDownloadContrat = async (contrat: Contrat) => {
    try {
      // Rediriger vers la page de signature/visualisation du contrat
      navigate(`/dashboard/prestataire/contrat/${contrat.id}`);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'ouverture du contrat');
    }
  };

  const filteredContrats = contrats.filter(c => {
    const matchesSearch = 
      c.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.devis?.titre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.statut === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <DashboardLayout role="prestataire" userName={providerName} userRole="Prestataire">
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="prestataire" userName={providerName} userRole="Prestataire">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Mes Contrats</h1>
          <p className="text-muted-foreground">Gérez vos contrats et suivez leur statut</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {getStats().map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Rechercher un contrat..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="en_attente">En attente</SelectItem>
              <SelectItem value="signe">Signés</SelectItem>
              <SelectItem value="annule">Annulés</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Contrats List */}
        {filteredContrats.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Aucun contrat trouvé avec ces critères' 
                  : 'Aucun contrat pour le moment'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredContrats.map((contrat) => (
              <Card key={contrat.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      {/* Header */}
                      <div className="flex items-start gap-3 flex-wrap">
                        <FileText className="w-5 h-5 text-primary mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-lg">Contrat {contrat.numero}</h3>
                            {getStatusBadge(contrat.statut)}
                            {contrat.statut_paiement && getStatutPaiementBadge(contrat.statut_paiement)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {contrat.devis?.titre || 'Contrat de prestation'}
                          </p>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="grid sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="w-4 h-4" />
                          <span>Client: <span className="font-medium text-foreground">
                            {contrat.clients?.full_name || 'N/A'}
                          </span></span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          <span>Montant: <span className="font-medium text-primary">
                            {contrat.devis?.montant_ttc?.toLocaleString() || 0} FC
                          </span></span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Créé le: <span className="font-medium text-foreground">
                            {new Date(contrat.created_at).toLocaleDateString('fr-FR')}
                          </span></span>
                        </div>
                        {contrat.date_signature_client && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>Signé le: <span className="font-medium text-foreground">
                              {new Date(contrat.date_signature_client).toLocaleDateString('fr-FR')}
                            </span></span>
                          </div>
                        )}
                      </div>

                      {/* Conditions de paiement */}
                      {contrat.conditions_paiement && (
                        <div className="bg-muted/50 p-3 rounded-lg text-sm">
                          <p className="font-medium mb-1">Conditions de paiement:</p>
                          <p className="text-muted-foreground">
                            Acompte: {contrat.conditions_paiement.acompte || 30}% • 
                            Solde: {contrat.conditions_paiement.solde || 70}%
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                      <Button
                        variant="outline"
                        onClick={() => handleDownloadContrat(contrat)}
                        className="w-full sm:w-auto"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Voir
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDownloadContrat(contrat)}
                        className="w-full sm:w-auto"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
