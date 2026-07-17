import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { demandesApi } from '@/lib/api';
import {
  displayNameFromProfil,
  getProfil,
  prestataireIdFromUser,
  professionLabelFromProfil,
} from '@/lib/kazipro-profile';
import { formatDemandeBudget, mapDemandeToUi } from '@/lib/client-helpers';
import { useAuth } from '@/contexts/AuthContext';
import { useAbortableFetch } from '@/hooks/useAbortableFetch';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  OpportuniteDetailSkeleton,
  OpportuniteDetailView,
  type OpportuniteClientInfo,
} from '@/components/demande/OpportuniteDetailView';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { messagesPath, partnerUserIdFromProfil } from '@/lib/messaging';
import { demandeAccepteNouveauDevis } from '@/lib/demande-eligibility';

type DemandeUi = ReturnType<typeof mapDemandeToUi> & {
  id: string;
  titre: string;
  title: string;
  description: string;
  statut: string;
  urgence: string;
  created_at: string;
  images: string[];
};

type ClientState = OpportuniteClientInfo & {
  user_id?: string | number;
  user?: { id?: string | number };
};

function mapClientFromApi(clientData: Record<string, unknown>): ClientState {
  const user = clientData.user as Record<string, unknown> | undefined;
  return {
    full_name: displayNameFromProfil(clientData, String(user?.name ?? 'Client')),
    city: String(clientData.ville ?? clientData.quartier ?? ''),
    telephone: clientData.telephone ? String(clientData.telephone) : undefined,
    user_id: clientData.user_id as string | number | undefined,
    user: user as ClientState['user'],
  };
}

export default function DemandeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [demande, setDemande] = useState<DemandeUi | null>(null);
  const [client, setClient] = useState<ClientState | null>(null);
  const [devisExistant, setDevisExistant] = useState<{ montant_ttc: number; created_at: string } | null>(null);
  const [nombreDevis, setNombreDevis] = useState(0);
  const [loading, setLoading] = useState(true);
  const [prestataire, setPrestataire] = useState<Record<string, unknown> | null>(null);

  useAbortableFetch(Boolean(id && user), [id, user?.id], async (signal) => {
    if (!id || !user || signal.aborted) return;

    try {
      setLoading(true);
      setPrestataire(getProfil(user));
      const pid = prestataireIdFromUser(user);

      const demandeRaw = await demandesApi.getById(id);
      if (signal.aborted) return;

      const raw = demandeRaw as Record<string, unknown>;
      const mapped = mapDemandeToUi(raw);
      setDemande({
        ...mapped,
        id: String(mapped.id ?? raw.id),
        titre: String(mapped.title),
        title: String(mapped.title),
        description: String(mapped.description ?? ''),
        statut: String(mapped.statut ?? raw.statut ?? ''),
        urgence: String(mapped.urgence ?? raw.urgence ?? 'normal'),
        created_at: String(mapped.created_at ?? raw.created_at ?? ''),
        images: Array.isArray(mapped.images) ? (mapped.images as string[]) : [],
      });

      const clientData = raw.client as Record<string, unknown> | undefined;
      setClient(clientData ? mapClientFromApi(clientData) : null);

      const devisList = Array.isArray(raw.devis) ? (raw.devis as Record<string, unknown>[]) : [];
      setNombreDevis(devisList.length || Number(raw.devis_count ?? 0));

      if (pid) {
        const mine = devisList.find((d) => String(d.prestataire_id) === pid);
        setDevisExistant(
          mine
            ? {
                montant_ttc: Number(mine.montant_ttc ?? 0),
                created_at: String(mine.created_at ?? ''),
              }
            : null,
        );
      } else {
        setDevisExistant(null);
      }
    } catch (error) {
      if (signal.aborted) return;
      console.error('Erreur chargement demande:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les détails de la demande',
        variant: 'destructive',
      });
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  });

  const layoutName = displayNameFromProfil(prestataire, 'Prestataire');
  const layoutRole = professionLabelFromProfil(prestataire) || 'Prestataire';

  if (loading) {
    return (
      <DashboardLayout role="prestataire" userName={layoutName} userRole={layoutRole}>
        <OpportuniteDetailSkeleton />
      </DashboardLayout>
    );
  }

  if (!demande) {
    return (
      <DashboardLayout role="prestataire" userName={layoutName} userRole={layoutRole}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-bold">Demande introuvable</h2>
          <p className="mb-6 max-w-sm text-muted-foreground">
            Cette demande n&apos;existe pas ou n&apos;est plus disponible.
          </p>
          <Button onClick={() => navigate('/dashboard/prestataire/marche/opportunites')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux opportunités
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const budgetLabel =
    (demande.budget as string | undefined) ??
    formatDemandeBudget(demande.budget_min, demande.budget_max) ??
    'Non précisé';

  const canSubmitDevis = demandeAccepteNouveauDevis(demande.statut) && !devisExistant;

  const handleContacterClient = () => {
    const partnerUserId =
      partnerUserIdFromProfil(client as Record<string, unknown> | null) ??
      (client?.user_id != null ? String(client.user_id) : null);
    if (!partnerUserId) {
      toast({
        title: 'Messagerie indisponible',
        description: 'Impossible d’identifier le compte client pour cette demande.',
        variant: 'destructive',
      });
      return;
    }
    navigate(
      messagesPath('prestataire', {
        partnerUserId,
        demandeId: demande.id,
        name: client?.full_name,
        mission: demande.titre,
      }),
    );
  };

  return (
    <DashboardLayout role="prestataire" userName={layoutName} userRole={layoutRole}>
      <OpportuniteDetailView
        title={demande.titre}
        numero={demande.numero ? String(demande.numero) : undefined}
        location={String(demande.location ?? '')}
        publishedAt={demande.created_at}
        budgetLabel={budgetLabel}
        metierNom={String(demande.service ?? demande.profession_nom ?? '') || undefined}
        metierCategorie={String(demande.profession_categorie ?? '') || undefined}
        description={demande.description}
        urgence={demande.urgence}
        statut={demande.statut}
        nombreDevis={nombreDevis}
        images={demande.images}
        client={client}
        devisSoumis={devisExistant}
        canSubmitDevis={canSubmitDevis}
        onBack={() => navigate('/dashboard/prestataire/marche/opportunites')}
        onSubmitDevis={() => navigate(`/dashboard/prestataire/devis/nouveau/${demande.id}`)}
        onContact={handleContacterClient}
      />
    </DashboardLayout>
  );
}
