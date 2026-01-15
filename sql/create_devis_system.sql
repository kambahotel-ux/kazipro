-- ============================================
-- SYSTÈME DE DEVIS COMPLET
-- ============================================

-- PARTIE 1: Améliorer la table devis
-- ============================================

-- Drop existing table if needed (ATTENTION: perte de données)
-- DROP TABLE IF EXISTS devis_items CASCADE;
-- DROP TABLE IF EXISTS devis CASCADE;

-- Create devis table with all necessary fields
CREATE TABLE IF NOT EXISTS devis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL, -- Numéro unique du devis (ex: DEV-2024-001)
  prestataire_id UUID NOT NULL REFERENCES prestataires(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  demande_id UUID REFERENCES demandes(id) ON DELETE SET NULL,
  
  -- Informations du devis
  titre TEXT NOT NULL,
  description TEXT,
  notes TEXT, -- Notes internes
  conditions TEXT, -- Conditions générales
  
  -- Montants
  montant_ht DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Hors taxes
  tva DECIMAL(5, 2) DEFAULT 0, -- Pourcentage TVA
  montant_ttc DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Toutes taxes comprises
  
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

-- Create devis_items table for line items
CREATE TABLE IF NOT EXISTS devis_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devis_id UUID NOT NULL REFERENCES devis(id) ON DELETE CASCADE,
  
  -- Informations de la ligne
  designation TEXT NOT NULL, -- Description de l'article/service
  quantite DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unite TEXT DEFAULT 'unité', -- unité, heure, jour, m², etc.
  prix_unitaire DECIMAL(10, 2) NOT NULL,
  montant DECIMAL(10, 2) NOT NULL, -- quantite * prix_unitaire
  
  -- Ordre d'affichage
  ordre INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTIE 2: Indexes pour performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_devis_prestataire ON devis(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_devis_client ON devis(client_id);
CREATE INDEX IF NOT EXISTS idx_devis_statut ON devis(statut);
CREATE INDEX IF NOT EXISTS idx_devis_numero ON devis(numero);
CREATE INDEX IF NOT EXISTS idx_devis_items_devis ON devis_items(devis_id);

-- PARTIE 3: Fonction pour générer un numéro de devis
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

-- PARTIE 4: Trigger pour auto-update updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_devis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_devis_updated_at
BEFORE UPDATE ON devis
FOR EACH ROW
EXECUTE FUNCTION update_devis_updated_at();

-- PARTIE 5: RLS Policies
-- ============================================

ALTER TABLE devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis_items ENABLE ROW LEVEL SECURITY;

-- Policies pour devis
DROP POLICY IF EXISTS "Prestataires can manage their own devis" ON devis;
DROP POLICY IF EXISTS "Clients can view devis sent to them" ON devis;
DROP POLICY IF EXISTS "Admin can view all devis" ON devis;

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
DROP POLICY IF EXISTS "Prestataires can manage their devis items" ON devis_items;
DROP POLICY IF EXISTS "Clients can view devis items" ON devis_items;

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

-- PARTIE 6: Fonction pour calculer les montants
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

-- PARTIE 7: Trigger pour recalculer les montants
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

CREATE TRIGGER trigger_devis_items_change
AFTER INSERT OR UPDATE OR DELETE ON devis_items
FOR EACH ROW
EXECUTE FUNCTION trigger_recalculate_devis_montants();

-- PARTIE 8: Fonction pour changer le statut
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

-- PARTIE 9: Données de test (optionnel)
-- ============================================

-- Insérer un devis de test
-- INSERT INTO devis (numero, prestataire_id, titre, description, tva, statut)
-- VALUES (
--   generate_devis_numero(),
--   (SELECT id FROM prestataires LIMIT 1),
--   'Installation électrique',
--   'Installation complète du système électrique',
--   16,
--   'brouillon'
-- );

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Système de devis créé avec succès!';
  RAISE NOTICE '1. Tables devis et devis_items créées';
  RAISE NOTICE '2. Fonction de génération de numéro créée';
  RAISE NOTICE '3. Triggers de calcul automatique créés';
  RAISE NOTICE '4. RLS policies configurées';
  RAISE NOTICE '5. Prêt à utiliser!';
END $$;
