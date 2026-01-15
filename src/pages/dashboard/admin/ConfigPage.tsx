import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, AlertCircle, Settings, Lock, CreditCard, Bell } from "lucide-react";
import { toast } from "sonner";

export default function ConfigPage() {
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = () => {
    toast.success("Configuration enregistrée");
    setHasChanges(false);
  };

  return (
    <DashboardLayout role="admin" userName="Admin" userRole="Administrateur">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Configuration</h1>
            <p className="text-muted-foreground">Gérez les paramètres de la plateforme</p>
          </div>
          {hasChanges && (
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
          )}
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="commission">Commission</TabsTrigger>
            <TabsTrigger value="verification">Vérification</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
            <TabsTrigger value="features">Fonctionnalités</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informations Générales</CardTitle>
                <CardDescription>Paramètres généraux de la plateforme</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom de la Plateforme</Label>
                  <Input defaultValue="KaziPro" onChange={() => setHasChanges(true)} />
                </div>
                <div className="space-y-2">
                  <Label>Email de Support</Label>
                  <Input type="email" defaultValue="support@kazipro.com" onChange={() => setHasChanges(true)} />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone de Support</Label>
                  <Input defaultValue="+243 812 345 678" onChange={() => setHasChanges(true)} />
                </div>
                <div className="space-y-2">
                  <Label>Adresse</Label>
                  <Input defaultValue="Kinshasa, RDC" onChange={() => setHasChanges(true)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commission Settings */}
          <TabsContent value="commission" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de Commission</CardTitle>
                <CardDescription>Configurez les commissions et les frais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Pourcentage de Commission (%)</Label>
                  <Input type="number" defaultValue="10" min="0" max="100" onChange={() => setHasChanges(true)} />
                  <p className="text-xs text-muted-foreground">Commission prélevée sur chaque transaction</p>
                </div>
                <div className="space-y-2">
                  <Label>Transaction Minimale (FC)</Label>
                  <Input type="number" defaultValue="5000" onChange={() => setHasChanges(true)} />
                </div>
                <div className="space-y-2">
                  <Label>Frais de Traitement (%)</Label>
                  <Input type="number" defaultValue="2" min="0" max="100" onChange={() => setHasChanges(true)} />
                </div>
                <div className="space-y-2">
                  <Label>Méthodes de Paiement Acceptées</Label>
                  <div className="space-y-2 mt-2">
                    {["M-Pesa", "Airtel Money", "Orange Money", "Virement Bancaire"].map((method) => (
                      <div key={method} className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked id={method} onChange={() => setHasChanges(true)} />
                        <label htmlFor={method} className="text-sm">{method}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verification Settings */}
          <TabsContent value="verification" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de Vérification</CardTitle>
                <CardDescription>Configurez le processus de vérification des prestataires</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Documents Requis</Label>
                  <div className="space-y-2 mt-2">
                    {["Pièce d'Identité", "Certificat de Compétence", "Assurance Professionnelle", "Références"].map((doc) => (
                      <div key={doc} className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked id={doc} onChange={() => setHasChanges(true)} />
                        <label htmlFor={doc} className="text-sm">{doc}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Délai de Vérification (jours)</Label>
                  <Input type="number" defaultValue="3" min="1" onChange={() => setHasChanges(true)} />
                </div>
                <div className="space-y-2">
                  <Label>Note Minimale Requise</Label>
                  <Input type="number" defaultValue="3.5" min="0" max="5" step="0.1" onChange={() => setHasChanges(true)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de Notifications</CardTitle>
                <CardDescription>Configurez les modèles de notification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { label: "Notifications Email", desc: "Envoyer les notifications par email" },
                    { label: "Notifications SMS", desc: "Envoyer les notifications par SMS" },
                    { label: "Notifications Push", desc: "Envoyer les notifications push" },
                    { label: "Rappels Automatiques", desc: "Envoyer les rappels automatiques" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch defaultChecked onChange={() => setHasChanges(true)} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de Sécurité</CardTitle>
                <CardDescription>Configurez les paramètres de sécurité</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Longueur Minimale du Mot de Passe</Label>
                  <Input type="number" defaultValue="8" min="6" onChange={() => setHasChanges(true)} />
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Exiger Majuscules", desc: "Exiger au moins une majuscule" },
                    { label: "Exiger Chiffres", desc: "Exiger au moins un chiffre" },
                    { label: "Exiger Caractères Spéciaux", desc: "Exiger au moins un caractère spécial" },
                    { label: "Authentification à Deux Facteurs", desc: "Activer 2FA pour les admins" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch defaultChecked onChange={() => setHasChanges(true)} />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>Limite de Tentatives de Connexion</Label>
                  <Input type="number" defaultValue="5" min="1" onChange={() => setHasChanges(true)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Settings */}
          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Fonctionnalités</CardTitle>
                <CardDescription>Activez ou désactivez les fonctionnalités</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { label: "Système de Messagerie", desc: "Permettre la communication entre utilisateurs" },
                    { label: "Système de Notation", desc: "Permettre les avis et évaluations" },
                    { label: "Paiements en Ligne", desc: "Activer les paiements en ligne" },
                    { label: "Système de Litiges", desc: "Activer la résolution des litiges" },
                    { label: "Calendrier", desc: "Activer le système de calendrier" },
                    { label: "Mode Maintenance", desc: "Mettre la plateforme en maintenance" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch 
                        defaultChecked={item.label !== "Mode Maintenance"}
                        onChange={() => setHasChanges(true)} 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Warning */}
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="pt-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Attention</p>
              <p className="text-sm text-muted-foreground mt-1">
                Les modifications apportées à ces paramètres affecteront tous les utilisateurs de la plateforme. Assurez-vous de bien comprendre les conséquences avant de sauvegarder.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
