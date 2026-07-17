import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FormDrawer,
} from '@/components/ui/FormDrawer';
import { SlideToConfirm } from '@/components/ui/SlideToConfirm';
import { 
  ArrowLeft, Eye, CheckCircle, 
  XCircle, Clock, Loader, AlertCircle, User,
  ChevronLeft, ChevronRight, X, ZoomIn, FileText, Hash,
} from 'lucide-react';
import { devisApi, demandesApi, missionsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  formatDemandeBudget,
  formatUrgenceLabel,
  getClientDisplayName,
  mapDemandeToUi,
  mapDevisToUi,
  mapMissionToUi,
  unwrapPaginated,
} from '@/lib/client-helpers';
import { professionLabel } from '@/lib/kazipro-profile';
import { toast } from 'sonner';
import { DetailPageSkeleton } from '@/components/dashboard/AdminLoadingSkeleton';
import { DemandeDetailOverview } from '@/components/demande/DemandeDetailOverview';
import { cn } from '@/lib/utils';
import { MissionProgressCard } from '@/components/mission/MissionProgressCard';

const DEVIS_STATUT_STYLES: Record<
  string,
  { label: string; className: string; accent: string }
> = {
  brouillon: {
    label: 'Brouillon',
    className: 'bg-muted text-muted-foreground border-border',
    accent: 'border-l-muted-foreground/40',
  },
  en_attente: {
    label: 'En attente',
    className: 'bg-warning/15 text-warning border-warning/30',
    accent: 'border-l-warning',
  },
  envoye: {
    label: 'Envoyé',
    className: 'bg-info/15 text-info border-info/30',
    accent: 'border-l-info',
  },
  accepte: {
    label: 'Accepté',
    className: 'bg-success/15 text-success border-success/30',
    accent: 'border-l-success',
  },
  refuse: {
    label: 'Refusé',
    className: 'bg-destructive/15 text-destructive border-destructive/30',
    accent: 'border-l-destructive',
  },
  expire: {
    label: 'Expiré',
    className: 'bg-muted/80 text-muted-foreground border-border',
    accent: 'border-l-border',
  },
};

function truncateText(text: string, max = 120): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned || cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max)}…`;
}

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

function mapApiDevisToDetail(d: Record<string, unknown>): Devis {
  const mapped = mapDevisToUi(d);
  const dureeJours = d.duree_jours;
  return {
    id: String(mapped.id),
    numero: String(mapped.numero ?? '—'),
    titre: String(mapped.titre ?? 'Devis'),
    prestataire_id: String(mapped.prestataire_id ?? ''),
    description: typeof mapped.description === 'string' ? mapped.description : undefined,
    montant_ht: Number(mapped.montant_ht ?? 0),
    tva: Number(mapped.taux_tva ?? 16),
    montant_ttc: Number(mapped.montant_ttc ?? 0),
    devise: String(mapped.devise ?? 'FC'),
    frais_deplacement: Number(mapped.frais_deplacement ?? 0),
    statut: String(mapped.statut ?? 'en_attente'),
    date_creation: String(mapped.created_at ?? new Date().toISOString()),
    date_envoi: mapped.date_envoi as string | undefined,
    delai_execution:
      (mapped.delai_execution as string | undefined) ??
      (dureeJours != null ? `${dureeJours} j.` : undefined),
    delai_intervention: mapped.delai_intervention as string | undefined,
    garantie: mapped.garantie as string | undefined,
    conditions_paiement: mapped.conditions_paiement,
    items: (mapped.items ?? []) as DevisItem[],
    prestataire: mapped.prestataire as Devis['prestataire'],
  };
}

export default function ClientDemandeDetailPage() {
  const { demandeId } = useParams<{ demandeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const clientName = getClientDisplayName(user);
  
  const [demande, setDemande] = useState<any>(null);
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevis, setSelectedDevis] = useState<Devis | null>(null);
  const [showDevisModal, setShowDevisModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'accept' | 'reject' | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{
    id: string;
    titre?: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [mission, setMission] = useState<any>(null);

  const closeDevisModal = () => {
    setShowDevisModal(false);
    setSelectedDevis(null);
  };

  const openConfirmAction = (
    action: 'accept' | 'reject',
    devis: Devis,
  ) => {
    setConfirmTarget({
      id: devis.id,
      titre: devis.titre,
    });
    setConfirmAction(action);
  };

  useEffect(() => {
    if (user && demandeId) {
      loadData();
    }
  }, [user, demandeId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const raw = await demandesApi.getById(String(demandeId));
      if (!raw) {
        toast.error('Demande introuvable');
        navigate('/dashboard/client/demandes');
        return;
      }

      const demandeData = mapDemandeToUi(raw as Record<string, unknown>);
      setDemande(demandeData);

      const missionsRes = await missionsApi.getAll({ per_page: 100 });
      const missionRow = unwrapPaginated(missionsRes).find(
        (m) =>
          String((m as { demande_id?: unknown }).demande_id) === String(demandeId),
      );
      if (missionRow) {
        setMission(mapMissionToUi(missionRow as Record<string, unknown>));
      } else {
        setMission(null);
      }

      const devisRaw = Array.isArray((raw as { devis?: unknown[] }).devis)
        ? ((raw as { devis: Record<string, unknown>[] }).devis ?? [])
        : [];

      const merged = devisRaw.map((row) => mapApiDevisToDetail(row));
      merged.sort(
        (a, b) =>
          new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime(),
      );

      setDevisList(merged);
    } catch (error: unknown) {
      console.error('Erreur chargement:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptDevis = async (devisId: string) => {
    try {
      setActionLoading(true);
      await devisApi.accepter(devisId);
      toast.success('Devis accepté avec succès!');
      closeDevisModal();
      loadData();
    } catch (error: unknown) {
      console.error('Erreur acceptation:', error);
      toast.error("Erreur lors de l'acceptation du devis");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectDevis = async (devisId: string) => {
    try {
      setActionLoading(true);
      await devisApi.refuser(devisId, { motif_refus: 'Refusé par le client' });
      toast.success('Devis refusé');
      closeDevisModal();
      loadData();
    } catch (error: unknown) {
      console.error('Erreur refus:', error);
      toast.error('Erreur lors du refus du devis');
    } finally {
      setActionLoading(false);
    }
  };

  const executeConfirmAction = async () => {
    if (!confirmTarget || !confirmAction) return;
    if (confirmAction === 'accept') {
      await handleAcceptDevis(confirmTarget.id);
    } else {
      await handleRejectDevis(confirmTarget.id);
    }
    setConfirmAction(null);
    setConfirmTarget(null);
  };

  const openImageModal = (index: number) => {
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImageIndex(null);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!demande.images || selectedImageIndex === null) return;
    
    const totalImages = demande.images.length;
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = selectedImageIndex === 0 ? totalImages - 1 : selectedImageIndex - 1;
    } else {
      newIndex = selectedImageIndex === totalImages - 1 ? 0 : selectedImageIndex + 1;
    }
    
    setSelectedImageIndex(newIndex);
  };

  // Handle keyboard navigation and touch events
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!showImageModal) return;
      
      if (e.key === 'Escape') {
        closeImageModal();
      } else if (e.key === 'ArrowLeft') {
        navigateImage('prev');
      } else if (e.key === 'ArrowRight') {
        navigateImage('next');
      }
    };

    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (!showImageModal) return;
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!showImageModal) return;
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    };

    const handleSwipe = () => {
      const swipeThreshold = 50;
      const diff = touchStartX - touchEndX;
      
      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          // Swipe left - next image
          navigateImage('next');
        } else {
          // Swipe right - previous image
          navigateImage('prev');
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [showImageModal, selectedImageIndex]);

  const getStatusBadge = (statut: string) => {
    const cfg = DEVIS_STATUT_STYLES[statut];
    if (!cfg) {
      return (
        <Badge variant="outline" className="font-medium capitalize">
          {statut}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className={cn('font-medium border', cfg.className)}>
        {cfg.label}
      </Badge>
    );
  };

  const getDemandeStatusBadge = (status: string) => {
    const labels: Record<string, { label: string; className: string }> = {
      pending: { label: 'En attente', className: 'bg-warning/15 text-warning border-warning/30' },
      active: { label: 'Active', className: 'bg-success/15 text-success border-success/30' },
      ouverte: { label: 'Ouverte', className: 'bg-success/15 text-success border-success/30' },
      in_progress: { label: 'En cours', className: 'bg-info/15 text-info border-info/30' },
      en_validation: {
        label: 'Travaux à valider',
        className: 'bg-success/15 text-success border-success/30',
      },
      completed: { label: 'Terminée', className: 'bg-muted text-muted-foreground' },
      cancelled: { label: 'Annulée', className: 'bg-destructive/15 text-destructive border-destructive/30' },
    };
    const cfg = labels[status] ?? {
      label: status,
      className: 'bg-muted text-muted-foreground',
    };
    return (
      <Badge variant="outline" className={cn('font-medium border', cfg.className)}>
        {cfg.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <DashboardLayout role="client" userName={clientName} userRole="Client">
        <DetailPageSkeleton />
      </DashboardLayout>
    );
  }

  if (!demande) {
    return (
      <DashboardLayout role="client" userName={clientName} userRole="Client">
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

  const demandeTitle = (demande.title || demande.titre || '').trim();
  const showDescriptionBlock =
    Boolean(demande.description?.trim()) &&
    demande.description!.trim().toLowerCase() !== demandeTitle.toLowerCase();

  const rawDate =
    demande.preferred_date ??
    demande.date_souhaitee ??
    demande.deadline ??
    demande.date_limite;
  const preferredDateLabel = rawDate
    ? new Date(String(rawDate)).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Non spécifiée';

  const budgetLabel =
    demande.budget ?? formatDemandeBudget(demande.budget_min, demande.budget_max);
  const metierNom = String(demande.service || demande.profession_nom || '').trim();
  const metierCategorie = String(demande.profession_categorie || '').trim();
  const urgenceLabel =
    demande.urgence_label ||
    formatUrgenceLabel(String(demande.urgence ?? demande.urgency ?? ''));

  const statusBadgeNode = getDemandeStatusBadge(
    mission?.status === 'terminee_attente_validation_client'
      ? 'en_validation'
      : demande.statut === 'en_validation'
        ? 'en_validation'
        : demande.status || demande.statut || 'active',
  );

  return (
    <DashboardLayout role="client" userName={clientName} userRole="Client">
      <div className="mx-auto max-w-5xl space-y-5 pb-8 md:space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/client/demandes')}
          className="-ml-2 h-9 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
          size="sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Mes demandes
        </Button>

        <DemandeDetailOverview
          title={demandeTitle}
          numero={demande.numero ? String(demande.numero) : undefined}
          createdAt={String(demande.created_at)}
          metierNom={metierNom || undefined}
          metierCategorie={metierCategorie || undefined}
          location={demande.location || demande.localisation || '—'}
          dateSouhaitee={preferredDateLabel}
          budgetLabel={budgetLabel}
          urgenceLabel={urgenceLabel || undefined}
          typeDemande={demande.type_demande ? String(demande.type_demande) : undefined}
          statutModeration={
            demande.statut_moderation ? String(demande.statut_moderation) : undefined
          }
          statusBadge={statusBadgeNode}
          description={demande.description}
          showDescription={showDescriptionBlock}
          images={Array.isArray(demande.images) ? demande.images : []}
          onImageClick={openImageModal}
        />

        {mission && <MissionProgressCard mission={mission} />}

        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3 px-0.5">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
                Propositions reçues
              </h2>
              <p className="text-sm text-muted-foreground">
                Comparez les devis et choisissez votre prestataire
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0 tabular-nums">
              {devisList.length}
            </Badge>
          </div>

          {devisList.length === 0 ? (
              <Card className="border-dashed border-border/80 bg-muted/20 shadow-none">
                <CardContent className="flex flex-col items-center px-6 py-14 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <FileText className="h-7 w-7 text-primary" />
                  </div>
                  <p className="font-medium text-foreground">En attente de devis</p>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    Les prestataires qualifiés peuvent consulter votre demande et vous envoyer leurs
                    propositions ici. Vous serez notifié dès réception.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {devisList.map((devis) => {
                  const statutCfg = DEVIS_STATUT_STYLES[devis.statut];
                  const canRespond =
                    devis.statut === 'envoye' || devis.statut === 'en_attente';
                  const description = truncateText(devis.description || '');
                  const devise = devis.devise || 'CDF';
                  const ttc = Number(devis.montant_ttc) || 0;

                  const openDetails = () => {
                    setSelectedDevis(devis);
                    setShowDevisModal(true);
                  };

                  return (
                    <Card
                      key={devis.id}
                      className={cn(
                        'overflow-hidden border-l-4 shadow-sm',
                        statutCfg?.accent ?? 'border-l-primary/40',
                      )}
                    >
                      <CardContent className="p-0">
                        {/* Mobile */}
                        <div className="space-y-3 p-4 md:hidden">
                          <div className="flex items-start justify-between gap-2">
                            {getStatusBadge(devis.statut)}
                            <div className="text-right">
                              <p className="text-[10px] uppercase text-muted-foreground">
                                Total TTC
                              </p>
                              <p className="font-display text-lg font-bold tabular-nums text-primary">
                                {ttc.toLocaleString('fr-FR')}{' '}
                                <span className="text-xs font-semibold">{devise}</span>
                              </p>
                            </div>
                          </div>

                          <h3 className="line-clamp-2 font-display text-base font-semibold leading-snug">
                            {devis.titre || 'Sans titre'}
                          </h3>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            {devis.numero || '—'}
                          </p>

                          <Link
                            to={`/dashboard/client/prestataire/${devis.prestataire_id}`}
                            className="flex items-center gap-2 rounded-lg border border-border/80 bg-muted/30 p-2.5"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-primary">
                                {devis.prestataire?.full_name || 'Prestataire'}
                              </p>
                              {professionLabel(devis.prestataire?.profession) ? (
                                <p className="truncate text-xs text-muted-foreground">
                                  {professionLabel(devis.prestataire?.profession)}
                                </p>
                              ) : null}
                            </div>
                          </Link>

                          {description && (
                            <p className="line-clamp-1 text-xs text-muted-foreground">
                              {description}
                            </p>
                          )}

                          <p className="text-xs text-muted-foreground">
                            Délai :{' '}
                            <span className="font-medium text-foreground">
                              {devis.delai_execution || devis.delai_intervention || '—'}
                            </span>
                          </p>

                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-10"
                              onClick={openDetails}
                            >
                              <Eye className="mr-1.5 h-4 w-4" />
                              Détails
                            </Button>
                            <Link
                              to={`/dashboard/client/prestataire/${devis.prestataire_id}`}
                              className="block"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-10 w-full"
                              >
                                <User className="mr-1.5 h-4 w-4" />
                                Profil
                              </Button>
                            </Link>
                          </div>

                          {canRespond && (
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                size="sm"
                                className="h-10 bg-success text-success-foreground hover:bg-success/90"
                                onClick={() => openConfirmAction('accept', devis)}
                                disabled={actionLoading}
                              >
                                <CheckCircle className="mr-1.5 h-4 w-4" />
                                Accepter
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-10 border-destructive/40 text-destructive hover:bg-destructive/10"
                                onClick={() => openConfirmAction('reject', devis)}
                                disabled={actionLoading}
                              >
                                <XCircle className="mr-1.5 h-4 w-4" />
                                Refuser
                              </Button>
                            </div>
                          )}

                          {devis.statut === 'accepte' && (
                            <Link to={`/dashboard/client/contrat/${devis.id}`}>
                              <Button size="sm" className="h-10 w-full">
                                <FileText className="mr-1.5 h-4 w-4" />
                                Voir le contrat
                              </Button>
                            </Link>
                          )}
                        </div>

                        {/* Desktop */}
                        <div className="hidden p-5 md:flex md:gap-5 lg:p-6">
                          <div className="min-w-0 flex-1 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              {getStatusBadge(devis.statut)}
                            </div>
                            <h3 className="font-display text-lg font-semibold lg:text-xl">
                              {devis.titre || 'Sans titre'}
                            </h3>
                            <p className="font-mono text-sm text-muted-foreground">
                              {devis.numero || 'N/A'}
                            </p>
                            <Link
                              to={`/dashboard/client/prestataire/${devis.prestataire_id}`}
                              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                            >
                              <User className="h-3.5 w-3.5" />
                              {devis.prestataire?.full_name || 'N/A'}
                              {professionLabel(devis.prestataire?.profession) ? (
                                <span className="text-muted-foreground">
                                  · {professionLabel(devis.prestataire?.profession)}
                                </span>
                              ) : null}
                            </Link>
                            {description && (
                              <p className="line-clamp-2 text-sm text-muted-foreground">
                                {description}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              Délai :{' '}
                              <span className="font-medium text-foreground">
                                {devis.delai_execution || 'N/A'}
                              </span>
                            </p>
                          </div>

                          <div className="flex w-[260px] shrink-0 flex-col justify-between gap-4 border-l pl-5">
                            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-center">
                              <p className="text-xs text-muted-foreground">Total TTC</p>
                              <p className="font-display text-2xl font-bold text-primary">
                                {ttc.toLocaleString('fr-FR')} {devise}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button variant="outline" size="sm" onClick={openDetails}>
                                <Eye className="mr-1.5 h-4 w-4" />
                                Voir détails
                              </Button>
                              <Link to={`/dashboard/client/prestataire/${devis.prestataire_id}`}>
                                <Button variant="outline" size="sm" className="w-full">
                                  <User className="mr-1.5 h-4 w-4" />
                                  Voir le profil
                                </Button>
                              </Link>
                              {canRespond && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-success text-success-foreground hover:bg-success/90"
                                    onClick={() => openConfirmAction('accept', devis)}
                                    disabled={actionLoading}
                                  >
                                    <CheckCircle className="mr-1.5 h-4 w-4" />
                                    Accepter
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive hover:bg-destructive/10"
                                    onClick={() => openConfirmAction('reject', devis)}
                                    disabled={actionLoading}
                                  >
                                    <XCircle className="mr-1.5 h-4 w-4" />
                                    Refuser
                                  </Button>
                                </>
                              )}
                              {devis.statut === 'accepte' && (
                                <Link to={`/dashboard/client/contrat/${devis.id}`}>
                                  <Button size="sm" className="w-full">
                                    <FileText className="mr-1.5 h-4 w-4" />
                                    Voir le contrat
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
        </section>

        <FormDrawer
          open={showDevisModal && !!selectedDevis}
          onOpenChange={(open) => {
            if (!open) closeDevisModal();
          }}
          title={selectedDevis?.titre || 'Détail du devis'}
          footer={
            selectedDevis &&
            (selectedDevis.statut === 'envoye' || selectedDevis.statut === 'en_attente') ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  variant="outline"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={() => openConfirmAction('reject', selectedDevis)}
                  disabled={actionLoading}
                >
                  <XCircle className="mr-1.5 h-4 w-4" />
                  Refuser
                </Button>
                <Button
                  className="bg-success text-success-foreground hover:bg-success/90"
                  onClick={() => openConfirmAction('accept', selectedDevis)}
                  disabled={actionLoading}
                >
                  <CheckCircle className="mr-1.5 h-4 w-4" />
                  Accepter
                </Button>
              </div>
            ) : undefined
          }
        >
          {selectedDevis && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {getStatusBadge(selectedDevis.statut)}
                <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                  <Hash className="h-3 w-3" />
                  {selectedDevis.numero || '—'}
                </span>
              </div>
                <Link
                  to={`/dashboard/client/prestataire/${selectedDevis.prestataire_id}`}
                  className="mb-4 flex items-center gap-3 rounded-xl border border-border/80 bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-primary">
                      {selectedDevis.prestataire?.full_name || 'Prestataire'}
                    </p>
                    {professionLabel(selectedDevis.prestataire?.profession) ? (
                      <p className="text-xs text-muted-foreground">
                        {professionLabel(selectedDevis.prestataire?.profession)}
                      </p>
                    ) : null}
                  </div>
                </Link>

                <div className="mb-4 grid grid-cols-2 gap-2 text-xs sm:text-sm">
                  <div className="rounded-lg border bg-background p-2.5">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                      Envoyé le
                    </p>
                    <p className="font-medium">
                      {selectedDevis.date_envoi
                        ? new Date(selectedDevis.date_envoi).toLocaleDateString('fr-FR')
                        : '—'}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-background p-2.5">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                      Délai travaux
                    </p>
                    <p className="font-medium">
                      {selectedDevis.delai_execution ||
                        selectedDevis.delai_intervention ||
                        '—'}
                    </p>
                  </div>
                </div>

                {truncateText(selectedDevis.description || '', 300) && (
                  <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {truncateText(selectedDevis.description || '', 300)}
                  </p>
                )}

                {selectedDevis.items && selectedDevis.items.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Lignes du devis ({selectedDevis.items.length})
                    </p>
                    <div className="space-y-2 md:hidden">
                      {selectedDevis.items.map((item, index) => (
                        <div
                          key={index}
                          className="rounded-lg border border-border/80 p-3"
                        >
                          <p className="text-sm font-medium leading-snug">
                            {item.designation}
                          </p>
                          <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                            <span>
                              {item.quantite} {item.unite || 'unité'} ×{' '}
                              {item.prix_unitaire.toLocaleString('fr-FR')}
                            </span>
                            <span className="font-semibold text-foreground">
                              {item.montant.toLocaleString('fr-FR')}{' '}
                              {selectedDevis.devise || 'CDF'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="hidden overflow-hidden rounded-lg border md:block">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/60">
                          <tr>
                            <th className="p-2.5 text-left font-medium">Désignation</th>
                            <th className="p-2.5 text-center font-medium">Qté</th>
                            <th className="p-2.5 text-right font-medium">Montant</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDevis.items.map((item, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-2.5">{item.designation}</td>
                              <td className="p-2.5 text-center">
                                {item.quantite} {item.unite || 'u.'}
                              </td>
                              <td className="p-2.5 text-right font-medium tabular-nums">
                                {item.montant.toLocaleString('fr-FR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Montant HT</span>
                      <span className="font-medium tabular-nums">
                        {selectedDevis.montant_ht.toLocaleString('fr-FR')}{' '}
                        {selectedDevis.devise || 'CDF'}
                      </span>
                    </div>
                    {selectedDevis.frais_deplacement != null &&
                      selectedDevis.frais_deplacement > 0 && (
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground">Déplacement</span>
                          <span className="font-medium tabular-nums">
                            {selectedDevis.frais_deplacement.toLocaleString('fr-FR')}
                          </span>
                        </div>
                      )}
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">
                        TVA ({selectedDevis.tva}%)
                      </span>
                      <span className="font-medium tabular-nums">
                        {Math.max(
                          0,
                          selectedDevis.montant_ttc - selectedDevis.montant_ht,
                        ).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-end justify-between border-t border-primary/15 pt-3">
                    <span className="text-sm font-semibold">Total TTC</span>
                    <span className="font-display text-2xl font-bold tabular-nums text-primary">
                      {selectedDevis.montant_ttc.toLocaleString('fr-FR')}{' '}
                      <span className="text-base font-semibold">
                        {selectedDevis.devise || 'CDF'}
                      </span>
                    </span>
                  </div>
                </div>

                {selectedDevis.conditions_paiement && (
                  <div className="mt-4 rounded-lg border p-3 text-sm">
                    <p className="mb-1 font-semibold">Conditions de paiement</p>
                    <p className="text-muted-foreground">
                      {selectedDevis.conditions_paiement.modalites}
                    </p>
                  </div>
                )}
            </div>
          )}
        </FormDrawer>

        <FormDrawer
          open={!!confirmAction}
          onOpenChange={(open) => {
            if (!open && !actionLoading) {
              setConfirmAction(null);
              setConfirmTarget(null);
            }
          }}
          title={confirmAction === 'accept' ? 'Accepter ce devis ?' : 'Refuser ce devis ?'}
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {confirmAction === 'accept' ? (
                <>
                  Vous confirmez la proposition de{' '}
                  <strong>{confirmTarget?.titre || 'ce prestataire'}</strong>.
                  Un contrat pourra ensuite être établi sur KaziPro.
                </>
              ) : (
                <>
                  Le prestataire sera notifié du refus. Cette action est
                  définitive pour ce devis.
                </>
              )}
            </p>
            <SlideToConfirm
              label={
                confirmAction === 'accept'
                  ? 'Accepter ce devis et poursuivre vers le contrat'
                  : 'Refuser définitivement ce devis'
              }
              hint={confirmAction === 'accept' ? 'Glisser pour accepter' : 'Glisser pour refuser'}
              variant={confirmAction === 'accept' ? 'success' : 'destructive'}
              loading={actionLoading}
              successMessage={confirmAction === 'accept' ? 'Devis accepté' : 'Devis refusé'}
              onConfirm={executeConfirmAction}
            />
          </div>
        </FormDrawer>

        {/* Image Modal - Full Screen Viewer */}
        {showImageModal && selectedImageIndex !== null && demande.images && (
          <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={closeImageModal}
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Image Counter */}
            <div className="absolute top-4 left-4 z-10 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
              {selectedImageIndex + 1} / {demande.images.length}
            </div>

            {/* Navigation Buttons */}
            {demande.images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateImage('prev')}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12 rounded-full"
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateImage('next')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12 rounded-full"
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              </>
            )}

            {/* Main Image */}
            <div className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center">
              <img
                src={demande.images[selectedImageIndex]}
                alt={`Image ${selectedImageIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Click outside to close */}
            <div 
              className="absolute inset-0 -z-10" 
              onClick={closeImageModal}
            />

            {/* Mobile swipe indicators */}
            {demande.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {demande.images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === selectedImageIndex ? 'bg-white' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Instructions */}
            <div className="absolute bottom-4 right-4 text-white/70 text-xs hidden md:block">
              <p>Utilisez ← → pour naviguer • Échap pour fermer</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
