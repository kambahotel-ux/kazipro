// ============================================
// HOOKS - CONFIGURATION PAIEMENT
// ============================================

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ConfigurationPaiementGlobale,
  ConfigurationPaiementPrestataire,
  FraisDeplacementConfig,
  ConditionsPaiementTemplate,
} from '@/types/paiement';
import { toast } from 'sonner';

/**
 * Hook pour récupérer la configuration globale
 */
export function useConfigurationGlobale() {
  const [config, setConfig] = useState<ConfigurationPaiementGlobale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('configuration_paiement_globale')
        .select('*')
        .single();

      if (error) throw error;
      setConfig(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast.error('Erreur lors du chargement de la configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return { config, loading, error, refetch: fetchConfig };
}

/**
 * Hook pour récupérer la configuration d'un prestataire
 */
export function useConfigurationPrestataire(prestataireId?: string) {
  const [config, setConfig] = useState<ConfigurationPaiementPrestataire | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    if (!prestataireId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('configuration_paiement_prestataire')
        .select('*')
        .eq('prestataire_id', prestataireId)
        .maybeSingle();

      if (error) throw error;
      setConfig(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur configuration prestataire:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [prestataireId]);

  return { config, loading, error, refetch: fetchConfig };
}

/**
 * Hook pour récupérer la configuration des frais de déplacement
 */
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
      const { data, error } = await supabase
        .from('frais_deplacement_config')
        .select('*')
        .eq('prestataire_id', prestataireId)
        .maybeSingle();

      if (error) throw error;
      setConfig(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur frais déplacement:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [prestataireId]);

  return { config, loading, error, refetch: fetchConfig };
}

/**
 * Hook pour récupérer les templates de conditions de paiement
 */
export function useConditionsPaiementTemplates(prestataireId?: string) {
  const [templates, setTemplates] = useState<ConditionsPaiementTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    if (!prestataireId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('conditions_paiement_templates')
        .select('*')
        .eq('prestataire_id', prestataireId)
        .order('est_defaut', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [prestataireId]);

  return { templates, loading, error, refetch: fetchTemplates };
}

/**
 * Hook pour sauvegarder la configuration prestataire
 */
export function useSaveConfigurationPrestataire() {
  const [saving, setSaving] = useState(false);

  const saveConfig = async (
    prestataireId: string,
    config: Partial<ConfigurationPaiementPrestataire>
  ) => {
    try {
      setSaving(true);

      // Vérifier si une config existe déjà
      const { data: existing } = await supabase
        .from('configuration_paiement_prestataire')
        .select('id')
        .eq('prestataire_id', prestataireId)
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from('configuration_paiement_prestataire')
          .update({
            ...config,
            updated_at: new Date().toISOString(),
          })
          .eq('prestataire_id', prestataireId);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('configuration_paiement_prestataire')
          .insert({
            prestataire_id: prestataireId,
            ...config,
          });

        if (error) throw error;
      }

      toast.success('Configuration enregistrée avec succès');
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'enregistrement');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { saveConfig, saving };
}

/**
 * Hook pour sauvegarder la configuration des frais de déplacement
 */
export function useSaveFraisDeplacementConfig() {
  const [saving, setSaving] = useState(false);

  const saveConfig = async (
    prestataireId: string,
    config: Partial<FraisDeplacementConfig>
  ) => {
    try {
      setSaving(true);

      // Vérifier si une config existe déjà
      const { data: existing } = await supabase
        .from('frais_deplacement_config')
        .select('id')
        .eq('prestataire_id', prestataireId)
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from('frais_deplacement_config')
          .update({
            ...config,
            updated_at: new Date().toISOString(),
          })
          .eq('prestataire_id', prestataireId);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('frais_deplacement_config')
          .insert({
            prestataire_id: prestataireId,
            ...config,
          });

        if (error) throw error;
      }

      toast.success('Frais de déplacement enregistrés');
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'enregistrement');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { saveConfig, saving };
}
