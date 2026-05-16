-- Halo Pet Care: Comprehensive Schema Fix
-- This script ensures all required columns exist in the 'pets' table to prevent PGRST204 errors.

DO $$ 
BEGIN
    -- 1. Identity & Documents
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pets' AND column_name='medical_card_no') THEN
        ALTER TABLE pets ADD COLUMN medical_card_no text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pets' AND column_name='passport_number') THEN
        ALTER TABLE pets ADD COLUMN passport_number text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pets' AND column_name='microchip_id') THEN
        ALTER TABLE pets ADD COLUMN microchip_id text;
    END IF;

    -- 2. Insurance
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pets' AND column_name='insurance_provider') THEN
        ALTER TABLE pets ADD COLUMN insurance_provider text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pets' AND column_name='insurance_policy_no') THEN
        ALTER TABLE pets ADD COLUMN insurance_policy_no text;
    END IF;

    -- 3. Veterinary Info
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pets' AND column_name='vet_name') THEN
        ALTER TABLE pets ADD COLUMN vet_name text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pets' AND column_name='vet_phone') THEN
        ALTER TABLE pets ADD COLUMN vet_phone text;
    END IF;

    -- 4. Clinical Details (from clinical_hardening)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pets' AND column_name='sex') THEN
        ALTER TABLE pets ADD COLUMN sex text CHECK (sex IN ('male', 'female', 'unknown'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pets' AND column_name='is_neutered') THEN
        ALTER TABLE pets ADD COLUMN is_neutered boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pets' AND column_name='allergies') THEN
        ALTER TABLE pets ADD COLUMN allergies text DEFAULT 'None known';
    END IF;

END $$;
