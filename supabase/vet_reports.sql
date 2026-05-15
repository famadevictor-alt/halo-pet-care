CREATE TABLE IF NOT EXISTS vet_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  ai_summary TEXT, -- Added for clinical report synthesis
  report_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE vet_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authorized users can manage vet reports" ON vet_reports;
CREATE POLICY "Authorized users can manage vet reports" ON vet_reports 
FOR ALL USING (
  auth.uid() = owner_id OR 
  is_pet_caregiver(pet_id)
);
