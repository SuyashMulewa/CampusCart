# Dexie to Supabase Cutover Plan

This is the implementation handoff for replacing local IndexedDB repositories with SQL-backed Supabase services.

## Phase 1: Auth + Users

- Replace local auth session reads/writes in `src/services/auth.service.ts` with Supabase Auth.
- On signup, create profile row in `public.users` using `auth.users.id` as PK.
- Keep return shape `{ data, error }` to avoid hook churn.

## Phase 2: Listings + Bids + Orders

- Move listing read/search/create/update methods in `listing.service.ts` to Supabase table queries.
- Replace bid acceptance logic in `bid.service.ts` with RPC call to:
  - `accept_bid_and_create_order(p_bid_id, p_actor_user_id, p_delivery_method)`
- Keep order transitions in service but persist status/history in SQL.

## Phase 3: Chat + Realtime

- Move conversation/message methods in `chat.service.ts` to SQL tables.
- Subscribe to realtime inserts for `messages` and `notifications`.
- Gradually reduce event-bus invalidation in favor of realtime listeners.

## Phase 4: Meetup + OTP + Reviews + Notifications

- Use SQL source-of-truth for meetup proposals and lock states.
- OTP verification should update order status + listing status in a transaction.
- Reviews insert automatically updates target user rating via DB trigger.

## Cleanup

- Remove `src/db/database.ts` and `src/db/seed.ts` after all services are switched.
- Remove old repository classes once no service imports them.
- Keep feature-flag fallback only during transition.
