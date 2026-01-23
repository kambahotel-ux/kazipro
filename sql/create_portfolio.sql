-- ✅ Créer la table Portfolio pour les réalisations des prestataires

CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prestataire_id UUID NOT NULL REFERENCES prestataires(id) ON DELETE CASCADE,
  titre VARCHAR(100) NOT NULL,
  description TEXT,
  categorie VARCHAR(50),
  date_realisation DATE,
  images TEXT[], -- Array d'URLs d'images
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_portfolio_prestataire ON portfolio_items(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_categorie ON portfolio_items(categorie);
CREATE INDEX IF NOT EXISTS idx_portfolio_date ON portfolio_items(date_realisation DESC);

-- RLS Policies
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- Les prestataires peuvent voir leurs propres réalisations
CREATE POLICY "Prestataires can view own portfolio"
ON portfolio_items
FOR SELECT
TO authenticated
USING (
  prestataire_id IN (
    SELECT id FROM prestataires WHERE user_id = auth.uid()
  )
);

-- Les prestataires peuvent ajouter leurs réalisations
CREATE POLICY "Prestataires can insert own portfolio"
ON portfolio_items
FOR INSERT
TO authenticated
WITH CHECK (
  prestataire_id IN (
    SELECT id FROM prestataires WHERE user_id = auth.uid()
  )
);

-- Les prestataires peuvent modifier leurs réalisations
CREATE POLICY "Prestataires can update own portfolio"
ON portfolio_items
FOR UPDATE
TO authenticated
USING (
  prestataire_id IN (
    SELECT id FROM prestataires WHERE user_id = auth.uid()
  )
);

-- Les prestataires peuvent supprimer leurs réalisations
CREATE POLICY "Prestataires can delete own portfolio"
ON portfolio_items
FOR DELETE
TO authenticated
USING (
  prestataire_id IN (
    SELECT id FROM prestataires WHERE user_id = auth.uid()
  )
);

-- Tout le monde peut voir les portfolios (pour affichage public)
CREATE POLICY "Public can view all portfolios"
ON portfolio_items
FOR SELECT
TO public
USING (true);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_portfolio_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER portfolio_updated_at
BEFORE UPDATE ON portfolio_items
FOR EACH ROW
EXECUTE FUNCTION update_portfolio_updated_at();

-- Vérification
SELECT 'Table portfolio_items créée avec succès' as status;
