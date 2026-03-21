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
import type { User, CreateUserDTO, UpdateUserDTO } from '@/models/user.model';
import { simulateLatency, wrapResponse, throwApiError } from './base.service';
import { supabase } from '@/lib/supabase';

const SESSION_KEY = 'campuscart_current_user_id';
type SafeUser = Omit<User, 'passwordHash'>;

const USER_SELECT = `
  id,
  name,
  email,
  avatar,
  university,
  major,
  year,
  bio,
  phone,
  enrollmentNumber:enrollment_number,
  studentIdCardPhoto:student_id_card_photo,
  documentType:document_type,
  documentPhoto:document_photo,
  verificationSubmittedAt:verification_submitted_at,
  role,
  isVerified:is_verified,
  isOnline:is_online,
  lastSeen:last_seen,
  rating,
  reviewCount:review_count,
  joinedDate:joined_date,
  createdAt:created_at,
  updatedAt:updated_at
`;

/** Normalize email input to prevent case/whitespace mismatches. */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getReadableAuthErrorMessage(rawMessage: string | undefined): { code: number; message: string } {
  const normalized = (rawMessage || '').toLowerCase();

  if (normalized.includes('email not confirmed') || normalized.includes('not confirmed')) {
    return {
      code: 403,
      message: 'Email not verified. Please verify your email first, then login.',
    };
  }

  if (normalized.includes('email rate limit exceeded') || normalized.includes('rate limit')) {
    return {
      code: 429,
      message: 'Too many login attempts. Please wait 60 seconds and try again.',
    };
  }

  if (normalized.includes('invalid login credentials') || normalized.includes('invalid email or password')) {
    return {
      code: 401,
      message: 'Invalid email or password',
    };
  }

  return {
    code: 400,
    message: rawMessage || 'Login failed. Please try again.',
  };
}

async function signUpWithRestFallback(
  email: string,
  password: string,
  profile: { name: string; university: string; avatar: string }
) {
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throwApiError(500, 'Missing Supabase env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  }

  const signupUrl = `${supabaseUrl}/auth/v1/signup?apikey=${encodeURIComponent(supabaseAnonKey)}`;

  const response = await fetch(signupUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({
      email,
      password,
      data: {
        name: profile.name,
        university: profile.university,
        avatar: profile.avatar,
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      (payload?.msg as string | undefined)
      || (payload?.error_description as string | undefined)
      || (payload?.message as string | undefined)
      || 'Signup failed';

    const normalized = message.toLowerCase();
    if (normalized.includes('email rate limit exceeded') || normalized.includes('rate limit')) {
      throwApiError(
        429,
        'Too many signup attempts. Please wait 60 seconds before retrying, or use a different email.'
      );
    }

    throwApiError(response.status, message);
  }

  return {
    user: (payload?.user || payload) as { id?: string } | null,
  };
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
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (signInError || !signInData.user) {
    const mapped = getReadableAuthErrorMessage(signInError?.message);
    throwApiError(mapped.code, mapped.message);
  }

  const userId = signInData.user.id;
  setSession(userId);

  await supabase
    .from('users')
    .update({ is_online: true, last_seen: new Date().toISOString() })
    .eq('id', userId);

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select(USER_SELECT)
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    throwApiError(404, 'User profile not found');
  }

  return wrapResponse(profile as SafeUser);
}

/**
 * Check if an email is already registered.
 * Returns true if the email exists, false otherwise.
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  await simulateLatency(50, 100);

  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', normalizeEmail(email))
    .limit(1);

  if (error) return false;
  return !!data?.length;
}

/**
 * Create a new user account.
 * @throws ApiError(409) if email already exists
 */
export async function signup(dto: CreateUserDTO) {
  await simulateLatency(200, 400);

  const normalizedEmail = normalizeEmail(dto.email);
  const avatar = dto.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${dto.name.replace(/\s/g, '')}`;

  const signUpData = await signUpWithRestFallback(normalizedEmail, dto.password, {
    name: dto.name,
    university: dto.university,
    avatar,
  });

  const authUserId = signUpData.user?.id;
  if (!authUserId) {
    const { data: existingProfile, error: lookupError } = await supabase
      .from('users')
      .select(USER_SELECT)
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!lookupError && existingProfile) {
      const { data: hydratedProfile, error: hydrateError } = await supabase
        .from('users')
        .update({
          name: dto.name,
          university: dto.university,
          avatar,
          is_online: true,
          last_seen: new Date().toISOString(),
        })
        .eq('id', existingProfile.id)
        .select(USER_SELECT)
        .single();

      if (hydrateError || !hydratedProfile) {
        throwApiError(500, hydrateError?.message || 'Signup succeeded but profile update failed');
      }

      setSession(hydratedProfile.id);
      return wrapResponse(hydratedProfile as SafeUser);
    }

    throwApiError(400, 'Signup succeeded. Please verify your email and then login.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .upsert({
      id: authUserId,
      name: dto.name,
      email: normalizedEmail,
      avatar,
      university: dto.university,
      role: 'student',
      is_verified: false,
      is_online: true,
      last_seen: new Date().toISOString(),
      rating: 0,
      review_count: 0,
      joined_date: new Date().toISOString().split('T')[0],
    })
    .select(USER_SELECT)
    .single();

  if (profileError || !profile) {
    throwApiError(500, profileError?.message || 'Failed to create user profile');
  }

  setSession(authUserId);
  return wrapResponse(profile as SafeUser);
}

/**
 * Get the currently authenticated user.
 * @throws ApiError(401) if not logged in
 */
export async function getMe() {
  await simulateLatency(50, 100);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    clearSession();
    throwApiError(401, 'Not authenticated');
  }

  setSession(user.id);

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select(USER_SELECT)
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throwApiError(404, 'User profile not found');
  }

  return wrapResponse(profile as SafeUser);
}

/** Log out the current user. */
export async function logout() {
  await simulateLatency(50, 100);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id) {
    await supabase
      .from('users')
      .update({ is_online: false, last_seen: new Date().toISOString() })
      .eq('id', user.id);
  }

  await supabase.auth.signOut();
  clearSession();
  return wrapResponse(null);
}

/** Resend verification email for users who signed up but haven't confirmed yet. */
export async function resendVerificationEmail(email: string) {
  await simulateLatency(100, 200);

  const normalizedEmail = normalizeEmail(email);
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: normalizedEmail,
  });

  if (error) {
    const mapped = getReadableAuthErrorMessage(error.message);
    throwApiError(mapped.code, mapped.message);
  }

  return wrapResponse(null);
}

/**
 * Update the current user's profile.
 * @throws ApiError(401) if not logged in
 */
export async function updateProfile(dto: UpdateUserDTO) {
  await simulateLatency(150, 250);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throwApiError(401, 'Not authenticated');
  }

  const patch: Record<string, unknown> = {};
  if (dto.name !== undefined) patch.name = dto.name;
  if (dto.bio !== undefined) patch.bio = dto.bio;
  if (dto.university !== undefined) patch.university = dto.university;
  if (dto.major !== undefined) patch.major = dto.major;
  if (dto.year !== undefined) patch.year = dto.year;
  if (dto.phone !== undefined) patch.phone = dto.phone;
  if (dto.avatar !== undefined) patch.avatar = dto.avatar;
  if (dto.enrollmentNumber !== undefined) patch.enrollment_number = dto.enrollmentNumber;
  if (dto.studentIdCardPhoto !== undefined) patch.student_id_card_photo = dto.studentIdCardPhoto;
  if (dto.documentType !== undefined) patch.document_type = dto.documentType;
  if (dto.documentPhoto !== undefined) patch.document_photo = dto.documentPhoto;
  if (dto.verificationSubmittedAt !== undefined) {
    patch.verification_submitted_at = dto.verificationSubmittedAt;
  }
  if (dto.isVerified !== undefined) patch.is_verified = dto.isVerified;

  if (Object.keys(patch).length === 0) {
    const me = await getMe();
    return wrapResponse(me.data);
  }

  const { data: updated, error: updateError } = await supabase
    .from('users')
    .update(patch)
    .eq('id', user.id)
    .select(USER_SELECT)
    .single();

  if (updateError || !updated) {
    throwApiError(500, updateError?.message || 'Failed to update profile');
  }

  return wrapResponse(updated as SafeUser);
}

/**
 * Get a user's public profile by ID (visible to other users).
 * @throws ApiError(404) if user not found
 */
export async function getUserProfile(userId: string) {
  await simulateLatency(50, 150);

  const { data: publicUser, error } = await supabase
    .from('users')
    .select(`
      id,
      name,
      avatar,
      university,
      major,
      year,
      bio,
      enrollmentNumber:enrollment_number,
      studentIdCardPhoto:student_id_card_photo,
      documentType:document_type,
      documentPhoto:document_photo,
      verificationSubmittedAt:verification_submitted_at,
      role,
      isVerified:is_verified,
      isOnline:is_online,
      lastSeen:last_seen,
      rating,
      reviewCount:review_count,
      joinedDate:joined_date,
      createdAt:created_at,
      updatedAt:updated_at
    `)
    .eq('id', userId)
    .single();

  if (error || !publicUser) {
    throwApiError(404, 'User not found');
  }

  return wrapResponse(publicUser);
}
