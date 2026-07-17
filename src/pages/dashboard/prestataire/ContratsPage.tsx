import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PrestatairePageShell } from '@/components/prestataire/PrestatairePageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminListSkeleton, PageHeaderSkeleton } from '@/components/dashboard/AdminLoadingSkeleton';
import { PrestataireEmptyState } from '@/components/prestataire/PrestataireEmptyState';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  MoreHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAbortableFetch } from '@/hooks/useAbortableFetch';
import { contratsApi } from '@/lib/api';
import { parsePaginatedMeta, unwrapPaginated } from '@/lib/api-utils';
import { displayNameFromProfil, getProfil, prestataireIdFromUser } from '@/lib/kazipro-profile';
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

export default function ContratsPage({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalContrats, setTotalContrats] = useState(0);
  const PAGE_SIZE = 20;

  const providerDisplayName = user ? displayNameFromProfil(getProfil(user) ?? {}, user.name || 'Prestataire') : 'Prestataire';

  useAbortableFetch(Boolean(user), [user, page, searchTerm, filterStatus], async (signal) => {
    if (!user || signal.aborted) return;
    await fetchProviderData(page, signal);
  });

  const fetchProviderData = async (targetPage = 1, signal?: AbortSignal) => {
    if (!user) return;
    try {
      setLoading(true);
      const profil = getProfil(user);
      const pid = prestataireIdFromUser(user);
      if (!profil || !pid) {
        toast.error('Profil prestataire non trouvé');
        return;
      }
      if (signal?.aborted) return;
      const res = await contratsApi.getAll({
        page: targetPage,
        per_page: PAGE_SIZE,
        search: searchTerm || undefined,
        statut: filterStatus !== 'all' ? filterStatus : undefined,
      });
      const meta = parsePaginatedMeta(res);
      const contratsData = unwrapPaginated<Record<string, unknown>>(res);
      const mappedContrats = contratsData.map((contrat) => {
        const client = contrat.client as Record<string, unknown> | undefined;
        const devis = contrat.devis as Record<string, unknown> | undefined;
        const demande = contrat.demande as Record<string, unknown> | undefined;
        return {
          ...contrat,
          clients: client ? { full_name: displayNameFromProfil(client) } : contrat.clients,
          devis: devis || demande ? {
            montant_ttc: Number(devis?.montant_ttc ?? 0),
            titre: String(demande?.titre ?? devis?.numero ?? 'Contrat de prestation'),
            description: String(devis?.description ?? ''),
          } : undefined,
        };
      });
      setContrats(mappedContrats as Contrat[]);
      setPage(meta.current_page || targetPage);
      setLastPage(Math.max(1, meta.last_page || 1));
      setTotalContrats(meta.total ?? contratsData.length);
    } catch (error: unknown) {
      if (signal?.aborted) return;
      toast.error(error instanceof Error ? error.message : 'Erreur lors du chargement');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
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

  const filteredContrats = contrats;

  if (loading) {
    return (
      <PrestatairePageShell embedded={embedded} userName={providerDisplayName} userRole="Prestataire">
        <div className="space-y-6">
          <PageHeaderSkeleton withActions />
          <AdminListSkeleton items={4} />
        </div>
      </PrestatairePageShell>
    );
  }

  const hasActiveFilters = searchTerm.trim().length > 0 || filterStatus !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setPage(1);
  };

  return (
    <PrestatairePageShell embedded={embedded} userName={providerDisplayName} userRole="Prestataire">
      <div className="space-y-6">
        {!embedded && (
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Mes Contrats</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gérez vos contrats et suivez leur statut</p>
        </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            onClick={() => setShowFilters((v) => !v)}
            className="gap-2"
          >
            <Search className="w-4 h-4" />
            {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
          </Button>
          {hasActiveFilters && !showFilters ? (
            <Badge variant="secondary">{totalContrats} résultat(s)</Badge>
          ) : null}
        </div>
        {showFilters ? (
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Rechercher un contrat..."
                    className="pl-10 text-sm"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
                  <SelectTrigger className="w-full text-sm">
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
              {hasActiveFilters ? (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Réinitialiser les filtres
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {/* Contrats List */}
        {filteredContrats.length === 0 ? (
          <PrestataireEmptyState
            context="contrats"
            hasActiveFilters={hasActiveFilters}
            onResetFilters={resetFilters}
          />
        ) : (
          <div className="space-y-4">
            {filteredContrats.map((contrat) => (
              <Card key={contrat.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
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
                    <div className="flex items-center gap-2 sm:justify-end">
                      <Button
                        variant="outline"
                        onClick={() => handleDownloadContrat(contrat)}
                        className="w-full sm:w-auto"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Voir
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="h-9 w-9">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownloadContrat(contrat)} className="gap-2">
                            <Eye className="w-4 h-4" />
                            Voir le contrat
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadContrat(contrat)} className="gap-2">
                            <Download className="w-4 h-4" />
                            Télécharger PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Page {page} sur {lastPage} ({totalContrats} contrat(s))
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= lastPage}
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                >
                  Suivant
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PrestatairePageShell>
  );
}
