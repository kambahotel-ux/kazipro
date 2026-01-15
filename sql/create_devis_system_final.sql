-- ============================================
-- SYSTÈME DE DEVIS COMPLET (Version Finale)
-- ============================================

-- PARTIE 1: Drop existing tables if you want to start fresh
-- ============================================

-- Uncomment these lines ONLY if you want to delete existing data
-- DROP TABLE IF EXISTS devis_items CASCADE;
-- DROP TABLE IF EXISTS devis CASCADE;

-- PARTIE 2: Create or alter devis table
-- ============================================

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS devis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  prestataire_id UUID NOT NULL,
  
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

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Add client_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'devis' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE devis ADD COLUMN client_id UUID;
    RAISE NOTICE 'Column client_id added to devis';
  END IF;

  -- Add demande_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'devis' AND column_name = 'demande_id'
  ) THEN
    ALTER TABLE devis ADD COLUMN demande_id UUID;
    RAISE NOTICE 'Column demande_id added to devis';
  END IF;
END $$;

-- Add foreign keys
DO $$
BEGIN
  -- Add prestataire_id foreign key
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prestataires') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'devis_prestataire_id_fkey' AND table_name = 'devis'
    ) THEN
      ALTER TABLE devis ADD CONSTRAINT devis_prestataire_id_fkey 
        FOREIGN KEY (prestataire_id) REFERENCES prestataires(id) ON DELETE CASCADE;
      RAISE NOTICE 'Foreign key devis_prestataire_id_fkey added';
    END IF;
  END IF;

  -- Add client_id foreign key
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'devis_client_id_fkey' AND table_name = 'devis'
    ) THEN
      ALTER TABLE devis ADD CONSTRAINT devis_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
      RAISE NOTICE 'Foreign key devis_client_id_fkey added';
    END IF;
  END IF;

  -- Add demande_id foreign key
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'demandes') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'devis_demande_id_fkey' AND table_name = 'devis'
    ) THEN
      ALTER TABLE devis ADD CONSTRAINT devis_demande_id_fkey 
        FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE SET NULL;
      RAISE NOTICE 'Foreign key devis_demande_id_fkey added';
    END IF;
  END IF;
END $$;

-- PARTIE 3: Create devis_items table
-- ============================================

CREATE TABLE IF NOT EXISTS devis_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devis_id UUID NOT NULL,
  
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

-- Add foreign key for devis_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'devis_items_devis_id_fkey' AND table_name = 'devis_items'
  ) THEN
    ALTER TABLE devis_items ADD CONSTRAINT devis_items_devis_id_fkey 
      FOREIGN KEY (devis_id) REFERENCES devis(id) ON DELETE CASCADE;
    RAISE NOTICE 'Foreign key devis_items_devis_id_fkey added';
  END IF;
END $$;

-- PARTIE 4: Indexes pour performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_devis_prestataire ON devis(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_devis_client ON devis(client_id);
CREATE INDEX IF NOT EXISTS idx_devis_statut ON devis(statut);
CREATE INDEX IF NOT EXISTS idx_devis_numero ON devis(numero);
CREATE INDEX IF NOT EXISTS idx_devis_items_devis ON devis_items(devis_id);

-- PARTIE 5: Fonction pour générer un numéro de devis
-- ============================================

CREATE OR REPLACE FUNCTION generate_devis_numero()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  count INTEGER;
  numero TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  
  -- Compter les devis de l'année
  SELECT COUNT(*) INTO count
  FROM devis
  WHERE numero LIKE 'DEV-' || year || '-%';
  
  -- Générer le numéro
  numero := 'DEV-' || year || '-' || LPAD((count + 1)::TEXT, 4, '0');
  
  RETURN numero;
END;
$$ LANGUAGE plpgsql;

-- PARTIE 6: Trigger pour auto-update updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_devis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_devis_updated_at ON devis;
CREATE TRIGGER trigger_update_devis_updated_at
BEFORE UPDATE ON devis
FOR EACH ROW
EXECUTE FUNCTION update_devis_updated_at();

-- PARTIE 7: RLS Policies
-- ============================================

ALTER TABLE devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Prestataires can manage their own devis" ON devis;
DROP POLICY IF EXISTS "Clients can view devis sent to them" ON devis;
DROP POLICY IF EXISTS "Admin can view all devis" ON devis;
DROP POLICY IF EXISTS "Prestataires can manage their devis items" ON devis_items;
DROP POLICY IF EXISTS "Clients can view devis items" ON devis_items;

-- Policies pour devis
CREATE POLICY "Prestataires can manage their own devis"
ON devis
FOR ALL
TO authenticated
USING (
  prestataire_id IN (
    SELECT id FROM prestataires WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Clients can view devis sent to them"
ON devis
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
  AND statut IN ('envoye', 'accepte', 'refuse', 'expire')
);

CREATE POLICY "Admin can view all devis"
ON devis
FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'email') = 'admin@kazipro.com'
);

-- Policies pour devis_items
CREATE POLICY "Prestataires can manage their devis items"
ON devis_items
FOR ALL
TO authenticated
USING (
  devis_id IN (
    SELECT id FROM devis WHERE prestataire_id IN (
      SELECT id FROM prestataires WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Clients can view devis items"
ON devis_items
FOR SELECT
TO authenticated
USING (
  devis_id IN (
    SELECT id FROM devis WHERE client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
    AND statut IN ('envoye', 'accepte', 'refuse', 'expire')
  )
);

-- PARTIE 8: Fonction pour calculer les montants
-- ============================================

CREATE OR REPLACE FUNCTION calculate_devis_montants(devis_uuid UUID)
RETURNS VOID AS $$
DECLARE
  total_ht DECIMAL(10, 2);
  tva_rate DECIMAL(5, 2);
  total_ttc DECIMAL(10, 2);
BEGIN
  -- Calculer le total HT
  SELECT COALESCE(SUM(montant), 0) INTO total_ht
  FROM devis_items
  WHERE devis_id = devis_uuid;
  
  -- Récupérer le taux de TVA
  SELECT tva INTO tva_rate
  FROM devis
  WHERE id = devis_uuid;
  
  -- Calculer le total TTC
  total_ttc := total_ht * (1 + (tva_rate / 100));
  
  -- Mettre à jour le devis
  UPDATE devis
  SET montant_ht = total_ht,
      montant_ttc = total_ttc
  WHERE id = devis_uuid;
END;
$$ LANGUAGE plpgsql;

-- PARTIE 9: Trigger pour recalculer les montants
-- ============================================

CREATE OR REPLACE FUNCTION trigger_recalculate_devis_montants()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_devis_montants(OLD.devis_id);
    RETURN OLD;
  ELSE
    PERFORM calculate_devis_montants(NEW.devis_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_devis_items_change ON devis_items;
CREATE TRIGGER trigger_devis_items_change
AFTER INSERT OR UPDATE OR DELETE ON devis_items
FOR EACH ROW
EXECUTE FUNCTION trigger_recalculate_devis_montants();

-- PARTIE 10: Fonction pour changer le statut
-- ============================================

CREATE OR REPLACE FUNCTION change_devis_statut(
  devis_uuid UUID,
  new_statut TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE devis
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
  RAISE NOTICE '✅ Système de devis créé avec succès!';
  RAISE NOTICE '1. Tables devis et devis_items créées/mises à jour';
  RAISE NOTICE '2. Colonnes manquantes ajoutées';
  RAISE NOTICE '3. Foreign keys ajoutées';
  RAISE NOTICE '4. Fonction de génération de numéro créée';
  RAISE NOTICE '5. Triggers de calcul automatique créés';
  RAISE NOTICE '6. RLS policies configurées';
  RAISE NOTICE '7. Prêt à utiliser!';
END $$;
