import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AdminListSkeleton } from '@/components/dashboard/AdminLoadingSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, Eye, FileText,
  X, Phone, User, Hash, MapPin, Star, ChevronLeft, ChevronRight
} from 'lucide-react';
import { devisApi } from '@/lib/api';
import { parsePaginatedMeta, unwrapPaginated } from '@/lib/api-utils';
import { mapDevisToUi } from '@/lib/client-helpers';
import { displayNameFromProfil, professionLabelFromProfil } from '@/lib/kazipro-profile';
import { toast } from 'sonner';
import { DateRangeFilter } from '@/components/filters/DateRangeFilter';
import { FormDrawer } from '@/components/ui/FormDrawer';

const PAGE_SIZE = 10;

interface DevisItem {
  id?: string;
  designation: string;
  type_ligne?: string;
  quantite: number;
  unite: string;
  prix_unitaire: number;
  montant: number;
}

interface PersonInfo {
  full_name: string;
  telephone?: string;
  ville?: string;
}

interface DemandeInfo {
  numero: string;
  titre: string;
  statut?: string;
  type?: string;
  ville?: string;
  urgence?: string;
  budget_max?: number;
}

interface PrestataireInfo extends PersonInfo {
  profession?: string;
  note_moyenne?: number;
  nb_avis?: number;
  certifie?: boolean;
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
  acompte_pourcentage?: number;
  acompte_montant?: number;
  devise?: string;
  statut: string;
  motif_refus?: string;
  date_debut?: string;
  duree_jours?: number;
  date_expiration?: string;
  created_at: string;
  updated_at?: string;
  items?: DevisItem[];
  prestataire?: PrestataireInfo;
  client?: PersonInfo;
  demande?: DemandeInfo;
}

function strOrUndef(value: unknown): string | undefined {
  if (value == null || value === '') return undefined;
  const s = String(value).trim();
  return s || undefined;
}

function personName(raw?: Record<string, unknown> | null): string {
  if (!raw) return '';
  return [raw.prenom, raw.nom].filter(Boolean).join(' ').trim();
}

function formatMoney(value: unknown, devise = 'FC'): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return `— ${devise}`;
  return `${n.toLocaleString('fr-FR')} ${devise}`;
}

function mapAdminDevis(raw: Record<string, unknown>): Devis {
  const mapped = mapDevisToUi(raw);
  const prestRaw = raw.prestataire as Record<string, unknown> | undefined;
  const clientRaw = raw.client as Record<string, unknown> | undefined;
  const demandeRaw = raw.demande as Record<string, unknown> | undefined;
  const montantHt = Number(mapped.montant_ht ?? 0);
  const montantTtc = Number(mapped.montant_ttc ?? 0);
  const tva = Number(mapped.taux_tva ?? raw.tva ?? 0);
  const acomptePct = raw.acompte_pourcentage != null ? Number(raw.acompte_pourcentage) : undefined;
  const demandeTitre = strOrUndef(demandeRaw?.titre ?? demandeRaw?.title);

  return {
    id: String(raw.id),
    numero: String(raw.numero ?? ''),
    titre: String(mapped.titre ?? raw.description ?? demandeTitre ?? 'Devis'),
    prestataire_id: String(raw.prestataire_id ?? ''),
    client_id: raw.client_id != null ? String(raw.client_id) : undefined,
    demande_id: raw.demande_id != null ? String(raw.demande_id) : undefined,
    description: strOrUndef(raw.description),
    montant_ht: montantHt,
    tva,
    montant_ttc: montantTtc,
    acompte_pourcentage: acomptePct,
    acompte_montant: acomptePct != null ? Math.round(montantTtc * acomptePct) / 100 : undefined,
    devise: 'FC',
    statut: String(mapped.statut ?? raw.statut ?? 'envoye'),
    motif_refus: strOrUndef(raw.motif_refus),
    date_debut: strOrUndef(raw.date_debut),
    duree_jours: raw.duree_jours != null ? Number(raw.duree_jours) : undefined,
    date_expiration: strOrUndef(raw.validite),
    created_at: String(raw.created_at ?? new Date().toISOString()),
    updated_at: strOrUndef(raw.updated_at),
    items: (mapped.items ?? []).map((item, i) => {
      const itemRaw = Array.isArray(raw.items) ? (raw.items[i] as Record<string, unknown>) : undefined;
      return {
        id: itemRaw?.id != null ? String(itemRaw.id) : undefined,
        designation: String(item.designation ?? '—'),
        type_ligne: strOrUndef(itemRaw?.type_ligne),
        quantite: Number(item.quantite ?? 1),
        unite: String(item.unite ?? 'unité'),
        prix_unitaire: Number(item.prix_unitaire ?? 0),
        montant: Number(item.montant ?? 0),
      };
    }),
    prestataire: prestRaw
      ? {
          full_name: displayNameFromProfil(prestRaw),
          profession: professionLabelFromProfil(prestRaw),
          telephone: strOrUndef(prestRaw.telephone),
          ville: strOrUndef(prestRaw.ville),
          note_moyenne: prestRaw.note_moyenne != null ? Number(prestRaw.note_moyenne) : undefined,
          nb_avis: prestRaw.nb_avis != null ? Number(prestRaw.nb_avis) : undefined,
          certifie: prestRaw.certifie === true,
        }
      : undefined,
    client: clientRaw
      ? {
          full_name: personName(clientRaw) || 'Client',
          telephone: strOrUndef(clientRaw.telephone),
          ville: strOrUndef(clientRaw.ville),
        }
      : undefined,
    demande: demandeRaw
      ? {
          numero: String(demandeRaw.numero ?? ''),
          titre: demandeTitre ?? '—',
          statut: strOrUndef(demandeRaw.statut),
          type: strOrUndef(demandeRaw.type),
          ville: strOrUndef(demandeRaw.ville),
          urgence: strOrUndef(demandeRaw.urgence),
          budget_max: demandeRaw.budget_max != null ? Number(demandeRaw.budget_max) : undefined,
        }
      : undefined,
  };
}

const typeLigneLabel: Record<string, string> = {
  main_oeuvre: 'Main d\'œuvre',
  transport: 'Transport',
  fourniture: 'Fourniture',
  forfait: 'Forfait',
  autre: 'Autre',
};

export default function AdminDevisPage() {
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalFromApi, setTotalFromApi] = useState(0);
  const [listPage, setListPage] = useState(1);
  const [selectedDevis, setSelectedDevis] = useState<Devis | null>(null);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
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

  useEffect(() => {
    setListPage(1);
  }, [filters]);

  const fetchDevis = async () => {
    try {
      setLoading(true);
      const allRows: Record<string, unknown>[] = [];
      let page = 1;
      let lastPage = 1;
      let total = 0;

      do {
        const res = await devisApi.getAll({ page, per_page: 50 });
        const meta = parsePaginatedMeta(res);
        lastPage = meta.last_page;
        total = meta.total;
        allRows.push(...unwrapPaginated<Record<string, unknown>>(res));
        page++;
      } while (page <= lastPage);

      setTotalFromApi(total);
      setDevisList(allRows.map(mapAdminDevis));
    } catch (error: unknown) {
      toast.error('Erreur lors du chargement des devis');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDevis = useMemo(() => {
    return devisList.filter(d => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const haystack = [
          d.titre,
          d.numero,
          d.prestataire?.full_name,
          d.client?.full_name,
          d.demande?.titre,
          d.demande?.numero,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(searchLower)) return false;
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

  const totalListPages = Math.max(1, Math.ceil(filteredDevis.length / PAGE_SIZE));
  const paginatedDevis = filteredDevis.slice((listPage - 1) * PAGE_SIZE, listPage * PAGE_SIZE);
  const listFrom = filteredDevis.length === 0 ? 0 : (listPage - 1) * PAGE_SIZE + 1;
  const listTo = Math.min(listPage * PAGE_SIZE, filteredDevis.length);

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
          <h1 className="text-xl sm:text-2xl font-display font-bold">Gestion des Devis</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Visualisez et gérez tous les devis de la plateforme</p>
        </div>

        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher..."
            className="pl-10 text-sm"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        {/* Filters Toggle Button */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2 text-sm"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">{showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}</span>
            <span className="sm:hidden">{showFilters ? 'Masquer' : 'Filtres'}</span>
          </Button>
          
          {hasActiveFilters && !showFilters && (
            <Badge variant="secondary" className="text-xs">
              <span className="hidden sm:inline">Filtres actifs: {filteredDevis.length} résultat(s)</span>
              <span className="sm:hidden">{filteredDevis.length} résultat(s)</span>
            </Badge>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Filtres</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 sm:pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Status */}
              <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
                <SelectTrigger className="text-sm">
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
                <SelectTrigger className="text-sm">
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
                className="text-sm"
                value={filters.montantMin}
                onChange={(e) => setFilters({...filters, montantMin: e.target.value})}
                min="0"
              />
              
              {/* Montant Max */}
              <Input
                type="number"
                placeholder="Montant max..."
                className="text-sm"
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
              <Badge variant="secondary" className="text-xs">
                {filteredDevis.length} résultat(s)
              </Badge>
              
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="text-sm">
                  <X className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Réinitialiser les filtres</span>
                  <span className="sm:hidden">Réinitialiser</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Devis List */}
        {loading ? (
          <AdminListSkeleton items={4} />
        ) : filteredDevis.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {hasActiveFilters ? 'Aucun devis trouvé' : 'Aucun devis dans le système'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {paginatedDevis.map((devis) => (
              <Card key={devis.id} className="transition-shadow hover:shadow-card">
                <CardContent className="px-4 pt-5 pb-3 sm:px-5 sm:pt-5 sm:pb-4">
                  <div className="flex flex-col gap-4 lg:min-h-[112px] lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 min-w-0 flex-col justify-center space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base sm:text-lg truncate">{devis.titre || 'Sans titre'}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {devis.numero || 'N/A'}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusBadge(devis.statut)}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm">
                          <span className="text-muted-foreground">Prestataire: </span>
                          <span className="font-medium">{devis.prestataire?.full_name || 'N/A'}</span>
                          {devis.prestataire?.profession && (
                            <span className="text-muted-foreground"> ({devis.prestataire.profession})</span>
                          )}
                        </p>
                        {devis.client && (
                          <p className="text-xs sm:text-sm">
                            <span className="text-muted-foreground">Client: </span>
                            <span className="font-medium">{devis.client.full_name}</span>
                          </p>
                        )}
                        {devis.demande && (
                          <p className="text-xs sm:text-sm">
                            <span className="text-muted-foreground">Demande: </span>
                            <span className="truncate">{devis.demande.titre}</span>
                            {devis.demande.numero && (
                              <span className="text-muted-foreground"> ({devis.demande.numero})</span>
                            )}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                        <div>
                          <span className="text-muted-foreground">Montant HT: </span>
                          <span className="font-medium">{formatMoney(devis.montant_ht, devis.devise || 'FC')}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">TVA ({devis.tva}%): </span>
                          <span className="font-medium">{formatMoney(devis.montant_ttc - devis.montant_ht, devis.devise || 'FC')}</span>
                        </div>
                        {devis.acompte_pourcentage != null && (
                          <div>
                            <span className="text-muted-foreground">Acompte ({devis.acompte_pourcentage}%): </span>
                            <span className="font-medium">{formatMoney(devis.acompte_montant, devis.devise || 'FC')}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-base sm:text-lg font-bold text-primary">
                        Total TTC: {formatMoney(devis.montant_ttc, devis.devise || 'FC')}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-muted-foreground">
                        <span>Créé le {new Date(devis.created_at).toLocaleDateString('fr-FR')}</span>
                        {devis.duree_jours != null && (
                          <span>• Durée: {devis.duree_jours} jour(s)</span>
                        )}
                        {devis.items && devis.items.length > 0 && (
                          <span>• {devis.items.length} article(s)</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDevis(devis);
                          setShowDetailsDrawer(true);
                        }}
                        className="text-sm"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Voir détails</span>
                        <span className="sm:hidden">Détails</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredDevis.length > 0 && (
              <div className="flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row">
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {listFrom}–{listTo} sur {filteredDevis.length} devis
                  {!hasActiveFilters && totalFromApi > 0 ? ` · ${totalFromApi} en base` : ''}
                </p>
                {filteredDevis.length > PAGE_SIZE && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={listPage <= 1} onClick={() => setListPage((p) => Math.max(1, p - 1))}>
                      <ChevronLeft className="h-4 w-4" />
                      Précédent
                    </Button>
                    <span className="text-xs text-muted-foreground sm:text-sm">
                      Page {listPage} / {totalListPages}
                    </span>
                    <Button variant="outline" size="sm" disabled={listPage >= totalListPages} onClick={() => setListPage((p) => Math.min(totalListPages, p + 1))}>
                      Suivant
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <FormDrawer
          open={showDetailsDrawer && !!selectedDevis}
          onOpenChange={(open) => {
            if (!open) {
              setShowDetailsDrawer(false);
              setSelectedDevis(null);
            }
          }}
          title={selectedDevis?.titre ?? 'Devis'}
          description={selectedDevis?.numero}
        >
          {selectedDevis && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                {getStatusBadge(selectedDevis.statut)}
                {selectedDevis.statut === 'refuse' && selectedDevis.motif_refus && (
                  <Badge variant="destructive" className="text-xs">Motif: {selectedDevis.motif_refus}</Badge>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Prestataire</p>
                  <p className="font-medium text-sm">{selectedDevis.prestataire?.full_name || 'N/A'}</p>
                  {selectedDevis.prestataire?.profession && (
                    <p className="text-xs text-muted-foreground">{selectedDevis.prestataire.profession}</p>
                  )}
                  {selectedDevis.prestataire?.telephone && (
                    <p className="flex items-center gap-1 text-xs mt-1">
                      <Phone className="h-3 w-3" />
                      {selectedDevis.prestataire.telephone}
                    </p>
                  )}
                  {selectedDevis.prestataire?.note_moyenne != null && (
                    <p className="flex items-center gap-1 text-xs mt-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {selectedDevis.prestataire.note_moyenne.toFixed(2)}
                      {selectedDevis.prestataire.nb_avis != null && (
                        <span className="text-muted-foreground">({selectedDevis.prestataire.nb_avis} avis)</span>
                      )}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p className="font-medium text-sm flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {selectedDevis.client?.full_name || 'N/A'}
                  </p>
                  {selectedDevis.client?.telephone && (
                    <p className="flex items-center gap-1 text-xs mt-1">
                      <Phone className="h-3 w-3" />
                      {selectedDevis.client.telephone}
                    </p>
                  )}
                  {selectedDevis.client?.ville && (
                    <p className="flex items-center gap-1 text-xs mt-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {selectedDevis.client.ville}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Créé le</p>
                  <p className="font-medium text-sm">
                    {new Date(selectedDevis.created_at).toLocaleString('fr-FR')}
                  </p>
                  {selectedDevis.updated_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Modifié le {new Date(selectedDevis.updated_at).toLocaleString('fr-FR')}
                    </p>
                  )}
                </div>
                <div>
                  {selectedDevis.date_debut && (
                    <>
                      <p className="text-xs text-muted-foreground">Date de début</p>
                      <p className="font-medium text-sm">
                        {new Date(selectedDevis.date_debut).toLocaleDateString('fr-FR')}
                      </p>
                    </>
                  )}
                  {selectedDevis.duree_jours != null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Durée estimée: {selectedDevis.duree_jours} jour(s)
                    </p>
                  )}
                  {selectedDevis.date_expiration && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Valable jusqu'au {new Date(selectedDevis.date_expiration).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              </div>

              {selectedDevis.demande && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground mb-2">Demande associée</p>
                  <p className="font-medium text-sm">{selectedDevis.demande.titre}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {selectedDevis.demande.numero && (
                      <Badge variant="outline">{selectedDevis.demande.numero}</Badge>
                    )}
                    {selectedDevis.demande.statut && (
                      <Badge variant="secondary">{selectedDevis.demande.statut}</Badge>
                    )}
                    {selectedDevis.demande.type && (
                      <Badge variant="outline" className="capitalize">{selectedDevis.demande.type}</Badge>
                    )}
                    {selectedDevis.demande.urgence === 'urgent' && (
                      <Badge className="bg-orange-600">Urgent</Badge>
                    )}
                    {selectedDevis.demande.ville && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {selectedDevis.demande.ville}
                      </span>
                    )}
                    {selectedDevis.demande.budget_max != null && (
                      <span className="text-muted-foreground">
                        Budget max: {formatMoney(selectedDevis.demande.budget_max)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {selectedDevis.description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Description</p>
                  <p className="rounded-lg bg-muted p-3 text-sm whitespace-pre-line">{selectedDevis.description}</p>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Articles</h4>
                {selectedDevis.items && selectedDevis.items.length > 0 ? (
                  selectedDevis.items.map((item, index) => (
                    <Card key={item.id ?? index} className="p-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-sm">{item.designation}</p>
                          {item.type_ligne && (
                            <Badge variant="secondary" className="text-xs">
                              {typeLigneLabel[item.type_ligne] ?? item.type_ligne}
                            </Badge>
                          )}
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Qté: {item.quantite} {item.unite || 'unité'}</span>
                          <span>P.U.: {formatMoney(item.prix_unitaire, selectedDevis.devise || 'FC')}</span>
                        </div>
                        <div className="text-sm font-medium text-right">
                          {formatMoney(item.montant, selectedDevis.devise || 'FC')}
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <p className="text-center text-xs text-muted-foreground py-4">
                    Aucun article détaillé pour ce devis
                  </p>
                )}
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Montant HT</span>
                  <span className="font-medium">{formatMoney(selectedDevis.montant_ht, selectedDevis.devise || 'FC')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>TVA ({selectedDevis.tva}%)</span>
                  <span className="font-medium">
                    {formatMoney(selectedDevis.montant_ttc - selectedDevis.montant_ht, selectedDevis.devise || 'FC')}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold border-t pt-2">
                  <span>Total TTC</span>
                  <span className="text-primary">{formatMoney(selectedDevis.montant_ttc, selectedDevis.devise || 'FC')}</span>
                </div>
                {selectedDevis.acompte_pourcentage != null && (
                  <div className="flex justify-between text-sm border-t pt-2 text-muted-foreground">
                    <span>Acompte ({selectedDevis.acompte_pourcentage}%)</span>
                    <span className="font-medium text-foreground">
                      {formatMoney(selectedDevis.acompte_montant, selectedDevis.devise || 'FC')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </FormDrawer>
      </div>
    </DashboardLayout>
  );
}
