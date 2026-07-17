import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench, Mail, ArrowLeft } from "lucide-react";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await authApi.forgotPassword(email.trim());
      setSent(true);
      toast.success("Si le compte existe, un email a été envoyé.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Link to="/" className="flex items-center gap-2 justify-center">
          <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-md">
            <Wrench className="w-5 h-5 text-secondary-foreground" />
          </div>
          <span className="font-display font-bold text-xl">
            Kazi<span className="text-secondary">Pro</span>
          </span>
        </Link>

        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Mot de passe oublié</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Entrez votre email pour recevoir un lien de réinitialisation.
            </p>
          </div>

          {sent ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Vérifiez votre boîte mail ({email}). Le lien vous redirigera vers la page de
                réinitialisation.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/connexion">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à la connexion
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="votre@email.com"
                    disabled={loading}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Envoi…" : "Envoyer le lien"}
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to="/connexion">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Link>
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
