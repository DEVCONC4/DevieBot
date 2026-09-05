-- Migration 002 — bring an existing database in line with types/database.ts
--
-- The checked-in schema.sql had drifted from what the app actually reads and
-- writes. This migration adds everything that was missing and removes what is
-- unused. It is idempotent: safe to run against a database that already has
-- these changes.
--
-- Covers:
--   1. task_status gains 'backlog'
--   2. tasks gains task_number (auto-numbered) and assigned_to
--   3. task_assignments is dropped (never queried; assignees are text)
--   4. members gains telegram_id / telegram_username / role, loses color /
--      avatar_url, and its id becomes a serial integer
--   5. supporting indexes
--
-- Run in the Supabase SQL editor.

-- ============================================================
-- 1. task_status: add 'backlog'
-- ============================================================
-- Overdue tasks are demoted to 'backlog' (see moveOverdueTasks in the sidebar)
-- and the standup has a backlog filter.
-- Note: Postgres forbids *using* a newly added enum value in the same
-- transaction that adds it, so nothing below may reference 'backlog'.
alter type task_status add value if not exists 'backlog' before 'todo';

-- ============================================================
-- 2. tasks: task_number + assigned_to
-- ============================================================
create sequence if not exists task_number_seq;

alter table tasks
  add column if not exists task_number integer,
  add column if not exists assigned_to text;

-- Backfill existing rows in creation order, then hand numbering to the sequence.
update tasks t
set task_number = n.rn
from (
  select id, row_number() over (order by created_at, id) as rn
  from tasks
  where task_number is null
) n
where t.id = n.id
  and t.task_number is null;

select setval(
  'task_number_seq',
  coalesce((select max(task_number) from tasks), 0) + 1,
  false
);

alter table tasks
  alter column task_number set default nextval('task_number_seq');

alter sequence task_number_seq owned by tasks.task_number;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tasks_task_number_key'
  ) then
    alter table tasks add constraint tasks_task_number_key unique (task_number);
  end if;
end $$;

create index if not exists tasks_status_idx   on tasks (status);
create index if not exists tasks_due_date_idx on tasks (due_date);
create index if not exists tasks_camp_id_idx  on tasks (camp_id);

-- ============================================================
-- 3. Drop task_assignments
-- ============================================================
-- Assignees live in tasks.assigned_to as free text and are resolved against
-- members at read time. This junction table was never read or written.
drop table if exists task_assignments;

-- ============================================================
-- 4. members: reshape to the Telegram-backed model
-- ============================================================
alter table members
  add column if not exists telegram_id text,
  add column if not exists telegram_username text,
  add column if not exists role text;

-- name is populated from Telegram and may be absent for a raw registration.
alter table members alter column name drop not null;

-- color is derived in the client (memberColor in lib/member-utils.ts) and
-- avatar_url was never read.
alter table members
  drop column if exists color,
  drop column if exists avatar_url;

-- The app keys members by telegram_id / name, never by the primary key
-- (task_assignments was the only table that referenced it, dropped above), so
-- the uuid id can be replaced with the serial integer the types expect.
do $$
begin
  if (
    select data_type from information_schema.columns
    where table_schema = 'public' and table_name = 'members' and column_name = 'id'
  ) = 'uuid' then
    alter table members drop constraint if exists members_pkey;
    alter table members drop column id;
    alter table members add column id serial primary key;
  end if;
end $$;

-- telegram_id identifies a member; syncMember upserts on it.
do $$
begin
  if exists (
    select telegram_id from members
    where telegram_id is not null
    group by telegram_id having count(*) > 1
  ) then
    raise notice 'members.telegram_id has duplicates — resolve them, then: create unique index members_telegram_id_key on members (telegram_id);';
  else
    create unique index if not exists members_telegram_id_key on members (telegram_id);
  end if;
end $$;

create index if not exists members_telegram_username_idx on members (lower(telegram_username));
create index if not exists members_name_idx              on members (lower(name));

-- ============================================================
-- 5. task_comments lookup
-- ============================================================
create index if not exists task_comments_task_id_idx on task_comments (task_id);
