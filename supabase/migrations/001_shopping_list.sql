-- =============================================================
-- Shopping List App — Migration 001
-- Runs automatically on first `docker compose up` via
-- /docker-entrypoint-initdb.d inside supabase/postgres.
-- =============================================================

-- Grant Supabase roles access to the public schema
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables    in schema public to anon, authenticated, service_role;
grant all on all routines  in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on routines  to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on sequences to anon, authenticated, service_role;

-- ── 1. TABLE DEFINITIONS ──────────────────────────────────────────────────────

-- shopping_lists
create table if not exists shopping_lists (
  id         uuid default gen_random_uuid() primary key,
  owner_id   uuid references auth.users(id) on delete cascade not null,
  name       text not null,
  created_at timestamptz default now() not null
);

-- list_shares
create table if not exists list_shares (
  id                uuid default gen_random_uuid() primary key,
  list_id           uuid references shopping_lists(id) on delete cascade not null,
  shared_with_email text not null,
  shared_with_id    uuid references auth.users(id) on delete cascade,
  created_at        timestamptz default now() not null,
  unique(list_id, shared_with_email)
);

-- categories (per list)
create table if not exists categories (
  id       uuid default gen_random_uuid() primary key,
  list_id  uuid references shopping_lists(id) on delete cascade not null,
  name     text not null,
  color    text default '#6366f1',
  position int  default 0
);

-- items
create table if not exists items (
  id          uuid default gen_random_uuid() primary key,
  list_id     uuid references shopping_lists(id) on delete cascade not null,
  category_id uuid references categories(id) on delete set null,
  name        text not null,
  quantity    numeric default 1,
  unit        text default '',
  checked     boolean default false,
  created_at  timestamptz default now() not null
);

-- ── 2. ROW LEVEL SECURITY (RLS) ──────────────────────────────────────────────

alter table shopping_lists enable row level security;
alter table list_shares    enable row level security;
alter table categories     enable row level security;
alter table items          enable row level security;

-- ── 3. POLICIES ─────────────────────────────────────────────────────────────

-- shopping_lists policies
create policy "Owner full access" on shopping_lists
  for all using (auth.uid() = owner_id);

create policy "Shared users can read" on shopping_lists
  for select using (
    exists (
      select 1 from list_shares
      where list_shares.list_id = shopping_lists.id
        and list_shares.shared_with_id = auth.uid()
    )
  );

-- list_shares policies
create policy "Owner manages shares" on list_shares
  for all using (
    exists (
      select 1 from shopping_lists
      where shopping_lists.id = list_shares.list_id
        and shopping_lists.owner_id = auth.uid()
    )
  );

create policy "Shared user reads own share" on list_shares
  for select using (shared_with_id = auth.uid());

-- categories policies
create policy "List members manage categories" on categories
  for all using (
    exists (
      select 1 from shopping_lists
      where shopping_lists.id = categories.list_id
        and (
          shopping_lists.owner_id = auth.uid()
          or exists (
            select 1 from list_shares
            where list_shares.list_id = categories.list_id
              and list_shares.shared_with_id = auth.uid()
          )
        )
    )
  );

-- items policies
create policy "List members manage items" on items
  for all using (
    exists (
      select 1 from shopping_lists
      where shopping_lists.id = items.list_id
        and (
          shopping_lists.owner_id = auth.uid()
          or exists (
            select 1 from list_shares
            where list_shares.list_id = items.list_id
              and list_shares.shared_with_id = auth.uid()
          )
        )
    )
  );

-- ── 4. REALTIME PUBLICATION ──────────────────────────────────────────────────

-- Enable realtime for live collaboration
alter publication supabase_realtime add table items;
