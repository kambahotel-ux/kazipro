import { useState, useEffect } from 'react';
import { configPaiementApi, fraisDeplacementApi } from '@/lib/api';
import {
  ConfigurationPaiementGlobale,
  ConfigurationPaiementPrestataire,
  FraisDeplacementConfig,
  ConditionsPaiementTemplate,
} from '@/types/paiement';
import { toast } from 'sonner';

export const DEFAULT_CONFIGURATION_GLOBALE: ConfigurationPaiementGlobale = {
  id: '1',
  mode_paiement: 'optionnel',
  commission_main_oeuvre: 10,
  commission_materiel: 5,
  commission_deplacement: 5,
  pourcentage_acompte_defaut: 30,
  pourcentage_solde_defaut: 70,
  delai_validation_defaut: 7,
  delai_paiement_defaut: 30,
  pourcentage_garantie_defaut: 0,
  duree_garantie_defaut: 30,
  permettre_desactivation: true,
  permettre_choix_elements: true,
  permettre_negociation_commission: false,
  permettre_modification_acompte: true,
  permettre_modification_delais: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function mapApiConfigToGlobale(row: Record<string, unknown>): ConfigurationPaiementGlobale {
  const escrow = row.escrow as Record<string, unknown> | undefined;
  const acompte = Number(row.acompte_pourcentage_defaut ?? 30) || 30;
  const commission = Number(row.commission_plateforme_pct ?? row.commission_plateforme ?? 5) || 5;
  const delai = row.delai_liberation_jours;
  return {
    ...DEFAULT_CONFIGURATION_GLOBALE,
    pourcentage_acompte_defaut: acompte,
    pourcentage_solde_defaut: 100 - acompte,
    commission_main_oeuvre: commission,
    commission_materiel: commission,
    commission_deplacement: commission,
    delai_paiement_defaut: delai != null && delai !== "" ? Number(delai) || 30 : 30,
    permettre_choix_elements: Boolean(
      escrow?.main_oeuvre ?? escrow?.transport ?? row.escrow_main_oeuvre,
    ),
    updated_at: new Date().toISOString(),
  };
}

export function useConfigurationGlobale() {
  const [config, setConfig] = useState<ConfigurationPaiementGlobale>(DEFAULT_CONFIGURATION_GLOBALE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await configPaiementApi.get();
      setConfig(mapApiConfigToGlobale((data ?? {}) as Record<string, unknown>));
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur configuration';
      setConfig(DEFAULT_CONFIGURATION_GLOBALE);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return { config, loading, error, refetch: fetchConfig };
}

export function useConfigurationPrestataire(_prestataireId?: string) {
  const [config] = useState<ConfigurationPaiementPrestataire | null>(null);
  const [loading, setLoading] = useState(false);
  const [error] = useState<string | null>(null);
  return { config, loading, error, refetch: async () => {} };
}

export function useFraisDeplacementConfig(prestataireId?: string) {
  const [config, setConfig] = useState<FraisDeplacementConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    if (!prestataireId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await fraisDeplacementApi.get(prestataireId);
      const rows = Array.isArray(data) ? data : data?.data ?? [];
      setConfig(rows.length > 0 ? (rows[0] as FraisDeplacementConfig) : null);
      setError(null);
    } catch (err: unknown) {
      setConfig(null);
      setError(err instanceof Error ? err.message : 'Erreur frais déplacement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [prestataireId]);

  return { config, loading, error, refetch: fetchConfig };
}

export function useConditionsPaiementTemplates(_prestataireId?: string) {
  const [templates] = useState<ConditionsPaiementTemplate[]>([]);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  return { templates, loading, error, refetch: async () => {} };
}

export function useSaveConfigurationPrestataire() {
  const [saving, setSaving] = useState(false);
  const saveConfig = async () => {
    setSaving(true);
    toast.info('Configuration prestataire gérée via les paramètres généraux.');
    setSaving(false);
    return true;
  };
  return { saveConfig, saving };
}

export function useSaveFraisDeplacementConfig() {
  const [saving, setSaving] = useState(false);

  const saveConfig = async (prestataireId: string, config: Partial<FraisDeplacementConfig>) => {
    try {
      setSaving(true);
      const zones = config.zones ?? [];
      const firstZone = zones[0];
      await fraisDeplacementApi.save(prestataireId, {
        ville_origine: firstZone?.nom ?? 'Kinshasa',
        ville_destination: firstZone?.nom ?? 'Kinshasa',
        montant: Number(firstZone?.prix ?? config.montant_fixe ?? 0),
        unite: config.mode_calcul === 'par_km' ? 'par_km' : 'forfait',
      });
      toast.success('Frais de déplacement enregistrés');
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { saveConfig, saving };
}
