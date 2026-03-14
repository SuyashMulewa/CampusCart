/**
 * Auth service — user authentication and profile management.
 *
 * Simulates REST endpoints:
 *   POST /auth/login       → login(email, password)
 *   POST /auth/signup      → signup(dto)
 *   GET  /auth/me          → getMe()
 *   POST /auth/logout      → logout()
 *   PATCH /auth/profile     → updateProfile(dto)
 *
 * Auth state is stored in sessionStorage ('campuscart_current_user_id').
 * When migrating to Supabase, replace with supabase.auth.* methods.
 */
import { userRepository } from '@/repositories/user.repository';
import type { User, CreateUserDTO, UpdateUserDTO } from '@/models/user.model';
import { simulateLatency, wrapResponse, throwApiError, generateId, timestamp } from './base.service';

const SESSION_KEY = 'campuscart_current_user_id';

/** Normalize email input to prevent case/whitespace mismatches. */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Get the currently logged-in user's ID from storage.
 * Uses localStorage for persistence across browser sessions.
 * Falls back to sessionStorage for backward compatibility.
 */
export function getCurrentUserId(): string | null {
  return localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
}

/** Set the current user session (persists across browser restarts). */
function setSession(userId: string): void {
  localStorage.setItem(SESSION_KEY, userId);
  sessionStorage.setItem(SESSION_KEY, userId); // backward compat
}

/** Clear the current user session from all storage. */
function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Log in with email and password.
 * Validates credentials against stored user data.
 * @throws ApiError(401) if credentials are invalid
 */
export async function login(email: string, password: string) {
  await simulateLatency(150, 300);

  const normalizedEmail = normalizeEmail(email);
  const user = await userRepository.findByEmail(normalizedEmail);
  if (!user) {
    throwApiError(401, 'Invalid email or password');
  }

  // Mock password validation (plain text comparison for demo)
  if (user.passwordHash !== password) {
    throwApiError(401, 'Invalid email or password');
  }

  // Set session and update online status
  setSession(user.id);
  await userRepository.updateOnlineStatus(user.id, true);

  // Return user without passwordHash
  const { passwordHash: _, ...safeUser } = user;
  return wrapResponse(safeUser as Omit<User, 'passwordHash'>);
}

/**
 * Check if an email is already registered.
 * Returns true if the email exists, false otherwise.
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  await simulateLatency(50, 100);
  const user = await userRepository.findByEmail(normalizeEmail(email));
  return !!user;
}

/**
 * Create a new user account.
 * @throws ApiError(409) if email already exists
 */
export async function signup(dto: CreateUserDTO) {
  await simulateLatency(200, 400);

  const normalizedEmail = normalizeEmail(dto.email);

  // Check for duplicate email
  const existing = await userRepository.findByEmail(normalizedEmail);
  if (existing) {
    throwApiError(409, 'An account with this email already exists. Please login instead.');
  }

  const now = timestamp();
  const newUser: User = {
    id: generateId('user'),
    name: dto.name,
    email: normalizedEmail,
    avatar: dto.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${dto.name.replace(/\s/g, '')}`,
    university: dto.university,
    role: 'student',
    isVerified: false,
    isOnline: true,
    lastSeen: now,
    rating: 0,
    reviewCount: 0,
    joinedDate: now.split('T')[0],
    passwordHash: dto.password, // Mock — plain text for demo
    createdAt: now,
    updatedAt: now,
  };

  await userRepository.create(newUser);
  setSession(newUser.id);

  const { passwordHash: _, ...safeUser } = newUser;
  return wrapResponse(safeUser as Omit<User, 'passwordHash'>);
}

/**
 * Get the currently authenticated user.
 * @throws ApiError(401) if not logged in
 */
export async function getMe() {
  await simulateLatency(50, 100);

  const userId = getCurrentUserId();
  if (!userId) {
    throwApiError(401, 'Not authenticated');
  }

  const user = await userRepository.getById(userId);
  if (!user) {
    clearSession();
    throwApiError(401, 'User not found');
  }

  const { passwordHash: _, ...safeUser } = user;
  return wrapResponse(safeUser as Omit<User, 'passwordHash'>);
}

/** Log out the current user. */
export async function logout() {
  await simulateLatency(50, 100);

  const userId = getCurrentUserId();
  if (userId) {
    await userRepository.updateOnlineStatus(userId, false);
  }

  clearSession();
  return wrapResponse(null);
}

/**
 * Update the current user's profile.
 * @throws ApiError(401) if not logged in
 */
export async function updateProfile(dto: UpdateUserDTO) {
  await simulateLatency(150, 250);

  const userId = getCurrentUserId();
  if (!userId) {
    throwApiError(401, 'Not authenticated');
  }

  const updated = await userRepository.update(userId, {
    ...dto,
    updatedAt: timestamp(),
  });

  const { passwordHash: _, ...safeUser } = updated;
  return wrapResponse(safeUser as Omit<User, 'passwordHash'>);
}

/**
 * Get a user's public profile by ID (visible to other users).
 * @throws ApiError(404) if user not found
 */
export async function getUserProfile(userId: string) {
  await simulateLatency(50, 150);

  const user = await userRepository.getById(userId);
  if (!user) {
    throwApiError(404, 'User not found');
  }

  const { passwordHash: _, email: __, phone: ___, ...publicUser } = user;
  return wrapResponse(publicUser);
}
