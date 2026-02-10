-- ═══════════════════════════════════════════════════════════════════
-- INSTALLER LE SYSTÈME DE CONTRATS AUTOMATIQUE
-- (Sans créer de devis de test)
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════
-- PARTIE 1: INSTALLER LE TRIGGER DE CRÉATION AUTOMATIQUE
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

SELECT '✅ Trigger installé avec succès!' as status;

-- ═══════════════════════════════════════════════════════════════════
-- PARTIE 2: CORRIGER LES RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════

-- Activer RLS sur contrats
ALTER TABLE contrats ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Clients peuvent voir leurs contrats" ON contrats;
DROP POLICY IF EXISTS "Clients peuvent créer leurs contrats" ON contrats;
DROP POLICY IF EXISTS "Clients peuvent mettre à jour leurs contrats" ON contrats;
DROP POLICY IF EXISTS "Prestataires peuvent voir leurs contrats" ON contrats;

-- Créer les nouvelles policies pour contrats
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

SELECT '✅ Policies contrats créées!' as status;

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

SELECT '✅ Policies devis_pro créées!' as status;

-- ═══════════════════════════════════════════════════════════════════
-- PARTIE 3: VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════════

-- Vérifier que le trigger existe
SELECT 
  '🔧 TRIGGER' as type,
  tgname as nom,
  CASE tgenabled 
    WHEN 'O' THEN '✅ Activé'
    ELSE '❌ Désactivé'
  END as statut
FROM pg_trigger
WHERE tgname = 'trigger_generate_contrat';

-- Vérifier les policies
SELECT 
  '🔒 POLICIES' as type,
  tablename as table,
  COUNT(*) as nombre_policies
FROM pg_policies 
WHERE tablename IN ('contrats', 'devis_pro')
GROUP BY tablename;

-- ═══════════════════════════════════════════════════════════════════
-- RÉSULTAT
-- ═══════════════════════════════════════════════════════════════════

SELECT '═══════════════════════════════════════════════════════════════════' as separator;
SELECT '✅ SYSTÈME INSTALLÉ AVEC SUCCÈS!' as resultat;
SELECT '' as separator2;
SELECT '📝 PROCHAINES ÉTAPES:' as etapes;
SELECT '1. Connectez-vous en tant que CLIENT dans l''application' as etape1;
SELECT '2. Acceptez un devis existant OU demandez à un prestataire d''en créer un' as etape2;
SELECT '3. Le contrat sera créé AUTOMATIQUEMENT' as etape3;
SELECT '4. Cliquez sur "Voir le contrat" pour le signer' as etape4;
SELECT '═══════════════════════════════════════════════════════════════════' as separator3;

