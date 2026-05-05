CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
