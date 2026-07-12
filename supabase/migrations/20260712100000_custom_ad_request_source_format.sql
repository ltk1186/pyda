alter table public.custom_ad_requests
  drop constraint if exists custom_ad_requests_source_allowed;

alter table public.custom_ad_requests
  drop constraint if exists custom_ad_requests_source_format;

alter table public.custom_ad_requests
  add constraint custom_ad_requests_source_format
  check (source ~ '^[a-z0-9_-]{1,50}$');
