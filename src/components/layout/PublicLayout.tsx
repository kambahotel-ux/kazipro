import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { AssistantHost } from "@/components/assistant/AssistantHost";

interface PublicLayoutProps {
  children: ReactNode;
}

/**
 * Gabarit pages vitrine&nbsp;: menu fixe, décalage du contenu, pied de page.
 */
export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 pt-14 sm:pt-16 lg:pt-20">
        {children}
      </main>
      <Footer />
      <AssistantHost />
    </div>
  );
}
