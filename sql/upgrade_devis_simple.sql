-- ============================================
-- MISE À JOUR DU SYSTÈME DE DEVIS
-- Version simplifiée sans blocs DO
-- ============================================

-- PARTIE 1: Ajouter les colonnes manquantes à la table devis
-- ============================================

-- Ajouter numero
ALTER TABLE devis ADD COLUMN IF NOT EXISTS numero TEXT UNIQUE;

-- Ajouter client_id
ALTER TABLE devis ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Ajouter titre
ALTER TABLE devis ADD COLUMN IF NOT EXISTS titre TEXT;

-- Ajouter notes
ALTER TABLE devis ADD COLUMN IF NOT EXISTS notes TEXT;

-- Ajouter conditions
ALTER TABLE devis ADD COLUMN IF NOT EXISTS conditions TEXT;

-- Ajouter montant_ht
ALTER TABLE devis ADD COLUMN IF NOT EXISTS montant_ht DECIMAL(10, 2) DEFAULT 0;

-- Ajouter tva
ALTER TABLE devis ADD COLUMN IF NOT EXISTS tva DECIMAL(5, 2) DEFAULT 16;

-- Ajouter montant_ttc
ALTER TABLE devis ADD COLUMN IF NOT EXISTS montant_ttc DECIMAL(10, 2) DEFAULT 0;

-- Ajouter statut
ALTER TABLE devis ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'brouillon';

-- Ajouter date_creation
ALTER TABLE devis ADD COLUMN IF NOT EXISTS date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ajouter date_envoi
ALTER TABLE devis ADD COLUMN IF NOT EXISTS date_envoi TIMESTAMP WITH TIME ZONE;

-- Ajouter date_expiration
ALTER TABLE devis ADD COLUMN IF NOT EXISTS date_expiration TIMESTAMP WITH TIME ZONE;

-- Ajouter date_acceptation
ALTER TABLE devis ADD COLUMN IF NOT EXISTS date_acceptation TIMESTAMP WITH TIME ZONE;

-- Ajouter date_refus
ALTER TABLE devis ADD COLUMN IF NOT EXISTS date_refus TIMESTAMP WITH TIME ZONE;

-- Ajouter devise
ALTER TABLE devis ADD COLUMN IF NOT EXISTS devise TEXT DEFAULT 'FC';

-- PARTIE 2: Modifier les contraintes
-- ============================================

-- Rendre demande_id nullable (permettre les devis sans demande)
ALTER TABLE devis ALTER COLUMN demande_id DROP NOT NULL;

-- Supprimer l'ancien constraint s'il existe
ALTER TABLE devis DROP CONSTRAINT IF EXISTS devis_status_check;

-- Ajouter le nouveau constraint pour statut
ALTER TABLE devis DROP CONSTRAINT IF EXISTS devis_statut_check;
ALTER TABLE devis ADD CONSTRAINT devis_statut_check 
  CHECK (statut IN ('brouillon', 'envoye', 'accepte', 'refuse', 'expire', 'pending', 'accepted', 'rejected'));

-- Ajouter le constraint pour devise
ALTER TABLE devis DROP CONSTRAINT IF EXISTS devis_devise_check;
ALTER TABLE devis ADD CONSTRAINT devis_devise_check 
  CHECK (devise IN ('FC', 'USD', 'EUR'));

-- PARTIE 3: Créer la table devis_items
-- ============================================

CREATE TABLE IF NOT EXISTS devis_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devis_id UUID NOT NULL REFERENCES devis(id) ON DELETE CASCADE,
  designation TEXT NOT NULL,
  quantite DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unite TEXT DEFAULT 'unité',
  prix_unitaire DECIMAL(10, 2) NOT NULL,
  montant DECIMAL(10, 2) NOT NULL,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTIE 4: Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_devis_numero ON devis(numero);
CREATE INDEX IF NOT EXISTS idx_devis_statut ON devis(statut);
CREATE INDEX IF NOT EXISTS idx_devis_client_id ON devis(client_id);
CREATE INDEX IF NOT EXISTS idx_devis_items_devis ON devis_items(devis_id);

-- PARTIE 5: Fonction pour générer un numéro
-- ============================================

CREATE OR REPLACE FUNCTION generate_devis_numero()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year TEXT;
  count INTEGER;
  numero TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) INTO count FROM devis WHERE numero LIKE 'DEV-' || year || '-%';
  numero := 'DEV-' || year || '-' || LPAD((count + 1)::TEXT, 4, '0');
  RETURN numero;
END;
$$;

-- PARTIE 6: RLS Policies pour devis_items
-- ============================================

ALTER TABLE devis_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Prestataires can manage their devis items" ON devis_items;
CREATE POLICY "Prestataires can manage their devis items"
ON devis_items FOR ALL TO authenticated
USING (devis_id IN (
  SELECT id FROM devis 
  WHERE prestataire_id IN (
    SELECT id FROM prestataires WHERE user_id = auth.uid()
  )
));

DROP POLICY IF EXISTS "Clients can view devis items" ON devis_items;
CREATE POLICY "Clients can view devis items"
ON devis_items FOR SELECT TO authenticated
USING (devis_id IN (
  SELECT id FROM devis 
  WHERE (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    OR demande_id IN (
      SELECT id FROM demandes 
      WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    )
  )
  AND statut IN ('envoye', 'accepte', 'refuse', 'expire', 'accepted')
));

-- PARTIE 7: Mettre à jour les policies existantes de devis
-- ============================================

DROP POLICY IF EXISTS "Admin can view all devis" ON devis;
CREATE POLICY "Admin can view all devis"
ON devis FOR SELECT TO authenticated
USING ((auth.jwt() ->> 'email') = 'admin@kazipro.com');

-- PARTIE 8: Fonction calcul montants
-- ============================================

CREATE OR REPLACE FUNCTION calculate_devis_montants(devis_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  total_ht DECIMAL(10, 2);
  tva_rate DECIMAL(5, 2);
  total_ttc DECIMAL(10, 2);
BEGIN
  SELECT COALESCE(SUM(montant), 0) INTO total_ht 
  FROM devis_items 
  WHERE devis_id = devis_uuid;
  
  SELECT tva INTO tva_rate FROM devis WHERE id = devis_uuid;
  
  total_ttc := total_ht * (1 + (tva_rate / 100));
  
  UPDATE devis 
  SET montant_ht = total_ht, montant_ttc = total_ttc 
  WHERE id = devis_uuid;
END;
$$;

-- PARTIE 9: Trigger recalcul
-- ============================================

CREATE OR REPLACE FUNCTION trigger_recalculate_devis_montants()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_devis_montants(OLD.devis_id);
    RETURN OLD;
  ELSE
    PERFORM calculate_devis_montants(NEW.devis_id);
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trigger_devis_items_change ON devis_items;
CREATE TRIGGER trigger_devis_items_change
AFTER INSERT OR UPDATE OR DELETE ON devis_items
FOR EACH ROW
EXECUTE FUNCTION trigger_recalculate_devis_montants();

-- PARTIE 10: Fonction changement statut
-- ============================================

CREATE OR REPLACE FUNCTION change_devis_statut(devis_uuid UUID, new_statut TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE devis
  SET statut = new_statut,
      date_envoi = CASE WHEN new_statut = 'envoye' THEN NOW() ELSE date_envoi END,
      date_acceptation = CASE WHEN new_statut = 'accepte' THEN NOW() ELSE date_acceptation END,
      date_refus = CASE WHEN new_statut = 'refuse' THEN NOW() ELSE date_refus END
  WHERE id = devis_uuid;
END;
$$;

-- PARTIE 11: Migrer les données existantes
-- ============================================

UPDATE devis 
SET montant_ttc = COALESCE(amount, 0),
    montant_ht = COALESCE(amount, 0) / 1.16,
    statut = CASE 
      WHEN status = 'pending' THEN 'envoye'
      WHEN status = 'accepted' THEN 'accepte'
      WHEN status = 'rejected' THEN 'refuse'
      ELSE 'brouillon'
    END,
    titre = COALESCE(titre, 'Devis'),
    date_creation = COALESCE(date_creation, created_at)
WHERE montant_ttc = 0 OR montant_ttc IS NULL;

-- Message de succès (commentaire)
-- ✅ Système de devis mis à jour!
-- 1. Colonnes ajoutées à la table devis
-- 2. Table devis_items créée
-- 3. Indexes créés
-- 4. Fonctions et triggers créés
-- 5. RLS policies configurées
-- 6. Données existantes migrées
-- 7. Système prêt à utiliser!
