-- ============================================
-- SYSTÈME DE DEVIS PROFESSIONNEL
-- Tables: devis_pro et devis_pro_items
-- ============================================

-- PARTIE 1: Créer la table devis_pro
-- ============================================

CREATE TABLE IF NOT EXISTS devis_pro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  prestataire_id UUID NOT NULL,
  client_id UUID,
  demande_id UUID,
  
  -- Informations du devis
  titre TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  conditions TEXT,
  
  -- Montants
  montant_ht DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tva DECIMAL(5, 2) DEFAULT 16,
  montant_ttc DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Statut
  statut TEXT NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'envoye', 'accepte', 'refuse', 'expire')),
  
  -- Dates
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_envoi TIMESTAMP WITH TIME ZONE,
  date_expiration TIMESTAMP WITH TIME ZONE,
  date_acceptation TIMESTAMP WITH TIME ZONE,
  date_refus TIMESTAMP WITH TIME ZONE,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTIE 2: Créer la table devis_pro_items
-- ============================================

CREATE TABLE IF NOT EXISTS devis_pro_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devis_id UUID NOT NULL REFERENCES devis_pro(id) ON DELETE CASCADE,
  
  -- Informations de la ligne
  designation TEXT NOT NULL,
  quantite DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unite TEXT DEFAULT 'unité',
  prix_unitaire DECIMAL(10, 2) NOT NULL,
  montant DECIMAL(10, 2) NOT NULL,
  
  -- Ordre d'affichage
  ordre INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTIE 3: Ajouter les foreign keys
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prestataires') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'devis_pro_prestataire_id_fkey' AND table_name = 'devis_pro'
    ) THEN
      ALTER TABLE devis_pro ADD CONSTRAINT devis_pro_prestataire_id_fkey 
        FOREIGN KEY (prestataire_id) REFERENCES prestataires(id) ON DELETE CASCADE;
      RAISE NOTICE 'Foreign key devis_pro_prestataire_id_fkey added';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'devis_pro_client_id_fkey' AND table_name = 'devis_pro'
    ) THEN
      ALTER TABLE devis_pro ADD CONSTRAINT devis_pro_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
      RAISE NOTICE 'Foreign key devis_pro_client_id_fkey added';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'demandes') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'devis_pro_demande_id_fkey' AND table_name = 'devis_pro'
    ) THEN
      ALTER TABLE devis_pro ADD CONSTRAINT devis_pro_demande_id_fkey 
        FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE SET NULL;
      RAISE NOTICE 'Foreign key devis_pro_demande_id_fkey added';
    END IF;
  END IF;
END $$;

-- PARTIE 4: Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_devis_pro_prestataire ON devis_pro(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_devis_pro_client ON devis_pro(client_id);
CREATE INDEX IF NOT EXISTS idx_devis_pro_statut ON devis_pro(statut);
CREATE INDEX IF NOT EXISTS idx_devis_pro_numero ON devis_pro(numero);
CREATE INDEX IF NOT EXISTS idx_devis_pro_items_devis ON devis_pro_items(devis_id);

-- PARTIE 5: Fonction pour générer un numéro
-- ============================================

CREATE OR REPLACE FUNCTION generate_devis_numero()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  count INTEGER;
  numero TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) INTO count FROM devis_pro WHERE numero LIKE 'DEV-' || year || '-%';
  numero := 'DEV-' || year || '-' || LPAD((count + 1)::TEXT, 4, '0');
  RETURN numero;
END;
$$ LANGUAGE plpgsql;

-- PARTIE 6: Trigger updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_devis_pro_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_devis_pro_updated_at ON devis_pro;
CREATE TRIGGER trigger_update_devis_pro_updated_at
BEFORE UPDATE ON devis_pro
FOR EACH ROW
EXECUTE FUNCTION update_devis_pro_updated_at();

-- PARTIE 7: RLS Policies
-- ============================================

ALTER TABLE devis_pro ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis_pro_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Prestataires can manage their own devis_pro" ON devis_pro;
DROP POLICY IF EXISTS "Clients can view devis_pro sent to them" ON devis_pro;
DROP POLICY IF EXISTS "Admin can view all devis_pro" ON devis_pro;
DROP POLICY IF EXISTS "Prestataires can manage their devis_pro items" ON devis_pro_items;
DROP POLICY IF EXISTS "Clients can view devis_pro items" ON devis_pro_items;

CREATE POLICY "Prestataires can manage their own devis_pro"
ON devis_pro FOR ALL TO authenticated
USING (prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid()));

CREATE POLICY "Clients can view devis_pro sent to them"
ON devis_pro FOR SELECT TO authenticated
USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()) AND statut IN ('envoye', 'accepte', 'refuse', 'expire'));

CREATE POLICY "Admin can view all devis_pro"
ON devis_pro FOR SELECT TO authenticated
USING ((auth.jwt() ->> 'email') = 'admin@kazipro.com');

CREATE POLICY "Prestataires can manage their devis_pro items"
ON devis_pro_items FOR ALL TO authenticated
USING (devis_id IN (SELECT id FROM devis_pro WHERE prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())));

CREATE POLICY "Clients can view devis_pro items"
ON devis_pro_items FOR SELECT TO authenticated
USING (devis_id IN (SELECT id FROM devis_pro WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()) AND statut IN ('envoye', 'accepte', 'refuse', 'expire')));

-- PARTIE 8: Fonction calcul montants
-- ============================================

CREATE OR REPLACE FUNCTION calculate_devis_pro_montants(devis_uuid UUID)
RETURNS VOID AS $$
DECLARE
  total_ht DECIMAL(10, 2);
  tva_rate DECIMAL(5, 2);
  total_ttc DECIMAL(10, 2);
BEGIN
  SELECT COALESCE(SUM(montant), 0) INTO total_ht FROM devis_pro_items WHERE devis_id = devis_uuid;
  SELECT tva INTO tva_rate FROM devis_pro WHERE id = devis_uuid;
  total_ttc := total_ht * (1 + (tva_rate / 100));
  UPDATE devis_pro SET montant_ht = total_ht, montant_ttc = total_ttc WHERE id = devis_uuid;
END;
$$ LANGUAGE plpgsql;

-- PARTIE 9: Trigger recalcul
-- ============================================

CREATE OR REPLACE FUNCTION trigger_recalculate_devis_pro_montants()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_devis_pro_montants(OLD.devis_id);
    RETURN OLD;
  ELSE
    PERFORM calculate_devis_pro_montants(NEW.devis_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_devis_pro_items_change ON devis_pro_items;
CREATE TRIGGER trigger_devis_pro_items_change
AFTER INSERT OR UPDATE OR DELETE ON devis_pro_items
FOR EACH ROW
EXECUTE FUNCTION trigger_recalculate_devis_pro_montants();

-- PARTIE 10: Fonction changement statut
-- ============================================

CREATE OR REPLACE FUNCTION change_devis_pro_statut(devis_uuid UUID, new_statut TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE devis_pro
  SET statut = new_statut,
      date_envoi = CASE WHEN new_statut = 'envoye' THEN NOW() ELSE date_envoi END,
      date_acceptation = CASE WHEN new_statut = 'accepte' THEN NOW() ELSE date_acceptation END,
      date_refus = CASE WHEN new_statut = 'refuse' THEN NOW() ELSE date_refus END
  WHERE id = devis_uuid;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Système de devis professionnel créé!';
  RAISE NOTICE '1. Tables devis_pro et devis_pro_items créées';
  RAISE NOTICE '2. Foreign keys configurées';
  RAISE NOTICE '3. Indexes créés';
  RAISE NOTICE '4. Fonctions et triggers créés';
  RAISE NOTICE '5. RLS policies configurées';
  RAISE NOTICE '6. Système prêt à utiliser!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Note: Utilisez les tables devis_pro et devis_pro_items';
  RAISE NOTICE '    (Les anciennes tables devis restent intactes)';
END $$;
