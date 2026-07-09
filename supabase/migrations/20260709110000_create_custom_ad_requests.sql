create table public.custom_ad_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  advertised_item text not null,
  request_details text not null,
  creator_preferences text,
  budget_range text not null,
  desired_timing text not null,
  contact_method text not null,
  phone text not null,
  source text not null default 'homepage_concierge',
  status text not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint custom_ad_requests_advertised_item_not_blank check (length(trim(advertised_item)) > 0),
  constraint custom_ad_requests_request_details_not_blank check (length(trim(request_details)) > 0),
  constraint custom_ad_requests_creator_preferences_not_blank check (
    creator_preferences is null or length(trim(creator_preferences)) > 0
  ),
  constraint custom_ad_requests_budget_range_allowed check (
    budget_range in (
      'under_50k',
      '50k_100k',
      '100k_300k',
      '300k_500k',
      '500k_1m',
      'over_1m',
      'unknown'
    )
  ),
  constraint custom_ad_requests_desired_timing_allowed check (
    desired_timing in ('asap', 'within_1_month', 'within_1_to_3_months', 'undecided')
  ),
  constraint custom_ad_requests_contact_method_allowed check (contact_method in ('kakao', 'phone')),
  constraint custom_ad_requests_phone_not_blank check (length(trim(phone)) > 0),
  constraint custom_ad_requests_source_allowed check (source in ('homepage_concierge')),
  constraint custom_ad_requests_status_allowed check (
    status in ('submitted', 'checking', 'matched', 'declined', 'cancelled')
  )
);

create index custom_ad_requests_user_id_idx on public.custom_ad_requests (user_id);
create index custom_ad_requests_status_created_at_idx on public.custom_ad_requests (status, created_at desc);

create trigger custom_ad_requests_set_updated_at
  before update on public.custom_ad_requests
  for each row execute function public.set_updated_at();

alter table public.custom_ad_requests enable row level security;

create policy "Users can read their own custom ad requests"
  on public.custom_ad_requests for select
  to authenticated
  using (user_id = auth.uid());

create policy "Admins can read all custom ad requests"
  on public.custom_ad_requests for select
  to authenticated
  using (public.is_admin());

create policy "Admins can manage custom ad requests"
  on public.custom_ad_requests for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update on public.custom_ad_requests to authenticated;
grant all on public.custom_ad_requests to service_role;
