import { Link, useLocation } from "react-router-dom";
import { Bell, CreditCard, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

const SETTINGS_LINKS = [
  {
    href: "/dashboard/admin/parametres",
    label: "Vue d'ensemble",
    icon: LayoutGrid,
    exact: true,
  },
  {
    href: "/dashboard/admin/config-paiement",
    label: "Paiement & escrow",
    icon: CreditCard,
  },
  {
    href: "/dashboard/admin/config-notifications",
    label: "Notifications & WhatsApp",
    icon: Bell,
  },
] as const;

export function AdminSettingsNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className="flex flex-wrap gap-2 p-1 rounded-lg bg-muted/60 border"
      aria-label="Sections paramètres admin"
    >
      {SETTINGS_LINKS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            to={href}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSettingsHeader({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <AdminSettingsNav />
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
