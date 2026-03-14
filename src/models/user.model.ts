/**
 * User model — represents a registered platform member.
 *
 * Every user can act as both buyer and seller; role is action-based.
 * The `passwordHash` field is only used by the mock auth service and
 * is NEVER exposed to UI components.
 *
 * IndexedDB table: `users`
 * Indexes: `++id, email, university`
 */
import type { UserRole } from './enums';

export interface User {
  /** Primary key — e.g. 'u1', 'u2' */
  id: string;
  name: string;
  email: string;
  avatar: string;
  university: string;
  major?: string;
  year?: string;
  bio?: string;
  phone?: string;
  enrollmentNumber?: string;
  studentIdCardPhoto?: string;
  documentType?: 'Fee Receipt';
  documentPhoto?: string;
  verificationSubmittedAt?: string;
  role: UserRole;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen: string;       // ISO 8601
  rating: number;          // 0–5 average
  reviewCount: number;
  joinedDate: string;      // ISO 8601 date
  /** Bcrypt-style hash (mock: plain-text for demo). Never sent to UI. */
  passwordHash: string;
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
}

/** Fields accepted when creating a new account */
export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  university: string;
  avatar?: string;
}

/** Fields the user can update from the profile page */
export interface UpdateUserDTO {
  name?: string;
  bio?: string;
  university?: string;
  major?: string;
  year?: string;
  phone?: string;
  avatar?: string;
  enrollmentNumber?: string;
  studentIdCardPhoto?: string;
  documentType?: 'Fee Receipt';
  documentPhoto?: string;
  verificationSubmittedAt?: string;
  isVerified?: boolean;
}
