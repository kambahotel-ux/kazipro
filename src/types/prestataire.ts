// Types pour les prestataires avec distinction Personne Physique / Personne Morale

export type TypePrestataire = 'physique' | 'morale';

export type FormeJuridique = 
  | 'SARL' 
  | 'SA' 
  | 'SUARL' 
  | 'SNC' 
  | 'SCS' 
  | 'SCA' 
  | 'Entreprise Individuelle' 
  | 'Autre';

export interface PrestataireBase {
  id: string;
  user_id: string;
  type_prestataire: TypePrestataire;
  
  // Champs communs
  full_name: string; // Conservé pour compatibilité
  profession: string;
  bio?: string;
  phone: string;
  email: string;
  rating: number;
  verified: boolean;
  documents_verified: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface PrestatairePhysique extends PrestataireBase {
  type_prestataire: 'physique';
  
  // Informations personnelles
  nom: string;
  prenom: string;
  date_naissance?: string;
  
  // Documents d'identité
  numero_cni?: string;
  photo_cni?: string;
  
  // Champs personne morale (non utilisés)
  raison_sociale?: never;
  forme_juridique?: never;
  numero_rccm?: never;
  numero_impot?: never;
  numero_id_nat?: never;
  representant_legal_nom?: never;
  representant_legal_prenom?: never;
  representant_legal_fonction?: never;
  adresse_siege?: never;
  ville_siege?: never;
  pays_siege?: never;
  document_rccm?: never;
  document_id_nat?: never;
  document_statuts?: never;
}

export interface PrestataireMorale extends PrestataireBase {
  type_prestataire: 'morale';
  
  // Informations de l'entreprise
  raison_sociale: string;
  forme_juridique?: FormeJuridique;
  
  // Numéros d'identification
  numero_rccm?: string;
  numero_impot?: string;
  numero_id_nat?: string;
  
  // Représentant légal
  representant_legal_nom: string;
  representant_legal_prenom?: string;
  representant_legal_fonction?: string;
  
  // Adresse du siège
  adresse_siege?: string;
  ville_siege?: string;
  pays_siege?: string;
  
  // Documents
  document_rccm?: string;
  document_id_nat?: string;
  document_statuts?: string;
  
  // Champs personne physique (non utilisés)
  nom?: never;
  prenom?: never;
  date_naissance?: never;
  numero_cni?: never;
  photo_cni?: never;
}

// Type union pour un prestataire (physique OU morale)
export type Prestataire = PrestatairePhysique | PrestataireMorale;

// Type pour la vue prestataires_view
export interface PrestataireView extends Omit<Prestataire, 'full_name'> {
  display_name: string; // Nom calculé selon le type
  type_display: 'Personne Physique' | 'Personne Morale';
}

// Type pour le formulaire d'inscription
export interface PrestataireFormData {
  type_prestataire: TypePrestataire;
  
  // Champs communs
  profession: string;
  bio?: string;
  phone: string;
  email: string;
  
  // Personne physique
  nom?: string;
  prenom?: string;
  date_naissance?: string;
  numero_cni?: string;
  photo_cni?: File;
  
  // Personne morale
  raison_sociale?: string;
  forme_juridique?: FormeJuridique;
  numero_rccm?: string;
  numero_impot?: string;
  numero_id_nat?: string;
  representant_legal_nom?: string;
  representant_legal_prenom?: string;
  representant_legal_fonction?: string;
  adresse_siege?: string;
  ville_siege?: string;
  document_rccm?: File;
  document_id_nat?: File;
  document_statuts?: File;
}

// Helper functions
export const getPrestataireDisplayName = (prestataire: Prestataire): string => {
  if (prestataire.type_prestataire === 'physique') {
    return `${prestataire.prenom} ${prestataire.nom}`;
  }
  return prestataire.raison_sociale;
};

export const getPrestataireTypeLabel = (type: TypePrestataire): string => {
  return type === 'physique' ? 'Personne Physique' : 'Personne Morale';
};

export const getPrestataireTypeIcon = (type: TypePrestataire): string => {
  return type === 'physique' ? '👤' : '🏢';
};

export const isPersonnePhysique = (prestataire: Prestataire): prestataire is PrestatairePhysique => {
  return prestataire.type_prestataire === 'physique';
};

export const isPersonneMorale = (prestataire: Prestataire): prestataire is PrestataireMorale => {
  return prestataire.type_prestataire === 'morale';
};

// Validation helpers
export const validatePrestatairePhysique = (data: Partial<PrestataireFormData>): string[] => {
  const errors: string[] = [];
  
  if (!data.nom) errors.push('Le nom est requis');
  if (!data.prenom) errors.push('Le prénom est requis');
  
  return errors;
};

export const validatePrestataireMorale = (data: Partial<PrestataireFormData>): string[] => {
  const errors: string[] = [];
  
  if (!data.raison_sociale) errors.push('La raison sociale est requise');
  if (!data.representant_legal_nom) errors.push('Le nom du représentant légal est requis');
  
  return errors;
};

export const validatePrestataireForm = (data: PrestataireFormData): string[] => {
  const commonErrors: string[] = [];
  
  if (!data.profession) commonErrors.push('La profession est requise');
  if (!data.phone) commonErrors.push('Le téléphone est requis');
  if (!data.email) commonErrors.push('L\'email est requis');
  
  const specificErrors = data.type_prestataire === 'physique'
    ? validatePrestatairePhysique(data)
    : validatePrestataireMorale(data);
  
  return [...commonErrors, ...specificErrors];
};
