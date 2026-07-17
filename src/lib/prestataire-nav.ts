import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  Calendar,
  Car,
  CreditCard,
  FileText,
  Home,
  HardHat,
  LayoutGrid,
  MessageSquare,
  Scale,
  Search,
  Settings,
  TrendingUp,
  User,
} from 'lucide-react';

/** Chemins canoniques (menu simplifié). */
export const PRESTATAIRE_PATHS = {
  dashboard: '/dashboard/prestataire',
  marche: '/dashboard/prestataire/marche',
  marcheOpportunites: '/dashboard/prestataire/marche/opportunites',
  marcheDevis: '/dashboard/prestataire/marche/devis',
  chantiers: '/dashboard/prestataire/chantiers',
  chantiersMissions: '/dashboard/prestataire/chantiers/missions',
  chantiersContrats: '/dashboard/prestataire/chantiers/contrats',
  chantiersCalendrier: '/dashboard/prestataire/chantiers/calendrier',
  messages: '/dashboard/prestataire/messages',
  compte: '/dashboard/prestataire/compte',
  compteProfil: '/dashboard/prestataire/compte/profil',
  compteRevenus: '/dashboard/prestataire/compte/revenus',
  compteFrais: '/dashboard/prestataire/compte/frais-deplacement',
  compteConfigPaiement: '/dashboard/prestataire/compte/config-paiement',
  compteParametres: '/dashboard/prestataire/compte/parametres',
  compteLitiges: '/dashboard/prestataire/compte/litiges',
  devisNouveau: (demandeId: string | number) =>
    `/dashboard/prestataire/devis/nouveau/${demandeId}`,
  demandeDetail: (id: string | number) => `/dashboard/prestataire/demandes/${id}`,
  contratDetail: (id: string | number) => `/dashboard/prestataire/contrat/${id}`,
} as const;

export type PrestataireHubId = 'marche' | 'chantiers' | 'compte';

export type PrestataireHubTab = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
};

export type PrestataireHubConfig = {
  id: PrestataireHubId;
  title: string;
  description: string;
  tabs: PrestataireHubTab[];
};

export const PRESTATAIRE_HUBS: Record<PrestataireHubId, PrestataireHubConfig> = {
  marche: {
    id: 'marche',
    title: 'Marché & devis',
    description: 'Découvrez les demandes et suivez vos propositions commerciales.',
    tabs: [
      {
        id: 'opportunites',
        label: 'Opportunités',
        href: PRESTATAIRE_PATHS.marcheOpportunites,
        icon: Search,
      },
      {
        id: 'devis',
        label: 'Mes devis',
        href: PRESTATAIRE_PATHS.marcheDevis,
        icon: FileText,
      },
    ],
  },
  chantiers: {
    id: 'chantiers',
    title: 'Chantiers',
    description: 'Missions en cours, contrats signés et planning.',
    tabs: [
      {
        id: 'missions',
        label: 'Missions',
        href: PRESTATAIRE_PATHS.chantiersMissions,
        icon: Briefcase,
      },
      {
        id: 'contrats',
        label: 'Contrats',
        href: PRESTATAIRE_PATHS.chantiersContrats,
        icon: FileText,
      },
      {
        id: 'calendrier',
        label: 'Planning',
        href: PRESTATAIRE_PATHS.chantiersCalendrier,
        icon: Calendar,
      },
    ],
  },
  compte: {
    id: 'compte',
    title: 'Mon compte',
    description: 'Profil, finances, tarifs et paramètres.',
    tabs: [
      {
        id: 'profil',
        label: 'Profil',
        href: PRESTATAIRE_PATHS.compteProfil,
        icon: User,
      },
      {
        id: 'revenus',
        label: 'Revenus',
        href: PRESTATAIRE_PATHS.compteRevenus,
        icon: TrendingUp,
      },
      {
        id: 'frais',
        label: 'Frais déplacement',
        href: PRESTATAIRE_PATHS.compteFrais,
        icon: Car,
      },
      {
        id: 'config-paiement',
        label: 'Devis & acompte',
        href: PRESTATAIRE_PATHS.compteConfigPaiement,
        icon: CreditCard,
      },
      {
        id: 'parametres',
        label: 'Paramètres',
        href: PRESTATAIRE_PATHS.compteParametres,
        icon: Settings,
      },
      {
        id: 'litiges',
        label: 'Litiges',
        href: PRESTATAIRE_PATHS.compteLitiges,
        icon: Scale,
      },
    ],
  },
};

/** Préfixes pour surligner l’entrée menu latérale active. */
export const PRESTATAIRE_SIDEBAR_MATCH: Record<string, string[]> = {
  [PRESTATAIRE_PATHS.dashboard]: [PRESTATAIRE_PATHS.dashboard],
  [PRESTATAIRE_PATHS.marche]: [
    PRESTATAIRE_PATHS.marche,
    '/dashboard/prestataire/opportunites',
    '/dashboard/prestataire/devis',
    '/dashboard/prestataire/demandes',
  ],
  [PRESTATAIRE_PATHS.chantiers]: [
    PRESTATAIRE_PATHS.chantiers,
    '/dashboard/prestataire/missions',
    '/dashboard/prestataire/contrats',
    '/dashboard/prestataire/calendrier',
    '/dashboard/prestataire/contrat',
  ],
  [PRESTATAIRE_PATHS.messages]: [PRESTATAIRE_PATHS.messages],
  [PRESTATAIRE_PATHS.compteProfil]: [PRESTATAIRE_PATHS.compteProfil, '/dashboard/prestataire/profil'],
  [PRESTATAIRE_PATHS.compte]: [
    PRESTATAIRE_PATHS.compte,
    '/dashboard/prestataire/profil',
    '/dashboard/prestataire/parametres',
    '/dashboard/prestataire/revenus',
    '/dashboard/prestataire/litiges',
    '/dashboard/prestataire/config-paiement',
    '/dashboard/prestataire/frais-deplacement',
  ],
};

/** Liens accessibles sans validation admin (profil incomplet ou en attente). */
export const PRESTATAIRE_OPEN_MENU_HREFS = [
  PRESTATAIRE_PATHS.dashboard,
  PRESTATAIRE_PATHS.compteProfil,
  '/dashboard/prestataire/profil',
] as const;

export function isPrestataireMenuHrefAllowed(
  href: string,
  access: { isVerified: boolean; isProfileComplete: boolean },
): boolean {
  if (access.isVerified && access.isProfileComplete) return true;
  return (PRESTATAIRE_OPEN_MENU_HREFS as readonly string[]).some(
    (open) => href === open || href.startsWith(`${open}/`),
  );
}

export type PrestataireSidebarLink = {
  icon: LucideIcon;
  label: string;
  href: string;
};

export const PRESTATAIRE_SIDEBAR_LINKS: PrestataireSidebarLink[] = [
  { icon: Home, label: 'Tableau de bord', href: PRESTATAIRE_PATHS.dashboard },
  { icon: User, label: 'Mon profil', href: PRESTATAIRE_PATHS.compteProfil },
  { icon: LayoutGrid, label: 'Marché & devis', href: PRESTATAIRE_PATHS.marche },
  { icon: HardHat, label: 'Chantiers', href: PRESTATAIRE_PATHS.chantiers },
  { icon: MessageSquare, label: 'Messages', href: PRESTATAIRE_PATHS.messages },
  { icon: Settings, label: 'Mon compte', href: PRESTATAIRE_PATHS.compte },
];

export function isPrestataireSidebarLinkActive(pathname: string, href: string): boolean {
  const prefixes = PRESTATAIRE_SIDEBAR_MATCH[href] ?? [href];
  if (href === PRESTATAIRE_PATHS.dashboard) {
    return pathname === PRESTATAIRE_PATHS.dashboard;
  }
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
