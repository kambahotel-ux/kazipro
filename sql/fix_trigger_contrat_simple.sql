-- ═══════════════════════════════════════════════════════════════════
-- FIX TRIGGER - VERSION SIMPLIFIÉE QUI FONCTIONNE À COUP SÛR
-- ═══════════════════════════════════════════════════════════════════

-- Supprimer l'ancien trigger
DROP TRIGGER IF EXISTS trigger_generate_contrat ON devis_pro;
DROP FUNCTION IF EXISTS generate_contrat_from_devis();

-- Créer la fonction simplifiée
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
    
    -- Générer un numéro de contrat simple
    v_numero := 'CTR-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS');
    
    -- Récupérer les noms
    SELECT full_name INTO v_prestataire_name FROM prestataires WHERE id = NEW.prestataire_id;
    SELECT full_name INTO v_client_name FROM clients WHERE id = NEW.client_id;
    
    -- Calculer les montants (30/70 par défaut)
    v_montant_acompte := ROUND((NEW.montant_ttc * 0.30)::numeric, 2);
    v_montant_solde := ROUND((NEW.montant_ttc * 0.70)::numeric, 2);
    
    -- Générer le contenu HTML simplifié
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
    
    RAISE NOTICE '✅ Contrat % créé pour le devis %', v_numero, NEW.numero;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
CREATE TRIGGER trigger_generate_contrat
  AFTER UPDATE ON devis_pro
  FOR EACH ROW
  EXECUTE FUNCTION generate_contrat_from_devis();

-- Test: Afficher les triggers existants
SELECT 
  tgname as trigger_name,
  tgenabled as enabled,
  'devis_pro' as table_name
FROM pg_trigger
WHERE tgname = 'trigger_generate_contrat';

-- Vérification
SELECT '✅ Trigger de génération automatique de contrat créé avec succès!' AS status;
