-- ============================================
-- KaziPro - Initialisation des Tables (Version Nettoyée)
-- ============================================
-- Cette version corrige les erreurs de la version précédente
-- Exécutez ce script dans Supabase SQL Editor

-- ============================================
-- ÉTAPE 1: Supprimer les tables existantes (optionnel)
-- ============================================
-- Décommentez les lignes ci-dessous si vous voulez recommencer de zéro
-- DROP TABLE IF EXISTS messages CASCADE;
-- DROP TABLE IF EXISTS avis CASCADE;
-- DROP TABLE IF EXISTS paiements CASCADE;
-- DROP TABLE IF EXISTS missions CASCADE;
-- DROP TABLE IF EXISTS devis CASCADE;
-- DROP TABLE IF EXISTS demandes CASCADE;
-- DROP TABLE IF EXISTS prestataires CASCADE;
-- DROP TABLE IF EXISTS clients CASCADE;

-- ============================================
-- ÉTAPE 2: Créer les tables
-- ============================================

-- 1. TABLE: clients
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLE: prestataires
CREATE TABLE IF NOT EXISTS prestataires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  profession TEXT NOT NULL,
  bio TEXT,
  rating NUMERIC(3,2) DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  documents_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLE: demandes
CREATE TABLE IF NOT EXISTS demandes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  service TEXT NOT NULL,
  location TEXT NOT NULL,
  budget_min NUMERIC NOT NULL,
  budget_max NUMERIC NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLE: devis
CREATE TABLE IF NOT EXISTS devis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demande_id UUID NOT NULL REFERENCES demandes(id) ON DELETE CASCADE,
  prestataire_id UUID NOT NULL REFERENCES prestataires(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLE: missions
CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devis_id UUID NOT NULL REFERENCES devis(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  prestataire_id UUID NOT NULL REFERENCES prestataires(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABLE: paiements
CREATE TABLE IF NOT EXISTS paiements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('mpesa', 'airtel', 'orange')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABLE: avis
CREATE TABLE IF NOT EXISTS avis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABLE: messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÉTAPE 3: Activer Row Level Security (RLS)
-- ============================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestataires ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE avis ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ÉTAPE 4: Créer les Policies RLS
-- ============================================

-- POLICIES: clients
CREATE POLICY "Clients can view own data"
ON clients FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Clients can update own data"
ON clients FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Prestataires can view client profiles"
ON clients FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM missions
    WHERE missions.client_id = clients.id
    AND missions.prestataire_id IN (
      SELECT id FROM prestataires WHERE user_id = auth.uid()
    )
  )
);

-- POLICIES: prestataires
CREATE POLICY "Prestataires can view own data"
ON prestataires FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Prestataires can update own data"
ON prestataires FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Clients can view prestataire profiles"
ON prestataires FOR SELECT
USING (verified = TRUE);

-- POLICIES: demandes
CREATE POLICY "Clients can view own demandes"
ON demandes FOR SELECT
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Clients can create demandes"
ON demandes FOR INSERT
WITH CHECK (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Clients can update own demandes"
ON demandes FOR UPDATE
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Prestataires can view active demandes"
ON demandes FOR SELECT
USING (status = 'active');

-- POLICIES: devis
CREATE POLICY "Prestataires can view own devis"
ON devis FOR SELECT
USING (
  prestataire_id IN (
    SELECT id FROM prestataires WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Prestataires can create devis"
ON devis FOR INSERT
WITH CHECK (
  prestataire_id IN (
    SELECT id FROM prestataires WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Clients can view devis for their demandes"
ON devis FOR SELECT
USING (
  demande_id IN (
    SELECT id FROM demandes
    WHERE client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  )
);

-- POLICIES: missions
CREATE POLICY "Clients can view own missions"
ON missions FOR SELECT
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Prestataires can view own missions"
ON missions FOR SELECT
USING (
  prestataire_id IN (
    SELECT id FROM prestataires WHERE user_id = auth.uid()
  )
);

-- POLICIES: paiements
CREATE POLICY "Clients can view own paiements"
ON paiements FOR SELECT
USING (
  mission_id IN (
    SELECT id FROM missions
    WHERE client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Prestataires can view own paiements"
ON paiements FOR SELECT
USING (
  mission_id IN (
    SELECT id FROM missions
    WHERE prestataire_id IN (
      SELECT id FROM prestataires WHERE user_id = auth.uid()
    )
  )
);

-- POLICIES: avis
CREATE POLICY "Anyone can view avis"
ON avis FOR SELECT
USING (TRUE);

CREATE POLICY "Users can create avis"
ON avis FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update own avis"
ON avis FOR UPDATE
USING (auth.uid() = from_user_id);

-- POLICIES: messages
CREATE POLICY "Users can view own messages"
ON messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
ON messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- ============================================
-- ÉTAPE 5: Créer les Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_prestataires_user_id ON prestataires(user_id);
CREATE INDEX IF NOT EXISTS idx_demandes_client_id ON demandes(client_id);
CREATE INDEX IF NOT EXISTS idx_demandes_status ON demandes(status);
CREATE INDEX IF NOT EXISTS idx_devis_demande_id ON devis(demande_id);
CREATE INDEX IF NOT EXISTS idx_devis_prestataire_id ON devis(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_missions_client_id ON missions(client_id);
CREATE INDEX IF NOT EXISTS idx_missions_prestataire_id ON missions(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
CREATE INDEX IF NOT EXISTS idx_paiements_mission_id ON paiements(mission_id);
CREATE INDEX IF NOT EXISTS idx_avis_to_user_id ON avis(to_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);

-- ============================================
-- ÉTAPE 6: Créer les Functions et Triggers
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prestataires_updated_at ON prestataires;
CREATE TRIGGER update_prestataires_updated_at BEFORE UPDATE ON prestataires
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_demandes_updated_at ON demandes;
CREATE TRIGGER update_demandes_updated_at BEFORE UPDATE ON demandes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_devis_updated_at ON devis;
CREATE TRIGGER update_devis_updated_at BEFORE UPDATE ON devis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_missions_updated_at ON missions;
CREATE TRIGGER update_missions_updated_at BEFORE UPDATE ON missions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_paiements_updated_at ON paiements;
CREATE TRIGGER update_paiements_updated_at BEFORE UPDATE ON paiements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_avis_updated_at ON avis;
CREATE TRIGGER update_avis_updated_at BEFORE UPDATE ON avis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ÉTAPE 7: Créer les Storage Buckets
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('demandes', 'demandes', true)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('prestataire-documents', 'prestataire-documents', false)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- FIN - Initialisation complète
-- ============================================
-- Les tables sont maintenant créées et prêtes à l'emploi
-- Vous pouvez commencer à utiliser l'application
