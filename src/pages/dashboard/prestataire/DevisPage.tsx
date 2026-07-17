import { useState, useEffect, useMemo } from "react";
import { PrestatairePageShell } from "@/components/prestataire/PrestatairePageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  CheckCircle,
  Clock,
  Loader,
  Send,
  FileText,
  Download,
  X,
  Save,
  Copy,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAbortableFetch } from "@/hooks/useAbortableFetch";
import { devisApi } from "@/lib/api";
import { parsePaginatedMeta, unwrapPaginated } from "@/lib/api-utils";
import { mapDevisToUi } from "@/lib/client-helpers";
import { displayNameFromProfil, getProfil, prestataireIdFromUser } from "@/lib/kazipro-profile";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DateRangeFilter } from "@/components/filters/DateRangeFilter";
import { FormDrawer } from "@/components/ui/FormDrawer";
import { AdminListSkeleton } from "@/components/dashboard/AdminLoadingSkeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DevisStatusBadge,
  PrestataireDevisCard,
  type PrestataireDevisCardData,
} from "@/components/devis/PrestataireDevisCard";
import { PrestataireEmptyState } from "@/components/prestataire/PrestataireEmptyState";
import { formatMontant } from "@/lib/devis-form";

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
  location?: string;
  items_count?: number;
  items_preview?: string[];
}

type DevisPageProps = { embedded?: boolean };

export default function DevisPage({ embedded = false }: DevisPageProps) {
  const { user } = useAuth();
  const [providerName, setProviderName] = useState("Prestataire");
  const [providerId, setProviderId] = useState<string | null>(null);
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalDevis, setTotalDevis] = useState(0);
  const PAGE_SIZE = 20;
  
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
  const [previewLoading, setPreviewLoading] = useState(false);
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

  useAbortableFetch(Boolean(providerId), [providerId, page, filters.search, filters.status, filters.startDate, filters.endDate], async (signal) => {
    if (!providerId || signal.aborted) return;
    await fetchDevis(page, signal);
  });

  const fetchProviderInfo = async () => {
    if (!user) return;
    try {
      const profil = getProfil(user);
      const pid = prestataireIdFromUser(user);
      if (profil && pid) {
        setProviderName(displayNameFromProfil(profil, user.name || "Prestataire"));
        setProviderId(pid);
      }
    } catch (error) {
      console.error("Error fetching provider:", error);
    }
  };

  const mapRawToDevis = (raw: Record<string, unknown>): Devis => {
    const mapped = mapDevisToUi(raw);
    const demande = raw.demande as Record<string, unknown> | undefined;
    const client = raw.client ?? demande?.client;
    const lineItems = (mapped.items ?? []).map((it) => ({
      ...it,
      quantite: Number(it.quantite ?? 1),
      prix_unitaire: Number(it.prix_unitaire ?? 0),
      montant: Number(it.montant ?? 0),
      unite: String(it.unite ?? "unité"),
      designation: String(it.designation ?? "—"),
    }));
    const ville = demande?.ville ? String(demande.ville) : "";
    const quartier = demande?.quartier ? String(demande.quartier) : "";
    const location = [ville, quartier].filter(Boolean).join(" · ") || undefined;
    return {
      ...mapped,
      id: String(raw.id),
      numero: String(mapped.numero ?? raw.numero ?? ""),
      titre: String(demande?.titre ?? mapped.titre ?? "Devis"),
      description: raw.description ? String(raw.description) : mapped.description,
      prestataire_id: String(raw.prestataire_id ?? providerId),
      statut: (mapped.statut ?? "envoye") as Devis["statut"],
      date_creation: String(mapped.created_at ?? raw.created_at ?? new Date().toISOString()),
      created_at: String(raw.created_at ?? new Date().toISOString()),
      montant_ht: Number(mapped.montant_ht ?? raw.montant_ht ?? 0),
      montant_ttc: Number(mapped.montant_ttc ?? raw.montant_ttc ?? 0),
      tva: Number(mapped.taux_tva ?? raw.tva ?? 16),
      devise: String(raw.devise ?? mapped.devise ?? "CDF"),
      items: lineItems,
      items_count: lineItems.length,
      items_preview: lineItems.map((it) => it.designation).filter(Boolean),
      location,
      client_name: client ? displayNameFromProfil(client as Record<string, unknown>) : undefined,
    } as Devis;
  };

  const openDevisPreview = async (devis: Devis) => {
    setSelectedDevis(devis);
    setShowPreviewModal(true);
    setPreviewLoading(true);
    try {
      const full = await devisApi.getById(devis.id);
      setSelectedDevis(mapRawToDevis(full as Record<string, unknown>));
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger le détail du devis");
    } finally {
      setPreviewLoading(false);
    }
  };

  const fetchDevis = async (targetPage = 1, signal?: AbortSignal) => {
    if (!providerId) return;
    try {
      setLoading(true);
      const res = await devisApi.getAll(
        {
          page: targetPage,
          per_page: PAGE_SIZE,
          search: filters.search.trim() || undefined,
          statut: filters.status !== "all" ? filters.status : undefined,
          date_from: filters.startDate || undefined,
          date_to: filters.endDate || undefined,
        },
        { force: true },
      );
      const meta = parsePaginatedMeta(res);
      const rows = unwrapPaginated<Record<string, unknown>>(res);
      const devisWithDetails = rows.map((raw) => mapRawToDevis(raw));

      setDevisList(devisWithDetails);
      setPage(meta.current_page || targetPage);
      setLastPage(Math.max(1, meta.last_page || 1));
      setTotalDevis(meta.total ?? rows.length);
    } catch (error: unknown) {
      if (signal?.aborted) return;
      toast.error("Erreur lors du chargement des devis");
      console.error(error);
    } finally {
      if (!signal?.aborted) setLoading(false);
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
      
      await devisApi.create({
        prestataire_id: providerId,
        titre: formData.titre,
        description: formData.description,
        notes: formData.notes,
        conditions: formData.conditions,
        montant_ht,
        tva: formData.tva,
        montant_ttc,
        statut,
        items: items.map((item) => ({
          designation: item.designation,
          quantite: item.quantite,
          unite: item.unite,
          prix_unitaire: item.prix_unitaire,
          montant: item.montant,
        })),
      });

      toast.success(statut === 'brouillon' ? "Devis créé en brouillon" : "Devis envoyé avec succès");
      setShowCreateModal(false);
      resetForm();
      fetchDevis(page);
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
      await devisApi.delete(devisId);

      toast.success("Devis supprimé");
      fetchDevis(page);
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
      
      await devisApi.update(String(editingDevis.id), {
        titre: formData.titre,
        description: formData.description,
        notes: formData.notes,
        conditions: formData.conditions,
        montant_ht,
        tva: formData.tva,
        montant_ttc,
        statut,
        items: items.map((item) => ({
          designation: item.designation,
          quantite: item.quantite,
          unite: item.unite,
          prix_unitaire: item.prix_unitaire,
          montant: item.montant,
        })),
      });

      toast.success(statut === 'brouillon' ? "Devis mis à jour" : "Devis envoyé avec succès");
      setShowEditModal(false);
      setEditingDevis(null);
      resetForm();
      fetchDevis(page);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
      console.error(error);
    }
  };

  const handleExportPDF = async (devis: Devis) => {
    try {
      toast.info("Génération du PDF en cours...");
      
      // Récupérer les informations d'entreprise du prestataire
      const entrepriseData = null;
      
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
      await devisApi.update(String(devis.id), { statut: 'envoye' });

      toast.success("Devis envoyé au client avec succès!");
      fetchDevis(page);
    } catch (error: any) {
      toast.error("Erreur lors de l'envoi du devis");
      console.error(error);
    }
  };

  const filteredDevis = useMemo(() => {
    if (filters.devise === 'all') return devisList;
    return devisList.filter((d) => (d.devise || 'FC') === filters.devise);
  }, [devisList, filters.devise]);

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
    setPage(1);
  };

  const toCardData = (devis: Devis): PrestataireDevisCardData => ({
    id: devis.id,
    numero: devis.numero,
    titre: devis.titre,
    description: devis.description,
    statut: devis.statut,
    montant_ht: devis.montant_ht,
    montant_ttc: devis.montant_ttc,
    tva: devis.tva,
    devise: devis.devise,
    created_at: devis.created_at,
    client_name: devis.client_name,
    location: devis.location,
    items_count: devis.items_count,
    items_preview: devis.items_preview,
  });

  const DevisActionsMenu = ({ devis }: { devis: Devis }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          className="gap-2"
          onClick={() => openDevisPreview(devis)}
        >
          <Eye className="w-4 h-4" />
          Voir
        </DropdownMenuItem>
        {devis.statut === "brouillon" && (
          <>
            <DropdownMenuItem className="gap-2" onClick={() => handleEditDevis(devis)}>
              <Edit className="w-4 h-4" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={() => handleSendToClient(devis)}>
              <Send className="w-4 h-4" />
              Envoyer
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem className="gap-2" onClick={() => handleExportPDF(devis)}>
          <Download className="w-4 h-4" />
          Télécharger PDF
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2" onClick={() => handleDuplicateDevis(devis)}>
          <Copy className="w-4 h-4" />
          Dupliquer
        </DropdownMenuItem>
        {(devis.statut === "brouillon" || devis.statut === "refuse") && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive"
              onClick={() => handleDeleteDevis(devis.id)}
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <PrestatairePageShell embedded={embedded} userName={providerName} userRole="Prestataire">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          {!embedded && (
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold">Mes Devis</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Créez et gérez vos devis professionnels</p>
          </div>
          )}
          <Button onClick={() => setShowCreateModal(true)} className={`text-sm ${embedded ? 'ml-auto' : ''}`}>
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Nouveau devis</span>
            <span className="sm:hidden">Nouveau</span>
          </Button>
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
              Filtres actifs: {totalDevis} résultat(s)
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
                  onChange={(e) => {
                    setFilters({ ...filters, search: e.target.value });
                    setPage(1);
                  }}
                />
              </div>
              
              {/* Status */}
              <Select value={filters.status} onValueChange={(v) => { setFilters({ ...filters, status: v }); setPage(1); }}>
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
              <Select value={filters.devise} onValueChange={(v) => { setFilters({ ...filters, devise: v }); setPage(1); }}>
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
                onStartDateChange={(d) => { setFilters({ ...filters, startDate: d }); setPage(1); }}
                onEndDateChange={(d) => { setFilters({ ...filters, endDate: d }); setPage(1); }}
                label="Période de création"
              />
            </div>
            
            {/* Results bar */}
            <div className="flex items-center justify-between">
              <Badge variant="secondary">
                {totalDevis} résultat(s)
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
          <AdminListSkeleton items={4} />
        ) : filteredDevis.length === 0 ? (
          <PrestataireEmptyState
            context="devis"
            hasActiveFilters={Boolean(hasActiveFilters)}
            onResetFilters={resetFilters}
            extraActions={
              hasActiveFilters
                ? undefined
                : [
                    {
                      label: "Créer un devis",
                      onClick: () => setShowCreateModal(true),
                      variant: "default",
                    },
                  ]
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredDevis.map((devis) => (
              <PrestataireDevisCard
                key={devis.id}
                devis={toCardData(devis)}
                onView={() => openDevisPreview(devis)}
                actionsMenu={<DevisActionsMenu devis={devis} />}
              />
            ))}
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Page {page} sur {lastPage} ({totalDevis} devis)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= lastPage}
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                >
                  Suivant
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        <FormDrawer
          open={showCreateModal}
          onOpenChange={(open) => {
            setShowCreateModal(open);
            if (!open) resetForm();
          }}
          title="Créer un Devis"
          className="lg:max-w-4xl"
          footer={
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowCreateModal(false); resetForm(); }}>
                Annuler
              </Button>
              <Button variant="outline" onClick={() => handleCreateDevis("brouillon")}>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer brouillon
              </Button>
              <Button onClick={() => handleCreateDevis("envoye")}>
                <Send className="w-4 h-4 mr-2" />
                Envoyer
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
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

          </div>
        </FormDrawer>

        <FormDrawer
          open={showEditModal && !!editingDevis}
          onOpenChange={(open) => {
            if (!open) {
              setShowEditModal(false);
              setEditingDevis(null);
              resetForm();
            }
          }}
          title={editingDevis ? `Modifier le Devis - ${editingDevis.numero}` : "Modifier le Devis"}
          className="lg:max-w-4xl"
          footer={
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowEditModal(false); setEditingDevis(null); resetForm(); }}>
                Annuler
              </Button>
              <Button variant="outline" onClick={() => handleUpdateDevis("brouillon")}>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
              <Button onClick={() => handleUpdateDevis("envoye")}>
                <Send className="w-4 h-4 mr-2" />
                Enregistrer et envoyer
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
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

          </div>
        </FormDrawer>

        <FormDrawer
          open={showPreviewModal && !!selectedDevis}
          onOpenChange={(open) => {
            if (!open) {
              setShowPreviewModal(false);
              setSelectedDevis(null);
            }
          }}
          title="Prévisualisation du Devis"
          description={selectedDevis?.numero}
          className="lg:max-w-4xl"
          footer={
            selectedDevis ? (
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <Button variant="outline" onClick={() => handleExportPDF(selectedDevis)}>
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger PDF
                </Button>
                {selectedDevis.statut === "brouillon" && (
                  <Button
                    onClick={() => {
                      setShowPreviewModal(false);
                      handleSendToClient(selectedDevis);
                    }}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer au client
                  </Button>
                )}
              </div>
            ) : null
          }
        >
          {selectedDevis && (
            <div>
                {previewLoading ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                    <Loader className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm">Chargement des lignes du devis…</p>
                  </div>
                ) : (
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
                      <div className="mt-2 flex justify-end">
                        <DevisStatusBadge statut={selectedDevis.statut} />
                      </div>
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
                              <td className="p-3 text-sm text-right tabular-nums">
                                {formatMontant(item.prix_unitaire, selectedDevis.devise || 'CDF')}
                              </td>
                              <td className="p-3 text-sm text-right font-medium tabular-nums">
                                {formatMontant(item.montant, selectedDevis.devise || 'CDF')}
                              </td>
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
                        <span className="font-medium tabular-nums">
                          {formatMontant(selectedDevis.montant_ht, selectedDevis.devise || 'CDF')}
                        </span>
                      </div>
                      {selectedDevis.frais_deplacement > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Frais de déplacement:</span>
                          <span className="font-medium">{selectedDevis.frais_deplacement.toLocaleString()} {selectedDevis.devise || 'FC'}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span>TVA ({selectedDevis.tva}%):</span>
                        <span className="font-medium tabular-nums">
                          {formatMontant(
                            selectedDevis.montant_ttc - selectedDevis.montant_ht,
                            selectedDevis.devise || 'CDF',
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total TTC:</span>
                        <span className="text-primary tabular-nums">
                          {formatMontant(selectedDevis.montant_ttc, selectedDevis.devise || 'CDF')}
                        </span>
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
                )}

            </div>
          )}
        </FormDrawer>
      </div>
    </PrestatairePageShell>
  );
}
