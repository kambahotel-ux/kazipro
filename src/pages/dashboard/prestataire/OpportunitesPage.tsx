import { useState, useEffect } from 'react';
import { useAbortableFetch } from '@/hooks/useAbortableFetch';
import { useNavigate } from 'react-router-dom';
import { demandesApi } from '@/lib/api';
import { parsePaginatedMeta, unwrapPaginated } from '@/lib/api-utils';
import { getProfil, professionLabelFromProfil } from '@/lib/kazipro-profile';
import { useAuth } from '@/contexts/AuthContext';
import { PrestatairePageShell } from '@/components/prestataire/PrestatairePageShell';
import { Card, CardContent } from '@/components/ui/card';
import { OpportuniteCard } from '@/components/prestataire/OpportuniteCard';
import { PrestataireEmptyState } from '@/components/prestataire/PrestataireEmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, Search, Filter, Target, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminListSkeleton } from '@/components/dashboard/AdminLoadingSkeleton';
import { mapDemandeToUi } from '@/lib/client-helpers';

interface Demande {
  id: string;
  title: string;
  titre: string;
  description: string;
  profession: string;
  service: string;
  localisation: string;
  location: string;
  budget_min: number;
  budget_max: number;
  urgence: string;
  deadline: string;
  images: string[];
  created_at: string;
  client_name: string;
  client_city: string;
  nombre_devis: number;
  type?: string;
  statut?: string;
}

interface Invitation {
  id: string;
  demande_id: string;
  status: string;
  invited_at: string;
  viewed_at: string | null;
  responded_at: string | null;
  demande: Demande;
}

type OpportunitesPageProps = { embedded?: boolean };

export default function OpportunitesPage({ embedded = false }: OpportunitesPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [urgenceFilter, setUrgenceFilter] = useState<string>('all');
  const [prestataire, setPrestataire] = useState<Record<string, unknown> | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalDemandes, setTotalDemandes] = useState(0);
  const PAGE_SIZE = 20;

  const hasActiveFilters = Boolean(searchTerm.trim()) || urgenceFilter !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setUrgenceFilter('all');
    setPage(1);
  };

  useEffect(() => {
    loadPrestataire();
  }, [user]);

  useAbortableFetch(Boolean(prestataire), [prestataire, urgenceFilter, page, searchTerm], async (signal) => {
    if (!prestataire || signal.aborted) return;
    await loadDemandes(page, signal);
  });

  const loadPrestataire = async () => {
    if (!user) return;
    setPrestataire(getProfil(user));
  };

  const loadDemandes = async (targetPage = 1, signal?: AbortSignal) => {
    try {
      setLoading(true);
      const res = await demandesApi.getAll({
        page: targetPage,
        per_page: PAGE_SIZE,
        urgence: urgenceFilter !== 'all' ? urgenceFilter : undefined,
        search: searchTerm.trim() || undefined,
      });
      const meta = parsePaginatedMeta(res);
      const rows = unwrapPaginated<Record<string, unknown>>(res);

      // L'API filtre déjà par profession / ville / statut pour le prestataire connecté
      const transformedData = rows.map((d) => {
        const mapped = mapDemandeToUi(d);
        const client = d.client as Record<string, unknown> | undefined;
        const clientName = client
          ? [client.prenom, client.nom].filter(Boolean).join(' ').trim()
          : '';

        return {
          ...mapped,
          id: String(mapped.id ?? d.id),
          titre: String(mapped.title),
          title: String(mapped.title),
          description: String(mapped.description ?? ''),
          profession: String(mapped.service ?? mapped.profession_nom ?? ''),
          service: String(mapped.service ?? mapped.profession_nom ?? ''),
          localisation: String(mapped.location ?? ''),
          location: String(mapped.location ?? ''),
          budget_min: Number(mapped.budget_min ?? 0),
          budget_max: Number(mapped.budget_max ?? 0),
          urgence: String(mapped.urgence ?? d.urgence ?? 'normal'),
          statut: String(mapped.statut ?? d.statut ?? ''),
          created_at: String(mapped.created_at ?? d.created_at ?? ''),
          client_name: clientName,
          client_city: String(client?.ville ?? ''),
          nombre_devis: Number(d.devis_count ?? mapped.devis_count ?? 0),
          type: String(d.type ?? 'publique'),
          images: Array.isArray(mapped.images) ? mapped.images : [],
        } as Demande;
      });

      setDemandes(transformedData);
      setPage(meta.current_page || targetPage);
      setLastPage(Math.max(1, meta.last_page || 1));
      setTotalDemandes(meta.total ?? transformedData.length);
    } catch (error) {
      if (!signal?.aborted) console.error('Erreur chargement demandes:', error);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  const markInvitationAsViewed = async (_invitationId: string) => {
    // Invitations gérées côté API Laravel — noop côté client pour l'instant
  };

  const filteredDemandes = demandes;

  return (
    <PrestatairePageShell
      embedded={embedded}
      userName={String(prestataire?.full_name ?? 'Prestataire')}
      userRole={professionLabelFromProfil(prestataire) || 'Prestataire'}
    >
        {loading && !prestataire ? (
          <AdminListSkeleton items={3} />
        ) : (
        <div className="space-y-6">
          {!embedded && (
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Opportunités</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
            Découvrez les demandes de services correspondant à votre profil
          </p>
        </div>
          )}

      <div className="flex items-center justify-between gap-3">
        <Button
          variant={showFilters ? "default" : "outline"}
          onClick={() => setShowFilters((v) => !v)}
          className="gap-2"
        >
          <Search className="h-4 w-4" />
          {showFilters ? "Masquer les filtres" : "Afficher les filtres"}
        </Button>
        {(searchTerm || urgenceFilter !== "all") && !showFilters ? (
          <Badge variant="secondary">{totalDemandes} résultat(s)</Badge>
        ) : null}
      </div>
      {showFilters ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher une demande..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={urgenceFilter} onValueChange={(v) => { setUrgenceFilter(v); setPage(1); }}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Urgence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="tres_urgent">Très Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {hasActiveFilters ? (
              <Button variant="ghost" size="sm" className="mt-3" onClick={resetFilters}>
                Réinitialiser les filtres
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="all" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
            <Briefcase className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Toutes</span>
            <span className="sm:hidden">Toutes</span>
            <span className="ml-1">({totalDemandes + invitations.length})</span>
          </TabsTrigger>
          <TabsTrigger value="public" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
            <Target className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Publiques</span>
            <span className="sm:hidden">Public</span>
            <span className="ml-1">({totalDemandes})</span>
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Invitations</span>
            <span className="sm:hidden">Invit.</span>
            <span className="ml-1">({invitations.length})</span>
            {invitations.filter(inv => inv.status === 'pending').length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {invitations.filter(inv => inv.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* All Tab */}
        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <AdminListSkeleton items={3} />
          ) : filteredDemandes.length === 0 && invitations.length === 0 ? (
            <PrestataireEmptyState
              context="opportunites"
              hasActiveFilters={hasActiveFilters}
              onResetFilters={resetFilters}
            />
          ) : (
            <div className="grid gap-4">
              {/* Invitations first */}
              {invitations.map((invitation) => (
                <OpportuniteCard
                  key={`inv-${invitation.id}`}
                  demande={invitation.demande}
                  isInvitation={true}
                  invitationStatus={invitation.status}
                  invitedAt={invitation.invited_at}
                  onView={() => {
                    markInvitationAsViewed(invitation.id);
                    navigate(`/dashboard/prestataire/demandes/${invitation.demande.id}`);
                  }}
                />
              ))}
              {/* Then public requests */}
              {filteredDemandes.map((demande) => (
                <OpportuniteCard
                  key={demande.id}
                  demande={demande}
                  isInvitation={false}
                  onView={() => navigate(`/dashboard/prestataire/demandes/${demande.id}`)}
                />
              ))}
              <div className="flex items-center justify-between pt-1">
                <p className="text-sm text-muted-foreground">
                  Page {page} sur {lastPage} ({totalDemandes} opportunité(s))
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
        </TabsContent>

        {/* Public Tab */}
        <TabsContent value="public" className="space-y-4">
          {loading ? (
            <AdminListSkeleton items={3} />
          ) : filteredDemandes.length === 0 ? (
            <PrestataireEmptyState
              context="opportunites_public"
              hasActiveFilters={hasActiveFilters}
              onResetFilters={resetFilters}
            />
          ) : (
            <div className="grid gap-4">
              {filteredDemandes.map((demande) => (
                <OpportuniteCard
                  key={demande.id}
                  demande={demande}
                  isInvitation={false}
                  onView={() => navigate(`/dashboard/prestataire/demandes/${demande.id}`)}
                />
              ))}
              <div className="flex items-center justify-between pt-1">
                <p className="text-sm text-muted-foreground">
                  Page {page} sur {lastPage} ({totalDemandes} opportunité(s))
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
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="space-y-4">
          {invitations.length === 0 ? (
            <PrestataireEmptyState
              context="invitations"
              hasActiveFilters={false}
            />
          ) : (
            <div className="grid gap-4">
              {invitations.map((invitation) => (
                <OpportuniteCard
                  key={invitation.id}
                  demande={invitation.demande}
                  isInvitation={true}
                  invitationStatus={invitation.status}
                  invitedAt={invitation.invited_at}
                  onView={() => {
                    markInvitationAsViewed(invitation.id);
                    navigate(`/dashboard/prestataire/demandes/${invitation.demande.id}`);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
        )}
    </PrestatairePageShell>
  );
}
