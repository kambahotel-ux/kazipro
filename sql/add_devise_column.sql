-- ============================================
-- Ajouter la colonne devise à la table devis
-- ============================================

-- Ajouter la colonne devise
ALTER TABLE devis ADD COLUMN IF NOT EXISTS devise TEXT DEFAULT 'FC';

-- Ajouter le constraint pour devise
ALTER TABLE devis DROP CONSTRAINT IF EXISTS devis_devise_check;
ALTER TABLE devis ADD CONSTRAINT devis_devise_check 
  CHECK (devise IN ('FC', 'USD', 'EUR'));

-- Mettre à jour les devis existants sans devise
UPDATE devis SET devise = 'FC' WHERE devise IS NULL;

-- Vérification
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'devis' AND column_name = 'devise';

-- Message de succès
-- ✅ Colonne devise ajoutée avec succès!
-- Valeurs possibles: FC, USD, EUR
-- Valeur par défaut: FC
