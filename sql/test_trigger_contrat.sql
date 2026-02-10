-- ═══════════════════════════════════════════════════════════════════
-- TEST DU TRIGGER DE GÉNÉRATION DE CONTRAT
-- ═══════════════════════════════════════════════════════════════════

\echo '═══════════════════════════════════════════════════════════════'
\echo '   TEST DU TRIGGER DE GÉNÉRATION DE CONTRAT'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

-- 1. Vérifier que le trigger existe
\echo '1️⃣  Vérification du trigger...'
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'trigger_generate_contrat'
    ) 
    THEN '✅ Trigger existe'
    ELSE '❌ Trigger MANQUANT - Exécuter sql/fix_trigger_contrat_simple.sql'
  END as check_trigger;

\echo ''

-- 2. Trouver un devis de test
\echo '2️⃣  Recherche d''un devis de test...'
SELECT 
  id,
  numero,
  statut,
  client_id,
  prestataire_id,
  montant_ttc
FROM devis_pro
WHERE statut = 'en_attente'
ORDER BY created_at DESC
LIMIT 1;

\echo ''
\echo '⚠️  Si aucun devis trouvé, exécutez: sql/create_test_devis_for_payment.sql'
\echo ''

-- 3. Compter les contrats existants
\echo '3️⃣  Nombre de contrats existants:'
SELECT COUNT(*) as total_contrats FROM contrats;

\echo ''

-- 4. Instructions pour tester manuellement
\echo '═══════════════════════════════════════════════════════════════'
\echo '   INSTRUCTIONS DE TEST MANUEL'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''
\echo 'Pour tester le trigger manuellement:'
\echo ''
\echo '1. Copier l''ID d''un devis en_attente ci-dessus'
\echo '2. Exécuter cette commande (remplacer UUID_DU_DEVIS):'
\echo ''
\echo '   UPDATE devis_pro'
\echo '   SET statut = ''accepte'','
\echo '       date_acceptation = NOW()'
\echo '   WHERE id = ''UUID_DU_DEVIS'';'
\echo ''
\echo '3. Vérifier qu''un contrat a été créé:'
\echo ''
\echo '   SELECT * FROM contrats'
\echo '   WHERE devis_id = ''UUID_DU_DEVIS'';'
\echo ''
\echo '4. Si le contrat existe, le trigger fonctionne! ✅'
\echo ''

-- 5. Test automatique si un devis existe
DO $$
DECLARE
  v_devis_id UUID;
  v_devis_numero TEXT;
  v_contrat_count INTEGER;
BEGIN
  -- Trouver un devis en_attente
  SELECT id, numero INTO v_devis_id, v_devis_numero
  FROM devis_pro
  WHERE statut = 'en_attente'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_devis_id IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '   TEST AUTOMATIQUE';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Test avec le devis: % (ID: %)', v_devis_numero, v_devis_id;
    RAISE NOTICE '';
    
    -- Mettre à jour le devis pour déclencher le trigger
    UPDATE devis_pro
    SET statut = 'accepte',
        date_acceptation = NOW()
    WHERE id = v_devis_id;
    
    -- Attendre un peu (PostgreSQL n'a pas de sleep natif, mais le trigger est instantané)
    PERFORM pg_sleep(0.5);
    
    -- Vérifier si un contrat a été créé
    SELECT COUNT(*) INTO v_contrat_count
    FROM contrats
    WHERE devis_id = v_devis_id;
    
    IF v_contrat_count > 0 THEN
      RAISE NOTICE '✅ SUCCÈS! Le contrat a été créé automatiquement!';
      RAISE NOTICE '';
      RAISE NOTICE 'Détails du contrat:';
      
      -- Afficher les détails
      FOR rec IN 
        SELECT numero, statut, date_generation
        FROM contrats
        WHERE devis_id = v_devis_id
      LOOP
        RAISE NOTICE '  - Numéro: %', rec.numero;
        RAISE NOTICE '  - Statut: %', rec.statut;
        RAISE NOTICE '  - Date: %', rec.date_generation;
      END LOOP;
    ELSE
      RAISE NOTICE '❌ ÉCHEC! Aucun contrat créé.';
      RAISE NOTICE '';
      RAISE NOTICE 'Vérifiez:';
      RAISE NOTICE '  1. Le trigger existe (voir ci-dessus)';
      RAISE NOTICE '  2. La fonction generate_contrat_from_devis() existe';
      RAISE NOTICE '  3. Les logs PostgreSQL pour voir les erreurs';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Aucun devis en_attente trouvé pour le test automatique.';
    RAISE NOTICE '   Créez un devis de test avec: sql/create_test_devis_for_payment.sql';
    RAISE NOTICE '';
  END IF;
END $$;

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '   FIN DU TEST'
\echo '═══════════════════════════════════════════════════════════════'
