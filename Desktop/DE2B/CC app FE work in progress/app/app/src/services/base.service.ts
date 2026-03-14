/**
 * Base service — shared utilities for all service modules.
 *
 * Provides artificial latency simulation, response wrapping, and error
 * creation. Every service method should call `simulateLatency()` before
 * returning to mimic real REST API behavior.
 *
 * When migrating to Supabase, these utilities become unnecessary
 * (Supabase client handles latency natively). They can be no-op'd.
 */
import { ApiError } from '@/models';
import type { ApiResponse } from '@/models';

/**
 * Simulate network latency with a random delay.
 * @param min - Minimum delay in ms (default: 50)
 * @param max - Maximum delay in ms (default: 300)
 */
export function simulateLatency(min = 50, max = 300): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Wrap data in a standardized API response envelope.
 * Matches the shape of Supabase responses: `{ data, error }`.
 */
export function wrapResponse<T>(data: T): ApiResponse<T> {
  return { data, error: null };
}

/**
 * Create and throw a typed API error.
 * @param code - HTTP-like status code (400, 401, 404, 409, 500)
 * @param message - Human-readable error message
 * @param details - Optional technical details
 */
export function throwApiError(code: number, message: string, details?: string): never {
  throw new ApiError(code, message, details);
}

/**
 * Generate a unique ID with a prefix.
 * Format: `{prefix}-{timestamp}-{random}`
 */
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

/** Get current ISO timestamp string. */
export function timestamp(): string {
  return new Date().toISOString();
}
