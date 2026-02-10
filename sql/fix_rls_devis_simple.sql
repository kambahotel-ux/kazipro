-- ═══════════════════════════════════════════════════════════════
-- FIX RLS - DEVIS_PRO
-- ═══════════════════════════════════════════════════════════════
-- Configure les politiques RLS pour permettre aux clients et prestataires
-- d'accéder à leurs devis

-- Activer RLS sur devis_pro
ALTER TABLE devis_pro ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Clients can view their devis" ON devis_pro;
DROP POLICY IF EXISTS "Prestataires can view their devis" ON devis_pro;
DROP POLICY IF EXISTS "Prestataires can create devis" ON devis_pro;
DROP POLICY IF EXISTS "Prestataires can update their devis" ON devis_pro;
DROP POLICY IF EXISTS "Public can view accepted devis" ON devis_pro;

-- Politique de lecture pour les clients
CREATE POLICY "Clients can view their devis"
ON devis_pro FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

-- Politique de lecture pour les prestataires
CREATE POLICY "Prestataires can view their devis"
ON devis_pro FOR SELECT
TO authenticated
USING (
  prestataire_id IN (
    SELECT id FROM prestataires WHERE user_id = auth.uid()
  )
);

-- Politique de création pour les prestataires
CREATE POLICY "Prestataires can create devis"
ON devis_pro FOR INSERT
TO authenticated
WITH CHECK (
  prestataire_id IN (
    SELECT id FROM prestataires WHERE user_id = auth.uid()
  )
);

-- Politique de mise à jour pour les prestataires (leurs propres devis)
CREATE POLICY "Prestataires can update their devis"
ON devis_pro FOR UPDATE
TO authenticated
USING (
  prestataire_id IN (
    SELECT id FROM prestataires WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  prestataire_id IN (
    SELECT id FROM prestataires WHERE user_id = auth.uid()
  )
);

-- Politique de mise à jour pour les clients (accepter/refuser)
CREATE POLICY "Clients can update their devis status"
ON devis_pro FOR UPDATE
TO authenticated
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

-- Vérification
SELECT 
  '✅ Politiques RLS configurées pour devis_pro' as status,
  COUNT(*) as nb_policies
FROM pg_policies
WHERE tablename = 'devis_pro';

-- Afficher les politiques créées
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'devis_pro'
ORDER BY cmd, policyname;
