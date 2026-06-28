CREATE TABLE t_p53888217_billiard_club_admin_.balance_transactions (
  id SERIAL PRIMARY KEY,
  amount NUMERIC(12, 2) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('credit', 'debit')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);