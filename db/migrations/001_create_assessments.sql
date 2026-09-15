CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key varchar(100) NOT NULL UNIQUE,
  participant_name varchar(120) NOT NULL,
  phone_e164 varchar(16) NOT NULL,
  country char(2) NOT NULL CHECK (country IN ('BR', 'PY')),
  locale varchar(5) NOT NULL CHECK (locale IN ('pt-BR', 'es-PY')),
  consent_at timestamptz NOT NULL,
  scores jsonb NOT NULL,
  profile jsonb NOT NULL,
  whatsapp_url text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS assessments_completed_at_idx ON assessments (completed_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS assessments_phone_idx ON assessments (phone_e164) WHERE deleted_at IS NULL;
