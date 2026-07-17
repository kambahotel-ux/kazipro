/** Champs alignés sur `config_notifications` — GET/PUT /admin/config-notifications */

export interface ConfigNotificationsAdmin {
  id?: number;
  broadcast_demande_publique_enabled: boolean;
  broadcast_demande_publique_whatsapp: boolean;
  broadcast_demande_publique_max: number;
  broadcast_demande_publique_require_ville: boolean;
  broadcast_demande_publique_require_disponible: boolean;
  demande_publique_moderation_requise: boolean;
  public_media_route: 'storage' | 'fichiers';
  sendflow_enabled: boolean;
  sendflow_base_url: string;
  sendflow_token_configured?: boolean;
  sendflow_instance_phone: string;
  sendflow_code_organisme_configured?: boolean;
  sendflow_use_code_organisme: boolean;
  sendflow_notify_app: boolean;
  sendflow_override_phone: string;
  /** Saisi uniquement à l'enregistrement — jamais renvoyé par l'API */
  sendflow_token?: string;
  sendflow_code_organisme?: string;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_CONFIG_NOTIFICATIONS: ConfigNotificationsAdmin = {
  broadcast_demande_publique_enabled: true,
  broadcast_demande_publique_whatsapp: true,
  broadcast_demande_publique_max: 50,
  broadcast_demande_publique_require_ville: true,
  broadcast_demande_publique_require_disponible: true,
  demande_publique_moderation_requise: false,
  public_media_route: 'storage',
  sendflow_enabled: false,
  sendflow_base_url: 'https://kamba-chat-meet.kazipro.tech',
  sendflow_instance_phone: '',
  sendflow_use_code_organisme: false,
  sendflow_notify_app: true,
  sendflow_override_phone: '',
};

export function mapConfigNotificationsFromApi(raw: Record<string, unknown>): ConfigNotificationsAdmin {
  return {
    id: raw.id != null ? Number(raw.id) : undefined,
    broadcast_demande_publique_enabled: Boolean(raw.broadcast_demande_publique_enabled),
    broadcast_demande_publique_whatsapp: Boolean(raw.broadcast_demande_publique_whatsapp),
    broadcast_demande_publique_max: Number(raw.broadcast_demande_publique_max ?? 50) || 50,
    broadcast_demande_publique_require_ville: raw.broadcast_demande_publique_require_ville !== false,
    broadcast_demande_publique_require_disponible:
      raw.broadcast_demande_publique_require_disponible !== false,
    demande_publique_moderation_requise: Boolean(raw.demande_publique_moderation_requise),
    public_media_route: raw.public_media_route === 'fichiers' ? 'fichiers' : 'storage',
    sendflow_enabled: Boolean(raw.sendflow_enabled),
    sendflow_base_url: String(raw.sendflow_base_url ?? DEFAULT_CONFIG_NOTIFICATIONS.sendflow_base_url),
    sendflow_token_configured: Boolean(raw.sendflow_token_configured),
    sendflow_instance_phone: String(raw.sendflow_instance_phone ?? ''),
    sendflow_code_organisme_configured: Boolean(raw.sendflow_code_organisme_configured),
    sendflow_use_code_organisme: Boolean(raw.sendflow_use_code_organisme),
    sendflow_notify_app: raw.sendflow_notify_app !== false,
    sendflow_override_phone: String(raw.sendflow_override_phone ?? ''),
    created_at: raw.created_at != null ? String(raw.created_at) : undefined,
    updated_at: raw.updated_at != null ? String(raw.updated_at) : undefined,
  };
}

export function unwrapConfigNotificationsResponse(data: unknown): ConfigNotificationsAdmin {
  const row = data as Record<string, unknown>;
  const cfg = (row.config ?? row) as Record<string, unknown>;
  return mapConfigNotificationsFromApi(cfg);
}

export function buildConfigNotificationsPayload(
  form: ConfigNotificationsAdmin,
): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...form };
  delete payload.id;
  delete payload.created_at;
  delete payload.updated_at;
  delete payload.sendflow_token_configured;
  delete payload.sendflow_code_organisme_configured;
  if (!form.sendflow_token) {
    delete payload.sendflow_token;
  }
  if (!form.sendflow_code_organisme) {
    delete payload.sendflow_code_organisme;
  }
  return payload;
}
