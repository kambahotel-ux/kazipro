import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  Lock, 
  User, 
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
  Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ClientProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
}

export default function ParametresPage() {
  const { user } = useAuth();
  const [clientName, setClientName] = useState("Client");
  const [showPassword, setShowPassword] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ClientProfile>({
    id: "",
    full_name: "",
    email: user?.email || "",
    phone: "",
    city: "",
    address: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          id: data.id,
          full_name: data.full_name || "",
          email: user.email || "",
          phone: data.phone || "",
          city: data.city || "",
          address: data.address || "",
        });
        setClientName(data.full_name || "Client");
      }
    } catch (error: any) {
      toast.error("Erreur lors du chargement du profil");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (field: keyof ClientProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("clients")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          city: profile.city,
          address: profile.address,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setClientName(profile.full_name);
      setHasChanges(false);
      setShowSaveAlert(false);
      toast.success("Profil mis à jour avec succès");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    }
  };

  return (
    <DashboardLayout role="client" userName={clientName} userRole="Client">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Paramètres</h1>
          <p className="text-muted-foreground">Gérez vos préférences et paramètres de compte</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="notifications" className="space-y-4">
            <TabsList className="flex-wrap">
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="profil">Profil</TabsTrigger>
              <TabsTrigger value="security">Sécurité</TabsTrigger>
              <TabsTrigger value="preferences">Préférences</TabsTrigger>
            </TabsList>

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
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Nouvelles réponses aux demandes", description: "Recevoir une alerte pour les nouveaux devis", enabled: true },
                    { label: "Messages des prestataires", description: "Notification pour chaque nouveau message", enabled: true },
                    { label: "Mise à jour des missions", description: "Changements de statut de vos missions", enabled: true },
                    { label: "Rappels de paiement", description: "Rappel pour les paiements en attente", enabled: false },
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
                    { label: "Nouvelles réponses", description: "Email pour chaque nouveau devis reçu", enabled: false },
                    { label: "Rappels de paiement", description: "Rappel pour les paiements en attente", enabled: true },
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
            </TabsContent>

            <TabsContent value="profil" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Informations personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nom complet</Label>
                    <Input 
                      value={profile.full_name}
                      onChange={(e) => handleProfileChange("full_name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={profile.email} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <Input 
                      value={profile.phone}
                      onChange={(e) => handleProfileChange("phone", e.target.value)}
                    />
                  </div>
                  <Button onClick={handleSaveProfile} disabled={!hasChanges}>
                    Mettre à jour
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Adresse par défaut</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Adresse</Label>
                    <Input 
                      value={profile.address}
                      onChange={(e) => handleProfileChange("address", e.target.value)}
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Commune</Label>
                      <Input 
                        value={profile.city}
                        onChange={(e) => handleProfileChange("city", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ville</Label>
                      <Input value="Kinshasa" disabled />
                    </div>
                  </div>
                  <Button onClick={handleSaveProfile} disabled={!hasChanges}>
                    Mettre à jour
                  </Button>
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
        )}

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
                    onClick={handleSaveProfile}
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
