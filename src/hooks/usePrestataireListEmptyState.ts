import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Calendar,
  Car,
  Clock3,
  CreditCard,
  FileText,
  HardHat,
  MessageSquare,
  Search,
  Target,
  User,
  Users,
} from "lucide-react";
import { usePrestataireAccess } from "@/hooks/usePrestataireAccess";
import { PRESTATAIRE_PATHS } from "@/lib/prestataire-nav";
import type {
  PrestataireEmptyAction,
  PrestataireEmptyStep,
} from "@/components/prestataire/PrestataireListEmptyState";

export type PrestataireEmptyPageContext =
  | "missions"
  | "opportunites"
  | "opportunites_public"
  | "invitations"
  | "devis"
  | "contrats"
  | "revenus"
  | "messages"
  | "calendrier"
  | "frais";

export type PrestataireListEmptyStateConfig = {
  icon: LucideIcon;
  title: string;
  description: string;
  steps?: PrestataireEmptyStep[];
  actions?: PrestataireEmptyAction[];
};

const FILTER_MESSAGES: Record<
  PrestataireEmptyPageContext,
  { title: string; description: string }
> = {
  missions: {
    title: "Aucune mission ne correspond",
    description:
      "Modifiez votre recherche ou le filtre de statut pour retrouver vos chantiers.",
  },
  opportunites: {
    title: "Aucune opportunité ne correspond",
    description: "Élargissez la recherche ou réinitialisez les filtres d'urgence.",
  },
  opportunites_public: {
    title: "Aucune demande ne correspond",
    description: "Modifiez votre recherche ou réinitialisez les filtres.",
  },
  invitations: {
    title: "Aucune invitation ne correspond",
    description: "Réinitialisez les filtres pour afficher toutes vos invitations.",
  },
  devis: {
    title: "Aucun devis ne correspond",
    description: "Modifiez votre recherche ou réinitialisez les filtres de statut.",
  },
  contrats: {
    title: "Aucun contrat ne correspond",
    description: "Modifiez votre recherche ou le filtre de statut.",
  },
  revenus: {
    title: "Aucun paiement ne correspond",
    description: "Modifiez votre recherche ou réinitialisez les filtres.",
  },
  messages: {
    title: "Aucune conversation ne correspond",
    description: "Modifiez votre recherche pour retrouver un échange.",
  },
  calendrier: {
    title: "Aucun événement ne correspond",
    description: "Changez de date ou réinitialisez les filtres affichés.",
  },
  frais: {
    title: "Aucun tarif ne correspond",
    description: "Réinitialisez la recherche pour afficher tous vos tarifs.",
  },
};

const PROFILE_INCOMPLETE: PrestataireListEmptyStateConfig = {
  icon: User,
  title: "Complétez votre profil",
  description:
    "Ajoutez votre profession, votre ville et une présentation pour accéder pleinement à la plateforme.",
  actions: [
    {
      label: "Compléter mon profil",
      href: PRESTATAIRE_PATHS.compteProfil,
      variant: "default",
    },
    {
      label: "Parcourir le marché",
      href: PRESTATAIRE_PATHS.marcheOpportunites,
      variant: "outline",
    },
  ],
};

const PROFILE_PENDING: PrestataireListEmptyStateConfig = {
  icon: Clock3,
  title: "Profil en cours de validation",
  description:
    "Votre compte est en attente de validation par l'équipe KaziPro. Vous serez notifié dès approbation.",
  actions: [
    {
      label: "Voir mon profil",
      href: PRESTATAIRE_PATHS.compteProfil,
      variant: "outline",
    },
    {
      label: "Parcourir le marché",
      href: PRESTATAIRE_PATHS.marcheOpportunites,
      variant: "secondary",
    },
  ],
};

const DEFAULT_BY_CONTEXT: Record<
  PrestataireEmptyPageContext,
  PrestataireListEmptyStateConfig
> = {
  missions: {
    icon: HardHat,
    title: "Pas encore de mission",
    description:
      "Une mission démarre lorsqu'un client accepte votre devis. Suivez le parcours ci-dessous.",
    steps: [
      { label: "Découvrir les opportunités sur le marché" },
      { label: "Envoyer un devis détaillé au client" },
      { label: "Démarrer la mission ici après acceptation" },
    ],
    actions: [
      {
        label: "Parcourir le marché",
        href: PRESTATAIRE_PATHS.marcheOpportunites,
        variant: "default",
      },
      {
        label: "Voir mes devis",
        href: PRESTATAIRE_PATHS.marcheDevis,
        variant: "outline",
      },
    ],
  },
  opportunites: {
    icon: Target,
    title: "Aucune opportunité pour le moment",
    description:
      "Les demandes correspondant à votre métier et votre zone apparaîtront ici. Soyez prêt à répondre rapidement.",
    steps: [
      { label: "Compléter et faire valider votre profil" },
      { label: "Consulter les demandes du marché" },
      { label: "Envoyer un devis personnalisé" },
    ],
    actions: [
      {
        label: "Parcourir le marché",
        href: PRESTATAIRE_PATHS.marcheOpportunites,
        variant: "default",
      },
      {
        label: "Voir mes devis",
        href: PRESTATAIRE_PATHS.marcheDevis,
        variant: "outline",
      },
    ],
  },
  opportunites_public: {
    icon: Briefcase,
    title: "Aucune demande publique",
    description:
      "Il n'y a pas encore de demande ouverte correspondant à votre profil. Revenez régulièrement ou élargissez votre zone.",
    steps: [
      { label: "Profil à jour et validé par KaziPro" },
      { label: "Demandes publiées par les clients" },
      { label: "Réponse par devis depuis cette page" },
    ],
    actions: [
      {
        label: "Actualiser le marché",
        href: PRESTATAIRE_PATHS.marcheOpportunites,
        variant: "default",
      },
      {
        label: "Mon profil",
        href: PRESTATAIRE_PATHS.compteProfil,
        variant: "outline",
      },
    ],
  },
  invitations: {
    icon: Users,
    title: "Aucune invitation directe",
    description:
      "Les clients peuvent vous inviter personnellement lorsque votre profil est visible et complet.",
    steps: [
      { label: "Profil professionnel complet" },
      { label: "Bonnes notes et portfolio à jour" },
      { label: "Invitations reçues ici" },
    ],
    actions: [
      {
        label: "Compléter mon profil",
        href: PRESTATAIRE_PATHS.compteProfil,
        variant: "default",
      },
      {
        label: "Parcourir le marché",
        href: PRESTATAIRE_PATHS.marcheOpportunites,
        variant: "outline",
      },
    ],
  },
  devis: {
    icon: FileText,
    title: "Aucun devis pour l'instant",
    description:
      "Créez un devis en réponse à une opportunité ou préparez un devis ventilé (main d'œuvre, fournitures, transport).",
    steps: [
      { label: "Choisir une opportunité sur le marché" },
      { label: "Rédiger et envoyer votre devis" },
      { label: "Suivre l'acceptation par le client" },
    ],
    actions: [
      {
        label: "Parcourir le marché",
        href: PRESTATAIRE_PATHS.marcheOpportunites,
        variant: "default",
      },
      {
        label: "Voir mes devis",
        href: PRESTATAIRE_PATHS.marcheDevis,
        variant: "outline",
      },
    ],
  },
  contrats: {
    icon: FileText,
    title: "Aucun contrat pour le moment",
    description:
      "Un contrat est généré après l'acceptation d'un devis. Il formalise la mission avec le client.",
    steps: [
      { label: "Devis accepté par le client" },
      { label: "Signature du contrat" },
      { label: "Mission et planning associés" },
    ],
    actions: [
      {
        label: "Voir mes devis",
        href: PRESTATAIRE_PATHS.marcheDevis,
        variant: "default",
      },
      {
        label: "Mes missions",
        href: PRESTATAIRE_PATHS.chantiersMissions,
        variant: "outline",
      },
    ],
  },
  revenus: {
    icon: CreditCard,
    title: "Aucun paiement enregistré",
    description:
      "Vos encaissements apparaîtront ici après validation des missions et configuration des moyens de paiement.",
    steps: [
      { label: "Terminer une mission avec le client" },
      { label: "Configurer vos coordonnées de paiement" },
      { label: "Suivre les virements sur cette page" },
    ],
    actions: [
      {
        label: "Configurer le paiement",
        href: PRESTATAIRE_PATHS.compteConfigPaiement,
        variant: "default",
      },
      {
        label: "Mes missions",
        href: PRESTATAIRE_PATHS.chantiersMissions,
        variant: "outline",
      },
    ],
  },
  messages: {
    icon: MessageSquare,
    title: "Aucun échange pour le moment",
    description:
      "Les conversations s'ouvrent avec vos clients lorsque vous répondez à une demande ou démarrez une mission.",
    steps: [
      { label: "Répondre à une opportunité" },
      { label: "Échanger avec le client" },
      { label: "Centraliser les messages ici" },
    ],
    actions: [
      {
        label: "Parcourir le marché",
        href: PRESTATAIRE_PATHS.marcheOpportunites,
        variant: "default",
      },
      {
        label: "Mes missions",
        href: PRESTATAIRE_PATHS.chantiersMissions,
        variant: "outline",
      },
    ],
  },
  calendrier: {
    icon: Calendar,
    title: "Planning vide",
    description:
      "Vos missions et rendez-vous planifiés s'afficheront sur le calendrier une fois les chantiers démarrés.",
    steps: [
      { label: "Accepter un devis et signer le contrat" },
      { label: "Démarrer la mission" },
      { label: "Dates visibles sur le planning" },
    ],
    actions: [
      {
        label: "Mes missions",
        href: PRESTATAIRE_PATHS.chantiersMissions,
        variant: "default",
      },
      {
        label: "Parcourir le marché",
        href: PRESTATAIRE_PATHS.marcheOpportunites,
        variant: "outline",
      },
    ],
  },
  frais: {
    icon: Car,
    title: "Aucun tarif de déplacement",
    description:
      "Indiquez vos frais par ville pour que vos devis incluent automatiquement le transport.",
    steps: [
      { label: "Définir la ville de départ" },
      { label: "Ajouter un tarif par destination" },
      { label: "Réutiliser dans vos devis" },
    ],
    actions: [
      {
        label: "Ajouter un tarif",
        href: PRESTATAIRE_PATHS.compteFrais,
        variant: "default",
      },
      {
        label: "Mon profil",
        href: PRESTATAIRE_PATHS.compteProfil,
        variant: "outline",
      },
    ],
  },
};

type UsePrestataireListEmptyStateArgs = {
  context: PrestataireEmptyPageContext;
  hasActiveFilters: boolean;
  onResetFilters?: () => void;
  /** Actions supplémentaires pour l'état vide par défaut (ex. créer un devis). */
  extraActions?: PrestataireEmptyAction[];
};

export function usePrestataireListEmptyState({
  context,
  hasActiveFilters,
  onResetFilters,
  extraActions,
}: UsePrestataireListEmptyStateArgs): PrestataireListEmptyStateConfig {
  const access = usePrestataireAccess();

  return useMemo(() => {
    if (hasActiveFilters) {
      const msg = FILTER_MESSAGES[context];
      return {
        icon: Search,
        title: msg.title,
        description: msg.description,
        actions: onResetFilters
          ? [
              {
                label: "Réinitialiser les filtres",
                onClick: onResetFilters,
                variant: "outline" as const,
              },
            ]
          : undefined,
      };
    }

    if (!access.isProfileComplete) {
      return PROFILE_INCOMPLETE;
    }

    if (!access.isVerified) {
      return PROFILE_PENDING;
    }

    const base = DEFAULT_BY_CONTEXT[context];
    if (!extraActions?.length) {
      return base;
    }

    return {
      ...base,
      actions: [...extraActions, ...(base.actions ?? [])],
    };
  }, [
    context,
    hasActiveFilters,
    onResetFilters,
    extraActions,
    access.isProfileComplete,
    access.isVerified,
  ]);
}
