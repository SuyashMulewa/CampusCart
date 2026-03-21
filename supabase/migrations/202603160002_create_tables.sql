-- Migration: create core tables
-- Ordering note: depends on 202603160001_init_extensions_and_types.sql

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  avatar text not null,
  university text not null,
  major text,
  year text,
  bio text,
  phone text,
  enrollment_number text,
  student_id_card_photo text,
  document_type text,
  document_photo text,
  verification_submitted_at timestamptz,
  role user_role not null default 'student',
  is_verified boolean not null default false,
  is_online boolean not null default false,
  last_seen timestamptz not null default now(),
  rating numeric(3,2) not null default 0,
  review_count integer not null default 0,
  joined_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_document_type_check check (document_type is null or document_type = 'Fee Receipt'),
  constraint users_rating_range_check check (rating >= 0 and rating <= 5),
  constraint users_review_count_non_negative check (review_count >= 0)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null,
  count integer not null default 0,
  listings text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_count_non_negative check (count >= 0)
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  description text not null,
  price numeric(12,2) not null,
  mrp numeric(12,2) not null,
  negotiable_min_price numeric(12,2),
  category text not null,
  subcategory text,
  condition listing_condition not null,
  location text not null,
  image text not null,
  images jsonb not null default '[]'::jsonb,
  specifications jsonb,
  status listing_status not null default 'active',
  views integer not null default 0,
  favorites integer not null default 0,
  is_negotiable boolean not null default false,
  posted_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listings_price_non_negative check (price >= 0),
  constraint listings_mrp_non_negative check (mrp >= 0),
  constraint listings_negotiable_min_price_non_negative check (negotiable_min_price is null or negotiable_min_price >= 0),
  constraint listings_negotiable_min_price_le_price check (negotiable_min_price is null or negotiable_min_price <= price),
  constraint listings_views_non_negative check (views >= 0),
  constraint listings_favorites_non_negative check (favorites >= 0),
  constraint listings_images_array_check check (jsonb_typeof(images) = 'array'),
  constraint listings_specifications_object_check check (specifications is null or jsonb_typeof(specifications) = 'object')
);

create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  bidder_id uuid not null references public.users (id) on delete cascade,
  amount numeric(12,2) not null,
  is_buy_now boolean not null default false,
  message text,
  status bid_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bids_amount_positive check (amount > 0)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete restrict,
  bid_id uuid not null references public.bids (id) on delete restrict,
  buyer_id uuid not null references public.users (id) on delete restrict,
  seller_id uuid not null references public.users (id) on delete restrict,
  agreed_price numeric(12,2) not null,
  original_price numeric(12,2) not null,
  status order_status not null default 'pending',
  status_history jsonb not null default '[]'::jsonb,
  delivery_method delivery_method not null default 'campus_meetup',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_prices_non_negative check (agreed_price >= 0 and original_price >= 0),
  constraint orders_distinct_parties check (buyer_id <> seller_id),
  constraint orders_status_history_array_check check (jsonb_typeof(status_history) = 'array')
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.users (id) on delete cascade,
  seller_id uuid not null references public.users (id) on delete cascade,
  listing_id uuid references public.listings (id) on delete set null,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_distinct_participants check (buyer_id <> seller_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid references public.users (id) on delete set null,
  content text not null,
  type message_type not null default 'text',
  metadata jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint messages_metadata_object_check check (metadata is null or jsonb_typeof(metadata) = 'object')
);

create table if not exists public.meetups (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  location text not null,
  date date not null,
  time time not null,
  proposed_by uuid not null references public.users (id) on delete restrict,
  buyer_confirmed boolean not null default false,
  seller_confirmed boolean not null default false,
  is_locked boolean not null default false,
  status meetup_status not null default 'proposed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meetups_lock_consistency check (
    (is_locked = false) or (buyer_confirmed = true and seller_confirmed = true)
  )
);

create table if not exists public.otps (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid not null references public.meetups (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  code char(6) not null,
  is_verified boolean not null default false,
  generated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint otps_code_numeric_check check (code ~ '^[0-9]{6}$'),
  constraint otps_expiry_after_generation check (expires_at > generated_at),
  constraint otps_verified_at_consistency check (
    (is_verified = false and verified_at is null)
    or
    (is_verified = true and verified_at is not null)
  )
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  reviewer_id uuid not null references public.users (id) on delete cascade,
  reviewee_id uuid not null references public.users (id) on delete cascade,
  rating integer not null,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_rating_range_check check (rating >= 1 and rating <= 5),
  constraint reviews_not_self_review check (reviewer_id <> reviewee_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type notification_type not null,
  title text not null,
  content text not null,
  link text,
  related_entity_id uuid,
  related_entity_type text,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger normalize_user_email_trigger
before insert or update on public.users
for each row execute function normalize_user_email();

create trigger set_users_updated_at
before update on public.users
for each row execute function set_updated_at();

create trigger set_categories_updated_at
before update on public.categories
for each row execute function set_updated_at();

create trigger set_listings_updated_at
before update on public.listings
for each row execute function set_updated_at();

create trigger set_bids_updated_at
before update on public.bids
for each row execute function set_updated_at();

create trigger set_orders_updated_at
before update on public.orders
for each row execute function set_updated_at();

create trigger set_conversations_updated_at
before update on public.conversations
for each row execute function set_updated_at();

create trigger set_messages_updated_at
before update on public.messages
for each row execute function set_updated_at();

create trigger set_meetups_updated_at
before update on public.meetups
for each row execute function set_updated_at();

create trigger set_otps_updated_at
before update on public.otps
for each row execute function set_updated_at();

create trigger set_reviews_updated_at
before update on public.reviews
for each row execute function set_updated_at();

create trigger set_notifications_updated_at
before update on public.notifications
for each row execute function set_updated_at();
