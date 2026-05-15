-- Halo Pet Care Security Hardening & Recursion Fix
-- Run this in the Supabase SQL Editor to resolve recursion and RLS blockers

-- 1. CLEANUP (Ensure a clean slate for policies)
DROP POLICY IF EXISTS "Owners have full access to their pets" ON pets;
DROP POLICY IF EXISTS "Caregivers can view shared pets" ON pets;
DROP POLICY IF EXISTS "Users can manage meds for authorized pets" ON medications;
DROP POLICY IF EXISTS "Users can manage logs for authorized pets" ON activity_logs;
DROP POLICY IF EXISTS "Owners can manage pet caregivers" ON pet_caregivers;
DROP POLICY IF EXISTS "Caregivers can view their invitations" ON pet_caregivers;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- 2. SECURITY DEFINER FUNCTIONS (Bypass RLS recursion)
CREATE OR REPLACE FUNCTION public.is_pet_owner(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.pets 
    WHERE id = p_id AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_pet_caregiver(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.pet_caregivers 
    WHERE pet_id = p_id 
    AND caregiver_email = (auth.jwt() ->> 'email')
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. APPLY POLICIES

-- Profiles
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Pets
CREATE POLICY "Owners have full access to their pets" ON pets FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Caregivers can view shared pets" ON pets FOR SELECT USING (is_pet_caregiver(id));

-- Medications
CREATE POLICY "Users can manage meds for authorized pets" ON medications FOR ALL USING (
  is_pet_owner(pet_id) OR is_pet_caregiver(pet_id)
);

-- Activity Logs
CREATE POLICY "Users can manage logs for authorized pets" ON activity_logs FOR ALL USING (
  is_pet_owner(pet_id) OR is_pet_caregiver(pet_id)
);

-- Caregivers
CREATE POLICY "Owners can manage pet caregivers" ON pet_caregivers FOR ALL USING (is_pet_owner(pet_id));
CREATE POLICY "Caregivers can view their invitations" ON pet_caregivers FOR SELECT USING (
  caregiver_email = (auth.jwt() ->> 'email')
);

-- 4. ENSURE PROFILES TABLE IS READY
-- This ensures the foreign key in 'pets' doesn't fail if profiles aren't synced yet
ALTER TABLE public.pets DROP CONSTRAINT IF EXISTS pets_owner_id_fkey;
ALTER TABLE public.pets ADD CONSTRAINT pets_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
