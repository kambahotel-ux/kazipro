-- Créer la table pour les horaires de travail des prestataires

CREATE TABLE IF NOT EXISTS horaires_travail (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prestataire_id UUID NOT NULL REFERENCES prestataires(id) ON DELETE CASCADE,
  jour_semaine TEXT NOT NULL CHECK (jour_semaine IN ('lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche')),
  actif BOOLEAN DEFAULT true,
  heure_debut TIME NOT NULL DEFAULT '08:00',
  heure_fin TIME NOT NULL DEFAULT '18:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prestataire_id, jour_semaine)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_horaires_prestataire ON horaires_travail(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_horaires_jour ON horaires_travail(jour_semaine);

-- RLS Policies
ALTER TABLE horaires_travail ENABLE ROW LEVEL SECURITY;

-- Policy pour que les prestataires puissent voir et modifier leurs propres horaires
CREATE POLICY "Prestataires can view own horaires"
ON horaires_travail
FOR SELECT
TO authenticated
USING (
  prestataire_id IN (
    SELECT id FROM prestataires WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Prestataires can insert own horaires"
ON horaires_travail
FOR INSERT
TO authenticated
WITH CHECK (
  prestataire_id IN (
    SELECT id FROM prestataires WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Prestataires can update own horaires"
ON horaires_travail
FOR UPDATE
TO authenticated
USING (
  prestataire_id IN (
    SELECT id FROM prestataires WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Prestataires can delete own horaires"
ON horaires_travail
FOR DELETE
TO authenticated
USING (
  prestataire_id IN (
    SELECT id FROM prestataires WHERE user_id = auth.uid()
  )
);

-- Policy pour que tout le monde puisse voir les horaires (pour affichage public)
CREATE POLICY "Public can view horaires"
ON horaires_travail
FOR SELECT
TO public
USING (true);

-- Fonction pour initialiser les horaires par défaut
CREATE OR REPLACE FUNCTION init_default_horaires(p_prestataire_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO horaires_travail (prestataire_id, jour_semaine, actif, heure_debut, heure_fin)
  VALUES
    (p_prestataire_id, 'lundi', true, '08:00', '18:00'),
    (p_prestataire_id, 'mardi', true, '08:00', '18:00'),
    (p_prestataire_id, 'mercredi', true, '08:00', '18:00'),
    (p_prestataire_id, 'jeudi', true, '08:00', '18:00'),
    (p_prestataire_id, 'vendredi', true, '08:00', '18:00'),
    (p_prestataire_id, 'samedi', true, '08:00', '18:00'),
    (p_prestataire_id, 'dimanche', false, '08:00', '18:00')
  ON CONFLICT (prestataire_id, jour_semaine) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Vérification
SELECT 'Table horaires_travail créée avec succès' as status;
