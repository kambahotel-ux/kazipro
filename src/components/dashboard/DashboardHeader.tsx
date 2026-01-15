import { Bell, Menu, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface DashboardHeaderProps {
  userName: string;
  userRole: string;
  onMenuClick?: () => void;
}

export function DashboardHeader({ userName, userRole, onMenuClick }: DashboardHeaderProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
  const initials = userName
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
    <header className="h-14 sm:h-16 border-b border-border bg-card px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-40">
      <div className="flex items-center gap-2 sm:gap-4 flex-1">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden flex-shrink-0"
          onClick={onMenuClick}
          title="Menu"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div className="hidden sm:flex relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            className="pl-9 w-full bg-muted/50 border-0 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
        <Button variant="ghost" size="icon" className="relative" title="Notifications">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2 h-10">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{userRole}</p>
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
