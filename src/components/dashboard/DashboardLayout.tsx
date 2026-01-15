import { useState } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "client" | "prestataire" | "admin";
  userName: string;
  userRole: string;
}

export function DashboardLayout({ children, role, userName, userRole }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <DashboardSidebar role={role} />
      </div>
      
      {/* Mobile sidebar - using Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-card">
          <div className="flex flex-col h-full">
            <DashboardSidebar role={role} isMobile={true} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col w-full">
        <DashboardHeader 
          userName={userName} 
          userRole={userRole}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
