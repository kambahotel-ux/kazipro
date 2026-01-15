import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calculator, Send, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CreerDevisPage() {
  const { demandeId } = useParams<{ demandeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [demande, setDemande] = useState<any>(null);
  const [prestataire, setPrestataire] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Formulaire - Devise
  const [devise, setDevise] = useState('CDF');
  
  // Formulaire - Items/Articles
  const [items, setItems] = useState<Array<{
    id: string;
    designation: string;
    quantite: number;
    prix_unitaire: number;
    total: number;
  }>>([]);
  
  // Formulaire - Autres
  const [titre, setTitre] = useState('');
  const [fraisDeplacement, setFraisDeplacement] = useState('0');
  const [tva, setTva] = useState('16');
  const [description, setDescription] = useState('');
  const [delaiExecution, setDelaiExecution] = useState('');
  const [delaiIntervention, setDelaiIntervention] = useState('');
  const [garantie, setGarantie] = useState('');
  const [validiteDevis, setValiditeDevis] = useState('30');
  
  // Conditions de paiement
  const [acompteRequis, setAcompteRequis] = useState(false);
  const [pourcentageAcompte, setPourcentageAcompte] = useState('30');
  const [modalitesPaiement, setModalitesPaiement] = useState('');
  const [methodesAcceptees, setMethodesAcceptees] = useState<string[]>(['Mobile Money']);

  useEffect(() => {
    loadData();
  }, [demandeId, user]);

  const loadData = async () => {
    if (!demandeId || !user) return;

    try {
      setLoading(true);

      // Charger le prestataire
      const { data: prestataireData } = await supabase
        .from('prestataires')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setPrestataire(prestataireData);

      // Charger la demande
      const { data: demandeData, error } = await supabase
        .from('demandes')
        .select('*')
        .eq('id', demandeId)
        .maybeSingle();

      if (error) throw error;
      setDemande(demandeData);

      // Pré-remplir le titre et la description
      const titredemande = demandeData.title || demandeData.titre;
      setTitre(`Devis pour: ${titredemande}`);
      setDescription(`Je propose de réaliser les travaux suivants:\n- `);
      
      // Ajouter un item par défaut
      addItem();

    } catch (error) {
      console.error('Erreur chargement:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les informations',
        variant: 'destructive',
      });
      navigate('/dashboard/prestataire/opportunites');
    } finally {
      setLoading(false);
    }
  };

  // Gestion des items
  const addItem = () => {
    setItems([...items, {
      id: Date.now().toString(),
      designation: '',
      quantite: 1,
      prix_unitaire: 0,
      total: 0
    }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Recalculer le total
        if (field === 'quantite' || field === 'prix_unitaire') {
          updated.total = updated.quantite * updated.prix_unitaire;
        }
        return updated;
      }
      return item;
    }));
  };

  // Calculs automatiques basés sur les items
  const sousTotal = items.reduce((sum, item) => sum + item.total, 0);
  const montantHT = sousTotal + parseFloat(fraisDeplacement || '0');
  const montantTVA = montantHT * (parseFloat(tva) / 100);
  const montantTTC = montantHT + montantTVA;
  const montantAcompte = acompteRequis ? montantTTC * (parseFloat(pourcentageAcompte) / 100) : 0;
  const montantSolde = montantTTC - montantAcompte;

  const handleMethodeToggle = (methode: string) => {
    setMethodesAcceptees(prev =>
      prev.includes(methode)
        ? prev.filter(m => m !== methode)
        : [...prev, methode]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prestataire || !demande) return;

    // Validation
    if (!titre.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir un titre pour le devis',
        variant: 'destructive',
      });
      return;
    }

    if (items.length === 0 || items.every(item => !item.designation.trim())) {
      toast({
        title: 'Erreur',
        description: 'Veuillez ajouter au moins un article/service',
        variant: 'destructive',
      });
      return;
    }

    if (items.some(item => item.prix_unitaire <= 0 || item.quantite <= 0)) {
      toast({
        title: 'Erreur',
        description: 'Tous les articles doivent avoir un prix et une quantité valides',
        variant: 'destructive',
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir une description',
        variant: 'destructive',
      });
      return;
    }

    if (!delaiExecution || !delaiIntervention) {
      toast({
        title: 'Erreur',
        description: 'Veuillez renseigner les délais',
        variant: 'destructive',
      });
      return;
    }

    if (acompteRequis && methodesAcceptees.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner au moins une méthode de paiement',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      // Préparer les conditions de paiement
      const conditionsPaiement = {
        acompte_requis: acompteRequis,
        pourcentage_acompte: acompteRequis ? parseFloat(pourcentageAcompte) : 0,
        montant_acompte: montantAcompte,
        montant_solde: montantSolde,
        modalites: modalitesPaiement || (acompteRequis 
          ? `${pourcentageAcompte}% avant début des travaux, ${100 - parseFloat(pourcentageAcompte)}% après validation`
          : 'Paiement après validation des travaux'),
        methodes_acceptees: methodesAcceptees,
      };

      // Calculer la date d'expiration
      const dateExpiration = new Date();
      dateExpiration.setDate(dateExpiration.getDate() + parseInt(validiteDevis));

      // Créer le devis (le numéro sera auto-généré par le trigger SQL)
      const { data, error } = await supabase
        .from('devis')
        .insert({
          demande_id: demandeId,
          prestataire_id: prestataire.id,
          titre: titre, // ✅ Titre du devis
          amount: montantTTC,
          montant_ttc: montantTTC,
          montant_ht: montantHT,
          tva: parseFloat(tva),
          frais_deplacement: parseFloat(fraisDeplacement),
          devise: devise, // ✅ Devise dynamique
          description,
          delai_execution: delaiExecution,
          delai_intervention: delaiIntervention,
          garantie: garantie || null,
          validite_devis: dateExpiration.toISOString().split('T')[0],
          conditions_paiement: conditionsPaiement,
          status: 'pending',
          statut: 'en_attente',
        })
        .select()
        .single();

      if (error) throw error;

      // Insérer les items/articles du devis
      if (data && items.length > 0) {
        const itemsToInsert = items
          .filter(item => item.designation.trim()) // Filtrer les items vides
          .map(item => ({
            devis_id: data.id,
            designation: item.designation,
            quantite: item.quantite,
            prix_unitaire: item.prix_unitaire,
            montant: item.total,
          }));

        if (itemsToInsert.length > 0) {
          const { error: itemsError } = await supabase
            .from('devis_pro_items')
            .insert(itemsToInsert);

          if (itemsError) {
            console.error('Erreur insertion items:', itemsError);
            // Ne pas bloquer si erreur items, le devis est déjà créé
          }
        }
      }

      toast({
        title: 'Devis soumis!',
        description: 'Votre devis a été envoyé au client avec succès',
      });

      // Rediriger vers la liste des devis
      navigate('/dashboard/prestataire/devis');

    } catch (error: any) {
      console.error('Erreur soumission devis:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de soumettre le devis',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!demande) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Demande introuvable</h2>
        <Button onClick={() => navigate('/dashboard/prestataire/opportunites')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux opportunités
        </Button>
      </div>
    );
  }

  return (
    <DashboardLayout 
      role="prestataire" 
      userName={prestataire?.full_name || "Prestataire"} 
      userRole={prestataire?.profession || "Prestataire"}
    >
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate(`/dashboard/prestataire/demandes/${demandeId}`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <h1 className="text-3xl font-bold mt-2">Créer un devis</h1>
          <p className="text-muted-foreground">
            Pour: {demande.title || demande.titre}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
            <CardDescription>Titre et devise du devis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Titre */}
            <div className="space-y-2">
              <Label htmlFor="titre">Titre du devis *</Label>
              <Input
                id="titre"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Ex: Devis pour installation électrique"
                required
              />
            </div>

            {/* Devise */}
            <div className="space-y-2">
              <Label htmlFor="devise">Devise *</Label>
              <Select value={devise} onValueChange={setDevise}>
                <SelectTrigger id="devise">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CDF">Franc Congolais (CDF)</SelectItem>
                  <SelectItem value="USD">Dollar Américain (USD)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tarification */}
        <Card>
          <CardHeader>
            <CardTitle>Tarification</CardTitle>
            <CardDescription>Définissez vos tarifs pour cette prestation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Articles/Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Articles / Services *</Label>
                <Button type="button" size="sm" variant="outline" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter un article
                </Button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <p>Aucun article ajouté</p>
                  <p className="text-sm mt-1">Cliquez sur "Ajouter un article" pour commencer</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Article {index + 1}</span>
                        {items.length > 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-3 md:grid-cols-4">
                        <div className="md:col-span-2 space-y-2">
                          <Label>Désignation *</Label>
                          <Input
                            value={item.designation}
                            onChange={(e) => updateItem(item.id, 'designation', e.target.value)}
                            placeholder="Ex: Main d'œuvre, Matériaux..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Quantité *</Label>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantite}
                            onChange={(e) => updateItem(item.id, 'quantite', parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Prix unitaire ({devise}) *</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.prix_unitaire}
                            onChange={(e) => updateItem(item.id, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <span className="text-sm font-medium">
                          Total: {item.total.toLocaleString()} {devise}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Frais supplémentaires */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="fraisDeplacement">Frais de déplacement ({devise})</Label>
                <Input
                  id="fraisDeplacement"
                  type="number"
                  min="0"
                  step="0.01"
                  value={fraisDeplacement}
                  onChange={(e) => setFraisDeplacement(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tva">TVA (%)</Label>
                <Input
                  id="tva"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={tva}
                  onChange={(e) => setTva(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validiteDevis">Validité du devis (jours)</Label>
                <Input
                  id="validiteDevis"
                  type="number"
                  min="1"
                  value={validiteDevis}
                  onChange={(e) => setValiditeDevis(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            {/* Calculs automatiques */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sous-total articles:</span>
                <span className="font-medium">{sousTotal.toLocaleString()} {devise}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Frais de déplacement:</span>
                <span className="font-medium">{parseFloat(fraisDeplacement || '0').toLocaleString()} {devise}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Montant HT:</span>
                <span className="font-medium">{montantHT.toLocaleString()} {devise}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>TVA ({tva}%):</span>
                <span className="font-medium">{montantTVA.toLocaleString()} {devise}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Montant TTC:</span>
                <span className="text-primary">{montantTTC.toLocaleString()} {devise}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Description des travaux</CardTitle>
            <CardDescription>Décrivez en détail ce que vous proposez</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez les travaux à réaliser, les matériaux utilisés, la méthodologie..."
              rows={8}
              required
            />
          </CardContent>
        </Card>

        {/* Délais et garantie */}
        <Card>
          <CardHeader>
            <CardTitle>Délais et garantie</CardTitle>
            <CardDescription>Informations sur le planning et les garanties</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="delaiIntervention">Délai d'intervention *</Label>
                <Input
                  id="delaiIntervention"
                  value={delaiIntervention}
                  onChange={(e) => setDelaiIntervention(e.target.value)}
                  placeholder="Ex: 2 jours, Immédiat, 1 semaine"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Quand pouvez-vous commencer?
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delaiExecution">Durée des travaux *</Label>
                <Input
                  id="delaiExecution"
                  value={delaiExecution}
                  onChange={(e) => setDelaiExecution(e.target.value)}
                  placeholder="Ex: 3 jours, 1 semaine, 2 mois"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Combien de temps pour terminer?
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="garantie">Garantie</Label>
                <Input
                  id="garantie"
                  value={garantie}
                  onChange={(e) => setGarantie(e.target.value)}
                  placeholder="Ex: 6 mois, 1 an, 2 ans"
                />
                <p className="text-xs text-muted-foreground">
                  Durée de garantie offerte (optionnel)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conditions de paiement */}
        <Card>
          <CardHeader>
            <CardTitle>Conditions de paiement</CardTitle>
            <CardDescription>Définissez vos modalités de paiement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Acompte */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Acompte requis</Label>
                <p className="text-sm text-muted-foreground">
                  Demander un acompte avant de commencer
                </p>
              </div>
              <Switch
                checked={acompteRequis}
                onCheckedChange={setAcompteRequis}
              />
            </div>

            {acompteRequis && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="pourcentageAcompte">Pourcentage d'acompte (%)</Label>
                  <Select value={pourcentageAcompte} onValueChange={setPourcentageAcompte}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20%</SelectItem>
                      <SelectItem value="30">30%</SelectItem>
                      <SelectItem value="40">40%</SelectItem>
                      <SelectItem value="50">50%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Acompte ({pourcentageAcompte}%):</span>
                    <span className="font-medium">{montantAcompte.toLocaleString()} {devise}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Solde:</span>
                    <span className="font-medium">{montantSolde.toLocaleString()} {devise}</span>
                  </div>
                </div>
              </>
            )}

            {/* Modalités */}
            <div className="space-y-2">
              <Label htmlFor="modalitesPaiement">Modalités de paiement (optionnel)</Label>
              <Textarea
                id="modalitesPaiement"
                value={modalitesPaiement}
                onChange={(e) => setModalitesPaiement(e.target.value)}
                placeholder={acompteRequis 
                  ? `Ex: ${pourcentageAcompte}% avant début des travaux, ${100 - parseFloat(pourcentageAcompte)}% après validation`
                  : 'Ex: Paiement après validation des travaux'}
                rows={2}
              />
            </div>

            {/* Méthodes acceptées */}
            <div className="space-y-2">
              <Label>Méthodes de paiement acceptées</Label>
              <div className="grid grid-cols-2 gap-2">
                {['Mobile Money', 'Virement', 'Espèces', 'Chèque'].map((methode) => (
                  <div key={methode} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={methode}
                      checked={methodesAcceptees.includes(methode)}
                      onChange={() => handleMethodeToggle(methode)}
                      className="rounded"
                    />
                    <Label htmlFor={methode} className="font-normal cursor-pointer">
                      {methode}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/dashboard/prestataire/demandes/${demandeId}`)}
          >
            Annuler
          </Button>
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? (
              'Envoi en cours...'
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Soumettre le devis
              </>
            )}
          </Button>
        </div>
      </form>
      </div>
    </DashboardLayout>
  );
}
