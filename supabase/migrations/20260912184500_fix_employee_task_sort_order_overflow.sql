-- Fix task creation on modern browsers: Date.now() exceeds PostgreSQL INTEGER.
-- employee_tasks.sort_order is used for ordering cards, so BIGINT is the correct type.
alter table public.employee_tasks
  alter column sort_order type bigint
  using sort_order::bigint;

create index if not exists employee_tasks_sort_order_idx
  on public.employee_tasks (sort_order, created_at);
