alter table public.employee_profiles
  add column if not exists access_enabled boolean not null default false,
  add column if not exists email text;

create index if not exists employee_profiles_access_idx
  on public.employee_profiles (access_enabled, role);

update public.employee_profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and p.email is null;

create or replace function public.handle_new_employee_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.employee_profiles (id, name, email, role, access_enabled)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(coalesce(new.email, 'employee'), '@', 1)),
    new.email,
    'employee',
    false
  )
  on conflict (id) do update
    set name = excluded.name,
        email = excluded.email;
  return new;
end;
$$;

drop policy if exists "employee tasks assignee read" on public.employee_tasks;
drop policy if exists "employee tasks assignee update" on public.employee_tasks;

create policy "employee tasks approved assignee read"
on public.employee_tasks for select
to authenticated
using (
  assignee_id = (select auth.uid())
  and exists (
    select 1 from public.employee_profiles p
    where p.id = (select auth.uid())
      and p.access_enabled = true
  )
);

create policy "employee tasks approved assignee update"
on public.employee_tasks for update
to authenticated
using (
  assignee_id = (select auth.uid())
  and exists (
    select 1 from public.employee_profiles p
    where p.id = (select auth.uid())
      and p.access_enabled = true
  )
)
with check (
  assignee_id = (select auth.uid())
  and exists (
    select 1 from public.employee_profiles p
    where p.id = (select auth.uid())
      and p.access_enabled = true
  )
);

drop policy if exists "employee task comments read" on public.employee_task_comments;
drop policy if exists "employee task comments write" on public.employee_task_comments;

create policy "employee task comments approved read"
on public.employee_task_comments for select
to authenticated
using (
  (select public.employee_is_admin())
  or exists (
    select 1
    from public.employee_tasks t
    join public.employee_profiles p on p.id = t.assignee_id
    where t.id = employee_task_comments.task_id
      and t.assignee_id = (select auth.uid())
      and p.access_enabled = true
  )
);

create policy "employee task comments approved write"
on public.employee_task_comments for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and (
    (select public.employee_is_admin())
    or exists (
      select 1
      from public.employee_tasks t
      join public.employee_profiles p on p.id = t.assignee_id
      where t.id = employee_task_comments.task_id
        and t.assignee_id = (select auth.uid())
        and p.access_enabled = true
    )
  )
);