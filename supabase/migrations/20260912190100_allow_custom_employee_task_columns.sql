-- Board columns are user-defined, so task status must not be limited to the original four values.
alter table public.employee_tasks
  drop constraint if exists employee_tasks_status_check;
