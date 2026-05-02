-- NBA Ultimate Draft Supabase foundation
-- Run this in the Supabase SQL editor for your project.

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_token_balances (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token_balance integer not null default 0 check (token_balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_rogue_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  run_data jsonb not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, status)
);

alter table public.user_profiles enable row level security;
alter table public.user_token_balances enable row level security;
alter table public.saved_rogue_runs enable row level security;

drop policy if exists "Users can select own profile" on public.user_profiles;
create policy "Users can select own profile"
on public.user_profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "Users can insert own profile" on public.user_profiles;
create policy "Users can insert own profile"
on public.user_profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Users can update own profile" on public.user_profiles;
create policy "Users can update own profile"
on public.user_profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, username)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do update
  set
    username = coalesce(public.user_profiles.username, excluded.username),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

insert into public.user_profiles (id, username)
select id, split_part(email, '@', 1)
from auth.users
on conflict (id) do nothing;

drop policy if exists "Users can select own token balance" on public.user_token_balances;
create policy "Users can select own token balance"
on public.user_token_balances for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own token balance" on public.user_token_balances;
create policy "Users can insert own token balance"
on public.user_token_balances for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own token balance" on public.user_token_balances;
create policy "Users can update own token balance"
on public.user_token_balances for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create or replace function public.handle_new_user_token_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_token_balances (user_id, token_balance)
  values (new.id, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_token_balance on auth.users;
create trigger on_auth_user_created_token_balance
after insert on auth.users
for each row execute function public.handle_new_user_token_balance();

insert into public.user_token_balances (user_id, token_balance)
select id, 0
from auth.users
on conflict (user_id) do nothing;

create or replace function public.sync_user_token_balance(next_token_balance integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.user_token_balances (user_id, token_balance, updated_at)
  values (auth.uid(), greatest(0, next_token_balance), now())
  on conflict (user_id) do update
  set
    token_balance = excluded.token_balance,
    updated_at = now();
end;
$$;

grant execute on function public.sync_user_token_balance(integer) to authenticated;

create or replace function public.sync_active_rogue_run(next_run_data jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.saved_rogue_runs (user_id, run_data, status, updated_at)
  values (auth.uid(), next_run_data, 'active', now())
  on conflict (user_id, status) do update
  set
    run_data = excluded.run_data,
    updated_at = now();
end;
$$;

grant execute on function public.sync_active_rogue_run(jsonb) to authenticated;

drop policy if exists "Users can select own saved runs" on public.saved_rogue_runs;
create policy "Users can select own saved runs"
on public.saved_rogue_runs for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own saved runs" on public.saved_rogue_runs;
create policy "Users can insert own saved runs"
on public.saved_rogue_runs for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own saved runs" on public.saved_rogue_runs;
create policy "Users can update own saved runs"
on public.saved_rogue_runs for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own saved runs" on public.saved_rogue_runs;
create policy "Users can delete own saved runs"
on public.saved_rogue_runs for delete
to authenticated
using (user_id = auth.uid());
