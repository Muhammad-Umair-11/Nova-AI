create type public.app_role as enum ('admin', 'user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role public.app_role) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create policy "read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

alter table public.profiles add column email text;
update public.profiles p set email = u.email from auth.users u where u.id = p.id;

create policy "admin read profiles" on public.profiles for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "admin read conversations" on public.conversations for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "admin delete conversations" on public.conversations for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "admin read messages" on public.messages for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), new.raw_user_meta_data->>'avatar_url', new.email)
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end; $$;

insert into public.user_roles (user_id, role) select id, 'user' from auth.users on conflict do nothing;
insert into public.user_roles (user_id, role) select id, 'admin' from auth.users order by created_at limit 1 on conflict do nothing;