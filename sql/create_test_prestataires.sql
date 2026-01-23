-- ============================================
-- CRÉER DES PRESTATAIRES DE TEST
-- ============================================
-- Pour tester la recherche et les filtres

-- Note: Vous devez avoir au moins un user dans auth.users
-- Si vous n'en avez pas, créez-en via l'interface Supabase Auth

-- Vérifier les users disponibles
SELECT id, email FROM auth.users LIMIT 5;

-- Créer plusieurs prestataires de test avec différents profils
DO $$
DECLARE
  test_user_id uuid;
BEGIN
  -- Récupérer un user existant (ou créer un user générique)
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE EXCEPTION 'Aucun utilisateur trouvé. Créez d''abord un utilisateur dans Supabase Auth.';
  END IF;

  -- Prestataire 1: Électricien vérifié et disponible
  INSERT INTO prestataires (
    user_id,
    full_name,
    profession,
    city,
    bio,
    profile_completed,
    verified,
    disponible,
    hourly_rate,
    experience_years
  ) VALUES (
    test_user_id,
    'Jean Mukendi',
    'Électricien',
    'Gombe',
    'Électricien professionnel avec 10 ans d''expérience. Spécialisé dans les installations résidentielles et commerciales.',
    true,
    true,
    true,
    5000,
    10
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Prestataire 2: Plombier non vérifié mais disponible
  INSERT INTO prestataires (
    user_id,
    full_name,
    profession,
    city,
    bio,
    profile_completed,
    verified,
    disponible,
    hourly_rate,
    experience_years
  ) VALUES (
    gen_random_uuid(), -- Nouveau user fictif
    'Marie Kabongo',
    'Plombier',
    'Ngaliema',
    'Plombière expérimentée. Interventions rapides pour tous vos problèmes de plomberie.',
    true,
    false, -- Non vérifié mais visible!
    true,
    4500,
    7
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Prestataire 3: Menuisier vérifié mais non disponible
  INSERT INTO prestataires (
    user_id,
    full_name,
    profession,
    city,
    bio,
    profile_completed,
    verified,
    disponible,
    hourly_rate,
    experience_years
  ) VALUES (
    gen_random_uuid(),
    'Paul Tshimanga',
    'Menuisier',
    'Lemba',
    'Menuisier artisan. Fabrication sur mesure de meubles et aménagements intérieurs.',
    true,
    true,
    false, -- Non disponible
    6000,
    15
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Prestataire 4: Peintre non vérifié et disponible
  INSERT INTO prestataires (
    user_id,
    full_name,
    profession,
    city,
    bio,
    profile_completed,
    verified,
    disponible,
    hourly_rate,
    experience_years
  ) VALUES (
    gen_random_uuid(),
    'Joseph Nkulu',
    'Peintre',
    'Bandalungwa',
    'Peintre décorateur. Travaux de peinture intérieure et extérieure de qualité.',
    true,
    false,
    true,
    3500,
    5
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Prestataire 5: Maçon vérifié et disponible
  INSERT INTO prestataires (
    user_id,
    full_name,
    profession,
    city,
    bio,
    profile_completed,
    verified,
    disponible,
    hourly_rate,
    experience_years
  ) VALUES (
    gen_random_uuid(),
    'André Mbuyi',
    'Maçon',
    'Limete',
    'Maçon professionnel. Construction, rénovation et réparation de tous types de bâtiments.',
    true,
    true,
    true,
    5500,
    12
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Prestataire 6: Informaticien vérifié et disponible
  INSERT INTO prestataires (
    user_id,
    full_name,
    profession,
    city,
    bio,
    profile_completed,
    verified,
    disponible,
    hourly_rate,
    experience_years
  ) VALUES (
    gen_random_uuid(),
    'Sarah Kalala',
    'Informaticien',
    'Gombe',
    'Technicienne informatique. Dépannage, installation et maintenance de systèmes informatiques.',
    true,
    true,
    true,
    7000,
    8
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Prestataire 7: Mécanicien non vérifié mais disponible
  INSERT INTO prestataires (
    user_id,
    full_name,
    profession,
    city,
    bio,
    profile_completed,
    verified,
    disponible,
    hourly_rate,
    experience_years
  ) VALUES (
    gen_random_uuid(),
    'David Kasongo',
    'Mécanicien',
    'Kintambo',
    'Mécanicien automobile. Réparation et entretien de tous types de véhicules.',
    true,
    false,
    true,
    4000,
    6
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Prestataire 8: Jardinier vérifié et disponible
  INSERT INTO prestataires (
    user_id,
    full_name,
    profession,
    city,
    bio,
    profile_completed,
    verified,
    disponible,
    hourly_rate,
    experience_years
  ) VALUES (
    gen_random_uuid(),
    'Emmanuel Ngoma',
    'Jardinier',
    'Ngaliema',
    'Jardinier paysagiste. Création et entretien d''espaces verts.',
    true,
    true,
    true,
    3000,
    4
  ) ON CONFLICT (user_id) DO NOTHING;

END $$;

-- Vérifier les prestataires créés
SELECT 
  id,
  full_name,
  profession,
  city,
  verified,
  profile_completed,
  disponible,
  hourly_rate,
  experience_years
FROM prestataires
ORDER BY created_at DESC;

-- Statistiques
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE profile_completed = true) as profils_completes,
  COUNT(*) FILTER (WHERE verified = true) as verifies,
  COUNT(*) FILTER (WHERE disponible = true) as disponibles,
  COUNT(*) FILTER (WHERE profile_completed = true AND verified = true) as visibles_avant_fix,
  COUNT(*) FILTER (WHERE profile_completed = true) as visibles_apres_fix
FROM prestataires;
