/**
 * Auth hooks — login, signup, logout, current user, profile.
 *
 * The auth state (current user) is managed as a TanStack Query cache entry
 * at queryKeys.auth.me. Login/signup mutations update this key directly
 * via queryClient.setQueryData for instant UI updates.
 *
 * Session persistence: sessionStorage ('campuscart_current_user_id').
 * Supabase migration: Replace service calls with supabase.auth.* methods.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as authService from '@/services/auth.service';
import type { CreateUserDTO, UpdateUserDTO } from '@/models';
import { queryKeys } from './queryKeys';

// ─── Queries ──────────────────────────────────────────

/** Get the currently logged-in user. Returns null if not authenticated. */
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      try {
        const res = await authService.getMe();
        return res.data;
      } catch {
        return null;
      }
    },
    staleTime: Infinity, // Session doesn't go stale — only mutations change it
  });
}

/** Get a user's public profile by ID. */
export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.auth.profile(userId ?? ''),
    queryFn: async () => {
      if (!userId) return null;
      const res = await authService.getUserProfile(userId);
      return res.data;
    },
    enabled: !!userId,
  });
}

// ─── Mutations ────────────────────────────────────────

/** Login mutation. On success, sets the current user in cache. */
export function useLogin() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await authService.login(email, password);
      return res.data;
    },
    onSuccess: (user) => {
      qc.setQueryData(queryKeys.auth.me, user);
    },
  });
}

/** Signup mutation. On success, sets the current user in cache. */
export function useSignup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateUserDTO) => {
      const res = await authService.signup(dto);
      return res.data;
    },
    onSuccess: (user) => {
      qc.setQueryData(queryKeys.auth.me, user);
    },
  });
}

/** Logout mutation. Clears current user from cache. */
export function useLogout() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await authService.logout();
    },
    onSuccess: () => {
      qc.setQueryData(queryKeys.auth.me, null);
      // Clear all query caches on logout
      qc.clear();
    },
  });
}

/** Update the current user's profile. */
export function useUpdateProfile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (dto: UpdateUserDTO) => {
      const res = await authService.updateProfile(dto);
      return res.data;
    },
    onSuccess: (user) => {
      qc.setQueryData(queryKeys.auth.me, user);
      if (user) {
        qc.setQueryData(queryKeys.auth.profile(user.id), user);
      }
    },
  });
}

// ─── Convenience helpers ──────────────────────────────

/** Returns the current user ID synchronously (reads from sessionStorage). */
export function useCurrentUserId(): string | null {
  return authService.getCurrentUserId();
}
