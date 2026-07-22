import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import { PrestataireHubLayout } from "@/components/prestataire/PrestataireHubLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PrestataireFeatureGate } from "@/components/dashboard/PrestataireFeatureGate";
import Index from "./pages/Index";
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import Location from "./pages/Location";
import LocationDetail from "./pages/LocationDetail";
import HowItWorks from "./pages/HowItWorks";
import About from "./pages/About";
import MentionsLegales from "./pages/legal/MentionsLegales";
import Confidentialite from "./pages/legal/Confidentialite";
import CGU from "./pages/legal/CGU";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import RegisterClient from "./pages/auth/RegisterClient";
import RegisterProvider from "./pages/auth/RegisterProvider";
import RegisterProviderSimple from "./pages/auth/RegisterProviderSimple";
import RegisterProviderSteps from "./pages/auth/RegisterProviderSteps";
import VerifyOTP from "./pages/auth/VerifyOTP";
import AuthCallback from "./pages/auth/AuthCallback";
import ClientDashboard from "./pages/dashboard/client/ClientDashboard";
import DemandesPage from "./pages/dashboard/client/DemandesPage";
import AccepterDevisPage from "./pages/dashboard/client/AccepterDevisPage";
import SignerContratPage from "./pages/dashboard/client/SignerContratPage";
import PaiementAcomptePage from "./pages/dashboard/client/PaiementAcomptePage";
import PaiementSoldePage from "./pages/dashboard/client/PaiementSoldePage";
import PaiementConfirmationPage from "./pages/dashboard/client/PaiementConfirmationPage";
import MissionDetailPage from "./pages/dashboard/client/MissionDetailPage";
import ClientMissionsPage from "./pages/dashboard/client/ClientMissionsPage";
import NouvelleDemandePages from "./pages/dashboard/client/NouvelleDemandePages";
import ClientDemandeDetailPage from "./pages/dashboard/client/DemandeDetailPage";
import PaiementsPage from "./pages/dashboard/client/PaiementsPage";
import ClientLitigesPage from "./pages/dashboard/client/LitigesPage";
import AvisPage from "./pages/dashboard/client/AvisPage";
import ClientMessagesPage from "./pages/dashboard/client/MessagesPage";
import ClientParametresPage from "./pages/dashboard/client/ParametresPage";
import PrestatairePublicProfil from "./pages/PrestatairePublicProfil";
import RecherchePrestatairesPage from "./pages/dashboard/client/RecherchePrestatairesPage";
import PrestataireDashboard from "./pages/dashboard/prestataire/PrestataireDashboard";
import CompleterProfil from "./pages/dashboard/prestataire/CompleterProfil";
import OpportunitesPage from "./pages/dashboard/prestataire/OpportunitesPage";
import DemandeDetailPage from "./pages/dashboard/prestataire/DemandeDetailPage";
import CreerDevisPage from "./pages/dashboard/prestataire/CreerDevisPage";
import MissionsPage from "./pages/dashboard/prestataire/MissionsPage";
import ContratsPage from "./pages/dashboard/prestataire/ContratsPage";
import VoirContratPage from "./pages/dashboard/prestataire/VoirContratPage";
import DevisPage from "./pages/dashboard/prestataire/DevisPage";
import CalendrierPage from "./pages/dashboard/prestataire/CalendrierPage";
import RevenusPage from "./pages/dashboard/prestataire/RevenusPage";
import PrestataireLitigesPage from "./pages/dashboard/prestataire/LitigesPage";
import PrestataireMessagesPage from "./pages/dashboard/prestataire/MessagesPage";
import ProfilPage from "./pages/dashboard/prestataire/ProfilPage";
import PrestataireParametresPage from "./pages/dashboard/prestataire/ParametresPage";
import ConfigPaiementPrestatairePage from "./pages/dashboard/prestataire/ConfigPaiementPage";
import FraisDeplacementPage from "./pages/dashboard/prestataire/FraisDeplacementPage";
import AdminDashboard from "./pages/dashboard/admin/AdminDashboard";
import UsersPage from "./pages/dashboard/admin/UsersPage";
import ProvidersPage from "./pages/dashboard/admin/ProvidersPage";
import ProfessionsPage from "./pages/dashboard/admin/ProfessionsPage";
import RequestsPage from "./pages/dashboard/admin/RequestsPage";
import DisputesPage from "./pages/dashboard/admin/DisputesPage";
import LocationAdminPage from "./pages/dashboard/admin/LocationAdminPage";
import MaterielCategoriesPage from "./pages/dashboard/admin/MaterielCategoriesPage";
import TransactionsPage from "./pages/dashboard/admin/TransactionsPage";
import ReportsPage from "./pages/dashboard/admin/ReportsPage";
import ConfigPaiementPage from "./pages/dashboard/admin/ConfigPaiementPage";
import ConfigNotificationsPage from "./pages/dashboard/admin/ConfigNotificationsPage";
import ConfigPage from "./pages/dashboard/admin/ConfigPage";
import AdminDevisPage from "./pages/dashboard/admin/DevisPage";
import NotFound from "./pages/NotFound";

/** Tableau de bord et profil accessibles avant validation admin. */
function prestataireOpen(page: ReactNode) {
  return (
    <ProtectedRoute allowedRoles={["prestataire"]} skipPrestataireValidation>
      {page}
    </ProtectedRoute>
  );
}

function prestataireFeature(page: ReactNode) {
  return (
    <ProtectedRoute allowedRoles={["prestataire"]} skipPrestataireValidation>
      <PrestataireFeatureGate>{page}</PrestataireFeatureGate>
    </ProtectedRoute>
  );
}

export const appRoutes: RouteObject[] = [
  { path: "/", element: <Index /> },
  { path: "/services", element: <Services /> },
  { path: "/services/:serviceId", element: <ServiceDetail /> },
  { path: "/prestataires/:id", element: <PrestatairePublicProfil /> },
  { path: "/location", element: <Location /> },
  { path: "/location/:id", element: <LocationDetail /> },
  { path: "/comment-ca-marche", element: <HowItWorks /> },
  { path: "/a-propos", element: <About /> },
  { path: "/mentions-legales", element: <MentionsLegales /> },
  { path: "/confidentialite", element: <Confidentialite /> },
  { path: "/cgu", element: <CGU /> },
  { path: "/connexion", element: <Login /> },
  { path: "/mot-de-passe-oublie", element: <ForgotPassword /> },
  { path: "/reinitialiser-mot-de-passe", element: <ResetPassword /> },
  { path: "/inscription/client", element: <RegisterClient /> },
  { path: "/inscription/prestataire", element: <RegisterProviderSimple /> },
  { path: "/inscription/prestataire/complete", element: <RegisterProvider /> },
  { path: "/inscription/prestataire/steps", element: <RegisterProviderSteps /> },
  { path: "/auth/verify-otp", element: <VerifyOTP /> },
  { path: "/auth/callback", element: <AuthCallback /> },
  { path: "/auth/google/callback", element: <AuthCallback /> },
  { path: "/callback", element: <AuthCallback /> },
  { path: "/prestataire/en-attente", element: <Navigate to="/dashboard/prestataire" replace /> },
  { path: "/dashboard/client", element: <ProtectedRoute allowedRoles={["client"]}><ClientDashboard /></ProtectedRoute> },
  { path: "/dashboard/client/demandes", element: <ProtectedRoute allowedRoles={["client"]}><DemandesPage /></ProtectedRoute> },
  { path: "/dashboard/client/demandes/nouvelle", element: <ProtectedRoute allowedRoles={["client"]}><NouvelleDemandePages /></ProtectedRoute> },
  { path: "/dashboard/client/demandes/:demandeId", element: <ProtectedRoute allowedRoles={["client"]}><ClientDemandeDetailPage /></ProtectedRoute> },
  { path: "/dashboard/client/devis/:devisId/accepter", element: <ProtectedRoute allowedRoles={["client"]}><AccepterDevisPage /></ProtectedRoute> },
  { path: "/dashboard/client/contrat/:devisId", element: <ProtectedRoute allowedRoles={["client"]}><SignerContratPage /></ProtectedRoute> },
  { path: "/dashboard/client/paiement/:contratId/acompte", element: <ProtectedRoute allowedRoles={["client"]}><PaiementAcomptePage /></ProtectedRoute> },
  { path: "/dashboard/client/paiement/:contratId/solde", element: <ProtectedRoute allowedRoles={["client"]}><PaiementSoldePage /></ProtectedRoute> },
  { path: "/dashboard/client/paiement/:paiementId/confirmation", element: <ProtectedRoute allowedRoles={["client"]}><PaiementConfirmationPage /></ProtectedRoute> },
  { path: "/dashboard/client/missions", element: <ProtectedRoute allowedRoles={["client"]}><ClientMissionsPage /></ProtectedRoute> },
  { path: "/dashboard/client/missions/:missionId", element: <ProtectedRoute allowedRoles={["client"]}><MissionDetailPage /></ProtectedRoute> },
  { path: "/dashboard/client/paiements", element: <ProtectedRoute allowedRoles={["client"]}><PaiementsPage /></ProtectedRoute> },
  { path: "/dashboard/client/litiges", element: <ProtectedRoute allowedRoles={["client"]}><ClientLitigesPage /></ProtectedRoute> },
  { path: "/dashboard/client/avis", element: <ProtectedRoute allowedRoles={["client"]}><AvisPage /></ProtectedRoute> },
  { path: "/dashboard/client/messages", element: <ProtectedRoute allowedRoles={["client"]}><ClientMessagesPage /></ProtectedRoute> },
  { path: "/dashboard/client/parametres", element: <ProtectedRoute allowedRoles={["client"]}><ClientParametresPage /></ProtectedRoute> },
  { path: "/dashboard/client/recherche", element: <ProtectedRoute allowedRoles={["client"]}><RecherchePrestatairesPage /></ProtectedRoute> },
  { path: "/dashboard/client/prestataire/:id", element: <PrestatairePublicProfil /> },
  { path: "/dashboard/prestataire", element: prestataireOpen(<PrestataireDashboard />) },
  { path: "/dashboard/prestataire/completer-profil", element: prestataireOpen(<CompleterProfil />) },
  { path: "/dashboard/prestataire/compte/profil", element: prestataireOpen(<ProfilPage embedded />) },
  {
    path: "/dashboard/prestataire/marche",
    element: prestataireFeature(<PrestataireHubLayout hubId="marche" />),
    children: [
      { index: true, element: <Navigate to="opportunites" replace /> },
      { path: "opportunites", element: <OpportunitesPage embedded /> },
      { path: "devis", element: <DevisPage embedded /> },
    ],
  },
  {
    path: "/dashboard/prestataire/chantiers",
    element: prestataireFeature(<PrestataireHubLayout hubId="chantiers" />),
    children: [
      { index: true, element: <Navigate to="missions" replace /> },
      { path: "missions", element: <MissionsPage embedded /> },
      { path: "contrats", element: <ContratsPage embedded /> },
      { path: "calendrier", element: <CalendrierPage embedded /> },
    ],
  },
  {
    path: "/dashboard/prestataire/compte",
    element: prestataireFeature(<PrestataireHubLayout hubId="compte" />),
    children: [
      { index: true, element: <Navigate to="/dashboard/prestataire/compte/profil" replace /> },
      { path: "revenus", element: <RevenusPage embedded /> },
      { path: "frais-deplacement", element: <FraisDeplacementPage embedded /> },
      { path: "config-paiement", element: <ConfigPaiementPrestatairePage embedded /> },
      { path: "parametres", element: <PrestataireParametresPage embedded /> },
      { path: "litiges", element: <PrestataireLitigesPage embedded /> },
    ],
  },
  { path: "/dashboard/prestataire/opportunites", element: <Navigate to="/dashboard/prestataire/marche/opportunites" replace /> },
  { path: "/dashboard/prestataire/devis", element: <Navigate to="/dashboard/prestataire/marche/devis" replace /> },
  { path: "/dashboard/prestataire/missions", element: <Navigate to="/dashboard/prestataire/chantiers/missions" replace /> },
  { path: "/dashboard/prestataire/contrats", element: <Navigate to="/dashboard/prestataire/chantiers/contrats" replace /> },
  { path: "/dashboard/prestataire/calendrier", element: <Navigate to="/dashboard/prestataire/chantiers/calendrier" replace /> },
  { path: "/dashboard/prestataire/revenus", element: <Navigate to="/dashboard/prestataire/compte/revenus" replace /> },
  { path: "/dashboard/prestataire/profil", element: <Navigate to="/dashboard/prestataire/compte/profil" replace /> },
  { path: "/dashboard/prestataire/parametres", element: <Navigate to="/dashboard/prestataire/compte/parametres" replace /> },
  { path: "/dashboard/prestataire/litiges", element: <Navigate to="/dashboard/prestataire/compte/litiges" replace /> },
  { path: "/dashboard/prestataire/config-paiement", element: <Navigate to="/dashboard/prestataire/compte/config-paiement" replace /> },
  { path: "/dashboard/prestataire/frais-deplacement", element: <Navigate to="/dashboard/prestataire/compte/frais-deplacement" replace /> },
  { path: "/dashboard/prestataire/demandes/:id", element: prestataireFeature(<DemandeDetailPage />) },
  { path: "/dashboard/prestataire/devis/nouveau/:demandeId", element: prestataireFeature(<CreerDevisPage />) },
  { path: "/dashboard/prestataire/contrat/:contratId", element: prestataireFeature(<VoirContratPage />) },
  { path: "/dashboard/prestataire/messages", element: prestataireFeature(<PrestataireMessagesPage />) },
  { path: "/dashboard/admin", element: <ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute> },
  { path: "/dashboard/admin/utilisateurs", element: <ProtectedRoute allowedRoles={["admin"]}><UsersPage /></ProtectedRoute> },
  { path: "/dashboard/admin/prestataires", element: <ProtectedRoute allowedRoles={["admin"]}><ProvidersPage /></ProtectedRoute> },
  { path: "/dashboard/admin/professions", element: <ProtectedRoute allowedRoles={["admin"]}><ProfessionsPage /></ProtectedRoute> },
  { path: "/dashboard/admin/demandes", element: <ProtectedRoute allowedRoles={["admin"]}><RequestsPage /></ProtectedRoute> },
  { path: "/dashboard/admin/devis", element: <ProtectedRoute allowedRoles={["admin"]}><AdminDevisPage /></ProtectedRoute> },
  { path: "/dashboard/admin/litiges", element: <ProtectedRoute allowedRoles={["admin"]}><DisputesPage /></ProtectedRoute> },
  { path: "/dashboard/admin/location", element: <ProtectedRoute allowedRoles={["admin"]}><LocationAdminPage /></ProtectedRoute> },
  { path: "/dashboard/admin/categories-materiel", element: <ProtectedRoute allowedRoles={["admin"]}><MaterielCategoriesPage /></ProtectedRoute> },
  { path: "/dashboard/admin/transactions", element: <ProtectedRoute allowedRoles={["admin"]}><TransactionsPage /></ProtectedRoute> },
  { path: "/dashboard/admin/rapports", element: <ProtectedRoute allowedRoles={["admin"]}><ReportsPage /></ProtectedRoute> },
  { path: "/dashboard/admin/parametres", element: <ProtectedRoute allowedRoles={["admin"]}><ConfigPage /></ProtectedRoute> },
  { path: "/dashboard/admin/configuration", element: <ProtectedRoute allowedRoles={["admin"]}><ConfigPage /></ProtectedRoute> },
  { path: "/dashboard/admin/config-paiement", element: <ProtectedRoute allowedRoles={["admin"]}><ConfigPaiementPage /></ProtectedRoute> },
  { path: "/dashboard/admin/config-notifications", element: <ProtectedRoute allowedRoles={["admin"]}><ConfigNotificationsPage /></ProtectedRoute> },
  { path: "*", element: <NotFound /> },
];
