import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import Index from "./pages/Index";
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import HowItWorks from "./pages/HowItWorks";
import About from "./pages/About";
import Login from "./pages/auth/Login";
import RegisterClient from "./pages/auth/RegisterClient";
import RegisterProvider from "./pages/auth/RegisterProvider";
import RegisterProviderSteps from "./pages/auth/RegisterProviderSteps";
import VerifyOTP from "./pages/auth/VerifyOTP";
import ProviderPending from "./pages/auth/ProviderPending";
import ClientDashboard from "./pages/dashboard/client/ClientDashboard";
import DemandesPage from "./pages/dashboard/client/DemandesPage";
import NouvelleDemandePages from "./pages/dashboard/client/NouvelleDemandePages";
import ClientDemandeDetailPage from "./pages/dashboard/client/DemandeDetailPage";
import PaiementsPage from "./pages/dashboard/client/PaiementsPage";
import AvisPage from "./pages/dashboard/client/AvisPage";
import ClientMessagesPage from "./pages/dashboard/client/MessagesPage";
import ClientParametresPage from "./pages/dashboard/client/ParametresPage";
import PrestataireDashboard from "./pages/dashboard/prestataire/PrestataireDashboard";
import OpportunitesPage from "./pages/dashboard/prestataire/OpportunitesPage";
import DemandeDetailPage from "./pages/dashboard/prestataire/DemandeDetailPage";
import CreerDevisPage from "./pages/dashboard/prestataire/CreerDevisPage";
import MissionsPage from "./pages/dashboard/prestataire/MissionsPage";
import DevisPage from "./pages/dashboard/prestataire/DevisPage";
import CalendrierPage from "./pages/dashboard/prestataire/CalendrierPage";
import RevenusPage from "./pages/dashboard/prestataire/RevenusPage";
import PrestataireMessagesPage from "./pages/dashboard/prestataire/MessagesPage";
import ProfilPage from "./pages/dashboard/prestataire/ProfilPage";
import PrestataireParametresPage from "./pages/dashboard/prestataire/ParametresPage";
import AdminDashboard from "./pages/dashboard/admin/AdminDashboard";
import UsersPage from "./pages/dashboard/admin/UsersPage";
import ProvidersPage from "./pages/dashboard/admin/ProvidersPage";
import ProfessionsPage from "./pages/dashboard/admin/ProfessionsPage";
import RequestsPage from "./pages/dashboard/admin/RequestsPage";
import DisputesPage from "./pages/dashboard/admin/DisputesPage";
import TransactionsPage from "./pages/dashboard/admin/TransactionsPage";
import ReportsPage from "./pages/dashboard/admin/ReportsPage";
import ConfigPage from "./pages/dashboard/admin/ConfigPage";
import AdminDevisPage from "./pages/dashboard/admin/DevisPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:serviceId" element={<ServiceDetail />} />
          <Route path="/comment-ca-marche" element={<HowItWorks />} />
          <Route path="/a-propos" element={<About />} />
          <Route path="/connexion" element={<Login />} />
          <Route path="/inscription/client" element={<RegisterClient />} />
          <Route path="/inscription/prestataire" element={<RegisterProviderSteps />} />
          <Route path="/inscription/prestataire/simple" element={<RegisterProvider />} />
          <Route path="/auth/verify-otp" element={<VerifyOTP />} />
          <Route path="/prestataire/en-attente" element={<ProviderPending />} />
          
          {/* Dashboard routes */}
          <Route path="/dashboard/client" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/client/demandes" element={<ProtectedRoute><DemandesPage /></ProtectedRoute>} />
          <Route path="/dashboard/client/demandes/nouvelle" element={<ProtectedRoute><NouvelleDemandePages /></ProtectedRoute>} />
          <Route path="/dashboard/client/demandes/:demandeId" element={<ProtectedRoute><ClientDemandeDetailPage /></ProtectedRoute>} />
          <Route path="/dashboard/client/paiements" element={<ProtectedRoute><PaiementsPage /></ProtectedRoute>} />
          <Route path="/dashboard/client/avis" element={<ProtectedRoute><AvisPage /></ProtectedRoute>} />
          <Route path="/dashboard/client/messages" element={<ProtectedRoute><ClientMessagesPage /></ProtectedRoute>} />
          <Route path="/dashboard/client/parametres" element={<ProtectedRoute><ClientParametresPage /></ProtectedRoute>} />
          
          {/* Prestataire Dashboard routes */}
          <Route path="/dashboard/prestataire" element={<ProtectedRoute><PrestataireDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/prestataire/opportunites" element={<ProtectedRoute><OpportunitesPage /></ProtectedRoute>} />
          <Route path="/dashboard/prestataire/demandes/:id" element={<ProtectedRoute><DemandeDetailPage /></ProtectedRoute>} />
          <Route path="/dashboard/prestataire/devis/nouveau/:demandeId" element={<ProtectedRoute><CreerDevisPage /></ProtectedRoute>} />
          <Route path="/dashboard/prestataire/missions" element={<ProtectedRoute><MissionsPage /></ProtectedRoute>} />
          <Route path="/dashboard/prestataire/devis" element={<ProtectedRoute><DevisPage /></ProtectedRoute>} />
          <Route path="/dashboard/prestataire/calendrier" element={<ProtectedRoute><CalendrierPage /></ProtectedRoute>} />
          <Route path="/dashboard/prestataire/revenus" element={<ProtectedRoute><RevenusPage /></ProtectedRoute>} />
          <Route path="/dashboard/prestataire/messages" element={<ProtectedRoute><PrestataireMessagesPage /></ProtectedRoute>} />
          <Route path="/dashboard/prestataire/profil" element={<ProtectedRoute><ProfilPage /></ProtectedRoute>} />
          <Route path="/dashboard/prestataire/parametres" element={<ProtectedRoute><PrestataireParametresPage /></ProtectedRoute>} />
          
          {/* Admin Dashboard routes */}
          <Route path="/dashboard/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/dashboard/admin/utilisateurs" element={<AdminRoute><UsersPage /></AdminRoute>} />
          <Route path="/dashboard/admin/prestataires" element={<AdminRoute><ProvidersPage /></AdminRoute>} />
          <Route path="/dashboard/admin/professions" element={<AdminRoute><ProfessionsPage /></AdminRoute>} />
          <Route path="/dashboard/admin/demandes" element={<AdminRoute><RequestsPage /></AdminRoute>} />
          <Route path="/dashboard/admin/devis" element={<AdminRoute><AdminDevisPage /></AdminRoute>} />
          <Route path="/dashboard/admin/litiges" element={<AdminRoute><DisputesPage /></AdminRoute>} />
          <Route path="/dashboard/admin/transactions" element={<AdminRoute><TransactionsPage /></AdminRoute>} />
          <Route path="/dashboard/admin/rapports" element={<AdminRoute><ReportsPage /></AdminRoute>} />
          <Route path="/dashboard/admin/configuration" element={<AdminRoute><ConfigPage /></AdminRoute>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
