/**
 * OTP model — one-time password for physical meetup verification.
 *
 * Previously, OTP was a random 6-digit local variable in QuickChatDialog
 * with no real validation (seller could enter any 6 digits).
 * Now the OTP is stored in IndexedDB and the service layer validates
 * the seller's input against the stored code.
 *
 * Flow:
 * 1. Meetup locks → otp.service.generate() creates an OTP record.
 * 2. Buyer sees the OTP on their restricted meetup UI (read-only).
 * 3. Buyer shares OTP verbally with seller at the physical meetup.
 * 4. Seller enters OTP → otp.service.verify() validates against stored code.
 * 5. On match: order → completed, listing → sold.
 *
 * IndexedDB table: `otps`
 * Indexes: `++id, meetupId, orderId`
 */

export interface OTP {
  /** Primary key — e.g. 'otp-1709...' */
  id: string;
  /** FK → meetups.id */
  meetupId: string;
  /** FK → orders.id (denormalized for quick lookup) */
  orderId: string;
  /** The 6-digit verification code */
  code: string;
  /** Whether the code has been successfully verified */
  isVerified: boolean;
  generatedAt: string;   // ISO 8601
  /** OTP expiration (e.g., 2 hours after generation) */
  expiresAt: string;     // ISO 8601
  /** When the OTP was verified (null until verified) */
  verifiedAt?: string;   // ISO 8601
}
