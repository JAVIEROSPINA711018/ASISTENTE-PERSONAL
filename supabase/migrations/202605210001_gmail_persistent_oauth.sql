create table if not exists public.gmail_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  refresh_token text not null,
  access_token text,
  expires_at timestamptz,
  scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gmail_oauth_states (
  state text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  app_origin text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes')
);

alter table public.gmail_connections enable row level security;
alter table public.gmail_oauth_states enable row level security;

drop policy if exists "Users can read their gmail connection" on public.gmail_connections;
create policy "Users can read their gmail connection"
on public.gmail_connections for select
using (auth.uid() = user_id);

drop policy if exists "Users can delete their gmail connection" on public.gmail_connections;
create policy "Users can delete their gmail connection"
on public.gmail_connections for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read their gmail oauth state" on public.gmail_oauth_states;
create policy "Users can read their gmail oauth state"
on public.gmail_oauth_states for select
using (auth.uid() = user_id);

drop index if exists gmail_oauth_states_expires_at_idx;
create index gmail_oauth_states_expires_at_idx on public.gmail_oauth_states(expires_at);
