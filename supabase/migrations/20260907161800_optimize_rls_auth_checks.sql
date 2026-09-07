drop policy if exists "Admins can read leads" on public.leads;
drop policy if exists "Admins can update leads" on public.leads;
drop policy if exists "Admins can delete leads" on public.leads;
drop policy if exists "admin_write_portfolio" on public.portfolio_projects;
drop policy if exists "admin_update_portfolio" on public.portfolio_projects;
drop policy if exists "admin_delete_portfolio" on public.portfolio_projects;

create policy "Admins can read leads"
on public.leads
for select
to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins can update leads"
on public.leads
for update
to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins can delete leads"
on public.leads
for delete
to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "admin_write_portfolio"
on public.portfolio_projects
for insert
to authenticated
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "admin_update_portfolio"
on public.portfolio_projects
for update
to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "admin_delete_portfolio"
on public.portfolio_projects
for delete
to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
