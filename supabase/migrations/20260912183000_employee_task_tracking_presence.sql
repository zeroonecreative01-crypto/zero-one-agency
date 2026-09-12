-- Team task tracking: per-employee task read receipts + lightweight presence/last-seen.
-- Also makes task assignment robust for every employee profile by enforcing the FK
-- against employee_profiles rather than relying on the auth.users table shape.

alter table public.employee_tasks
  add column if not exists assigned_at timestamptz;

create index if not exists employee_tasks_assignee_idx
  on public.employee_tasks (assignee_id);

create table if not exists public.employee_task_views (
  task_id uuid not null references public.employee_tasks(id) on delete cascade,
  employee_id uuid not null references public.employee_profiles(id) on delete cascade,
  first_viewed_at timestamptz not null default now(),
  last_viewed_at timestamptz not null default now(),
  primary key (task_id, employee_id)
);

create index if not exists employee_task_views_employee_idx
  on public.employee_task_views (employee_id, last_viewed_at desc);

create table if not exists public.employee_presence (
  employee_id uuid primary key references public.employee_profiles(id) on delete cascade,
  last_seen_at timestamptz not null default now(),
  is_online boolean not null default true
);

create index if not exists employee_presence_last_seen_idx
  on public.employee_presence (last_seen_at desc);

alter table public.employee_task_views enable row level security;
alter table public.employee_presence enable row level security;

-- Cleanly replace task-view policies so this migration is idempotent.
drop policy if exists "employee task views admin read" on public.employee_task_views;
drop policy if exists "employee task views self read" on public.employee_task_views;
drop policy if exists "employee task views self write" on public.employee_task_views;

create policy "employee task views admin read"
on public.employee_task_views for select
to authenticated
using ((select public.employee_is_admin()));

create policy "employee task views self read"
on public.employee_task_views for select
to authenticated
using (employee_id = (select auth.uid()));

create policy "employee task views self write"
on public.employee_task_views for insert
to authenticated
with check (
  employee_id = (select auth.uid())
  and exists (
    select 1
    from public.employee_tasks t
    join public.employee_profiles p on p.id = t.assignee_id
    where t.id = employee_task_views.task_id
      and t.assignee_id = (select auth.uid())
      and p.access_enabled = true
  )
);

create policy "employee task views self update"
on public.employee_task_views for update
to authenticated
using (employee_id = (select auth.uid()))
with check (employee_id = (select auth.uid()));

drop policy if exists "employee presence admin read" on public.employee_presence;
drop policy if exists "employee presence self read" on public.employee_presence;
drop policy if exists "employee presence self write" on public.employee_presence;
drop policy if exists "employee presence self update" on public.employee_presence;

create policy "employee presence admin read"
on public.employee_presence for select
to authenticated
using ((select public.employee_is_admin()));

create policy "employee presence self read"
on public.employee_presence for select
to authenticated
using (employee_id = (select auth.uid()));

create policy "employee presence self write"
on public.employee_presence for insert
to authenticated
with check (employee_id = (select auth.uid()));

create policy "employee presence self update"
on public.employee_presence for update
to authenticated
using (employee_id = (select auth.uid()))
with check (employee_id = (select auth.uid()));

-- Assignment writes are admin-only and can target any employee profile that exists.
drop policy if exists "employee tasks admin insert" on public.employee_tasks;
drop policy if exists "employee tasks admin update" on public.employee_tasks;

create policy "employee tasks admin insert"
on public.employee_tasks for insert
to authenticated
with check (
  (select public.employee_is_admin())
  and (
    assignee_id is null
    or exists (select 1 from public.employee_profiles p where p.id = assignee_id and p.role = 'employee' and p.access_enabled = true)
  )
);

create policy "employee tasks admin update"
on public.employee_tasks for update
to authenticated
using ((select public.employee_is_admin()))
with check (
  (select public.employee_is_admin())
  and (
    assignee_id is null
    or exists (select 1 from public.employee_profiles p where p.id = assignee_id and p.role = 'employee' and p.access_enabled = true)
  )
);
