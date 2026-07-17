import { useState, useEffect, useRef } from "react";
import { ProfilePageSkeleton } from "@/components/dashboard/AdminLoadingSkeleton";
import { PrestatairePageShell } from "@/components/prestataire/PrestatairePageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { 
  Camera, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Award, 
  Shield, 
  Edit, 
  Plus,
  Briefcase,
  CheckCircle,
  Share2,
  Download,
  Trash2,
  Loader2,
  Save,
  FileText,
  X,
  Upload
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { prestatairesApi, uploadApi, avisApi, portfolioApi, API_BASE_URL } from "@/lib/api";
import {
  displayNameFromProfil,
  getProfil,
  prestataireIdFromUser,
  getPrestataireValidationStatus,
  isPrestataireValidated,
  isPrestataireProfileComplete,
  professionLabelFromProfil,
} from "@/lib/kazipro-profile";
import { unwrapPortfolio } from "@/lib/api-utils";
import { toast } from "sonner";
import ProfileCompletionSteps from "@/components/profile/ProfileCompletionSteps";
import { PrestataireVerificationBadge } from "@/components/prestataire/PrestataireVerificationBadge";

interface ProviderProfile {
  id: string;
  user_id: string;
  full_name: string;
  profession: string;
  bio?: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  verified: boolean;
  profile_completed?: boolean;
  created_at: string;
  experience_years?: number;
  hourly_rate?: number;
  availability?: string;
  // Documents
  id_document_url?: string;
  qualification_url?: string;
  // Champs personne physique/morale
  type_prestataire?: 'physique' | 'morale';
  // Personne physique
  nom?: string;
  prenom?: string;
  date_naissance?: string;
  numero_cni?: string;
  // Personne morale
  raison_sociale?: string;
  forme_juridique?: string;
  numero_rccm?: string;
  numero_impot?: string;
  numero_id_nat?: string;
  representant_legal_nom?: string;
  representant_legal_prenom?: string;
  representant_legal_fonction?: string;
  adresse_siege?: string;
  ville_siege?: string;
  pays_siege?: string;
}

function mapApiToProviderProfile(
  profileData: Record<string, unknown>,
  user: { id: string; name?: string; email?: string },
): ProviderProfile {
  return {
    id: String(profileData.id),
    user_id: String(profileData.user_id ?? user.id),
    full_name: displayNameFromProfil(profileData, user.name || "Prestataire"),
    profession: professionLabelFromProfil(profileData),
    bio: String(profileData.bio ?? ""),
    phone: String(profileData.telephone ?? profileData.phone ?? ""),
    email: String(profileData.email ?? user.email ?? ""),
    address: String(profileData.adresse ?? profileData.address ?? ""),
    city: String(profileData.ville ?? profileData.city ?? ""),
    verified: isPrestataireValidated(profileData),
    profile_completed:
      Boolean(profileData.profile_completed) || isPrestataireProfileComplete(profileData),
    created_at: String(profileData.created_at ?? ""),
    experience_years: Number(profileData.experience_years ?? profileData.annees_experience ?? 0),
    hourly_rate: Number(profileData.hourly_rate ?? profileData.tarif_horaire ?? 0),
    availability: profileData.disponible ? "disponible" : "occupe",
    id_document_url:
      (profileData.piece_identite as string | undefined) ||
      (profileData.id_document_url as string | undefined),
    qualification_url:
      (profileData.document_rccm as string | undefined) ||
      (profileData.qualification_url as string | undefined),
    type_prestataire:
      (profileData.type_personne as ProviderProfile["type_prestataire"]) ||
      (profileData.type_prestataire as ProviderProfile["type_prestataire"]),
    nom: String(profileData.nom ?? ""),
    prenom: String(profileData.prenom ?? ""),
    date_naissance: String(profileData.date_naissance ?? ""),
    numero_cni: String(profileData.numero_cni ?? ""),
    raison_sociale: String(profileData.raison_sociale ?? ""),
    forme_juridique: String(profileData.forme_juridique ?? ""),
    numero_rccm: String(profileData.numero_rccm ?? ""),
    numero_impot: String(profileData.numero_impot ?? ""),
    numero_id_nat: String(profileData.numero_id_nat ?? ""),
    representant_legal_nom: String(profileData.representant_legal_nom ?? ""),
    representant_legal_prenom: String(profileData.representant_legal_prenom ?? ""),
    representant_legal_fonction: String(profileData.representant_legal_fonction ?? ""),
    adresse_siege: String(profileData.adresse_siege ?? ""),
    ville_siege: String(profileData.ville_siege ?? ""),
    pays_siege: String(profileData.pays_siege ?? ""),
  };
}

interface Avis {
  id: string;
  rating: number;
  commentaire: string;
  created_at: string;
  client_id: string;
  demande_id?: string;
}

interface ProviderService {
  id: string;
  service: string;
  niveau_competence: string;
  annees_experience: number;
  tarif_horaire?: number;
  principal: boolean;
}

interface PortfolioItem {
  id: string;
  titre: string;
  description: string;
  categorie: string;
  date_realisation: string;
  images: string[];
  created_at: string;
}

const professions = [
  "Électricien",
  "Plombier",
  "Menuisier",
  "Maçon",
  "Peintre",
  "Mécanicien",
  "Informaticien",
  "Jardinier",
  "Couturier/Couturière",
  "Coiffeur/Coiffeuse",
];

function storageUrlFromUpload(up: { url?: string; path?: string }): string {
  if (up.url) return up.url;
  if (!up.path) return "";
  const origin = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${origin}/storage/${up.path.replace(/^\//, "")}`;
}

function statsFromPrestataireData(profileData: Record<string, unknown>) {
  const rating = Number(profileData.note_moyenne ?? 0);
  return {
    rating: Math.round(rating * 10) / 10,
    reviewsCount: Number(profileData.nb_avis ?? 0),
    missionsCompleted: Number(profileData.nb_missions ?? 0),
    satisfactionRate: Math.round((rating / 5) * 100),
  };
}

function mapPortfolioItems(
  projets: Array<{
    id: string;
    titre: string;
    description?: string;
    photos?: string[];
    images?: string[];
    date_realisation?: string;
    created_at?: string;
  }>,
  professionLabel: string,
): PortfolioItem[] {
  return projets.map((p) => ({
    id: p.id,
    titre: p.titre,
    description: p.description ?? "",
    images: p.photos ?? p.images ?? [],
    date_realisation: p.date_realisation ?? p.created_at ?? "",
    categorie: professionLabel,
    created_at: p.created_at ?? "",
  }));
}

type ProfilPageCache = {
  userId: string;
  profile: ProviderProfile;
  formData: ReturnType<typeof createEmptyFormData>;
  portfolio: PortfolioItem[];
  stats: ReturnType<typeof statsFromPrestataireData>;
  fetchedAt: number;
};

const PROFIL_CACHE_MS = 45_000;
let profilPageCache: ProfilPageCache | null = null;

function clearProfilPageCache() {
  profilPageCache = null;
}

function createEmptyFormData() {
  return {
    full_name: "",
    profession: "",
    bio: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    experience_years: 0,
    hourly_rate: 0,
    availability: "disponible",
    nom: "",
    prenom: "",
    date_naissance: "",
    numero_cni: "",
    raison_sociale: "",
    forme_juridique: "",
    numero_rccm: "",
    numero_impot: "",
    numero_id_nat: "",
    representant_legal_nom: "",
    representant_legal_prenom: "",
    representant_legal_fonction: "",
    adresse_siege: "",
    ville_siege: "",
    pays_siege: "",
  };
}

function formDataFromProfile(
  profileData: Record<string, unknown>,
  user: { name?: string; email?: string },
) {
  return {
    full_name: displayNameFromProfil(profileData, user.name || ""),
    profession: professionLabelFromProfil(profileData),
    bio: String(profileData.bio ?? ""),
    phone: String(profileData.telephone ?? profileData.phone ?? ""),
    email: String(profileData.email ?? user.email ?? ""),
    address: String(profileData.adresse ?? profileData.address ?? ""),
    city: String(profileData.ville ?? profileData.city ?? ""),
    experience_years: Number(profileData.experience_years ?? profileData.annees_experience ?? 0),
    hourly_rate: Number(profileData.hourly_rate ?? profileData.tarif_horaire ?? 0),
    availability: profileData.disponible ? "disponible" : "occupe",
    nom: String(profileData.nom ?? ""),
    prenom: String(profileData.prenom ?? ""),
    date_naissance: String(profileData.date_naissance ?? ""),
    numero_cni: String(profileData.numero_cni ?? ""),
    raison_sociale: String(profileData.raison_sociale ?? ""),
    forme_juridique: String(profileData.forme_juridique ?? ""),
    numero_rccm: String(profileData.numero_rccm ?? ""),
    numero_impot: String(profileData.numero_impot ?? ""),
    numero_id_nat: String(profileData.numero_id_nat ?? ""),
    representant_legal_nom: String(profileData.representant_legal_nom ?? ""),
    representant_legal_prenom: String(profileData.representant_legal_prenom ?? ""),
    representant_legal_fonction: String(profileData.representant_legal_fonction ?? ""),
    adresse_siege: String(profileData.adresse_siege ?? ""),
    ville_siege: String(profileData.ville_siege ?? ""),
    pays_siege: String(profileData.pays_siege ?? "RDC"),
  };
}

const communes = [
  "Bandalungwa", "Barumbu", "Bumbu", "Gombe", "Kalamu",
  "Kasa-Vubu", "Kimbanseke", "Kinshasa", "Kintambo", "Kisenso",
  "Lemba", "Limete", "Lingwala", "Makala", "Maluku",
  "Masina", "Matete", "Mont-Ngafula", "Ndjili", "Ngaba",
  "Ngaliema", "Ngiri-Ngiri", "Nsele", "Selembao"
];

export default function ProfilPage({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [services, setServices] = useState<ProviderService[]>([]);
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({
    service: "",
    niveau: "intermediaire",
    experience: 0,
    tarif: 0,
  });
  
  // États pour la modification des documents
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [newIdDocument, setNewIdDocument] = useState<File | null>(null);
  const [newQualificationDoc, setNewQualificationDoc] = useState<File | null>(null);
  
  // État pour la photo de profil
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    rating: 0,
    reviewsCount: 0,
    missionsCompleted: 0,
    satisfactionRate: 0,
  });
  
  // Reviews (chargés à la demande — onglet Avis)
  const [reviews, setReviews] = useState<Avis[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [profileTab, setProfileTab] = useState("about");
  const reviewsLoadedRef = useRef(false);
  
  // Horaires
  const [horaires, setHoraires] = useState<any[]>([]);
  const [loadingHoraires, setLoadingHoraires] = useState(false);
  
  // Portfolio
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioItem | null>(null);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [portfolioImages, setPortfolioImages] = useState<File[]>([]);
  const [newPortfolio, setNewPortfolio] = useState({
    titre: "",
    description: "",
    date_realisation: new Date().toISOString().split('T')[0]
  });
  
  const joursMap: Record<string, string> = {
    'lundi': 'Lundi',
    'mardi': 'Mardi',
    'mercredi': 'Mercredi',
    'jeudi': 'Jeudi',
    'vendredi': 'Vendredi',
    'samedi': 'Samedi',
    'dimanche': 'Dimanche'
  };
  
  // Form data
  const [formData, setFormData] = useState(createEmptyFormData);

  const profileFetchRef = useRef(false);

  useEffect(() => {
    if (user) {
      void fetchProfile();
    }
  }, [user?.id]);

  const applyProfilCache = (cached: ProfilPageCache) => {
    setProfile(cached.profile);
    setFormData(cached.formData);
    setPortfolio(cached.portfolio);
    setStats(cached.stats);
    setServices([]);
  };

  const fetchProfile = async (force = false) => {
    if (!user || (profileFetchRef.current && !force)) return;

    if (force) {
      clearProfilPageCache();
      reviewsLoadedRef.current = false;
      setReviews([]);
    }

    const cached =
      !force &&
      profilPageCache &&
      profilPageCache.userId === user.id &&
      Date.now() - profilPageCache.fetchedAt < PROFIL_CACHE_MS
        ? profilPageCache
        : null;

    if (cached) {
      applyProfilCache(cached);
      setLoading(false);
      return;
    }

    profileFetchRef.current = true;
    try {
      if (!profile) setLoading(true);
      const pid = prestataireIdFromUser(user);
      let profileData: Record<string, unknown> | null = getProfil(user);

      let portfolioItems: PortfolioItem[] = [];

      if (pid) {
        try {
          const [prestataireRes, portfolioRes] = await Promise.all([
            prestatairesApi.getById(pid),
            prestatairesApi.getPortfolio(pid),
          ]);
          profileData = prestataireRes as Record<string, unknown>;
          portfolioItems = mapPortfolioItems(
            unwrapPortfolio(portfolioRes),
            professionLabelFromProfil(profileData),
          );
        } catch {
          profileData = getProfil(user);
        }
      }

      if (!profileData) {
        console.log("No provider profile found for user:", user.id);
        return;
      }

      const mappedProfile = mapApiToProviderProfile(profileData, user);
      const nextFormData = formDataFromProfile(profileData, user);
      const nextStats = statsFromPrestataireData(profileData);

      setProfile(mappedProfile);
      setFormData(nextFormData);
      setPortfolio(portfolioItems);
      setStats(nextStats);
      setServices([]);

      profilPageCache = {
        userId: user.id,
        profile: mappedProfile,
        formData: nextFormData,
        portfolio: portfolioItems,
        stats: nextStats,
        fetchedAt: Date.now(),
      };
    } catch (error: unknown) {
      console.error("Error fetching profile:", error);
      toast.error("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
      profileFetchRef.current = false;
    }
  };

  const handleProfileTabChange = (tab: string) => {
    setProfileTab(tab);
    if (tab === "reviews" && profile?.id && !reviewsLoadedRef.current) {
      reviewsLoadedRef.current = true;
      void loadReviews(profile.id);
    }
  };

  const fetchServices = async (_providerId: string) => {
    setServices([]);
  };

  const handleAddService = async () => {
    if (!profile || !newService.service) {
      toast.error("Veuillez sélectionner un service");
      return;
    }
    toast.info("Gestion des services bientôt disponible via l'API");
  };

  const handleDeleteService = async (_serviceId: string) => {
    toast.info("Gestion des services bientôt disponible via l'API");
  };

  const handleSetPrincipal = async (_serviceId: string, _serviceName: string) => {
    toast.info("Gestion des services bientôt disponible via l'API");
  };

  const loadReviews = async (providerId: string) => {
    try {
      setLoadingReviews(true);
      const avisRes = await avisApi.getByPrestataire(providerId);
      const data = Array.isArray(avisRes) ? avisRes : avisRes.data ?? avisRes.avis ?? [];
      setReviews(
        data.slice(0, 10).map((a: { id: string; note?: number; rating?: number; commentaire?: string; created_at?: string; client_id?: string; demande_id?: string }) => ({
          id: a.id,
          rating: a.note ?? a.rating ?? 0,
          commentaire: a.commentaire,
          created_at: a.created_at,
          client_id: a.client_id,
          demande_id: a.demande_id,
        }))
      );
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const refreshPortfolio = async (providerId: string, professionLabel: string) => {
    try {
      setLoadingPortfolio(true);
      const res = await prestatairesApi.getPortfolio(providerId);
      const items = mapPortfolioItems(unwrapPortfolio(res), professionLabel);
      setPortfolio(items);
      if (profilPageCache?.userId === user?.id) {
        profilPageCache = { ...profilPageCache, portfolio: items, fetchedAt: Date.now() };
      }
    } catch (error: unknown) {
      console.error("Error fetching portfolio:", error);
    } finally {
      setLoadingPortfolio(false);
    }
  };

  const handleAddPortfolio = async () => {
    if (!profile || !newPortfolio.titre) {
      toast.error("Le titre est obligatoire");
      return;
    }

    if (portfolioImages.length === 0) {
      toast.error("Ajoutez au moins une image");
      return;
    }

    if (portfolioImages.length > 5) {
      toast.error("Maximum 5 images par réalisation");
      return;
    }

    try {
      setUploadingPortfolio(true);

      await portfolioApi.create(String(profile.id), {
        titre: newPortfolio.titre,
        description: newPortfolio.description || undefined,
        images: portfolioImages,
      });

      toast.success("Réalisation ajoutée avec succès");
      setShowAddPortfolio(false);
      setNewPortfolio({
        titre: "",
        description: "",
        date_realisation: new Date().toISOString().split('T')[0]
      });
      setPortfolioImages([]);
      void refreshPortfolio(String(profile.id), profile.profession);
    } catch (error: any) {
      console.error("Error adding portfolio:", error);
      toast.error("Erreur lors de l'ajout de la réalisation");
    } finally {
      setUploadingPortfolio(false);
    }
  };

  const handleDeletePortfolio = async (portfolioId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette réalisation ?")) {
      return;
    }

    try {
      await portfolioApi.delete(portfolioId);

      toast.success("Réalisation supprimée");
      if (profile) void refreshPortfolio(String(profile.id), profile.profession);
    } catch (error: any) {
      console.error("Error deleting portfolio:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setSaving(true);

      const updateData: Record<string, unknown> = {
        bio: formData.bio,
        telephone: formData.phone,
        email: formData.email,
        adresse: formData.address,
        ville: formData.city,
        annees_experience: formData.experience_years,
        tarif_horaire: formData.hourly_rate,
        disponible: formData.availability === "disponible",
      };

      // Ajouter les champs selon le type
      if (profile.type_prestataire === 'physique') {
        updateData.nom = formData.nom;
        updateData.prenom = formData.prenom;
        updateData.date_naissance = formData.date_naissance || null;
        updateData.numero_cni = formData.numero_cni || null;
      } else if (profile.type_prestataire === 'morale') {
        updateData.raison_sociale = formData.raison_sociale;
        updateData.forme_juridique = formData.forme_juridique || null;
        updateData.numero_rccm = formData.numero_rccm || null;
        updateData.numero_impot = formData.numero_impot || null;
        updateData.numero_id_nat = formData.numero_id_nat || null;
        updateData.representant_legal_nom = formData.representant_legal_nom || null;
        updateData.representant_legal_prenom = formData.representant_legal_prenom || null;
        updateData.representant_legal_fonction = formData.representant_legal_fonction || null;
        updateData.adresse_siege = formData.adresse_siege || null;
        updateData.ville_siege = formData.ville_siege || null;
        updateData.pays_siege = formData.pays_siege || "RDC";
      }

      await prestatairesApi.update(String(profile.id), updateData);

      toast.success("Profil mis à jour avec succès");
      setIsEditing(false);
      fetchProfile();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Erreur lors de la mise à jour du profil");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        profession: profile.profession || "",
        bio: profile.bio || "",
        phone: (profile as any).telephone || profile.phone || "",
        email: profile.email || "",
        address: profile.address || "",
        city: profile.city || "",
        experience_years: profile.experience_years || 0,
        hourly_rate: profile.hourly_rate || 0,
        availability: profile.availability || "disponible",
        // Personne physique
        nom: profile.nom || "",
        prenom: profile.prenom || "",
        date_naissance: profile.date_naissance || "",
        numero_cni: profile.numero_cni || "",
        // Personne morale
        raison_sociale: profile.raison_sociale || "",
        forme_juridique: profile.forme_juridique || "",
        numero_rccm: profile.numero_rccm || "",
        numero_impot: profile.numero_impot || "",
        numero_id_nat: profile.numero_id_nat || "",
        representant_legal_nom: profile.representant_legal_nom || "",
        representant_legal_prenom: profile.representant_legal_prenom || "",
        representant_legal_fonction: profile.representant_legal_fonction || "",
        adresse_siege: profile.adresse_siege || "",
        ville_siege: profile.ville_siege || "",
        pays_siege: profile.pays_siege || "RDC",
      });
    }
    setIsEditing(false);
  };

  const handleUploadDocument = async (type: 'id' | 'qualification') => {
    if (!user || !profile) return;

    const file = type === 'id' ? newIdDocument : newQualificationDoc;
    if (!file) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }

    // Validation
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Le fichier ne doit pas dépasser 5 MB");
      return;
    }

    try {
      setUploadingDocument(true);

      const docType = type === 'id' ? 'cni' : 'autre';
      const up = await uploadApi.uploadDocument(file, docType, String(user.id));
      const docUrl = storageUrlFromUpload(up);

      const updateField = type === 'id' ? 'piece_identite' : 'document_rccm';
      await prestatairesApi.update(String(profile.id), { [updateField]: docUrl });

      toast.success("Document mis à jour avec succès");
      
      // Réinitialiser et recharger
      if (type === 'id') {
        setNewIdDocument(null);
      } else {
        setNewQualificationDoc(null);
      }
      
      await fetchProfile(true);
    } catch (error: any) {
      console.error("Erreur lors de l'upload:", error);
      toast.error("Erreur lors de la mise à jour du document");
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDeleteDocument = async (type: 'id' | 'qualification') => {
    if (!profile) return;

    if (!confirm(`Êtes-vous sûr de vouloir supprimer ce document ?`)) {
      return;
    }

    try {
      setUploadingDocument(true);

      const updateField = type === 'id' ? 'piece_identite' : 'document_rccm';
      await prestatairesApi.update(String(profile.id), { [updateField]: null });

      toast.success("Document supprimé avec succès");
      await fetchProfile(true);
    } catch (error: any) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression du document");
    } finally {
      setUploadingDocument(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validation
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La photo ne doit pas dépasser 5 MB");
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    try {
      setUploadingPhoto(true);

      const up = await uploadApi.uploadProfilePhoto(file);
      const photoUrl = up.url ?? up.path ?? '';

      await prestatairesApi.update(String(profile.id), { photo: photoUrl, photo_url: photoUrl });

      toast.success("Photo de profil mise à jour avec succès");
      fetchProfile();
    } catch (error: any) {
      console.error("Erreur lors de l'upload:", error);
      toast.error("Erreur lors de la mise à jour de la photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  if (loading) {
    return (
      <PrestatairePageShell embedded={embedded} 
        userName="Prestataire" 
        userRole="Prestataire"
        isVerified={false}
        isProfileComplete={false}
      >
        <ProfilePageSkeleton />
      </PrestatairePageShell>
    );
  }

  if (!profile) {
    return (
      <PrestatairePageShell embedded={embedded} 
        userName="Prestataire" 
        userRole="Prestataire"
        isVerified={false}
        isProfileComplete={false}
      >
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
              <Shield className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Profil prestataire non trouvé</h3>
              <p className="text-muted-foreground mb-4">
                Aucun profil prestataire n'est associé à ce compte.
              </p>
              <p className="text-sm text-muted-foreground">
                Assurez-vous d'être connecté avec un compte prestataire valide.
              </p>
            </div>
            <Button variant="outline" onClick={() => window.location.href = '/login'}>
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </PrestatairePageShell>
    );
  }

  // Si le profil n'est pas complet, afficher le wizard de complétion
  if (profile && !profile.profile_completed) {
    return (
      <PrestatairePageShell embedded={embedded} 
        userName={profile.full_name} 
        userRole={profile.profession}
        isVerified={profile.verified}
        isProfileComplete={false}
      >
        <div className="max-w-5xl mx-auto py-6">
          <ProfileCompletionSteps
            onComplete={() => {
              portfolioLoadedForRef.current = null;
              void fetchProfile();
            }}
          />
        </div>
      </PrestatairePageShell>
    );
  }

  return (
    <PrestatairePageShell embedded={embedded} 
      userName={profile.full_name} 
      userRole={profile.profession}
      isVerified={profile.verified}
      isProfileComplete={profile.profile_completed}
    >
      <div className="space-y-4 md:space-y-6 p-3 md:p-0">
        {/* Profile header - Mobile Optimized */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col gap-4 md:gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="relative shrink-0">
                  <Avatar className="w-24 h-24 md:w-32 md:h-32">
                    <AvatarImage src={(profile as any).photo_url || ""} />
                    <AvatarFallback className="text-xl md:text-3xl">{getInitials(profile.full_name)}</AvatarFallback>
                  </Avatar>
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                  />
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="absolute bottom-0 right-0 rounded-full w-8 h-8 md:w-10 md:h-10"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    disabled={uploadingPhoto}
                    title="Changer la photo de profil"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                    ) : (
                      <Camera className="w-3 h-3 md:w-4 md:h-4" />
                    )}
                  </Button>
                </div>
                
                <div className="flex-1 space-y-3 md:space-y-4 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                        <h1 className="text-lg md:text-2xl font-display font-bold truncate">{profile.full_name}</h1>
                        <PrestataireVerificationBadge
                          status={getPrestataireValidationStatus(profile as unknown as Record<string, unknown>)}
                          size="lg"
                        />
                      </div>
                      <p className="text-sm md:text-base text-muted-foreground truncate">{profile.profession}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
                      {isEditing ? (
                        <>
                          <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving} className="text-xs">
                            <X className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                            Annuler
                          </Button>
                          <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs">
                            {saving ? (
                              <Loader2 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 animate-spin" />
                            ) : (
                              <Save className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                            )}
                            Enregistrer
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="outline" size="sm" className="text-xs">
                            <Share2 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                            <span className="hidden sm:inline">Partager</span>
                          </Button>
                          <Button size="sm" onClick={() => setIsEditing(true)} className="text-xs">
                            <Edit className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                            Modifier
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap justify-center sm:justify-start gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                      <span className="truncate">{profile.city || "Non renseigné"}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                      <span className="truncate">{(profile as any).telephone || profile.phone || "Non renseigné"}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                      <span className="truncate">{profile.email}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                      <span className="truncate">Membre depuis {new Date(profile.created_at).toLocaleDateString("fr-FR", { year: "numeric", month: "short" })}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 fill-yellow-500" />
                        <span className="text-lg md:text-2xl font-bold">{stats.rating || "-"}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Note moyenne</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg md:text-2xl font-bold">{stats.missionsCompleted}</p>
                      <p className="text-xs text-muted-foreground">Missions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg md:text-2xl font-bold">{stats.satisfactionRate}%</p>
                      <p className="text-xs text-muted-foreground">Satisfaction</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg md:text-2xl font-bold">{profile.experience_years || 0} ans</p>
                      <p className="text-xs text-muted-foreground">Expérience</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={profileTab} onValueChange={handleProfileTabChange} className="space-y-3 md:space-y-4">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 text-xs md:text-sm">
            <TabsTrigger value="about" className="text-xs md:text-sm">À propos</TabsTrigger>
            <TabsTrigger value="services" className="text-xs md:text-sm">Services ({services.length})</TabsTrigger>
            <TabsTrigger value="portfolio" className="text-xs md:text-sm">Portfolio ({portfolio.length})</TabsTrigger>
            <TabsTrigger value="info" className="text-xs md:text-sm">Infos</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs md:text-sm">Docs</TabsTrigger>
            <TabsTrigger value="reviews" className="text-xs md:text-sm">Avis ({stats.reviewsCount})</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Décrivez votre expérience, vos compétences et ce qui vous distingue..."
                    className="min-h-[120px]"
                  />
                ) : (
                  <p className="text-muted-foreground whitespace-pre-line">
                    {profile.bio || "Aucune description pour le moment."}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Statut de disponibilité
                </CardTitle>
                <CardDescription>
                  Activez ou désactivez votre disponibilité pour recevoir de nouvelles demandes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${(profile as any).disponible ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <div>
                      <p className="font-medium">
                        {(profile as any).disponible ? 'Vous êtes disponible' : 'Vous êtes indisponible'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(profile as any).disponible 
                          ? 'Les clients peuvent vous contacter et vous envoyer des demandes'
                          : 'Vous ne recevrez pas de nouvelles demandes'}
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={(profile as any).disponible || false}
                    onCheckedChange={async (checked) => {
                      try {
                        await prestatairesApi.update(String(profile.id), { disponible: checked });

                        toast.success(checked ? "Vous êtes maintenant disponible" : "Vous êtes maintenant indisponible");
                        fetchProfile();
                      } catch (error: any) {
                        console.error("Error updating disponibilite:", error);
                        toast.error("Erreur lors de la mise à jour");
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Disponibilité</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Select value={formData.availability} onValueChange={(value) => setFormData({ ...formData, availability: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disponible">Disponible</SelectItem>
                      <SelectItem value="occupe">Occupé</SelectItem>
                      <SelectItem value="indisponible">Indisponible</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={
                    profile.availability === 'disponible' ? 'default' :
                    profile.availability === 'occupe' ? 'secondary' : 'outline'
                  }>
                    {profile.availability === 'disponible' ? 'Disponible' :
                     profile.availability === 'occupe' ? 'Occupé' : 'Indisponible'}
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Horaires de travail */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Horaires de travail
                </CardTitle>
                <CardDescription>
                  Vos heures de disponibilité par jour
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingHoraires ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : horaires.length > 0 ? (
                  <div className="space-y-2">
                    {horaires.map((horaire) => (
                      <div 
                        key={horaire.jour_semaine} 
                        className="flex items-center justify-between py-2 px-3 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${horaire.actif ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="font-medium text-sm">{joursMap[horaire.jour_semaine]}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {horaire.actif ? (
                            <span>{horaire.heure_debut} - {horaire.heure_fin}</span>
                          ) : (
                            <span className="italic">Fermé</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun horaire défini. Allez dans Paramètres pour configurer vos horaires.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Mes services</CardTitle>
                <Dialog open={showAddService} onOpenChange={setShowAddService}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter un service
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ajouter un nouveau service</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-service">Service *</Label>
                        <Select value={newService.service} onValueChange={(value) => setNewService({ ...newService, service: value })}>
                          <SelectTrigger id="new-service">
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            {professions.filter(p => !services.some(s => s.service === p)).map((prof) => (
                              <SelectItem key={prof} value={prof}>{prof}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-niveau">Niveau de compétence</Label>
                        <Select value={newService.niveau} onValueChange={(value) => setNewService({ ...newService, niveau: value })}>
                          <SelectTrigger id="new-niveau">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="debutant">Débutant</SelectItem>
                            <SelectItem value="intermediaire">Intermédiaire</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-experience">Années d'expérience</Label>
                        <Input
                          id="new-experience"
                          type="number"
                          value={newService.experience}
                          onChange={(e) => setNewService({ ...newService, experience: parseInt(e.target.value) || 0 })}
                          min="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-tarif">Tarif horaire (FC) - optionnel</Label>
                        <Input
                          id="new-tarif"
                          type="number"
                          value={newService.tarif}
                          onChange={(e) => setNewService({ ...newService, tarif: parseInt(e.target.value) || 0 })}
                          min="0"
                        />
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button variant="outline" onClick={() => setShowAddService(false)} className="flex-1">
                          Annuler
                        </Button>
                        <Button onClick={handleAddService} className="flex-1">
                          Ajouter
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {services.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun service ajouté</p>
                    <p className="text-sm mt-1">Ajoutez vos services pour recevoir plus d'opportunités</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className={`p-4 border rounded-lg ${
                          service.principal ? 'border-secondary bg-secondary/5' : 'border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{service.service}</h4>
                              {service.principal && (
                                <Badge variant="default" className="text-xs">
                                  Principal
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {service.niveau_competence === 'debutant' ? 'Débutant' :
                                 service.niveau_competence === 'intermediaire' ? 'Intermédiaire' : 'Expert'}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span>{service.annees_experience} ans d'expérience</span>
                              {service.tarif_horaire && (
                                <span>{service.tarif_horaire.toLocaleString()} FC/h</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!service.principal && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSetPrincipal(service.id, service.service)}
                                title="Définir comme service principal"
                              >
                                <Star className="w-4 h-4" />
                              </Button>
                            )}
                            {!service.principal && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteService(service.id)}
                                title="Supprimer ce service"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    💡 <strong>Astuce:</strong> Ajoutez plusieurs services pour recevoir plus d'opportunités. Votre service principal apparaîtra en premier sur votre profil.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Mes réalisations</CardTitle>
                  <CardDescription>
                    Montrez vos meilleurs travaux pour inspirer confiance aux clients
                  </CardDescription>
                </div>
                <Dialog open={showAddPortfolio} onOpenChange={setShowAddPortfolio}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter une réalisation
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Ajouter une réalisation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="portfolio-titre">Titre *</Label>
                        <Input
                          id="portfolio-titre"
                          value={newPortfolio.titre}
                          onChange={(e) => setNewPortfolio({ ...newPortfolio, titre: e.target.value })}
                          placeholder="Ex: Rénovation complète d'une cuisine"
                          maxLength={100}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="portfolio-description">Description</Label>
                        <Textarea
                          id="portfolio-description"
                          value={newPortfolio.description}
                          onChange={(e) => setNewPortfolio({ ...newPortfolio, description: e.target.value })}
                          placeholder="Décrivez votre réalisation, les défis rencontrés, les techniques utilisées..."
                          className="min-h-[100px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="portfolio-date">Date de réalisation</Label>
                        <Input
                          id="portfolio-date"
                          type="date"
                          value={newPortfolio.date_realisation}
                          onChange={(e) => setNewPortfolio({ ...newPortfolio, date_realisation: e.target.value })}
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="portfolio-images">Images * (1-5 images, max 2MB chacune)</Label>
                        <Input
                          id="portfolio-images"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length > 5) {
                              toast.error("Maximum 5 images");
                              e.target.value = "";
                              return;
                            }
                            const oversized = files.find(f => f.size > 2 * 1024 * 1024);
                            if (oversized) {
                              toast.error("Chaque image ne doit pas dépasser 2 MB");
                              e.target.value = "";
                              return;
                            }
                            setPortfolioImages(files);
                          }}
                          disabled={uploadingPortfolio}
                        />
                        {portfolioImages.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mt-3">
                            {portfolioImages.map((file, idx) => (
                              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Preview ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                                  {(file.size / 1024).toFixed(0)} KB
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowAddPortfolio(false);
                            setNewPortfolio({
                              titre: "",
                              description: "",
                              date_realisation: new Date().toISOString().split('T')[0]
                            });
                            setPortfolioImages([]);
                          }} 
                          className="flex-1"
                          disabled={uploadingPortfolio}
                        >
                          Annuler
                        </Button>
                        <Button 
                          onClick={handleAddPortfolio} 
                          className="flex-1"
                          disabled={uploadingPortfolio}
                        >
                          {uploadingPortfolio ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Upload...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Ajouter
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingPortfolio ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : portfolio.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium mb-1">Aucune réalisation pour le moment</p>
                    <p className="text-sm mb-4">
                      Ajoutez vos meilleures réalisations pour montrer votre expertise
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowAddPortfolio(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter ma première réalisation
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {portfolio.map((item) => (
                      <div
                        key={item.id}
                        className="group relative border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setSelectedPortfolio(item)}
                      >
                        {/* Image principale */}
                        <div className="aspect-video bg-muted relative overflow-hidden">
                          {item.images && item.images.length > 0 ? (
                            <img
                              src={item.images[0]}
                              alt={item.titre}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Camera className="w-12 h-12 text-muted-foreground" />
                            </div>
                          )}
                          {/* Badge nombre d'images */}
                          {item.images && item.images.length > 1 && (
                            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                              <Camera className="w-3 h-3" />
                              {item.images.length}
                            </div>
                          )}
                        </div>

                        {/* Infos */}
                        <div className="p-3">
                          <h4 className="font-semibold text-sm mb-1 line-clamp-1">{item.titre}</h4>
                          {item.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(item.date_realisation).toLocaleDateString('fr-FR', { 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {item.categorie}
                            </Badge>
                          </div>
                        </div>

                        {/* Bouton supprimer */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 left-2 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePortfolio(item.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Info box */}
                {portfolio.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      💡 <strong>Astuce:</strong> Les prestataires avec un portfolio complet reçoivent 3x plus de demandes. Ajoutez des photos de qualité et des descriptions détaillées.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Modal de détails */}
            <Dialog open={!!selectedPortfolio} onOpenChange={(open) => !open && setSelectedPortfolio(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                {selectedPortfolio && (
                  <>
                    <DialogHeader>
                      <DialogTitle>{selectedPortfolio.titre}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      {/* Carousel d'images */}
                      {selectedPortfolio.images && selectedPortfolio.images.length > 0 && (
                        <div className="space-y-2">
                          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                            <img
                              src={selectedPortfolio.images[0]}
                              alt={selectedPortfolio.titre}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          {selectedPortfolio.images.length > 1 && (
                            <div className="grid grid-cols-4 gap-2">
                              {selectedPortfolio.images.slice(1).map((img, idx) => (
                                <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-80">
                                  <img
                                    src={img}
                                    alt={`${selectedPortfolio.titre} ${idx + 2}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Description */}
                      {selectedPortfolio.description && (
                        <div>
                          <h4 className="font-semibold mb-2">Description</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-line">
                            {selectedPortfolio.description}
                          </p>
                        </div>
                      )}

                      {/* Métadonnées */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {new Date(selectedPortfolio.date_realisation).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <Badge variant="outline">{selectedPortfolio.categorie}</Badge>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setSelectedPortfolio(null)}
                        >
                          Fermer
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            handleDeletePortfolio(selectedPortfolio.id);
                            setSelectedPortfolio(null);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="info" className="space-y-6">
            {/* Type de prestataire */}
            {profile.type_prestataire && (
              <Card>
                <CardHeader>
                  <CardTitle>Type de prestataire</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <span className="text-3xl">
                      {profile.type_prestataire === 'physique' ? '👤' : '🏢'}
                    </span>
                    <div>
                      <p className="font-semibold">
                        {profile.type_prestataire === 'physique' 
                          ? 'Personne Physique (Individu)' 
                          : 'Personne Morale (Entreprise)'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {profile.type_prestataire === 'physique'
                          ? 'Vous êtes inscrit en tant qu\'individu'
                          : 'Vous êtes inscrit en tant qu\'entreprise'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informations selon le type */}
            {profile.type_prestataire === 'physique' && (
              <Card>
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prenom">Prénom</Label>
                      {isEditing ? (
                        <Input
                          id="prenom"
                          value={formData.prenom}
                          onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                          placeholder="Prénom"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">{profile.prenom || "Non renseigné"}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nom">Nom</Label>
                      {isEditing ? (
                        <Input
                          id="nom"
                          value={formData.nom}
                          onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                          placeholder="Nom"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">{profile.nom || "Non renseigné"}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="date_naissance">Date de naissance</Label>
                      {isEditing ? (
                        <Input
                          id="date_naissance"
                          type="date"
                          value={formData.date_naissance}
                          onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {profile.date_naissance 
                            ? new Date(profile.date_naissance).toLocaleDateString('fr-FR')
                            : "Non renseigné"}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="numero_cni">Numéro CNI / Passeport</Label>
                      {isEditing ? (
                        <Input
                          id="numero_cni"
                          value={formData.numero_cni}
                          onChange={(e) => setFormData({ ...formData, numero_cni: e.target.value })}
                          placeholder="Numéro CNI"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">{profile.numero_cni || "Non renseigné"}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {profile.type_prestataire === 'morale' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Informations de l'entreprise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="raison_sociale">Raison sociale</Label>
                        {isEditing ? (
                          <Input
                            id="raison_sociale"
                            value={formData.raison_sociale}
                            onChange={(e) => setFormData({ ...formData, raison_sociale: e.target.value })}
                            placeholder="Raison sociale"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{profile.raison_sociale || "Non renseigné"}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="forme_juridique">Forme juridique</Label>
                        {isEditing ? (
                          <Select value={formData.forme_juridique} onValueChange={(value) => setFormData({ ...formData, forme_juridique: value })}>
                            <SelectTrigger id="forme_juridique">
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SARL">SARL</SelectItem>
                              <SelectItem value="SA">SA</SelectItem>
                              <SelectItem value="SUARL">SUARL</SelectItem>
                              <SelectItem value="SNC">SNC</SelectItem>
                              <SelectItem value="Entreprise Individuelle">Entreprise Individuelle</SelectItem>
                              <SelectItem value="Autre">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm text-muted-foreground">{profile.forme_juridique || "Non renseigné"}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="numero_rccm">Numéro RCCM</Label>
                        {isEditing ? (
                          <Input
                            id="numero_rccm"
                            value={formData.numero_rccm}
                            onChange={(e) => setFormData({ ...formData, numero_rccm: e.target.value })}
                            placeholder="CD/KIN/RCCM/..."
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{profile.numero_rccm || "Non renseigné"}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="numero_impot">Numéro fiscal</Label>
                        {isEditing ? (
                          <Input
                            id="numero_impot"
                            value={formData.numero_impot}
                            onChange={(e) => setFormData({ ...formData, numero_impot: e.target.value })}
                            placeholder="A1234567Z"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{profile.numero_impot || "Non renseigné"}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="numero_id_nat">Numéro ID Nationale</Label>
                        {isEditing ? (
                          <Input
                            id="numero_id_nat"
                            value={formData.numero_id_nat}
                            onChange={(e) => setFormData({ ...formData, numero_id_nat: e.target.value })}
                            placeholder="ID-NAT-123456"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{profile.numero_id_nat || "Non renseigné"}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Représentant légal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="representant_legal_nom">Nom</Label>
                        {isEditing ? (
                          <Input
                            id="representant_legal_nom"
                            value={formData.representant_legal_nom}
                            onChange={(e) => setFormData({ ...formData, representant_legal_nom: e.target.value })}
                            placeholder="Nom du représentant"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{profile.representant_legal_nom || "Non renseigné"}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="representant_legal_prenom">Prénom</Label>
                        {isEditing ? (
                          <Input
                            id="representant_legal_prenom"
                            value={formData.representant_legal_prenom}
                            onChange={(e) => setFormData({ ...formData, representant_legal_prenom: e.target.value })}
                            placeholder="Prénom du représentant"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{profile.representant_legal_prenom || "Non renseigné"}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="representant_legal_fonction">Fonction</Label>
                        {isEditing ? (
                          <Input
                            id="representant_legal_fonction"
                            value={formData.representant_legal_fonction}
                            onChange={(e) => setFormData({ ...formData, representant_legal_fonction: e.target.value })}
                            placeholder="Gérant, PDG, etc."
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{profile.representant_legal_fonction || "Non renseigné"}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Siège social</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="adresse_siege">Adresse</Label>
                        {isEditing ? (
                          <Input
                            id="adresse_siege"
                            value={formData.adresse_siege}
                            onChange={(e) => setFormData({ ...formData, adresse_siege: e.target.value })}
                            placeholder="123 Avenue..."
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{profile.adresse_siege || "Non renseigné"}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="ville_siege">Ville</Label>
                        {isEditing ? (
                          <Input
                            id="ville_siege"
                            value={formData.ville_siege}
                            onChange={(e) => setFormData({ ...formData, ville_siege: e.target.value })}
                            placeholder="Kinshasa"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{profile.ville_siege || "Non renseigné"}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="pays_siege">Pays</Label>
                        {isEditing ? (
                          <Input
                            id="pays_siege"
                            value={formData.pays_siege}
                            onChange={(e) => setFormData({ ...formData, pays_siege: e.target.value })}
                            placeholder="RDC"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">{profile.pays_siege || "RDC"}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Informations professionnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nom complet *</Label>
                    {isEditing ? (
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Votre nom complet"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{profile.full_name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profession">Profession *</Label>
                    {isEditing ? (
                      <Select value={formData.profession} onValueChange={(value) => setFormData({ ...formData, profession: value })}>
                        <SelectTrigger id="profession">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {professions.map((prof) => (
                            <SelectItem key={prof} value={prof}>{prof}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-muted-foreground">{profile.profession}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone *</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+243 XXX XXX XXX"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{(profile as any).telephone || profile.phone || "Non renseigné"}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@example.com"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Commune</Label>
                    {isEditing ? (
                      <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
                        <SelectTrigger id="city">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {communes.map((commune) => (
                            <SelectItem key={commune} value={commune}>{commune}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-muted-foreground">{profile.city || "Non renseigné"}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse</Label>
                    {isEditing ? (
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Votre adresse"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{profile.address || "Non renseigné"}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience_years">Années d'expérience</Label>
                    {isEditing ? (
                      <Input
                        id="experience_years"
                        type="number"
                        value={formData.experience_years}
                        onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                        min="0"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{profile.experience_years || 0} ans</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate">Tarif horaire (FC)</Label>
                    {isEditing ? (
                      <Input
                        id="hourly_rate"
                        type="number"
                        value={formData.hourly_rate}
                        onChange={(e) => setFormData({ ...formData, hourly_rate: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                        min="0"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {profile.hourly_rate ? `${profile.hourly_rate.toLocaleString()} FC/h` : "Non renseigné"}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Mes documents</CardTitle>
                <CardDescription>
                  Gérez vos documents professionnels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Document d'identité */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium flex items-center gap-2">
                        📄 Document d'identité (CNI / Passeport)
                      </p>
                      {profile.id_document_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument('id')}
                          disabled={uploadingDocument}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    {profile.id_document_url ? (
                      <div className="space-y-3">
                        {profile.id_document_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img
                            src={profile.id_document_url}
                            alt="Document d'identité"
                            className="w-full h-auto rounded border border-border max-h-96 object-contain bg-white"
                          />
                        ) : (
                          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                            <FileText className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-2">Document PDF</p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <a
                            href={profile.id_document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-secondary hover:underline inline-flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            Télécharger
                          </a>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mb-3">Aucun document uploadé</p>
                    )}

                    {/* Formulaire de remplacement */}
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <Label htmlFor="new-id-doc" className="text-sm">
                        {profile.id_document_url ? "Remplacer le document" : "Ajouter un document"}
                      </Label>
                      <Input
                        id="new-id-doc"
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error("Le fichier ne doit pas dépasser 5 MB");
                              e.target.value = "";
                              return;
                            }
                            setNewIdDocument(file);
                          }
                        }}
                        disabled={uploadingDocument}
                      />
                      {newIdDocument && (
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground flex-1">
                            {newIdDocument.name} ({(newIdDocument.size / 1024).toFixed(0)} KB)
                          </p>
                          <Button
                            size="sm"
                            onClick={() => handleUploadDocument('id')}
                            disabled={uploadingDocument}
                          >
                            {uploadingDocument ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Upload...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Enregistrer
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setNewIdDocument(null);
                              const input = document.getElementById('new-id-doc') as HTMLInputElement;
                              if (input) input.value = "";
                            }}
                            disabled={uploadingDocument}
                          >
                            Annuler
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Document de qualification */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium flex items-center gap-2">
                        🎓 Document de qualification
                      </p>
                      {profile.qualification_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument('qualification')}
                          disabled={uploadingDocument}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    {profile.qualification_url ? (
                      <div className="space-y-3">
                        {profile.qualification_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img
                            src={profile.qualification_url}
                            alt="Document de qualification"
                            className="w-full h-auto rounded border border-border max-h-96 object-contain bg-white"
                          />
                        ) : (
                          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                            <FileText className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-2">Document PDF</p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <a
                            href={profile.qualification_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-secondary hover:underline inline-flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            Télécharger
                          </a>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mb-3">Aucun document uploadé</p>
                    )}

                    {/* Formulaire de remplacement */}
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <Label htmlFor="new-qual-doc" className="text-sm">
                        {profile.qualification_url ? "Remplacer le document" : "Ajouter un document"}
                      </Label>
                      <Input
                        id="new-qual-doc"
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error("Le fichier ne doit pas dépasser 5 MB");
                              e.target.value = "";
                              return;
                            }
                            setNewQualificationDoc(file);
                          }
                        }}
                        disabled={uploadingDocument}
                      />
                      {newQualificationDoc && (
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground flex-1">
                            {newQualificationDoc.name} ({(newQualificationDoc.size / 1024).toFixed(0)} KB)
                          </p>
                          <Button
                            size="sm"
                            onClick={() => handleUploadDocument('qualification')}
                            disabled={uploadingDocument}
                          >
                            {uploadingDocument ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Upload...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Enregistrer
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setNewQualificationDoc(null);
                              const input = document.getElementById('new-qual-doc') as HTMLInputElement;
                              if (input) input.value = "";
                            }}
                            disabled={uploadingDocument}
                          >
                            Annuler
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      ℹ️ Formats acceptés : JPG, PNG, PDF • Taille max : 5 MB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Avis clients</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingReviews ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun avis pour le moment</p>
                    <p className="text-sm mt-1">Les avis de vos clients apparaîtront ici</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="p-4 border border-border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                C
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">Client</h4>
                              <p className="text-xs text-muted-foreground">
                                Mission
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(review.created_at)}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.commentaire}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PrestatairePageShell>
  );
}
