create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.creators (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete set null,
  slug text not null,
  display_name text not null,
  bio text,
  avatar_path text,
  social_links jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  is_sample boolean not null default false,
  onboarded_at timestamptz,
  claimed_at timestamptz,
  claim_token_hash text,
  claim_expires_at timestamptz,
  is_founding boolean not null default false,
  founding_granted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint creators_slug_not_blank check (length(trim(slug)) > 0),
  constraint creators_display_name_not_blank check (length(trim(display_name)) > 0),
  constraint creators_social_links_object check (jsonb_typeof(social_links) = 'object'),
  constraint creators_status_allowed check (status in ('draft', 'published', 'hidden', 'archived')),
  constraint creators_founding_grant_required check (
    is_founding = false or founding_granted_at is not null
  )
);

create table public.listings (
  id uuid primary key default extensions.gen_random_uuid(),
  creator_id uuid not null references public.creators(id) on delete restrict,
  slug text not null,
  title text not null,
  platform text not null,
  channel_name text,
  channel_url text,
  audience_size integer,
  ad_format text not null,
  description text,
  deliverables text[] not null default '{}'::text[],
  price_krw integer not null,
  image_paths text[] not null default '{}'::text[],
  status text not null default 'draft',
  is_sample boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint listings_slug_not_blank check (length(trim(slug)) > 0),
  constraint listings_title_not_blank check (length(trim(title)) > 0),
  constraint listings_platform_not_blank check (length(trim(platform)) > 0),
  constraint listings_ad_format_not_blank check (length(trim(ad_format)) > 0),
  constraint listings_audience_size_non_negative check (audience_size is null or audience_size >= 0),
  constraint listings_price_krw_non_negative check (price_krw >= 0),
  constraint listings_status_allowed check (status in ('draft', 'published', 'hidden', 'archived')),
  constraint listings_deliverables_no_nulls check (array_position(deliverables, null) is null),
  constraint listings_image_paths_no_nulls check (array_position(image_paths, null) is null),
  constraint listings_image_paths_max_three check (cardinality(image_paths) <= 3),
  constraint listings_published_requires_images check (
    status <> 'published' or cardinality(image_paths) between 1 and 3
  )
);

create table public.requests (
  id uuid primary key default extensions.gen_random_uuid(),
  advertiser_user_id uuid not null references auth.users(id) on delete restrict,
  listing_id uuid not null references public.listings(id) on delete restrict,
  brand_name text not null,
  contact_name text not null,
  contact_channel text not null,
  contact_value text not null,
  campaign_brief text not null,
  preferred_start_date date,
  preferred_end_date date,
  quoted_amount_krw integer,
  status text not null default 'submitted',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint requests_brand_name_not_blank check (length(trim(brand_name)) > 0),
  constraint requests_contact_name_not_blank check (length(trim(contact_name)) > 0),
  constraint requests_contact_channel_not_blank check (length(trim(contact_channel)) > 0),
  constraint requests_contact_value_not_blank check (length(trim(contact_value)) > 0),
  constraint requests_campaign_brief_not_blank check (length(trim(campaign_brief)) > 0),
  constraint requests_preferred_dates_order check (
    preferred_start_date is null
    or preferred_end_date is null
    or preferred_start_date <= preferred_end_date
  ),
  constraint requests_quoted_amount_krw_non_negative check (
    quoted_amount_krw is null or quoted_amount_krw >= 0
  ),
  constraint requests_status_allowed check (
    status in (
      'submitted',
      'checking',
      'payment_ready',
      'paid',
      'in_progress',
      'completed',
      'declined',
      'cancelled'
    )
  ),
  constraint requests_payment_states_require_quote check (
    status not in ('payment_ready', 'paid', 'in_progress', 'completed')
    or quoted_amount_krw is not null
  )
);

create table public.payments (
  id uuid primary key default extensions.gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete restrict,
  provider text not null default 'toss',
  environment text not null default 'test',
  order_id text not null,
  payment_key text,
  amount_krw integer not null,
  platform_fee_bps integer not null default 1500,
  founding_benefit_bps integer not null default 0,
  platform_fee_amount integer not null,
  founding_benefit_amount integer not null default 0,
  creator_payout_amount integer not null,
  status text not null default 'ready',
  paid_at timestamptz,
  settled_at timestamptz,
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint payments_provider_allowed check (provider = 'toss'),
  constraint payments_environment_allowed check (environment in ('test', 'live')),
  constraint payments_order_id_not_blank check (length(trim(order_id)) > 0),
  constraint payments_payment_key_not_blank check (
    payment_key is null or length(trim(payment_key)) > 0
  ),
  constraint payments_amount_krw_non_negative check (amount_krw >= 0),
  constraint payments_platform_fee_bps_range check (platform_fee_bps between 0 and 10000),
  constraint payments_founding_benefit_bps_range check (founding_benefit_bps between 0 and 10000),
  constraint payments_founding_benefit_not_above_fee check (
    founding_benefit_bps <= platform_fee_bps
  ),
  constraint payments_amounts_non_negative check (
    platform_fee_amount >= 0
    and founding_benefit_amount >= 0
    and creator_payout_amount >= 0
  ),
  constraint payments_payout_balances_amount check (
    creator_payout_amount + platform_fee_amount - founding_benefit_amount = amount_krw
  ),
  constraint payments_status_allowed check (
    status in ('ready', 'paid', 'failed', 'cancelled', 'refunded', 'settled')
  ),
  constraint payments_paid_status_requires_paid_at check (
    status not in ('paid', 'refunded', 'settled') or paid_at is not null
  ),
  constraint payments_settled_status_requires_settled_at check (
    status <> 'settled' or settled_at is not null
  ),
  constraint payments_provider_payload_object check (jsonb_typeof(provider_payload) = 'object')
);

create unique index creators_slug_key on public.creators (slug);
create unique index creators_claim_token_hash_key
  on public.creators (claim_token_hash)
  where claim_token_hash is not null;
create index creators_owner_user_id_idx on public.creators (owner_user_id);
create index creators_status_idx on public.creators (status);

create unique index listings_slug_key on public.listings (slug);
create index listings_creator_id_idx on public.listings (creator_id);
create index listings_status_idx on public.listings (status);

create index requests_advertiser_user_id_idx on public.requests (advertiser_user_id);
create index requests_listing_id_idx on public.requests (listing_id);
create index requests_status_idx on public.requests (status);

create unique index payments_order_id_key on public.payments (order_id);
create unique index payments_payment_key_key
  on public.payments (payment_key)
  where payment_key is not null;
create index payments_request_id_idx on public.payments (request_id);
create index payments_status_idx on public.payments (status);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger creators_set_updated_at
  before update on public.creators
  for each row execute function public.set_updated_at();

create trigger listings_set_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

create trigger requests_set_updated_at
  before update on public.requests
  for each row execute function public.set_updated_at();

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(new.email, '@', 1)
    ),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.enforce_request_status_transition()
returns trigger
language plpgsql
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if (
    old.status = 'submitted'
    and new.status in ('checking', 'declined', 'cancelled')
  ) or (
    old.status = 'checking'
    and new.status in ('payment_ready', 'declined', 'cancelled')
  ) or (
    old.status = 'payment_ready'
    and new.status in ('paid', 'cancelled')
  ) or (
    old.status = 'paid'
    and new.status in ('in_progress', 'cancelled')
  ) or (
    old.status = 'in_progress'
    and new.status in ('completed', 'cancelled')
  ) then
    return new;
  end if;

  raise exception 'Invalid request status transition from % to %', old.status, new.status;
end;
$$;

create trigger requests_enforce_status_transition
  before update of status on public.requests
  for each row execute function public.enforce_request_status_transition();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select profiles.is_admin
      from public.profiles
      where profiles.id = auth.uid()
    ),
    false
  );
$$;

create or replace function public.can_manage_creator(target_creator_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1
      from public.creators
      where creators.id = target_creator_id
        and creators.owner_user_id = auth.uid()
    );
$$;

create or replace function public.is_published_listing(target_listing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.listings
    inner join public.creators on creators.id = listings.creator_id
    where listings.id = target_listing_id
      and listings.status = 'published'
      and creators.status = 'published'
  );
$$;

create or replace function public.request_belongs_to_current_user(target_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.requests
    where requests.id = target_request_id
      and requests.advertiser_user_id = auth.uid()
  );
$$;

create or replace function public.prevent_non_admin_creator_protected_field_update()
returns trigger
language plpgsql
as $$
begin
  if public.is_admin() or current_role in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;

  if new.owner_user_id is distinct from old.owner_user_id
    or new.is_sample is distinct from old.is_sample
    or new.onboarded_at is distinct from old.onboarded_at
    or new.claimed_at is distinct from old.claimed_at
    or new.claim_token_hash is distinct from old.claim_token_hash
    or new.claim_expires_at is distinct from old.claim_expires_at
    or new.is_founding is distinct from old.is_founding
    or new.founding_granted_at is distinct from old.founding_granted_at
  then
    raise exception 'Only admins can update creator protected fields';
  end if;

  return new;
end;
$$;

create or replace function public.prevent_non_admin_listing_protected_field_update()
returns trigger
language plpgsql
as $$
begin
  if public.is_admin() or current_role in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;

  if new.is_sample is distinct from old.is_sample then
    raise exception 'Only admins can update listing protected fields';
  end if;

  return new;
end;
$$;

create trigger creators_prevent_non_admin_protected_field_update
  before update on public.creators
  for each row execute function public.prevent_non_admin_creator_protected_field_update();

create trigger listings_prevent_non_admin_protected_field_update
  before update on public.listings
  for each row execute function public.prevent_non_admin_listing_protected_field_update();

alter table public.profiles enable row level security;
alter table public.creators enable row level security;
alter table public.listings enable row level security;
alter table public.requests enable row level security;
alter table public.payments enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "Admins can read all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

create policy "Users can insert their own non-admin profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid() and is_admin = false);

create policy "Admins can insert profiles"
  on public.profiles for insert
  to authenticated
  with check (public.is_admin());

create policy "Users can update their own non-admin profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() and is_admin = false)
  with check (id = auth.uid() and is_admin = false);

create policy "Admins can update profiles"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Anyone can read published creators"
  on public.creators for select
  to anon, authenticated
  using (status = 'published');

create policy "Creators can read their own creator rows"
  on public.creators for select
  to authenticated
  using (owner_user_id = auth.uid());

create policy "Admins can read all creators"
  on public.creators for select
  to authenticated
  using (public.is_admin());

create policy "Admins can create creators"
  on public.creators for insert
  to authenticated
  with check (public.is_admin());

create policy "Creators can update their own creator rows"
  on public.creators for update
  to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "Admins can update creators"
  on public.creators for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Anyone can read published listings"
  on public.listings for select
  to anon, authenticated
  using (
    status = 'published'
    and exists (
      select 1
      from public.creators
      where creators.id = listings.creator_id
        and creators.status = 'published'
    )
  );

create policy "Creators can read their own listings"
  on public.listings for select
  to authenticated
  using (public.can_manage_creator(creator_id));

create policy "Admins can create listings"
  on public.listings for insert
  to authenticated
  with check (public.is_admin());

create policy "Creators can create listings for their creator row"
  on public.listings for insert
  to authenticated
  with check (public.can_manage_creator(creator_id) and is_sample = false);

create policy "Creators can update their own listings"
  on public.listings for update
  to authenticated
  using (public.can_manage_creator(creator_id))
  with check (public.can_manage_creator(creator_id));

create policy "Admins can update listings"
  on public.listings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Users can read their own requests"
  on public.requests for select
  to authenticated
  using (advertiser_user_id = auth.uid());

create policy "Admins can read all requests"
  on public.requests for select
  to authenticated
  using (public.is_admin());

create policy "Users can create requests for themselves"
  on public.requests for insert
  to authenticated
  with check (
    advertiser_user_id = auth.uid()
    and status = 'submitted'
    and quoted_amount_krw is null
    and admin_notes is null
    and public.is_published_listing(listing_id)
  );

create policy "Admins can create requests"
  on public.requests for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update requests"
  on public.requests for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Advertisers can read payments for their requests"
  on public.payments for select
  to authenticated
  using (public.request_belongs_to_current_user(request_id));

create policy "Admins can read all payments"
  on public.payments for select
  to authenticated
  using (public.is_admin());

create policy "Admins can create payments"
  on public.payments for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update payments"
  on public.payments for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant usage on schema public to anon, authenticated, service_role;

revoke all privileges on table public.creators from anon, authenticated;

grant select (
  id,
  slug,
  display_name,
  bio,
  avatar_path,
  social_links,
  status,
  is_sample,
  is_founding,
  created_at,
  updated_at
) on public.creators to anon, authenticated;

grant select on public.listings to anon;

grant select, insert, update on public.profiles to authenticated;
grant insert, update on public.creators to authenticated;
grant select, insert, update on public.listings to authenticated;
grant select, insert, update on public.requests to authenticated;
grant select, insert, update on public.payments to authenticated;

grant all on public.profiles to service_role;
grant all on public.creators to service_role;
grant all on public.listings to service_role;
grant all on public.requests to service_role;
grant all on public.payments to service_role;
