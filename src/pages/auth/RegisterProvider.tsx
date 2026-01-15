import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench, Mail, Lock, ArrowRight, Eye, EyeOff, User, Briefcase, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const RegisterProvider = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    profession: "",
    city: "",
    experience: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error("Le nom complet est requis");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("L'email est requis");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Email invalide");
      return false;
    }
    if (!formData.password) {
      toast.error("Le mot de passe est requis");
      return false;
    }
    if (formData.password.length < 6) {
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
    if (!formData.experience) {
      toast.error("L'expérience est requise");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Créer le compte Supabase sans confirmation email
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: undefined, // Pas de redirection email
          data: {
            role: "prestataire",
            full_name: formData.fullName,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erreur lors de la création du compte");

      // Attendre un peu pour s'assurer que la session est établie
      await new Promise(resolve => setTimeout(resolve, 500));

      // Créer le profil prestataire immédiatement
      const { error: profileError } = await supabase
        .from("prestataires")
        .insert({
          user_id: authData.user.id,
          full_name: formData.fullName,
          profession: formData.profession,
          bio: `Prestataire ${formData.profession} avec ${formData.experience} ans d'expérience à ${formData.city}`,
          rating: 0,
          verified: false, // Sera vérifié par l'admin
          documents_verified: false,
          // Note: email sera ajouté automatiquement par un trigger après avoir créé la colonne
        });

      if (profileError) {
        console.error("Erreur création profil:", profileError);
        toast.error("Compte créé mais erreur lors de la création du profil. Contactez l'administrateur.");
        // Rediriger quand même vers la page d'attente
        setTimeout(() => {
          navigate("/prestataire/en-attente");
        }, 2000);
        return;
      }

      toast.success("Compte créé avec succès ! Redirection...");
      
      // Rediriger vers la page d'attente de vérification
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
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Jean Dupont"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="pl-10 h-12"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="profession">Profession</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <select
                  id="profession"
                  name="profession"
                  value={formData.profession}
                  onChange={handleChange}
                  className="pl-10 h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
              <Label htmlFor="city">Ville</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="city"
                  name="city"
                  type="text"
                  placeholder="Kinshasa"
                  value={formData.city}
                  onChange={handleChange}
                  className="pl-10 h-12"
                  required
                  disabled={loading}
                />
              </div>
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
                required
                disabled={loading}
              />
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
