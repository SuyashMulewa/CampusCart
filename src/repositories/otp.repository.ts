/**
 * OTP repository — data access for the `otps` IndexedDB table.
 */
import { db } from '@/db/database';
import type { OTP } from '@/models/otp.model';
import { BaseRepository } from './base.repository';

class OtpRepository extends BaseRepository<OTP> {
  constructor() {
    super(db.otps);
  }

  /** Find the OTP record for a specific meetup. */
  async findByMeetup(meetupId: string): Promise<OTP | undefined> {
    return this.table.where('meetupId').equals(meetupId).first();
  }

  /** Find the OTP record for a specific order (denormalized lookup). */
  async findByOrder(orderId: string): Promise<OTP | undefined> {
    return this.table.where('orderId').equals(orderId).first();
  }

  /**
   * Verify an OTP code. Returns true if the code matches and hasn't expired.
   * On success, marks the OTP as verified.
   */
  async verify(meetupId: string, code: string): Promise<boolean> {
    const otp = await this.findByMeetup(meetupId);
    if (!otp) return false;
    if (otp.isVerified) return false; // Already verified
    if (otp.code !== code) return false;

    // Check expiration
    if (new Date(otp.expiresAt) < new Date()) return false;

    // Mark as verified
    const now = new Date().toISOString();
    await this.table.update(otp.id, {
      isVerified: true,
      verifiedAt: now,
    });

    return true;
  }
}

export const otpRepository = new OtpRepository();
