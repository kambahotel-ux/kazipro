-- ═══════════════════════════════════════════════════════════════════
-- TRIGGER - GÉNÉRATION AUTOMATIQUE DU CONTRAT
-- ═══════════════════════════════════════════════════════════════════
-- Quand un devis est accepté, créer automatiquement le contrat
-- ═══════════════════════════════════════════════════════════════════

-- Fonction pour générer le contrat
CREATE OR REPLACE FUNCTION generate_contrat_from_devis()
RETURNS TRIGGER AS $$
DECLARE
  v_numero TEXT;
  v_contenu_html TEXT;
  v_config_globale RECORD;
  v_config_prestataire RECORD;
  v_prestataire RECORD;
  v_client RECORD;
  v_pourcentage_acompte INTEGER;
  v_pourcentage_solde INTEGER;
BEGIN
  -- Vérifier que le statut est passé à 'accepte'
  IF NEW.statut = 'accepte' AND (OLD.statut IS NULL OR OLD.statut != 'accepte') THEN
    
    -- Récupérer la config globale
    SELECT * INTO v_config_globale FROM configuration_paiement_globale LIMIT 1;
    
    -- Récupérer la config du prestataire
    SELECT * INTO v_config_prestataire 
    FROM configuration_paiement_prestataire 
    WHERE prestataire_id = NEW.prestataire_id;
    
    -- Récupérer les infos du prestataire
    SELECT * INTO v_prestataire FROM prestataires WHERE id = NEW.prestataire_id;
    
    -- Récupérer les infos du client
    SELECT * INTO v_client FROM clients WHERE id = NEW.client_id;
    
    -- Déterminer les pourcentages
    IF v_config_prestataire.pourcentage_acompte IS NOT NULL THEN
      v_pourcentage_acompte := v_config_prestataire.pourcentage_acompte;
    ELSE
      v_pourcentage_acompte := v_config_globale.pourcentage_acompte_defaut;
    END IF;
    v_pourcentage_solde := 100 - v_pourcentage_acompte;
    
    -- Générer le numéro de contrat
    v_numero := generate_contrat_numero();
    
    -- Générer le contenu HTML du contrat (simplifié)
    v_contenu_html := format('
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1 style="text-align: center; color: #333;">CONTRAT DE PRESTATION DE SERVICES</h1>
        <p style="text-align: center; color: #666;">Contrat N° %s</p>
        
        <h2>Entre les soussignés:</h2>
        
        <h3>LE PRESTATAIRE:</h3>
        <p><strong>%s</strong><br>
        Email: %s<br>
        Profession: %s</p>
        
        <h3>LE CLIENT:</h3>
        <p><strong>%s</strong><br>
        Email: %s</p>
        
        <h2>Article 1 - Objet du contrat</h2>
        <p>Le présent contrat a pour objet la réalisation des prestations décrites dans le devis N° %s 
        d''un montant total de <strong>%s FC TTC</strong>.</p>
        
        <h2>Article 2 - Conditions de paiement</h2>
        <p>Le paiement s''effectuera en deux fois via la plateforme KaziPro:</p>
        <ul>
          <li><strong>Acompte (%s%%)</strong>: %s FC - À payer avant le début des travaux</li>
          <li><strong>Solde (%s%%)</strong>: %s FC - À payer après validation des travaux</li>
        </ul>
        
        <h2>Article 3 - Délais</h2>
        <p>Le client dispose de %s jours pour valider les travaux après leur achèvement. 
        Passé ce délai, les travaux seront considérés comme validés.</p>
        
        <h2>Article 4 - Garantie</h2>
        <p>Le prestataire garantit ses travaux pendant une durée de %s jours à compter de la validation.</p>
        
        <h2>Article 5 - Litiges</h2>
        <p>En cas de litige, les parties s''engagent à recourir à la médiation de KaziPro avant toute action judiciaire.</p>
        
        <div style="margin-top: 50px;">
          <p>Fait en deux exemplaires,</p>
          <p>Le %s</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-top: 50px;">
          <div style="text-align: center;">
            <p><strong>Signature du Client</strong></p>
            <div style="border: 1px solid #ccc; width: 200px; height: 100px; margin: 10px auto;"></div>
          </div>
          <div style="text-align: center;">
            <p><strong>Signature du Prestataire</strong></p>
            <div style="border: 1px solid #ccc; width: 200px; height: 100px; margin: 10px auto;"></div>
          </div>
        </div>
      </div>
    ',
      v_numero,
      COALESCE(v_prestataire.full_name, 'N/A'),
      COALESCE(v_prestataire.email, 'N/A'),
      COALESCE(v_prestataire.profession, 'N/A'),
      COALESCE(v_client.full_name, 'N/A'),
      COALESCE(v_client.email, 'N/A'),
      NEW.numero,
      NEW.montant_ttc,
      v_pourcentage_acompte,
      ROUND((NEW.montant_ttc * v_pourcentage_acompte / 100)::numeric, 2),
      v_pourcentage_solde,
      ROUND((NEW.montant_ttc * v_pourcentage_solde / 100)::numeric, 2),
      COALESCE(v_config_globale.delai_validation_defaut, 7),
      COALESCE(v_config_globale.duree_garantie_defaut, 30),
      TO_CHAR(NOW(), 'DD/MM/YYYY')
    );
    
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
        'acompte', v_pourcentage_acompte,
        'solde', v_pourcentage_solde,
        'delai_validation', COALESCE(v_config_globale.delai_validation_defaut, 7)
      )
    );
    
    RAISE NOTICE 'Contrat % créé pour le devis %', v_numero, NEW.numero;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_generate_contrat ON devis_pro;
CREATE TRIGGER trigger_generate_contrat
  AFTER UPDATE ON devis_pro
  FOR EACH ROW
  EXECUTE FUNCTION generate_contrat_from_devis();

-- Vérification
SELECT 'Trigger de génération automatique de contrat créé' AS status;
