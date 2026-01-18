// Exemple de formulaire d'inscription avec type de prestataire
// À intégrer dans votre page d'inscription prestataire

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

type TypePrestataire = 'physique' | 'morale';

export default function InscriptionPrestataireForm() {
  const [typePrestataire, setTypePrestataire] = useState<TypePrestataire>('physique');
  const [loading, setLoading] = useState(false);

  // Champs communs
  const [profession, setProfession] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Champs personne physique
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [numeroCNI, setNumeroCNI] = useState('');
  const [photoCNI, setPhotoCNI] = useState<File | null>(null);

  // Champs personne morale
  const [raisonSociale, setRaisonSociale] = useState('');
  const [formeJuridique, setFormeJuridique] = useState('');
  const [numeroRCCM, setNumeroRCCM] = useState('');
  const [numeroImpot, setNumeroImpot] = useState('');
  const [numeroIdNat, setNumeroIdNat] = useState('');
  const [representantNom, setRepresentantNom] = useState('');
  const [representantPrenom, setRepresentantPrenom] = useState('');
  const [representantFonction, setRepresentantFonction] = useState('');
  const [adresseSiege, setAdresseSiege] = useState('');
  const [villeSiege, setVilleSiege] = useState('');
  const [documentRCCM, setDocumentRCCM] = useState<File | null>(null);
  const [documentIdNat, setDocumentIdNat] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Créer le compte utilisateur
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: 'temporaryPassword123', // À remplacer par un vrai mot de passe
        options: {
          data: {
            role: 'prestataire'
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erreur lors de la création du compte');

      // 2. Uploader les documents si nécessaire
      let photoCNIUrl = null;
      let documentRCCMUrl = null;
      let documentIdNatUrl = null;

      if (typePrestataire === 'physique' && photoCNI) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('prestataire-documents')
          .upload(`${authData.user.id}/cni.${photoCNI.name.split('.').pop()}`, photoCNI);
        
        if (!uploadError) {
          photoCNIUrl = uploadData.path;
        }
      }

      if (typePrestataire === 'morale') {
        if (documentRCCM) {
          const { data: uploadData } = await supabase.storage
            .from('prestataire-documents')
            .upload(`${authData.user.id}/rccm.${documentRCCM.name.split('.').pop()}`, documentRCCM);
          if (uploadData) documentRCCMUrl = uploadData.path;
        }

        if (documentIdNat) {
          const { data: uploadData } = await supabase.storage
            .from('prestataire-documents')
            .upload(`${authData.user.id}/id_nat.${documentIdNat.name.split('.').pop()}`, documentIdNat);
          if (uploadData) documentIdNatUrl = uploadData.path;
        }
      }

      // 3. Créer le profil prestataire
      const prestataireData = {
        user_id: authData.user.id,
        type_prestataire: typePrestataire,
        profession,
        bio,
        phone,
        email,
        // Champs conditionnels
        ...(typePrestataire === 'physique' ? {
          nom,
          prenom,
          date_naissance: dateNaissance || null,
          numero_cni: numeroCNI || null,
          photo_cni: photoCNIUrl,
          full_name: `${prenom} ${nom}`
        } : {
          raison_sociale: raisonSociale,
          forme_juridique: formeJuridique || null,
          numero_rccm: numeroRCCM || null,
          numero_impot: numeroImpot || null,
          numero_id_nat: numeroIdNat || null,
          representant_legal_nom: representantNom,
          representant_legal_prenom: representantPrenom || null,
          representant_legal_fonction: representantFonction || null,
          adresse_siege: adresseSiege || null,
          ville_siege: villeSiege || null,
          pays_siege: 'RDC',
          document_rccm: documentRCCMUrl,
          document_id_nat: documentIdNatUrl,
          full_name: raisonSociale
        })
      };

      const { error: profileError } = await supabase
        .from('prestataires')
        .insert(prestataireData);

      if (profileError) throw profileError;

      toast.success('Inscription réussie ! Votre compte est en attente de vérification.');
      
      // Rediriger vers le dashboard
      window.location.href = '/dashboard/prestataire';

    } catch (error: any) {
      console.error('Erreur inscription:', error);
      toast.error(error.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Inscription Prestataire</CardTitle>
        <CardDescription>
          Créez votre compte professionnel sur KaziPro
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Type de prestataire */}
          <div className="space-y-3">
            <Label>Type de prestataire</Label>
            <RadioGroup value={typePrestataire} onValueChange={(value) => setTypePrestataire(value as TypePrestataire)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="physique" id="physique" />
                <Label htmlFor="physique" className="cursor-pointer">
                  👤 Personne Physique (Individu)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="morale" id="morale" />
                <Label htmlFor="morale" className="cursor-pointer">
                  🏢 Personne Morale (Entreprise)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Champs conditionnels selon le type */}
          {typePrestataire === 'physique' ? (
            // PERSONNE PHYSIQUE
            <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
              <h3 className="font-semibold text-lg">Informations personnelles</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prenom">Prénom *</Label>
                  <Input
                    id="prenom"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    required
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    required
                    placeholder="Kabongo"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="dateNaissance">Date de naissance</Label>
                <Input
                  id="dateNaissance"
                  type="date"
                  value={dateNaissance}
                  onChange={(e) => setDateNaissance(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="numeroCNI">Numéro CNI / Passeport</Label>
                <Input
                  id="numeroCNI"
                  value={numeroCNI}
                  onChange={(e) => setNumeroCNI(e.target.value)}
                  placeholder="1234567890"
                />
              </div>

              <div>
                <Label htmlFor="photoCNI">Photo CNI (recto-verso)</Label>
                <Input
                  id="photoCNI"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setPhotoCNI(e.target.files?.[0] || null)}
                />
              </div>
            </div>
          ) : (
            // PERSONNE MORALE
            <div className="space-y-4 p-4 border rounded-lg bg-green-50">
              <h3 className="font-semibold text-lg">Informations de l'entreprise</h3>
              
              <div>
                <Label htmlFor="raisonSociale">Raison sociale *</Label>
                <Input
                  id="raisonSociale"
                  value={raisonSociale}
                  onChange={(e) => setRaisonSociale(e.target.value)}
                  required
                  placeholder="SARL BATIMENT PLUS"
                />
              </div>

              <div>
                <Label htmlFor="formeJuridique">Forme juridique</Label>
                <Select value={formeJuridique} onValueChange={setFormeJuridique}>
                  <SelectTrigger>
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
                <div>
                  <Label htmlFor="numeroRCCM">Numéro RCCM</Label>
                  <Input
                    id="numeroRCCM"
                    value={numeroRCCM}
                    onChange={(e) => setNumeroRCCM(e.target.value)}
                    placeholder="CD/KIN/RCCM/12-A-12345"
                  />
                </div>
                <div>
                  <Label htmlFor="numeroImpot">Numéro fiscal</Label>
                  <Input
                    id="numeroImpot"
                    value={numeroImpot}
                    onChange={(e) => setNumeroImpot(e.target.value)}
                    placeholder="A1234567Z"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="numeroIdNat">Numéro ID Nationale</Label>
                <Input
                  id="numeroIdNat"
                  value={numeroIdNat}
                  onChange={(e) => setNumeroIdNat(e.target.value)}
                  placeholder="ID-NAT-123456"
                />
              </div>

              <h4 className="font-semibold mt-4">Représentant légal</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="representantNom">Nom *</Label>
                  <Input
                    id="representantNom"
                    value={representantNom}
                    onChange={(e) => setRepresentantNom(e.target.value)}
                    required
                    placeholder="Mukendi"
                  />
                </div>
                <div>
                  <Label htmlFor="representantPrenom">Prénom</Label>
                  <Input
                    id="representantPrenom"
                    value={representantPrenom}
                    onChange={(e) => setRepresentantPrenom(e.target.value)}
                    placeholder="Pierre"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="representantFonction">Fonction</Label>
                <Input
                  id="representantFonction"
                  value={representantFonction}
                  onChange={(e) => setRepresentantFonction(e.target.value)}
                  placeholder="Gérant, PDG, etc."
                />
              </div>

              <h4 className="font-semibold mt-4">Siège social</h4>
              
              <div>
                <Label htmlFor="adresseSiege">Adresse</Label>
                <Input
                  id="adresseSiege"
                  value={adresseSiege}
                  onChange={(e) => setAdresseSiege(e.target.value)}
                  placeholder="123 Avenue de la Paix"
                />
              </div>

              <div>
                <Label htmlFor="villeSiege">Ville</Label>
                <Input
                  id="villeSiege"
                  value={villeSiege}
                  onChange={(e) => setVilleSiege(e.target.value)}
                  placeholder="Kinshasa"
                />
              </div>

              <h4 className="font-semibold mt-4">Documents</h4>
              
              <div>
                <Label htmlFor="documentRCCM">Document RCCM</Label>
                <Input
                  id="documentRCCM"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setDocumentRCCM(e.target.files?.[0] || null)}
                />
              </div>

              <div>
                <Label htmlFor="documentIdNat">Document ID Nationale</Label>
                <Input
                  id="documentIdNat"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setDocumentIdNat(e.target.files?.[0] || null)}
                />
              </div>
            </div>
          )}

          {/* Champs communs */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Informations professionnelles</h3>
            
            <div>
              <Label htmlFor="profession">Profession / Secteur d'activité *</Label>
              <Input
                id="profession"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                required
                placeholder="Plombier, Construction, etc."
              />
            </div>

            <div>
              <Label htmlFor="bio">Description</Label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full min-h-[100px] p-2 border rounded-md"
                placeholder="Décrivez votre expérience et vos compétences..."
              />
            </div>

            <div>
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="+243 123 456 789"
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="contact@example.com"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Inscription en cours...' : 'S\'inscrire'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
