import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, MapPin, DollarSign, Clock, Search, Filter, Target, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

export default function OpportunitesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [urgenceFilter, setUrgenceFilter] = useState<string>('all');
  const [prestataire, setPrestataire] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    loadPrestataire();
  }, [user]);

  useEffect(() => {
    if (prestataire) {
      loadDemandes();
      loadInvitations();
    }
  }, [prestataire, urgenceFilter]);

  const loadPrestataire = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('prestataires')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    setPrestataire(data);
  };

  const loadDemandes = async () => {
    try {
      setLoading(true);

      // Load public requests only (type = 'publique' or null for backward compatibility)
      // Query directly from demandes table instead of view
      let query = supabase
        .from('demandes')
        .select('*')
        .in('statut', ['en_attente', 'active'])
        .order('created_at', { ascending: false });

      // Only show public requests (not direct invitations)
      // If type column doesn't exist yet, this will show all requests (backward compatible)
      query = query.or('type.eq.publique,type.is.null');

      // Filtrer par profession du prestataire
      if (prestataire?.profession) {
        query = query.or(`profession.eq.${prestataire.profession},service.eq.${prestataire.profession}`);
      }

      // Filtrer par urgence
      if (urgenceFilter !== 'all') {
        query = query.eq('urgence', urgenceFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading demandes:', error);
        // If error is about missing column, try without type filter
        if (error.message?.includes('type')) {
          const fallbackQuery = supabase
            .from('demandes')
            .select('*')
            .in('statut', ['en_attente', 'active'])
            .order('created_at', { ascending: false });

          if (prestataire?.profession) {
            fallbackQuery.or(`profession.eq.${prestataire.profession},service.eq.${prestataire.profession}`);
          }

          if (urgenceFilter !== 'all') {
            fallbackQuery.eq('urgence', urgenceFilter);
          }

          const { data: fallbackData, error: fallbackError } = await fallbackQuery;
          if (!fallbackError) {
            setDemandes(fallbackData || []);
            return;
          }
        }
        throw error;
      }

      // Transform data to match expected format
      const transformedData = (data || []).map(d => ({
        ...d,
        title: d.titre || d.title,
        service: d.profession || d.service,
        location: d.localisation || d.location,
        client_name: '',
        client_city: '',
        nombre_devis: 0,
      }));

      setDemandes(transformedData);
    } catch (error) {
      console.error('Erreur chargement demandes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async () => {
    if (!prestataire) return;

    try {
      const { data, error } = await supabase
        .from('demande_invitations')
        .select(`
          *,
          demande:demandes!demande_invitations_demande_id_fkey (
            id,
            titre,
            title,
            description,
            profession,
            service,
            localisation,
            location,
            budget_min,
            budget_max,
            urgence,
            deadline,
            images,
            created_at,
            type
          )
        `)
        .eq('prestataire_id', prestataire.id)
        .order('invited_at', { ascending: false });

      if (error) {
        console.error('Error loading invitations:', error);
        throw error;
      }

      console.log('Invitations loaded:', data?.length || 0, 'invitations');

      // Transform data to match Invitation interface
      const transformedInvitations = (data || []).map(inv => ({
        ...inv,
        demande: {
          ...inv.demande,
          client_name: '',
          client_city: '',
          nombre_devis: 0,
        }
      }));

      setInvitations(transformedInvitations);
    } catch (error) {
      console.error('Erreur chargement invitations:', error);
      setInvitations([]); // Set empty array on error
    }
  };

  const markInvitationAsViewed = async (invitationId: string) => {
    try {
      await supabase.rpc('mark_invitation_viewed', { invitation_id: invitationId });
    } catch (error) {
      console.error('Error marking invitation as viewed:', error);
    }
  };

  const getUrgenceBadge = (urgence: string) => {
    const badges = {
      normal: <Badge variant="secondary">Normal</Badge>,
      urgent: <Badge className="bg-orange-500">Urgent</Badge>,
      tres_urgent: <Badge variant="destructive">Très Urgent</Badge>,
    };
    return badges[urgence as keyof typeof badges] || badges.normal;
  };

  const formatBudget = (min: number, max: number) => {
    return `${min.toLocaleString()} - ${max.toLocaleString()} FC`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const filteredDemandes = demandes.filter((demande) => {
    const searchLower = searchTerm.toLowerCase();
    const title = demande.title || demande.titre || '';
    const description = demande.description || '';
    const localisation = demande.localisation || demande.location || '';
    
    return (
      title.toLowerCase().includes(searchLower) ||
      description.toLowerCase().includes(searchLower) ||
      localisation.toLowerCase().includes(searchLower)
    );
  });

  return (
    <DashboardLayout 
      role="prestataire" 
      userName={prestataire?.full_name || "Prestataire"} 
      userRole={prestataire?.profession || "Prestataire"}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Opportunités</h1>
          <p className="text-muted-foreground">
            Découvrez les demandes de services correspondant à votre profil
          </p>
        </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une demande..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtre urgence */}
            <div className="w-full md:w-48">
              <Select value={urgenceFilter} onValueChange={setUrgenceFilter}>
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
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunités publiques</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredDemandes.length}</div>
            <p className="text-xs text-muted-foreground">
              {prestataire?.profession || 'Votre profession'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invitations directes</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invitations.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {invitations.filter(inv => inv.status === 'pending').length > 0 
                ? `${invitations.filter(inv => inv.status === 'pending').length} en attente`
                : 'Total reçues'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demandes urgentes</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredDemandes.filter((d) => d.urgence === 'urgent' || d.urgence === 'tres_urgent').length}
            </div>
            <p className="text-xs text-muted-foreground">Nécessitent une réponse rapide</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Toutes ({filteredDemandes.length + invitations.length})
          </TabsTrigger>
          <TabsTrigger value="public" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Publiques ({filteredDemandes.length})
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Invitations ({invitations.length})
            {invitations.filter(inv => inv.status === 'pending').length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {invitations.filter(inv => inv.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* All Tab */}
        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chargement des opportunités...</p>
            </div>
          ) : filteredDemandes.length === 0 && invitations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune opportunité disponible</h3>
                <p className="text-muted-foreground">
                  Aucune nouvelle demande pour le moment
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {/* Invitations first */}
              {invitations.map((invitation) => (
                <DemandeCard
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
                <DemandeCard
                  key={demande.id}
                  demande={demande}
                  isInvitation={false}
                  onView={() => navigate(`/dashboard/prestataire/demandes/${demande.id}`)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Public Tab */}
        <TabsContent value="public" className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chargement des opportunités...</p>
            </div>
          ) : filteredDemandes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune demande publique</h3>
                <p className="text-muted-foreground">
                  {searchTerm
                    ? 'Aucune demande ne correspond à votre recherche'
                    : 'Aucune nouvelle demande publique pour le moment'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredDemandes.map((demande) => (
                <DemandeCard
                  key={demande.id}
                  demande={demande}
                  isInvitation={false}
                  onView={() => navigate(`/dashboard/prestataire/demandes/${demande.id}`)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="space-y-4">
          {invitations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune invitation</h3>
                <p className="text-muted-foreground">
                  Vous n'avez pas encore reçu d'invitation directe
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {invitations.map((invitation) => (
                <DemandeCard
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
    </DashboardLayout>
  );
}

// Demande Card Component
function DemandeCard({ 
  demande, 
  isInvitation, 
  invitationStatus, 
  invitedAt,
  onView 
}: { 
  demande: Demande; 
  isInvitation: boolean;
  invitationStatus?: string;
  invitedAt?: string;
  onView: () => void;
}) {
  const getUrgenceBadge = (urgence: string) => {
    const badges = {
      normal: <Badge variant="secondary">Normal</Badge>,
      urgent: <Badge className="bg-orange-500">Urgent</Badge>,
      tres_urgent: <Badge variant="destructive">Très Urgent</Badge>,
    };
    return badges[urgence as keyof typeof badges] || badges.normal;
  };

  const formatBudget = (min: number, max: number) => {
    return `${min.toLocaleString()} - ${max.toLocaleString()} FC`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getInvitationStatusBadge = (status: string) => {
    const badges = {
      pending: <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">En attente</Badge>,
      viewed: <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Vue</Badge>,
      responded: <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Répondu</Badge>,
      declined: <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/20">Refusé</Badge>,
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  return (
    <Card className={`hover:shadow-lg transition-shadow ${isInvitation ? 'border-orange-500/30' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isInvitation && (
                <Badge className="bg-orange-500">
                  <Target className="w-3 h-3 mr-1" />
                  INVITATION DIRECTE
                </Badge>
              )}
              <CardTitle className="text-xl">
                {demande.title || demande.titre}
              </CardTitle>
              {getUrgenceBadge(demande.urgence)}
              {isInvitation && invitationStatus && getInvitationStatusBadge(invitationStatus)}
            </div>
            <CardDescription className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {demande.localisation || demande.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {isInvitation && invitedAt ? `Invité le ${formatDate(invitedAt)}` : formatDate(demande.created_at)}
              </span>
              {demande.deadline && (
                <span className="flex items-center gap-1 text-orange-600">
                  <Clock className="h-4 w-4" />
                  Deadline: {formatDate(demande.deadline)}
                </span>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {demande.description}
        </p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Budget</p>
            <p className="text-lg font-bold text-primary">
              {formatBudget(demande.budget_min, demande.budget_max)}
            </p>
          </div>

          <div className="text-right">
            {!isInvitation && demande.nombre_devis !== undefined && (
              <p className="text-sm text-muted-foreground mb-1">
                {demande.nombre_devis} devis soumis
              </p>
            )}
            <Button onClick={onView}>
              Voir les détails
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
