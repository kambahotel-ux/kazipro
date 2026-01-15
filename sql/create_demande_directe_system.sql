-- ============================================
-- Système de Demande Directe avec Invitations
-- ============================================

-- 1. Ajouter colonne type à la table demandes
ALTER TABLE demandes 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'publique' 
CHECK (type IN ('publique', 'directe'));

COMMENT ON COLUMN demandes.type IS 'Type de demande: publique (visible par tous) ou directe (invités seulement)';

-- 2. Créer table demande_invitations
CREATE TABLE IF NOT EXISTS demande_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demande_id UUID NOT NULL REFERENCES demandes(id) ON DELETE CASCADE,
  prestataire_id UUID NOT NULL REFERENCES prestataires(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'responded', 'declined')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  viewed_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(demande_id, prestataire_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_demande_invitations_demande ON demande_invitations(demande_id);
CREATE INDEX IF NOT EXISTS idx_demande_invitations_prestataire ON demande_invitations(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_demande_invitations_status ON demande_invitations(status);

COMMENT ON TABLE demande_invitations IS 'Invitations de prestataires pour demandes directes';
COMMENT ON COLUMN demande_invitations.status IS 'pending: en attente, viewed: vue, responded: répondu, declined: refusé';

-- 3. RLS Policies pour demande_invitations
ALTER TABLE demande_invitations ENABLE ROW LEVEL SECURITY;

-- Clients peuvent voir les invitations de leurs demandes
DROP POLICY IF EXISTS "Clients can view their invitations" ON demande_invitations;
CREATE POLICY "Clients can view their invitations" ON demande_invitations
  FOR SELECT USING (
    demande_id IN (
      SELECT id FROM demandes WHERE client_id IN (
        SELECT id FROM clients WHERE user_id = auth.uid()
      )
    )
  );

-- Prestataires peuvent voir leurs invitations
DROP POLICY IF EXISTS "Prestataires can view their invitations" ON demande_invitations;
CREATE POLICY "Prestataires can view their invitations" ON demande_invitations
  FOR SELECT USING (
    prestataire_id IN (
      SELECT id FROM prestataires WHERE user_id = auth.uid()
    )
  );

-- Clients peuvent créer des invitations pour leurs demandes
DROP POLICY IF EXISTS "Clients can create invitations" ON demande_invitations;
CREATE POLICY "Clients can create invitations" ON demande_invitations
  FOR INSERT WITH CHECK (
    demande_id IN (
      SELECT id FROM demandes WHERE client_id IN (
        SELECT id FROM clients WHERE user_id = auth.uid()
      )
    )
  );

-- Prestataires peuvent mettre à jour le statut de leurs invitations
DROP POLICY IF EXISTS "Prestataires can update invitation status" ON demande_invitations;
CREATE POLICY "Prestataires can update invitation status" ON demande_invitations
  FOR UPDATE USING (
    prestataire_id IN (
      SELECT id FROM prestataires WHERE user_id = auth.uid()
    )
  );

-- Clients peuvent supprimer les invitations de leurs demandes
DROP POLICY IF EXISTS "Clients can delete invitations" ON demande_invitations;
CREATE POLICY "Clients can delete invitations" ON demande_invitations
  FOR DELETE USING (
    demande_id IN (
      SELECT id FROM demandes WHERE client_id IN (
        SELECT id FROM clients WHERE user_id = auth.uid()
      )
    )
  );

-- 4. Fonction pour marquer une invitation comme vue
CREATE OR REPLACE FUNCTION mark_invitation_viewed(invitation_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE demande_invitations
  SET 
    status = 'viewed',
    viewed_at = NOW()
  WHERE 
    id = invitation_id 
    AND status = 'pending'
    AND prestataire_id IN (
      SELECT id FROM prestataires WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Fonction pour marquer une invitation comme répondue
CREATE OR REPLACE FUNCTION mark_invitation_responded(invitation_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE demande_invitations
  SET 
    status = 'responded',
    responded_at = NOW()
  WHERE 
    id = invitation_id 
    AND status IN ('pending', 'viewed')
    AND prestataire_id IN (
      SELECT id FROM prestataires WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FIN
-- ============================================
