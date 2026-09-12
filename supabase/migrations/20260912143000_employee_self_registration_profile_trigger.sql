create or replace function public.handle_new_employee_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.employee_profiles (id, name, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(coalesce(new.email, 'employee'), '@', 1)),
    'employee'
  )
  on conflict (id) do update
    set name = excluded.name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_employee_profile on auth.users;
create trigger on_auth_user_created_employee_profile
after insert on auth.users
for each row execute function public.handle_new_employee_profile();
