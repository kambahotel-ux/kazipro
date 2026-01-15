-- ============================================
-- KaziPro - Reset and Initialize Database
-- ============================================
-- This script drops everything and starts fresh
-- Use this if you have existing tables/policies

-- ============================================
-- STEP 1: Drop all existing policies
-- ============================================

DROP POLICY IF EXISTS "Clients can view own data" ON clients;
DROP POLICY IF EXISTS "Clients can update own data" ON clients;
DROP POLICY IF EXISTS "Prestataires can view client profiles" ON clients;

DROP POLICY IF EXISTS "Prestataires can view own data" ON prestataires;
DROP POLICY IF EXISTS "Prestataires can update own data" ON prestataires;
DROP POLICY IF EXISTS "Clients can view prestataire profiles" ON prestataires;

DROP POLICY IF EXISTS "Clients can view own demandes" ON demandes;
DROP POLICY IF EXISTS "Clients can create demandes" ON demandes;
DROP POLICY IF EXISTS "Clients can update own demandes" ON demandes;
DROP POLICY IF EXISTS "Prestataires can view active demandes" ON demandes;

DROP POLICY IF EXISTS "Prestataires can view own devis" ON devis;
DROP POLICY IF EXISTS "Prestataires can create devis" ON devis;
DROP POLICY IF EXISTS "Clients can view devis for their demandes" ON devis;

DROP POLICY IF EXISTS "Clients can view own missions" ON missions;
DROP POLICY IF EXISTS "Prestataires can view own missions" ON missions;

DROP POLICY IF EXISTS "Clients can view own paiements" ON paiements;
DROP POLICY IF EXISTS "Prestataires can view own paiements" ON paiements;

DROP POLICY IF EXISTS "Anyone can view avis" ON avis;
DROP POLICY IF EXISTS "Users can create avis" ON avis;
DROP POLICY IF EXISTS "Users can update own avis" ON avis;

DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;

-- ============================================
-- STEP 2: Drop all existing triggers
-- ============================================

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
DROP TRIGGER IF EXISTS update_prestataires_updated_at ON prestataires;
DROP TRIGGER IF EXISTS update_demandes_updated_at ON demandes;
DROP TRIGGER IF EXISTS update_devis_updated_at ON devis;
DROP TRIGGER IF EXISTS update_missions_updated_at ON missions;
DROP TRIGGER IF EXISTS update_paiements_updated_at ON paiements;
DROP TRIGGER IF EXISTS update_avis_updated_at ON avis;

-- ============================================
-- STEP 3: Drop all existing tables
-- ============================================

DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS avis CASCADE;
DROP TABLE IF EXISTS paiements CASCADE;
DROP TABLE IF EXISTS missions CASCADE;
DROP TABLE IF EXISTS devis CASCADE;
DROP TABLE IF EXISTS demandes CASCADE;
DROP TABLE IF EXISTS prestataires CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- ============================================
-- STEP 4: Create all tables fresh
-- ============================================

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE prestataires (
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

CREATE TABLE demandes (
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

CREATE TABLE devis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demande_id UUID NOT NULL REFERENCES demandes(id) ON DELETE CASCADE,
  prestataire_id UUID NOT NULL REFERENCES prestataires(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE missions (
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

CREATE TABLE paiements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('mpesa', 'airtel', 'orange')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE avis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 5: Enable RLS
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
-- STEP 6: Create RLS Policies
-- ============================================

-- Clients policies
CREATE POLICY "Clients can view own data" ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Clients can update own data" ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Prestataires can view client profiles" ON clients FOR SELECT USING (
  EXISTS (SELECT 1 FROM missions WHERE missions.client_id = clients.id AND missions.prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid()))
);

-- Prestataires policies
CREATE POLICY "Prestataires can view own data" ON prestataires FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Prestataires can update own data" ON prestataires FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Clients can view prestataire profiles" ON prestataires FOR SELECT USING (verified = TRUE);

-- Demandes policies
CREATE POLICY "Clients can view own demandes" ON demandes FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);
CREATE POLICY "Clients can create demandes" ON demandes FOR INSERT WITH CHECK (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);
CREATE POLICY "Clients can update own demandes" ON demandes FOR UPDATE USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);
CREATE POLICY "Prestataires can view active demandes" ON demandes FOR SELECT USING (status = 'active');

-- Devis policies
CREATE POLICY "Prestataires can view own devis" ON devis FOR SELECT USING (
  prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
);
CREATE POLICY "Prestataires can create devis" ON devis FOR INSERT WITH CHECK (
  prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
);
CREATE POLICY "Clients can view devis for their demandes" ON devis FOR SELECT USING (
  demande_id IN (SELECT id FROM demandes WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
);

-- Missions policies
CREATE POLICY "Clients can view own missions" ON missions FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);
CREATE POLICY "Prestataires can view own missions" ON missions FOR SELECT USING (
  prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid())
);

-- Paiements policies
CREATE POLICY "Clients can view own paiements" ON paiements FOR SELECT USING (
  mission_id IN (SELECT id FROM missions WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
);
CREATE POLICY "Prestataires can view own paiements" ON paiements FOR SELECT USING (
  mission_id IN (SELECT id FROM missions WHERE prestataire_id IN (SELECT id FROM prestataires WHERE user_id = auth.uid()))
);

-- Avis policies
CREATE POLICY "Anyone can view avis" ON avis FOR SELECT USING (TRUE);
CREATE POLICY "Users can create avis" ON avis FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Users can update own avis" ON avis FOR UPDATE USING (auth.uid() = from_user_id);

-- Messages policies
CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- ============================================
-- STEP 7: Create Indexes
-- ============================================

CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_prestataires_user_id ON prestataires(user_id);
CREATE INDEX idx_demandes_client_id ON demandes(client_id);
CREATE INDEX idx_demandes_status ON demandes(status);
CREATE INDEX idx_devis_demande_id ON devis(demande_id);
CREATE INDEX idx_devis_prestataire_id ON devis(prestataire_id);
CREATE INDEX idx_missions_client_id ON missions(client_id);
CREATE INDEX idx_missions_prestataire_id ON missions(prestataire_id);
CREATE INDEX idx_missions_status ON missions(status);
CREATE INDEX idx_paiements_mission_id ON paiements(mission_id);
CREATE INDEX idx_avis_to_user_id ON avis(to_user_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);

-- ============================================
-- STEP 8: Create Function and Triggers
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prestataires_updated_at BEFORE UPDATE ON prestataires FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_demandes_updated_at BEFORE UPDATE ON demandes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_devis_updated_at BEFORE UPDATE ON devis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_missions_updated_at BEFORE UPDATE ON missions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_paiements_updated_at BEFORE UPDATE ON paiements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_avis_updated_at BEFORE UPDATE ON avis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 9: Create Storage Buckets
-- ============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('demandes', 'demandes', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('prestataire-documents', 'prestataire-documents', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

-- ============================================
-- DONE - Database is ready!
-- ============================================
