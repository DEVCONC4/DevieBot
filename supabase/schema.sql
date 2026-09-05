-- ============================================================
-- DEVIE DASHBOARD — Supabase Schema
-- Run this in your Supabase SQL editor to bootstrap a fresh project.
--
-- This file is the canonical schema and must stay in sync with
-- types/database.ts. For an existing database, apply the numbered
-- files in supabase/migrations/ instead of re-running this.
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
create type task_priority as enum ('low', 'medium', 'high', 'urgent');
create type task_status as enum ('backlog', 'todo', 'in_progress', 'in_review', 'blocked', 'done');
create type camp_status as enum ('active', 'completed', 'archived', 'paused');

-- ============================================================
-- TAGS
-- ============================================================
create table tags (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  color text not null default '#6366f1',
  created_at timestamptz default now()
);

-- ============================================================
-- CODE CAMPS
-- Reserved for per-camp boards. The app currently creates every task with
-- camp_id = null (the "General Board"); the table and the foreign key are
-- kept so camp-scoped boards can be switched on without a migration.
-- ============================================================
create table code_camps (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  venue text,           -- e.g. "Bukidnon State University"
  contact_person text,  -- e.g. "Zhi (chapter contact)"
  status camp_status not null default 'active',
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  start_date date,
  end_date date,
  resources jsonb default '[]'::jsonb, -- [{title, url}]
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- TASKS
-- ============================================================
-- Human-readable task codes: task_number 1 renders as "T-001".
-- See taskCode() in types/database.ts. Nullable so rows created before the
-- sequence existed still load.
create sequence if not exists task_number_seq;

create table tasks (
  id uuid primary key default uuid_generate_v4(),
  task_number integer unique default nextval('task_number_seq'),
  title text not null,
  description text,
  priority task_priority not null default 'medium',
  status task_status not null default 'todo',
  due_date date,
  order_index integer not null default 0,
  camp_id uuid references code_camps(id) on delete cascade,
  -- null camp_id = general board task
  assigned_to text,  -- member name as free text, resolved against members at read time
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter sequence task_number_seq owned by tasks.task_number;

create index tasks_status_idx   on tasks (status);
create index tasks_due_date_idx on tasks (due_date);
create index tasks_camp_id_idx  on tasks (camp_id);

-- ============================================================
-- TASK TAGS (junction)
-- ============================================================
create table task_tags (
  task_id uuid references tasks(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (task_id, tag_id)
);

-- ============================================================
-- TASK COMMENTS
-- ============================================================
create table task_comments (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index task_comments_task_id_idx on task_comments (task_id);

-- ============================================================
-- MEMBERS
-- Auto-registered from Telegram (syncMember in the webhook route) or added
-- manually from the Team page.
-- ============================================================
create table members (
  id serial primary key,
  telegram_id text unique,
  telegram_username text,
  name text,   -- first_name + last_name from Telegram, or manually entered
  role text,   -- free-form, e.g. 'cohort4', 'cohort3', 'admin'
  created_at timestamptz default now()
);

-- Assignee lookup is case-insensitive on name and username.
create index members_telegram_username_idx on members (lower(telegram_username));
create index members_name_idx              on members (lower(name));

-- ============================================================
-- TELEGRAM CONFIG
-- Fallback for TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID; env vars win.
-- ============================================================
create table telegram_config (
  id uuid primary key default uuid_generate_v4(),
  chat_id text,
  bot_token text,
  standup_time text default '09:00', -- HH:MM
  standup_enabled boolean default true,
  standup_message_template text,
  updated_at timestamptz default now()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  action text not null,
  status text not null check (status in ('ok', 'error', 'info')),
  message text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Insert a default row
insert into telegram_config (id) values (uuid_generate_v4());

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at before update on tasks
  for each row execute function update_updated_at();

create trigger code_camps_updated_at before update on code_camps
  for each row execute function update_updated_at();

create trigger task_comments_updated_at before update on task_comments
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table tasks enable row level security;
alter table code_camps enable row level security;
alter table tags enable row level security;
alter table task_tags enable row level security;
alter table task_comments enable row level security;
alter table members enable row level security;
alter table telegram_config enable row level security;
alter table audit_logs enable row level security;

-- Allow authenticated users (admin) full access to everything
create policy "Authenticated full access" on tasks
  for all to authenticated using (true) with check (true);

create policy "Authenticated full access" on code_camps
  for all to authenticated using (true) with check (true);

create policy "Authenticated full access" on tags
  for all to authenticated using (true) with check (true);

create policy "Authenticated full access" on task_tags
  for all to authenticated using (true) with check (true);

create policy "Authenticated full access" on task_comments
  for all to authenticated using (true) with check (true);

create policy "Authenticated full access" on members
  for all to authenticated using (true) with check (true);

create policy "Authenticated full access" on telegram_config
  for all to authenticated using (true) with check (true);

create policy "Authenticated full access" on audit_logs
  for all to authenticated using (true) with check (true);

-- Service role can access everything (for API routes/bot)
create policy "Service role full access" on tasks
  for all to service_role using (true) with check (true);

create policy "Service role full access" on code_camps
  for all to service_role using (true) with check (true);

create policy "Service role full access" on tags
  for all to service_role using (true) with check (true);

create policy "Service role full access" on task_tags
  for all to service_role using (true) with check (true);

create policy "Service role full access" on task_comments
  for all to service_role using (true) with check (true);

create policy "Service role full access" on members
  for all to service_role using (true) with check (true);

create policy "Service role full access" on telegram_config
  for all to service_role using (true) with check (true);

create policy "Service role full access" on audit_logs
  for all to service_role using (true) with check (true);

-- ============================================================
-- SEED DATA (optional starter tags)
-- ============================================================
insert into tags (name, color) values
  ('bug', '#ef4444'),
  ('feature', '#6366f1'),
  ('documentation', '#f59e0b'),
  ('design', '#ec4899'),
  ('backend', '#10b981'),
  ('frontend', '#3b82f6'),
  ('devops', '#8b5cf6'),
  ('urgent', '#f97316');
