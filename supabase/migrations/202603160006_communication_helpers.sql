-- Migration: communication workflow helpers
-- Ordering note: run after core schema and order helpers

create or replace function confirm_meetup_by_user(
  p_meetup_id uuid,
  p_user_id uuid
)
returns table (
  id uuid,
  order_id uuid,
  conversation_id uuid,
  location text,
  date date,
  "time" time,
  proposed_by uuid,
  buyer_confirmed boolean,
  seller_confirmed boolean,
  is_locked boolean,
  status meetup_status,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
as $$
declare
  v_meetup public.meetups%rowtype;
  v_order public.orders%rowtype;
  v_buyer_confirmed boolean;
  v_seller_confirmed boolean;
  v_is_locked boolean;
  v_status meetup_status;
begin
  select * into v_meetup
  from public.meetups
  where public.meetups.id = p_meetup_id
  for update;

  if not found then
    raise exception 'Meetup not found';
  end if;

  if v_meetup.status in ('completed', 'cancelled') then
    raise exception 'Meetup can no longer be confirmed';
  end if;

  select * into v_order
  from public.orders
  where public.orders.id = v_meetup.order_id;

  if not found then
    raise exception 'Associated order not found';
  end if;

  if p_user_id <> v_order.buyer_id and p_user_id <> v_order.seller_id then
    raise exception 'User is not part of this meetup';
  end if;

  v_buyer_confirmed := v_meetup.buyer_confirmed or p_user_id = v_order.buyer_id;
  v_seller_confirmed := v_meetup.seller_confirmed or p_user_id = v_order.seller_id;
  v_is_locked := v_buyer_confirmed and v_seller_confirmed;
  v_status := case when v_is_locked then 'locked' else 'confirmed' end;

  update public.meetups
  set buyer_confirmed = v_buyer_confirmed,
      seller_confirmed = v_seller_confirmed,
      is_locked = v_is_locked,
      status = v_status
  where public.meetups.id = p_meetup_id
  returning * into v_meetup;

  return query
  select
    v_meetup.id,
    v_meetup.order_id,
    v_meetup.conversation_id,
    v_meetup.location,
    v_meetup.date,
    v_meetup.time,
    v_meetup.proposed_by,
    v_meetup.buyer_confirmed,
    v_meetup.seller_confirmed,
    v_meetup.is_locked,
    v_meetup.status,
    v_meetup.created_at,
    v_meetup.updated_at;
end;
$$;

create or replace function verify_otp_and_complete_order(
  p_meetup_id uuid,
  p_code text
)
returns table (
  otp_id uuid,
  order_id uuid,
  listing_id uuid,
  buyer_id uuid,
  seller_id uuid
)
language plpgsql
security definer
as $$
declare
  v_otp public.otps%rowtype;
  v_meetup public.meetups%rowtype;
  v_order public.orders%rowtype;
begin
  select * into v_otp
  from public.otps
  where public.otps.meetup_id = p_meetup_id
  for update;

  if not found then
    raise exception 'No OTP found for this meetup';
  end if;

  if v_otp.is_verified then
    raise exception 'OTP already verified';
  end if;

  if v_otp.expires_at < now() then
    raise exception 'OTP has expired';
  end if;

  if v_otp.code <> p_code then
    raise exception 'Incorrect OTP code';
  end if;

  select * into v_meetup
  from public.meetups
  where public.meetups.id = p_meetup_id
  for update;

  if not found then
    raise exception 'Meetup not found';
  end if;

  select * into v_order
  from public.orders
  where public.orders.id = v_otp.order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  update public.otps
  set is_verified = true,
      verified_at = now()
  where public.otps.id = v_otp.id;

  update public.orders
  set status = 'completed',
      status_history = status_history || jsonb_build_array(
        jsonb_build_object(
          'status', 'completed',
          'timestamp', now(),
          'note', 'OTP verified at meetup'
        )
      )
  where public.orders.id = v_order.id;

  if v_order.bid_id is not null then
    update public.bids
    set status = 'completed'
    where public.bids.id = v_order.bid_id;
  end if;

  update public.listings
  set status = 'sold'
  where public.listings.id = v_order.listing_id;

  update public.meetups
  set status = 'completed'
  where public.meetups.id = v_meetup.id;

  return query
  select v_otp.id, v_order.id, v_order.listing_id, v_order.buyer_id, v_order.seller_id;
end;
$$;
