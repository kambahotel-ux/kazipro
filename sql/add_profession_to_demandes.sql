-- Add profession column to demandes table
-- This allows tracking which profession is requested

-- Add the column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'demandes' AND column_name = 'profession'
  ) THEN
    ALTER TABLE demandes ADD COLUMN profession TEXT;
  END IF;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_demandes_profession ON demandes(profession);

-- Update existing demandes with a default profession if needed
-- (Optional: You can skip this if you want to leave existing records as NULL)
UPDATE demandes 
SET profession = 'Non spécifié' 
WHERE profession IS NULL;

-- Add comment
COMMENT ON COLUMN demandes.profession IS 'Profession demandée par le client';
