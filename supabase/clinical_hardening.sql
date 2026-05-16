-- Halo Pet Care: Clinical Hardening & Performance Migration
-- Purpose: Upgrades the schema to a professional clinical standard with lifecycle tracking and optimized indexing.

-- 1. Create Lifecycle Utility Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Hardening the Pets Table
DO $$ 
BEGIN
    -- Clinical Details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pets' AND column_name='sex') THEN
        ALTER TABLE pets ADD COLUMN sex text CHECK (sex IN ('male', 'female', 'unknown'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pets' AND column_name='is_neutered') THEN
        ALTER TABLE pets ADD COLUMN is_neutered boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pets' AND column_name='allergies') THEN
        ALTER TABLE pets ADD COLUMN allergies text DEFAULT 'None known';
    END IF;

    -- Lifecycle Tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pets' AND column_name='updated_at') THEN
        ALTER TABLE pets ADD COLUMN updated_at timestamp with time zone DEFAULT now();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pets' AND column_name='deleted_at') THEN
        ALTER TABLE pets ADD COLUMN deleted_at timestamp with time zone;
    END IF;
END $$;

-- 3. Hardening the Medications Table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medications' AND column_name='description') THEN
        ALTER TABLE medications ADD COLUMN description text; -- e.g. "Small white pill"
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medications' AND column_name='updated_at') THEN
        ALTER TABLE medications ADD COLUMN updated_at timestamp with time zone DEFAULT now();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medications' AND column_name='deleted_at') THEN
        ALTER TABLE medications ADD COLUMN deleted_at timestamp with time zone;
    END IF;
END $$;

-- 4. Hardening the Profiles Table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='created_at') THEN
        ALTER TABLE profiles ADD COLUMN created_at timestamp with time zone DEFAULT now();
    END IF;
END $$;

-- 5. Creating Performance Indexes
CREATE INDEX IF NOT EXISTS idx_pets_owner_id ON pets(owner_id);
CREATE INDEX IF NOT EXISTS idx_medications_pet_id ON medications(pet_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_pet_id ON activity_logs(pet_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_medication_id ON activity_logs(medication_id);
CREATE INDEX IF NOT EXISTS idx_pet_vitals_pet_id ON pet_vitals(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_caregivers_pet_id ON pet_caregivers(pet_id);

-- 6. Attaching Lifecycle Triggers
DROP TRIGGER IF EXISTS tr_update_pets_modtime ON pets;
CREATE TRIGGER tr_update_pets_modtime BEFORE UPDATE ON pets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS tr_update_medications_modtime ON medications;
CREATE TRIGGER tr_update_medications_modtime BEFORE UPDATE ON medications FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS tr_update_profiles_modtime ON profiles;
CREATE TRIGGER tr_update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 7. Documentation
COMMENT ON COLUMN pets.allergies IS 'List of known drug or food allergies for ER safety';
COMMENT ON COLUMN medications.description IS 'Physical description of the medication for visual verification';
