/**
 * Meetup hooks — proposing, confirming, and monitoring meetups.
 *
 * Includes a countdown timer hook for locked meetups.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useRef } from 'react';
import * as meetupService from '@/services/meetup.service';
import type { ProposeMeetupDTO } from '@/models';
import { EVENTS } from '@/events/events';
import { queryKeys } from './queryKeys';
import { useEventSubscription } from './useEventSubscription';

// ─── Queries ──────────────────────────────────────────

/** Get the meetup associated with an order. */
export function useMeetup(orderId: string | undefined) {
  const qc = useQueryClient();

  useEventSubscription(EVENTS.MEETUP_PROPOSED, (payload) => {
    if (payload.orderId === orderId) {
      qc.invalidateQueries({ queryKey: queryKeys.meetups.byOrder(orderId!) });
    }
  });
  useEventSubscription(EVENTS.MEETUP_CONFIRMED, (payload) => {
    if (payload.orderId === orderId) {
      qc.invalidateQueries({ queryKey: queryKeys.meetups.byOrder(orderId!) });
    }
  });
  useEventSubscription(EVENTS.MEETUP_LOCKED, (payload) => {
    if (payload.orderId === orderId) {
      qc.invalidateQueries({ queryKey: queryKeys.meetups.byOrder(orderId!) });
    }
  });

  return useQuery({
    queryKey: queryKeys.meetups.byOrder(orderId ?? ''),
    queryFn: async () => {
      const res = await meetupService.getByOrder(orderId!);
      return res.data;
    },
    enabled: !!orderId,
  });
}

// ─── Mutations ────────────────────────────────────────

/** Propose meetup details for an order. */
export function useProposeMeetup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (dto: ProposeMeetupDTO) => {
      const res = await meetupService.propose(dto);
      return res.data;
    },
    onSuccess: (_, dto) => {
      qc.invalidateQueries({ queryKey: queryKeys.meetups.byOrder(dto.orderId) });
      qc.invalidateQueries({ queryKey: queryKeys.chat.conversations });
    },
  });
}

/** Confirm the meetup from the current user's perspective. */
export function useConfirmMeetup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (meetupId: string) => {
      const res = await meetupService.confirm(meetupId);
      return res.data;
    },
    onSuccess: () => {
      // When both confirm, this cascades to order confirmation + OTP generation
      qc.invalidateQueries({ queryKey: queryKeys.meetups });
      qc.invalidateQueries({ queryKey: queryKeys.orders.all });
      qc.invalidateQueries({ queryKey: queryKeys.otp });
      qc.invalidateQueries({ queryKey: queryKeys.chat.conversations });
    },
  });
}

// ─── Countdown Timer ─────────────────────────────────

interface CountdownState {
  /** Total remaining seconds */
  remaining: number;
  /** Formatted MM:SS string */
  display: string;
  /** Whether the countdown has expired */
  isExpired: boolean;
  /** Whether the countdown is actively running */
  isRunning: boolean;
}

/**
 * Hook that provides a countdown timer for a meetup.
 * Counts down from the meetup date/time.
 *
 * @param meetupDate  ISO date string (YYYY-MM-DD)
 * @param meetupTime  Time string (HH:MM)
 * @param isLocked    Whether the meetup is locked (countdown only runs when locked)
 */
export function useMeetupCountdown(
  meetupDate: string | undefined,
  meetupTime: string | undefined,
  isLocked: boolean,
): CountdownState {
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getTargetMs = useCallback(() => {
    if (!meetupDate || !meetupTime) return 0;
    const target = new Date(`${meetupDate}T${meetupTime}:00`);
    return target.getTime();
  }, [meetupDate, meetupTime]);

  useEffect(() => {
    if (!isLocked || !meetupDate || !meetupTime) {
      setRemaining(0);
      return;
    }

    const tick = () => {
      const diff = Math.max(0, Math.floor((getTargetMs() - Date.now()) / 1000));
      setRemaining(diff);
      if (diff <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    tick(); // immediate first tick
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isLocked, meetupDate, meetupTime, getTargetMs]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    remaining,
    display,
    isExpired: isLocked && remaining <= 0,
    isRunning: isLocked && remaining > 0,
  };
}
