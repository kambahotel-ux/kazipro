import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, Mail, Lock, ArrowRight, Eye, EyeOff, User, Briefcase, MapPin, Building2, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import type { TypePrestataire, FormeJuridique } from "@/types/prestataire";

const RegisterProvider = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [typePrestataire, setTypePrestataire] = useState<TypePrestataire>('physique');
  
  const [formData, setFormData] = useState({
    // Champs communs
    email: "",
    password: "",
    confirmPassword: "",
    profession: "",
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
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
    if (!formData.profession.trim()) {
      toast.error("La profession est requise");
      return false;
    }
    if (!formData.city.trim()) {
      toast.error("La ville est requise");
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error("Le téléphone est requis");
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
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Créer le compte Supabase
      const fullName = typePrestataire === 'physique' 
        ? `${formData.prenom} ${formData.nom}`
        : formData.raisonSociale;
        
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: undefined,
          data: {
            role: "prestataire",
            full_name: fullName,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erreur lors de la création du compte");

      await new Promise(resolve => setTimeout(resolve, 500));

      // Préparer les données selon le type
      const prestataireData: any = {
        user_id: authData.user.id,
        type_prestataire: typePrestataire,
        profession: formData.profession,
        bio: formData.bio || `Prestataire ${formData.profession} avec ${formData.experience || 0} ans d'expérience à ${formData.city}`,
        phone: formData.phone,
        email: formData.email,
        rating: 0,
        verified: false,
        documents_verified: false,
        full_name: fullName,
      };

      // Ajouter les champs spécifiques
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

      // Créer le profil prestataire
      const { error: profileError } = await supabase
        .from("prestataires")
        .insert(prestataireData);

      if (profileError) {
        console.error("Erreur création profil:", profileError);
        toast.error("Compte créé mais erreur lors de la création du profil. Contactez l'administrateur.");
        setTimeout(() => {
          navigate("/prestataire/en-attente");
        }, 2000);
        return;
      }

      toast.success("Compte créé avec succès ! Redirection...");
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

  const professions = [
    "Électricien",
    "Plombier",
    "Menuisier",
    "Peintre",
    "Maçon",
    "Carreleur",
    "Climatisation",
    "Mécanique automobile",
    "Informatique",
    "Autre",
  ];

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
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
              Rejoignez KaziPro et trouvez des clients
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type de prestataire */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
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
              <div className="space-y-4 p-4 border-2 border-blue-200 rounded-lg bg-blue-50/50">
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
                      required
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
                      required
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
              <div className="space-y-4 p-4 border-2 border-green-200 rounded-lg bg-green-50/50">
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
                      required
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
                      required
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

            {/* Champs communs */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Informations professionnelles</h3>
              
              {/* Email */}
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
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Profession */}
              <div className="space-y-2">
                <Label htmlFor="profession">Profession / Secteur d'activité *</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  <select
                    id="profession"
                    name="profession"
                    value={formData.profession}
                    onChange={handleChange}
                    className="pl-10 h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                    disabled={loading}
                  >
                    <option value="">Sélectionnez votre profession</option>
                    {professions.map(prof => (
                      <option key={prof} value={prof}>{prof}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* City */}
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
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+243 123 456 789"
                  value={formData.phone}
                  onChange={handleChange}
                  className="h-12"
                  required
                  disabled={loading}
                />
              </div>

              {/* Experience */}
              <div className="space-y-2">
                <Label htmlFor="experience">Années d'expérience</Label>
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

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Description</Label>
                <textarea
                  id="bio"
                  name="bio"
                  placeholder="Décrivez votre expérience et vos compétences..."
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 6 caractères"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 pr-10 h-12"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmez votre mot de passe"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10 pr-10 h-12"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              variant="secondary" 
              size="lg" 
              className="w-full group mt-6"
              disabled={loading}
            >
              {loading ? "Inscription en cours..." : "S'inscrire"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-muted-foreground">Ou continuer avec</span>
            </div>
          </div>

          {/* Google Auth Button */}
          <GoogleAuthButton mode="signup-provider" />

          {/* Login Link */}
          <p className="mt-6 text-center text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <Link to="/connexion" className="text-secondary font-medium hover:underline">
              Se connecter
            </Link>
          </p>

          {/* Register as Client Link */}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Vous êtes client ?{" "}
            <Link to="/inscription/client" className="text-secondary font-medium hover:underline">
              S'inscrire comme client
            </Link>
          </p>
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
            Développez votre activité
          </h2>
          <p className="text-primary-foreground/70">
            Rejoignez des milliers de prestataires qui gagnent leur vie grâce à KaziPro.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterProvider;
