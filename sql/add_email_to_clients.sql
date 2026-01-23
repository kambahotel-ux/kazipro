-- Ajouter la colonne email à la table clients
-- Cette colonne est nécessaire pour l'authentification Google

-- Ajouter la colonne email si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'email'
  ) THEN
    ALTER TABLE clients ADD COLUMN email TEXT;
    
    -- Rendre la colonne unique
    ALTER TABLE clients ADD CONSTRAINT clients_email_unique UNIQUE (email);
    
    -- Créer un index pour améliorer les performances
    CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
    
    RAISE NOTICE 'Colonne email ajoutée à la table clients';
  ELSE
    RAISE NOTICE 'La colonne email existe déjà dans la table clients';
  END IF;
END $$;

-- Mettre à jour les clients existants avec l'email de auth.users
UPDATE clients c
SET email = u.email
FROM auth.users u
WHERE c.user_id = u.id AND c.email IS NULL;

-- Afficher le résultat
SELECT 
  COUNT(*) as total_clients,
  COUNT(email) as clients_avec_email
FROM clients;
