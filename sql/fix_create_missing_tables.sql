-- ============================================
-- FIX: Supprimer et recréer les tables
-- ============================================

-- Supprimer les tables si elles existent (dans le bon ordre)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS favoris CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS litiges CASCADE;

-- Maintenant exécuter le script create_missing_tables.sql
-- Ou copier-coller tout le contenu ci-dessous:

-- ============================================
-- CRÉATION DES TABLES MANQUANTES
-- Phase 1, Tâche 1.3
-- ============================================

-- PARTIE 1: Table LITIGES
-- ============================================

CREATE TABLE litiges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Références
  demande_id UUID,
  mission_id UUID,
  devis_id UUID,
  
  -- Qui a ouvert le litige
  ouvert_par UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ouvert_par_type TEXT NOT NULL CHECK (ouvert_par_type IN ('client', 'prestataire')),
  
  -- Détails du litige
  type TEXT NOT NULL CHECK (type IN (
    'travaux_non_conformes',
    'retard_excessif',
    'probleme_paiement',
    'abandon_chantier',
    'qualite_insuffisante',
    'materiel_non_conforme',
    'autre'
  )),
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  preuves TEXT[],
  
  -- Statut
  statut TEXT NOT NULL DEFAULT 'ouvert' CHECK (statut IN (
    'ouvert',
    'en_mediation',
    'en_arbitrage',
    'resolu',
    'clos',
    'annule'
  )),
  
  -- Résolution
  resolution TEXT,
  resolu_par UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  decision_admin TEXT,
  montant_rembourse DECIMAL(10,2),
  
  -- Dates
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- PARTIE 2: Table NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'nouveau_devis',
    'devis_accepte',
    'devis_refuse',
    'demande_attribuee',
    'paiement_recu',
    'mission_demarree',
    'mission_terminee',
    'validation_requise',
    'corrections_demandees',
    'nouveau_message',
    'nouveau_litige',
    'litige_resolu',
    'avis_recu',
    'document_verifie',
    'document_refuse',
    'autre'
  )),
  titre TEXT NOT NULL,
  message TEXT NOT NULL,
  lien TEXT,
  data JSONB,
  lu BOOLEAN DEFAULT FALSE,
  archive BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  lu_at TIMESTAMP WITH TIME ZONE
);

-- PARTIE 3: Table DOCUMENTS
-- ============================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestataire_id UUID NOT NULL REFERENCES prestataires(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'identite',
    'assurance',
    'certificat',
    'diplome',
    'autorisation',
    'casier_judiciaire',
    'attestation_fiscale',
    'autre'
  )),
  nom_fichier TEXT NOT NULL,
  url TEXT NOT NULL,
  taille INTEGER,
  mime_type TEXT,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN (
    'en_attente',
    'valide',
    'refuse',
    'expire'
  )),
  verifie_par UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verifie_at TIMESTAMP WITH TIME ZONE,
  raison_refus TEXT,
  date_emission DATE,
  date_expiration DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTIE 4: Table FAVORIS
-- ============================================

CREATE TABLE favoris (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  prestataire_id UUID NOT NULL REFERENCES prestataires(id) ON DELETE CASCADE,
  note_privee TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, prestataire_id)
);

-- PARTIE 5: Table CONVERSATIONS
-- ============================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  demande_id UUID,
  devis_id UUID,
  mission_id UUID,
  dernier_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archive_par_participant1 BOOLEAN DEFAULT FALSE,
  archive_par_participant2 BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participant1_id, participant2_id, demande_id)
);

-- PARTIE 6: Ajouter foreign keys
-- ============================================

-- Foreign keys pour litiges
ALTER TABLE litiges ADD CONSTRAINT litiges_demande_id_fkey 
  FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE CASCADE;
ALTER TABLE litiges ADD CONSTRAINT litiges_mission_id_fkey 
  FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE;
ALTER TABLE litiges ADD CONSTRAINT litiges_devis_id_fkey 
  FOREIGN KEY (devis_id) REFERENCES devis(id) ON DELETE SET NULL;

-- Foreign keys pour conversations
ALTER TABLE conversations ADD CONSTRAINT conversations_demande_id_fkey 
  FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE SET NULL;
ALTER TABLE conversations ADD CONSTRAINT conversations_devis_id_fkey 
  FOREIGN KEY (devis_id) REFERENCES devis(id) ON DELETE SET NULL;
ALTER TABLE conversations ADD CONSTRAINT conversations_mission_id_fkey 
  FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE SET NULL;

-- PARTIE 7: Indexes
-- ============================================

CREATE INDEX idx_litiges_demande ON litiges(demande_id);
CREATE INDEX idx_litiges_mission ON litiges(mission_id);
CREATE INDEX idx_litiges_ouvert_par ON litiges(ouvert_par);
CREATE INDEX idx_litiges_statut ON litiges(statut);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_lu ON notifications(lu);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

CREATE INDEX idx_documents_prestataire ON documents(prestataire_id);
CREATE INDEX idx_documents_statut ON documents(statut);

CREATE INDEX idx_favoris_client ON favoris(client_id);
CREATE INDEX idx_favoris_prestataire ON favoris(prestataire_id);

CREATE INDEX idx_conversations_participant1 ON conversations(participant1_id);
CREATE INDEX idx_conversations_participant2 ON conversations(participant2_id);

-- PARTIE 8: RLS Policies
-- ============================================

ALTER TABLE litiges ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE favoris ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Policies litiges
CREATE POLICY "Users can view their own litiges" ON litiges FOR SELECT
USING (
  ouvert_par = auth.uid() OR
  demande_id IN (SELECT id FROM demandes WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())) OR
  mission_id IN (SELECT id FROM missions WHERE 
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()) OR
    prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can create litiges" ON litiges FOR INSERT
WITH CHECK (ouvert_par = auth.uid());

CREATE POLICY "Admin can view all litiges" ON litiges FOR ALL
USING ((auth.jwt() ->> 'email') = 'admin@kazipro.com');

-- Policies notifications
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications FOR INSERT
WITH CHECK (TRUE);

-- Policies documents
CREATE POLICY "Prestataires can manage their documents" ON documents FOR ALL
USING (prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid()));

CREATE POLICY "Admin can view all documents" ON documents FOR ALL
USING ((auth.jwt() ->> 'email') = 'admin@kazipro.com');

-- Policies favoris
CREATE POLICY "Clients can manage their favoris" ON favoris FOR ALL
USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- Policies conversations
CREATE POLICY "Users can view their conversations" ON conversations FOR ALL
USING (participant1_id = auth.uid() OR participant2_id = auth.uid());

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Tables manquantes créées avec succès!';
  RAISE NOTICE '1. litiges';
  RAISE NOTICE '2. notifications';
  RAISE NOTICE '3. documents';
  RAISE NOTICE '4. favoris';
  RAISE NOTICE '5. conversations';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 PHASE 1 TERMINÉE!';
END $$;
