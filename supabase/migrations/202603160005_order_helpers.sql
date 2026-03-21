-- Migration: helper functions for order status transitions
-- Ordering note: run after core schema and indexes

create or replace function transition_order_state(
  p_order_id uuid,
  p_next_status order_status,
  p_note text default null,
  p_bid_status bid_status default null,
  p_listing_status listing_status default null
)
returns table (
  id uuid,
  listing_id uuid,
  bid_id uuid,
  buyer_id uuid,
  seller_id uuid,
  agreed_price numeric,
  original_price numeric,
  status order_status,
  status_history jsonb,
  delivery_method delivery_method,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
as $$
declare
  v_order public.orders%rowtype;
begin
  update public.orders
  set status = p_next_status,
      status_history = status_history || jsonb_build_array(
        jsonb_build_object(
          'status', p_next_status,
          'timestamp', now(),
          'note', p_note
        )
      )
  where public.orders.id = p_order_id
  returning * into v_order;

  if not found then
    raise exception 'Order not found';
  end if;

  if p_bid_status is not null and v_order.bid_id is not null then
    update public.bids
    set status = p_bid_status
    where public.bids.id = v_order.bid_id;
  end if;

  if p_listing_status is not null then
    update public.listings
    set status = p_listing_status
    where public.listings.id = v_order.listing_id;
  end if;

  return query
  select
    o.id,
    o.listing_id,
    o.bid_id,
    o.buyer_id,
    o.seller_id,
    o.agreed_price,
    o.original_price,
    o.status,
    o.status_history,
    o.delivery_method,
    o.created_at,
    o.updated_at
  from public.orders o
  where o.id = p_order_id;
end;
$$;
