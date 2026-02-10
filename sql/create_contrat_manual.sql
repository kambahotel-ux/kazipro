-- ═══════════════════════════════════════════════════════════════
-- CRÉER UN CONTRAT MANUELLEMENT
-- ═══════════════════════════════════════════════════════════════
-- Utilise ce script si le trigger n'a pas créé le contrat automatiquement
-- REMPLACE L'ID DU DEVIS CI-DESSOUS

DO $$
DECLARE
  v_devis_id UUID := 'e68ca997-ed77-4b0e-8ab8-e970ed989a78'; -- REMPLACE PAR TON ID
  v_devis RECORD;
  v_numero TEXT;
  v_contenu_html TEXT;
  v_prestataire_name TEXT;
  v_client_name TEXT;
  v_montant_acompte NUMERIC;
  v_montant_solde NUMERIC;
BEGIN
  -- Récupérer le devis
  SELECT * INTO v_devis FROM devis_pro WHERE id = v_devis_id;
  
  IF v_devis IS NULL THEN
    RAISE EXCEPTION 'Devis introuvable avec l''ID: %', v_devis_id;
  END IF;
  
  -- Vérifier si un contrat existe déjà
  IF EXISTS (SELECT 1 FROM contrats WHERE devis_id = v_devis_id) THEN
    RAISE NOTICE '⚠️  Un contrat existe déjà pour ce devis';
    RETURN;
  END IF;
  
  -- Générer un numéro de contrat
  v_numero := 'CTR-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS');
  
  -- Récupérer les noms
  SELECT full_name INTO v_prestataire_name FROM prestataires WHERE id = v_devis.prestataire_id;
  SELECT full_name INTO v_client_name FROM clients WHERE id = v_devis.client_id;
  
  -- Calculer les montants (30/70 par défaut)
  v_montant_acompte := ROUND((v_devis.montant_ttc * 0.30)::numeric, 2);
  v_montant_solde := ROUND((v_devis.montant_ttc * 0.70)::numeric, 2);
  
  -- Générer le contenu HTML
  v_contenu_html := '<div style="font-family: Arial, sans-serif; padding: 20px;">
    <h1 style="text-align: center;">CONTRAT DE PRESTATION</h1>
    <p style="text-align: center;">Contrat N° ' || v_numero || '</p>
    
    <h2>Parties:</h2>
    <p><strong>Prestataire:</strong> ' || COALESCE(v_prestataire_name, 'N/A') || '</p>
    <p><strong>Client:</strong> ' || COALESCE(v_client_name, 'N/A') || '</p>
    
    <h2>Objet:</h2>
    <p>Réalisation des prestations décrites dans le devis N° ' || v_devis.numero || '</p>
    <p><strong>Montant total:</strong> ' || v_devis.montant_ttc || ' FC</p>
    
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
  
  -- Créer le contrat
  INSERT INTO contrats (
    numero,
    devis_id,
    client_id,
    prestataire_id,
    contenu_html,
    statut,
    conditions_paiement,
    date_generation
  ) VALUES (
    v_numero,
    v_devis_id,
    v_devis.client_id,
    v_devis.prestataire_id,
    v_contenu_html,
    'genere',
    jsonb_build_object(
      'type', 'acompte_solde',
      'acompte', 30,
      'solde', 70,
      'delai_validation', 7
    ),
    NOW()
  );
  
  RAISE NOTICE '✅ Contrat % créé avec succès pour le devis %', v_numero, v_devis.numero;
  RAISE NOTICE 'Accède au contrat: /dashboard/client/contrat/%', v_devis_id;
END $$;

-- Vérifier que le contrat a été créé
SELECT 
  '✅ Contrat créé' as status,
  id,
  numero,
  statut,
  devis_id,
  date_generation
FROM contrats
WHERE devis_id = 'e68ca997-ed77-4b0e-8ab8-e970ed989a78';
