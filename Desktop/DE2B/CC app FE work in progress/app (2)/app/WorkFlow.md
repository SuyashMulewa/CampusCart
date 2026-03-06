Here is your **cleaned, structured, developer-ready workflow prompt** — rewritten clearly, logically ordered, and without repetition or ambiguity.
You can now use this for **system design, database planning, or giving to an AI / development team**.

---

## ✅ Cleaned & Structured Platform Workflow (Developer Specification)

### **Project Overview**

This platform is a **student marketplace** where users can act as both **buyers and sellers** to trade academic resources or products through bidding or direct purchase, followed by an offline meetup with OTP verification.

The frontend is currently **70–80% complete**, and the goal is to finalize backend architecture, database design, and implementation workflow.

---

## **1. User Roles**

Each registered user can perform both roles:

* **Buyer**
* **Seller**

Role depends on the action performed, not account type.

---

## **2. Seller Workflow**

### **2.1 Create Listing**

Seller creates a product listing with:

* Product title
* Description
* Images
* Category
* Condition
* listing price
* MRP
* Negotiable minimum price (minimum bid limit)

Rules:

* Seller **cannot see their own listing** in the marketplace browsing feed.
* Listing becomes visible to other users immediately after creation.

---

### **2.2 Manage Listings**

From **Profile → My Listings**, seller can:

* View all listed products
* Edit product details
* Delete listing
* View bids received

---

### **2.3 View Bids**

Inside **View Bids Page**, seller sees:

* Current price
* Total number of bids
* List of interested buyers
* Bid amounts
* Buyer details (name, university)

Seller actions:

* Finalize Order (accept a buyer)
* Reject bid

---

### **2.4 Finalize Order**

When seller selects **Finalize Order**:

A quick chat dialog opens allowing seller to:

* Set meetup details:

  * Location
  * Date
  * Time

Meetup request is sent to the buyer.
both can either confirm/change meetup details as required.

---

## **3. Buyer Workflow**

### **3.1 Browse Products**

Buyer can:

* Browse listings
* View product details
* Choose between:

  * Buy at listed price
  * Place a bid

---

### **3.2 Place Bid**

Buyer must enter a price:

* Bid value ≥ seller’s negotiable minimum price.

After submission:

* Bid is recorded.
* Automated message appears in chat.
* Order status created (pending)

---

### **3.3 Buy Now**

If buyer clicks **Buy Now**:

* Buyer agrees to purchase at seller’s listed price.
* System creates a bid equal to listing price.

* Bid is recorded.
* Automated message appears in chat.
* Order status created (pending)

---

### **3.4 Order Tracking**

From **Profile → My Orders**, buyer sees order status:

* Pending
* Confirmed
* Completed
* Cancelled

Buyer can open chat with seller.

---

## **4. Chat System (Buyer ↔ Seller)**

Chat includes:

* Seller information header with online/offline status
* Automated initial message after bid submission
* Automated seller message:

  > “Wait until I send meetup details.”

Chat supports actions:

* only Messaging meetup details using option set meetup
* System updates automatic message when needed
* Once the meet up details is sent Options like Confirm meetup detaiks Or change meetup details are provided.

---

## **5. Meetup Scheduling Workflow**

### **5.1 Meetup Proposal**

Seller sends meetup details.

Receiver (buyer/seller) can:

* Confirm meetup
* Request changes

---

### **5.2 Confirmation**

Once both users confirm:

* Meetup becomes locked.
* Countdown timer starts.

---

### **5.3 Restricted Meetup UI**

Activated **1 hour before meetup**.

Restricted screen includes:

* OTP verification system
* Call option
* Report issue
* close (which remove restricted ui)


---

## **6. OTP Authentication (Offline Verification)**

* System generates OTP after meetup confirmation.
* OTP is shown only to **buyer**.
* Buyer shares OTP physically with seller during meetup.

Seller submits OTP.

System verifies:

* OTP correctness
* Both users present in meetup phase

After successful verification:

* Locked Close button on meet authentication page UI of both users unlocks.
* Transaction marked completed.

---

## **7. Completion Flow**

### Buyer:

* Redirected to Home.
* then a Review panel popup appears.

### Seller:

* Redirected to **Sale Completed Page** with transaction details.

---

## **8. Core System States**

### Order Status Lifecycle:

```
Pending → Confirmed → Completed
            ↓
         Cancelled
```

---

## **9. Key Functional Requirements**

* Real-time bid updates
* Role-based UI rendering
* Seller cannot view own listings in marketplace feeds
* Automated chat events
* Meetup scheduling system
* Countdown-based UI restriction
* OTP-based offline transaction verification
* Review & rating system

---

## **10. Development Goal**

Design a backend and database architecture that enables:

* Seamless buyer–seller interaction
* Real-time updates
* Secure meetup verification
* Scalable listing and bidding system

---

If you want, next I can give you the **MOST IMPORTANT PART** developers usually miss:

👉 **The exact database schema (tables + relationships) that fits THIS workflow perfectly**
— including bids, orders, chat, meetup, OTP, and status transitions and more as needed for this project.

That will basically become your backend blueprint.