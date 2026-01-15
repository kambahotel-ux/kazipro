-- =====================================================
-- TABLE PROFESSIONS - Gérée par l'Admin
-- =====================================================

-- 1. Créer la table professions
CREATE TABLE IF NOT EXISTS public.professions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL UNIQUE,
  description TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ajouter des professions par défaut
INSERT INTO public.professions (nom, description) VALUES
  ('Électricien', 'Installation et réparation électrique'),
  ('Plombier', 'Installation et réparation de plomberie'),
  ('Menuisier', 'Travaux de menuiserie et ébénisterie'),
  ('Peintre', 'Peinture intérieure et extérieure'),
  ('Maçon', 'Travaux de maçonnerie et construction'),
  ('Carreleur', 'Pose de carrelage et faïence'),
  ('Climatisation', 'Installation et maintenance de climatisation'),
  ('Mécanique automobile', 'Réparation et entretien de véhicules'),
  ('Informatique', 'Dépannage et maintenance informatique'),
  ('Jardinage', 'Entretien d''espaces verts'),
  ('Nettoyage', 'Services de nettoyage professionnel'),
  ('Sécurité', 'Services de gardiennage et sécurité')
ON CONFLICT (nom) DO NOTHING;

-- 3. RLS Policies
ALTER TABLE public.professions ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les professions actives
CREATE POLICY "Anyone can view active professions"
  ON public.professions
  FOR SELECT
  USING (actif = true);

-- Seul l'admin peut insérer
CREATE POLICY "Admin can insert professions"
  ON public.professions
  FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'email') = 'admin@kazipro.com');

-- Seul l'admin peut modifier
CREATE POLICY "Admin can update professions"
  ON public.professions
  FOR UPDATE
  USING ((auth.jwt() ->> 'email') = 'admin@kazipro.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'admin@kazipro.com');

-- Seul l'admin peut supprimer
CREATE POLICY "Admin can delete professions"
  ON public.professions
  FOR DELETE
  USING ((auth.jwt() ->> 'email') = 'admin@kazipro.com');

-- 4. Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_professions_updated_at ON public.professions;

CREATE TRIGGER update_professions_updated_at
  BEFORE UPDATE ON public.professions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Vérifier
SELECT 
  id,
  nom,
  description,
  actif,
  created_at
FROM public.professions
ORDER BY nom;

-- Message de succès
DO $$
DECLARE
  profession_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profession_count FROM public.professions;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ TABLE PROFESSIONS CRÉÉE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 % professions créées', profession_count;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 L''admin peut maintenant:';
  RAISE NOTICE '   - Ajouter de nouvelles professions';
  RAISE NOTICE '   - Modifier les professions existantes';
  RAISE NOTICE '   - Activer/Désactiver des professions';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Les prestataires verront uniquement les professions actives';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
