import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, Mail, Lock, ArrowRight, ArrowLeft, Eye, EyeOff, User, Briefcase, MapPin, Upload, FileText, CheckCircle, Building2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { TypePrestataire, FormeJuridique } from "@/types/prestataire";

const RegisterProviderSteps = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [typePrestataire, setTypePrestataire] = useState<TypePrestataire>('physique');
  const [professions, setProfessions] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<Array<{
    service: string;
    niveau: string;
    experience: number;
  }>>([]);
  
  // Données du formulaire
  const [formData, setFormData] = useState({
    // Champs communs
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    profession: "", // Service principal
    city: "",
    experience: "",
    phone: "",
    bio: "",
    
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

  // Documents uploadés
  const [documents, setDocuments] = useState({
    idDocument: null as File | null, // Carte d'électeur ou Passeport
    qualification: null as File | null, // Attestation, Diplôme, Certificat
  });

  // Charger les professions depuis la base de données
  useEffect(() => {
    const fetchProfessions = async () => {
      try {
        const { data, error } = await supabase
          .from("professions")
          .select("nom")
          .eq("actif", true)
          .order("nom");

        if (error) throw error;
        setProfessions(data?.map(p => p.nom) || []);
      } catch (error) {
        console.error("Erreur chargement professions:", error);
        // Fallback sur les professions par défaut si erreur
        setProfessions([
          "Électricien",
          "Plombier",
          "Menuisier",
          "Peintre",
          "Maçon",
          "Carreleur",
          "Climatisation",
          "Mécanique automobile",
          "Informatique",
        ]);
      }
    };

    fetchProfessions();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, docType: keyof typeof documents) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Le fichier est trop volumineux (max 5MB)");
        return;
      }
      setDocuments(prev => ({ ...prev, [docType]: file }));
      toast.success(`${file.name} ajouté`);
    }
  };

  const toggleService = (service: string) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.service === service);
      if (exists) {
        return prev.filter(s => s.service !== service);
      } else {
        return [...prev, { service, niveau: 'intermediaire', experience: parseInt(formData.experience) || 0 }];
      }
    });
  };

  const updateServiceDetails = (service: string, field: 'niveau' | 'experience', value: string | number) => {
    setSelectedServices(prev => prev.map(s => 
      s.service === service ? { ...s, [field]: value } : s
    ));
  };

  const validateStep1 = () => {
    // Validation commune
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Email invalide");
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return false;
    }
    
    // Validation selon le type
    if (typePrestataire === 'physique') {
      if (!formData.nom.trim() || !formData.prenom.trim()) {
        toast.error("Le nom et le prénom sont requis");
        return false;
      }
    } else {
      if (!formData.raisonSociale.trim()) {
        toast.error("La raison sociale est requise");
        return false;
      }
      if (!formData.representantNom.trim()) {
        toast.error("Le nom du représentant légal est requis");
        return false;
      }
    }
    
    if (selectedServices.length === 0) {
      toast.error("Sélectionnez au moins un service");
      return false;
    }
    if (!formData.profession.trim()) {
      toast.error("Sélectionnez votre service principal");
      return false;
    }
    if (!formData.city.trim()) {
      toast.error("La ville est requise");
      return false;
    }
    if (!formData.experience) {
      toast.error("L'expérience est requise");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!documents.idDocument) {
      toast.error("La carte d'électeur ou le passeport est requis");
      return false;
    }
    if (!documents.qualification) {
      toast.error("Un document prouvant votre qualification est requis (attestation, diplôme ou certificat)");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) return;

    try {
      setLoading(true);

      // Déterminer le nom complet selon le type
      const fullName = typePrestataire === 'physique' 
        ? `${formData.prenom} ${formData.nom}`
        : formData.raisonSociale;

      // Créer le compte
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: "prestataire",
            full_name: fullName,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erreur lors de la création du compte");

      await new Promise(resolve => setTimeout(resolve, 500));

      // Upload des documents vers Supabase Storage
      let idDocumentUrl = null;
      let qualificationUrl = null;

      if (documents.idDocument) {
        const idFileName = `${authData.user.id}/id-document-${Date.now()}.${documents.idDocument.name.split('.').pop()}`;
        const { data: idUpload, error: idError } = await supabase.storage
          .from('provider-documents')
          .upload(idFileName, documents.idDocument);

        if (idError) {
          console.error("Erreur upload document d'identité:", idError);
          toast.error("Erreur lors de l'upload du document d'identité");
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('provider-documents')
            .getPublicUrl(idFileName);
          idDocumentUrl = publicUrl;
        }
      }

      if (documents.qualification) {
        const qualFileName = `${authData.user.id}/qualification-${Date.now()}.${documents.qualification.name.split('.').pop()}`;
        const { data: qualUpload, error: qualError } = await supabase.storage
          .from('provider-documents')
          .upload(qualFileName, documents.qualification);

        if (qualError) {
          console.error("Erreur upload qualification:", qualError);
          toast.error("Erreur lors de l'upload du document de qualification");
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('provider-documents')
            .getPublicUrl(qualFileName);
          qualificationUrl = publicUrl;
        }
      }

      // Préparer les données du profil
      const prestataireData: any = {
        user_id: authData.user.id,
        type_prestataire: typePrestataire,
        full_name: fullName,
        profession: formData.profession,
        bio: formData.bio || `Prestataire ${formData.profession} avec ${formData.experience} ans d'expérience à ${formData.city}`,
        email: formData.email,
        rating: 0,
        verified: false,
        documents_verified: false,
        id_document_url: idDocumentUrl,
        qualification_url: qualificationUrl,
        experience_years: parseInt(formData.experience) || 0,
      };

      // Ajouter les champs spécifiques selon le type
      if (typePrestataire === 'physique') {
        prestataireData.nom = formData.nom;
        prestataireData.prenom = formData.prenom;
        prestataireData.date_naissance = formData.dateNaissance || null;
        prestataireData.numero_cni = formData.numeroCNI || null;
      } else {
        prestataireData.raison_sociale = formData.raisonSociale;
        prestataireData.forme_juridique = formData.formeJuridique || null;
        prestataireData.numero_rccm = formData.numeroRCCM || null;
        prestataireData.numero_impot = formData.numeroImpot || null;
        prestataireData.numero_id_nat = formData.numeroIdNat || null;
        prestataireData.representant_legal_nom = formData.representantNom;
        prestataireData.representant_legal_prenom = formData.representantPrenom || null;
        prestataireData.representant_legal_fonction = formData.representantFonction || null;
        prestataireData.adresse_siege = formData.adresseSiege || null;
        prestataireData.ville_siege = formData.villeSiege || null;
        prestataireData.pays_siege = 'RDC';
      }

      // Afficher les données qui vont être envoyées (pour debug)
      console.log("📤 Données prestataire à envoyer:", prestataireData);

      // Créer le profil avec les URLs des documents
      const { data: profileData, error: profileError } = await supabase
        .from("prestataires")
        .insert(prestataireData)
        .select()
        .single();

      if (profileError) {
        console.error("Erreur création profil:", profileError);
        toast.error("Compte créé mais erreur lors de la création du profil");
      }

      // Créer les entrées de services multiples
      if (profileData && selectedServices.length > 0) {
        const servicesData = selectedServices.map(s => ({
          prestataire_id: profileData.id,
          service: s.service,
          niveau_competence: s.niveau,
          annees_experience: s.experience,
          principal: s.service === formData.profession,
        }));

        const { error: servicesError } = await supabase
          .from("prestataire_services")
          .insert(servicesData);

        if (servicesError) {
          console.error("Erreur création services:", servicesError);
          toast.error("Profil créé mais erreur lors de l'ajout des services");
        } else {
          toast.success(`${selectedServices.length} service(s) ajouté(s) à votre profil`);
        }
      }

      if (idDocumentUrl && qualificationUrl) {
        toast.success("Documents uploadés avec succès!");
      }

      toast.success("Inscription réussie ! Redirection...");
      setTimeout(() => {
        navigate("/prestataire/en-attente");
      }, 1500);

    } catch (error: any) {
      console.error("Erreur inscription:", error);
      toast.error(error.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-muted/30 flex overflow-hidden">
      {/* Left Side - Form */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-2xl">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-md">
                <Wrench className="w-5 h-5 text-secondary-foreground" />
              </div>
              <span className="font-display font-bold text-xl text-foreground">
                Kazi<span className="text-secondary">Pro</span>
              </span>
            </Link>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground mb-2">
                Créer un compte prestataire
              </h1>
              <p className="text-muted-foreground">
              Étape {currentStep} sur 3
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${currentStep >= 1 ? 'text-secondary font-medium' : 'text-muted-foreground'}`}>
                Informations
              </span>
              <span className={`text-sm ${currentStep >= 2 ? 'text-secondary font-medium' : 'text-muted-foreground'}`}>
                Documents
              </span>
              <span className={`text-sm ${currentStep >= 3 ? 'text-secondary font-medium' : 'text-muted-foreground'}`}>
                Révision
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-secondary transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Step 1: Informations */}
          {currentStep === 1 && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                {/* Type de prestataire */}
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg mb-6">
                  <Label>Type de prestataire</Label>
                  <RadioGroup value={typePrestataire} onValueChange={(value) => setTypePrestataire(value as TypePrestataire)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="physique" id="physique" />
                      <Label htmlFor="physique" className="cursor-pointer font-normal">
                        👤 Personne Physique (Individu)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="morale" id="morale" />
                      <Label htmlFor="morale" className="cursor-pointer font-normal">
                        🏢 Personne Morale (Entreprise)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Champs selon le type */}
                {typePrestataire === 'physique' ? (
                  // PERSONNE PHYSIQUE
                  <div className="space-y-4 p-4 border-2 border-blue-200 rounded-lg bg-blue-50/50 mb-4">
                    <h3 className="font-semibold text-sm text-blue-900">Informations personnelles</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="prenom">Prénom *</Label>
                        <Input
                          id="prenom"
                          name="prenom"
                          placeholder="Jean"
                          value={formData.prenom}
                          onChange={handleChange}
                          className="h-12"
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nom">Nom *</Label>
                        <Input
                          id="nom"
                          name="nom"
                          placeholder="Kabongo"
                          value={formData.nom}
                          onChange={handleChange}
                          className="h-12"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateNaissance">Date de naissance</Label>
                      <Input
                        id="dateNaissance"
                        name="dateNaissance"
                        type="date"
                        value={formData.dateNaissance}
                        onChange={handleChange}
                        className="h-12"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="numeroCNI">Numéro CNI / Passeport</Label>
                      <Input
                        id="numeroCNI"
                        name="numeroCNI"
                        placeholder="1234567890"
                        value={formData.numeroCNI}
                        onChange={handleChange}
                        className="h-12"
                        disabled={loading}
                      />
                    </div>
                  </div>
                ) : (
                  // PERSONNE MORALE
                  <div className="space-y-4 p-4 border-2 border-green-200 rounded-lg bg-green-50/50 mb-4">
                    <h3 className="font-semibold text-sm text-green-900">Informations de l'entreprise</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="raisonSociale">Raison sociale *</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="raisonSociale"
                          name="raisonSociale"
                          placeholder="SARL BATIMENT PLUS"
                          value={formData.raisonSociale}
                          onChange={handleChange}
                          className="pl-10 h-12"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="formeJuridique">Forme juridique</Label>
                      <Select value={formData.formeJuridique} onValueChange={(value) => setFormData(prev => ({ ...prev, formeJuridique: value as FormeJuridique }))}>
                        <SelectTrigger className="h-12">
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
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="numeroRCCM">Numéro RCCM</Label>
                        <Input
                          id="numeroRCCM"
                          name="numeroRCCM"
                          placeholder="CD/KIN/RCCM/..."
                          value={formData.numeroRCCM}
                          onChange={handleChange}
                          className="h-12"
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="numeroImpot">Numéro fiscal</Label>
                        <Input
                          id="numeroImpot"
                          name="numeroImpot"
                          placeholder="A1234567Z"
                          value={formData.numeroImpot}
                          onChange={handleChange}
                          className="h-12"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="numeroIdNat">Numéro ID Nationale</Label>
                      <Input
                        id="numeroIdNat"
                        name="numeroIdNat"
                        placeholder="ID-NAT-123456"
                        value={formData.numeroIdNat}
                        onChange={handleChange}
                        className="h-12"
                        disabled={loading}
                      />
                    </div>

                    <h4 className="font-semibold text-sm text-green-900 mt-4">Représentant légal</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="representantNom">Nom *</Label>
                        <Input
                          id="representantNom"
                          name="representantNom"
                          placeholder="Mukendi"
                          value={formData.representantNom}
                          onChange={handleChange}
                          className="h-12"
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="representantPrenom">Prénom</Label>
                        <Input
                          id="representantPrenom"
                          name="representantPrenom"
                          placeholder="Pierre"
                          value={formData.representantPrenom}
                          onChange={handleChange}
                          className="h-12"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="representantFonction">Fonction</Label>
                      <Input
                        id="representantFonction"
                        name="representantFonction"
                        placeholder="Gérant, PDG, etc."
                        value={formData.representantFonction}
                        onChange={handleChange}
                        className="h-12"
                        disabled={loading}
                      />
                    </div>

                    <h4 className="font-semibold text-sm text-green-900 mt-4">Siège social</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="adresseSiege">Adresse</Label>
                      <Input
                        id="adresseSiege"
                        name="adresseSiege"
                        placeholder="123 Avenue de la Paix"
                        value={formData.adresseSiege}
                        onChange={handleChange}
                        className="h-12"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="villeSiege">Ville</Label>
                      <Input
                        id="villeSiege"
                        name="villeSiege"
                        placeholder="Kinshasa"
                        value={formData.villeSiege}
                        onChange={handleChange}
                        className="h-12"
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet * (pour le compte)</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder={typePrestataire === 'physique' ? "Jean Dupont" : "SARL BATIMENT PLUS"}
                      value={typePrestataire === 'physique' 
                        ? `${formData.prenom} ${formData.nom}`.trim()
                        : formData.raisonSociale
                      }
                      onChange={handleChange}
                      className="pl-10 h-12"
                      disabled={true}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ce champ est rempli automatiquement selon vos informations
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10 h-12"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min 6 caractères"
                        value={formData.password}
                        onChange={handleChange}
                        className="pl-10 pr-10 h-12"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirmer"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="pl-10 pr-10 h-12"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Services proposés * (sélectionnez tous vos services)</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {professions.map((prof) => {
                      const isSelected = selectedServices.some(s => s.service === prof);
                      return (
                        <button
                          key={prof}
                          type="button"
                          onClick={() => toggleService(prof)}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            isSelected
                              ? 'border-secondary bg-secondary/10 text-secondary'
                              : 'border-border hover:border-secondary/50'
                          }`}
                          disabled={loading}
                        >
                          {prof}
                        </button>
                      );
                    })}
                  </div>
                  {selectedServices.length > 0 && (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm font-medium mb-2">
                        {selectedServices.length} service(s) sélectionné(s)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedServices.map(s => (
                          <span key={s.service} className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded">
                            {s.service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profession">Service principal * (votre spécialité)</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none z-10" />
                    <select
                      id="profession"
                      name="profession"
                      value={formData.profession}
                      onChange={handleChange}
                      className="pl-10 h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      disabled={loading || selectedServices.length === 0}
                    >
                      <option value="">Sélectionnez votre service principal</option>
                      {selectedServices.map(s => (
                        <option key={s.service} value={s.service}>{s.service}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Choisissez parmi les services que vous avez sélectionnés ci-dessus
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="city"
                        name="city"
                        placeholder="Kinshasa"
                        value={formData.city}
                        onChange={handleChange}
                        className="pl-10 h-12"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience">Expérience (ans) *</Label>
                    <Input
                      id="experience"
                      name="experience"
                      type="number"
                      placeholder="5"
                      value={formData.experience}
                      onChange={handleChange}
                      className="h-12"
                      min="0"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio (optionnel)</Label>
                  <textarea
                    id="bio"
                    name="bio"
                    placeholder="Parlez-nous de vous et de votre expérience..."
                    value={formData.bio}
                    onChange={handleChange}
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={loading}
                  />
                </div>

                <Button
                  onClick={handleNextStep}
                  variant="secondary"
                  size="lg"
                  className="w-full group mt-6"
                  disabled={loading}
                >
                  Suivant
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Documents */}
          {currentStep === 2 && (
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg mb-4">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    📋 <strong>Documents requis:</strong> Vous devez fournir 2 documents obligatoires pour vérifier votre identité et vos qualifications.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="idDocument">
                      1. Carte d'électeur OU Passeport * 
                      <span className="text-xs text-muted-foreground ml-2">(PDF, JPG, PNG - Max 5MB)</span>
                    </Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-secondary transition-colors">
                      <input
                        id="idDocument"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, 'idDocument')}
                        className="hidden"
                        disabled={loading}
                      />
                      <label htmlFor="idDocument" className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {documents.idDocument ? (
                            <span className="text-secondary font-medium flex items-center justify-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              {documents.idDocument.name}
                            </span>
                          ) : (
                            <>
                              <span className="font-medium">Cliquez pour uploader votre carte d'électeur ou passeport</span>
                              <br />
                              <span className="text-xs">Document d'identité officiel requis</span>
                            </>
                          )}
                        </p>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="qualification">
                      2. Document de qualification * 
                      <span className="text-xs text-muted-foreground ml-2">(Attestation, Diplôme ou Certificat)</span>
                    </Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-secondary transition-colors">
                      <input
                        id="qualification"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, 'qualification')}
                        className="hidden"
                        disabled={loading}
                      />
                      <label htmlFor="qualification" className="cursor-pointer">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {documents.qualification ? (
                            <span className="text-secondary font-medium flex items-center justify-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              {documents.qualification.name}
                            </span>
                          ) : (
                            <>
                              <span className="font-medium">Cliquez pour uploader votre attestation, diplôme ou certificat</span>
                              <br />
                              <span className="text-xs">Preuve de vos compétences professionnelles</span>
                            </>
                          )}
                        </p>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
                  <p className="text-sm text-amber-900 dark:text-amber-100">
                    ⚠️ <strong>Important:</strong> Les deux documents sont obligatoires. Assurez-vous que les documents sont lisibles et à jour.
                  </p>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button
                    onClick={handlePrevStep}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    disabled={loading}
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Retour
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    variant="secondary"
                    size="lg"
                    className="flex-1 group"
                    disabled={loading}
                  >
                    Suivant
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Révision */}
          {currentStep === 3 && (
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Vérifiez vos informations</h3>
                  
                  {/* Type de prestataire */}
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Type de prestataire</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {typePrestataire === 'physique' ? '👤' : '🏢'}
                      </span>
                      <p className="font-medium">
                        {typePrestataire === 'physique' ? 'Personne Physique' : 'Personne Morale'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Informations selon le type */}
                  {typePrestataire === 'physique' ? (
                    // PERSONNE PHYSIQUE
                    <div className="bg-blue-50/50 p-4 rounded-lg space-y-3 border-2 border-blue-200">
                      <h4 className="font-semibold text-blue-900">Informations personnelles</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Prénom</p>
                          <p className="font-medium">{formData.prenom || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Nom</p>
                          <p className="font-medium">{formData.nom || '-'}</p>
                        </div>
                        {formData.dateNaissance && (
                          <div>
                            <p className="text-sm text-muted-foreground">Date de naissance</p>
                            <p className="font-medium">{new Date(formData.dateNaissance).toLocaleDateString('fr-FR')}</p>
                          </div>
                        )}
                        {formData.numeroCNI && (
                          <div>
                            <p className="text-sm text-muted-foreground">Numéro CNI</p>
                            <p className="font-medium">{formData.numeroCNI}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // PERSONNE MORALE
                    <div className="bg-green-50/50 p-4 rounded-lg space-y-4 border-2 border-green-200">
                      <div>
                        <h4 className="font-semibold text-green-900 mb-3">Informations de l'entreprise</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Raison sociale</p>
                            <p className="font-medium">{formData.raisonSociale || '-'}</p>
                          </div>
                          {formData.formeJuridique && (
                            <div>
                              <p className="text-sm text-muted-foreground">Forme juridique</p>
                              <p className="font-medium">{formData.formeJuridique}</p>
                            </div>
                          )}
                          {formData.numeroRCCM && (
                            <div>
                              <p className="text-sm text-muted-foreground">Numéro RCCM</p>
                              <p className="font-medium">{formData.numeroRCCM}</p>
                            </div>
                          )}
                          {formData.numeroImpot && (
                            <div>
                              <p className="text-sm text-muted-foreground">Numéro fiscal</p>
                              <p className="font-medium">{formData.numeroImpot}</p>
                            </div>
                          )}
                          {formData.numeroIdNat && (
                            <div>
                              <p className="text-sm text-muted-foreground">Numéro ID Nationale</p>
                              <p className="font-medium">{formData.numeroIdNat}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-green-900 mb-3">Représentant légal</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Nom</p>
                            <p className="font-medium">{formData.representantNom || '-'}</p>
                          </div>
                          {formData.representantPrenom && (
                            <div>
                              <p className="text-sm text-muted-foreground">Prénom</p>
                              <p className="font-medium">{formData.representantPrenom}</p>
                            </div>
                          )}
                          {formData.representantFonction && (
                            <div>
                              <p className="text-sm text-muted-foreground">Fonction</p>
                              <p className="font-medium">{formData.representantFonction}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {(formData.adresseSiege || formData.villeSiege) && (
                        <div>
                          <h4 className="font-semibold text-green-900 mb-3">Siège social</h4>
                          <div className="grid grid-cols-2 gap-4">
                            {formData.adresseSiege && (
                              <div>
                                <p className="text-sm text-muted-foreground">Adresse</p>
                                <p className="font-medium">{formData.adresseSiege}</p>
                              </div>
                            )}
                            {formData.villeSiege && (
                              <div>
                                <p className="text-sm text-muted-foreground">Ville</p>
                                <p className="font-medium">{formData.villeSiege}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Informations professionnelles */}
                  <div className="bg-muted p-4 rounded-lg space-y-3">
                    <h4 className="font-semibold">Informations professionnelles</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{formData.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Service principal</p>
                        <p className="font-medium">{formData.profession}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Ville</p>
                        <p className="font-medium">{formData.city}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Expérience</p>
                        <p className="font-medium">{formData.experience} ans</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Tous les services</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedServices.map(s => (
                          <span 
                            key={s.service} 
                            className={`text-xs px-3 py-1 rounded-full ${
                              s.service === formData.profession
                                ? 'bg-secondary text-secondary-foreground font-medium'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {s.service}
                            {s.service === formData.profession && ' (Principal)'}
                          </span>
                        ))}
                      </div>
                    </div>
                    {formData.bio && (
                      <div>
                        <p className="text-sm text-muted-foreground">Bio</p>
                        <p className="text-sm">{formData.bio}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Documents uploadés</h4>
                    <div className="space-y-2">
                      {documents.idDocument && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Carte d'électeur/Passeport: {documents.idDocument.name}</span>
                        </div>
                      )}
                      {documents.qualification && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Document de qualification: {documents.qualification.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      ℹ️ Votre compte sera vérifié par notre équipe avant activation. Vous recevrez une notification par email.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button
                    onClick={handlePrevStep}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    disabled={loading}
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Retour
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    variant="secondary"
                    size="lg"
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? "Inscription en cours..." : "Soumettre mon inscription"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Login Link */}
          <p className="mt-6 text-center text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <Link to="/connexion" className="text-secondary font-medium hover:underline">
              Se connecter
            </Link>
          </p>
          </div>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 bg-secondary rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-secondary rounded-full blur-3xl" />
        </div>
        
        <div className="relative text-primary-foreground text-center max-w-md">
          <h2 className="text-3xl font-display font-bold mb-4">
            Rejoignez KaziPro
          </h2>
          <p className="text-primary-foreground/70 mb-8">
            Inscription simple en 3 étapes. Commencez à recevoir des missions dès aujourd'hui.
          </p>
          <div className="space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold">1</span>
              </div>
              <div>
                <p className="font-medium">Vos informations</p>
                <p className="text-sm text-primary-foreground/70">Créez votre profil professionnel</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold">2</span>
              </div>
              <div>
                <p className="font-medium">Vos documents</p>
                <p className="text-sm text-primary-foreground/70">Carte d'électeur/Passeport + Qualification</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold">3</span>
              </div>
              <div>
                <p className="font-medium">Validation</p>
                <p className="text-sm text-primary-foreground/70">Vérification et activation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterProviderSteps;
