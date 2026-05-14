-- Core Schema for Halo Pet Care

-- Profiles table (Linked to Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pets table
CREATE TABLE pets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT,
  breed TEXT,
  birth_date DATE,
  weight_kg DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medications table
CREATE TABLE medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  strength TEXT, -- e.g. 5mg
  dosage_instructions TEXT,
  interval_hours INTEGER NOT NULL, -- Adaptive interval
  window_minutes INTEGER DEFAULT 60, -- Flexible window
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dose Logs table (The History)
CREATE TABLE dose_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  taken_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'taken', -- taken, skipped, missed
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dose_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage their own pets" ON pets FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Users can manage meds for their pets" ON medications FOR ALL USING (
  pet_id IN (SELECT id FROM pets WHERE owner_id = auth.uid())
);
CREATE POLICY "Users can manage logs for their pets" ON dose_logs FOR ALL USING (
  pet_id IN (SELECT id FROM pets WHERE owner_id = auth.uid())
);

-- AI Learning / User Labeled Pills
CREATE TABLE labeled_pills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  pill_name TEXT NOT NULL,
  strength TEXT,
  ai_identified_name TEXT, -- What Gemini thought it was (if any)
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE labeled_pills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own labeled pills" ON labeled_pills FOR ALL USING (user_id = auth.uid());

