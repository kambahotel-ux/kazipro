import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, User, Briefcase, MapPin, Building2, FileText, Phone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import type { TypePrestataire, FormeJuridique } from "@/types/prestataire";

const CompleterProfil = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [providerName, setProviderName] = useState("Prestataire");
  const [typePrestataire, setTypePrestataire] = useState<TypePrestataire>('physique');
  
  const [formData, setFormData] = useState({
    // Champs communs
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

  useEffect(() => {
    // Charger les données existantes du prestataire
    const loadProviderData = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("prestataires")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        if (data) {
          setProviderName(data.full_name || "Prestataire");
          setFormData({
            profession: data.profession || "",
            city: data.city || "",
            experience: data.experience_years?.toString() || "",
            phone: data.telephone || "",
            bio: data.bio || "",
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
        console.error("Erreur lors du chargement du profil:", error);
      }
    };

    loadProviderData();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
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
    if (!user) return;

    try {
      setLoading(true);

      const updateData: any = {
        type_prestataire: typePrestataire,
        profession: formData.profession,
        city: formData.city,
        experience_years: formData.experience ? parseInt(formData.experience) : null,
        telephone: formData.phone,
        bio: formData.bio || null,
        profile_completed: true,
        updated_at: new Date().toISOString(),
      };

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
      }

      const { error } = await supabase
        .from("prestataires")
        .update(updateData)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Profil complété avec succès !");
      navigate("/dashboard/prestataire");
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error(error.message || "Erreur lors de la mise à jour du profil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="prestataire" userName={providerName} userRole="Prestataire">
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Compléter mon profil</CardTitle>
            <CardDescription>
              Complétez votre profil pour accéder à toutes les fonctionnalités et commencer à recevoir des opportunités
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type de prestataire */}
              <div className="space-y-3">
                <Label>Type de prestataire *</Label>
                <RadioGroup
                  value={typePrestataire}
                  onValueChange={(value) => setTypePrestataire(value as TypePrestataire)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="physique" id="physique" />
                    <Label htmlFor="physique" className="cursor-pointer">Personne physique</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="morale" id="morale" />
                    <Label htmlFor="morale" className="cursor-pointer">Personne morale</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Champs selon le type */}
              {typePrestataire === 'physique' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nom">Nom *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="nom"
                          name="nom"
                          value={formData.nom}
                          onChange={handleChange}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prenom">Prénom *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="prenom"
                          name="prenom"
                          value={formData.prenom}
                          onChange={handleChange}
                          className="pl-10"
                          required
                        />
                      </div>
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
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="numeroCNI"
                          name="numeroCNI"
                          value={formData.numeroCNI}
                          onChange={handleChange}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="raisonSociale">Raison sociale *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="raisonSociale"
                        name="raisonSociale"
                        value={formData.raisonSociale}
                        onChange={handleChange}
                        className="pl-10"
                        required
                      />
                    </div>
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
                </div>
              )}

              {/* Champs communs */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profession">Profession *</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="profession"
                        name="profession"
                        value={formData.profession}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="Ex: Plombier, Électricien..."
                        required
                      />
                    </div>
                  </div>
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
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
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
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
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
                  <Label htmlFor="bio">Présentation (optionnel)</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Décrivez brièvement votre expérience et vos compétences..."
                    rows={4}
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="secondary"
                size="lg"
                className="w-full group"
                disabled={loading}
              >
                {loading ? "Enregistrement..." : "Enregistrer et activer mon profil"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CompleterProfil;
