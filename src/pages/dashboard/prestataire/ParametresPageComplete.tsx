// Ce fichier contient la version complète et fonctionnelle
// Remplacer ParametresPage.tsx par ce contenu après avoir exécuté le SQL

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
  Loader,
  CheckCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

// ... (garder tous les interfaces et types existants)

interface Settings {
  // Notifications
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
  // Préférences
  langue: string;
  fuseau_horaire: string;
  mode_vacances: boolean;
  accepter_urgences: boolean;
}

export default function ParametresPageComplete() {
  // ... (garder tous les states existants)
  
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
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user && providerId) {
      fetchSettings();
    }
  }, [user, providerId]);

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
      setCurrentPassword("");
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

  // ... (garder tout le reste du code existant pour Entreprise, Horaires, etc.)

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
          <TabsList className="flex-wrap">
            <TabsTrigger value="company">Entreprise</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
            <TabsTrigger value="availability">Disponibilité</TabsTrigger>
            <TabsTrigger value="preferences">Préférences</TabsTrigger>
          </TabsList>

          {/* ... Garder TabsContent "company" existant ... */}

          {/* NOTIFICATIONS - FONCTIONNEL */}
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
                      <div key={item.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <Switch 
                          checked={settings[item.key as keyof Settings] as boolean}
                          onCheckedChange={(checked) => handleUpdateSetting(item.key as keyof Settings, checked)}
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
                      <div key={item.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <Switch 
                          checked={settings[item.key as keyof Settings] as boolean}
                          onCheckedChange={(checked) => handleUpdateSetting(item.key as keyof Settings, checked)}
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
                      <div key={item.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <Switch 
                          checked={settings[item.key as keyof Settings] as boolean}
                          onCheckedChange={(checked) => handleUpdateSetting(item.key as keyof Settings, checked)}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* SÉCURITÉ - FONCTIONNEL */}
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
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mettre à jour le mot de passe
                    </>
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
          </TabsContent>

          {/* ... Garder TabsContent "availability" existant ... */}

          {/* PRÉFÉRENCES - FONCTIONNEL */}
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
