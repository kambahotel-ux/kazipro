import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  Lock, 
  CreditCard, 
  Calendar, 
  Globe, 
  Smartphone,
  Mail,
  MessageSquare,
  Shield,
  Eye,
  EyeOff,
  Trash2,
  Save,
  AlertCircle,
  Building2,
  Upload,
  Loader
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { ConfigPaiementTab } from "@/components/prestataire/ConfigPaiementTab";

interface EntrepriseInfo {
  nom_entreprise: string;
  logo_url: string;
  signature_url: string;
  adresse: string;
  ville: string;
  telephone: string;
  email_professionnel: string;
  numero_fiscal: string;
  conditions_generales: string;
}

interface ProviderProfile {
  id: string;
  disponible: boolean;
  verified: boolean;
  profile_completed: boolean;
}

interface Horaire {
  id?: string;
  jour_semaine: string;
  actif: boolean;
  heure_debut: string;
  heure_fin: string;
}

interface Settings {
  notif_nouvelles_missions: boolean;
  notif_messages_clients: boolean;
  notif_maj_missions: boolean;
  notif_rappels_rdv: boolean;
  notif_promotions: boolean;
  email_resume_hebdo: boolean;
  email_nouvelles_missions: boolean;
  email_paiements: boolean;
  sms_missions_urgentes: boolean;
  sms_codes_verification: boolean;
  langue: string;
  fuseau_horaire: string;
  mode_vacances: boolean;
  accepter_urgences: boolean;
}

export default function ParametresPage() {
  const { user } = useAuth();
  const [providerName, setProviderName] = useState("Prestataire");
  const [providerId, setProviderId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [updatingDisponibilite, setUpdatingDisponibilite] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState<Settings>({
    notif_nouvelles_missions: true,
    notif_messages_clients: true,
    notif_maj_missions: true,
    notif_rappels_rdv: false,
    notif_promotions: false,
    email_resume_hebdo: true,
    email_nouvelles_missions: false,
    email_paiements: true,
    sms_missions_urgentes: true,
    sms_codes_verification: true,
    langue: 'fr',
    fuseau_horaire: 'Africa/Kinshasa',
    mode_vacances: false,
    accepter_urgences: true
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Company info state
  const [entrepriseInfo, setEntrepriseInfo] = useState<EntrepriseInfo>({
    nom_entreprise: "",
    logo_url: "",
    signature_url: "",
    adresse: "",
    ville: "",
    telephone: "",
    email_professionnel: "",
    numero_fiscal: "",
    conditions_generales: ""
  });
  const [loadingCompanyInfo, setLoadingCompanyInfo] = useState(false);
  const [savingCompanyInfo, setSavingCompanyInfo] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  
  // Horaires state
  const [horaires, setHoraires] = useState<Horaire[]>([]);
  const [loadingHoraires, setLoadingHoraires] = useState(false);

  const joursMap: Record<string, string> = {
    'lundi': 'Lundi',
    'mardi': 'Mardi',
    'mercredi': 'Mercredi',
    'jeudi': 'Jeudi',
    'vendredi': 'Vendredi',
    'samedi': 'Samedi',
    'dimanche': 'Dimanche'
  };

  useEffect(() => {
    if (user) {
      fetchProviderName();
      fetchEntrepriseInfo();
      fetchHoraires();
    }
  }, [user]);

  useEffect(() => {
    if (user && providerId) {
      fetchSettings();
    }
  }, [user, providerId]);

  const fetchProviderName = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("prestataires")
        .select("id, full_name, disponible, verified, profile_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setProviderName(data.full_name || "Prestataire");
        setProviderId(data.id);
        setProfile({ 
          id: data.id, 
          disponible: data.disponible || false,
          verified: data.verified || false,
          profile_completed: data.profile_completed || false
        });
      }
    } catch (error) {
      console.error("Error fetching provider name:", error);
    }
  };

  const fetchEntrepriseInfo = async () => {
    if (!user) return;
    
    try {
      setLoadingCompanyInfo(true);
      
      // Get prestataire data with all fields
      const { data: prestataireData } = await supabase
        .from("prestataires")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!prestataireData) return;

      // Fetch entreprise info
      const { data, error } = await supabase
        .from("entreprise_info")
        .select("*")
        .eq("prestataire_id", prestataireData.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      // Pre-fill with profile data if entreprise_info doesn't exist
      if (data) {
        setEntrepriseInfo({
          nom_entreprise: data.nom_entreprise || "",
          logo_url: data.logo_url || "",
          signature_url: data.signature_url || "",
          adresse: data.adresse || "",
          ville: data.ville || "",
          telephone: data.telephone || "",
          email_professionnel: data.email_professionnel || "",
          numero_fiscal: data.numero_fiscal || "",
          conditions_generales: data.conditions_generales || ""
        });
      } else {
        // Pre-fill from prestataire profile (for personne morale)
        setEntrepriseInfo({
          nom_entreprise: prestataireData.raison_sociale || prestataireData.full_name || "",
          logo_url: "",
          signature_url: "",
          adresse: prestataireData.adresse_siege || prestataireData.address || "",
          ville: prestataireData.ville_siege || prestataireData.city || "",
          telephone: (prestataireData as any).telephone || prestataireData.phone || "",
          email_professionnel: prestataireData.email || "",
          numero_fiscal: prestataireData.numero_rccm || prestataireData.numero_impot || prestataireData.numero_id_nat || "",
          conditions_generales: ""
        });
      }
    } catch (error: any) {
      console.error("Error fetching entreprise info:", error);
      toast.error("Erreur lors du chargement des informations");
    } finally {
      setLoadingCompanyInfo(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !providerId) return;

    try {
      setUploadingLogo(true);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${providerId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      // Update local state
      setEntrepriseInfo(prev => ({ ...prev, logo_url: publicUrl }));

      // Save to database
      const { error: updateError } = await supabase
        .from('entreprise_info')
        .upsert({
          prestataire_id: providerId,
          logo_url: publicUrl,
          nom_entreprise: entrepriseInfo.nom_entreprise,
          adresse: entrepriseInfo.adresse,
          ville: entrepriseInfo.ville,
          telephone: entrepriseInfo.telephone,
          email_professionnel: entrepriseInfo.email_professionnel,
          numero_fiscal: entrepriseInfo.numero_fiscal,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'prestataire_id'
        });

      if (updateError) throw updateError;

      toast.success("Logo téléchargé avec succès");
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast.error("Erreur lors du téléchargement du logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !providerId) return;

    try {
      setUploadingSignature(true);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `signature-${providerId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('signatures')
        .getPublicUrl(filePath);

      // Update local state
      setEntrepriseInfo(prev => ({ ...prev, signature_url: publicUrl }));

      // Save to database
      const { error: updateError } = await supabase
        .from('entreprise_info')
        .upsert({
          prestataire_id: providerId,
          signature_url: publicUrl,
          nom_entreprise: entrepriseInfo.nom_entreprise,
          adresse: entrepriseInfo.adresse,
          ville: entrepriseInfo.ville,
          telephone: entrepriseInfo.telephone,
          email_professionnel: entrepriseInfo.email_professionnel,
          numero_fiscal: entrepriseInfo.numero_fiscal,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'prestataire_id'
        });

      if (updateError) throw updateError;

      toast.success("Signature téléchargée avec succès");
    } catch (error: any) {
      console.error("Error uploading signature:", error);
      toast.error("Erreur lors du téléchargement de la signature");
    } finally {
      setUploadingSignature(false);
    }
  };

  const handleSaveCompanyInfo = async () => {
    if (!providerId) {
      toast.error("Erreur: ID prestataire non trouvé");
      return;
    }

    try {
      setSavingCompanyInfo(true);

      // Check if record exists
      const { data: existing } = await supabase
        .from("entreprise_info")
        .select("id")
        .eq("prestataire_id", providerId)
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from("entreprise_info")
          .update(entrepriseInfo)
          .eq("prestataire_id", providerId);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from("entreprise_info")
          .insert({
            prestataire_id: providerId,
            ...entrepriseInfo
          });

        if (error) throw error;
      }

      toast.success("Informations enregistrées avec succès");
    } catch (error: any) {
      console.error("Error saving company info:", error);
      toast.error(error.message || "Erreur lors de l'enregistrement");
    } finally {
      setSavingCompanyInfo(false);
    }
  };

  const handleToggleDisponibilite = async (checked: boolean) => {
    if (!providerId) return;

    try {
      setUpdatingDisponibilite(true);

      const { error } = await supabase
        .from("prestataires")
        .update({ disponible: checked })
        .eq("id", providerId);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, disponible: checked } : null);
      toast.success(checked ? "Vous êtes maintenant disponible" : "Vous êtes maintenant indisponible");
    } catch (error: any) {
      console.error("Error updating disponibilite:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setUpdatingDisponibilite(false);
    }
  };

  const fetchHoraires = async () => {
    if (!user) return;

    try {
      setLoadingHoraires(true);

      // Get prestataire ID
      const { data: prestataireData } = await supabase
        .from("prestataires")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!prestataireData) return;

      // Fetch horaires
      const { data, error } = await supabase
        .from("horaires_travail")
        .select("*")
        .eq("prestataire_id", prestataireData.id)
        .order("jour_semaine");

      if (error) throw error;

      // Si pas d'horaires, initialiser avec les valeurs par défaut
      if (!data || data.length === 0) {
        await initDefaultHoraires(prestataireData.id);
        await fetchHoraires(); // Recharger après initialisation
        return;
      }

      // Normaliser le format des heures (enlever les secondes)
      const normalizedData = data.map(h => ({
        ...h,
        heure_debut: h.heure_debut.substring(0, 5), // "08:00:00" -> "08:00"
        heure_fin: h.heure_fin.substring(0, 5)
      }));

      setHoraires(normalizedData);
    } catch (error: any) {
      console.error("Error fetching horaires:", error);
      toast.error("Erreur lors du chargement des horaires");
    } finally {
      setLoadingHoraires(false);
    }
  };

  const initDefaultHoraires = async (prestataireId: string) => {
    const defaultHoraires = [
      { jour_semaine: 'lundi', actif: true, heure_debut: '08:00', heure_fin: '18:00' },
      { jour_semaine: 'mardi', actif: true, heure_debut: '08:00', heure_fin: '18:00' },
      { jour_semaine: 'mercredi', actif: true, heure_debut: '08:00', heure_fin: '18:00' },
      { jour_semaine: 'jeudi', actif: true, heure_debut: '08:00', heure_fin: '18:00' },
      { jour_semaine: 'vendredi', actif: true, heure_debut: '08:00', heure_fin: '18:00' },
      { jour_semaine: 'samedi', actif: true, heure_debut: '08:00', heure_fin: '18:00' },
      { jour_semaine: 'dimanche', actif: false, heure_debut: '08:00', heure_fin: '18:00' }
    ];

    const horairesWithId = defaultHoraires.map(h => ({
      ...h,
      prestataire_id: prestataireId
    }));

    const { error } = await supabase
      .from("horaires_travail")
      .insert(horairesWithId);

    if (error) throw error;
  };

  const handleUpdateHoraire = async (jour: string, field: 'actif' | 'heure_debut' | 'heure_fin', value: any) => {
    if (!providerId) return;

    try {
      const horaireIndex = horaires.findIndex(h => h.jour_semaine === jour);
      if (horaireIndex === -1) return;

      const updatedHoraire = { ...horaires[horaireIndex], [field]: value };

      // Update in database
      const { error } = await supabase
        .from("horaires_travail")
        .update({ [field]: value })
        .eq("prestataire_id", providerId)
        .eq("jour_semaine", jour);

      if (error) throw error;

      // Update local state
      const newHoraires = [...horaires];
      newHoraires[horaireIndex] = updatedHoraire;
      setHoraires(newHoraires);

      toast.success("Horaire mis à jour");
    } catch (error: any) {
      console.error("Error updating horaire:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const fetchSettings = async () => {
    if (!providerId) return;

    try {
      setLoadingSettings(true);

      const { data, error } = await supabase
        .from("prestataire_settings")
        .select("*")
        .eq("prestataire_id", providerId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setSettings({
          notif_nouvelles_missions: data.notif_nouvelles_missions,
          notif_messages_clients: data.notif_messages_clients,
          notif_maj_missions: data.notif_maj_missions,
          notif_rappels_rdv: data.notif_rappels_rdv,
          notif_promotions: data.notif_promotions,
          email_resume_hebdo: data.email_resume_hebdo,
          email_nouvelles_missions: data.email_nouvelles_missions,
          email_paiements: data.email_paiements,
          sms_missions_urgentes: data.sms_missions_urgentes,
          sms_codes_verification: data.sms_codes_verification,
          langue: data.langue,
          fuseau_horaire: data.fuseau_horaire,
          mode_vacances: data.mode_vacances,
          accepter_urgences: data.accepter_urgences
        });
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleUpdateSetting = async (key: keyof Settings, value: any) => {
    if (!providerId) return;

    try {
      // Update local state immediately
      setSettings(prev => ({ ...prev, [key]: value }));

      // Check if settings exist
      const { data: existing } = await supabase
        .from("prestataire_settings")
        .select("id")
        .eq("prestataire_id", providerId)
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from("prestataire_settings")
          .update({ [key]: value })
          .eq("prestataire_id", providerId);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from("prestataire_settings")
          .insert({
            prestataire_id: providerId,
            [key]: value
          });

        if (error) throw error;
      }

      toast.success("Paramètre mis à jour");
    } catch (error: any) {
      console.error("Error updating setting:", error);
      toast.error("Erreur lors de la mise à jour");
      // Revert local state
      fetchSettings();
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    try {
      setChangingPassword(true);

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("Mot de passe modifié avec succès");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Erreur lors du changement de mot de passe");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!providerId) return;

    try {
      setSavingSettings(true);

      const { data: existing } = await supabase
        .from("prestataire_settings")
        .select("id")
        .eq("prestataire_id", providerId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("prestataire_settings")
          .update({
            langue: settings.langue,
            fuseau_horaire: settings.fuseau_horaire
          })
          .eq("prestataire_id", providerId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("prestataire_settings")
          .insert({
            prestataire_id: providerId,
            langue: settings.langue,
            fuseau_horaire: settings.fuseau_horaire
          });

        if (error) throw error;
      }

      toast.success("Préférences enregistrées");
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <DashboardLayout 
      role="prestataire" 
      userName={providerName} 
      userRole="Prestataire"
      isVerified={profile?.verified || false}
      isProfileComplete={profile?.profile_completed || false}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Paramètres</h1>
          <p className="text-muted-foreground">Gérez vos préférences et paramètres de compte</p>
        </div>

        <Tabs defaultValue="company" className="space-y-4">
          <TabsList className="w-full flex-wrap justify-start gap-1 h-auto p-1">
            <TabsTrigger value="company" className="text-xs sm:text-sm px-2 sm:px-3">Entreprise</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs sm:text-sm px-2 sm:px-3">Notifications</TabsTrigger>
            <TabsTrigger value="security" className="text-xs sm:text-sm px-2 sm:px-3">Sécurité</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs sm:text-sm px-2 sm:px-3">Paiements</TabsTrigger>
            <TabsTrigger value="availability" className="text-xs sm:text-sm px-2 sm:px-3">Disponibilité</TabsTrigger>
            <TabsTrigger value="preferences" className="text-xs sm:text-sm px-2 sm:px-3">Préférences</TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Informations de l'entreprise
                </CardTitle>
                <CardDescription>
                  Ces informations apparaîtront sur vos devis professionnels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingCompanyInfo ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {/* Logo Upload */}
                    <div className="space-y-3">
                      <Label>Logo de l'entreprise</Label>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {entrepriseInfo.logo_url ? (
                          <div className="relative w-24 h-24 border-2 border-border rounded-lg overflow-hidden flex-shrink-0">
                            <img 
                              src={entrepriseInfo.logo_url} 
                              alt="Logo" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted flex-shrink-0">
                            <Building2 className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 w-full sm:w-auto">
                          <input
                            type="file"
                            id="logo-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoUpload}
                            disabled={uploadingLogo}
                          />
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById('logo-upload')?.click()}
                            disabled={uploadingLogo}
                            className="w-full sm:w-auto"
                          >
                            {uploadingLogo ? (
                              <>
                                <Loader className="w-4 h-4 mr-2 animate-spin" />
                                Téléchargement...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Télécharger un logo
                              </>
                            )}
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            PNG, JPG ou JPEG. Max 2MB.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Signature Upload */}
                    <div className="space-y-3">
                      <Label>Signature du prestataire</Label>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {entrepriseInfo.signature_url ? (
                          <div className="relative w-32 h-20 border-2 border-border rounded-lg overflow-hidden bg-white flex-shrink-0">
                            <img 
                              src={entrepriseInfo.signature_url} 
                              alt="Signature" 
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-32 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted flex-shrink-0">
                            <span className="text-xs text-muted-foreground">Signature</span>
                          </div>
                        )}
                        <div className="flex-1 w-full sm:w-auto">
                          <input
                            type="file"
                            id="signature-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={handleSignatureUpload}
                            disabled={uploadingSignature}
                          />
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById('signature-upload')?.click()}
                            disabled={uploadingSignature}
                            className="w-full sm:w-auto"
                          >
                            {uploadingSignature ? (
                              <>
                                <Loader className="w-4 h-4 mr-2 animate-spin" />
                                Téléchargement...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Télécharger une signature
                              </>
                            )}
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            PNG avec fond transparent recommandé. Max 1MB.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Company Name */}
                    <div className="space-y-2">
                      <Label htmlFor="nom_entreprise">Nom de l'entreprise *</Label>
                      <Input
                        id="nom_entreprise"
                        value={entrepriseInfo.nom_entreprise}
                        onChange={(e) => setEntrepriseInfo(prev => ({ ...prev, nom_entreprise: e.target.value }))}
                        placeholder="Ex: SARL TechServices Congo"
                      />
                    </div>

                    {/* Address & City */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="adresse">Adresse</Label>
                        <Input
                          id="adresse"
                          value={entrepriseInfo.adresse}
                          onChange={(e) => setEntrepriseInfo(prev => ({ ...prev, adresse: e.target.value }))}
                          placeholder="Ex: 123 Avenue de la Liberté"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ville">Ville</Label>
                        <Input
                          id="ville"
                          value={entrepriseInfo.ville}
                          onChange={(e) => setEntrepriseInfo(prev => ({ ...prev, ville: e.target.value }))}
                          placeholder="Ex: Kinshasa"
                        />
                      </div>
                    </div>

                    {/* Phone & Email */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="telephone">Téléphone professionnel</Label>
                        <Input
                          id="telephone"
                          value={entrepriseInfo.telephone}
                          onChange={(e) => setEntrepriseInfo(prev => ({ ...prev, telephone: e.target.value }))}
                          placeholder="Ex: +243 812 345 678"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email_professionnel">Email professionnel</Label>
                        <Input
                          id="email_professionnel"
                          type="email"
                          value={entrepriseInfo.email_professionnel}
                          onChange={(e) => setEntrepriseInfo(prev => ({ ...prev, email_professionnel: e.target.value }))}
                          placeholder="Ex: contact@entreprise.cd"
                        />
                      </div>
                    </div>

                    {/* Tax ID */}
                    <div className="space-y-2">
                      <Label htmlFor="numero_fiscal">Numéro d'identification fiscale / RCCM (optionnel)</Label>
                      <Input
                        id="numero_fiscal"
                        value={entrepriseInfo.numero_fiscal}
                        onChange={(e) => setEntrepriseInfo(prev => ({ ...prev, numero_fiscal: e.target.value }))}
                        placeholder="Ex: CD/KIN/RCCM/12-345"
                      />
                    </div>

                    {/* Terms & Conditions */}
                    <div className="space-y-2">
                      <Label htmlFor="conditions_generales">Conditions générales (optionnel)</Label>
                      <Textarea
                        id="conditions_generales"
                        value={entrepriseInfo.conditions_generales}
                        onChange={(e) => setEntrepriseInfo(prev => ({ ...prev, conditions_generales: e.target.value }))}
                        placeholder="Ex: Paiement à 30 jours. Garantie de 6 mois sur les travaux..."
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground">
                        Ces conditions apparaîtront sur vos devis
                      </p>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 border-t">
                      <Button 
                        onClick={handleSaveCompanyInfo}
                        disabled={savingCompanyInfo || !entrepriseInfo.nom_entreprise}
                        className="w-full sm:w-auto"
                      >
                        {savingCompanyInfo ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            Enregistrement...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Enregistrer
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="p-6">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      À propos de vos informations d'entreprise
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Ces informations seront utilisées pour générer vos devis professionnels en PDF. 
                      Votre logo apparaîtra en en-tête, et KaziPro sera mentionné discrètement en bas de page.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            {loadingSettings ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Notifications push
                    </CardTitle>
                    <CardDescription>Gérez les notifications que vous recevez sur l'application</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { key: 'notif_nouvelles_missions', label: "Nouvelles missions disponibles", description: "Recevoir une alerte pour les nouvelles opportunités" },
                      { key: 'notif_messages_clients', label: "Messages clients", description: "Notification pour chaque nouveau message" },
                      { key: 'notif_maj_missions', label: "Mise à jour des missions", description: "Changements de statut de vos missions" },
                      { key: 'notif_rappels_rdv', label: "Rappels de rendez-vous", description: "Rappel 1h avant chaque rendez-vous" },
                      { key: 'notif_promotions', label: "Promotions KaziPro", description: "Offres spéciales et actualités" },
                    ].map((item) => (
                      <div key={item.key} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-border last:border-0 gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm sm:text-base">{item.label}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <Switch 
                          checked={settings[item.key as keyof Settings] as boolean}
                          onCheckedChange={(checked) => handleUpdateSetting(item.key as keyof Settings, checked)}
                          className="self-start sm:self-center"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Notifications par email
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { key: 'email_resume_hebdo', label: "Résumé hebdomadaire", description: "Synthèse de votre activité chaque semaine" },
                      { key: 'email_nouvelles_missions', label: "Nouvelles missions", description: "Email pour les missions correspondant à votre profil" },
                      { key: 'email_paiements', label: "Paiements reçus", description: "Confirmation de réception des paiements" },
                    ].map((item) => (
                      <div key={item.key} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-border last:border-0 gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm sm:text-base">{item.label}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <Switch 
                          checked={settings[item.key as keyof Settings] as boolean}
                          onCheckedChange={(checked) => handleUpdateSetting(item.key as keyof Settings, checked)}
                          className="self-start sm:self-center"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Notifications SMS
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { key: 'sms_missions_urgentes', label: "Missions urgentes", description: "SMS pour les demandes urgentes uniquement" },
                      { key: 'sms_codes_verification', label: "Codes de vérification", description: "SMS pour la sécurité du compte" },
                    ].map((item) => (
                      <div key={item.key} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-border last:border-0 gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm sm:text-base">{item.label}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <Switch 
                          checked={settings[item.key as keyof Settings] as boolean}
                          onCheckedChange={(checked) => handleUpdateSetting(item.key as keyof Settings, checked)}
                          className="self-start sm:self-center"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Changer le mot de passe
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 caractères"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confirmer le nouveau mot de passe</Label>
                  <Input 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Retapez le mot de passe"
                  />
                </div>
                <Button 
                  onClick={handleChangePassword}
                  disabled={changingPassword || !newPassword || !confirmPassword}
                >
                  {changingPassword ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Mise à jour...
                    </>
                  ) : (
                    "Mettre à jour le mot de passe"
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Authentification à deux facteurs
                </CardTitle>
                <CardDescription>Ajoutez une couche de sécurité supplémentaire (Bientôt disponible)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Activer la 2FA</p>
                    <p className="text-sm text-muted-foreground">Via SMS ou application d'authentification</p>
                  </div>
                  <Switch disabled />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Appareils connectés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { device: "iPhone 13 Pro", location: "Kinshasa", lastActive: "Actif maintenant", current: true },
                    { device: "Chrome - Windows", location: "Kinshasa", lastActive: "Il y a 2 heures", current: false },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-8 h-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{item.device}</p>
                          <p className="text-sm text-muted-foreground">{item.location} • {item.lastActive}</p>
                        </div>
                      </div>
                      {item.current ? (
                        <span className="text-sm text-green-600">Cet appareil</span>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-destructive">Déconnecter</Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <ConfigPaiementTab />
          </TabsContent>

          <TabsContent value="availability" className="space-y-6">
            {/* Disponibilité globale */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Disponibilité générale
                </CardTitle>
                <CardDescription>
                  Activez ou désactivez votre disponibilité pour recevoir de nouvelles demandes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${profile?.disponible ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <div>
                      <p className="font-medium">
                        {profile?.disponible ? 'Vous êtes disponible' : 'Vous êtes indisponible'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {profile?.disponible 
                          ? 'Les clients peuvent vous contacter et vous envoyer des demandes'
                          : 'Vous ne recevrez pas de nouvelles demandes'}
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={profile?.disponible || false}
                    onCheckedChange={handleToggleDisponibilite}
                    disabled={updatingDisponibilite}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Horaires de travail
                </CardTitle>
                <CardDescription>Définissez vos heures de disponibilité</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingHoraires ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {horaires.map((horaire) => (
                      <div key={horaire.jour_semaine} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-border last:border-0 gap-3">
                        <div className="flex items-center gap-3 min-w-[120px]">
                          <Switch 
                            checked={horaire.actif}
                            onCheckedChange={(checked) => handleUpdateHoraire(horaire.jour_semaine, 'actif', checked)}
                          />
                          <span className="font-medium text-sm">{joursMap[horaire.jour_semaine]}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                          <Select 
                            value={horaire.heure_debut} 
                            onValueChange={(value) => handleUpdateHoraire(horaire.jour_semaine, 'heure_debut', value)}
                            disabled={!horaire.actif}
                          >
                            <SelectTrigger className="w-[100px] sm:w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => (
                                <SelectItem key={i} value={`${i.toString().padStart(2, "0")}:00`}>
                                  {`${i.toString().padStart(2, "0")}:00`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-sm text-muted-foreground">à</span>
                          <Select 
                            value={horaire.heure_fin}
                            onValueChange={(value) => handleUpdateHoraire(horaire.jour_semaine, 'heure_fin', value)}
                            disabled={!horaire.actif}
                          >
                            <SelectTrigger className="w-[100px] sm:w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => (
                                <SelectItem key={i} value={`${i.toString().padStart(2, "0")}:00`}>
                                  {`${i.toString().padStart(2, "0")}:00`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statut de disponibilité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm sm:text-base">Mode vacances</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Désactiver temporairement la réception de nouvelles demandes</p>
                  </div>
                  <Switch 
                    checked={settings.mode_vacances}
                    onCheckedChange={(checked) => handleUpdateSetting('mode_vacances', checked)}
                    className="self-start sm:self-center"
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm sm:text-base">Accepter les missions urgentes</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Recevoir les demandes marquées comme urgentes</p>
                  </div>
                  <Switch 
                    checked={settings.accepter_urgences}
                    onCheckedChange={(checked) => handleUpdateSetting('accepter_urgences', checked)}
                    className="self-start sm:self-center"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Langue et région
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Langue</Label>
                    <Select 
                      value={settings.langue}
                      onValueChange={(value) => setSettings(prev => ({ ...prev, langue: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ln">Lingala</SelectItem>
                        <SelectItem value="sw">Swahili</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fuseau horaire</Label>
                    <Select 
                      value={settings.fuseau_horaire}
                      onValueChange={(value) => setSettings(prev => ({ ...prev, fuseau_horaire: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Africa/Kinshasa">Afrique/Kinshasa (UTC+1)</SelectItem>
                        <SelectItem value="Africa/Lubumbashi">Afrique/Lubumbashi (UTC+2)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t">
                  <Button 
                    onClick={handleSavePreferences}
                    disabled={savingSettings}
                    className="w-full sm:w-auto"
                  >
                    {savingSettings ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Enregistrer
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="w-5 h-5" />
                  Zone dangereuse
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Désactiver le compte</p>
                    <p className="text-sm text-muted-foreground">Votre compte sera temporairement invisible</p>
                  </div>
                  <Button variant="outline" disabled>Désactiver</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Supprimer le compte</p>
                    <p className="text-sm text-muted-foreground">Cette action est irréversible</p>
                  </div>
                  <Button variant="destructive" disabled>Supprimer</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
