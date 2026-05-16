-- Add veterinary contact info to pets table
ALTER TABLE pets ADD COLUMN IF NOT EXISTS vet_name TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS vet_phone TEXT;

-- Add comment for documentation
COMMENT ON COLUMN pets.vet_name IS 'The name of the primary care veterinarian or clinic';
COMMENT ON COLUMN pets.vet_phone IS 'The contact phone number for the primary care veterinarian';
