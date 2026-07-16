-- Migration 002: Add B-Tree indexes for foreign keys, filtered columns, and sort expressions.

-- Speed up GET /api/tools/mine and GET /api/admin/access lookups by user_id
create index if not exists idx_tool_access_user_id on tool_access(user_id);
create index if not exists idx_tool_access_granted_by on tool_access(granted_by);

-- Speed up tools table joins and creation ordering
create index if not exists idx_tools_created_by on tools(created_by);
create index if not exists idx_tools_is_active on tools(is_active);
create index if not exists idx_tools_created_at_desc on tools(created_at desc);

-- Speed up audit log reverse-chronological pagination and actor joins
create index if not exists idx_audit_logs_created_at_desc on audit_logs(created_at desc);
create index if not exists idx_audit_logs_actor_id on audit_logs(actor_id);

-- Speed up employee profile ordering by full_name
create index if not exists idx_profiles_full_name on profiles(full_name);
