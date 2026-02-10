// ============================================
// TYPES - SYSTÈME DE PAIEMENT ET CONTRACTUALISATION
// ============================================

// Configuration globale (Admin)
export interface ConfigurationPaiementGlobale {
  id: string;
  mode_paiement: 'desactive' | 'optionnel' | 'obligatoire';
  
  // Commissions
  commission_main_oeuvre: number;
  commission_materiel: number;
  commission_deplacement: number;
  
  // Acompte et solde
  pourcentage_acompte_defaut: number;
  pourcentage_solde_defaut: number;
  
  // Délais
  delai_validation_defaut: number;
  delai_paiement_defaut: number;
  
  // Garantie
  pourcentage_garantie_defaut: number;
  duree_garantie_defaut: number;
  
  // Permissions
  permettre_desactivation: boolean;
  permettre_choix_elements: boolean;
  permettre_negociation_commission: boolean;
  permettre_modification_acompte: boolean;
  permettre_modification_delais: boolean;
  
  // Traçabilité
  modified_by?: string;
  modified_at?: string;
  created_at: string;
  updated_at: string;
}

// Historique des modifications
export interface HistoriqueConfigPaiement {
  id: string;
  admin_id?: string;
  admin_email: string;
  anciennes_valeurs: Record<string, any>;
  nouvelles_valeurs: Record<string, any>;
  raison?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Configuration prestataire
export interface ConfigurationPaiementPrestataire {
  id: string;
  prestataire_id: string;
  
  // Activation
  paiement_via_kazipro: boolean;
  
  // Éléments
  main_oeuvre_via_kazipro: boolean;
  materiel_via_kazipro: boolean;
  deplacement_via_kazipro: boolean;
  
  // Commissions personnalisées
  commission_main_oeuvre?: number;
  commission_materiel?: number;
  commission_deplacement?: number;
  
  // Acompte personnalisé
  pourcentage_acompte?: number;
  
  // Délai personnalisé
  delai_validation?: number;
  
  // Métadonnées
  date_activation?: string;
  date_desactivation?: string;
  raison_desactivation?: string;
  
  created_at: string;
  updated_at: string;
}

// Frais de déplacement
export type ModeCalculFrais = 'fixe' | 'par_km' | 'par_zone' | 'gratuit';

export interface ZoneFrais {
  nom: string;
  prix: number;
}

export interface FraisDeplacementConfig {
  id: string;
  prestataire_id: string;
  actif: boolean;
  mode_calcul: ModeCalculFrais;
  
  // Tarifs
  montant_fixe?: number;
  prix_par_km?: number;
  distance_gratuite_km?: number;
  
  // Zones
  zones?: ZoneFrais[];
  
  // Limites
  montant_minimum?: number;
  montant_maximum?: number;
  
  created_at: string;
  updated_at: string;
}

// Templates de conditions de paiement
export type TypePaiement = 'complet_avant' | 'complet_apres' | 'acompte_solde' | 'echelonne';

export interface Echeance {
  pourcentage: number;
  moment: string;
  description?: string;
}

export interface ConditionsPaiementTemplate {
  id: string;
  prestataire_id: string;
  nom: string;
  description?: string;
  type_paiement: TypePaiement;
  
  // Pour acompte_solde
  pourcentage_acompte?: number;
  pourcentage_solde?: number;
  
  // Pour échelonné
  echeances?: Echeance[];
  
  // Délais
  delai_paiement_jours?: number;
  
  est_defaut: boolean;
  created_at: string;
}

// Contrats
export type StatutContrat = 'genere' | 'signe_client' | 'signe_complet' | 'annule';

export interface ConditionsPaiementContrat {
  type: TypePaiement;
  acompte?: number;
  solde?: number;
  delai_validation?: number;
  echeances?: Echeance[];
}

export interface Contrat {
  id: string;
  numero: string;
  
  // Relations
  devis_id: string;
  client_id: string;
  prestataire_id: string;
  
  // Contenu
  contenu_html: string;
  contrat_pdf_url?: string;
  
  // Signatures
  signature_client_url?: string;
  signature_prestataire_url?: string;
  date_signature_client?: string;
  date_signature_prestataire?: string;
  
  // Statut
  statut: StatutContrat;
  
  // Conditions
  conditions_paiement: ConditionsPaiementContrat;
  
  // Métadonnées
  metadata?: Record<string, any>;
  
  created_at: string;
  updated_at: string;
}

// Paiements
export type TypePaiementTransaction = 'acompte' | 'solde' | 'complet' | 'echeance' | 'garantie';
export type MethodePaiement = 'mpesa' | 'airtel_money' | 'orange_money' | 'carte_bancaire' | 'especes' | 'virement' | 'direct';
export type StatutPaiement = 'en_attente' | 'en_cours' | 'valide' | 'echoue' | 'rembourse' | 'annule';

export interface Paiement {
  id: string;
  numero: string;
  
  // Relations
  contrat_id?: string;
  devis_id: string;
  mission_id?: string;
  client_id: string;
  prestataire_id: string;
  
  // Type
  type_paiement: TypePaiementTransaction;
  
  // Montants détaillés
  montant_travaux: number;
  montant_materiel: number;
  montant_deplacement: number;
  montant_total: number;
  
  // Commissions
  commission_travaux?: number;
  commission_materiel?: number;
  commission_deplacement?: number;
  commission_totale?: number;
  montant_prestataire?: number;
  
  // Méthode et statut
  methode_paiement?: MethodePaiement;
  statut: StatutPaiement;
  
  // Détails transaction
  transaction_id?: string;
  reference_paiement?: string;
  recu_url?: string;
  
  // Preuve de paiement (direct)
  preuve_paiement_url?: string;
  preuve_validee_par?: string;
  preuve_validee_at?: string;
  
  // Dates
  date_echeance?: string;
  date_paiement?: string;
  date_validation?: string;
  
  // Métadonnées
  metadata?: Record<string, any>;
  error_message?: string;
  
  created_at: string;
  updated_at: string;
}

// Litiges
export type StatutLitige = 'ouvert' | 'en_cours' | 'resolu' | 'ferme';
export type CategorieLitige = 'qualite_travaux' | 'delai' | 'paiement' | 'materiel' | 'autre';

export interface PreuveLitige {
  type: 'photo' | 'document' | 'message';
  url: string;
  description?: string;
}

export interface DecisionLitige {
  montant_rembourse_client?: number;
  montant_verse_prestataire?: number;
  details?: string;
}

export interface Litige {
  id: string;
  numero: string;
  
  // Relations
  mission_id: string;
  contrat_id?: string;
  devis_id?: string;
  
  // Parties
  ouvert_par: string;
  ouvert_par_type: 'client' | 'prestataire';
  client_id: string;
  prestataire_id: string;
  
  // Détails
  titre: string;
  description: string;
  categorie?: CategorieLitige;
  
  // Preuves
  preuves?: PreuveLitige[];
  
  // Statut
  statut: StatutLitige;
  
  // Résolution
  resolu_par?: string;
  decision?: string;
  decision_details?: DecisionLitige;
  date_resolution?: string;
  
  // Montants
  montant_bloque?: number;
  montant_rembourse_client?: number;
  montant_verse_prestataire?: number;
  
  created_at: string;
  updated_at: string;
}

// Calculs
export interface CalculMontants {
  montant_travaux_ht: number;
  montant_materiel_ht: number;
  frais_deplacement: number;
  sous_total_ht: number;
  tva: number;
  montant_total_ttc: number;
  
  // Commissions
  commission_travaux: number;
  commission_materiel: number;
  commission_deplacement: number;
  commission_totale: number;
  
  // Ce que reçoit le prestataire
  montant_prestataire: number;
  
  // Acompte et solde
  montant_acompte?: number;
  montant_solde?: number;
}

// Réponses API
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface InitierPaiementRequest {
  contrat_id: string;
  type_paiement: TypePaiementTransaction;
  methode_paiement: MethodePaiement;
  numero_telephone?: string;
}

export interface InitierPaiementResponse {
  paiement_id: string;
  transaction_id?: string;
  instructions?: string;
  montant_total: number;
}
