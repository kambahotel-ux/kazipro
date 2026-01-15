-- =====================================================
-- CREATE LITIGES TABLE
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
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.litiges ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can see all litiges
CREATE POLICY "Admin can view all litiges"
  ON public.litiges
  FOR SELECT
  USING (
    auth.jwt() ->> 'email' = 'admin@kazipro.com'
  );

-- Policy: Admin can insert litiges
CREATE POLICY "Admin can insert litiges"
  ON public.litiges
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'email' = 'admin@kazipro.com'
  );

-- Policy: Admin can update litiges
CREATE POLICY "Admin can update litiges"
  ON public.litiges
  FOR UPDATE
  USING (
    auth.jwt() ->> 'email' = 'admin@kazipro.com'
  );

-- Policy: Clients can view their own litiges
CREATE POLICY "Clients can view their litiges"
  ON public.litiges
  FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

-- Policy: Clients can create litiges
CREATE POLICY "Clients can create litiges"
  ON public.litiges
  FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

-- Policy: Clients can update their own litiges (only when open)
CREATE POLICY "Clients can update their litiges"
  ON public.litiges
  FOR UPDATE
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
    AND statut = 'open'
  );

-- Policy: Prestataires can view their litiges
CREATE POLICY "Prestataires can view their litiges"
  ON public.litiges
  FOR SELECT
  USING (
    prestataire_id IN (
      SELECT id FROM public.prestataires WHERE user_id = auth.uid()
    )
  );

-- Policy: Prestataires can update their litiges (add evidence)
CREATE POLICY "Prestataires can update their litiges"
  ON public.litiges
  FOR UPDATE
  USING (
    prestataire_id IN (
      SELECT id FROM public.prestataires WHERE user_id = auth.uid()
    )
    AND statut IN ('open', 'in_progress')
  );

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

-- Uncomment to insert sample disputes
/*
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
    'Le prestataire n''a pas terminé les travaux dans les délais convenus.',
    'delai',
    'open',
    'high',
    50000
  ),
  (
    'Qualité insuffisante',
    'La qualité du travail ne correspond pas aux attentes.',
    'qualite',
    'in_progress',
    'medium',
    30000
  ),
  (
    'Paiement non reçu',
    'Le client n''a pas effectué le paiement après la fin des travaux.',
    'paiement',
    'open',
    'urgent',
    75000
  );
*/

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
  RAISE NOTICE '✅ Indexes créés';
  RAISE NOTICE '✅ RLS policies configurées';
  RAISE NOTICE '✅ Triggers configurés';
END $$;
