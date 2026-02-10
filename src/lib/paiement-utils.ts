// ============================================
// UTILITAIRES - SYSTÈME DE PAIEMENT
// ============================================

import {
  ConfigurationPaiementGlobale,
  ConfigurationPaiementPrestataire,
  FraisDeplacementConfig,
  CalculMontants,
} from '@/types/paiement';

/**
 * Calcule les frais de déplacement selon la configuration du prestataire
 */
export function calculateFraisDeplacement(
  config: FraisDeplacementConfig | null,
  distanceKm?: number,
  zoneNom?: string
): number {
  if (!config || !config.actif) {
    return 0;
  }

  let montant = 0;

  switch (config.mode_calcul) {
    case 'fixe':
      montant = config.montant_fixe || 0;
      break;

    case 'par_km':
      if (distanceKm !== undefined) {
        const distanceFacturable = Math.max(
          0,
          distanceKm - (config.distance_gratuite_km || 0)
        );
        montant = distanceFacturable * (config.prix_par_km || 0);
      }
      break;

    case 'par_zone':
      if (zoneNom && config.zones) {
        const zone = config.zones.find((z) => z.nom === zoneNom);
        montant = zone?.prix || 0;
      }
      break;

    case 'gratuit':
      montant = 0;
      break;
  }

  // Appliquer les limites
  if (config.montant_minimum !== undefined && montant < config.montant_minimum) {
    montant = config.montant_minimum;
  }
  if (config.montant_maximum !== undefined && montant > config.montant_maximum) {
    montant = config.montant_maximum;
  }

  return montant;
}

/**
 * Calcule les commissions selon la configuration
 */
export function calculateCommissions(
  montantTravaux: number,
  montantMateriel: number,
  montantDeplacement: number,
  configGlobale: ConfigurationPaiementGlobale,
  configPrestataire?: ConfigurationPaiementPrestataire | null
): {
  commission_travaux: number;
  commission_materiel: number;
  commission_deplacement: number;
  commission_totale: number;
} {
  // Si le prestataire n'utilise pas KaziPro, pas de commission
  if (configPrestataire && !configPrestataire.paiement_via_kazipro) {
    return {
      commission_travaux: 0,
      commission_materiel: 0,
      commission_deplacement: 0,
      commission_totale: 0,
    };
  }

  // Déterminer les taux à utiliser (personnalisés ou globaux)
  const tauxTravaux =
    configPrestataire?.commission_main_oeuvre ?? configGlobale.commission_main_oeuvre;
  const tauxMateriel =
    configPrestataire?.commission_materiel ?? configGlobale.commission_materiel;
  const tauxDeplacement =
    configPrestataire?.commission_deplacement ?? configGlobale.commission_deplacement;

  // Calculer les commissions selon les éléments activés
  const commissionTravaux =
    configPrestataire?.main_oeuvre_via_kazipro !== false
      ? (montantTravaux * tauxTravaux) / 100
      : 0;

  const commissionMateriel =
    configPrestataire?.materiel_via_kazipro !== false
      ? (montantMateriel * tauxMateriel) / 100
      : 0;

  const commissionDeplacement =
    configPrestataire?.deplacement_via_kazipro !== false
      ? (montantDeplacement * tauxDeplacement) / 100
      : 0;

  return {
    commission_travaux: Math.round(commissionTravaux * 100) / 100,
    commission_materiel: Math.round(commissionMateriel * 100) / 100,
    commission_deplacement: Math.round(commissionDeplacement * 100) / 100,
    commission_totale:
      Math.round((commissionTravaux + commissionMateriel + commissionDeplacement) * 100) / 100,
  };
}

/**
 * Calcule tous les montants d'un devis
 */
export function calculateDevisMontants(
  montantTravauxHT: number,
  montantMaterielHT: number,
  fraisDeplacement: number,
  tauxTVA: number,
  configGlobale: ConfigurationPaiementGlobale,
  configPrestataire?: ConfigurationPaiementPrestataire | null,
  pourcentageAcompte?: number
): CalculMontants {
  // Sous-total HT
  const sousTotalHT = montantTravauxHT + montantMaterielHT + fraisDeplacement;

  // TVA
  const tva = (sousTotalHT * tauxTVA) / 100;

  // Total TTC
  const montantTotalTTC = sousTotalHT + tva;

  // Commissions
  const commissions = calculateCommissions(
    montantTravauxHT,
    montantMaterielHT,
    fraisDeplacement,
    configGlobale,
    configPrestataire
  );

  // Montant que reçoit le prestataire
  const montantPrestataire = montantTotalTTC - commissions.commission_totale;

  // Acompte et solde
  const pourcentage =
    pourcentageAcompte ??
    configPrestataire?.pourcentage_acompte ??
    configGlobale.pourcentage_acompte_defaut;

  const montantAcompte = (montantTotalTTC * pourcentage) / 100;
  const montantSolde = montantTotalTTC - montantAcompte;

  return {
    montant_travaux_ht: Math.round(montantTravauxHT * 100) / 100,
    montant_materiel_ht: Math.round(montantMaterielHT * 100) / 100,
    frais_deplacement: Math.round(fraisDeplacement * 100) / 100,
    sous_total_ht: Math.round(sousTotalHT * 100) / 100,
    tva: Math.round(tva * 100) / 100,
    montant_total_ttc: Math.round(montantTotalTTC * 100) / 100,
    commission_travaux: commissions.commission_travaux,
    commission_materiel: commissions.commission_materiel,
    commission_deplacement: commissions.commission_deplacement,
    commission_totale: commissions.commission_totale,
    montant_prestataire: Math.round(montantPrestataire * 100) / 100,
    montant_acompte: Math.round(montantAcompte * 100) / 100,
    montant_solde: Math.round(montantSolde * 100) / 100,
  };
}

/**
 * Formate un montant en devise
 */
export function formatMontant(montant: number, devise: string = 'FC'): string {
  return `${montant.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${devise}`;
}

/**
 * Génère un numéro de contrat
 */
export function generateContratNumero(count: number): string {
  const year = new Date().getFullYear();
  const numero = String(count + 1).padStart(4, '0');
  return `CONT-${year}-${numero}`;
}

/**
 * Génère un numéro de paiement
 */
export function generatePaiementNumero(count: number): string {
  const year = new Date().getFullYear();
  const numero = String(count + 1).padStart(4, '0');
  return `PAY-${year}-${numero}`;
}

/**
 * Génère un numéro de litige
 */
export function generateLitigeNumero(count: number): string {
  const year = new Date().getFullYear();
  const numero = String(count + 1).padStart(4, '0');
  return `LIT-${year}-${numero}`;
}

/**
 * Valide un numéro de téléphone congolais
 */
export function validatePhoneNumberCongo(phone: string): boolean {
  // Format: +243 suivi de 9 chiffres
  const regex = /^\+243\d{9}$/;
  return regex.test(phone);
}

/**
 * Formate un numéro de téléphone
 */
export function formatPhoneNumber(phone: string): string {
  if (phone.startsWith('+243')) {
    return phone.replace(/(\+243)(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  return phone;
}

/**
 * Calcule le nombre de jours entre deux dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Ajoute des jours à une date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Vérifie si une date est passée
 */
export function isDatePassed(date: Date): boolean {
  return date < new Date();
}

/**
 * Calcule le temps restant avant une date
 */
export function timeUntil(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  if (diff < 0) {
    return 'Expiré';
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days} jour${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} heure${hours > 1 ? 's' : ''}`;
  } else {
    return 'Moins d\'une heure';
  }
}

/**
 * Obtient le label d'un statut de paiement
 */
export function getStatutPaiementLabel(statut: string): string {
  const labels: Record<string, string> = {
    en_attente: 'En attente',
    en_cours: 'En cours',
    valide: 'Validé',
    echoue: 'Échoué',
    rembourse: 'Remboursé',
    annule: 'Annulé',
  };
  return labels[statut] || statut;
}

/**
 * Obtient la couleur d'un statut de paiement
 */
export function getStatutPaiementColor(statut: string): string {
  const colors: Record<string, string> = {
    en_attente: 'text-yellow-600 bg-yellow-50',
    en_cours: 'text-blue-600 bg-blue-50',
    valide: 'text-green-600 bg-green-50',
    echoue: 'text-red-600 bg-red-50',
    rembourse: 'text-purple-600 bg-purple-50',
    annule: 'text-gray-600 bg-gray-50',
  };
  return colors[statut] || 'text-gray-600 bg-gray-50';
}

/**
 * Obtient le label d'un type de paiement
 */
export function getTypePaiementLabel(type: string): string {
  const labels: Record<string, string> = {
    acompte: 'Acompte',
    solde: 'Solde',
    complet: 'Paiement complet',
    echeance: 'Échéance',
    garantie: 'Garantie',
  };
  return labels[type] || type;
}

/**
 * Obtient le label d'une méthode de paiement
 */
export function getMethodePaiementLabel(methode: string): string {
  const labels: Record<string, string> = {
    mpesa: 'M-Pesa',
    airtel_money: 'Airtel Money',
    orange_money: 'Orange Money',
    carte_bancaire: 'Carte bancaire',
    especes: 'Espèces',
    virement: 'Virement',
    direct: 'Paiement direct',
  };
  return labels[methode] || methode;
}
