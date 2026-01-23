import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowRight, 
  ArrowLeft, 
  User, 
  Briefcase, 
  FileText, 
  Upload, 
  CheckCircle,
  Building2,
  Phone,
  MapPin,
  Mail
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { TypePrestataire, FormeJuridique } from "@/types/prestataire";

interface ProfileCompletionStepsProps {
  onComplete: () => void;
}

const ProfileCompletionSteps = ({ onComplete }: ProfileCompletionStepsProps) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [typePrestataire, setTypePrestataire] = useState<TypePrestataire>('physique');
  
  // États pour les fichiers
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [qualificationDoc, setQualificationDoc] = useState<File | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  
  // État pour les professions depuis la BD
  const [professions, setProfessions] = useState<Array<{ id: string; nom: string; icone?: string }>>([]);
  const [loadingProfessions, setLoadingProfessions] = useState(true);
  
  // État pour les services sélectionnés (multi-sélection)
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    // Champs communs
    profession: "",
    city: "",
    experience: "",
    phone: "",
    bio: "",
    email: "",
    
    // Personne physique
    nom: "",
    prenom: "",
    dateNaissance: "",
    numeroCNI: "",
    
    // Personne morale
    raisonSociale: "",
    formeJuridique: "" as FormeJuridique | "",
    numeroRCCM: "",
    numeroImpot: "",
    numeroIdNat: "",
    representantNom: "",
    representantPrenom: "",
    representantFonction: "",
    adresseSiege: "",
    villeSiege: "",
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    loadExistingData();
    loadProfessions();
  }, [user]);

  const loadProfessions = async () => {
    try {
      setLoadingProfessions(true);
      const { data, error } = await supabase
        .from("professions")
        .select("id, nom")
        .order("nom", { ascending: true });

      if (error) throw error;

      if (data) {
        // Ajouter des icônes par défaut côté client
        const professionsWithIcons = data.map(prof => ({
          ...prof,
          icone: getIconForProfession(prof.nom)
        }));
        setProfessions(professionsWithIcons);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des professions:", error);
      // Fallback sur une liste par défaut si erreur
      setProfessions([
        { id: "1", nom: "Électricien", icone: "⚡" },
        { id: "2", nom: "Plombier", icone: "🔧" },
        { id: "3", nom: "Menuisier", icone: "🪚" },
        { id: "4", nom: "Maçon", icone: "🧱" },
        { id: "5", nom: "Peintre", icone: "🎨" },
        { id: "6", nom: "Mécanicien", icone: "🔩" },
        { id: "7", nom: "Informaticien", icone: "💻" },
        { id: "8", nom: "Jardinier", icone: "🌱" },
        { id: "9", nom: "Couturier/Couturière", icone: "✂️" },
        { id: "10", nom: "Coiffeur/Coiffeuse", icone: "💇" },
      ]);
    } finally {
      setLoadingProfessions(false);
    }
  };

  // Fonction pour obtenir une icône selon le nom de la profession
  const getIconForProfession = (nom: string): string => {
    const icons: Record<string, string> = {
      "Électricien": "⚡",
      "Plombier": "🔧",
      "Menuisier": "🪚",
      "Maçon": "🧱",
      "Peintre": "🎨",
      "Mécanicien": "🔩",
      "Informaticien": "💻",
      "Jardinier": "🌱",
      "Couturier": "✂️",
      "Couturière": "✂️",
      "Couturier/Couturière": "✂️",
      "Coiffeur": "💇",
      "Coiffeuse": "💇",
      "Coiffeur/Coiffeuse": "💇",
    };
    return icons[nom] || "🔨"; // Icône par défaut
  };

  const loadExistingData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("prestataires")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          profession: data.profession || "",
          city: data.city || "",
          experience: data.experience_years?.toString() || "",
          phone: data.telephone || "",
          bio: data.bio || "",
          email: data.email || user.email || "",
          nom: data.nom || "",
          prenom: data.prenom || "",
          dateNaissance: data.date_naissance || "",
          numeroCNI: data.numero_cni || "",
          raisonSociale: data.raison_sociale || "",
          formeJuridique: data.forme_juridique || "",
          numeroRCCM: data.numero_rccm || "",
          numeroImpot: data.numero_impot || "",
          numeroIdNat: data.numero_id_nat || "",
          representantNom: data.representant_nom || "",
          representantPrenom: data.representant_prenom || "",
          representantFonction: data.representant_fonction || "",
          adresseSiege: data.adresse_siege || "",
          villeSiege: data.ville_siege || "",
        });

        if (data.type_prestataire) {
          setTypePrestataire(data.type_prestataire);
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Type de prestataire
        return true; // Toujours valide
      
      case 2: // Informations professionnelles
        if (typePrestataire === 'physique') {
          if (!formData.nom || !formData.prenom) {
            toast.error("Le nom et le prénom sont requis");
            return false;
          }
        } else {
          if (!formData.raisonSociale || !formData.representantNom) {
            toast.error("La raison sociale et le représentant sont requis");
            return false;
          }
        }
        if (selectedServices.length === 0) {
          toast.error("Veuillez sélectionner au moins un service");
          return false;
        }
        if (!formData.city || !formData.phone) {
          toast.error("La ville et le téléphone sont requis");
          return false;
        }
        return true;
      
      case 3: // Description
        return true; // Bio optionnelle
      
      case 4: // Documents
        return true; // Documents optionnels pour l'instant
      
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setUploadingFiles(true);

      // 1. Upload des fichiers si présents
      let idDocumentUrl = null;
      let qualificationUrl = null;

      if (idDocument) {
        const fileExt = idDocument.name.split('.').pop();
        const fileName = `${user.id}/id_document_${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('prestataire-documents')
          .upload(fileName, idDocument);

        if (uploadError) {
          console.warn("Erreur upload document d'identité:", uploadError);
          toast.error("Erreur lors de l'upload du document d'identité");
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('prestataire-documents')
            .getPublicUrl(fileName);
          idDocumentUrl = publicUrl;
        }
      }

      if (qualificationDoc) {
        const fileExt = qualificationDoc.name.split('.').pop();
        const fileName = `${user.id}/qualification_${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('prestataire-documents')
          .upload(fileName, qualificationDoc);

        if (uploadError) {
          console.warn("Erreur upload document de qualification:", uploadError);
          toast.error("Erreur lors de l'upload du document de qualification");
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('prestataire-documents')
            .getPublicUrl(fileName);
          qualificationUrl = publicUrl;
        }
      }

      setUploadingFiles(false);

      // 2. Mettre à jour le profil
      const updateData: any = {
        type_prestataire: typePrestataire,
        profession: selectedServices[0] || "À définir", // Premier service comme profession principale
        city: formData.city,
        experience_years: formData.experience ? parseInt(formData.experience) : null,
        telephone: formData.phone,
        bio: formData.bio || null,
        email: formData.email,
        profile_completed: true,
        verified: false, // En attente de validation admin
        updated_at: new Date().toISOString(),
      };

      // Ajouter les URLs des documents si uploadés
      if (idDocumentUrl) {
        updateData.id_document_url = idDocumentUrl;
      }
      if (qualificationUrl) {
        updateData.qualification_url = qualificationUrl;
      }

      if (typePrestataire === 'physique') {
        updateData.nom = formData.nom;
        updateData.prenom = formData.prenom;
        updateData.full_name = `${formData.prenom} ${formData.nom}`;
        updateData.date_naissance = formData.dateNaissance || null;
        updateData.numero_cni = formData.numeroCNI || null;
      } else {
        updateData.raison_sociale = formData.raisonSociale;
        updateData.full_name = formData.raisonSociale;
        updateData.forme_juridique = formData.formeJuridique || null;
        updateData.numero_rccm = formData.numeroRCCM || null;
        updateData.numero_impot = formData.numeroImpot || null;
        updateData.numero_id_nat = formData.numeroIdNat || null;
        updateData.representant_nom = formData.representantNom;
        updateData.representant_prenom = formData.representantPrenom || null;
        updateData.representant_fonction = formData.representantFonction || null;
        updateData.adresse_siege = formData.adresseSiege || null;
        updateData.ville_siege = formData.villeSiege || null;
        updateData.pays_siege = "RDC";
      }

      const { data: prestataireData, error } = await supabase
        .from("prestataires")
        .update(updateData)
        .eq("user_id", user.id)
        .select("id")
        .single();

      if (error) throw error;

      // 3. Créer les services dans prestataire_services
      if (prestataireData && selectedServices.length > 0) {
        const servicesData = selectedServices.map((serviceName, index) => ({
          prestataire_id: prestataireData.id,
          service: serviceName,
          niveau_competence: "intermediaire",
          annees_experience: formData.experience ? parseInt(formData.experience) : 0,
          principal: index === 0, // Le premier service est le principal
        }));

        const { error: servicesError } = await supabase
          .from("prestataire_services")
          .insert(servicesData);

        if (servicesError) {
          console.warn("Erreur lors de la création des services:", servicesError);
          // Ne pas bloquer si erreur sur les services
        }
      }

      const message = (idDocument || qualificationDoc) 
        ? "Profil et documents soumis avec succès ! En attente de validation."
        : "Profil soumis avec succès ! En attente de validation.";
      
      toast.success(message);
      onComplete();
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error(error.message || "Erreur lors de la soumission");
    } finally {
      setLoading(false);
      setUploadingFiles(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <User className="w-16 h-16 mx-auto mb-4 text-secondary" />
              <h3 className="text-2xl font-bold mb-2">Type de prestataire</h3>
              <p className="text-muted-foreground">
                Sélectionnez votre statut professionnel
              </p>
            </div>

            <RadioGroup
              value={typePrestataire}
              onValueChange={(value) => setTypePrestataire(value as TypePrestataire)}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <Label
                htmlFor="physique"
                className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-secondary"
              >
                <RadioGroupItem value="physique" id="physique" className="sr-only" />
                <User className="w-12 h-12 mb-3" />
                <span className="text-lg font-semibold">Personne physique</span>
                <span className="text-sm text-muted-foreground text-center mt-2">
                  Travailleur indépendant, freelance
                </span>
              </Label>

              <Label
                htmlFor="morale"
                className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-secondary"
              >
                <RadioGroupItem value="morale" id="morale" className="sr-only" />
                <Building2 className="w-12 h-12 mb-3" />
                <span className="text-lg font-semibold">Personne morale</span>
                <span className="text-sm text-muted-foreground text-center mt-2">
                  Entreprise, société
                </span>
              </Label>
            </RadioGroup>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-secondary" />
              <h3 className="text-2xl font-bold mb-2">Informations professionnelles</h3>
              <p className="text-muted-foreground">
                Complétez vos informations de base
              </p>
            </div>

            {typePrestataire === 'physique' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom *</Label>
                    <Input
                      id="nom"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prenom">Prénom *</Label>
                    <Input
                      id="prenom"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateNaissance">Date de naissance</Label>
                    <Input
                      id="dateNaissance"
                      name="dateNaissance"
                      type="date"
                      value={formData.dateNaissance}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numeroCNI">Numéro CNI</Label>
                    <Input
                      id="numeroCNI"
                      name="numeroCNI"
                      value={formData.numeroCNI}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="raisonSociale">Raison sociale *</Label>
                  <Input
                    id="raisonSociale"
                    name="raisonSociale"
                    value={formData.raisonSociale}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="formeJuridique">Forme juridique</Label>
                    <Select
                      value={formData.formeJuridique}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, formeJuridique: value as FormeJuridique }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SARL">SARL</SelectItem>
                        <SelectItem value="SA">SA</SelectItem>
                        <SelectItem value="SPRL">SPRL</SelectItem>
                        <SelectItem value="SNC">SNC</SelectItem>
                        <SelectItem value="Autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numeroRCCM">Numéro RCCM</Label>
                    <Input
                      id="numeroRCCM"
                      name="numeroRCCM"
                      value={formData.numeroRCCM}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Représentant légal *</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      name="representantNom"
                      placeholder="Nom"
                      value={formData.representantNom}
                      onChange={handleChange}
                      required
                    />
                    <Input
                      name="representantPrenom"
                      placeholder="Prénom"
                      value={formData.representantPrenom}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="representantFonction">Fonction du représentant</Label>
                  <Input
                    id="representantFonction"
                    name="representantFonction"
                    value={formData.representantFonction}
                    onChange={handleChange}
                    placeholder="Gérant, PDG, Directeur..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numeroImpot">Numéro fiscal</Label>
                  <Input
                    id="numeroImpot"
                    name="numeroImpot"
                    value={formData.numeroImpot}
                    onChange={handleChange}
                    placeholder="A1234567Z"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numeroIdNat">Numéro ID Nationale</Label>
                  <Input
                    id="numeroIdNat"
                    name="numeroIdNat"
                    value={formData.numeroIdNat}
                    onChange={handleChange}
                    placeholder="ID-NAT-123456"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-semibold">Siège social</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adresseSiege">Adresse du siège</Label>
                      <Input
                        id="adresseSiege"
                        name="adresseSiege"
                        value={formData.adresseSiege}
                        onChange={handleChange}
                        placeholder="123 Avenue..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="villeSiege">Ville du siège</Label>
                      <Input
                        id="villeSiege"
                        name="villeSiege"
                        value={formData.villeSiege}
                        onChange={handleChange}
                        placeholder="Kinshasa"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Champs communs */}
            <div className="space-y-4 pt-4 border-t">
              {/* Sélection des services */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Services proposés *</Label>
                <p className="text-sm text-muted-foreground">
                  Sélectionnez tous les services que vous proposez (minimum 1)
                </p>
                {loadingProfessions ? (
                  <div className="text-center py-4">
                    <span className="text-sm text-muted-foreground">Chargement des services...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-2 border rounded-lg">
                    {professions.map((profession) => (
                      <div key={profession.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`service-${profession.id}`}
                          checked={selectedServices.includes(profession.nom)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedServices(prev => [...prev, profession.nom]);
                            } else {
                              setSelectedServices(prev => prev.filter(s => s !== profession.nom));
                            }
                          }}
                        />
                        <Label
                          htmlFor={`service-${profession.id}`}
                          className="text-sm font-normal cursor-pointer flex items-center gap-1"
                        >
                          {profession.icone && <span>{profession.icone}</span>}
                          <span>{profession.nom}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
                {selectedServices.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedServices.map((service, index) => (
                      <Badge key={service} variant={index === 0 ? "default" : "secondary"}>
                        {service}
                        {index === 0 && " (Principal)"}
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Le premier service sélectionné sera votre service principal
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experience">Années d'expérience</Label>
                  <Input
                    id="experience"
                    name="experience"
                    type="number"
                    value={formData.experience}
                    onChange={handleChange}
                    placeholder="Ex: 5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ville *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="pl-10"
                      placeholder="Kinshasa"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="pl-10"
                      placeholder="+243 XXX XXX XXX"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <FileText className="w-16 h-16 mx-auto mb-4 text-secondary" />
              <h3 className="text-2xl font-bold mb-2">Description</h3>
              <p className="text-muted-foreground">
                Présentez-vous et décrivez vos compétences
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Présentation professionnelle</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Décrivez brièvement votre expérience, vos compétences et ce qui vous distingue..."
                rows={8}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">
                Cette description sera visible par les clients potentiels
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Upload className="w-16 h-16 mx-auto mb-4 text-secondary" />
              <h3 className="text-2xl font-bold mb-2">Mes documents</h3>
              <p className="text-muted-foreground">
                Ajoutez vos documents professionnels (optionnel)
              </p>
            </div>

            <div className="space-y-4">
              {/* Document d'identité */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Label htmlFor="idDocument" className="text-base font-semibold">
                      📄 Document d'identité (CNI / Passeport)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Carte d'identité nationale ou passeport (recto-verso)
                    </p>
                    <div className="flex items-center gap-3">
                      <Input
                        id="idDocument"
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
                            setIdDocument(file);
                            toast.success(`Document "${file.name}" sélectionné`);
                          }
                        }}
                        className="cursor-pointer"
                      />
                    </div>
                    {idDocument && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700 dark:text-green-300">
                          {idDocument.name} ({(idDocument.size / 1024).toFixed(0)} KB)
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIdDocument(null);
                            const input = document.getElementById('idDocument') as HTMLInputElement;
                            if (input) input.value = "";
                          }}
                          className="ml-auto h-6 w-6 p-0"
                        >
                          ✕
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Document de qualification */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Label htmlFor="qualificationDoc" className="text-base font-semibold">
                      🎓 Document de qualification
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Diplôme, certificat professionnel, attestation de formation
                    </p>
                    <div className="flex items-center gap-3">
                      <Input
                        id="qualificationDoc"
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
                            setQualificationDoc(file);
                            toast.success(`Document "${file.name}" sélectionné`);
                          }
                        }}
                        className="cursor-pointer"
                      />
                    </div>
                    {qualificationDoc && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700 dark:text-green-300">
                          {qualificationDoc.name} ({(qualificationDoc.size / 1024).toFixed(0)} KB)
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setQualificationDoc(null);
                            const input = document.getElementById('qualificationDoc') as HTMLInputElement;
                            if (input) input.value = "";
                          }}
                          className="ml-auto h-6 w-6 p-0"
                        >
                          ✕
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Info */}
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-blue-600">💡</span>
                    </div>
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <p className="font-medium mb-1">Informations</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Les documents sont optionnels mais recommandés</li>
                        <li>• Formats acceptés : JPG, PNG, PDF</li>
                        <li>• Taille maximale : 5 MB par fichier</li>
                        <li>• Vous pourrez ajouter d'autres documents plus tard</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <h3 className="text-2xl font-bold mb-2">Récapitulatif</h3>
              <p className="text-muted-foreground">
                Vérifiez toutes vos informations avant de soumettre
              </p>
            </div>

            {/* Type de prestataire */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Type de prestataire</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {typePrestataire === 'physique' ? '👤' : '🏢'}
                  </span>
                  <div>
                    <p className="font-semibold">
                      {typePrestataire === 'physique' ? 'Personne Physique' : 'Personne Morale'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {typePrestataire === 'physique' ? 'Individu' : 'Entreprise'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informations personnelles/entreprise */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {typePrestataire === 'physique' ? 'Informations personnelles' : 'Informations de l\'entreprise'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {typePrestataire === 'physique' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-xs">Prénom</Label>
                        <p className="font-medium">{formData.prenom || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Nom</Label>
                        <p className="font-medium">{formData.nom || '-'}</p>
                      </div>
                    </div>
                    {formData.dateNaissance && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Date de naissance</Label>
                        <p className="font-medium">{new Date(formData.dateNaissance).toLocaleDateString('fr-FR')}</p>
                      </div>
                    )}
                    {formData.numeroCNI && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Numéro CNI</Label>
                        <p className="font-medium">{formData.numeroCNI}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-muted-foreground text-xs">Raison sociale</Label>
                      <p className="font-medium">{formData.raisonSociale || '-'}</p>
                    </div>
                    {formData.formeJuridique && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Forme juridique</Label>
                        <p className="font-medium">{formData.formeJuridique}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {formData.numeroRCCM && (
                        <div>
                          <Label className="text-muted-foreground text-xs">Numéro RCCM</Label>
                          <p className="font-medium text-sm">{formData.numeroRCCM}</p>
                        </div>
                      )}
                      {formData.numeroImpot && (
                        <div>
                          <Label className="text-muted-foreground text-xs">Numéro fiscal</Label>
                          <p className="font-medium text-sm">{formData.numeroImpot}</p>
                        </div>
                      )}
                    </div>
                    {formData.numeroIdNat && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Numéro ID Nationale</Label>
                        <p className="font-medium text-sm">{formData.numeroIdNat}</p>
                      </div>
                    )}
                    {formData.representantNom && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Représentant légal</Label>
                        <p className="font-medium">
                          {formData.representantPrenom} {formData.representantNom}
                          {formData.representantFonction && ` - ${formData.representantFonction}`}
                        </p>
                      </div>
                    )}
                    {(formData.adresseSiege || formData.villeSiege) && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Siège social</Label>
                        <p className="font-medium text-sm">
                          {formData.adresseSiege && <span>{formData.adresseSiege}</span>}
                          {formData.adresseSiege && formData.villeSiege && <span>, </span>}
                          {formData.villeSiege && <span>{formData.villeSiege}</span>}
                          {(formData.adresseSiege || formData.villeSiege) && <span>, RDC</span>}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Services et informations professionnelles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations professionnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-muted-foreground text-xs">Services proposés</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedServices.map((service, index) => (
                      <Badge key={service} variant={index === 0 ? "default" : "secondary"}>
                        {service}
                        {index === 0 && " ⭐"}
                      </Badge>
                    ))}
                    {selectedServices.length === 0 && <p className="text-sm text-muted-foreground">Aucun service sélectionné</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Ville</Label>
                    <p className="font-medium">{formData.city || '-'}</p>
                  </div>
                  {formData.experience && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Expérience</Label>
                      <p className="font-medium">{formData.experience} ans</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Téléphone</Label>
                  <p className="font-medium">{formData.phone || '-'}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Email</Label>
                  <p className="font-medium">{formData.email || '-'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {formData.bio && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {formData.bio}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Documents */}
            {(idDocument || qualificationDoc) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Documents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {idDocument && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Document d'identité : {idDocument.name}</span>
                    </div>
                  )}
                  {qualificationDoc && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Document de qualification : {qualificationDoc.name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Info validation */}
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <CardContent className="pt-6">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  ℹ️ Après la soumission, votre profil sera vérifié par un administrateur. 
                  Vous recevrez une notification une fois votre compte validé (généralement sous 24-48h).
                </p>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle>Compléter mon profil</CardTitle>
            <Badge variant="secondary">
              Étape {currentStep} sur {totalSteps}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {renderStepContent()}

        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1 || loading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Précédent
          </Button>

          {currentStep < totalSteps ? (
            <Button onClick={handleNext} disabled={loading}>
              Suivant
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} variant="default">
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  {uploadingFiles ? "Upload des documents..." : "Soumission..."}
                </>
              ) : (
                <>
                  Soumettre mon profil
                  <CheckCircle className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCompletionSteps;
