import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate("/inscription/client");
      return;
    }

    // Timer pour renvoyer OTP
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer, email, navigate]);

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast.error("Veuillez entrer un code OTP valide (6 chiffres)");
      return;
    }

    try {
      setLoading(true);

      const { error, data } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (error) throw error;

      // Créer le profil prestataire après vérification OTP
      if (data?.user?.id) {
        const userRole = data.user.user_metadata?.role;
        
        if (userRole === "prestataire") {
          // Créer le profil prestataire
          const { error: profileError } = await supabase
            .from("prestataires")
            .insert([
              {
                user_id: data.user.id,
                full_name: data.user.user_metadata?.full_name || email.split("@")[0],
                profession: data.user.user_metadata?.profession || "",
                bio: "",
                rating: 0,
                verified: false,
                documents_verified: false,
              }
            ]);

          if (profileError) {
            console.warn("Profile creation warning:", profileError);
          }
        } else if (userRole === "client") {
          // Créer le profil client
          const { error: profileError } = await supabase
            .from("clients")
            .insert([
              {
                user_id: data.user.id,
                full_name: data.user.user_metadata?.full_name || email.split("@")[0],
                address: "",
                city: "",
                verified: false,
              }
            ]);

          if (profileError) {
            console.warn("Profile creation warning:", profileError);
          }
        }
      }

      toast.success("Email vérifié avec succès !");
      navigate("/connexion");
    } catch (error: any) {
      toast.error(error.message || "Code OTP invalide");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setResendLoading(true);

      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) throw error;

      toast.success("Code OTP renvoyé !");
      setTimer(60);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi du code");
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return null;
  }

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
              Vérifier votre email
            </h1>
            <p className="text-muted-foreground">
              Nous avons envoyé un code OTP à <strong>{email}</strong>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            {/* OTP Input */}
            <div className="space-y-2">
              <Label htmlFor="otp">Code OTP (6 chiffres)</Label>
              <Input
                id="otp"
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="h-12 text-center text-2xl tracking-widest font-mono"
                maxLength={6}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Entrez le code à 6 chiffres reçu par email
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              className="w-full group"
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Vérification..." : "Vérifier"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          {/* Resend OTP */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Vous n'avez pas reçu le code ?
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleResendOTP}
              disabled={timer > 0 || resendLoading}
              className="w-full"
            >
              {resendLoading ? "Envoi en cours..." : timer > 0 ? `Renvoyer dans ${timer}s` : "Renvoyer le code"}
            </Button>
          </div>

          {/* Back to Login */}
          <p className="mt-6 text-center text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <Link to="/connexion" className="text-secondary font-medium hover:underline">
              Se connecter
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
            Sécurisez votre compte
          </h2>
          <p className="text-primary-foreground/70">
            Vérifiez votre email avec le code OTP pour activer votre compte KaziPro.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
