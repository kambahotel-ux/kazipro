import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, Eye, FileText, DollarSign, CheckCircle, Clock, 
  XCircle, Loader, Download, X
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { DateRangeFilter } from '@/components/filters/DateRangeFilter';

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
  client_id?: string;
  demande_id?: string;
  description?: string;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  devise?: string;
  frais_deplacement?: number;
  statut: string;
  date_creation: string;
  date_envoi?: string;
  date_expiration?: string;
  created_at: string;
  items?: DevisItem[];
  prestataire?: {
    full_name: string;
    profession: string;
  };
  demande?: {
    title: string;
    titre: string;
  };
}

export default function AdminDevisPage() {
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDevis, setSelectedDevis] = useState<Devis | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Additional filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    devise: 'all',
    montantMin: '',
    montantMax: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchDevis();
  }, []);

  const fetchDevis = async () => {
    try {
      setLoading(true);
      
      // Charger tous les devis avec les infos prestataire et demande
      // Using explicit relationship name to avoid ambiguity
      const { data, error } = await supabase
        .from('devis')
        .select(`
          *,
          prestataire:prestataires(full_name, profession),
          demande:demandes!devis_demande_id_fkey(title, titre)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Charger les items pour chaque devis
      const devisWithItems = await Promise.all(
        (data || []).map(async (devis) => {
          const { data: itemsData } = await supabase
            .from('devis_pro_items')
            .select('*')
            .eq('devis_id', devis.id)
            .order('created_at', { ascending: true });
          
          return { 
            ...devis, 
            items: itemsData || [],
            prestataire: Array.isArray(devis.prestataire) ? devis.prestataire[0] : devis.prestataire,
            demande: Array.isArray(devis.demande) ? devis.demande[0] : devis.demande
          };
        })
      );

      setDevisList(devisWithItems);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des devis');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const total = filteredDevis.length;
    const enAttente = filteredDevis.filter(d => d.statut === 'en_attente' || d.statut === 'envoye').length;
    const acceptes = filteredDevis.filter(d => d.statut === 'accepte').length;
    const totalMontant = filteredDevis
      .filter(d => d.statut === 'accepte')
      .reduce((sum, d) => sum + d.montant_ttc, 0);

    return [
      { title: 'Total Devis', value: total.toString(), subtitle: hasActiveFilters ? 'Filtrés' : 'Tous statuts', icon: <FileText className="w-5 h-5" /> },
      { title: 'En attente', value: enAttente.toString(), subtitle: 'À traiter', icon: <Clock className="w-5 h-5" /> },
      { title: 'Acceptés', value: acceptes.toString(), subtitle: 'Validés', icon: <CheckCircle className="w-5 h-5" /> },
      { title: 'Montant total', value: `${totalMontant.toLocaleString()} FC`, subtitle: 'Devis acceptés', icon: <DollarSign className="w-5 h-5" /> },
    ];
  };

  const filteredDevis = useMemo(() => {
    return devisList.filter(d => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!(d.titre || '').toLowerCase().includes(searchLower) &&
            !(d.numero || '').toLowerCase().includes(searchLower) &&
            !(d.prestataire?.full_name || '').toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Status filter
      if (filters.status !== 'all' && d.statut !== filters.status) {
        return false;
      }
      
      // Devise filter
      if (filters.devise !== 'all' && (d.devise || 'FC') !== filters.devise) {
        return false;
      }
      
      // Montant min filter
      if (filters.montantMin && d.montant_ttc < parseFloat(filters.montantMin)) {
        return false;
      }
      
      // Montant max filter
      if (filters.montantMax && d.montant_ttc > parseFloat(filters.montantMax)) {
        return false;
      }
      
      // Date range filter
      if (filters.startDate) {
        const devisDate = new Date(d.created_at);
        const startDate = new Date(filters.startDate);
        if (devisDate < startDate) return false;
      }
      
      if (filters.endDate) {
        const devisDate = new Date(d.created_at);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (devisDate > endDate) return false;
      }
      
      return true;
    });
  }, [devisList, filters]);

  // Get unique devises for filter dropdown
  const devises = useMemo(() => {
    const uniqueDevises = [...new Set(devisList.map(d => d.devise || 'FC'))];
    return uniqueDevises.sort();
  }, [devisList]);
  
  // Check if any filters are active
  const hasActiveFilters = filters.search || filters.status !== 'all' || 
    filters.devise !== 'all' || filters.montantMin || filters.montantMax || 
    filters.startDate || filters.endDate;
  
  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      devise: 'all',
      montantMin: '',
      montantMax: '',
      startDate: '',
      endDate: '',
    });
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

  return (
    <DashboardLayout role="admin" userName="Administrateur" userRole="Admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold">Gestion des Devis</h1>
          <p className="text-muted-foreground">Visualisez et gérez tous les devis de la plateforme</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {getStats().map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Filters Toggle Button */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Search className="w-4 h-4" />
            {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
          </Button>
          
          {hasActiveFilters && !showFilters && (
            <Badge variant="secondary">
              Filtres actifs: {filteredDevis.length} résultat(s)
            </Badge>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <Card>
            <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Rechercher..." 
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                />
              </div>
              
              {/* Status */}
              <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="brouillon">Brouillons</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="envoye">Envoyés</SelectItem>
                  <SelectItem value="accepte">Acceptés</SelectItem>
                  <SelectItem value="refuse">Refusés</SelectItem>
                  <SelectItem value="expire">Expirés</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Devise */}
              <Select value={filters.devise} onValueChange={(v) => setFilters({...filters, devise: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Devise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les devises</SelectItem>
                  {devises.map(devise => (
                    <SelectItem key={devise} value={devise}>{devise}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Montant Min */}
              <Input
                type="number"
                placeholder="Montant min..."
                value={filters.montantMin}
                onChange={(e) => setFilters({...filters, montantMin: e.target.value})}
                min="0"
              />
              
              {/* Montant Max */}
              <Input
                type="number"
                placeholder="Montant max..."
                value={filters.montantMax}
                onChange={(e) => setFilters({...filters, montantMax: e.target.value})}
                min="0"
              />
            </div>
            
            {/* Date Range */}
            <div className="mb-4">
              <DateRangeFilter
                startDate={filters.startDate}
                endDate={filters.endDate}
                onStartDateChange={(d) => setFilters({...filters, startDate: d})}
                onEndDateChange={(d) => setFilters({...filters, endDate: d})}
                label="Période de création"
              />
            </div>
            
            {/* Results bar */}
            <div className="flex items-center justify-between">
              <Badge variant="secondary">
                {filteredDevis.length} résultat(s)
              </Badge>
              
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Devis List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin" />
          </div>
        ) : filteredDevis.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Aucun devis trouvé' 
                  : 'Aucun devis dans le système'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDevis.map((devis) => (
              <Card key={devis.id} className="hover:shadow-md transition-shadow">
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
                      
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="text-muted-foreground">Prestataire: </span>
                          <span className="font-medium">{devis.prestataire?.full_name || 'N/A'}</span>
                          {devis.prestataire?.profession && (
                            <span className="text-muted-foreground"> ({devis.prestataire.profession})</span>
                          )}
                        </p>
                        {devis.demande && (
                          <p className="text-sm">
                            <span className="text-muted-foreground">Demande: </span>
                            <span>{devis.demande.title || devis.demande.titre}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Montant HT: </span>
                          <span className="font-medium">{devis.montant_ht.toLocaleString()} {devis.devise || 'FC'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">TVA ({devis.tva}%): </span>
                          <span className="font-medium">{(devis.montant_ttc - devis.montant_ht).toLocaleString()} {devis.devise || 'FC'}</span>
                        </div>
                      </div>
                      
                      <div className="text-lg font-bold text-primary">
                        Total TTC: {devis.montant_ttc.toLocaleString()} {devis.devise || 'FC'}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Créé le {new Date(devis.created_at).toLocaleDateString('fr-FR')}</span>
                        {devis.date_envoi && (
                          <span>• Envoyé le {new Date(devis.date_envoi).toLocaleDateString('fr-FR')}</span>
                        )}
                        {devis.items && devis.items.length > 0 && (
                          <span>• {devis.items.length} article(s)</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDevis(devis);
                          setShowPreviewModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Voir détails
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Preview Modal */}
        {showPreviewModal && selectedDevis && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Détails du Devis</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setShowPreviewModal(false); setSelectedDevis(null); }}>
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
                      <h3 className="font-semibold mb-2">Dates</h3>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Créé le: </span>
                        {new Date(selectedDevis.date_creation).toLocaleDateString('fr-FR')}
                      </p>
                      {selectedDevis.date_envoi && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Envoyé le: </span>
                          {new Date(selectedDevis.date_envoi).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                      {selectedDevis.date_expiration && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Valable jusqu'au: </span>
                          {new Date(selectedDevis.date_expiration).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Demande */}
                  {selectedDevis.demande && (
                    <div>
                      <h3 className="font-semibold mb-2">Demande associée</h3>
                      <p className="text-sm">{selectedDevis.demande.title || selectedDevis.demande.titre}</p>
                    </div>
                  )}

                  {/* Titre et description */}
                  <div>
                    <h3 className="text-xl font-bold mb-2">{selectedDevis.titre || 'Sans titre'}</h3>
                    {selectedDevis.description && (
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedDevis.description}</p>
                    )}
                  </div>

                  {/* Items */}
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
                        {selectedDevis.items && selectedDevis.items.length > 0 ? (
                          selectedDevis.items.map((item, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-3 text-sm">{item.designation}</td>
                              <td className="p-3 text-sm text-center">{item.quantite}</td>
                              <td className="p-3 text-sm text-center">{item.unite || 'unité'}</td>
                              <td className="p-3 text-sm text-right">{item.prix_unitaire.toLocaleString()} {selectedDevis.devise || 'FC'}</td>
                              <td className="p-3 text-sm text-right font-medium">{item.montant.toLocaleString()} {selectedDevis.devise || 'FC'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr className="border-t">
                            <td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">
                              Aucun article détaillé pour ce devis
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

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

                  {/* Footer */}
                  <div className="border-t pt-4 text-center text-xs text-muted-foreground">
                    <p>KaziPro - Plateforme de services professionnels</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => { setShowPreviewModal(false); setSelectedDevis(null); }}>
                    Fermer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
