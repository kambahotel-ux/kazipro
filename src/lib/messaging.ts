export type MessagingRole = 'client' | 'prestataire';

export interface MessagingLinkParams {
  partnerUserId: string | number;
  demandeId?: string | number;
  name?: string;
  mission?: string;
}

/** Deep-link vers la messagerie avec un interlocuteur (1er message ou reprise de fil). */
export function messagesPath(role: MessagingRole, params: MessagingLinkParams): string {
  const base =
    role === 'client' ? '/dashboard/client/messages' : '/dashboard/prestataire/messages';
  const q = new URLSearchParams();
  q.set('partner', String(params.partnerUserId));
  if (params.demandeId != null) q.set('demande', String(params.demandeId));
  if (params.name) q.set('name', params.name);
  if (params.mission) q.set('mission', params.mission);
  return `${base}?${q.toString()}`;
}

export function partnerUserIdFromProfil(
  profil: Record<string, unknown> | null | undefined,
): string | null {
  if (!profil) return null;
  const user = profil.user as Record<string, unknown> | undefined;
  const fromUser = user?.id;
  if (fromUser != null) return String(fromUser);
  if (profil.user_id != null) return String(profil.user_id);
  return null;
}

export function readMessagingSearchParams(searchParams: URLSearchParams) {
  const name = searchParams.get('name');
  const mission = searchParams.get('mission');
  return {
    partnerId: searchParams.get('partner'),
    demandeId: searchParams.get('demande'),
    name: name ? decodeURIComponent(name) : undefined,
    mission: mission ? decodeURIComponent(mission) : undefined,
  };
}
