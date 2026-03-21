# CampusCart Project Workflow

## 1. Product Intent

CampusCart is a student marketplace where the same account can act as both buyer and seller. 
Transactions are marketplace-first (listing and bidding), then conversation-driven (chat + meetup), and finally trust-verified (OTP at physical handoff).

This document defines the current end-to-end workflow the project should follow across UI, services, events, and state updates.

---

## 2. Roles and Access Model

- Each authenticated user can list products, place bids, chat, and complete orders.
- Role is contextual:
  - Seller: owner of a listing/order.
  - Buyer: bidder or direct purchaser of a listing.
- Marketplace feed must exclude listings created by the currently logged-in seller.

---

## 3. Listing Lifecycle (Seller Side)

### 3.1 Create Listing

Seller creates a listing with:

- title
- description
- images
- category
- condition
- listing price
- MRP (optional display value)
- negotiable minimum price (minimum acceptable bid)

Expected behavior:

- Listing is visible to other users immediately after creation.
- Seller does not see own listing in discovery feed.

### 3.2 Manage Listing

From Profile → My Listings, seller can:

- view own listings
- edit listing data
- delete listing
- open bids for a listing

### 3.3 Listing Events

On listing mutations, system emits:

- `listing:created`
- `listing:updated`
- `listing:deleted`

These events drive UI refresh and query invalidation for listing screens.

---

## 4. Buying and Bidding Lifecycle

### 4.1 Buyer Discovery

Buyer browses listings, opens detail view, and chooses:

- place bid
- buy now (at listing price)

### 4.2 Place Bid

Rules:

- Bid amount must be greater than or equal to seller minimum negotiable price.

System actions:

- Save bid.
- Create or update related conversation/order context.
- Push initial automated chat message.
- Set order status to `pending` when order entity is created.

### 4.3 Buy Now

Rules:

- Buy now behaves as an immediate bid at listing price.

System actions are same as place bid flow, with bid amount equal to listing price.

### 4.4 Seller Bid Decision

In View Bids page, seller can:

- inspect bidder details and amounts
- accept (finalize order)
- reject

Related events:

- `bid:placed`
- `bid:accepted`
- `bid:rejected`
- `order:created`
- `order:status_changed`

---

## 5. Chat and Negotiation Workflow

Chat is the operational channel between buyer and seller.

### 5.1 Conversation Behavior

- Conversation starts or becomes active after bid/buy-now action.
- System can send guided messages (for next step prompts).
- Users exchange plain messages and meetup coordination updates.

### 5.2 Chat Events

- `conversation:created`
- `message:received`

These events update chat lists, message threads, unread counts, and notification badges.

---

## 6. Meetup Workflow

### 6.1 Proposal

Seller proposes meetup details:

- location
- date
- time

Buyer can confirm or request changes. Flow remains iterative until both accept.

### 6.2 Locking

When both parties confirm:

- meetup status is locked
- countdown begins

Events:

- `meetup:proposed`
- `meetup:confirmed`
- `meetup:locked`

### 6.3 Restricted Phase

One hour before meetup, restricted meetup UI appears with:

- OTP verification entry
- call option
- issue/report option
- close action (unlocked only after successful OTP verification)

---

## 7. OTP Verification Workflow

### 7.1 OTP Generation

- OTP is generated after meetup confirmation/lock stage.
- OTP is visible only to buyer.

### 7.2 Physical Handoff Validation

- Buyer shares OTP in person with seller.
- Seller submits OTP in app.
- System verifies OTP and valid meetup/order context.

Events:

- `otp:generated`
- `otp:verified`

### 7.3 Post-Verification

- Restricted close state unlocks.
- Order transitions to `completed`.
- Completion screens and review prompts become available.

---

## 8. Order State Machine

Canonical order lifecycle:

`pending` → `confirmed` → `completed`

Cancellation branch:

`pending` or `confirmed` → `cancelled`

State updates must emit `order:status_changed`.

---

## 9. Completion and Review Flow

- Buyer: redirected to home (or primary marketplace screen) and prompted for review/rating.
- Seller: shown sale completion summary.
- Review submission emits `review:submitted` and can trigger profile/rating refresh.

---

## 10. Data and State Synchronization (Current Frontend Pattern)

Workflow consistency is maintained via typed query keys and event-driven invalidation.

### 10.1 Query Domains

- Auth: `['auth', 'me']`, `['auth', 'profile', userId]`
- Listings: `['listings']`, detail, search, category, mine, categories
- Bids: `['bids']`, by listing, mine
- Orders: `['orders']`, buyer, seller, detail
- Chat: conversations, messages, unread
- Meetups: by order
- OTP: by meetup
- Reviews: for user, for order
- Notifications: all, unread

### 10.2 Core Principle

After any mutation (listing/bid/order/chat/meetup/otp/review), emit typed event and invalidate the smallest matching query scope first, then broader scope only when necessary.

---

## 11. Implementation Priorities

1. Keep flow logic centralized in service/repository layers.
2. Keep UI components thin and event/query driven.
3. Preserve strict state transitions for order and meetup statuses.
4. Ensure OTP verification is mandatory for transaction completion.
5. Maintain real-time responsiveness through event bus + TanStack Query invalidation.

---

## 12. Backend Alignment Goal

Backend and database design must fully support:

- listing and bidding at scale
- deterministic order state transitions
- persistent buyer-seller conversation history
- meetup proposal/confirmation/lock lifecycle
- secure OTP generation and verification
- review and notification propagation

This workflow is the source-of-truth functional contract for implementation.