-- NBA Ultimate Draft Supabase foundation
-- Run this in the Supabase SQL editor for your project.

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_token_balances (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token_balance integer not null default 0 check (token_balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.token_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_type text not null,
  amount integer not null check (amount <> 0),
  balance_after integer not null check (balance_after >= 0),
  source text,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.token_pack_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  token_amount integer not null check (token_amount > 0),
  usd_cents integer not null check (usd_cents > 0),
  currency text not null default 'usd',
  stripe_price_id text unique,
  active boolean not null default false,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.token_purchase_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_pack_product_id uuid references public.token_pack_products(id) on delete set null,
  token_pack_slug text,
  token_amount integer not null check (token_amount > 0),
  usd_cents integer not null check (usd_cents >= 0),
  currency text not null default 'usd',
  status text not null default 'created'
    check (status in ('created', 'pending', 'paid', 'credited', 'failed', 'refunded', 'canceled')),
  payment_provider text not null default 'stripe',
  provider_checkout_session_id text unique,
  provider_payment_intent_id text unique,
  provider_customer_id text,
  credited_transaction_id uuid references public.token_transactions(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists token_transactions_user_created_at_idx
on public.token_transactions (user_id, created_at desc);

create index if not exists token_purchase_records_user_created_at_idx
on public.token_purchase_records (user_id, created_at desc);

create index if not exists token_purchase_records_status_idx
on public.token_purchase_records (status);

insert into public.token_pack_products (
  slug,
  name,
  description,
  token_amount,
  usd_cents,
  currency,
  stripe_price_id,
  active,
  sort_order,
  metadata
)
values
  (
    'rookie-token-pack',
    'Rookie Token Pack',
    'A small token boost for early Rogue upgrades and utility items.',
    10000,
    199,
    'usd',
    'price_1TUApeF1dYAmNp1wRnxzWs1e',
    true,
    10,
    '{"stripe_setup_required": true}'::jsonb
  ),
  (
    'rotation-token-pack',
    'Rotation Token Pack',
    'Enough tokens to unlock a meaningful permanent Rogue upgrade.',
    30000,
    499,
    'usd',
    'price_1TUAsAF1dYAmNp1wDRXlxcgJ',
    true,
    20,
    '{"stripe_setup_required": true}'::jsonb
  ),
  (
    'playoff-token-pack',
    'Playoff Token Pack',
    'A strong pack for starter upgrades, coach recruitment, and run utility.',
    75000,
    999,
    'usd',
    'price_1TUAspF1dYAmNp1wr2v1YCup',
    true,
    30,
    '{"stripe_setup_required": true, "popular": true}'::jsonb
  ),
  (
    'finals-token-pack',
    'Finals Token Pack',
    'A premium pack for multiple permanent upgrades and future Rogue planning.',
    175000,
    1999,
    'usd',
    'price_1TUAtSF1dYAmNp1w7UlwjxL3',
    true,
    40,
    '{"stripe_setup_required": true}'::jsonb
  ),
  (
    'galaxy-token-pack',
    'Galaxy Token Pack',
    'A high-end pack that meaningfully accelerates the long-term Galaxy chase.',
    500000,
    4999,
    'usd',
    'price_1TUAu5F1dYAmNp1wv6Je2vel',
    true,
    50,
    '{"stripe_setup_required": true}'::jsonb
  )
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  token_amount = excluded.token_amount,
  usd_cents = excluded.usd_cents,
  currency = excluded.currency,
  stripe_price_id = excluded.stripe_price_id,
  active = excluded.active,
  sort_order = excluded.sort_order,
  metadata = public.token_pack_products.metadata || excluded.metadata,
  updated_at = now();

create table if not exists public.saved_rogue_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
  username text,
  run_data jsonb not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, status)
);

alter table public.user_profiles
add column if not exists email text;

alter table public.saved_rogue_runs
add column if not exists user_email text;

alter table public.saved_rogue_runs
add column if not exists username text;

alter table public.saved_rogue_runs
add column if not exists current_floor integer
generated always as (((run_data ->> 'floorIndex')::integer + 1)) stored;

alter table public.saved_rogue_runs
add column if not exists run_stage text
generated always as (run_data ->> 'stage') stored;

alter table public.user_profiles enable row level security;
alter table public.user_token_balances enable row level security;
alter table public.token_transactions enable row level security;
alter table public.token_pack_products enable row level security;
alter table public.token_purchase_records enable row level security;
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
  insert into public.user_profiles (id, email, username)
  values (new.id, new.email, split_part(new.email, '@', 1))
  on conflict (id) do update
  set
    email = excluded.email,
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

update public.user_profiles profile
set
  email = auth_user.email,
  username = coalesce(profile.username, split_part(auth_user.email, '@', 1)),
  updated_at = now()
from auth.users auth_user
where profile.id = auth_user.id;

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

drop policy if exists "Users can select own token transactions" on public.token_transactions;
create policy "Users can select own token transactions"
on public.token_transactions for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Anyone can view active token packs" on public.token_pack_products;
create policy "Anyone can view active token packs"
on public.token_pack_products for select
to anon, authenticated
using (active = true);

drop policy if exists "Users can select own token purchases" on public.token_purchase_records;
create policy "Users can select own token purchases"
on public.token_purchase_records for select
to authenticated
using (user_id = auth.uid());

grant select on public.token_pack_products to anon, authenticated, service_role;
grant select, insert, update on public.token_purchase_records to authenticated, service_role;
grant select, insert on public.token_transactions to authenticated, service_role;
grant select, insert, update on public.user_token_balances to authenticated, service_role;

create or replace function public.credit_token_purchase(
  purchase_id uuid,
  stripe_session_id text,
  stripe_payment_intent_id text default null,
  stripe_customer_id text default null,
  stripe_event_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  purchase_row public.token_purchase_records%rowtype;
  previous_balance integer;
  next_balance integer;
  transaction_id uuid;
begin
  select *
  into purchase_row
  from public.token_purchase_records
  where id = purchase_id
  for update;

  if not found then
    raise exception 'Purchase record not found';
  end if;

  if purchase_row.status = 'credited' then
    return;
  end if;

  if purchase_row.provider_checkout_session_id is not null
    and purchase_row.provider_checkout_session_id <> stripe_session_id then
    raise exception 'Stripe session does not match purchase record';
  end if;

  select token_balance
  into previous_balance
  from public.user_token_balances
  where user_id = purchase_row.user_id
  for update;

  if previous_balance is null then
    previous_balance := 0;
  end if;

  next_balance := previous_balance + purchase_row.token_amount;

  insert into public.user_token_balances (user_id, token_balance, updated_at)
  values (purchase_row.user_id, next_balance, now())
  on conflict (user_id) do update
  set
    token_balance = excluded.token_balance,
    updated_at = now();

  insert into public.token_transactions (
    user_id,
    transaction_type,
    amount,
    balance_after,
    source,
    description,
    metadata
  )
  values (
    purchase_row.user_id,
    'credit',
    purchase_row.token_amount,
    next_balance,
    'stripe_purchase',
    'Purchased tokens with Stripe Checkout.',
    jsonb_build_object(
      'purchase_id', purchase_row.id,
      'token_pack_slug', purchase_row.token_pack_slug,
      'stripe_checkout_session_id', stripe_session_id,
      'stripe_payment_intent_id', stripe_payment_intent_id,
      'stripe_customer_id', stripe_customer_id,
      'stripe_event_id', stripe_event_id
    )
  )
  returning id into transaction_id;

  update public.token_purchase_records
  set
    status = 'credited',
    provider_checkout_session_id = coalesce(provider_checkout_session_id, stripe_session_id),
    provider_payment_intent_id = coalesce(stripe_payment_intent_id, provider_payment_intent_id),
    provider_customer_id = coalesce(stripe_customer_id, provider_customer_id),
    credited_transaction_id = transaction_id,
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'stripe_event_id', stripe_event_id,
      'credited_at', now()
    ),
    updated_at = now()
  where id = purchase_row.id;
end;
$$;

grant execute on function public.credit_token_purchase(uuid, text, text, text, text) to service_role;

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

create or replace function public.sync_user_token_balance(
  next_token_balance integer,
  transaction_source text default 'balance_sync',
  transaction_description text default null,
  transaction_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_balance integer := greatest(0, next_token_balance);
  previous_balance integer;
  balance_delta integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select token_balance
  into previous_balance
  from public.user_token_balances
  where user_id = auth.uid()
  for update;

  if previous_balance is null then
    previous_balance := 0;
  end if;

  balance_delta := normalized_balance - previous_balance;

  insert into public.user_token_balances (user_id, token_balance, updated_at)
  values (auth.uid(), normalized_balance, now())
  on conflict (user_id) do update
  set
    token_balance = excluded.token_balance,
    updated_at = now();

  if balance_delta <> 0 then
    insert into public.token_transactions (
      user_id,
      transaction_type,
      amount,
      balance_after,
      source,
      description,
      metadata
    )
    values (
      auth.uid(),
      case when balance_delta > 0 then 'credit' else 'debit' end,
      balance_delta,
      normalized_balance,
      transaction_source,
      transaction_description,
      coalesce(transaction_metadata, '{}'::jsonb)
    );
  end if;
end;
$$;

grant execute on function public.sync_user_token_balance(integer, text, text, jsonb) to authenticated;

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

  insert into public.saved_rogue_runs (user_id, user_email, username, run_data, status, updated_at)
  select
    auth.uid(),
    auth_user.email,
    coalesce(profile.username, split_part(auth_user.email, '@', 1)),
    next_run_data,
    'active',
    now()
  from auth.users auth_user
  left join public.user_profiles profile on profile.id = auth_user.id
  where auth_user.id = auth.uid()
  on conflict (user_id, status) do update
  set
    user_email = excluded.user_email,
    username = excluded.username,
    run_data = excluded.run_data,
    updated_at = now();
end;
$$;

grant execute on function public.sync_active_rogue_run(jsonb) to authenticated;

update public.saved_rogue_runs saved_run
set
  user_email = auth_user.email,
  username = coalesce(profile.username, split_part(auth_user.email, '@', 1))
from auth.users auth_user
left join public.user_profiles profile on profile.id = auth_user.id
where saved_run.user_id = auth_user.id;

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

drop view if exists public.saved_rogue_run_overview;
create view public.saved_rogue_run_overview
with (security_invoker = true)
as
select
  username,
  user_email,
  id,
  user_id,
  current_floor,
  run_stage,
  status,
  created_at,
  updated_at
from public.saved_rogue_runs;

drop view if exists public.token_transaction_overview;
create view public.token_transaction_overview
with (security_invoker = true)
as
select
  coalesce(profile.username, split_part(auth_user.email, '@', 1)) as username,
  auth_user.email as user_email,
  token_transaction.id,
  token_transaction.user_id,
  token_transaction.transaction_type,
  token_transaction.amount,
  token_transaction.balance_after,
  token_transaction.source,
  token_transaction.description,
  token_transaction.metadata,
  token_transaction.created_at
from public.token_transactions token_transaction
left join public.user_profiles profile on profile.id = token_transaction.user_id
left join auth.users auth_user on auth_user.id = token_transaction.user_id;

drop view if exists public.token_purchase_overview;
create view public.token_purchase_overview
with (security_invoker = true)
as
select
  coalesce(profile.username, split_part(auth_user.email, '@', 1)) as username,
  auth_user.email as user_email,
  purchase.id,
  purchase.user_id,
  coalesce(product.name, purchase.token_pack_slug) as token_pack,
  purchase.token_pack_slug,
  purchase.token_amount,
  purchase.usd_cents,
  purchase.currency,
  purchase.status,
  purchase.payment_provider,
  purchase.provider_checkout_session_id,
  purchase.provider_payment_intent_id,
  purchase.credited_transaction_id,
  purchase.metadata,
  purchase.created_at,
  purchase.updated_at
from public.token_purchase_records purchase
left join public.token_pack_products product on product.id = purchase.token_pack_product_id
left join public.user_profiles profile on profile.id = purchase.user_id
left join auth.users auth_user on auth_user.id = purchase.user_id;
