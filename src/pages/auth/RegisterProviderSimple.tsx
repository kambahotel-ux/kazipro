import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench, Mail, Lock, ArrowRight, Eye, EyeOff, User, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";

const RegisterProviderSimple = () => {
  const navigate = useNavigate();
  // const { signUp } = useAuth(); // Plus utilisé - on utilise directement supabase.auth.signUp
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    city: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Créer le compte Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { role: "prestataire" }
        }
      });
      
      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Erreur lors de la création du compte");
      }

      // Créer le profil prestataire avec profile_completed = false
      const { error: profileError } = await supabase
        .from("prestataires")
        .insert([
          {
            user_id: authData.user.id,
            email: formData.email,
            full_name: formData.fullName,
            city: formData.city || null,
            profession: "À définir",
            verified: false,
            profile_completed: false,
          }
        ]);
      
      if (profileError) {
        console.warn("Profile creation warning:", profileError);
      }
      
      toast.success("Compte créé avec succès ! Redirection vers votre dashboard...");
      // Redirection directe vers le dashboard
      navigate("/dashboard/prestataire");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

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
              Devenir prestataire
            </h1>
            <p className="text-muted-foreground">
              Créez votre compte et complétez votre profil ensuite
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

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city">Ville (optionnel)</Label>
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
              {loading ? "Inscription en cours..." : "Créer mon compte"}
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

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 Après l'inscription, vous pourrez compléter votre profil avec vos informations professionnelles
            </p>
          </div>

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
            Rejoignez notre réseau de professionnels
          </h2>
          <p className="text-primary-foreground/70 mb-6">
            Inscription rapide en 2 minutes. Complétez votre profil ensuite pour commencer à recevoir des opportunités.
          </p>
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                <span className="text-sm font-bold">1</span>
              </div>
              <span>Créez votre compte</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                <span className="text-sm font-bold">2</span>
              </div>
              <span>Complétez votre profil</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                <span className="text-sm font-bold">3</span>
              </div>
              <span>Recevez des opportunités</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterProviderSimple;
