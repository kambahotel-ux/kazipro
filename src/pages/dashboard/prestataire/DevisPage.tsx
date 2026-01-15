import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, Plus, Eye, Edit, Trash2, DollarSign, CheckCircle, Clock, 
  Loader, Send, FileText, Download, X, Save, Copy
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DateRangeFilter } from "@/components/filters/DateRangeFilter";

interface DevisItem {
  id?: string;
  designation: string;
  quantite: number;
  unite: string;
  prix_unitaire: number;
  montant: number;
}

interface Devis {
  id: string;
  numero: string;
  prestataire_id: string;
  client_id?: string;
  demande_id?: string;
  titre: string;
  description?: string;
  notes?: string;
  conditions?: string;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  devise?: string;
  frais_deplacement?: number;
  statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire';
  date_creation: string;
  date_envoi?: string;
  date_expiration?: string;
  date_acceptation?: string;
  client_signature?: string;
  created_at: string;
  items?: DevisItem[];
  client_name?: string;
  client_phone?: string;
  client_email?: string;
}

export default function DevisPage() {
  const { user } = useAuth();
  const [providerName, setProviderName] = useState("Prestataire");
  const [providerId, setProviderId] = useState<string | null>(null);
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Additional filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    devise: 'all',
    startDate: '',
    endDate: '',
  });
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedDevis, setSelectedDevis] = useState<Devis | null>(null);
  const [editingDevis, setEditingDevis] = useState<Devis | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    notes: "",
    conditions: "Devis valable 30 jours.\nPaiement à la livraison.\nGarantie 1 an.",
    tva: 16,
  });
  
  const [items, setItems] = useState<DevisItem[]>([
    { designation: "", quantite: 1, unite: "unité", prix_unitaire: 0, montant: 0 }
  ]);

  useEffect(() => {
    if (user) {
      fetchProviderInfo();
    }
  }, [user]);

  useEffect(() => {
    if (providerId) {
      fetchDevis();
    }
  }, [providerId]);

  const fetchProviderInfo = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("prestataires")
        .select("id, full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setProviderName(data.full_name);
        setProviderId(data.id);
      }
    } catch (error) {
      console.error("Error fetching provider:", error);
    }
  };

  const fetchDevis = async () => {
    if (!providerId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("devis")
        .select("*")
        .eq("prestataire_id", providerId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch items and client info for each devis
      const devisWithDetails = await Promise.all(
        (data || []).map(async (devis) => {
          // Fetch items
          const { data: itemsData } = await supabase
            .from("devis_pro_items")
            .select("*")
            .eq("devis_id", devis.id)
            .order("created_at", { ascending: true });  // ✅ Tri par created_at au lieu de ordre
          
          // Fetch client info if devis is linked to a demande
          let clientInfo = {};
          if (devis.demande_id) {
            const { data: demandeData } = await supabase
              .from("demandes")
              .select(`
                client_id,
                clients:client_id (
                  full_name
                )
              `)
              .eq("id", devis.demande_id)
              .maybeSingle();

            if (demandeData?.clients) {
              const client = Array.isArray(demandeData.clients) 
                ? demandeData.clients[0] 
                : demandeData.clients;
              
              clientInfo = {
                client_name: client.full_name
              };
            }
          }
          
          return { 
            ...devis, 
            items: itemsData || [],
            ...clientInfo
          };
        })
      );

      setDevisList(devisWithDetails);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des devis");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { 
      designation: "", 
      quantite: 1, 
      unite: "unité", 
      prix_unitaire: 0, 
      montant: 0
    }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      toast.error("Vous devez avoir au moins une ligne");
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof DevisItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculer le montant
    if (field === 'quantite' || field === 'prix_unitaire') {
      newItems[index].montant = newItems[index].quantite * newItems[index].prix_unitaire;
    }
    
    setItems(newItems);
  };

  const calculateTotals = () => {
    const montant_ht = items.reduce((sum, item) => sum + item.montant, 0);
    const montant_tva = montant_ht * (formData.tva / 100);
    const montant_ttc = montant_ht + montant_tva;
    
    return { montant_ht, montant_tva, montant_ttc };
  };

  const handleCreateDevis = async (statut: 'brouillon' | 'envoye' = 'brouillon') => {
    if (!providerId) return;
    
    // Validation
    if (!formData.titre.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    
    if (items.some(item => !item.designation.trim())) {
      toast.error("Toutes les lignes doivent avoir une désignation");
      return;
    }

    try {
      const { montant_ht, montant_ttc } = calculateTotals();
      
      // Générer le numéro
      const { data: numeroData } = await supabase.rpc('generate_devis_numero');
      const numero = numeroData || `DEV-${Date.now()}`;
      
      // Créer le devis
      const { data: devisData, error: devisError } = await supabase
        .from("devis")
        .insert({
          numero,
          prestataire_id: providerId,
          titre: formData.titre,
          description: formData.description,
          notes: formData.notes,
          conditions: formData.conditions,
          amount: montant_ttc, // Pour compatibilité avec l'ancienne structure
          montant_ht,
          tva: formData.tva,
          montant_ttc,
          statut,
          status: statut === 'envoye' ? 'pending' : 'pending', // Pour compatibilité
          date_creation: new Date().toISOString(),
          date_envoi: statut === 'envoye' ? new Date().toISOString() : null,
          date_expiration: statut === 'envoye' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
        })
        .select()
        .single();

      if (devisError) throw devisError;

      // Créer les lignes
      const itemsToInsert = items.map((item, index) => ({
        devis_id: devisData.id,
        designation: item.designation,
        quantite: item.quantite,
        unite: item.unite,
        prix_unitaire: item.prix_unitaire,
        montant: item.montant,
        ordre: index,
      }));

      const { error: itemsError } = await supabase
        .from("devis_pro_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success(statut === 'brouillon' ? "Devis créé en brouillon" : "Devis envoyé avec succès");
      setShowCreateModal(false);
      resetForm();
      fetchDevis();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création");
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      titre: "",
      description: "",
      notes: "",
      conditions: "Devis valable 30 jours.\nPaiement à la livraison.\nGarantie 1 an.",
      tva: 16,
    });
    setItems([{ designation: "", quantite: 1, unite: "unité", prix_unitaire: 0, montant: 0 }]);
  };

  const handleDeleteDevis = async (devisId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce devis ?")) return;

    try {
      const { error } = await supabase
        .from("devis")
        .delete()
        .eq("id", devisId);

      if (error) throw error;

      toast.success("Devis supprimé");
      fetchDevis();
    } catch (error: any) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleDuplicateDevis = async (devis: Devis) => {
    setFormData({
      titre: `${devis.titre} (Copie)`,
      description: devis.description || "",
      notes: devis.notes || "",
      conditions: devis.conditions || "",
      tva: devis.tva,
    });
    setItems(devis.items || []);
    setShowCreateModal(true);
  };

  const handleEditDevis = async (devis: Devis) => {
    setEditingDevis(devis);
    setFormData({
      titre: devis.titre,
      description: devis.description || "",
      notes: devis.notes || "",
      conditions: devis.conditions || "",
      tva: devis.tva,
    });
    setItems(devis.items || [{ designation: "", quantite: 1, unite: "unité", prix_unitaire: 0, montant: 0 }]);
    setShowEditModal(true);
  };

  const handleUpdateDevis = async (statut: 'brouillon' | 'envoye' = 'brouillon') => {
    if (!editingDevis || !providerId) return;
    
    // Validation
    if (!formData.titre.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    
    if (items.some(item => !item.designation.trim())) {
      toast.error("Toutes les lignes doivent avoir une désignation");
      return;
    }

    try {
      const { montant_ht, montant_ttc } = calculateTotals();
      
      // Mettre à jour le devis
      const { error: devisError } = await supabase
        .from("devis")
        .update({
          titre: formData.titre,
          description: formData.description,
          notes: formData.notes,
          conditions: formData.conditions,
          amount: montant_ttc,
          montant_ht,
          tva: formData.tva,
          montant_ttc,
          statut,
          status: statut === 'envoye' ? 'pending' : 'pending',
          date_envoi: statut === 'envoye' ? new Date().toISOString() : editingDevis.date_envoi,
          date_expiration: statut === 'envoye' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : editingDevis.date_expiration,
        })
        .eq("id", editingDevis.id);

      if (devisError) throw devisError;

      // Supprimer les anciennes lignes
      await supabase
        .from("devis_pro_items")
        .delete()
        .eq("devis_id", editingDevis.id);

      // Créer les nouvelles lignes
      const itemsToInsert = items.map((item, index) => ({
        devis_id: editingDevis.id,
        designation: item.designation,
        quantite: item.quantite,
        unite: item.unite,
        prix_unitaire: item.prix_unitaire,
        montant: item.montant,
        ordre: index,
      }));

      const { error: itemsError } = await supabase
        .from("devis_pro_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success(statut === 'brouillon' ? "Devis mis à jour" : "Devis envoyé avec succès");
      setShowEditModal(false);
      setEditingDevis(null);
      resetForm();
      fetchDevis();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
      console.error(error);
    }
  };

  const handleExportPDF = async (devis: Devis) => {
    try {
      toast.info("Génération du PDF en cours...");
      
      // Récupérer les informations d'entreprise du prestataire
      const { data: entrepriseData } = await supabase
        .from('entreprise_info')
        .select('*')
        .eq('prestataire_id', devis.prestataire_id)
        .maybeSingle();
      
      // Utiliser les infos entreprise ou fallback sur le nom du prestataire
      const companyName = entrepriseData?.nom_entreprise || providerName;
      const companyAddress = entrepriseData?.adresse || '';
      const companyCity = entrepriseData?.ville || '';
      const companyPhone = entrepriseData?.telephone || '';
      const companyEmail = entrepriseData?.email_professionnel || '';
      const companyRCCM = entrepriseData?.numero_fiscal || '';
      const companyLogo = entrepriseData?.logo_url || '';
      const companySignature = entrepriseData?.signature_url || '';
      
      // Récupérer la devise du devis (CDF, USD, etc.)
      const devise = devis.devise || 'CDF';
      
      // S'assurer que le numéro de devis n'est pas null
      const devisNumero = devis.numero || 'N/A';
      
      // Charger le logo si disponible
      let logoBase64 = '';
      if (companyLogo) {
        try {
          const response = await fetch(companyLogo);
          const blob = await response.blob();
          logoBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error('Erreur chargement logo:', error);
        }
      }
      
      // Charger la signature si disponible
      let signatureBase64 = '';
      if (companySignature) {
        try {
          const response = await fetch(companySignature);
          const blob = await response.blob();
          signatureBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error('Erreur chargement signature:', error);
        }
      }
      
      // Créer un élément temporaire pour le PDF
      const element = document.createElement('div');
      element.style.width = '210mm';
      element.style.padding = '15mm 20mm';
      element.style.backgroundColor = 'white';
      element.style.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
      element.style.color = '#000';
      element.style.lineHeight = '1.4';
      
      element.innerHTML = `
        <!-- En-tête professionnel -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 3px solid #000;">
          <!-- Colonne gauche: Logo + Entreprise -->
          <div style="flex: 1;">
            ${logoBase64 ? `
              <img src="${logoBase64}" alt="Logo" style="width: 80px; height: 80px; object-fit: contain; margin-bottom: 10px;" />
            ` : ''}
            <h1 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 700; color: #000; line-height: 1.2;">${companyName}</h1>
            <div style="font-size: 9px; color: #444; line-height: 1.5;">
              ${companyAddress ? `<div>${companyAddress}</div>` : ''}
              ${companyCity ? `<div>${companyCity}</div>` : ''}
              ${companyPhone ? `<div>Tél: ${companyPhone}</div>` : ''}
              ${companyEmail ? `<div>Email: ${companyEmail}</div>` : ''}
              ${companyRCCM ? `<div>RCCM: ${companyRCCM}</div>` : ''}
            </div>
          </div>
          
          <!-- Colonne droite: Info devis -->
          <div style="text-align: right;">
            <h2 style="margin: 0 0 10px 0; font-size: 32px; font-weight: 700; color: #000; letter-spacing: 2px;">DEVIS</h2>
            <div style="font-size: 10px; color: #444; line-height: 1.6;">
              <div style="margin: 3px 0;"><strong>N°:</strong> ${devisNumero}</div>
              <div style="margin: 3px 0;"><strong>Date:</strong> ${new Date(devis.date_creation).toLocaleDateString('fr-FR')}</div>
              ${devis.date_expiration ? `<div style="margin: 3px 0;"><strong>Valable jusqu'au:</strong> ${new Date(devis.date_expiration).toLocaleDateString('fr-FR')}</div>` : ''}
              <div style="margin: 3px 0;"><strong>Statut:</strong> ${devis.statut.toUpperCase()}</div>
            </div>
          </div>
        </div>
        
        <!-- Section Client/Prestataire -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div style="padding: 10px; background: #f8f8f8; border-left: 3px solid #000;">
            <div style="font-size: 8px; font-weight: 700; text-transform: uppercase; color: #666; margin-bottom: 5px; letter-spacing: 0.5px;">Prestataire</div>
            <div style="font-size: 11px; font-weight: 600; color: #000;">${providerName}</div>
          </div>
          <div style="padding: 10px; background: #f8f8f8; border-left: 3px solid #000;">
            <div style="font-size: 8px; font-weight: 700; text-transform: uppercase; color: #666; margin-bottom: 5px; letter-spacing: 0.5px;">Client</div>
            <div style="font-size: 11px; font-weight: 600; color: #000;">${devis.client_name || 'À compléter'}</div>
          </div>
        </div>
        
        <!-- Objet du devis -->
        <div style="margin-bottom: 20px; padding: 12px; background: #f8f8f8;">
          <div style="font-size: 8px; font-weight: 700; text-transform: uppercase; color: #666; margin-bottom: 5px; letter-spacing: 0.5px;">Objet</div>
          <div style="font-size: 12px; font-weight: 600; color: #000; margin-bottom: 4px;">${devis.titre}</div>
          ${devis.description ? `<div style="font-size: 10px; color: #444; line-height: 1.5;">${devis.description}</div>` : ''}
        </div>
        
        <!-- Tableau des articles -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px;">
          <thead>
            <tr style="background: #000; color: white;">
              <th style="padding: 8px; text-align: left; font-weight: 700; font-size: 9px; text-transform: uppercase;">Désignation</th>
              <th style="padding: 8px; text-align: center; font-weight: 700; font-size: 9px; text-transform: uppercase; width: 50px;">Qté</th>
              <th style="padding: 8px; text-align: center; font-weight: 700; font-size: 9px; text-transform: uppercase; width: 60px;">Unité</th>
              <th style="padding: 8px; text-align: right; font-weight: 700; font-size: 9px; text-transform: uppercase; width: 90px;">P.U.</th>
              <th style="padding: 8px; text-align: right; font-weight: 700; font-size: 9px; text-transform: uppercase; width: 100px;">Montant</th>
            </tr>
          </thead>
          <tbody>
            ${devis.items?.map((item, index) => `
              <tr style="border-bottom: 1px solid #ddd; ${index % 2 === 0 ? 'background: #fafafa;' : ''}">
                <td style="padding: 8px; color: #000;">${item.designation}</td>
                <td style="padding: 8px; text-align: center; color: #333;">${item.quantite}</td>
                <td style="padding: 8px; text-align: center; color: #333;">${item.unite}</td>
                <td style="padding: 8px; text-align: right; color: #333;">${item.prix_unitaire.toLocaleString('fr-FR')} ${devise}</td>
                <td style="padding: 8px; text-align: right; font-weight: 600; color: #000;">${item.montant.toLocaleString('fr-FR')} ${devise}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <!-- Totaux -->
        <div style="display: flex; justify-content: flex-end; margin-bottom: 25px;">
          <div style="width: 300px; border: 2px solid #000; padding: 12px;">
            <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 11px; border-bottom: 1px solid #ddd;">
              <span style="color: #444;">Montant HT</span>
              <span style="font-weight: 600; color: #000;">${devis.montant_ht.toLocaleString('fr-FR')} ${devise}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 11px; border-bottom: 1px solid #ddd;">
              <span style="color: #444;">TVA (${devis.tva}%)</span>
              <span style="font-weight: 600; color: #000;">${(devis.montant_ttc - devis.montant_ht).toLocaleString('fr-FR')} ${devise}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0 0 0; font-size: 14px; font-weight: 700; border-top: 2px solid #000; margin-top: 6px;">
              <span style="color: #000;">TOTAL TTC</span>
              <span style="color: #000;">${devis.montant_ttc.toLocaleString('fr-FR')} ${devise}</span>
            </div>
          </div>
        </div>
        
        <!-- Conditions -->
        ${devis.conditions ? `
          <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; background: #fafafa;">
            <div style="font-size: 8px; font-weight: 700; text-transform: uppercase; color: #666; margin-bottom: 5px; letter-spacing: 0.5px;">Conditions générales</div>
            <div style="font-size: 9px; line-height: 1.5; white-space: pre-line; color: #333;">${devis.conditions}</div>
          </div>
        ` : ''}
        
        <!-- Signatures -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px;">
          <!-- Signature Prestataire -->
          <div style="border: 1px solid #ddd; padding: 12px; background: #fafafa;">
            <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: #666; margin-bottom: 8px;">Le Prestataire</div>
            ${signatureBase64 ? `
              <div style="margin: 10px 0; min-height: 60px; display: flex; align-items: center;">
                <img src="${signatureBase64}" alt="Signature" style="max-width: 140px; max-height: 60px; object-fit: contain;" />
              </div>
            ` : `
              <div style="height: 60px; margin: 10px 0;"></div>
            `}
            <div style="border-top: 1px solid #000; padding-top: 5px; margin-top: 5px;">
              <div style="font-size: 8px; color: #666;">Signature et cachet</div>
            </div>
          </div>
          
          <!-- Signature Client -->
          <div style="border: 1px solid #ddd; padding: 12px; background: #fafafa;">
            <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: #666; margin-bottom: 8px;">Le Client</div>
            ${devis.statut === 'accepte' && devis.client_signature ? `
              <div style="margin: 10px 0; min-height: 60px; display: flex; align-items: center;">
                <img src="${devis.client_signature}" alt="Signature Client" style="max-width: 140px; max-height: 60px; object-fit: contain;" />
              </div>
            ` : `
              <div style="height: 60px; margin: 10px 0;"></div>
            `}
            <div style="border-top: 1px solid #000; padding-top: 5px; margin-top: 5px;">
              <div style="font-size: 8px; color: #666;">Bon pour accord, signature</div>
              ${devis.statut === 'accepte' && devis.date_acceptation ? `
                <div style="font-size: 8px; color: #666; margin-top: 3px;">Accepté le: ${new Date(devis.date_acceptation).toLocaleDateString('fr-FR')}</div>
              ` : ''}
            </div>
          </div>
        </div>
        
        <!-- Pied de page -->
        <div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; text-align: center;">
          <div style="font-size: 8px; color: #999; font-style: italic; margin-bottom: 5px;">
            Ce devis est valable pour la durée indiquée. Son acceptation engage les deux parties.
          </div>
          <div style="font-size: 7px; color: #ccc;">
            Généré via KaziPro - Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      `;
      
      document.body.appendChild(element);
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      document.body.removeChild(element);
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Devis_${devis.numero}.pdf`);
      
      toast.success("PDF téléchargé avec succès!");
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      toast.error("Erreur lors de la génération du PDF");
    }
  };

  const handleSendToClient = async (devis: Devis) => {
    if (devis.statut !== 'brouillon') {
      toast.error("Seuls les devis brouillons peuvent être envoyés");
      return;
    }

    try {
      const { error } = await supabase
        .from("devis")
        .update({
          statut: 'envoye',
          status: 'pending',
          date_envoi: new Date().toISOString(),
          date_expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", devis.id);

      if (error) throw error;

      toast.success("Devis envoyé au client avec succès!");
      fetchDevis();
    } catch (error: any) {
      toast.error("Erreur lors de l'envoi du devis");
      console.error(error);
    }
  };

  const getStats = () => {
    const brouillons = filteredDevis.filter(d => d.statut === 'brouillon').length;
    const envoyes = filteredDevis.filter(d => d.statut === 'envoye').length;
    const acceptes = filteredDevis.filter(d => d.statut === 'accepte').length;
    const totalMontant = filteredDevis
      .filter(d => d.statut === 'accepte')
      .reduce((sum, d) => sum + d.montant_ttc, 0);

    return [
      { title: "Brouillons", value: brouillons.toString(), subtitle: "À finaliser", icon: <Edit className="w-5 h-5" /> },
      { title: "Envoyés", value: envoyes.toString(), subtitle: "En attente", icon: <Send className="w-5 h-5" /> },
      { title: "Acceptés", value: acceptes.toString(), subtitle: "Validés", icon: <CheckCircle className="w-5 h-5" /> },
      { title: "Montant accepté", value: `${totalMontant.toLocaleString()} FC`, subtitle: "Total", icon: <DollarSign className="w-5 h-5" /> },
    ];
  };

  const filteredDevis = useMemo(() => {
    return devisList.filter(d => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!(d.titre || '').toLowerCase().includes(searchLower) &&
            !(d.numero || '').toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Status filter
      if (filters.status !== 'all' && d.statut !== filters.status) {
        return false;
      }
      
      // Devise filter
      if (filters.devise !== 'all' && (d.devise || 'FC') !== filters.devise) {
        return false;
      }
      
      // Date range filter
      if (filters.startDate) {
        const devisDate = new Date(d.created_at);
        const startDate = new Date(filters.startDate);
        if (devisDate < startDate) return false;
      }
      
      if (filters.endDate) {
        const devisDate = new Date(d.created_at);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (devisDate > endDate) return false;
      }
      
      return true;
    });
  }, [devisList, filters]);

  // Get unique devises for filter dropdown
  const devises = useMemo(() => {
    const uniqueDevises = [...new Set(devisList.map(d => d.devise || 'FC'))];
    return uniqueDevises.sort();
  }, [devisList]);
  
  // Check if any filters are active
  const hasActiveFilters = filters.search || filters.status !== 'all' || 
    filters.devise !== 'all' || filters.startDate || filters.endDate;
  
  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      devise: 'all',
      startDate: '',
      endDate: '',
    });
  };

  const getStatusBadge = (statut: string) => {
    const badges = {
      brouillon: <Badge variant="secondary">Brouillon</Badge>,
      en_attente: <Badge className="bg-yellow-600">En attente</Badge>,
      envoye: <Badge className="bg-blue-600">Envoyé</Badge>,
      accepte: <Badge className="bg-green-600">Accepté</Badge>,
      refuse: <Badge variant="destructive">Refusé</Badge>,
      expire: <Badge variant="outline">Expiré</Badge>,
    };
    return badges[statut as keyof typeof badges] || <Badge>{statut}</Badge>;
  };

  return (
    <DashboardLayout role="prestataire" userName={providerName} userRole="Prestataire">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Mes Devis</h1>
            <p className="text-muted-foreground">Créez et gérez vos devis professionnels</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau devis
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {getStats().map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Filters Toggle Button */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Search className="w-4 h-4" />
            {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
          </Button>
          
          {hasActiveFilters && !showFilters && (
            <Badge variant="secondary">
              Filtres actifs: {filteredDevis.length} résultat(s)
            </Badge>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <Card>
            <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Rechercher..." 
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                />
              </div>
              
              {/* Status */}
              <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="brouillon">Brouillons</SelectItem>
                  <SelectItem value="envoye">Envoyés</SelectItem>
                  <SelectItem value="accepte">Acceptés</SelectItem>
                  <SelectItem value="refuse">Refusés</SelectItem>
                  <SelectItem value="expire">Expirés</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Devise */}
              <Select value={filters.devise} onValueChange={(v) => setFilters({...filters, devise: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Devise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les devises</SelectItem>
                  {devises.map(devise => (
                    <SelectItem key={devise} value={devise}>{devise}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Date Range */}
            <div className="mb-4">
              <DateRangeFilter
                startDate={filters.startDate}
                endDate={filters.endDate}
                onStartDateChange={(d) => setFilters({...filters, startDate: d})}
                onEndDateChange={(d) => setFilters({...filters, endDate: d})}
                label="Période de création"
              />
            </div>
            
            {/* Results bar */}
            <div className="flex items-center justify-between">
              <Badge variant="secondary">
                {filteredDevis.length} résultat(s)
              </Badge>
              
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Devis List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin" />
          </div>
        ) : filteredDevis.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                {filters.search || filters.status !== "all" 
                  ? "Aucun devis trouvé" 
                  : "Vous n'avez pas encore créé de devis"}
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Créer mon premier devis
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDevis.map((devis) => (
              <Card key={devis.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-start gap-3 flex-wrap">
                        <div>
                          <h3 className="font-semibold text-lg">{devis.titre || 'Sans titre'}</h3>
                          <p className="text-sm text-muted-foreground">{devis.numero || 'N/A'}</p>
                        </div>
                        {getStatusBadge(devis.statut)}
                      </div>
                      {devis.description && (
                        <p className="text-sm text-muted-foreground">{devis.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Montant HT: </span>
                          <span className="font-medium">{devis.montant_ht.toLocaleString()} {devis.devise || 'FC'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">TVA ({devis.tva}%): </span>
                          <span className="font-medium">{(devis.montant_ttc - devis.montant_ht).toLocaleString()} {devis.devise || 'FC'}</span>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-primary">
                        Total TTC: {devis.montant_ttc.toLocaleString()} {devis.devise || 'FC'}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Créé le {new Date(devis.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDevis(devis);
                          setShowPreviewModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </Button>
                      {devis.statut === 'brouillon' && (
                        <>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditDevis(devis)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Modifier
                          </Button>
                          <Button 
                            variant="default"
                            size="sm"
                            onClick={() => handleSendToClient(devis)}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Envoyer
                          </Button>
                        </>
                      )}
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportPDF(devis)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicateDevis(devis)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Dupliquer
                      </Button>
                      {(devis.statut === 'brouillon' || devis.statut === 'refuse') && (
                        <Button 
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteDevis(devis.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Supprimer
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Créer un Devis</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setShowCreateModal(false); resetForm(); }}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">{/* ... rest of create modal content ... */}
                {/* Informations générales */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="titre">Titre du devis *</Label>
                    <Input 
                      id="titre"
                      value={formData.titre}
                      onChange={(e) => setFormData({...formData, titre: e.target.value})}
                      placeholder="Ex: Installation électrique complète"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Description détaillée du devis..."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Lignes du devis */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">Lignes du devis</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter une ligne
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-2 text-sm font-medium">Désignation</th>
                            <th className="text-left p-2 text-sm font-medium w-20">Qté</th>
                            <th className="text-left p-2 text-sm font-medium w-24">Unité</th>
                            <th className="text-left p-2 text-sm font-medium w-28">Prix Unit.</th>
                            <th className="text-left p-2 text-sm font-medium w-28">Montant</th>
                            <th className="w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-2">
                                <Input 
                                  value={item.designation}
                                  onChange={(e) => handleItemChange(index, 'designation', e.target.value)}
                                  placeholder="Description de l'article"
                                  className="h-9"
                                />
                              </td>
                              <td className="p-2">
                                <Input 
                                  type="number"
                                  value={item.quantite}
                                  onChange={(e) => handleItemChange(index, 'quantite', parseFloat(e.target.value) || 0)}
                                  className="h-9"
                                  min="0"
                                  step="0.01"
                                />
                              </td>
                              <td className="p-2">
                                <Select 
                                  value={item.unite}
                                  onValueChange={(value) => handleItemChange(index, 'unite', value)}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="unité">unité</SelectItem>
                                    <SelectItem value="heure">heure</SelectItem>
                                    <SelectItem value="jour">jour</SelectItem>
                                    <SelectItem value="m²">m²</SelectItem>
                                    <SelectItem value="m">m</SelectItem>
                                    <SelectItem value="kg">kg</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-2">
                                <Input 
                                  type="number"
                                  value={item.prix_unitaire}
                                  onChange={(e) => handleItemChange(index, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                                  className="h-9"
                                  min="0"
                                  step="0.01"
                                />
                              </td>
                              <td className="p-2">
                                <div className="font-medium text-sm py-2">
                                  {item.montant.toLocaleString()} FC
                                </div>
                              </td>
                              <td className="p-2">
                                <Button 
                                  type="button"
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleRemoveItem(index)}
                                  disabled={items.length === 1}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Totaux */}
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Montant HT:</span>
                    <span className="font-medium">{calculateTotals().montant_ht.toLocaleString()} FC</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span>TVA:</span>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number"
                        value={formData.tva}
                        onChange={(e) => setFormData({...formData, tva: parseFloat(e.target.value) || 0})}
                        className="h-8 w-20 text-right"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <span>%</span>
                      <span className="font-medium w-24 text-right">
                        {calculateTotals().montant_tva.toLocaleString()} FC
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total TTC:</span>
                    <span className="text-primary">{calculateTotals().montant_ttc.toLocaleString()} FC</span>
                  </div>
                </div>

                {/* Conditions */}
                <div>
                  <Label htmlFor="conditions">Conditions générales</Label>
                  <Textarea 
                    id="conditions"
                    value={formData.conditions}
                    onChange={(e) => setFormData({...formData, conditions: e.target.value})}
                    placeholder="Conditions du devis..."
                    rows={4}
                  />
                </div>

                {/* Notes internes */}
                <div>
                  <Label htmlFor="notes">Notes internes (non visibles par le client)</Label>
                  <Textarea 
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Notes pour usage interne..."
                    rows={2}
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 justify-end">
                  <Button variant="outline" onClick={() => { setShowCreateModal(false); resetForm(); }}>
                    Annuler
                  </Button>
                  <Button variant="outline" onClick={() => handleCreateDevis('brouillon')}>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer brouillon
                  </Button>
                  <Button onClick={() => handleCreateDevis('envoye')}>
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingDevis && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Modifier le Devis - {editingDevis.numero}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setShowEditModal(false); setEditingDevis(null); resetForm(); }}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Same content as create modal but with update buttons */}
                {/* Informations générales */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-titre">Titre du devis *</Label>
                    <Input 
                      id="edit-titre"
                      value={formData.titre}
                      onChange={(e) => setFormData({...formData, titre: e.target.value})}
                      placeholder="Ex: Installation électrique complète"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea 
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Description détaillée du devis..."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Lignes du devis */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">Lignes du devis</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter une ligne
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-2 text-sm font-medium">Désignation</th>
                            <th className="text-left p-2 text-sm font-medium w-20">Qté</th>
                            <th className="text-left p-2 text-sm font-medium w-24">Unité</th>
                            <th className="text-left p-2 text-sm font-medium w-28">Prix Unit.</th>
                            <th className="text-left p-2 text-sm font-medium w-28">Montant</th>
                            <th className="w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-2">
                                <Input 
                                  value={item.designation}
                                  onChange={(e) => handleItemChange(index, 'designation', e.target.value)}
                                  placeholder="Description de l'article"
                                  className="h-9"
                                />
                              </td>
                              <td className="p-2">
                                <Input 
                                  type="number"
                                  value={item.quantite}
                                  onChange={(e) => handleItemChange(index, 'quantite', parseFloat(e.target.value) || 0)}
                                  className="h-9"
                                  min="0"
                                  step="0.01"
                                />
                              </td>
                              <td className="p-2">
                                <Select 
                                  value={item.unite}
                                  onValueChange={(value) => handleItemChange(index, 'unite', value)}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="unité">unité</SelectItem>
                                    <SelectItem value="heure">heure</SelectItem>
                                    <SelectItem value="jour">jour</SelectItem>
                                    <SelectItem value="m²">m²</SelectItem>
                                    <SelectItem value="m">m</SelectItem>
                                    <SelectItem value="kg">kg</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-2">
                                <Input 
                                  type="number"
                                  value={item.prix_unitaire}
                                  onChange={(e) => handleItemChange(index, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                                  className="h-9"
                                  min="0"
                                  step="0.01"
                                />
                              </td>
                              <td className="p-2">
                                <div className="font-medium text-sm py-2">
                                  {item.montant.toLocaleString()} FC
                                </div>
                              </td>
                              <td className="p-2">
                                <Button 
                                  type="button"
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleRemoveItem(index)}
                                  disabled={items.length === 1}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Totaux */}
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Montant HT:</span>
                    <span className="font-medium">{calculateTotals().montant_ht.toLocaleString()} FC</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span>TVA:</span>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number"
                        value={formData.tva}
                        onChange={(e) => setFormData({...formData, tva: parseFloat(e.target.value) || 0})}
                        className="h-8 w-20 text-right"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <span>%</span>
                      <span className="font-medium w-24 text-right">
                        {calculateTotals().montant_tva.toLocaleString()} FC
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total TTC:</span>
                    <span className="text-primary">{calculateTotals().montant_ttc.toLocaleString()} FC</span>
                  </div>
                </div>

                {/* Conditions */}
                <div>
                  <Label htmlFor="edit-conditions">Conditions générales</Label>
                  <Textarea 
                    id="edit-conditions"
                    value={formData.conditions}
                    onChange={(e) => setFormData({...formData, conditions: e.target.value})}
                    placeholder="Conditions du devis..."
                    rows={4}
                  />
                </div>

                {/* Notes internes */}
                <div>
                  <Label htmlFor="edit-notes">Notes internes (non visibles par le client)</Label>
                  <Textarea 
                    id="edit-notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Notes pour usage interne..."
                    rows={2}
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 justify-end">
                  <Button variant="outline" onClick={() => { setShowEditModal(false); setEditingDevis(null); resetForm(); }}>
                    Annuler
                  </Button>
                  <Button variant="outline" onClick={() => handleUpdateDevis('brouillon')}>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </Button>
                  <Button onClick={() => handleUpdateDevis('envoye')}>
                    <Send className="w-4 h-4 mr-2" />
                    Enregistrer et envoyer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Preview Modal */}
        {showPreviewModal && selectedDevis && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Prévisualisation du Devis</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setShowPreviewModal(false); setSelectedDevis(null); }}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {/* Devis Preview */}
                <div className="bg-white border rounded-lg p-8 space-y-6">
                  {/* Header */}
                  <div className="flex justify-between items-start border-b pb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-primary">KAZIPRO</h2>
                      <p className="text-sm text-muted-foreground">Plateforme de services professionnels</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">DEVIS</div>
                      <div className="text-sm text-muted-foreground">{selectedDevis.numero || 'N/A'}</div>
                      {getStatusBadge(selectedDevis.statut)}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">Prestataire</h3>
                      <p className="text-sm">{providerName}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Dates</h3>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Créé le: </span>
                        {new Date(selectedDevis.date_creation).toLocaleDateString('fr-FR')}
                      </p>
                      {selectedDevis.date_envoi && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Envoyé le: </span>
                          {new Date(selectedDevis.date_envoi).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                      {selectedDevis.date_expiration && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Valable jusqu'au: </span>
                          {new Date(selectedDevis.date_expiration).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Titre et description */}
                  <div>
                    <h3 className="text-xl font-bold mb-2">{selectedDevis.titre || 'Sans titre'}</h3>
                    {selectedDevis.description && (
                      <p className="text-sm text-muted-foreground">{selectedDevis.description}</p>
                    )}
                  </div>

                  {/* Items */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">Désignation</th>
                          <th className="text-center p-3 text-sm font-medium w-20">Qté</th>
                          <th className="text-center p-3 text-sm font-medium w-24">Unité</th>
                          <th className="text-right p-3 text-sm font-medium w-28">P.U.</th>
                          <th className="text-right p-3 text-sm font-medium w-32">Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDevis.items && selectedDevis.items.length > 0 ? (
                          selectedDevis.items.map((item, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-3 text-sm">{item.designation}</td>
                              <td className="p-3 text-sm text-center">{item.quantite}</td>
                              <td className="p-3 text-sm text-center">{item.unite || 'unité'}</td>
                              <td className="p-3 text-sm text-right">{item.prix_unitaire.toLocaleString()} {selectedDevis.devise || 'FC'}</td>
                              <td className="p-3 text-sm text-right font-medium">{item.montant.toLocaleString()} {selectedDevis.devise || 'FC'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr className="border-t">
                            <td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">
                              Aucun article détaillé pour ce devis
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Totaux */}
                  <div className="flex justify-end">
                    <div className="w-80 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Montant HT:</span>
                        <span className="font-medium">{selectedDevis.montant_ht.toLocaleString()} {selectedDevis.devise || 'FC'}</span>
                      </div>
                      {selectedDevis.frais_deplacement > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Frais de déplacement:</span>
                          <span className="font-medium">{selectedDevis.frais_deplacement.toLocaleString()} {selectedDevis.devise || 'FC'}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span>TVA ({selectedDevis.tva}%):</span>
                        <span className="font-medium">{(selectedDevis.montant_ttc - selectedDevis.montant_ht).toLocaleString()} {selectedDevis.devise || 'FC'}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total TTC:</span>
                        <span className="text-primary">{selectedDevis.montant_ttc.toLocaleString()} {selectedDevis.devise || 'FC'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Conditions */}
                  {selectedDevis.conditions && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-2">Conditions générales</h3>
                      <p className="text-sm whitespace-pre-line text-muted-foreground">{selectedDevis.conditions}</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="border-t pt-4 text-center text-xs text-muted-foreground">
                    <p>KaziPro - Plateforme de services professionnels</p>
                    <p>Ce devis est valable pour la durée indiquée et engage les deux parties lors de son acceptation.</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 justify-end mt-6">
                  <Button variant="outline" onClick={() => { setShowPreviewModal(false); setSelectedDevis(null); }}>
                    Fermer
                  </Button>
                  <Button variant="outline" onClick={() => handleExportPDF(selectedDevis)}>
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger PDF
                  </Button>
                  {selectedDevis.statut === 'brouillon' && (
                    <Button onClick={() => {
                      setShowPreviewModal(false);
                      handleSendToClient(selectedDevis);
                    }}>
                      <Send className="w-4 h-4 mr-2" />
                      Envoyer au client
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
