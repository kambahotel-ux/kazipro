import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench, ArrowRight } from "lucide-react";
import { otpApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { defaultDashboardForRole, resolveUserRoleSafe } from "@/lib/user-role";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const email = location.state?.email as string | undefined;
  const purpose = (location.state?.purpose as "register" | "login") ?? "login";

  useEffect(() => {
    if (!email) {
      navigate("/inscription/client");
      return;
    }

    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
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

      const response =
        purpose === "register"
          ? await otpApi.register({
              channel: "email",
              email,
              code: otp,
              role: location.state?.role ?? "client",
            })
          : await otpApi.login({
              channel: "email",
              email,
              code: otp,
            });

      const appUser = (response.user ?? (await refreshUser())) as Awaited<ReturnType<typeof refreshUser>>;
      const role = appUser ? await resolveUserRoleSafe(appUser) : null;

      toast.success("Connexion réussie !");
      navigate(role ? defaultDashboardForRole(role) : "/connexion");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Code OTP invalide");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) return;
    try {
      setResendLoading(true);
      await otpApi.send({
        channel: "email",
        purpose: purpose === "register" ? "register" : "login",
        email,
      });
      toast.success("Code OTP renvoyé !");
      setTimer(60);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'envoi du code");
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-md">
              <Wrench className="w-5 h-5 text-secondary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">
              Kazi<span className="text-secondary">Pro</span>
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground mb-2">
              Vérifier votre email
            </h1>
            <p className="text-muted-foreground">
              Nous avons envoyé un code OTP à <strong>{email}</strong>
            </p>
          </div>

          <form onSubmit={handleVerifyOTP} className="space-y-6">
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
            </div>

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

          <div className="mt-6 text-center">
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

          <p className="mt-6 text-center text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <Link to="/connexion" className="text-secondary font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
