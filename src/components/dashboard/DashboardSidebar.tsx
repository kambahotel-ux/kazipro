import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  FileText,
  MessageSquare,
  Star,
  Settings,
  Users,
  AlertTriangle,
  BarChart3,
  Shield,
  LogOut,
  Receipt,
  Scale,
  Briefcase,
  CreditCard,
  Bell,
  Package,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePrestataireAccess } from "@/hooks/usePrestataireAccess";
import { PrestataireVerificationBadge } from "@/components/prestataire/PrestataireVerificationBadge";
import {
  isPrestataireSidebarLinkActive,
  isPrestataireMenuHrefAllowed,
  PRESTATAIRE_PATHS,
  PRESTATAIRE_SIDEBAR_LINKS,
} from "@/lib/prestataire-nav";

interface SidebarLink {
  icon: React.ElementType;
  label: string;
  href: string;
}

interface DashboardSidebarProps {
  role: "client" | "prestataire" | "admin";
  isMobile?: boolean;
  isVerified?: boolean;
  isProfileComplete?: boolean;
}

const clientLinks: SidebarLink[] = [
  { icon: Home, label: "Tableau de bord", href: "/dashboard/client" },
  { icon: FileText, label: "Mes demandes", href: "/dashboard/client/demandes" },
  { icon: Briefcase, label: "Suivi missions", href: "/dashboard/client/missions" },
  { icon: MessageSquare, label: "Messages", href: "/dashboard/client/messages" },
  { icon: CreditCard, label: "Paiements", href: "/dashboard/client/paiements" },
  { icon: Scale, label: "Litiges", href: "/dashboard/client/litiges" },
  { icon: Star, label: "Mes avis", href: "/dashboard/client/avis" },
  { icon: Settings, label: "Paramètres", href: "/dashboard/client/parametres" },
];

const adminLinks: SidebarLink[] = [
  { icon: Home, label: "Vue d'ensemble", href: "/dashboard/admin" },
  { icon: Users, label: "Utilisateurs", href: "/dashboard/admin/utilisateurs" },
  { icon: Shield, label: "Prestataires", href: "/dashboard/admin/prestataires" },
  { icon: FileText, label: "Demandes", href: "/dashboard/admin/demandes" },
  { icon: Receipt, label: "Devis", href: "/dashboard/admin/devis" },
  { icon: AlertTriangle, label: "Litiges", href: "/dashboard/admin/litiges" },
  { icon: Package, label: "Location", href: "/dashboard/admin/location" },
  { icon: Layers, label: "Catégories matériel", href: "/dashboard/admin/categories-materiel" },
  { icon: CreditCard, label: "Transactions", href: "/dashboard/admin/transactions" },
  { icon: BarChart3, label: "Rapports", href: "/dashboard/admin/rapports" },
  { icon: Bell, label: "Notifications & WhatsApp", href: "/dashboard/admin/config-notifications" },
  { icon: Settings, label: "Paramètres", href: "/dashboard/admin/parametres" },
];

const linksByRole = {
  client: clientLinks,
  prestataire: PRESTATAIRE_SIDEBAR_LINKS,
  admin: adminLinks,
};

const roleLabels = {
  client: "Espace Client",
  prestataire: "Espace Prestataire",
  admin: "Administration",
};

export function DashboardSidebar({
  role,
  isMobile = false,
  isVerified = true,
  isProfileComplete = true,
}: DashboardSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { validationStatus } = usePrestataireAccess();
  const links = linksByRole[role];

  const menuAccess = { isVerified, isProfileComplete };
  const lockReason =
    !isProfileComplete
      ? "Complétez votre profil pour débloquer ce menu"
      : "Disponible après validation de votre compte par KaziPro";

  const dashboardLink =
    role === "client"
      ? "/dashboard/client"
      : role === "prestataire"
        ? PRESTATAIRE_PATHS.dashboard
        : "/dashboard/admin";

  const sidebarClasses = isMobile
    ? "flex min-h-screen w-full flex-col bg-sidebar text-sidebar-foreground"
    : "hidden lg:flex sticky top-0 min-h-screen w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground";

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      navigate("/connexion");
    }
  };

  return (
    <aside className={sidebarClasses}>
      <div className="border-b border-sidebar-border p-4 sm:p-5">
        <Link to={dashboardLink} className="flex items-center gap-2">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-sidebar-primary shadow-[0_12px_28px_-20px_hsl(var(--sidebar-primary)/0.8)]">
            <span className="text-sm font-bold text-sidebar-primary-foreground">K</span>
          </div>
          <span className="truncate font-display text-lg font-bold text-sidebar-foreground">KaziPro</span>
        </Link>
        <p className="mt-2 text-xs font-medium text-sidebar-foreground/58">{roleLabels[role]}</p>
        {role === "prestataire" ? (
          <div className="mt-3">
            <PrestataireVerificationBadge
              status={validationStatus}
              size="md"
              linkToProfil={validationStatus !== "valide"}
              className="w-full justify-center"
            />
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 sm:p-4">
        {links.map((link) => {
          const isActive =
            role === "prestataire"
              ? isPrestataireSidebarLinkActive(location.pathname, link.href)
              : location.pathname === link.href;

          const isAllowed =
            role !== "prestataire" || isPrestataireMenuHrefAllowed(link.href, menuAccess);

          if (!isAllowed) {
            return (
              <div
                key={link.href}
                className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground/35"
                title={lockReason}
              >
                <link.icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{link.label}</span>
                <span className="ml-auto text-xs">Verrouillé</span>
              </div>
            );
          }

          return (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "group relative flex items-center gap-3 whitespace-nowrap rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/68 hover:bg-sidebar-accent/65 hover:text-sidebar-accent-foreground",
              )}
              title={link.label}
            >
              {isActive && (
                <span className="absolute left-0 h-5 w-0.5 rounded-full bg-sidebar-primary" />
              )}
              <link.icon
                className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive ? "text-sidebar-primary" : "text-sidebar-foreground/55 group-hover:text-sidebar-foreground",
                )}
              />
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3 sm:p-4">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground/68 transition-colors hover:bg-destructive/15 hover:text-white"
          title="Déconnexion"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="truncate">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
