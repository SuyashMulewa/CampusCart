# Supabase SQL Setup (Initial Implementation)

This folder contains the first SQL implementation for replacing Dexie/IndexedDB with Supabase Postgres.

## Migration Files

Run in this order:

1. `migrations/202603160001_init_extensions_and_types.sql`
2. `migrations/202603160002_create_tables.sql`
3. `migrations/202603160003_constraints_indexes_and_functions.sql`
4. `migrations/202603160004_listing_helpers.sql`
5. `migrations/202603160005_order_helpers.sql`
6. `migrations/202603160006_communication_helpers.sql`

## How to Run

## Frontend env setup

Before running the app with Supabase-backed auth/services, create a local env file:

- Copy `.env.example` to `.env`
- Set:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### Option A: Supabase SQL Editor

- Open your Supabase project.
- Go to SQL Editor.
- Execute each migration file in order.

### Option B: Supabase CLI

If you already use Supabase CLI migrations in this repo:

- Place these files in your migration chain.
- Run your normal migration command (for example: `supabase db push`).

## What this version includes

- Full relational schema for all existing domain models:
  - `users`, `categories`, `listings`, `bids`, `orders`, `conversations`, `messages`, `meetups`, `otps`, `reviews`, `notifications`
- Enum types mapped from `src/models/enums.ts`
- FK constraints, check constraints, and unique indexes aligned with current service assumptions
- `updated_at` and email-normalization triggers
- Workflow function `accept_bid_and_create_order(...)` for transactional bid acceptance
- Rating aggregation triggers for `users.rating` and `users.review_count`

## Notes

- `public.users.id` references `auth.users.id` (Supabase Auth linked profile pattern).
- `messages.sender_id` is nullable to support system-generated messages.
- `notifications.related_entity_id` is UUID for strongly-typed deep links to domain records.

## Next implementation step

Connect service layer methods in `src/services` to Supabase queries incrementally:

1. `auth.service.ts`
2. `listing.service.ts` + `bid.service.ts`
3. `order.service.ts`
4. `chat.service.ts`
5. `meetup.service.ts` + `otp.service.ts` + `review.service.ts` + `notification.service.ts`
