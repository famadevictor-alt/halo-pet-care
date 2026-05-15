-- Halo Pet Care: Clinical Hardening & Schema Refinements
-- This script applies the optimizations identified in the Clinical Audit.

-- 1. Standardize User Identity Mapping
-- Ensure all owner/user references point to the public.profiles table
ALTER TABLE public.medications 
  DROP CONSTRAINT IF EXISTS medications_owner_id_fkey,
  ADD CONSTRAINT medications_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.labeled_pills
  DROP CONSTRAINT IF EXISTS labeled_pills_user_id_fkey,
  ADD CONSTRAINT labeled_pills_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Hardening Pet Vitals
-- Add 'recorded_by' to track who logged the data (Owner vs Caregiver)
ALTER TABLE public.pet_vitals 
  ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Clinical Safety Constraints
-- Prevent "impossible" medication protocols and physical data errors
ALTER TABLE public.medications 
  ADD CONSTRAINT med_interval_positive CHECK (interval_hours > 0),
  ADD CONSTRAINT med_quantity_logical CHECK (remaining_doses <= total_quantity);

ALTER TABLE public.pet_vitals 
  ADD CONSTRAINT vitals_weight_positive CHECK (weight > 0);

ALTER TABLE public.pet_caregivers
  ADD CONSTRAINT valid_role CHECK (role IN ('owner', 'caregiver', 'vet', 'emergency_contact'));

-- 4. RLS Performance Optimization
-- Hardening medications policy using the direct 'owner_id' column
DROP POLICY IF EXISTS "Users can manage meds for authorized pets" ON public.medications;
CREATE POLICY "Users can manage meds for authorized pets" ON public.medications 
FOR ALL USING (
  auth.uid() = owner_id OR 
  is_pet_caregiver(pet_id)
);

-- Optimization for activity logs
DROP POLICY IF EXISTS "Users can manage logs for authorized pets" ON public.activity_logs;
CREATE POLICY "Users can manage logs for authorized pets" ON public.activity_logs
FOR ALL USING (
  auth.uid() = (SELECT owner_id FROM public.pets WHERE id = pet_id) OR
  is_pet_caregiver(pet_id)
);

-- 4b. Universal Pet Editing for Authorized Users
-- Ensure caregivers can also update pet details (breed, weight, notes)
DROP POLICY IF EXISTS "Owners have full access to their pets" ON public.pets;
DROP POLICY IF EXISTS "Caregivers can view shared pets" ON public.pets;
CREATE POLICY "Authorized users can manage pets" ON public.pets 
FOR ALL USING (
  auth.uid() = owner_id OR 
  is_pet_caregiver(id)
);

-- 5. Caregiver Invitation Status Logic
-- Standardize on 'pending' for new invitations to support the "Accept Invite" flow
ALTER TABLE public.pet_caregivers ALTER COLUMN status SET DEFAULT 'pending';

-- 6. SECURITY WARNING: API KEY PROTECTION
-- Note: In notifications.sql, replace your hardcoded Resend key with a secret lookup.
-- For now, we ensure the trigger function is isolated and secure.
ALTER FUNCTION public.on_caregiver_invited() SECURITY DEFINER;

COMMENT ON TABLE public.medications IS 'Clinical medication protocols with direct owner_id for RLS performance.';
COMMENT ON TABLE public.pet_vitals IS 'Pet health metrics tracked by both owners and clinical caregivers.';
