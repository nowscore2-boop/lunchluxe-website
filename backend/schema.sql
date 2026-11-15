CREATE TABLE IF NOT EXISTS luxe_catalog (
  id integer PRIMARY KEY CHECK (id = 1),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS luxe_admin_sessions (
  token_hash text PRIMARY KEY,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS luxe_orders (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  address text NOT NULL,
  pin text NOT NULL,
  start_date date NOT NULL,
  plan_key text NOT NULL,
  plan_name text NOT NULL,
  amount_paise integer NOT NULL CHECK (amount_paise >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS luxe_finance (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entry_date date NOT NULL,
  kind text NOT NULL CHECK (kind IN ('income', 'expense')),
  category text NOT NULL,
  amount_paise integer NOT NULL CHECK (amount_paise > 0),
  description text NOT NULL DEFAULT '',
  order_id bigint REFERENCES luxe_orders(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS luxe_employees (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL,
  phone text NOT NULL DEFAULT '',
  monthly_salary_paise integer NOT NULL DEFAULT 0 CHECK (monthly_salary_paise >= 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS luxe_employee_records (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  employee_id bigint NOT NULL REFERENCES luxe_employees(id),
  record_date date NOT NULL,
  kind text NOT NULL CHECK (kind IN ('attendance', 'leave', 'shift', 'salary_payment')),
  details text NOT NULL,
  amount_paise integer CHECK (amount_paise IS NULL OR amount_paise >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS luxe_suppliers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS luxe_inventory (
  code text PRIMARY KEY,
  name text NOT NULL,
  unit text NOT NULL,
  quantity numeric(12, 3) NOT NULL CHECK (quantity >= 0),
  reorder_level numeric(12, 3) NOT NULL CHECK (reorder_level >= 0),
  supplier_id bigint REFERENCES luxe_suppliers(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);
