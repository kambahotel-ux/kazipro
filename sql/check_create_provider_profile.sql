-- ============================================
-- VÉRIFIER ET CRÉER UN PROFIL PRESTATAIRE
-- ============================================

-- 1. Vérifier si un profil prestataire existe pour votre compte
-- Remplacez 'VOTRE_EMAIL' par votre email de connexion

SELECT 
  p.id,
  p.user_id,
  p.full_name,
  p.profession,
  p.phone,
  p.email,
  p.verified,
  u.email as auth_email
FROM prestataires p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'VOTRE_EMAIL';

-- Si aucun résultat, créez un profil avec cette requête:

-- 2. Créer un profil prestataire pour votre compte
-- Remplacez les valeurs entre guillemets par vos informations

INSERT INTO prestataires (
  user_id,
  full_name,
  profession,
  phone,
  email,
  city,
  verified,
  bio,
  experience_years,
  hourly_rate,
  availability
)
SELECT 
  id as user_id,
  'Votre Nom Complet' as full_name,
  'Électricien' as profession,
  '+243 XXX XXX XXX' as phone,
  email,
  'Gombe' as city,
  false as verified,
  'Description de votre profil et de votre expérience.' as bio,
  5 as experience_years,
  5000 as hourly_rate,
  'disponible' as availability
FROM auth.users
WHERE email = 'VOTRE_EMAIL'
AND NOT EXISTS (
  SELECT 1 FROM prestataires WHERE user_id = auth.users.id
);

-- 3. Vérifier que le profil a été créé
SELECT 
  p.id,
  p.full_name,
  p.profession,
  p.verified,
  u.email
FROM prestataires p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'VOTRE_EMAIL';

-- ============================================
-- EXEMPLE COMPLET
-- ============================================

-- Si votre email est: prestataire@example.com

-- Étape 1: Vérifier
SELECT 
  p.id,
  p.user_id,
  p.full_name,
  p.profession,
  u.email as auth_email
FROM prestataires p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'prestataire@example.com';

-- Étape 2: Créer (si nécessaire)
INSERT INTO prestataires (
  user_id,
  full_name,
  profession,
  phone,
  email,
  city,
  verified,
  bio,
  experience_years,
  hourly_rate,
  availability
)
SELECT 
  id,
  'Jean Mukeba',
  'Électricien',
  '+243 812 345 678',
  email,
  'Gombe',
  false,
  'Électricien professionnel avec 10 ans d''expérience dans l''installation et la maintenance électrique.',
  10,
  5000,
  'disponible'
FROM auth.users
WHERE email = 'prestataire@example.com'
AND NOT EXISTS (
  SELECT 1 FROM prestataires WHERE user_id = auth.users.id
);

-- ============================================
-- LISTE DES PROFESSIONS DISPONIBLES
-- ============================================
-- Électricien
-- Plombier
-- Menuisier
-- Maçon
-- Peintre
-- Mécanicien
-- Informaticien
-- Jardinier
-- Couturier/Couturière
-- Coiffeur/Coiffeuse

-- ============================================
-- LISTE DES COMMUNES DE KINSHASA
-- ============================================
-- Bandalungwa, Barumbu, Bumbu, Gombe, Kalamu
-- Kasa-Vubu, Kimbanseke, Kinshasa, Kintambo, Kisenso
-- Lemba, Limete, Lingwala, Makala, Maluku
-- Masina, Matete, Mont-Ngafula, Ndjili, Ngaba
-- Ngaliema, Ngiri-Ngiri, Nsele, Selembao
