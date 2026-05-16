-- Halo Pet Care: Universal Health Record (UHR) Expansion
-- Purpose: Schema support for Appointments, Vaccinations, and Identity Documents.

-- 1. Identity & Insurance Hardening for Pets
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pets' AND column_name='microchip_id') THEN
        ALTER TABLE pets ADD COLUMN microchip_id text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pets' AND column_name='insurance_provider') THEN
        ALTER TABLE pets ADD COLUMN insurance_provider text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pets' AND column_name='insurance_policy_no') THEN
        ALTER TABLE pets ADD COLUMN insurance_policy_no text;
    END IF;
END $$;

-- 2. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    title text NOT NULL,
    clinic_name text,
    appointment_at timestamp with time zone NOT NULL,
    type text DEFAULT 'checkup' CHECK (type IN ('checkup', 'surgery', 'vaccination', 'specialist', 'emergency', 'grooming', 'other')),
    notes text,
    status text DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT appointments_pkey PRIMARY KEY (id)
);

-- 3. Vaccinations Table
CREATE TABLE IF NOT EXISTS public.vaccinations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    name text NOT NULL,
    administered_at timestamp with time zone,
    expires_at timestamp with time zone,
    batch_no text,
    clinic_name text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT vaccinations_pkey PRIMARY KEY (id)
);

-- 4. Document Vault Table
CREATE TABLE IF NOT EXISTS public.pet_documents (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    title text NOT NULL,
    type text DEFAULT 'other' CHECK (type IN ('passport', 'insurance', 'medical_card', 'prescription', 'other')),
    image_url text NOT NULL,
    issued_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pet_documents_pkey PRIMARY KEY (id)
);

-- 5. Performance Indexing
CREATE INDEX IF NOT EXISTS idx_appointments_pet_id ON appointments(pet_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_pet_id ON vaccinations(pet_id);
CREATE INDEX IF NOT EXISTS idx_documents_pet_id ON pet_documents(pet_id);

-- 6. Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_documents ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies (Simplified for owner access)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their pet appointments') THEN
        CREATE POLICY "Users can manage their pet appointments" ON public.appointments
        FOR ALL USING (EXISTS (SELECT 1 FROM pets WHERE pets.id = appointments.pet_id AND pets.owner_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their pet vaccinations') THEN
        CREATE POLICY "Users can manage their pet vaccinations" ON public.vaccinations
        FOR ALL USING (EXISTS (SELECT 1 FROM pets WHERE pets.id = vaccinations.pet_id AND pets.owner_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their pet documents') THEN
        CREATE POLICY "Users can manage their pet documents" ON public.pet_documents
        FOR ALL USING (EXISTS (SELECT 1 FROM pets WHERE pets.id = pet_documents.pet_id AND pets.owner_id = auth.uid()));
    END IF;
END $$;
