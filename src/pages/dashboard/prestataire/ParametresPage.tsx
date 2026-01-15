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

export default function ParametresPage() {
  const { user } = useAuth();
  const [providerName, setProviderName] = useState("Prestataire");
  const [providerId, setProviderId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  
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

  useEffect(() => {
    if (user) {
      fetchProviderName();
      fetchEntrepriseInfo();
    }
  }, [user]);

  const fetchProviderName = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("prestataires")
        .select("id, full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setProviderName(data.full_name || "Prestataire");
        setProviderId(data.id);
      }
    } catch (error) {
      console.error("Error fetching provider name:", error);
    }
  };

  const fetchEntrepriseInfo = async () => {
    if (!user) return;
    
    try {
      setLoadingCompanyInfo(true);
      
      // Get prestataire ID first
      const { data: prestataireData } = await supabase
        .from("prestataires")
        .select("id")
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

      setEntrepriseInfo(prev => ({ ...prev, logo_url: publicUrl }));
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

      setEntrepriseInfo(prev => ({ ...prev, signature_url: publicUrl }));
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

  return (
    <DashboardLayout role="prestataire" userName={providerName} userRole="Prestataire">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Paramètres</h1>
          <p className="text-muted-foreground">Gérez vos préférences et paramètres de compte</p>
        </div>

        <Tabs defaultValue="company" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="company">Entreprise</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
            <TabsTrigger value="payments">Paiements</TabsTrigger>
            <TabsTrigger value="availability">Disponibilité</TabsTrigger>
            <TabsTrigger value="preferences">Préférences</TabsTrigger>
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
                      <div className="flex items-center gap-4">
                        {entrepriseInfo.logo_url ? (
                          <div className="relative w-24 h-24 border-2 border-border rounded-lg overflow-hidden">
                            <img 
                              src={entrepriseInfo.logo_url} 
                              alt="Logo" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted">
                            <Building2 className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
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
                      <div className="flex items-center gap-4">
                        {entrepriseInfo.signature_url ? (
                          <div className="relative w-32 h-20 border-2 border-border rounded-lg overflow-hidden bg-white">
                            <img 
                              src={entrepriseInfo.signature_url} 
                              alt="Signature" 
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-32 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted">
                            <span className="text-xs text-muted-foreground">Signature</span>
                          </div>
                        )}
                        <div className="flex-1">
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
            {hasChanges && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-600">Vous avez des modifications non enregistrées</span>
                <Button size="sm" className="ml-auto" onClick={() => setShowSaveAlert(true)}>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            )}
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
                  { label: "Nouvelles missions disponibles", description: "Recevoir une alerte pour les nouvelles opportunités", enabled: true },
                  { label: "Messages clients", description: "Notification pour chaque nouveau message", enabled: true },
                  { label: "Mise à jour des missions", description: "Changements de statut de vos missions", enabled: true },
                  { label: "Rappels de rendez-vous", description: "Rappel 1h avant chaque rendez-vous", enabled: false },
                  { label: "Promotions KaziPro", description: "Offres spéciales et actualités", enabled: false },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch 
                      defaultChecked={item.enabled}
                      onChange={() => setHasChanges(true)}
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
                  { label: "Résumé hebdomadaire", description: "Synthèse de votre activité chaque semaine", enabled: true },
                  { label: "Nouvelles missions", description: "Email pour les missions correspondant à votre profil", enabled: false },
                  { label: "Paiements reçus", description: "Confirmation de réception des paiements", enabled: true },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch defaultChecked={item.enabled} />
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
                  { label: "Missions urgentes", description: "SMS pour les demandes urgentes uniquement", enabled: true },
                  { label: "Codes de vérification", description: "SMS pour la sécurité du compte", enabled: true },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch defaultChecked={item.enabled} />
                  </div>
                ))}
              </CardContent>
            </Card>
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
                  <Label>Mot de passe actuel</Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} />
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
                  <Label>Nouveau mot de passe</Label>
                  <Input type="password" />
                </div>
                <div className="space-y-2">
                  <Label>Confirmer le nouveau mot de passe</Label>
                  <Input type="password" />
                </div>
                <Button>Mettre à jour le mot de passe</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Authentification à deux facteurs
                </CardTitle>
                <CardDescription>Ajoutez une couche de sécurité supplémentaire</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Activer la 2FA</p>
                    <p className="text-sm text-muted-foreground">Via SMS ou application d'authentification</p>
                  </div>
                  <Switch />
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Méthodes de retrait
                </CardTitle>
                <CardDescription>Gérez vos options de paiement pour recevoir vos revenus</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-orange-500">M</span>
                      </div>
                      <div>
                        <p className="font-medium">M-Pesa</p>
                        <p className="text-sm text-muted-foreground">+243 812 345 678</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-green-600 bg-green-500/10 px-2 py-1 rounded">Principal</span>
                      <Button variant="ghost" size="sm">Modifier</Button>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Ajouter une méthode de paiement
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Préférences de facturation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Devise préférée</Label>
                    <Select defaultValue="fc">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fc">Franc Congolais (FC)</SelectItem>
                        <SelectItem value="usd">Dollar US ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Seuil de retrait automatique</Label>
                    <Select defaultValue="500000">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100000">100,000 FC</SelectItem>
                        <SelectItem value="250000">250,000 FC</SelectItem>
                        <SelectItem value="500000">500,000 FC</SelectItem>
                        <SelectItem value="manual">Manuel uniquement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Horaires de travail
                </CardTitle>
                <CardDescription>Définissez vos heures de disponibilité</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map((day) => (
                  <div key={day} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-4 w-32">
                      <Switch defaultChecked={day !== "Dimanche"} />
                      <span className="font-medium">{day}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select defaultValue="08:00">
                        <SelectTrigger className="w-24">
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
                      <span>à</span>
                      <Select defaultValue="18:00">
                        <SelectTrigger className="w-24">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statut de disponibilité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Mode vacances</p>
                    <p className="text-sm text-muted-foreground">Désactiver temporairement la réception de nouvelles demandes</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Accepter les missions urgentes</p>
                    <p className="text-sm text-muted-foreground">Recevoir les demandes marquées comme urgentes</p>
                  </div>
                  <Switch defaultChecked />
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
                    <Select defaultValue="fr">
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
                    <Select defaultValue="africa-kinshasa">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="africa-kinshasa">Afrique/Kinshasa (UTC+1)</SelectItem>
                        <SelectItem value="africa-lubumbashi">Afrique/Lubumbashi (UTC+2)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                  <Button variant="outline">Désactiver</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Supprimer le compte</p>
                    <p className="text-sm text-muted-foreground">Cette action est irréversible</p>
                  </div>
                  <Button variant="destructive">Supprimer</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Confirmation Modal */}
        {showSaveAlert && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Enregistrer les modifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Êtes-vous sûr de vouloir enregistrer toutes vos modifications ?
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowSaveAlert(false)}
                  >
                    Annuler
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      setShowSaveAlert(false);
                      setHasChanges(false);
                      alert("Paramètres enregistrés avec succès !");
                    }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
