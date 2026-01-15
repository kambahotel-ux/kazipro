import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, X, MapPin, DollarSign, Calendar, AlertCircle, CheckCircle, ArrowLeft, Loader, Target, Users, Search as SearchIcon, User, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const communes = [
  "Gombe",
  "Ngaliema",
  "Bandalungwa",
  "Lemba",
  "Limete",
  "Kintambo",
  "Kalamu",
  "Kasavubu",
  "Makala",
  "Matete",
];

export default function NouvelleDemandePages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clientName, setClientName] = useState("Client");
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    service: "",
    commune: "",
    budgetMin: "",
    budgetMax: "",
    urgency: "normal",
    deadline: "",
    images: [] as File[],
    type: "publique" as "publique" | "directe",
  });
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedProviders, setSelectedProviders] = useState<any[]>([]);
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  const [providerSearch, setProviderSearch] = useState("");
  const [viewingProvider, setViewingProvider] = useState<any>(null);

  useEffect(() => {
    loadServices();
    if (user) {
      fetchClientName();
    }
  }, [user]);

  useEffect(() => {
    if (formData.type === "directe" && formData.service) {
      loadAvailableProviders();
    }
  }, [formData.type, formData.service]);

  const loadServices = async () => {
    try {
      setLoadingServices(true);
      const { data, error } = await supabase
        .from("professions")
        .select("nom")
        .eq("actif", true)
        .order("nom");

      if (error) throw error;
      
      const serviceNames = data?.map(p => p.nom) || [];
      setServices(serviceNames);
    } catch (error) {
      console.error("Error loading services:", error);
      toast.error("Erreur lors du chargement des services");
      // Fallback to default services
      setServices([
        "Électricité",
        "Plomberie",
        "Menuiserie",
        "Peinture",
        "Climatisation",
        "Mécanique automobile",
        "Maçonnerie",
        "Carrelage",
        "Tapisserie",
        "Informatique",
        "Autre",
      ]);
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchClientName = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("clients")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      if (data?.full_name) {
        setClientName(data.full_name);
      }
    } catch (error) {
      console.error("Error fetching client name:", error);
    }
  };

  const loadAvailableProviders = async () => {
    try {
      let query = supabase
        .from("prestataires")
        .select("id, full_name, profession, bio, rating, verified, created_at")
        .eq("verified", true);

      if (formData.service) {
        query = query.eq("profession", formData.service);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAvailableProviders(data || []);
    } catch (error) {
      console.error("Error loading providers:", error);
    }
  };

  const toggleProviderSelection = (provider: any) => {
    setSelectedProviders(prev => {
      const isSelected = prev.find(p => p.id === provider.id);
      if (isSelected) {
        return prev.filter(p => p.id !== provider.id);
      } else {
        if (prev.length >= 10) {
          toast.error("Maximum 10 prestataires peuvent être invités");
          return prev;
        }
        return [...prev, provider];
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (formData.images.length + files.length > 5) {
      setErrors(prev => ({ ...prev, images: "Maximum 5 images autorisées" }));
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep = (stepNum: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNum === 1) {
      if (!formData.title.trim()) newErrors.title = "Le titre est requis";
      if (!formData.description.trim()) newErrors.description = "La description est requise";
      if (formData.description.length < 20) newErrors.description = "La description doit contenir au moins 20 caractères";
    }

    if (stepNum === 2) {
      // Étape 2: Type de demande - pas de validation nécessaire, type a une valeur par défaut
    }

    if (stepNum === 3) {
      if (!formData.service) newErrors.service = "Sélectionnez un service";
      // Commune is required for public requests, optional for direct (will be asked in step 4)
      if (formData.type === "publique" && !formData.commune) {
        newErrors.commune = "Sélectionnez une commune";
      }
      if (formData.type === "directe" && selectedProviders.length === 0) {
        newErrors.providers = "Sélectionnez au moins un prestataire pour une demande directe";
      }
    }

    if (stepNum === 4) {
      // Commune is required for direct requests at this step
      if (formData.type === "directe" && !formData.commune) {
        newErrors.commune = "Sélectionnez une commune";
      }
      if (!formData.budgetMin) newErrors.budgetMin = "Budget minimum requis";
      if (!formData.budgetMax) newErrors.budgetMax = "Budget maximum requis";
      if (parseInt(formData.budgetMin) > parseInt(formData.budgetMax)) {
        newErrors.budgetMin = "Le budget minimum doit être inférieur au maximum";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleSubmit = () => {
    if (validateStep(3)) {
      submitDemande();
    }
  };

  const submitDemande = async () => {
    if (!user) {
      toast.error("Vous devez être connecté");
      return;
    }

    try {
      setSubmitting(true);

      // Get client ID
      let { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      // If client doesn't exist, create it
      if (clientError && clientError.code === 'PGRST116') {
        const { data: newClient, error: createError } = await supabase
          .from("clients")
          .insert([
            {
              user_id: user.id,
              full_name: user.email?.split('@')[0] || 'Client',
              city: formData.commune,
              verified: false,
            }
          ])
          .select()
          .single();

        if (createError) throw createError;
        clientData = newClient;
      } else if (clientError) {
        throw clientError;
      }

      // Create demande
      const { data: demandeData, error: demandeError } = await supabase
        .from("demandes")
        .insert([
          {
            client_id: clientData.id,
            titre: formData.title,
            title: formData.title, // Pour compatibilité
            description: formData.description,
            profession: formData.service,
            service: formData.service, // Pour compatibilité
            localisation: formData.commune,
            location: formData.commune, // Pour compatibilité
            budget: parseInt(formData.budgetMax) || parseInt(formData.budgetMin) || 0,
            budget_min: parseInt(formData.budgetMin) || 0, // Pour compatibilité
            budget_max: parseInt(formData.budgetMax) || 0, // Pour compatibilité
            urgence: formData.urgency,
            statut: "en_attente",
            type: formData.type,
          }
        ])
        .select()
        .single();

      if (demandeError) throw demandeError;

      // Create invitations for direct requests
      if (formData.type === "directe" && selectedProviders.length > 0) {
        const invitations = selectedProviders.map(provider => ({
          demande_id: demandeData.id,
          prestataire_id: provider.id,
          status: "pending",
        }));

        const { error: invitationError } = await supabase
          .from("demande_invitations")
          .insert(invitations);

        if (invitationError) {
          console.error("Error creating invitations:", invitationError);
          toast.error("Demande créée mais erreur lors de l'envoi des invitations");
        }
      }

      // Upload images if any and get their URLs
      const imageUrls: string[] = [];
      if (formData.images.length > 0) {
        for (let i = 0; i < formData.images.length; i++) {
          const file = formData.images[i];
          const fileName = `${demandeData.id}/${Date.now()}-${i}`;
          
          const { error: uploadError } = await supabase.storage
            .from("demandes")
            .upload(fileName, file);

          if (uploadError) {
            console.warn("Image upload warning:", uploadError);
          } else {
            // Get public URL for the uploaded image
            const { data: urlData } = supabase.storage
              .from("demandes")
              .getPublicUrl(fileName);
            
            if (urlData?.publicUrl) {
              imageUrls.push(urlData.publicUrl);
            }
          }
        }

        // Update demande with image URLs
        if (imageUrls.length > 0) {
          const { error: updateError } = await supabase
            .from("demandes")
            .update({ images: imageUrls })
            .eq("id", demandeData.id);

          if (updateError) {
            console.warn("Error updating images:", updateError);
          }
        }
      }

      toast.success("Demande créée avec succès !");
      navigate("/dashboard/client/demandes");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création de la demande");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="client" userName={clientName} userRole="Client">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/client/demandes")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Créer une nouvelle demande</h1>
            <p className="text-muted-foreground">Étape {step} sur 5</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Form */}
        <Card>
          <CardContent className="p-6">
            {/* Step 1: Titre et Description */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Décrivez votre projet</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Plus votre description est détaillée, plus vous recevrez de devis pertinents.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Titre de la demande *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Ex: Rénovation complète salle de bain"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={errors.title ? "border-destructive" : ""}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.title}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description détaillée *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Décrivez votre projet en détail: dimensions, matériaux souhaités, délais, etc."
                    value={formData.description}
                    onChange={handleInputChange}
                    className={`min-h-[150px] ${errors.description ? "border-destructive" : ""}`}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      {formData.description.length} caractères
                    </p>
                    {errors.description && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-600">
                    <p className="font-medium mb-1">Conseil</p>
                    <p>Incluez des détails comme les dimensions, les matériaux, les délais et votre budget pour attirer les meilleurs prestataires.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Service et Localisation */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Type de demande</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Choisissez comment vous souhaitez recevoir des devis.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Demande Publique */}
                  <div
                    onClick={() => handleSelectChange("type", "publique")}
                    className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                      formData.type === "publique"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${formData.type === "publique" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        <Target className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">Demande publique</h3>
                        <p className="text-sm text-muted-foreground">
                          Tous les prestataires peuvent voir et répondre à votre demande
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Demande Directe */}
                  <div
                    onClick={() => handleSelectChange("type", "directe")}
                    className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                      formData.type === "directe"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${formData.type === "directe" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">Demande directe</h3>
                        <p className="text-sm text-muted-foreground">
                          Invitez des prestataires spécifiques de votre choix
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {formData.type === "directe" && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-600">
                      <p className="font-medium mb-1">Demande directe</p>
                      <p>Seuls les prestataires que vous inviterez pourront voir et répondre à votre demande. Vous pourrez les sélectionner à l'étape suivante.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Service et Prestataires */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">
                    {formData.type === "directe" ? "Sélectionner les prestataires" : "Localisation et service"}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    {formData.type === "directe" 
                      ? "Choisissez le service puis sélectionnez les prestataires à inviter."
                      : "Sélectionnez le type de service et votre localisation."
                    }
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service">Type de service *</Label>
                  <Select value={formData.service} onValueChange={(value) => handleSelectChange("service", value)}>
                    <SelectTrigger className={errors.service ? "border-destructive" : ""}>
                      <SelectValue placeholder="Sélectionnez un service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.service && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.service}
                    </p>
                  )}
                </div>

                {/* Provider Selection for Direct Requests */}
                {formData.type === "directe" && formData.service && (
                  <div className="space-y-4">
                    <div>
                      <Label>Inviter des prestataires *</Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        Sélectionnez jusqu'à 10 prestataires pour votre demande
                      </p>
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher un prestataire..."
                        value={providerSearch}
                        onChange={(e) => setProviderSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Selected Providers */}
                    {selectedProviders.length > 0 && (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                        <p className="text-sm font-medium mb-2">
                          Prestataires sélectionnés ({selectedProviders.length}/10)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedProviders.map((provider) => (
                            <Badge
                              key={provider.id}
                              variant="secondary"
                              className="flex items-center gap-1 pr-1"
                            >
                              {provider.full_name}
                              <button
                                onClick={() => toggleProviderSelection(provider)}
                                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Available Providers */}
                    <div className="border rounded-lg max-h-96 overflow-y-auto">
                      {availableProviders.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Aucun prestataire disponible pour ce service</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {availableProviders
                            .filter(p => 
                              p.full_name.toLowerCase().includes(providerSearch.toLowerCase())
                            )
                            .map((provider) => {
                              const isSelected = selectedProviders.find(p => p.id === provider.id);
                              const initials = provider.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                              const yearsExperience = provider.created_at 
                                ? Math.max(0, new Date().getFullYear() - new Date(provider.created_at).getFullYear())
                                : 0;
                              
                              return (
                                <div
                                  key={provider.id}
                                  className={`p-4 transition-colors ${
                                    isSelected ? "bg-primary/5" : ""
                                  }`}
                                >
                                  <div className="flex items-start gap-4">
                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                                        {initials}
                                      </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-base">{provider.full_name}</h3>
                                        {provider.verified && (
                                          <Badge variant="secondary" className="text-xs">
                                            ✓ Vérifié
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                                        <span className="font-medium">{provider.profession}</span>
                                        {yearsExperience > 0 && (
                                          <>
                                            <span>•</span>
                                            <span>{yearsExperience} {yearsExperience === 1 ? 'an' : 'ans'} d'expérience</span>
                                          </>
                                        )}
                                        {provider.rating && provider.rating > 0 && (
                                          <>
                                            <span>•</span>
                                            <span>⭐ {provider.rating.toFixed(1)}</span>
                                          </>
                                        )}
                                      </div>

                                      {provider.bio && (
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                          {provider.bio}
                                        </p>
                                      )}

                                      <div className="flex items-center gap-2">
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant={isSelected ? "default" : "outline"}
                                          onClick={() => toggleProviderSelection(provider)}
                                          className="flex-1"
                                        >
                                          {isSelected ? (
                                            <>
                                              <CheckCircle className="w-4 h-4 mr-1" />
                                              Sélectionné
                                            </>
                                          ) : (
                                            <>
                                              <User className="w-4 h-4 mr-1" />
                                              Sélectionner
                                            </>
                                          )}
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setViewingProvider(provider);
                                          }}
                                        >
                                          <Eye className="w-4 h-4 mr-1" />
                                          Voir profil
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>

                    {errors.providers && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.providers}
                      </p>
                    )}
                  </div>
                )}

                {/* Commune et autres champs - toujours affichés pour demande publique */}
                {formData.type === "publique" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="commune">Commune *</Label>
                      <Select value={formData.commune} onValueChange={(value) => handleSelectChange("commune", value)}>
                        <SelectTrigger className={errors.commune ? "border-destructive" : ""}>
                          <SelectValue placeholder="Sélectionnez une commune" />
                        </SelectTrigger>
                        <SelectContent>
                          {communes.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.commune && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.commune}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 4: Localisation (pour demande directe) et Budget */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">
                    {formData.type === "directe" ? "Localisation et Budget" : "Budget"}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    {formData.type === "directe" 
                      ? "Indiquez votre localisation et définissez votre budget."
                      : "Définissez votre budget pour attirer les prestataires appropriés."
                    }
                  </p>
                </div>

                {/* Commune pour demande directe */}
                {formData.type === "directe" && (
                  <div className="space-y-2">
                    <Label htmlFor="commune">Commune *</Label>
                    <Select value={formData.commune} onValueChange={(value) => handleSelectChange("commune", value)}>
                      <SelectTrigger className={errors.commune ? "border-destructive" : ""}>
                        <SelectValue placeholder="Sélectionnez une commune" />
                      </SelectTrigger>
                      <SelectContent>
                        {communes.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.commune && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.commune}
                      </p>
                    )}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budgetMin">Budget minimum (FC) *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="budgetMin"
                        name="budgetMin"
                        type="number"
                        placeholder="0"
                        value={formData.budgetMin}
                        onChange={handleInputChange}
                        className={`pl-10 ${errors.budgetMin ? "border-destructive" : ""}`}
                      />
                    </div>
                    {errors.budgetMin && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.budgetMin}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budgetMax">Budget maximum (FC) *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="budgetMax"
                        name="budgetMax"
                        type="number"
                        placeholder="0"
                        value={formData.budgetMax}
                        onChange={handleInputChange}
                        className={`pl-10 ${errors.budgetMax ? "border-destructive" : ""}`}
                      />
                    </div>
                    {errors.budgetMax && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.budgetMax}
                      </p>
                    )}
                  </div>
                </div>

                {formData.budgetMin && formData.budgetMax && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <p className="text-sm text-green-600 font-medium">
                      Budget: {parseInt(formData.budgetMin).toLocaleString()} - {parseInt(formData.budgetMax).toLocaleString()} FC
                    </p>
                  </div>
                )}

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-600">
                    <p className="font-medium mb-1">Conseil</p>
                    <p>Un budget réaliste attire plus de prestataires qualifiés. Consultez les prix du marché pour cette région.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Photos et Confirmation */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Photos et confirmation</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Ajoutez des photos pour mieux illustrer votre projet (optionnel).
                  </p>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Photos du projet (max 5)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium">Cliquez pour ajouter des photos</p>
                      <p className="text-xs text-muted-foreground">ou glissez-déposez</p>
                    </label>
                  </div>
                  {errors.images && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.images}
                    </p>
                  )}
                </div>

                {/* Image Preview */}
                {previewImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {previewImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary */}
                <div className="space-y-4 bg-muted/50 p-6 rounded-lg">
                  <h3 className="font-semibold">Résumé de votre demande</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant={formData.type === "directe" ? "default" : "secondary"}>
                        {formData.type === "directe" ? "Demande directe" : "Demande publique"}
                      </Badge>
                    </div>
                    {formData.type === "directe" && selectedProviders.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Invités:</span>
                        <span className="font-medium">{selectedProviders.length} prestataire(s)</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Titre:</span>
                      <span className="font-medium">{formData.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service:</span>
                      <span className="font-medium">{formData.service}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Localisation:</span>
                      <span className="font-medium">{formData.commune}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Budget:</span>
                      <span className="font-medium">
                        {parseInt(formData.budgetMin).toLocaleString()} - {parseInt(formData.budgetMax).toLocaleString()} FC
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Urgence:</span>
                      <Badge variant="outline">{formData.urgency}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Photos:</span>
                      <span className="font-medium">{previewImages.length}/5</span>
                    </div>
                  </div>
                </div>

                <div className={`border rounded-lg p-4 flex gap-3 ${
                  formData.type === "directe" ? "bg-orange-500/10 border-orange-500/20" : "bg-green-500/10 border-green-500/20"
                }`}>
                  <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    formData.type === "directe" ? "text-orange-600" : "text-green-600"
                  }`} />
                  <div className={`text-sm ${formData.type === "directe" ? "text-orange-600" : "text-green-600"}`}>
                    <p className="font-medium mb-1">Prêt à publier</p>
                    <p>
                      {formData.type === "directe"
                        ? `Votre demande sera envoyée aux ${selectedProviders.length} prestataire(s) sélectionné(s).`
                        : "Votre demande sera visible par tous les prestataires de votre région."
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex gap-4 justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={step === 1}
          >
            Précédent
          </Button>

          <div className="flex gap-2">
            {step < 5 ? (
              <Button onClick={handleNext}>
                Suivant
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handlePrevious}>
                  Modifier
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Publication...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Publier la demande
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal Profil Prestataire */}
      <Dialog open={!!viewingProvider} onOpenChange={() => setViewingProvider(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewingProvider && (
            <>
              <DialogHeader>
                <DialogTitle>Profil du prestataire</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Header avec avatar */}
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-2xl flex-shrink-0">
                    {viewingProvider.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-2xl font-bold">{viewingProvider.full_name}</h2>
                      {viewingProvider.verified && (
                        <Badge variant="secondary">✓ Vérifié</Badge>
                      )}
                    </div>
                    <p className="text-lg text-muted-foreground">{viewingProvider.profession}</p>
                    <div className="flex items-center gap-3 mt-2 text-sm">
                      {viewingProvider.created_at && (
                        <span className="text-muted-foreground">
                          {Math.max(0, new Date().getFullYear() - new Date(viewingProvider.created_at).getFullYear())} {Math.max(0, new Date().getFullYear() - new Date(viewingProvider.created_at).getFullYear()) === 1 ? 'an' : 'ans'} d'expérience
                        </span>
                      )}
                      {viewingProvider.rating && viewingProvider.rating > 0 && (
                        <>
                          <span>•</span>
                          <span>⭐ {viewingProvider.rating.toFixed(1)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {viewingProvider.bio && (
                  <div>
                    <h3 className="font-semibold mb-2">À propos</h3>
                    <p className="text-muted-foreground">{viewingProvider.bio}</p>
                  </div>
                )}

                {/* Services */}
                <div>
                  <h3 className="font-semibold mb-2">Services proposés</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{viewingProvider.profession}</Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => {
                      toggleProviderSelection(viewingProvider);
                      setViewingProvider(null);
                    }}
                    className="flex-1"
                    variant={selectedProviders.find(p => p.id === viewingProvider.id) ? "default" : "outline"}
                  >
                    {selectedProviders.find(p => p.id === viewingProvider.id) ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Sélectionné
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4 mr-2" />
                        Sélectionner ce prestataire
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setViewingProvider(null)}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
