-- ============================================
-- CRÉER UN DEVIS DE TEST POUR LE FLUX DE PAIEMENT
-- ============================================
-- Ce script crée un devis de test pour tester le flux complet:
-- Acceptation → Signature → Paiement

-- ============================================
-- ÉTAPE 1: Récupérer les IDs nécessaires
-- ============================================

-- Afficher les clients disponibles
SELECT 
  id,
  full_name,
  email,
  user_id
FROM clients
ORDER BY created_at DESC
LIMIT 5;

-- Afficher les prestataires actifs
SELECT 
  id,
  full_name,
  profession,
  statut
FROM prestataires
WHERE statut = 'actif'
ORDER BY created_at DESC
LIMIT 5;

-- Afficher les demandes disponibles
SELECT 
  id,
  title,
  client_id,
  status
FROM demandes
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- ÉTAPE 2: Créer le devis de test
-- ============================================
-- REMPLACER LES UUID CI-DESSOUS PAR LES VRAIS IDs

DO $$
DECLARE
  v_client_id UUID;
  v_prestataire_id UUID;
  v_demande_id UUID;
  v_devis_id UUID;
  v_numero TEXT;
BEGIN
  -- Récupérer automatiquement le premier client
  SELECT id INTO v_client_id FROM clients ORDER BY created_at DESC LIMIT 1;
  
  -- Récupérer automatiquement le premier prestataire actif
  SELECT id INTO v_prestataire_id FROM prestataires WHERE statut = 'actif' ORDER BY created_at DESC LIMIT 1;
  
  -- Récupérer automatiquement la première demande
  SELECT id INTO v_demande_id FROM demandes ORDER BY created_at DESC LIMIT 1;
  
  -- Vérifier que nous avons tous les IDs
  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'Aucun client trouvé. Créez d''abord un client.';
  END IF;
  
  IF v_prestataire_id IS NULL THEN
    RAISE EXCEPTION 'Aucun prestataire actif trouvé. Créez d''abord un prestataire.';
  END IF;
  
  IF v_demande_id IS NULL THEN
    RAISE EXCEPTION 'Aucune demande trouvée. Créez d''abord une demande.';
  END IF;
  
  -- Générer un numéro de devis unique
  v_numero := 'DEV-TEST-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS');
  
  -- Créer le devis
  INSERT INTO devis_pro (
    numero,
    prestataire_id,
    client_id,
    demande_id,
    montant_ht,
    montant_tva,
    montant_ttc,
    statut,
    validite_jours,
    description,
    conditions_generales,
    delai_realisation_jours
  ) VALUES (
    v_numero,
    v_prestataire_id,
    v_client_id,
    v_demande_id,
    500000, -- 500,000 FC HT
    0,      -- Pas de TVA
    500000, -- 500,000 FC TTC
    'en_attente',
    30,
    'Devis de test pour le flux de paiement complet. Ce devis permet de tester l''acceptation, la signature du contrat et le paiement de l''acompte.',
    'Conditions générales de test',
    15
  )
  RETURNING id INTO v_devis_id;
  
  -- Créer quelques items de devis
  INSERT INTO devis_pro_items (devis_id, description, quantite, prix_unitaire, montant_total)
  VALUES 
    (v_devis_id, 'Main d''œuvre', 1, 300000, 300000),
    (v_devis_id, 'Matériaux', 1, 150000, 150000),
    (v_devis_id, 'Déplacement', 1, 50000, 50000);
  
  -- Afficher le résultat
  RAISE NOTICE '✅ Devis de test créé avec succès!';
  RAISE NOTICE 'Numéro: %', v_numero;
  RAISE NOTICE 'ID: %', v_devis_id;
  RAISE NOTICE 'Client ID: %', v_client_id;
  RAISE NOTICE 'Prestataire ID: %', v_prestataire_id;
  RAISE NOTICE '';
  RAISE NOTICE '🔗 URL pour tester:';
  RAISE NOTICE '/dashboard/client/devis/%/accepter', v_devis_id;
  
END $$;

-- ============================================
-- ÉTAPE 3: Afficher le devis créé
-- ============================================

SELECT 
  d.id,
  d.numero,
  d.montant_ttc,
  d.statut,
  d.created_at,
  c.full_name as client_name,
  p.full_name as prestataire_name,
  dem.title as demande_title
FROM devis_pro d
LEFT JOIN clients c ON d.client_id = c.id
LEFT JOIN prestataires p ON d.prestataire_id = p.id
LEFT JOIN demandes dem ON d.demande_id = dem.id
WHERE d.numero LIKE 'DEV-TEST-%'
ORDER BY d.created_at DESC
LIMIT 1;

-- ============================================
-- ÉTAPE 4: Afficher les items du devis
-- ============================================

SELECT 
  di.description,
  di.quantite,
  di.prix_unitaire,
  di.montant_total
FROM devis_pro_items di
WHERE di.devis_id = (
  SELECT id FROM devis_pro 
  WHERE numero LIKE 'DEV-TEST-%' 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- ============================================
-- INSTRUCTIONS
-- ============================================
-- 1. Exécuter ce script dans Supabase SQL Editor
-- 2. Copier l'ID du devis affiché
-- 3. Se connecter en tant que client
-- 4. Aller sur: /dashboard/client/devis/{ID_DU_DEVIS}/accepter
-- 5. Suivre le flux: Accepter → Signer → Payer
