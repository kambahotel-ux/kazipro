import { useState } from "react";
import { useLocation } from "react-router-dom";
import { PRESTATAIRE_PATHS } from "@/lib/prestataire-nav";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { usePrestataireAccess } from "@/hooks/usePrestataireAccess";
import { PrestataireVerificationBanner } from "@/components/prestataire/PrestataireVerificationBadge";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "client" | "prestataire" | "admin";
  /** Si omis, l’entête utilise des libellés par défaut (évite crash sur pages qui n’injectent pas le profil tout de suite). */
  userName?: string;
  userRole?: string;
  isVerified?: boolean;
  isProfileComplete?: boolean;
}

export function DashboardLayout({
  children,
  role,
  userName = "",
  userRole = "",
  isVerified: isVerifiedProp,
  isProfileComplete: isProfileCompleteProp,
}: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const prestataireAccess = usePrestataireAccess();
  const isPrestataireHome = location.pathname === PRESTATAIRE_PATHS.dashboard;
  const showVerificationBanner =
    role === "prestataire" &&
    !isPrestataireHome &&
    prestataireAccess.isProfileComplete &&
    prestataireAccess.validationStatus !== "valide";

  const isVerified =
    role === "prestataire"
      ? (isVerifiedProp ?? prestataireAccess.isVerified)
      : true;
  const isProfileComplete =
    role === "prestataire"
      ? (isProfileCompleteProp ?? prestataireAccess.isProfileComplete)
      : true;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <DashboardSidebar role={role} isVerified={isVerified} isProfileComplete={isProfileComplete} />
      </div>
      
      {/* Mobile sidebar - using Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
          <div className="flex flex-col h-full">
            <DashboardSidebar role={role} isMobile={true} isVerified={isVerified} isProfileComplete={isProfileComplete} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex w-full min-w-0 flex-col">
        <DashboardHeader 
          userName={userName} 
          userRole={userRole}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-auto">
          <div className="page-shell">
            {showVerificationBanner ? (
              <div className="mb-4 md:mb-6">
                <PrestataireVerificationBanner
                  status={prestataireAccess.validationStatus}
                  motifRejet={prestataireAccess.motifRejet}
                />
              </div>
            ) : null}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
