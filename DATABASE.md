# DATABASE — Company AI Tools Hub (Supabase / Postgres)

This is the authoritative schema. Do not invent columns, tables, or types not listed here. If a feature needs a new column, add it here first, then migrate.

## 1. Tables

```sql
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

-- tool_access: many-to-many, who can see which tool
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
  action        text not null,        -- e.g. 'tool.created', 'access.granted', 'employee.deactivated'
  target        text,                 -- free-text description of what was acted on
  meta          jsonb,
  created_at    timestamptz not null default now()
);
```

## 2. Row Level Security

RLS must be **enabled on every table**, no exceptions:

```sql
alter table profiles enable row level security;
alter table tools enable row level security;
alter table tool_access enable row level security;
alter table audit_logs enable row level security;
```

### profiles
```sql
-- a user can read their own row
create policy "read own profile"
  on profiles for select
  using (auth.uid() = id);

-- a user can update their own row
create policy "update own profile"
  on profiles for update
  using (auth.uid() = id);
```
Admin reads/writes to *other* users' profiles happen only via the admin (service role) client server-side, which bypasses RLS by design — never by adding a broad "admin can read all" RLS policy driven by a client-supplied flag.

### tools
```sql
-- a user can see a tool only if they have a tool_access row for it
create policy "read assigned tools"
  on tools for select
  using (
    exists (
      select 1 from tool_access
      where tool_access.tool_id = tools.id
      and tool_access.user_id = auth.uid()
    )
  );
```
All `insert/update/delete` on `tools` happens through the admin client in server routes — no client-side write policy is defined for regular users.

### tool_access
No client-side policies at all. Every read/write on this table happens through admin-authenticated server routes, because visibility rules for `tools` above already depend on it — regular users never query it directly.

### audit_logs
No client-side policies. Admin-only, read through a server route that verifies `role === 'admin'`.

## 3. Storage Buckets

| Bucket | Contents | Access |
|---|---|---|
| `profile-photos` | employee profile pictures | authenticated upload to own path only (`{user_id}/*`); public read via signed/public URL |
| `tool-images` | card images for tools | upload only via admin server route; public read |

## 4. Naming Conventions

- Tables: lowercase, plural, snake_case
- Columns: snake_case
- Booleans: prefixed `is_`
- Timestamps: suffixed `_at`, always `timestamptz`
- Foreign keys: `{referenced_table_singular}_id`

## 5. Migrations

Every schema change is a new numbered SQL file under `/supabase/migrations/`. Never edit an already-applied migration — write a new one. Record the reasoning for any non-trivial schema change in `DECISIONS.md`.
