-- Ajouter une colonne slug à la table professions
ALTER TABLE professions ADD COLUMN IF NOT EXISTS slug TEXT;

-- Fonction pour générer un slug à partir d'un texte
CREATE OR REPLACE FUNCTION generate_slug(text_input TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        -- Remplacer les caractères accentués
        translate(
          text_input,
          'àáâãäåāăąèéêëēĕėęěìíîïìĩīĭḩòóôõöōŏőùúûüũūŭůäöüÿçćĉċčñńņňÀÁÂÃÄÅĀĂĄÈÉÊËĒĔĖĘĚÌÍÎÏÌĨĪĬḨÒÓÔÕÖŌŎŐÙÚÛÜŨŪŬŮÄÖÜŸÇĆĈĊČÑŃŅŇ',
          'aaaaaaaaaeeeeeeeeeiiiiiiiihoooooooouuuuuuuuaouycccccnnnnaaaaaaaaaaeeeeeeeeeiiiiiiiihooooooouuuuuuuuaouycccccnnnn'
        ),
        '[^a-z0-9]+', '-', 'g'  -- Remplacer les caractères non alphanumériques par des tirets
      ),
      '(^-|-$)', '', 'g'  -- Supprimer les tirets au début et à la fin
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Générer les slugs pour toutes les professions existantes
UPDATE professions 
SET slug = generate_slug(nom)
WHERE slug IS NULL OR slug = '';

-- Créer un index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_professions_slug ON professions(slug);

-- Ajouter une contrainte d'unicité sur le slug
ALTER TABLE professions ADD CONSTRAINT unique_profession_slug UNIQUE (slug);

-- Trigger pour générer automatiquement le slug lors de l'insertion/mise à jour
CREATE OR REPLACE FUNCTION set_profession_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.nom);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_profession_slug ON professions;
CREATE TRIGGER trigger_set_profession_slug
  BEFORE INSERT OR UPDATE ON professions
  FOR EACH ROW
  EXECUTE FUNCTION set_profession_slug();

-- Afficher les slugs générés pour vérification
SELECT id, nom, slug FROM professions ORDER BY nom;
