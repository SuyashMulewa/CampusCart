-- Migration: helper functions for listing counters
-- Ordering note: run after table creation

create or replace function increment_listing_views(p_listing_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.listings
  set views = views + 1
  where id = p_listing_id;
end;
$$;