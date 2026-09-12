-- Employee completion + source link.
alter table public.employee_tasks
  add column if not exists is_completed boolean not null default false,
  add column if not exists completed_at timestamptz,
  add column if not exists completed_by uuid references public.employee_profiles(id) on delete set null,
  add column if not exists source_url text;

create or replace function public.employee_set_task_completion(
  p_task_id uuid,
  p_completed boolean,
  p_source_url text default null
)
returns public.employee_tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.employee_tasks;
begin
  update public.employee_tasks
  set is_completed = p_completed,
      completed_at = case when p_completed then now() else null end,
      completed_by = case when p_completed then auth.uid() else null end,
      source_url = nullif(trim(p_source_url), '')
  where id = p_task_id
    and assignee_id = auth.uid();

  if not found then
    raise exception 'Task not found or not assigned to current employee';
  end if;

  select * into result from public.employee_tasks where id = p_task_id;
  return result;
end;
$$;

revoke all on function public.employee_set_task_completion(uuid, boolean, text) from public;
grant execute on function public.employee_set_task_completion(uuid, boolean, text) to authenticated;
