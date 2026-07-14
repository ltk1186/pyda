alter table public.listings
  add column visibility_preference text not null default 'private_matching';

alter table public.listings
  add constraint listings_visibility_preference_allowed
  check (visibility_preference in ('private_matching', 'public_review'));

-- Existing public listings already have an implicit publication decision.
update public.listings
set visibility_preference = 'public_review'
where status = 'published';

alter table public.listings
  add constraint listings_published_requires_public_review
  check (status <> 'published' or visibility_preference = 'public_review');

create or replace function public.prevent_non_admin_listing_protected_field_update()
returns trigger
language plpgsql
as $$
begin
  if public.is_admin() or current_role in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;

  if new.is_sample is distinct from old.is_sample
    or (new.status = 'published' and old.status <> 'published')
    or (
      new.published_at is distinct from old.published_at
      and not (
        old.status = 'published'
        and new.status <> 'published'
        and new.published_at is null
      )
    )
  then
    raise exception 'Only admins can update listing protected fields';
  end if;

  return new;
end;
$$;

drop policy if exists "Creators can create listings for their creator row"
  on public.listings;

create policy "Creators can create listings for their creator row"
  on public.listings for insert
  to authenticated
  with check (
    public.can_manage_creator(creator_id)
    and is_sample = false
    and status = 'draft'
    and published_at is null
  );

drop policy if exists "Anyone can read published listings"
  on public.listings;

create policy "Anyone can read published listings"
  on public.listings for select
  to anon, authenticated
  using (
    status = 'published'
    and visibility_preference = 'public_review'
    and exists (
      select 1
      from public.creators
      where creators.id = listings.creator_id
        and creators.status = 'published'
    )
  );

-- Only repair slugs that match the application's generated prefixes and end
-- with the known truncation artifact. Custom slugs are left untouched.
update public.creators
set slug = 'creator-' || replace(id::text, '-', '')
where slug ~ '^creator-[a-z0-9-]+-$';

update public.listings
set slug = case
  when platform = 'YouTube' and inventory_type = 'new_content'
    then 'youtube-new-content-' || replace(id::text, '-', '')
  when platform = 'YouTube' and inventory_type = 'existing_traffic'
    then 'youtube-existing-traffic-' || replace(id::text, '-', '')
  when platform = 'Instagram' and inventory_type = 'new_content'
    then 'instagram-new-content-' || replace(id::text, '-', '')
  when platform = 'Instagram' and inventory_type = 'existing_traffic'
    then 'instagram-existing-traffic-' || replace(id::text, '-', '')
  else 'listing-' || replace(id::text, '-', '')
end
where slug ~ '^(youtube|instagram)-(new-content|existing-traffic)-[a-z0-9-]+-$';
