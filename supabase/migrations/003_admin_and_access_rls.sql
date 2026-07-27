create or replace function public.is_admin() returns boolean language sql security definer set search_path = public as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'); $$;

alter table public.profiles add column if not exists updated_at timestamptz default now();

alter table public.profiles enable row level security;
alter table public.tools enable row level security;
alter table public.tool_access enable row level security;
alter table public.audit_logs enable row level security;

create policy "Admins select all profiles" on public.profiles for select to authenticated using (public.is_admin());
create policy "Admins update all profiles" on public.profiles for update to authenticated using (public.is_admin());
create policy "Users select own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);

create policy "Admins all operations on tools" on public.tools for all to authenticated using (public.is_admin());
create policy "Employees select assigned active tools" on public.tools for select to authenticated using (is_active = true and exists (select 1 from public.tool_access where tool_access.tool_id = tools.id and tool_access.user_id = auth.uid()));

create policy "Admins all operations on tool_access" on public.tool_access for all to authenticated using (public.is_admin());
create policy "Employees select own tool_access" on public.tool_access for select to authenticated using (user_id = auth.uid());

create policy "Admins select audit_logs" on public.audit_logs for select to authenticated using (public.is_admin());
create policy "Admins and users insert audit_logs" on public.audit_logs for insert to authenticated with check (true);
