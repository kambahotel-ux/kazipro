-- ============================================
-- CRÉATION DES TABLES MANQUANTES
-- Phase 1, Tâche 1.3
-- ============================================

-- PARTIE 1: Table LITIGES
-- ============================================

CREATE TABLE IF NOT EXISTS litiges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Références (foreign keys ajoutées après si tables existent)
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
  preuves TEXT[], -- URLs des photos/documents
  
  -- Statut
  statut TEXT NOT NULL DEFAULT 'ouvert' CHECK (statut IN (
    'ouvert',           -- Litige ouvert
    'en_mediation',     -- En cours de médiation
    'en_arbitrage',     -- En arbitrage admin
    'resolu',           -- Résolu à l'amiable
    'clos',             -- Clôturé par admin
    'annule'            -- Annulé par demandeur
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

-- Ajouter les foreign keys si les tables et colonnes existent
DO $$
BEGIN
  -- Vérifier et ajouter foreign key pour demande_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'demandes') AND
     EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'litiges' AND column_name = 'demande_id') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'litiges_demande_id_fkey' AND table_name = 'litiges'
    ) THEN
      ALTER TABLE litiges ADD CONSTRAINT litiges_demande_id_fkey 
        FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE CASCADE;
      RAISE NOTICE 'Foreign key litiges_demande_id_fkey added';
    END IF;
  END IF;

  -- Vérifier et ajouter foreign key pour mission_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'missions') AND
     EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'litiges' AND column_name = 'mission_id') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'litiges_mission_id_fkey' AND table_name = 'litiges'
    ) THEN
      ALTER TABLE litiges ADD CONSTRAINT litiges_mission_id_fkey 
        FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE;
      RAISE NOTICE 'Foreign key litiges_mission_id_fkey added';
    END IF;
  END IF;

  -- Vérifier et ajouter foreign key pour devis_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'devis') AND
     EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'litiges' AND column_name = 'devis_id') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'litiges_devis_id_fkey' AND table_name = 'litiges'
    ) THEN
      ALTER TABLE litiges ADD CONSTRAINT litiges_devis_id_fkey 
        FOREIGN KEY (devis_id) REFERENCES devis(id) ON DELETE SET NULL;
      RAISE NOTICE 'Foreign key litiges_devis_id_fkey added';
    END IF;
  END IF;
END $$;

-- PARTIE 2: Table NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Destinataire
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type de notification
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
  
  -- Contenu
  titre TEXT NOT NULL,
  message TEXT NOT NULL,
  lien TEXT, -- URL vers la page concernée
  
  -- Métadonnées
  data JSONB, -- Données additionnelles (IDs, etc.)
  
  -- Statut
  lu BOOLEAN DEFAULT FALSE,
  archive BOOLEAN DEFAULT FALSE,
  
  -- Dates
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  lu_at TIMESTAMP WITH TIME ZONE
);

-- PARTIE 3: Table DOCUMENTS (pour prestataires)
-- ============================================

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Propriétaire
  prestataire_id UUID NOT NULL REFERENCES prestataires(id) ON DELETE CASCADE,
  
  -- Type de document
  type TEXT NOT NULL CHECK (type IN (
    'identite',              -- Carte d'identité
    'assurance',             -- Assurance professionnelle
    'certificat',            -- Certificat professionnel
    'diplome',               -- Diplôme
    'autorisation',          -- Autorisation d'exercer
    'casier_judiciaire',     -- Casier judiciaire
    'attestation_fiscale',   -- Attestation fiscale
    'autre'
  )),
  
  -- Informations du fichier
  nom_fichier TEXT NOT NULL,
  url TEXT NOT NULL,
  taille INTEGER, -- en bytes
  mime_type TEXT,
  
  -- Statut de vérification
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN (
    'en_attente',   -- En attente de vérification
    'valide',       -- Validé par admin
    'refuse',       -- Refusé
    'expire'        -- Expiré
  )),
  
  -- Vérification
  verifie_par UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verifie_at TIMESTAMP WITH TIME ZONE,
  raison_refus TEXT,
  
  -- Dates
  date_emission DATE,
  date_expiration DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTIE 4: Table FAVORIS
-- ============================================

CREATE TABLE IF NOT EXISTS favoris (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  prestataire_id UUID NOT NULL REFERENCES prestataires(id) ON DELETE CASCADE,
  
  -- Métadonnées
  note_privee TEXT, -- Note personnelle du client
  tags TEXT[], -- Tags personnalisés
  
  -- Dates
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte d'unicité
  UNIQUE(client_id, prestataire_id)
);

-- PARTIE 5: Table MESSAGES_CONVERSATION (amélioration messagerie)
-- ============================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Participants (foreign keys ajoutées après)
  participant1_id UUID NOT NULL,
  participant2_id UUID NOT NULL,
  
  -- Contexte (optionnel, foreign keys ajoutées après)
  demande_id UUID,
  devis_id UUID,
  mission_id UUID,
  
  -- Métadonnées
  dernier_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archive_par_participant1 BOOLEAN DEFAULT FALSE,
  archive_par_participant2 BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte d'unicité
  UNIQUE(participant1_id, participant2_id, demande_id)
);

-- Ajouter les foreign keys pour conversations
DO $$
BEGIN
  -- Foreign keys pour participants (auth.users existe toujours)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'participant1_id') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'conversations_participant1_id_fkey' AND table_name = 'conversations'
    ) THEN
      ALTER TABLE conversations ADD CONSTRAINT conversations_participant1_id_fkey 
        FOREIGN KEY (participant1_id) REFERENCES auth.users(id) ON DELETE CASCADE;
      RAISE NOTICE 'Foreign key conversations_participant1_id_fkey added';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'participant2_id') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'conversations_participant2_id_fkey' AND table_name = 'conversations'
    ) THEN
      ALTER TABLE conversations ADD CONSTRAINT conversations_participant2_id_fkey 
        FOREIGN KEY (participant2_id) REFERENCES auth.users(id) ON DELETE CASCADE;
      RAISE NOTICE 'Foreign key conversations_participant2_id_fkey added';
    END IF;
  END IF;

  -- Foreign keys pour contexte (optionnels)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'demandes') AND
     EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'demande_id') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'conversations_demande_id_fkey' AND table_name = 'conversations'
    ) THEN
      ALTER TABLE conversations ADD CONSTRAINT conversations_demande_id_fkey 
        FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE SET NULL;
      RAISE NOTICE 'Foreign key conversations_demande_id_fkey added';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'devis') AND
     EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'devis_id') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'conversations_devis_id_fkey' AND table_name = 'conversations'
    ) THEN
      ALTER TABLE conversations ADD CONSTRAINT conversations_devis_id_fkey 
        FOREIGN KEY (devis_id) REFERENCES devis(id) ON DELETE SET NULL;
      RAISE NOTICE 'Foreign key conversations_devis_id_fkey added';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'missions') AND
     EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'mission_id') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'conversations_mission_id_fkey' AND table_name = 'conversations'
    ) THEN
      ALTER TABLE conversations ADD CONSTRAINT conversations_mission_id_fkey 
        FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE SET NULL;
      RAISE NOTICE 'Foreign key conversations_mission_id_fkey added';
    END IF;
  END IF;
END $$;

-- Améliorer la table messages existante
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'conversation_id') THEN
    ALTER TABLE messages ADD COLUMN conversation_id UUID;
    RAISE NOTICE 'Colonne conversation_id ajoutée à messages';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'type') THEN
    ALTER TABLE messages ADD COLUMN type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'document', 'systeme'));
    RAISE NOTICE 'Colonne type ajoutée à messages';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'fichier_url') THEN
    ALTER TABLE messages ADD COLUMN fichier_url TEXT;
    RAISE NOTICE 'Colonne fichier_url ajoutée à messages';
  END IF;
  
  -- Ajouter foreign key pour conversation_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') AND
     EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'conversation_id') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'messages_conversation_id_fkey' AND table_name = 'messages'
    ) THEN
      ALTER TABLE messages ADD CONSTRAINT messages_conversation_id_fkey 
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
      RAISE NOTICE 'Foreign key messages_conversation_id_fkey added';
    END IF;
  END IF;
END $$;

-- PARTIE 6: Indexes pour performance
-- ============================================

-- Litiges
CREATE INDEX IF NOT EXISTS idx_litiges_demande ON litiges(demande_id);
CREATE INDEX IF NOT EXISTS idx_litiges_mission ON litiges(mission_id);
CREATE INDEX IF NOT EXISTS idx_litiges_ouvert_par ON litiges(ouvert_par);
CREATE INDEX IF NOT EXISTS idx_litiges_statut ON litiges(statut);
CREATE INDEX IF NOT EXISTS idx_litiges_type ON litiges(type);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_lu ON notifications(lu);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Documents
CREATE INDEX IF NOT EXISTS idx_documents_prestataire ON documents(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_statut ON documents(statut);
CREATE INDEX IF NOT EXISTS idx_documents_expiration ON documents(date_expiration);

-- Favoris
CREATE INDEX IF NOT EXISTS idx_favoris_client ON favoris(client_id);
CREATE INDEX IF NOT EXISTS idx_favoris_prestataire ON favoris(prestataire_id);

-- Conversations
CREATE INDEX IF NOT EXISTS idx_conversations_participant1 ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2 ON conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_demande ON conversations(demande_id);
CREATE INDEX IF NOT EXISTS idx_conversations_dernier_message ON conversations(dernier_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);

-- PARTIE 7: RLS Policies
-- ============================================

-- LITIGES
ALTER TABLE litiges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own litiges" ON litiges;
DROP POLICY IF EXISTS "Users can create litiges" ON litiges;
DROP POLICY IF EXISTS "Admin can view all litiges" ON litiges;

CREATE POLICY "Users can view their own litiges"
ON litiges FOR SELECT TO authenticated
USING (
  ouvert_par = auth.uid() OR
  demande_id IN (SELECT id FROM demandes WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())) OR
  mission_id IN (SELECT id FROM missions WHERE 
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()) OR
    prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can create litiges"
ON litiges FOR INSERT TO authenticated
WITH CHECK (ouvert_par = auth.uid());

CREATE POLICY "Admin can view all litiges"
ON litiges FOR ALL TO authenticated
USING ((auth.jwt() ->> 'email') = 'admin@kazipro.com');

-- NOTIFICATIONS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
ON notifications FOR INSERT TO authenticated
WITH CHECK (TRUE);

-- DOCUMENTS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Prestataires can manage their documents" ON documents;
DROP POLICY IF EXISTS "Admin can view all documents" ON documents;

CREATE POLICY "Prestataires can manage their documents"
ON documents FOR ALL TO authenticated
USING (prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid()));

CREATE POLICY "Admin can view all documents"
ON documents FOR ALL TO authenticated
USING ((auth.jwt() ->> 'email') = 'admin@kazipro.com');

-- FAVORIS
ALTER TABLE favoris ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can manage their favoris" ON favoris;

CREATE POLICY "Clients can manage their favoris"
ON favoris FOR ALL TO authenticated
USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- CONVERSATIONS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;

CREATE POLICY "Users can view their conversations"
ON conversations FOR ALL TO authenticated
USING (participant1_id = auth.uid() OR participant2_id = auth.uid());

-- PARTIE 8: Fonctions utilitaires
-- ============================================

-- Créer une notification
CREATE OR REPLACE FUNCTION creer_notification(
  p_user_id UUID,
  p_type TEXT,
  p_titre TEXT,
  p_message TEXT,
  p_lien TEXT DEFAULT NULL,
  p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, titre, message, lien, data)
  VALUES (p_user_id, p_type, p_titre, p_message, p_lien, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Marquer notifications comme lues
CREATE OR REPLACE FUNCTION marquer_notifications_lues(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  UPDATE notifications 
  SET lu = TRUE, lu_at = NOW()
  WHERE user_id = p_user_id AND lu = FALSE;
  
  GET DIAGNOSTICS count = ROW_COUNT;
  RETURN count;
END;
$$ LANGUAGE plpgsql;

-- Vérifier documents expirés
CREATE OR REPLACE FUNCTION verifier_documents_expires()
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  UPDATE documents 
  SET statut = 'expire'
  WHERE date_expiration < CURRENT_DATE
    AND statut = 'valide'
    AND date_expiration IS NOT NULL;
  
  GET DIAGNOSTICS count = ROW_COUNT;
  RETURN count;
END;
$$ LANGUAGE plpgsql;

-- Obtenir ou créer une conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_user1_id UUID,
  p_user2_id UUID,
  p_demande_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
BEGIN
  -- Chercher conversation existante (dans les deux sens)
  SELECT id INTO conversation_id
  FROM conversations
  WHERE (
    (participant1_id = p_user1_id AND participant2_id = p_user2_id) OR
    (participant1_id = p_user2_id AND participant2_id = p_user1_id)
  )
  AND (demande_id = p_demande_id OR (demande_id IS NULL AND p_demande_id IS NULL))
  LIMIT 1;
  
  -- Si pas trouvée, créer
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (participant1_id, participant2_id, demande_id)
    VALUES (p_user1_id, p_user2_id, p_demande_id)
    RETURNING id INTO conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql;

-- PARTIE 9: Triggers
-- ============================================

-- Trigger pour updated_at sur litiges
CREATE OR REPLACE FUNCTION update_litiges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_litiges_updated_at ON litiges;
CREATE TRIGGER trigger_update_litiges_updated_at
BEFORE UPDATE ON litiges
FOR EACH ROW
EXECUTE FUNCTION update_litiges_updated_at();

-- Trigger pour updated_at sur documents
DROP TRIGGER IF EXISTS trigger_update_documents_updated_at ON documents;
CREATE TRIGGER trigger_update_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour dernier_message_at
CREATE OR REPLACE FUNCTION update_conversation_dernier_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET dernier_message_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_dernier_message ON messages;
CREATE TRIGGER trigger_update_conversation_dernier_message
AFTER INSERT ON messages
FOR EACH ROW
WHEN (NEW.conversation_id IS NOT NULL)
EXECUTE FUNCTION update_conversation_dernier_message();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Tables manquantes créées!';
  RAISE NOTICE '';
  RAISE NOTICE '1. TABLE LITIGES:';
  RAISE NOTICE '   - Gestion complète des litiges';
  RAISE NOTICE '   - Types: travaux_non_conformes, retard, paiement, abandon';
  RAISE NOTICE '   - Statuts: ouvert, en_mediation, en_arbitrage, resolu, clos';
  RAISE NOTICE '';
  RAISE NOTICE '2. TABLE NOTIFICATIONS:';
  RAISE NOTICE '   - 15 types de notifications';
  RAISE NOTICE '   - Marquage lu/non-lu';
  RAISE NOTICE '   - Archivage';
  RAISE NOTICE '';
  RAISE NOTICE '3. TABLE DOCUMENTS:';
  RAISE NOTICE '   - 8 types de documents';
  RAISE NOTICE '   - Vérification admin';
  RAISE NOTICE '   - Gestion expiration';
  RAISE NOTICE '';
  RAISE NOTICE '4. TABLE FAVORIS:';
  RAISE NOTICE '   - Clients marquent prestataires favoris';
  RAISE NOTICE '   - Notes privées et tags';
  RAISE NOTICE '';
  RAISE NOTICE '5. TABLE CONVERSATIONS:';
  RAISE NOTICE '   - Messagerie améliorée';
  RAISE NOTICE '   - Contexte (demande, devis, mission)';
  RAISE NOTICE '   - Support images et documents';
  RAISE NOTICE '';
  RAISE NOTICE '6. Indexes créés pour performance';
  RAISE NOTICE '7. RLS policies configurées';
  RAISE NOTICE '8. Fonctions utilitaires créées';
  RAISE NOTICE '9. Triggers automatiques créés';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 PHASE 1 TERMINÉE!';
  RAISE NOTICE '📊 Base de données complète et prête';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Prochaine étape: PHASE 2 - Créer les pages frontend';
END $$;
