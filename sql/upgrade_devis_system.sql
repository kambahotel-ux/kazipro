-- ============================================
-- MISE À JOUR DU SYSTÈME DE DEVIS
-- Extension de la table devis existante
-- ============================================

-- PARTIE 1: Ajouter les colonnes manquantes à la table devis
-- ============================================

DO $
BEGIN
  -- Ajouter numero si n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devis' AND column_name = 'numero') THEN
    ALTER TABLE devis ADD COLUMN numero TEXT UNIQUE;
    RAISE NOTICE 'Colonne numero ajoutée';
  END IF;

  -- Ajouter client_id si n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devis' AND column_name = 'client_id') THEN
    ALTER TABLE devis ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
    RAISE NOTICE 'Colonne client_id ajoutée';
  END IF;

  -- Ajouter titre si n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devis' AND column_name = 'titre') THEN
    ALTER TABLE devis ADD COLUMN titre TEXT;
    RAISE NOTICE 'Colonne titre ajoutée';
  END IF;

  -- Ajouter notes si n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devis' AND column_name = 'notes') THEN
    ALTER TABLE devis ADD COLUMN notes TEXT;
    RAISE NOTICE 'Colonne notes ajoutée';
  END IF;

  -- Ajouter conditions si n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devis' AND column_name = 'conditions') THEN
    ALTER TABLE devis ADD COLUMN conditions TEXT;
    RAISE NOTICE 'Colonne conditions ajoutée';
  END IF;

  -- Ajouter montant_ht si n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devis' AND column_name = 'montant_ht') THEN
    ALTER TABLE devis ADD COLUMN montant_ht DECIMAL(10, 2) DEFAULT 0;
    RAISE NOTICE 'Colonne montant_ht ajoutée';
  END IF;

  -- Ajouter tva si n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devis' AND column_name = 'tva') THEN
    ALTER TABLE devis ADD COLUMN tva DECIMAL(5, 2) DEFAULT 16;
    RAISE NOTICE 'Colonne tva ajoutée';
  END IF;

  -- Ajouter montant_ttc si n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devis' AND column_name = 'montant_ttc') THEN
    ALTER TABLE devis ADD COLUMN montant_ttc DECIMAL(10, 2) DEFAULT 0;
    RAISE NOTICE 'Colonne montant_ttc ajoutée';
  END IF;

  -- Ajouter statut si n'existe pas (ou modifier le check constraint)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devis' AND column_name = 'statut') THEN
    ALTER TABLE devis ADD COLUMN statut TEXT DEFAULT 'brouillon';
    RAISE NOTICE 'Colonne statut ajoutée';
  END IF;

  -- Ajouter date_creation si n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devis' AND column_name = 'date_creation') THEN
    ALTER TABLE devis ADD COLUMN date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Colonne date_creation ajoutée';
  END IF;

  -- Ajouter date_envoi si n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devis' AND column_name = 'date_envoi') THEN
    ALTER TABLE devis ADD COLUMN date_envoi TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Colonne date_envoi ajoutée';
  END IF;

  -- Ajouter date_expiration si n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devis' AND column_name = 'date_expiration') THEN
    ALTER TABLE devis ADD COLUMN date_expiration TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Colonne date_expiration ajoutée';
  END IF;

  -- Ajouter date_acceptation si n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devis' AND column_name = 'date_acceptation') THEN
    ALTER TABLE devis ADD COLUMN date_acceptation TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Colonne date_acceptation ajoutée';
  END IF;

  -- Ajouter date_refus si n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devis' AND column_name = 'date_refus') THEN
    ALTER TABLE devis ADD COLUMN date_refus TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Colonne date_refus ajoutée';
  END IF;
END $;

-- PARTIE 2: Modifier le constraint du statut
-- ============================================

DO $
BEGIN
  -- Supprimer l'ancien constraint s'il existe
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'devis_status_check') THEN
    ALTER TABLE devis DROP CONSTRAINT devis_status_check;
    RAISE NOTICE 'Ancien constraint status supprimé';
  END IF;

  -- Ajouter le nouveau constraint pour statut
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'devis_statut_check') THEN
    ALTER TABLE devis ADD CONSTRAINT devis_statut_check 
      CHECK (statut IN ('brouillon', 'envoye', 'accepte', 'refuse', 'expire', 'pending', 'accepted', 'rejected'));
    RAISE NOTICE 'Nouveau constraint statut ajouté';
  END IF;
END $;

-- PARTIE 3: Créer la table devis_items
-- ============================================

CREATE TABLE IF NOT EXISTS devis_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devis_id UUID NOT NULL REFERENCES devis(id) ON DELETE CASCADE,
  
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

-- PARTIE 4: Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_devis_numero ON devis(numero);
CREATE INDEX IF NOT EXISTS idx_devis_statut ON devis(statut);
CREATE INDEX IF NOT EXISTS idx_devis_client_id ON devis(client_id);
CREATE INDEX IF NOT EXISTS idx_devis_items_devis ON devis_items(devis_id);

-- PARTIE 5: Fonction pour générer un numéro
-- ============================================

CREATE OR REPLACE FUNCTION generate_devis_numero()
RETURNS TEXT AS $
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
$ LANGUAGE plpgsql;

-- PARTIE 6: RLS Policies pour devis_items
-- ============================================

ALTER TABLE devis_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Prestataires can manage their devis items" ON devis_items;
DROP POLICY IF EXISTS "Clients can view devis items" ON devis_items;

CREATE POLICY "Prestataires can manage their devis items"
ON devis_items FOR ALL TO authenticated
USING (devis_id IN (SELECT id FROM devis WHERE prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())));

CREATE POLICY "Clients can view devis items"
ON devis_items FOR SELECT TO authenticated
USING (devis_id IN (
  SELECT id FROM devis 
  WHERE (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    OR demande_id IN (SELECT id FROM demandes WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
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
RETURNS VOID AS $
DECLARE
  total_ht DECIMAL(10, 2);
  tva_rate DECIMAL(5, 2);
  total_ttc DECIMAL(10, 2);
BEGIN
  SELECT COALESCE(SUM(montant), 0) INTO total_ht FROM devis_items WHERE devis_id = devis_uuid;
  SELECT tva INTO tva_rate FROM devis WHERE id = devis_uuid;
  total_ttc := total_ht * (1 + (tva_rate / 100));
  UPDATE devis SET montant_ht = total_ht, montant_ttc = total_ttc WHERE id = devis_uuid;
END;
$ LANGUAGE plpgsql;

-- PARTIE 9: Trigger recalcul
-- ============================================

CREATE OR REPLACE FUNCTION trigger_recalculate_devis_montants()
RETURNS TRIGGER AS $
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_devis_montants(OLD.devis_id);
    RETURN OLD;
  ELSE
    PERFORM calculate_devis_montants(NEW.devis_id);
    RETURN NEW;
  END IF;
END;
$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_devis_items_change ON devis_items;
CREATE TRIGGER trigger_devis_items_change
AFTER INSERT OR UPDATE OR DELETE ON devis_items
FOR EACH ROW
EXECUTE FUNCTION trigger_recalculate_devis_montants();

-- PARTIE 10: Fonction changement statut
-- ============================================

CREATE OR REPLACE FUNCTION change_devis_statut(devis_uuid UUID, new_statut TEXT)
RETURNS VOID AS $
BEGIN
  UPDATE devis
  SET statut = new_statut,
      date_envoi = CASE WHEN new_statut = 'envoye' THEN NOW() ELSE date_envoi END,
      date_acceptation = CASE WHEN new_statut = 'accepte' THEN NOW() ELSE date_acceptation END,
      date_refus = CASE WHEN new_statut = 'refuse' THEN NOW() ELSE date_refus END
  WHERE id = devis_uuid;
END;
$ LANGUAGE plpgsql;

-- PARTIE 11: Migrer les données existantes (si nécessaire)
-- ============================================

DO $
BEGIN
  -- Copier amount vers montant_ttc pour les devis existants
  UPDATE devis 
  SET montant_ttc = amount,
      montant_ht = amount / 1.16,
      statut = CASE 
        WHEN status = 'pending' THEN 'envoye'
        WHEN status = 'accepted' THEN 'accepte'
        WHEN status = 'rejected' THEN 'refuse'
        ELSE 'brouillon'
      END,
      titre = COALESCE(titre, 'Devis'),
      date_creation = COALESCE(date_creation, created_at)
  WHERE montant_ttc = 0 OR montant_ttc IS NULL;
  
  RAISE NOTICE 'Données existantes migrées';
END $;

-- Success message
DO $
BEGIN
  RAISE NOTICE '✅ Système de devis mis à jour!';
  RAISE NOTICE '1. Colonnes ajoutées à la table devis';
  RAISE NOTICE '2. Table devis_items créée';
  RAISE NOTICE '3. Indexes créés';
  RAISE NOTICE '4. Fonctions et triggers créés';
  RAISE NOTICE '5. RLS policies configurées';
  RAISE NOTICE '6. Données existantes migrées';
  RAISE NOTICE '7. Système prêt à utiliser!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Note: Les anciennes colonnes (amount, status) sont préservées';
  RAISE NOTICE '    Utilisez les nouvelles colonnes (montant_ttc, statut)';
END $;
