/**
 * Barrel export for all domain models.
 *
 * Usage: import { User, Listing, Order, ... } from '@/models';
 *
 * This replaces the dual type systems that previously existed:
 * - src/types/models.ts (thin 3-interface file)
 * - src/data/mockData.ts (inline rich types)
 *
 * All domain types are now centralized here with proper documentation,
 * FK relationships, and DTO variants for create/update operations.
 */

// Enums & union types
export * from './enums';

// Entity models + DTOs
export type { User, CreateUserDTO, UpdateUserDTO } from './user.model';
export type { Listing, CreateListingDTO, UpdateListingDTO } from './listing.model';
export type { Bid, CreateBidDTO } from './bid.model';
export type { Order, OrderStatusEntry } from './order.model';
export type { Conversation } from './conversation.model';
export type { Message, MessageMetadata } from './message.model';
export type { Meetup, ProposeMeetupDTO } from './meetup.model';
export type { OTP } from './otp.model';
export type { Review, CreateReviewDTO } from './review.model';
export type { Notification, CreateNotificationDTO } from './notification.model';
export type { Category } from './category.model';

/**
 * Generic API response wrapper used by all service methods.
 * When swapping to Supabase, the service layer returns the same shape.
 */
export interface ApiResponse<T> {
  data: T;
  error: null;
}

/**
 * API error shape — thrown by services, caught by TanStack Query.
 */
export class ApiError extends Error {
  code: number;
  details?: string;

  constructor(
    code: number,
    message: string,
    details?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}
