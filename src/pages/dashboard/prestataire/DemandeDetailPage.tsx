import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  MapPin, 
  DollarSign, 
  Clock, 
  Calendar,
  User,
  FileText,
  MessageSquare,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Demande {
  id: string;
  client_id: string;
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
  statut: string;
  deadline: string;
  images: string[];
  created_at: string;
}

interface Client {
  id: string;
  full_name: string;
  city: string;
  verified: boolean;
}

interface DevisExistant {
  id: string;
  amount: number;
  montant_ttc: number;
  status: string;
  statut: string;
  created_at: string;
}

export default function DemandeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [demande, setDemande] = useState<Demande | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [devisExistant, setDevisExistant] = useState<DevisExistant | null>(null);
  const [nombreDevis, setNombreDevis] = useState(0);
  const [loading, setLoading] = useState(true);
  const [prestataire, setPrestataire] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [id, user]);

  const loadData = async () => {
    if (!id || !user) return;

    try {
      setLoading(true);

      // Charger le prestataire
      const { data: prestataireData } = await supabase
        .from('prestataires')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setPrestataire(prestataireData);

      // Charger la demande
      const { data: demandeData, error: demandeError } = await supabase
        .from('demandes')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (demandeError) throw demandeError;
      setDemande(demandeData);

      // Charger le client
      if (demandeData?.client_id) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('*')
          .eq('id', demandeData.client_id)
          .maybeSingle();

        setClient(clientData);
      }

      // Vérifier si le prestataire a déjà soumis un devis
      if (prestataireData) {
        const { data: devisData } = await supabase
          .from('devis')
          .select('*')
          .eq('demande_id', id)
          .eq('prestataire_id', prestataireData.id)
          .maybeSingle();

        setDevisExistant(devisData);
      }

      // Compter le nombre total de devis
      const { count } = await supabase
        .from('devis')
        .select('*', { count: 'exact', head: true })
        .eq('demande_id', id);

      setNombreDevis(count || 0);

    } catch (error) {
      console.error('Erreur chargement demande:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les détails de la demande',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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

  const getStatutBadge = (statut: string) => {
    const badges = {
      en_attente: <Badge variant="secondary">En attente</Badge>,
      attribuee: <Badge className="bg-blue-500">Attribuée</Badge>,
      en_cours: <Badge className="bg-purple-500">En cours</Badge>,
      terminee: <Badge className="bg-green-500">Terminée</Badge>,
      annulee: <Badge variant="destructive">Annulée</Badge>,
    };
    return badges[statut as keyof typeof badges] || badges[statut];
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

  const handleSoumettreDevis = () => {
    if (!demande) return;
    navigate(`/dashboard/prestataire/devis/nouveau/${demande.id}`);
  };

  const handleContacterClient = () => {
    toast({
      title: 'Messagerie',
      description: 'Fonctionnalité de messagerie en cours de développement',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!demande) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Demande introuvable</h2>
        <p className="text-muted-foreground mb-4">Cette demande n'existe pas ou a été supprimée</p>
        <Button onClick={() => navigate('/dashboard/prestataire/opportunites')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux opportunités
        </Button>
      </div>
    );
  }

  return (
    <DashboardLayout 
      role="prestataire" 
      userName={prestataire?.full_name || "Prestataire"} 
      userRole={prestataire?.profession || "Prestataire"}
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/dashboard/prestataire/opportunites')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux opportunités
          </Button>
        
        {demande.statut === 'en_attente' && !devisExistant && (
          <Button onClick={handleSoumettreDevis} size="lg">
            <FileText className="mr-2 h-4 w-4" />
            Soumettre un devis
          </Button>
        )}
      </div>

      {/* Alerte si devis déjà soumis */}
      {devisExistant && (
        <Card className="border-blue-500 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <p className="font-medium text-blue-900">
                Vous avez déjà soumis un devis pour cette demande
              </p>
            </div>
            <p className="text-sm text-blue-700 mt-2">
              Montant: {(devisExistant.montant_ttc || devisExistant.amount).toLocaleString()} FC
              {' • '}
              Soumis le {formatDate(devisExistant.created_at)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Informations principales */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-2xl">
                  {demande.title || demande.titre}
                </CardTitle>
                {getUrgenceBadge(demande.urgence)}
                {getStatutBadge(demande.statut)}
              </div>
              <CardDescription className="flex flex-wrap items-center gap-4 text-base">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {demande.localisation || demande.location}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Publié le {formatDate(demande.created_at)}
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
        <CardContent className="space-y-6">
          {/* Budget */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Budget indicatif
            </h3>
            <p className="text-2xl font-bold text-primary">
              {formatBudget(demande.budget_min, demande.budget_max)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {nombreDevis} devis déjà soumis pour cette demande
            </p>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description détaillée</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{demande.description}</p>
          </div>

          {/* Images */}
          {demande.images && demande.images.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Photos</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {demande.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Photo ${index + 1}`}
                      className="rounded-lg object-cover w-full h-48"
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Informations client */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            À propos du client
          </CardTitle>
        </CardHeader>
        <CardContent>
          {client ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {client.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    {client.full_name}
                    {client.verified && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {client.city}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={handleContacterClient}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Contacter
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">Informations client non disponibles</p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {demande.statut === 'en_attente' && !devisExistant && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Intéressé par cette opportunité?</h3>
                <p className="text-sm text-muted-foreground">
                  Soumettez votre devis détaillé pour cette demande
                </p>
              </div>
              <Button onClick={handleSoumettreDevis} size="lg">
                <FileText className="mr-2 h-4 w-4" />
                Soumettre un devis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </DashboardLayout>
  );
}
