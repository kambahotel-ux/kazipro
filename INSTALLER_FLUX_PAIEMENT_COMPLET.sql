-- ═══════════════════════════════════════════════════════════════
-- INSTALLATION COMPLÈTE DU FLUX DE PAIEMENT
-- ═══════════════════════════════════════════════════════════════
-- Ce script installe TOUT ce qui est nécessaire pour le flux:
-- Acceptation Devis → Signature Contrat → Paiement Acompte
--
-- EXÉCUTER CE SCRIPT UNE SEULE FOIS dans Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

\echo '═══════════════════════════════════════════════════════════════'
\echo '   INSTALLATION DU FLUX DE PAIEMENT'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

-- ═══════════════════════════════════════════════════════════════
-- PARTIE 1: BUCKET DE STOCKAGE POUR LES SIGNATURES
-- ═══════════════════════════════════════════════════════════════

\echo '1️⃣  Création du bucket signatures...'

-- Créer le bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signatures',
  'signatures',
  true,
  2097152, -- 2MB max
  ARRAY['image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg'];

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Public read signatures" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload signatures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own signatures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own signatures" ON storage.objects;

-- Créer les politiques
CREATE POLICY "Public read signatures"
ON storage.objects FOR SELECT
USING (bucket_id = 'signatures');

CREATE POLICY "Authenticated users can upload signatures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'signatures');

CREATE POLICY "Users can update their own signatures"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'signatures')
WITH CHECK (bucket_id = 'signatures');

CREATE POLICY "Users can delete their own signatures"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'signatures');

\echo '   ✅ Bucket signatures créé'
\echo ''

-- ═══════════════════════════════════════════════════════════════
-- PARTIE 2: TRIGGER DE GÉNÉRATION AUTOMATIQUE DE CONTRAT
-- ═══════════════════════════════════════════════════════════════

\echo '2️⃣  Création du trigger de génération de contrat...'

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS auto_create_contrat_on_devis_accept ON devis_pro;
DROP FUNCTION IF EXISTS create_contrat_from_devis();

-- Créer la fonction
CREATE OR REPLACE FUNCTION create_contrat_from_devis()
RETURNS TRIGGER AS $$
DECLARE
  v_contrat_numero TEXT;
  v_contenu_html TEXT;
  v_conditions_paiement JSONB;
BEGIN
  -- Vérifier que le statut est passé à "accepte"
  IF NEW.statut = 'accepte' AND (OLD.statut IS NULL OR OLD.statut != 'accepte') THEN
    
    -- Générer le numéro de contrat
    SELECT 'CTR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('contrats_numero_seq')::TEXT, 4, '0')
    INTO v_contrat_numero;
    
    -- Générer le contenu HTML du contrat
    v_contenu_html := '<div class="contrat">
      <h1>CONTRAT DE PRESTATION DE SERVICES</h1>
      <p><strong>Numéro:</strong> ' || v_contrat_numero || '</p>
      <p><strong>Date:</strong> ' || TO_CHAR(NOW(), 'DD/MM/YYYY') || '</p>
      
      <h2>ENTRE LES SOUSSIGNÉS:</h2>
      <p>Le Client et le Prestataire acceptent les termes suivants:</p>
      
      <h2>ARTICLE 1 - OBJET DU CONTRAT</h2>
      <p>Le présent contrat a pour objet la réalisation des prestations décrites dans le devis n° ' || NEW.numero || '</p>
      
      <h2>ARTICLE 2 - MONTANT</h2>
      <p>Montant total: ' || NEW.montant_ttc || ' FC</p>
      
      <h2>ARTICLE 3 - CONDITIONS DE PAIEMENT</h2>
      <p>Le paiement s''effectue en deux temps:</p>
      <ul>
        <li>Acompte de 30% à la signature: ' || ROUND(NEW.montant_ttc * 0.30) || ' FC</li>
        <li>Solde de 70% après validation: ' || ROUND(NEW.montant_ttc * 0.70) || ' FC</li>
      </ul>
      
      <h2>ARTICLE 4 - DÉLAI DE RÉALISATION</h2>
      <p>Délai: ' || COALESCE(NEW.delai_realisation_jours::TEXT, '30') || ' jours</p>
      
      <h2>ARTICLE 5 - GARANTIES</h2>
      <p>Le paiement est sécurisé par KaziPro. L''acompte est bloqué jusqu''au début des travaux.</p>
      
      <h2>SIGNATURES</h2>
      <p>Les parties reconnaissent avoir lu et accepté les présentes conditions.</p>
    </div>';
    
    -- Préparer les conditions de paiement
    v_conditions_paiement := jsonb_build_object(
      'acompte', 30,
      'solde', 70,
      'delai_paiement_solde', 7,
      'garantie_jours', 30
    );
    
    -- Créer le contrat
    INSERT INTO contrats (
      numero,
      devis_id,
      prestataire_id,
      client_id,
      montant_total,
      statut,
      contenu_html,
      conditions_paiement,
      date_generation
    ) VALUES (
      v_contrat_numero,
      NEW.id,
      NEW.prestataire_id,
      NEW.client_id,
      NEW.montant_ttc,
      'genere',
      v_contenu_html,
      v_conditions_paiement,
      NOW()
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
CREATE TRIGGER auto_create_contrat_on_devis_accept
AFTER UPDATE ON devis_pro
FOR EACH ROW
EXECUTE FUNCTION create_contrat_from_devis();

\echo '   ✅ Trigger de génération de contrat créé'
\echo ''

-- ═══════════════════════════════════════════════════════════════
-- PARTIE 3: POLITIQUES RLS POUR LES PAIEMENTS
-- ═══════════════════════════════════════════════════════════════

\echo '3️⃣  Configuration des politiques RLS...'

-- Activer RLS sur paiements si pas déjà fait
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Clients can view their payments" ON paiements;
DROP POLICY IF EXISTS "Prestataires can view their payments" ON paiements;
DROP POLICY IF EXISTS "Clients can create payments" ON paiements;
DROP POLICY IF EXISTS "System can update payments" ON paiements;

-- Politique de lecture pour les clients
CREATE POLICY "Clients can view their payments"
ON paiements FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

-- Politique de lecture pour les prestataires
CREATE POLICY "Prestataires can view their payments"
ON paiements FOR SELECT
TO authenticated
USING (
  prestataire_id IN (
    SELECT id FROM prestataires WHERE user_id = auth.uid()
  )
);

-- Politique de création pour les clients
CREATE POLICY "Clients can create payments"
ON paiements FOR INSERT
TO authenticated
WITH CHECK (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

-- Politique de mise à jour (pour le système)
CREATE POLICY "System can update payments"
ON paiements FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

\echo '   ✅ Politiques RLS configurées'
\echo ''

-- ═══════════════════════════════════════════════════════════════
-- PARTIE 4: VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════

\echo '4️⃣  Vérification de l''installation...'
\echo ''

-- Vérifier le bucket
SELECT 
  '   ✅ Bucket: ' || id || ' (public: ' || public || ')' as verification
FROM storage.buckets
WHERE id = 'signatures';

-- Vérifier le trigger
SELECT 
  '   ✅ Trigger: ' || tgname as verification
FROM pg_trigger
WHERE tgname = 'auto_create_contrat_on_devis_accept';

-- Vérifier les politiques RLS
SELECT 
  '   ✅ Politique RLS: ' || policyname as verification
FROM pg_policies
WHERE tablename = 'paiements'
LIMIT 4;

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '   ✅ INSTALLATION TERMINÉE AVEC SUCCÈS!'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''
\echo 'Le système est maintenant prêt pour le flux de paiement:'
\echo '  1. Acceptation du devis'
\echo '  2. Signature du contrat'
\echo '  3. Paiement de l''acompte'
\echo ''
\echo 'Pour tester, exécutez: sql/create_test_devis_for_payment.sql'
\echo ''
