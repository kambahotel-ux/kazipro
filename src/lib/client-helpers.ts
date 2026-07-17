import type { AppUser } from '@/types/auth';

export interface ClientProfil {
  id: number | string;
  nom?: string;
  prenom?: string;
  telephone?: string;
  ville?: string;
  quartier?: string;
  photo?: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  current_page?: number;
  last_page?: number;
  per_page?: number;
}

export function getClientProfil(user: AppUser | null): ClientProfil | null {
  if (!user?.profil || typeof user.profil !== 'object') return null;
  return user.profil as ClientProfil;
}

export function getClientId(user: AppUser | null): string | null {
  const profil = getClientProfil(user);
  return profil?.id != null ? String(profil.id) : null;
}

export function getClientDisplayName(user: AppUser | null): string {
  if (!user) return 'Client';
  const profil = getClientProfil(user);
  if (profil?.prenom || profil?.nom) {
    return `${profil.prenom ?? ''} ${profil.nom ?? ''}`.trim();
  }
  return user.name || user.email?.split('@')[0] || 'Client';
}

export function unwrapPaginated<T>(response: PaginatedResponse<T> | T[]): T[] {
  if (Array.isArray(response)) return response;
  return response.data ?? [];
}

export function getPaginatedTotal(response: PaginatedResponse<unknown> | unknown[]): number {
  if (Array.isArray(response)) return response.length;
  return (response as PaginatedResponse<unknown>).total ?? unwrapPaginated(response).length;
}

export function formatDemandeBudget(
  min?: number | string | null,
  max?: number | string | null,
): string | null {
  const nMin = Number(min ?? 0);
  const nMax = Number(max ?? 0);
  const hasMin = nMin > 0;
  const hasMax = nMax > 0;
  if (hasMin && hasMax && nMin !== nMax) {
    return `${nMin.toLocaleString('fr-FR')} – ${nMax.toLocaleString('fr-FR')} FC`;
  }
  if (hasMax) return `Jusqu'à ${nMax.toLocaleString('fr-FR')} FC`;
  if (hasMin) return `À partir de ${nMin.toLocaleString('fr-FR')} FC`;
  return null;
}

export function formatUrgenceLabel(urgence?: string | null): string {
  const key = String(urgence ?? '').toLowerCase();
  const labels: Record<string, string> = {
    normal: 'Normal',
    urgent: 'Urgent',
    tres_urgent: 'Très urgent',
  };
  return labels[key] ?? (urgence ? String(urgence) : '');
}

export function mapDemandeStatutToUi(statut: string): string {
  const s = String(statut ?? '').toLowerCase();
  const map: Record<string, string> = {
    ouverte: 'active',
    devis_recu: 'active',
    acceptee: 'in_progress',
    en_cours: 'in_progress',
    en_execution: 'in_progress',
    en_validation: 'in_progress',
    terminee: 'completed',
    annulee: 'cancelled',
    active: 'active',
    in_progress: 'in_progress',
    completed: 'completed',
    cancelled: 'cancelled',
  };
  return map[s] ?? s;
}

export function mapDemandeToUi(d: Record<string, unknown>) {
  const statut = String(d.statut ?? d.status ?? '');
  const profObj =
    typeof d.profession === 'object' && d.profession
      ? (d.profession as { nom?: string; categorie?: string })
      : null;
  const professionNom =
    profObj?.nom ??
    (typeof d.profession === 'string' ? d.profession : String(d.service ?? ''));
  const professionCategorie = profObj?.categorie ?? '';
  const budgetMin = Number(d.budget_min ?? 0);
  const budgetMax = Number(d.budget_max ?? 0);
  const dateSouhaitee = d.date_souhaitee ?? d.preferred_date ?? d.deadline ?? d.date_limite;

  return {
    ...d,
    title: d.titre ?? d.title ?? 'Sans titre',
    description: d.description ?? '',
    location:
      [d.quartier, d.ville].filter(Boolean).join(', ') ||
      String(d.localisation ?? d.location ?? ''),
    budget_min: budgetMin,
    budget_max: budgetMax,
    budget: formatDemandeBudget(budgetMin, budgetMax),
    status: mapDemandeStatutToUi(statut),
    statut,
    created_at: d.created_at,
    service: professionNom,
    profession_nom: professionNom,
    profession_categorie: professionCategorie,
    preferred_date: dateSouhaitee,
    date_souhaitee: dateSouhaitee,
    numero: d.numero,
    type_demande: d.type,
    statut_moderation: d.statut_moderation,
    urgence_label: formatUrgenceLabel(String(d.urgence ?? d.urgency ?? '')),
    images: d.photos ?? d.images ?? [],
    devis_count: Number(d.devis_count ?? 0),
  };
}

/** Demande mappée pour l’aperçu tableau de bord client. */
export function mapRecentDemandeForDashboard(d: Record<string, unknown>) {
  const mapped = mapDemandeToUi(d);
  const photos = mapped.images;
  const photoCount = Array.isArray(photos) ? photos.length : 0;
  const cible = d.prestataire_cible as { prenom?: string; nom?: string } | null | undefined;
  const prestataireCibleName = cible
    ? [cible.prenom, cible.nom].filter(Boolean).join(' ').trim()
    : undefined;

  return {
    id: String(mapped.id ?? d.id ?? ''),
    title: String(mapped.title),
    description: String(mapped.description ?? ''),
    status: String(mapped.status),
    statut: String(mapped.statut ?? ''),
    numero: String(mapped.numero ?? ''),
    location: String(mapped.location ?? ''),
    service: String(mapped.service ?? ''),
    budget_min: Number(mapped.budget_min ?? 0),
    budget_max: Number(mapped.budget_max ?? 0),
    budget: formatDemandeBudget(
      Number(mapped.budget_min ?? 0),
      Number(mapped.budget_max ?? 0),
    ),
    urgence: String(d.urgence ?? d.urgency ?? ''),
    urgence_label: String(mapped.urgence_label ?? ''),
    type_demande: String(mapped.type_demande ?? d.type ?? ''),
    statut_moderation: String(mapped.statut_moderation ?? ''),
    devis_count: Number(mapped.devis_count ?? 0),
    photoCount,
    created_at: String(mapped.created_at ?? ''),
    prestataire_cible_name: prestataireCibleName || undefined,
  };
}

export type ClientRecentDemande = ReturnType<typeof mapRecentDemandeForDashboard>;

export function mapPrestataireToUi(p: Record<string, unknown>) {
  const profession =
    typeof p.profession === 'object' && p.profession
      ? (p.profession as { nom?: string }).nom
      : p.profession;
  const nameFromParts = `${p.prenom ?? ''} ${p.nom ?? ''}`.trim();
  return {
    ...p,
    full_name:
      (p.full_name as string | undefined) ||
      nameFromParts ||
      (p.raison_sociale as string | undefined) ||
      'Prestataire',
    profession: profession ?? '',
    city: p.ville ?? p.city ?? '',
    photo_url: p.photo ?? p.photo_url,
    verified:
      p.statut_validation === 'valide' ||
      p.verified === true ||
      p.certifie === true,
    rating: Number(p.note_moyenne ?? p.rating ?? 0),
    reviews_count: Number(p.nb_avis ?? p.reviews_count ?? 0),
    hourly_rate: Number(p.tarif_horaire ?? p.hourly_rate ?? 0),
    disponible: p.disponible ?? false,
    phone: p.telephone ?? p.phone ?? '',
    email: (p.user as { email?: string } | undefined)?.email ?? p.email ?? '',
  };
}

export function mapDevisToUi(d: Record<string, unknown>) {
  const prestRaw = d.prestataire ?? d.prestataires;
  const prest = prestRaw
    ? mapPrestataireToUi(
        (Array.isArray(prestRaw) ? prestRaw[0] : prestRaw) as Record<string, unknown>,
      )
    : undefined;
  const items = Array.isArray(d.items)
    ? (d.items as Record<string, unknown>[]).map((it) => ({
        id: it.id,
        designation: it.designation ?? it.description ?? '—',
        description: it.designation ?? it.description,
        quantite: Number(it.quantite ?? 1),
        unite: String(it.unite ?? 'unité'),
        prix_unitaire: Number(it.prix_unitaire ?? 0),
        montant: Number(it.montant ?? it.montant_total ?? it.total ?? Number(it.quantite ?? 1) * Number(it.prix_unitaire ?? 0)),
      }))
    : [];
  return {
    ...d,
    prestataires: prest,
    prestataire: prest,
    titre: d.titre ?? d.description ?? 'Devis',
    montant_ttc: Number(d.montant_ttc ?? 0),
    montant_ht: Number(d.montant_ht ?? 0),
    montant_tva: Number(d.montant_ttc ?? 0) - Number(d.montant_ht ?? 0),
    taux_tva: Number(d.tva ?? d.taux_tva ?? 16),
    statut: d.statut ?? d.status ?? 'envoye',
    validite_jours: 30,
    created_at: d.created_at ?? d.date_creation,
    items,
    _quoteSource: 'devis' as const,
  };
}

export function mapPaiementToUi(p: Record<string, unknown>) {
  const prestRaw = p.prestataire ?? p.prestataires;
  const prest = prestRaw
    ? mapPrestataireToUi(
        (Array.isArray(prestRaw) ? prestRaw[0] : prestRaw) as Record<string, unknown>,
      )
    : undefined;
  const contratRaw = p.contrat ?? p.contrats;
  const contrat = Array.isArray(contratRaw) ? contratRaw[0] : contratRaw;
  return {
    ...p,
    type_paiement: p.type ?? p.type_paiement,
    montant_total: Number(p.montant ?? p.montant_total ?? 0),
    methode_paiement: p.methode ?? p.methode_paiement ?? '',
    date_paiement: p.paye_at ?? p.date_paiement,
    contrats: contrat ? { numero: (contrat as { numero?: string }).numero } : p.contrats,
    prestataires: prest,
    statut: p.statut === 'en_attente' ? 'en_cours' : p.statut,
  };
}

export function mapMissionToUi(m: Record<string, unknown>) {
  const prestRaw = m.prestataire ?? m.prestataires;
  const prest = prestRaw
    ? mapPrestataireToUi(
        (Array.isArray(prestRaw) ? prestRaw[0] : prestRaw) as Record<string, unknown>,
      )
    : undefined;
  const contrat = (m.contrat ?? m.contrats) as Record<string, unknown> | undefined;
  const demande = (m.demande ?? contrat?.demande ?? m.demandes) as
    | Record<string, unknown>
    | undefined;
  const devis = (contrat?.devis ?? m.devis) as Record<string, unknown> | undefined;
  const rawStatut = String(m.statut ?? m.status ?? '');
  return {
    ...m,
    status: rawStatut,
    statut: rawStatut,
    prestataires: prest,
    demandes: demande,
    contrats: contrat,
    devis,
    contrat_id: m.contrat_id ?? contrat?.id,
    demande_id:
      m.demande_id ??
      demande?.id ??
      contrat?.demande_id,
    start_date: m.start_date ?? m.created_at,
  };
}

export function mapMessageToUi(m: Record<string, unknown>) {
  return {
    ...m,
    id: m.id,
    sender_id: m.expediteur_id ?? m.sender_id,
    receiver_id: m.destinataire_id ?? m.receiver_id,
    content: m.contenu ?? m.content ?? '',
    created_at: m.created_at,
  };
}

export function mapContratStatutToUi(statut: string): string {
  const map: Record<string, string> = {
    en_attente: 'genere',
    signe_client: 'signe_client',
    signe_prestataire: 'signe_prestataire',
    actif: 'signe',
    termine: 'termine',
    annule: 'annule',
  };
  return map[String(statut ?? '').toLowerCase()] ?? statut;
}

export function mapAvisToUi(a: Record<string, unknown>) {
  const prest = a.prestataire
    ? mapPrestataireToUi(a.prestataire as Record<string, unknown>)
    : undefined;
  return {
    ...a,
    rating: a.note ?? a.rating,
    comment: a.commentaire ?? a.comment,
    to_user: prest ? { full_name: prest.full_name } : a.to_user,
  };
}
