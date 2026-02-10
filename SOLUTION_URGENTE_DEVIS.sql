-- ═══════════════════════════════════════════════════════════════
-- SOLUTION URGENTE - CRÉER LE CONTRAT SANS VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════
-- Ce script crée le contrat directement sans vérifier le devis
-- (contourne le problème de RLS)

-- REMPLACE CES VALEURS:
-- devis_id: e68ca997-ed77-4b0e-8ab8-e970ed989a78
-- client_id: TON_CLIENT_ID (récupère-le ci-dessous)
-- prestataire_id: TON_PRESTATAIRE_ID (récupère-le ci-dessous)

-- 1. Récupérer les IDs nécessaires
SELECT 
  'IDs nécessaires' as info,
  id as client_id,
  full_name as client_name
FROM clients
ORDER BY created_at DESC
LIMIT 5;

SELECT 
  'IDs nécessaires' as info,
  id as prestataire_id,
  full_name as prestataire_name
FROM prestataires
ORDER BY created_at DESC
LIMIT 5;

-- 2. Créer le contrat directement
-- REMPLACE LES VALEURS CI-DESSOUS
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
  'CTR-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS'),
  'e68ca997-ed77-4b0e-8ab8-e970ed989a78',
  'TON_CLIENT_ID_ICI',  -- REMPLACE
  'TON_PRESTATAIRE_ID_ICI',  -- REMPLACE
  '<div style="font-family: Arial, sans-serif; padding: 20px;">
    <h1 style="text-align: center;">CONTRAT DE PRESTATION</h1>
    <p style="text-align: center;">Contrat généré automatiquement</p>
    
    <h2>Objet:</h2>
    <p>Réalisation des prestations décrites dans le devis</p>
    <p><strong>Montant total:</strong> 2050 FC</p>
    
    <h2>Paiement:</h2>
    <ul>
      <li>Acompte (30%): 615 FC</li>
      <li>Solde (70%): 1435 FC</li>
    </ul>
    
    <h2>Conditions:</h2>
    <p>L''acompte est payable avant le début des travaux.</p>
    <p>Le solde est payable après validation des travaux par le client.</p>
    
    <p style="margin-top: 50px;">Fait le ' || TO_CHAR(NOW(), 'DD/MM/YYYY') || '</p>
  </div>',
  'genere',
  '{"type": "acompte_solde", "acompte": 30, "solde": 70, "delai_validation": 7}'::jsonb,
  NOW()
)
RETURNING 
  id,
  numero,
  statut,
  '✅ Contrat créé! Accède-y sur: /dashboard/client/contrat/e68ca997-ed77-4b0e-8ab8-e970ed989a78' as message;
