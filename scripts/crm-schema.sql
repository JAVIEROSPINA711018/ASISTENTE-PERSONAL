-- CRM Schema for Cerebro Supabase
-- Run this in the Cerebro SQL Editor (losnixgwvwxffamwplwj) ONCE before running the migration script.

-- clients
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  type text DEFAULT 'Particular',
  address text,
  contact_email text,
  phone text,
  created_at timestamptz DEFAULT now(),
  user_id uuid,
  identification text
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users" ON public.clients;
CREATE POLICY "Allow authenticated users" ON public.clients
  FOR ALL USING (auth.role() = 'authenticated');

-- projects
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number integer,
  name text NOT NULL,
  type text DEFAULT 'Estudio de Suelos',
  client_id uuid REFERENCES public.clients(id),
  value_without_tax numeric DEFAULT 0,
  services jsonb DEFAULT '[]' ::jsonb,
  status text DEFAULT 'En Ejecución',
  responsible_id text,
  start_date date,
  deadline date,
  progress integer DEFAULT 0,
  checklist jsonb DEFAULT '[]' ::jsonb,
  created_at timestamptz DEFAULT now(),
  user_id uuid,
  acta_url text,
  service_types text[]
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users" ON public.projects;
CREATE POLICY "Allow authenticated users" ON public.projects
  FOR ALL USING (auth.role() = 'authenticated');

-- quotes
CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  client_id uuid REFERENCES public.clients(id),
  type text,
  value numeric DEFAULT 0,
  services jsonb DEFAULT '[]' ::jsonb,
  status text DEFAULT 'Borrador',
  issue_date date,
  valid_until date,
  description text,
  created_at timestamptz DEFAULT now(),
  user_id uuid,
  custom_body text,
  apply_iva boolean DEFAULT false
);
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users" ON public.quotes;
CREATE POLICY "Allow authenticated users" ON public.quotes
  FOR ALL USING (auth.role() = 'authenticated');

-- financials
CREATE TABLE IF NOT EXISTS public.financials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id),
  description text,
  amount numeric DEFAULT 0,
  type text,
  status text,
  date date,
  created_at timestamptz DEFAULT now(),
  user_id uuid,
  is_personal boolean DEFAULT false,
  receipt_url text,
  category text,
  payment_method text,
  payment_details text,
  bank_account_id uuid
);
ALTER TABLE public.financials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users" ON public.financials;
CREATE POLICY "Allow authenticated users" ON public.financials
  FOR ALL USING (auth.role() = 'authenticated');

-- tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id),
  name text NOT NULL,
  responsible_id text,
  status text,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  user_id uuid,
  notes text
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users" ON public.tasks;
CREATE POLICY "Allow authenticated users" ON public.tasks
  FOR ALL USING (auth.role() = 'authenticated');

-- team_users
CREATE TABLE IF NOT EXISTS public.team_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text DEFAULT 'Ingeniero',
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  user_id uuid,
  email text,
  auth_id uuid
);
ALTER TABLE public.team_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users" ON public.team_users;
CREATE POLICY "Allow authenticated users" ON public.team_users
  FOR ALL USING (auth.role() = 'authenticated');
