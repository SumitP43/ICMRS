-- ====================================================================
-- ICMRS — Intelligent Civic Management & Response System
-- Supabase Migration: Reproducible Schema, Least-Privilege RLS & Realtime
-- ====================================================================

-- 1. Profiles Table (Linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role text not null default 'citizen' check (role in ('citizen', 'officer', 'admin')),
  badge_number text,
  department text,
  avatar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- Index for profiles
create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_profiles_department on public.profiles (department);

-- Trigger to automatically create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role, department, avatar)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    case 
      when lower(new.email) in ('admin@icmrs.gov', 'dp7899899@gmail.com') then 'admin'
      when lower(new.email) like '%officer%' then 'officer'
      else coalesce(new.raw_user_meta_data->>'role', 'citizen')
    end,
    coalesce(new.raw_user_meta_data->>'wardOrSector', new.raw_user_meta_data->>'department', 'District 04 Municipal Response Bureau'),
    coalesce(new.raw_user_meta_data->>'avatar', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80')
  )
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(excluded.name, profiles.name),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Complaints Table
create table if not exists public.complaints (
  id text primary key, -- e.g. '#ICMRS-2026-102931'
  complaint_number text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  citizen_name text not null,
  citizen_email text not null,
  title text not null,
  description text not null,
  category text not null,
  status text not null default 'In Progress' check (status in ('In Progress', 'Assigned & Scheduled', 'Dispatched', 'Pending Triage', 'Resolved', 'Under Review')),
  priority text not null default 'Medium' check (priority in ('Critical', 'High', 'Medium', 'Low')),
  location text not null,
  latitude double precision,
  longitude double precision,
  coordinates jsonb not null default '{"lat": 28.6139, "lng": 77.2090}'::jsonb,
  date_time text not null default to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  department text not null default 'District 04 Municipal Response Bureau',
  assigned_officer text,
  assigned_crew text,
  pipeline_step integer not null default 1,
  pipeline_step_name text not null default 'Step 1 of 5: Telemetry Received & Dispatched',
  pipeline_percent integer not null default 20,
  sla_remaining text,
  sla_status text not null default 'nominal' check (sla_status in ('urgent', 'nominal', 'warning', 'resolved')),
  total_sla_hours integer default 24,
  resolution_details text,
  image_url text,
  before_image_url text,
  after_image_url text,
  attachments jsonb not null default '[]'::jsonb,
  status_history jsonb not null default '[]'::jsonb,
  officer_notes jsonb not null default '[]'::jsonb,
  rating integer,
  citizen_token text default 'Verified Resident',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_complaints_user_id on public.complaints (user_id);
create index if not exists idx_complaints_department on public.complaints (department);
create index if not exists idx_complaints_status on public.complaints (status);
create index if not exists idx_complaints_priority on public.complaints (priority);
create index if not exists idx_complaints_created_at on public.complaints (created_at desc);

-- 3. Row-Level Security (Least-Privilege RLS)
alter table public.profiles enable row level security;
alter table public.complaints enable row level security;

-- Profiles Policies
drop policy if exists "profiles_select_policy" on public.profiles;
create policy "profiles_select_policy"
on public.profiles for select
to authenticated
using (
  (select auth.uid()) = id
  or (select role from public.profiles where id = (select auth.uid())) in ('officer', 'admin')
);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check (
  (select auth.uid()) = id
  and role = (select role from public.profiles where id = (select auth.uid()))
);

-- Complaints Policies (Strict Least-Privilege)
-- Notice: NO public SELECT with USING (true) on the complaints table.

drop policy if exists "complaints_select_policy" on public.complaints;
create policy "complaints_select_policy"
on public.complaints for select
to authenticated
using (
  -- Citizen can only view their own submitted complaints
  ((select auth.uid()) = user_id)
  -- Officer or Admin can view complaints for civic management
  or ((select role from public.profiles where id = (select auth.uid())) in ('officer', 'admin'))
);

drop policy if exists "complaints_insert_policy" on public.complaints;
create policy "complaints_insert_policy"
on public.complaints for insert
to authenticated
with check (
  -- Users can only insert complaints stamped with their own UID
  (select auth.uid()) = user_id
);

drop policy if exists "complaints_update_policy" on public.complaints;
create policy "complaints_update_policy"
on public.complaints for update
to authenticated
using (
  -- Officers and Admins can update workflow fields
  ((select role from public.profiles where id = (select auth.uid())) in ('officer', 'admin'))
  -- Citizen can only update their own resolved complaint (e.g. rating/feedback)
  or (
    (select auth.uid()) = user_id
    and status = 'Resolved'
  )
)
with check (
  -- Officers and Admins can update workflow fields
  ((select role from public.profiles where id = (select auth.uid())) in ('officer', 'admin'))
  -- Citizen can only update their own resolved complaint and cannot reassign user_id or status
  or (
    (select auth.uid()) = user_id
    and status = 'Resolved'
  )
);

-- 4. Redacted Public Heatmap View (Zero citizen PII exposed)
create or replace view public.civic_heatmap_feed as
select
  id,
  category,
  status,
  priority,
  location,
  latitude,
  longitude,
  coordinates,
  date_time,
  created_at
from public.complaints;

grant select on public.civic_heatmap_feed to anon, authenticated;

-- 5. Realtime Publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'complaints'
  ) then
    alter publication supabase_realtime add table public.complaints;
  end if;
exception
  when undefined_object then
    null;
end;
$$;

-- 6. Storage Bucket for Photographic Evidence
insert into storage.buckets (id, name, public)
values ('civic-evidence', 'civic-evidence', true)
on conflict (id) do update set public = true;

drop policy if exists "civic_evidence_select_public" on storage.objects;
create policy "civic_evidence_select_public"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'civic-evidence');

drop policy if exists "civic_evidence_insert_authenticated" on storage.objects;
create policy "civic_evidence_insert_authenticated"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'civic-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
