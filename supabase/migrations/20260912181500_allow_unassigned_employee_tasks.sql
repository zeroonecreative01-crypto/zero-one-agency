alter table public.employee_tasks
  alter column assignee_id drop not null;

-- Unassigned cards are visible only to admins. Employees continue to see
-- only tasks explicitly assigned to their own user id through the existing RLS policy.
