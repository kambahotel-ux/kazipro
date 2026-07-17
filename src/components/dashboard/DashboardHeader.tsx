import { Menu, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationsDropdown } from "@/components/dashboard/NotificationsDropdown";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { professionLabel } from "@/lib/kazipro-profile";
import { usePrestataireAccess } from "@/hooks/usePrestataireAccess";
import { PrestataireVerificationBadge } from "@/components/prestataire/PrestataireVerificationBadge";

interface DashboardHeaderProps {
  userName?: string;
  userRole?: string;
  onMenuClick?: () => void;
}

export function DashboardHeader({ userName = "", userRole = "", onMenuClick }: DashboardHeaderProps) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { isPrestataire, validationStatus } = usePrestataireAccess();
  
  const displayName = userName.trim() || "Utilisateur";
  const roleLabel = professionLabel(userRole) || "—";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Déconnexion réussie");
      navigate("/connexion");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la déconnexion");
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-border/75 bg-card/92 px-3 shadow-[0_10px_34px_-30px_hsl(var(--foreground)/0.55)] backdrop-blur-xl sm:h-16 sm:gap-4 sm:px-4 lg:px-6">
      <div className="flex items-center gap-2 sm:gap-4 flex-1">
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 lg:hidden"
          onClick={onMenuClick}
          title="Menu"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div className="relative hidden max-w-sm flex-1 sm:flex">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            className="h-9 w-full border-border/70 bg-muted/50 pl-9 text-sm shadow-inner shadow-foreground/[0.02]"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
        {isPrestataire && user?.role === "prestataire" ? (
          <PrestataireVerificationBadge
            status={validationStatus}
            size="sm"
            linkToProfil={validationStatus !== "valide"}
            className="max-w-[9rem] sm:max-w-none"
          />
        ) : null}
        <NotificationsDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex h-10 items-center gap-1 px-1 sm:gap-2 sm:px-2">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{roleLabel}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profil</DropdownMenuItem>
            <DropdownMenuItem>Paramètres</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
