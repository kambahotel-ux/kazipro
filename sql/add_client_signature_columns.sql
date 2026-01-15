-- ============================================
-- Ajouter colonnes pour signature client
-- ============================================

-- Ajouter les colonnes pour la signature du client et la date d'acceptation
ALTER TABLE devis 
ADD COLUMN IF NOT EXISTS client_signature TEXT,
ADD COLUMN IF NOT EXISTS date_acceptation TIMESTAMP WITH TIME ZONE;

-- Commentaires
COMMENT ON COLUMN devis.client_signature IS 'Signature numérique du client (nom complet) lors de l''acceptation';
COMMENT ON COLUMN devis.date_acceptation IS 'Date et heure d''acceptation du devis par le client';

-- ============================================
-- FIN
-- ============================================
