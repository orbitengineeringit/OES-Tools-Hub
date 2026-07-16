-- Migration: 001_initial_schema
-- Creates the four core tables and enables RLS on each.
-- See DATABASE.md for the authoritative schema reference.

-- profiles: one row per user, mirrors auth.users
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  photo_url     text,
  department    text,
  designation   text,
  bio           text,
  role          text not null default 'employee' check (role in ('admin', 'employee')),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- tools: one row per published tool/link
create table tools (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  url           text not null,
  image_url     text,
  category      text,
  created_by    uuid references profiles(id),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- tool_access: many-to-many, which employee can see which tool
create table tool_access (
  id            uuid primary key default gen_random_uuid(),
  tool_id       uuid not null references tools(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  granted_by    uuid references profiles(id),
  granted_at    timestamptz not null default now(),
  unique (tool_id, user_id)
);

-- audit_logs: append-only record of admin actions
create table audit_logs (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid references profiles(id),
  action        text not null,
  target        text,
  meta          jsonb,
  created_at    timestamptz not null default now()
);

-- Enable RLS on every table (second wall of defense after server-side role checks)
alter table profiles   enable row level security;
alter table tools      enable row level security;
alter table tool_access enable row level security;
alter table audit_logs enable row level security;

-- profiles: users can read and update only their own row
create policy "read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "update own profile"
  on profiles for update
  using (auth.uid() = id);

-- tools: a user can see a tool only if they have a tool_access row
create policy "read assigned tools"
  on tools for select
  using (
    exists (
      select 1 from tool_access
      where tool_access.tool_id = tools.id
      and   tool_access.user_id = auth.uid()
    )
  );

-- tool_access, audit_logs: no client-side policies — all reads/writes go through
-- the service-role admin client in server Route Handlers, which bypasses RLS.
