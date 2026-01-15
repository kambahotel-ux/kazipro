import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  FileText, 
  MessageSquare, 
  CreditCard, 
  Star, 
  Settings, 
  User,
  Briefcase,
  Calendar,
  TrendingUp,
  Users,
  AlertTriangle,
  BarChart3,
  Shield,
  LogOut,
  Search,
  Receipt
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarLink {
  icon: React.ElementType;
  label: string;
  href: string;
}

interface DashboardSidebarProps {
  role: "client" | "prestataire" | "admin";
  isMobile?: boolean;
}

const clientLinks: SidebarLink[] = [
  { icon: Home, label: "Tableau de bord", href: "/dashboard/client" },
  { icon: FileText, label: "Mes demandes", href: "/dashboard/client/demandes" },
  { icon: MessageSquare, label: "Messages", href: "/dashboard/client/messages" },
  { icon: CreditCard, label: "Paiements", href: "/dashboard/client/paiements" },
  { icon: Star, label: "Mes avis", href: "/dashboard/client/avis" },
  { icon: Settings, label: "Paramètres", href: "/dashboard/client/parametres" },
];

const prestataireLinks: SidebarLink[] = [
  { icon: Home, label: "Tableau de bord", href: "/dashboard/prestataire" },
  { icon: Search, label: "Opportunités", href: "/dashboard/prestataire/opportunites" },
  { icon: Briefcase, label: "Missions", href: "/dashboard/prestataire/missions" },
  { icon: FileText, label: "Devis envoyés", href: "/dashboard/prestataire/devis" },
  { icon: Calendar, label: "Calendrier", href: "/dashboard/prestataire/calendrier" },
  { icon: TrendingUp, label: "Revenus", href: "/dashboard/prestataire/revenus" },
  { icon: MessageSquare, label: "Messages", href: "/dashboard/prestataire/messages" },
  { icon: User, label: "Mon profil", href: "/dashboard/prestataire/profil" },
  { icon: Settings, label: "Paramètres", href: "/dashboard/prestataire/parametres" },
];

const adminLinks: SidebarLink[] = [
  { icon: Home, label: "Vue d'ensemble", href: "/dashboard/admin" },
  { icon: Users, label: "Utilisateurs", href: "/dashboard/admin/utilisateurs" },
  { icon: Shield, label: "Prestataires", href: "/dashboard/admin/prestataires" },
  { icon: FileText, label: "Demandes", href: "/dashboard/admin/demandes" },
  { icon: Receipt, label: "Devis", href: "/dashboard/admin/devis" },
  { icon: AlertTriangle, label: "Litiges", href: "/dashboard/admin/litiges" },
  { icon: CreditCard, label: "Transactions", href: "/dashboard/admin/transactions" },
  { icon: BarChart3, label: "Rapports", href: "/dashboard/admin/rapports" },
  { icon: Settings, label: "Configuration", href: "/dashboard/admin/configuration" },
];

const linksByRole = {
  client: clientLinks,
  prestataire: prestataireLinks,
  admin: adminLinks,
};

const roleLabels = {
  client: "Espace Client",
  prestataire: "Espace Prestataire",
  admin: "Administration",
};

export function DashboardSidebar({ role, isMobile = false }: DashboardSidebarProps) {
  const location = useLocation();
  const links = linksByRole[role];

  const sidebarClasses = isMobile 
    ? "flex flex-col w-full bg-card min-h-screen"
    : "hidden lg:flex flex-col w-64 bg-card border-r border-border min-h-screen sticky top-0";

  return (
    <aside className={sidebarClasses}>
      <div className="p-4 sm:p-6 border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-sm">K</span>
          </div>
          <span className="font-display font-bold text-lg text-foreground truncate">KaziPro</span>
        </Link>
        <p className="text-xs text-muted-foreground mt-2">{roleLabels[role]}</p>
      </div>

      <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = location.pathname === link.href;
          return (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={link.label}
            >
              <link.icon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 sm:p-4 border-t border-border">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full" title="Déconnexion">
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="truncate">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
