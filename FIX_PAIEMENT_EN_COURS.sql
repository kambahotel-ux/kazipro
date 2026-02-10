-- ============================================
-- FIX: Mettre à jour les paiements en_cours
-- ============================================

-- Mettre à jour le paiement spécifique qui est resté en_cours
UPDATE paiements
SET 
  statut = 'valide',
  date_paiement = COALESCE(date_paiement, created_at),
  transaction_id = COALESCE(transaction_id, 'SIM-' || EXTRACT(EPOCH FROM NOW())::BIGINT),
  reference_paiement = COALESCE(reference_paiement, 'REF-' || EXTRACT(EPOCH FROM NOW())::BIGINT)
WHERE id = '4c2b2daf-e55d-4425-8a6b-129049b643bd'
  AND statut = 'en_cours';

-- Vérifier le résultat
SELECT 
  numero,
  statut,
  montant_total,
  date_paiement,
  transaction_id,
  reference_paiement
FROM paiements
WHERE id = '4c2b2daf-e55d-4425-8a6b-129049b643bd';

-- Vérifier que le contrat a été mis à jour
SELECT 
  numero,
  statut,
  statut_paiement
FROM contrats
WHERE id = '0126577a-56b7-47e9-9199-4e0818904e53';

-- Si le contrat n'a pas été mis à jour automatiquement, le faire manuellement
UPDATE contrats
SET statut_paiement = 'acompte_paye'
WHERE id = '0126577a-56b7-47e9-9199-4e0818904e53'
  AND statut_paiement = 'non_paye';

-- Afficher le résultat final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ PAIEMENT MIS À JOUR!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Le paiement PAY-2026-0009 est maintenant "valide"';
  RAISE NOTICE 'Le contrat CTR-1769517391901 est maintenant "acompte_paye"';
  RAISE NOTICE '';
  RAISE NOTICE 'Rafraîchissez la page pour voir les changements!';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
