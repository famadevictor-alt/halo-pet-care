-- Core Schema for Halo Pet Care

-- Profiles table (Linked to Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pets table (Enhanced for Clinical Go-Bag)
CREATE TABLE pets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT,
  breed TEXT,
  birth_date DATE,
  weight_kg DECIMAL,
  microchip_id TEXT, -- Added for clinical identification
  medical_notes TEXT, -- Added for ER handoffs
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pet Caregivers (Family Sync Shared Access)
CREATE TABLE pet_caregivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  caregiver_email TEXT NOT NULL,
  role TEXT DEFAULT 'caregiver', 
  status TEXT DEFAULT 'active', 
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pet_id, caregiver_email)
);

-- Medications table
CREATE TABLE medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  strength TEXT,
  dosage_instructions TEXT,
  interval_hours DECIMAL NOT NULL,
  window_minutes INTEGER DEFAULT 60,
  last_taken_at TIMESTAMP WITH TIME ZONE,
  start_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active',
  is_active BOOLEAN DEFAULT TRUE,
  total_quantity INTEGER,
  remaining_doses INTEGER,
  course_duration_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity Logs table
CREATE TABLE activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  medication_id UUID REFERENCES medications(id) ON DELETE SET NULL,
  type TEXT DEFAULT 'medication',
  taken_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'taken',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_caregivers ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- BREAK RLS RECURSION WITH SECURITY DEFINER FUNCTIONS
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
    AND caregiver_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pets Policies
CREATE POLICY "Authorized users can manage pets" ON pets 
FOR ALL USING (
  auth.uid() = owner_id OR 
  is_pet_caregiver(id)
);

-- Medications Policies
CREATE POLICY "Users can manage meds for authorized pets" ON medications FOR ALL USING (
  auth.uid() = (SELECT owner_id FROM pets WHERE id = pet_id) OR
  is_pet_caregiver(pet_id)
);

-- Shared Activity Log Access
CREATE POLICY "Users can manage logs for authorized pets" ON activity_logs FOR ALL USING (
  auth.uid() = (SELECT owner_id FROM pets WHERE id = pet_id) OR
  is_pet_caregiver(pet_id)
);

-- Caregiver Management Policy
CREATE POLICY "Owners can manage pet caregivers" ON pet_caregivers FOR ALL USING (is_pet_owner(pet_id));

CREATE POLICY "Caregivers can view their invitations" ON pet_caregivers FOR SELECT USING (
  caregiver_email = auth.jwt() ->> 'email'
);

-- AI Learning / User Labeled Pills
CREATE TABLE labeled_pills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  pill_name TEXT NOT NULL,
  strength TEXT,
  ai_identified_name TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE labeled_pills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own labeled pills" ON labeled_pills FOR ALL USING (user_id = auth.uid());

