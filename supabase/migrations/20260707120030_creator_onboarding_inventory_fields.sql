alter table public.listings
  add column inventory_type text,
  add column placement_fee_krw integer,
  add column production_fee_krw integer,
  add column option_keys text[] not null default '{}'::text[],
  add column turnaround_days integer,
  add column source_content_url text,
  add column recent_30d_views integer,
  add column maintenance_days integer;

alter table public.listings
  add constraint listings_inventory_type_allowed check (
    inventory_type is null or inventory_type in ('new_content', 'existing_traffic')
  ),
  add constraint listings_placement_fee_krw_positive check (
    placement_fee_krw is null or placement_fee_krw > 0
  ),
  add constraint listings_production_fee_krw_non_negative check (
    production_fee_krw is null or production_fee_krw >= 0
  ),
  add constraint listings_option_keys_no_nulls check (
    array_position(option_keys, null) is null
  ),
  add constraint listings_option_keys_allowed check (
    option_keys <@ array[
      'coupon_code',
      'dedicated_link',
      'brand_badge',
      'story_3'
    ]::text[]
  ),
  add constraint listings_turnaround_days_allowed check (
    turnaround_days is null or turnaround_days in (7, 14, 30)
  ),
  add constraint listings_recent_30d_views_non_negative check (
    recent_30d_views is null or recent_30d_views >= 0
  ),
  add constraint listings_maintenance_days_allowed check (
    maintenance_days is null or maintenance_days = 30
  ),
  add constraint listings_structured_price_matches_total check (
    inventory_type is null
    or (
      placement_fee_krw is not null
      and production_fee_krw is not null
      and price_krw = placement_fee_krw + production_fee_krw
    )
  ),
  add constraint listings_new_content_fields_consistent check (
    inventory_type <> 'new_content'
    or (
      turnaround_days is not null
      and source_content_url is null
      and recent_30d_views is null
      and maintenance_days is null
    )
  ),
  add constraint listings_existing_traffic_fields_consistent check (
    inventory_type <> 'existing_traffic'
    or (
      production_fee_krw = 0
      and turnaround_days is null
      and source_content_url is not null
      and recent_30d_views is not null
      and maintenance_days = 30
    )
  );

create unique index creators_owner_user_id_unique
  on public.creators (owner_user_id)
  where owner_user_id is not null;
