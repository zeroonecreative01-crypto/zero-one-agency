-- Persistent, admin-controlled task board cards.
create table if not exists public.employee_task_boards (
  id text primary key,
  name text not null,
  sort_order bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.employee_tasks add column if not exists board_id text;

insert into public.employee_task_boards(id,name,sort_order)
values ('client_requests','Client Requests',0),('in_progress','In Progress',1),('review','Review',2),('completed','Completed',3)
on conflict (id) do nothing;

update public.employee_tasks set board_id=status where board_id is null;
alter table public.employee_tasks alter column board_id set default 'client_requests';
alter table public.employee_tasks drop constraint if exists employee_tasks_status_check;
alter table public.employee_tasks drop constraint if exists employee_tasks_board_id_fkey;
alter table public.employee_tasks add constraint employee_tasks_board_id_fkey foreign key(board_id) references public.employee_task_boards(id) on delete set null;
create index if not exists employee_tasks_board_idx on public.employee_tasks(board_id,sort_order);

alter table public.employee_task_boards enable row level security;
drop policy if exists "employee task boards authenticated read" on public.employee_task_boards;
drop policy if exists "employee task boards admin all" on public.employee_task_boards;
create policy "employee task boards authenticated read" on public.employee_task_boards for select to authenticated using (true);
create policy "employee task boards admin all" on public.employee_task_boards for all to authenticated using ((select public.employee_is_admin())) with check ((select public.employee_is_admin()));
