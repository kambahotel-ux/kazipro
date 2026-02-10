-- ═══════════════════════════════════════════════════════════════════
-- CRÉER UN DEVIS DE TEST + SYSTÈME DE CONTRAT AUTOMATIQUE
-- ═══════════════════════════════════════════════════════════════════

-- PARTIE 1: CRÉER UN DEVIS DE TEST POUR VOUS
-- ═══════════════════════════════════════════════════════════════════

-- Étape 1: Récupérer votre client_id
DO $$
DECLARE
  v_client_id UUID;
  v_prestataire_id UUID;
  v_demande_id UUID;
  v_devis_id UUID;
BEGIN
  -- Trouver votre client_id
  SELECT id INTO v_client_id
  FROM clients
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'Vous n''avez pas de profil client. Créez-en un d''abord.';
  END IF;
  
  -- Trouver un prestataire (n'importe lequel)
  SELECT id INTO v_prestataire_id
  FROM prestataires
  WHERE statut = 'actif'
  LIMIT 1;
  
  IF v_prestataire_id IS NULL THEN
    RAISE EXCEPTION 'Aucun prestataire actif trouvé.';
  END IF;
  
  -- Créer une demande de test
  INSERT INTO demandes (
    client_id,
    title,
    description,
    location,
    budget_min,
    budget_max,
    status,
    profession
  ) VALUES (
    v_client_id,
    'Demande de test - Contrat',
    'Ceci est une demande de test pour tester le système de contrats',
    'Kinshasa',
    1000,
    5000,
    'active',
    'Plombier'
  )
  RETURNING id INTO v_demande_id;
  
  -- Créer un devis accepté
  INSERT INTO devis_pro (
    numero,
    titre,
    description,
    demande_id,
    client_id,
    prestataire_id,
    montant_ht,
    tva,
    montant_ttc,
    devise,
    statut,
    delai_execution,
    delai_intervention,
    garantie,
    date_envoi,
    date_acceptation
  ) VALUES (
    'DEV-TEST-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS'),
    'Devis de test pour contrat',
    'Ceci est un devis de test déjà accepté',
    v_demande_id,
    v_client_id,
    v_prestataire_id,
    10000,
    16,
    11600,
    'FC',
    'accepte',
    '5 jours',
    '24 heures',
    '6 mois',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_devis_id;
  
  -- Créer des items pour le devis
  INSERT INTO devis_pro_items (devis_id, designation, quantite, unite, prix_unitaire, montant, ordre)
  VALUES 
    (v_devis_id, 'Main d''œuvre', 1, 'forfait', 8000, 8000, 1),
    (v_devis_id, 'Matériel', 1, 'forfait', 2000, 2000, 2);
  
  RAISE NOTICE '✅ DEVIS DE TEST CRÉÉ!';
  RAISE NOTICE '📋 ID du devis: %', v_devis_id;
  RAISE NOTICE '👤 Votre client_id: %', v_client_id;
  RAISE NOTICE '🔧 Prestataire_id: %', v_prestataire_id;
  RAISE NOTICE '';
  RAISE NOTICE '👉 Allez maintenant sur "Mes Demandes" > "Devis acceptés"';
  RAISE NOTICE '👉 Cliquez sur "Voir le contrat"';
  
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- PARTIE 2: INSTALLER LE TRIGGER DE CRÉATION AUTOMATIQUE
-- ═══════════════════════════════════════════════════════════════════

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_generate_contrat ON devis_pro;
DROP FUNCTION IF EXISTS generate_contrat_from_devis();

-- Créer la fonction de génération de contrat
CREATE OR REPLACE FUNCTION generate_contrat_from_devis()
RETURNS TRIGGER AS $$
DECLARE
  v_numero TEXT;
  v_contenu_html TEXT;
  v_prestataire_name TEXT;
  v_client_name TEXT;
  v_montant_acompte NUMERIC;
  v_montant_solde NUMERIC;
BEGIN
  -- Vérifier que le statut est passé à 'accepte'
  IF NEW.statut = 'accepte' AND (OLD.statut IS NULL OR OLD.statut != 'accepte') THEN
    
    -- Générer un numéro de contrat
    v_numero := 'CTR-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS');
    
    -- Récupérer les noms
    SELECT full_name INTO v_prestataire_name FROM prestataires WHERE id = NEW.prestataire_id;
    SELECT full_name INTO v_client_name FROM clients WHERE id = NEW.client_id;
    
    -- Calculer les montants (30/70 par défaut)
    v_montant_acompte := ROUND((NEW.montant_ttc * 0.30)::numeric, 2);
    v_montant_solde := ROUND((NEW.montant_ttc * 0.70)::numeric, 2);
    
    -- Générer le contenu HTML
    v_contenu_html := '<div style="font-family: Arial, sans-serif; padding: 20px;">
      <h1 style="text-align: center;">CONTRAT DE PRESTATION</h1>
      <p style="text-align: center;">Contrat N° ' || v_numero || '</p>
      
      <h2>Parties:</h2>
      <p><strong>Prestataire:</strong> ' || COALESCE(v_prestataire_name, 'N/A') || '</p>
      <p><strong>Client:</strong> ' || COALESCE(v_client_name, 'N/A') || '</p>
      
      <h2>Objet:</h2>
      <p>Réalisation des prestations décrites dans le devis N° ' || NEW.numero || '</p>
      <p><strong>Montant total:</strong> ' || NEW.montant_ttc || ' FC</p>
      
      <h2>Paiement:</h2>
      <ul>
        <li>Acompte (30%): ' || v_montant_acompte || ' FC</li>
        <li>Solde (70%): ' || v_montant_solde || ' FC</li>
      </ul>
      
      <h2>Conditions:</h2>
      <p>L''acompte est payable avant le début des travaux.</p>
      <p>Le solde est payable après validation des travaux par le client.</p>
      
      <p style="margin-top: 50px;">Fait le ' || TO_CHAR(NOW(), 'DD/MM/YYYY') || '</p>
    </div>';
    
    -- Insérer le contrat
    INSERT INTO contrats (
      numero,
      devis_id,
      client_id,
      prestataire_id,
      contenu_html,
      statut,
      conditions_paiement
    ) VALUES (
      v_numero,
      NEW.id,
      NEW.client_id,
      NEW.prestataire_id,
      v_contenu_html,
      'genere',
      jsonb_build_object(
        'type', 'acompte_solde',
        'acompte', 30,
        'solde', 70,
        'delai_validation', 7
      )
    );
    
    RAISE NOTICE '✅ Contrat % créé automatiquement pour le devis %', v_numero, NEW.numero;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
CREATE TRIGGER trigger_generate_contrat
  AFTER UPDATE ON devis_pro
  FOR EACH ROW
  EXECUTE FUNCTION generate_contrat_from_devis();

-- ═══════════════════════════════════════════════════════════════════
-- PARTIE 3: CORRIGER LES RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════

-- Activer RLS sur contrats
ALTER TABLE contrats ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Clients peuvent voir leurs contrats" ON contrats;
DROP POLICY IF EXISTS "Clients peuvent créer leurs contrats" ON contrats;
DROP POLICY IF EXISTS "Clients peuvent mettre à jour leurs contrats" ON contrats;
DROP POLICY IF EXISTS "Prestataires peuvent voir leurs contrats" ON contrats;

-- Créer les nouvelles policies
CREATE POLICY "Clients peuvent voir leurs contrats"
ON contrats FOR SELECT TO authenticated
USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients peuvent créer leurs contrats"
ON contrats FOR INSERT TO authenticated
WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients peuvent mettre à jour leurs contrats"
ON contrats FOR UPDATE TO authenticated
USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Prestataires peuvent voir leurs contrats"
ON contrats FOR SELECT TO authenticated
USING (prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid()));

-- Policies pour devis_pro
DROP POLICY IF EXISTS "Clients peuvent voir leurs devis" ON devis_pro;
DROP POLICY IF EXISTS "Clients peuvent accepter leurs devis" ON devis_pro;

CREATE POLICY "Clients peuvent voir leurs devis"
ON devis_pro FOR SELECT TO authenticated
USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients peuvent accepter leurs devis"
ON devis_pro FOR UPDATE TO authenticated
USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════════
-- VÉRIFICATION FINALE
-- ═══════════════════════════════════════════════════════════════════

SELECT '✅ SYSTÈME INSTALLÉ AVEC SUCCÈS!' as status;
SELECT '' as separator;
SELECT '📋 Vos devis acceptés:' as info;

SELECT 
  d.id,
  d.numero,
  d.titre,
  d.statut,
  d.montant_ttc,
  CASE 
    WHEN EXISTS (SELECT 1 FROM contrats WHERE devis_id = d.id) 
    THEN '✅ Contrat créé'
    ELSE '❌ Pas de contrat'
  END as contrat_status
FROM devis_pro d
WHERE d.client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  AND d.statut = 'accepte'
ORDER BY d.created_at DESC;

