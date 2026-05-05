CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  session_type_id UUID NOT NULL REFERENCES session_types(id),
  session_date DATE NOT NULL,
  hours NUMERIC(5,2) NOT NULL DEFAULT 1,
  rate NUMERIC(10,2) NOT NULL,
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_note TEXT,
  amount_due NUMERIC(10,2) GENERATED ALWAYS AS (hours * rate) STORED,
  balance NUMERIC(10,2) GENERATED ALWAYS AS ((hours * rate) - amount_paid) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
