-- Ajouter le système de statut en ligne pour les prestataires

-- 1. Ajouter les colonnes pour le statut en ligne
ALTER TABLE prestataires 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_prestataires_online ON prestataires(is_online, last_seen);

-- 3. Fonction pour marquer un prestataire comme hors ligne après 5 minutes d'inactivité
CREATE OR REPLACE FUNCTION mark_inactive_providers_offline()
RETURNS void AS $$
BEGIN
  UPDATE prestataires
  SET is_online = false
  WHERE is_online = true
  AND last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- 4. Créer une extension pour les tâches planifiées (si pas déjà installée)
-- Note: Ceci nécessite les droits superuser, peut être fait manuellement
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 5. Planifier l'exécution de la fonction toutes les minutes
-- Note: Décommentez si pg_cron est installé
-- SELECT cron.schedule('mark-offline', '* * * * *', 'SELECT mark_inactive_providers_offline()');

-- 6. Fonction pour mettre à jour le statut en ligne
CREATE OR REPLACE FUNCTION update_provider_online_status(provider_id UUID, online BOOLEAN)
RETURNS void AS $$
BEGIN
  UPDATE prestataires
  SET 
    is_online = online,
    last_seen = NOW()
  WHERE id = provider_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Vue pour obtenir les statistiques en ligne
CREATE OR REPLACE VIEW online_providers_stats AS
SELECT 
  COUNT(*) FILTER (WHERE is_online = true) as online_count,
  COUNT(*) FILTER (WHERE verified = true) as total_verified,
  COUNT(*) FILTER (WHERE is_online = true AND verified = true) as online_verified
FROM prestataires;

-- 8. Mettre à jour les RLS policies pour permettre la lecture du statut
-- Les clients et admins peuvent voir le statut en ligne
ALTER TABLE prestataires ENABLE ROW LEVEL SECURITY;

-- Policy pour que tout le monde puisse voir le statut en ligne des prestataires vérifiés
CREATE POLICY "Anyone can view online status of verified providers"
ON prestataires FOR SELECT
USING (verified = true);

-- Policy pour que les prestataires puissent mettre à jour leur propre statut
CREATE POLICY "Providers can update their own online status"
ON prestataires FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 9. Commentaires pour documentation
COMMENT ON COLUMN prestataires.is_online IS 'Indique si le prestataire est actuellement en ligne';
COMMENT ON COLUMN prestataires.last_seen IS 'Dernière activité du prestataire';
COMMENT ON FUNCTION update_provider_online_status IS 'Met à jour le statut en ligne d''un prestataire';
COMMENT ON FUNCTION mark_inactive_providers_offline IS 'Marque les prestataires inactifs comme hors ligne (>5 min)';

-- 10. Afficher les statistiques actuelles
SELECT * FROM online_providers_stats;
