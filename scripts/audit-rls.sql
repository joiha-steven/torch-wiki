-- One-time setup for `npm run audit-rls`.
-- Run this in the Supabase SQL editor (the service-role JWT can't run arbitrary
-- SQL over PostgREST, so the audit goes through this SECURITY DEFINER function).
-- It is read-only and locked down to the service_role.

create or replace function public.audit_rls()
returns table (
  table_name     text,
  rls_enabled    boolean,
  policy_count   bigint,
  has_anon_write boolean,
  has_anon_read  boolean
)
language sql
security definer
set search_path = public, pg_catalog
as $$
  select
    c.relname::text                       as table_name,
    c.relrowsecurity                      as rls_enabled,
    count(p.policyname)                    as policy_count,
    coalesce(bool_or(
      p.cmd in ('INSERT','UPDATE','DELETE','ALL')
      and ('anon' = any(p.roles) or 'public' = any(p.roles))
    ), false)                             as has_anon_write,
    coalesce(bool_or(
      p.cmd in ('SELECT','ALL')
      and ('anon' = any(p.roles) or 'public' = any(p.roles))
    ), false)                             as has_anon_read
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  left join pg_policies p on p.schemaname = n.nspname and p.tablename = c.relname
  where n.nspname = 'public' and c.relkind = 'r'
  group by c.relname, c.relrowsecurity
  order by c.relname;
$$;

revoke all on function public.audit_rls() from public;
grant execute on function public.audit_rls() to service_role;
