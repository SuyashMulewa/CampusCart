-- Migration: constraints, indexes, and workflow functions
-- Ordering note: depends on 202603160002_create_tables.sql

-- Uniqueness and integrity
create unique index if not exists users_email_unique_idx on public.users (email);
create unique index if not exists categories_name_unique_idx on public.categories (name);

create unique index if not exists conversations_buyer_seller_listing_unique_idx
  on public.conversations (
    buyer_id,
    seller_id,
    coalesce(listing_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create unique index if not exists bids_one_pending_per_listing_bidder_idx
  on public.bids (listing_id, bidder_id)
  where status = 'pending';

create unique index if not exists bids_one_accepted_per_listing_idx
  on public.bids (listing_id)
  where status = 'accepted';

create unique index if not exists orders_bid_id_unique_idx on public.orders (bid_id);

create unique index if not exists orders_one_open_order_per_listing_buyer_idx
  on public.orders (listing_id, buyer_id)
  where status in ('pending', 'confirmed');

create unique index if not exists meetups_order_unique_idx on public.meetups (order_id);
create unique index if not exists otps_meetup_unique_idx on public.otps (meetup_id);
create unique index if not exists otps_one_open_per_meetup_idx
  on public.otps (meetup_id)
  where is_verified = false;

create unique index if not exists reviews_one_per_order_reviewer_idx
  on public.reviews (order_id, reviewer_id);

-- Query-performance indexes aligned with current repository/service access patterns
create index if not exists users_university_idx on public.users (university);
create index if not exists users_is_online_idx on public.users (is_online);
create index if not exists users_last_seen_idx on public.users (last_seen desc);

create index if not exists listings_seller_id_idx on public.listings (seller_id);
create index if not exists listings_category_idx on public.listings (category);
create index if not exists listings_status_idx on public.listings (status);
create index if not exists listings_posted_date_idx on public.listings (posted_date desc);
create index if not exists listings_category_status_posted_date_idx on public.listings (category, status, posted_date desc);

create index if not exists bids_listing_id_idx on public.bids (listing_id);
create index if not exists bids_bidder_id_idx on public.bids (bidder_id);
create index if not exists bids_status_idx on public.bids (status);
create index if not exists bids_created_at_idx on public.bids (created_at desc);
create index if not exists bids_listing_status_created_at_idx on public.bids (listing_id, status, created_at desc);

create index if not exists orders_listing_id_idx on public.orders (listing_id);
create index if not exists orders_buyer_id_idx on public.orders (buyer_id);
create index if not exists orders_seller_id_idx on public.orders (seller_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_buyer_status_created_at_idx on public.orders (buyer_id, status, created_at desc);
create index if not exists orders_seller_status_created_at_idx on public.orders (seller_id, status, created_at desc);

create index if not exists conversations_buyer_id_idx on public.conversations (buyer_id);
create index if not exists conversations_seller_id_idx on public.conversations (seller_id);
create index if not exists conversations_listing_id_idx on public.conversations (listing_id);
create index if not exists conversations_last_message_at_idx on public.conversations (last_message_at desc);

create index if not exists messages_conversation_id_idx on public.messages (conversation_id);
create index if not exists messages_sender_id_idx on public.messages (sender_id);
create index if not exists messages_created_at_idx on public.messages (created_at desc);
create index if not exists messages_conversation_created_at_idx on public.messages (conversation_id, created_at asc);
create index if not exists messages_unread_by_conversation_idx
  on public.messages (conversation_id)
  where is_read = false;

create index if not exists meetups_order_id_idx on public.meetups (order_id);
create index if not exists meetups_conversation_id_idx on public.meetups (conversation_id);
create index if not exists meetups_status_idx on public.meetups (status);
create index if not exists meetups_date_time_idx on public.meetups (date, time);

create index if not exists otps_order_id_idx on public.otps (order_id);
create index if not exists otps_expires_at_idx on public.otps (expires_at);

create index if not exists reviews_order_id_idx on public.reviews (order_id);
create index if not exists reviews_reviewer_id_idx on public.reviews (reviewer_id);
create index if not exists reviews_reviewee_id_idx on public.reviews (reviewee_id);
create index if not exists reviews_created_at_idx on public.reviews (created_at desc);

create index if not exists notifications_user_id_idx on public.notifications (user_id);
create index if not exists notifications_is_read_idx on public.notifications (is_read);
create index if not exists notifications_created_at_idx on public.notifications (created_at desc);
create index if not exists notifications_user_read_created_idx on public.notifications (user_id, is_read, created_at desc);

-- Keep listing's conversation activity fresh
create or replace function touch_conversation_last_message_at()
returns trigger
language plpgsql
as $$
begin
  update public.conversations
  set last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger touch_conversation_on_message_insert
after insert on public.messages
for each row execute function touch_conversation_last_message_at();

-- Recalculate review aggregates on users table
create or replace function recalculate_user_rating(target_user_id uuid)
returns void
language plpgsql
as $$
declare
  avg_rating numeric(3,2);
  total_reviews integer;
begin
  select coalesce(avg(r.rating), 0)::numeric(3,2), count(*)::integer
  into avg_rating, total_reviews
  from public.reviews r
  where r.reviewee_id = target_user_id;

  update public.users
  set rating = avg_rating,
      review_count = total_reviews
  where id = target_user_id;
end;
$$;

create or replace function reviews_rating_aggregate_trigger()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    perform recalculate_user_rating(new.reviewee_id);
    return new;
  elsif tg_op = 'UPDATE' then
    if old.reviewee_id <> new.reviewee_id then
      perform recalculate_user_rating(old.reviewee_id);
    end if;
    perform recalculate_user_rating(new.reviewee_id);
    return new;
  elsif tg_op = 'DELETE' then
    perform recalculate_user_rating(old.reviewee_id);
    return old;
  end if;
  return null;
end;
$$;

create trigger reviews_rating_aggregate_after_change
after insert or update or delete on public.reviews
for each row execute function reviews_rating_aggregate_trigger();

-- Transaction-safe bid acceptance workflow
create or replace function accept_bid_and_create_order(
  p_bid_id uuid,
  p_actor_user_id uuid,
  p_delivery_method delivery_method default 'campus_meetup'
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_bid public.bids%rowtype;
  v_listing public.listings%rowtype;
  v_order_id uuid;
begin
  select * into v_bid
  from public.bids
  where id = p_bid_id
  for update;

  if not found then
    raise exception 'Bid not found';
  end if;

  if v_bid.status <> 'pending' then
    raise exception 'Only pending bids can be accepted';
  end if;

  select * into v_listing
  from public.listings
  where id = v_bid.listing_id
  for update;

  if not found then
    raise exception 'Listing not found';
  end if;

  if v_listing.seller_id <> p_actor_user_id then
    raise exception 'Only listing owner can accept this bid';
  end if;

  if v_listing.status <> 'active' then
    raise exception 'Listing is not active';
  end if;

  update public.bids
  set status = 'accepted'
  where id = v_bid.id;

  update public.bids
  set status = 'rejected'
  where listing_id = v_bid.listing_id
    and id <> v_bid.id
    and status = 'pending';

  insert into public.orders (
    listing_id,
    bid_id,
    buyer_id,
    seller_id,
    agreed_price,
    original_price,
    status,
    status_history,
    delivery_method
  ) values (
    v_bid.listing_id,
    v_bid.id,
    v_bid.bidder_id,
    v_listing.seller_id,
    v_bid.amount,
    v_listing.price,
    'pending',
    jsonb_build_array(
      jsonb_build_object(
        'status', 'pending',
        'timestamp', now(),
        'note', 'Order created from accepted bid'
      )
    ),
    p_delivery_method
  )
  returning id into v_order_id;

  update public.listings
  set status = 'pending'
  where id = v_listing.id;

  return v_order_id;
end;
$$;
