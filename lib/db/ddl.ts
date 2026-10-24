/**
 * Database DDL for the MVP.
 *
 * Local development uses PGlite, a real PostgreSQL build compiled to WebAssembly,
 * so the same SQL runs against a hosted PostgreSQL in production via DATABASE_URL.
 * The tables mirror the Prisma-style model in the technical brief one-to-one.
 */
export const DDL = `
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  email varchar(160) NOT NULL,
  full_name varchar(120) NOT NULL,
  password_hash text NOT NULL,
  role varchar(16) NOT NULL CHECK (role IN ('ADMIN', 'PROVIDER')),
  phone varchar(40),
  category varchar(24) CHECK (category IN ('PLUMBING', 'ELECTRICAL', 'CLEANING')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (lower(email));

CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY,
  reference varchar(20) NOT NULL UNIQUE,
  customer_name varchar(120) NOT NULL,
  customer_email varchar(160) NOT NULL,
  customer_phone varchar(40) NOT NULL,
  service_area varchar(80) NOT NULL,
  category varchar(24) NOT NULL CHECK (category IN ('PLUMBING', 'ELECTRICAL', 'CLEANING')),
  description text NOT NULL CHECK (char_length(description) BETWEEN 20 AND 500),
  preferred_date date NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'NEW'
    CHECK (status IN ('NEW', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  provider_id uuid REFERENCES users(id),
  scheduled_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS requests_status_idx ON requests (status);
CREATE INDEX IF NOT EXISTS requests_category_idx ON requests (category);
CREATE INDEX IF NOT EXISTS requests_provider_idx ON requests (provider_id);
CREATE INDEX IF NOT EXISTS requests_created_idx ON requests (created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS requests_reference_key ON requests (upper(reference));

CREATE TABLE IF NOT EXISTS status_events (
  id uuid PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  from_status varchar(16),
  to_status varchar(16) NOT NULL,
  public_text text NOT NULL,
  actor_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS status_events_request_idx ON status_events (request_id, created_at);

CREATE TABLE IF NOT EXISTS internal_notes (
  id uuid PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users(id),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS internal_notes_request_idx ON internal_notes (request_id, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  action varchar(40) NOT NULL,
  actor_id uuid REFERENCES users(id),
  detail text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_events_request_idx ON audit_events (request_id, created_at);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash varchar(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id);
`;
