import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  Send
} from 'lucide-react';

export default function MissionDetailPage() {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [mission, setMission] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMission();
    fetchMessages();
    fetchPhotos();
  }, [missionId]);

  const fetchMission = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('missions')
        .select(`
          *,
          prestataires (
            full_name,
            profession,
            email
          ),
          devis_pro (
            numero,
            montant_ttc
          ),
          contrats (
            numero
          )
        `)
        .eq('id', missionId)
        .single();

      if (error) throw error;
      setMission(data);
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('mission_id', missionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Erreur messages:', error);
    }
  };

  const fetchPhotos = async () => {
    try {
      // TODO: Créer la table photos_mission
      // Pour l'instant, on simule
      setPhotos([]);
    } catch (error: any) {
      console.error('Erreur photos:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);

      const { error } = await supabase
        .from('messages')
        .insert({
          mission_id: missionId,
          sender_id: user?.id,
          sender_type: 'client',
          content: newMessage,
          read: false
        });

      if (error) throw error;

      setNewMessage('');
      fetchMessages();
      toast.success('Message envoyé');
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  const handleValidateMission = async () => {
    if (!confirm('Êtes-vous sûr de vouloir valider les travaux ? Cela déclenchera le paiement du solde.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('missions')
        .update({
          status: 'en_validation',
          validation_requested_at: new Date().toISOString()
        })
        .eq('id', missionId);

      if (error) throw error;

      toast.success('Demande de validation envoyée');
      
      // Rediriger vers le paiement du solde
      navigate(`/dashboard/client/paiement/${mission.contrat_id}/solde`);
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la validation');
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="client" userName={user?.email || ''} userRole="Client">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!mission) {
    return (
      <DashboardLayout role="client" userName={user?.email || ''} userRole="Client">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Mission introuvable</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any }> = {
      en_cours: { label: 'En cours', variant: 'default' },
      en_validation: { label: 'En validation', variant: 'secondary' },
      terminee: { label: 'Terminée', variant: 'default' },
      archivee: { label: 'Archivée', variant: 'outline' }
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const progressPercentage = mission.progress || 0;

  return (
    <DashboardLayout role="client" userName={user?.email || ''} userRole="Client">
      <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/client')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Mission en cours</h1>
            <p className="text-muted-foreground mt-1">
              Contrat N° {mission.contrats?.numero}
            </p>
          </div>
          {getStatusBadge(mission.status)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Prestataire</p>
                      <p className="font-medium">{mission.prestataires?.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date de début</p>
                      <p className="font-medium">
                        {new Date(mission.start_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Montant total</p>
                      <p className="font-medium">{mission.montant_total?.toLocaleString()} FC</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Statut</p>
                      <p className="font-medium capitalize">{mission.status.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Avancement */}
            <Card>
              <CardHeader>
                <CardTitle>Avancement des travaux</CardTitle>
                <CardDescription>
                  Progression mise à jour par le prestataire
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Progression</span>
                    <span className="text-sm font-medium">{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                </div>

                {mission.status === 'en_cours' && progressPercentage === 100 && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Le prestataire a terminé les travaux. Vous pouvez maintenant les valider.
                    </AlertDescription>
                  </Alert>
                )}

                {mission.status === 'en_cours' && progressPercentage === 100 && (
                  <Button onClick={handleValidateMission} className="w-full">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Valider les travaux et payer le solde
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Photos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Photos de progression
                </CardTitle>
              </CardHeader>
              <CardContent>
                {photos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Aucune photo pour le moment
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {photos.map((photo) => (
                      <div key={photo.id} className="aspect-square bg-muted rounded-lg overflow-hidden">
                        <img
                          src={photo.url}
                          alt="Photo de progression"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Colonne messages */}
          <div className="space-y-6">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Messages
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
                {/* Liste des messages */}
                <div className="flex-1 overflow-y-auto space-y-3">
                  {messages.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Aucun message
                    </p>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-3 rounded-lg ${
                          message.sender_type === 'client'
                            ? 'bg-primary text-primary-foreground ml-8'
                            : 'bg-muted mr-8'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Formulaire d'envoi */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Écrivez votre message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="resize-none"
                    rows={2}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={sending || !newMessage.trim()}
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
