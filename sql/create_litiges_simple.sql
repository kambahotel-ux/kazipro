-- =====================================================
-- CREATE LITIGES TABLE - VERSION SIMPLE
-- =====================================================
-- Table pour gérer les litiges entre clients et prestataires

-- Drop table if exists (for clean setup)
DROP TABLE IF EXISTS public.litiges CASCADE;

-- Create litiges table
CREATE TABLE public.litiges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  mission_id UUID REFERENCES public.missions(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  prestataire_id UUID REFERENCES public.prestataires(id) ON DELETE CASCADE,
  
  -- Litige details
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('qualite', 'delai', 'paiement', 'autre')),
  statut TEXT NOT NULL DEFAULT 'open' CHECK (statut IN ('open', 'in_progress', 'resolved', 'escalated', 'closed')),
  priorite TEXT NOT NULL DEFAULT 'medium' CHECK (priorite IN ('low', 'medium', 'high', 'urgent')),
  
  -- Financial
  montant_litige DECIMAL(10, 2),
  
  -- Resolution
  resolution TEXT,
  resolu_par TEXT CHECK (resolu_par IN ('admin', 'client', 'prestataire', 'auto')),
  decision TEXT CHECK (decision IN ('refund_client', 'pay_prestataire', 'partial_refund', 'no_action')),
  
  -- Evidence
  preuves_client JSONB DEFAULT '[]'::jsonb,
  preuves_prestataire JSONB DEFAULT '[]'::jsonb,
  
  -- Admin notes
  notes_admin TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_litiges_mission ON public.litiges(mission_id);
CREATE INDEX idx_litiges_client ON public.litiges(client_id);
CREATE INDEX idx_litiges_prestataire ON public.litiges(prestataire_id);
CREATE INDEX idx_litiges_statut ON public.litiges(statut);
CREATE INDEX idx_litiges_priorite ON public.litiges(priorite);
CREATE INDEX idx_litiges_created_at ON public.litiges(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - VERSION SIMPLE
-- =====================================================

ALTER TABLE public.litiges ENABLE ROW LEVEL SECURITY;

-- Policy: Tous les utilisateurs authentifiés peuvent voir tous les litiges
CREATE POLICY "Authenticated users can view litiges"
  ON public.litiges
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Tous les utilisateurs authentifiés peuvent créer des litiges
CREATE POLICY "Authenticated users can create litiges"
  ON public.litiges
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Tous les utilisateurs authentifiés peuvent modifier les litiges
CREATE POLICY "Authenticated users can update litiges"
  ON public.litiges
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Policy: Tous les utilisateurs authentifiés peuvent supprimer les litiges
CREATE POLICY "Authenticated users can delete litiges"
  ON public.litiges
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- =====================================================
-- TRIGGER FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_litiges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_litiges_updated_at
  BEFORE UPDATE ON public.litiges
  FOR EACH ROW
  EXECUTE FUNCTION update_litiges_updated_at();

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample disputes for testing
INSERT INTO public.litiges (
  titre,
  description,
  type,
  statut,
  priorite,
  montant_litige
) VALUES
  (
    'Travail non terminé',
    'Le prestataire n''a pas terminé les travaux dans les délais convenus. Les travaux de plomberie sont incomplets.',
    'delai',
    'open',
    'high',
    50000
  ),
  (
    'Qualité insuffisante',
    'La qualité du travail ne correspond pas aux attentes. Les finitions sont bâclées.',
    'qualite',
    'in_progress',
    'medium',
    30000
  ),
  (
    'Paiement non reçu',
    'Le client n''a pas effectué le paiement après la fin des travaux malgré plusieurs relances.',
    'paiement',
    'open',
    'urgent',
    75000
  ),
  (
    'Matériaux non conformes',
    'Les matériaux utilisés ne correspondent pas à ce qui était convenu dans le devis.',
    'qualite',
    'escalated',
    'high',
    45000
  ),
  (
    'Abandon de chantier',
    'Le prestataire a abandonné le chantier sans prévenir et ne répond plus aux appels.',
    'delai',
    'escalated',
    'urgent',
    120000
  );

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.litiges IS 'Table pour gérer les litiges entre clients et prestataires';
COMMENT ON COLUMN public.litiges.type IS 'Type de litige: qualite, delai, paiement, autre';
COMMENT ON COLUMN public.litiges.statut IS 'Statut: open, in_progress, resolved, escalated, closed';
COMMENT ON COLUMN public.litiges.priorite IS 'Priorité: low, medium, high, urgent';
COMMENT ON COLUMN public.litiges.decision IS 'Décision admin: refund_client, pay_prestataire, partial_refund, no_action';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Table litiges créée avec succès!';
  RAISE NOTICE '✅ 5 litiges de test créés';
  RAISE NOTICE '✅ Indexes créés';
  RAISE NOTICE '✅ RLS policies configurées (version simple)';
  RAISE NOTICE '✅ Triggers configurés';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Note: Les policies RLS sont en mode simple (tous les utilisateurs authentifiés)';
  RAISE NOTICE '🔒 Pour plus de sécurité, exécutez sql/fix_litiges_rls.sql après';
END $$;
