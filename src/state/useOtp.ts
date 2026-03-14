/**
 * OTP hooks — generating and verifying hand-off codes.
 *
 * OTP is generated automatically when a meetup locks.
 * Verification completes the order and marks the listing as sold.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as otpService from '@/services/otp.service';
import { EVENTS } from '@/events/events';
import { queryKeys } from './queryKeys';
import { useEventSubscription } from './useEventSubscription';

// ─── Queries ──────────────────────────────────────────

/**
 * Get the OTP for a meetup.
 * The code is masked unless `revealCode` is true.
 */
export function useOtp(meetupId: string | undefined, revealCode: boolean = false) {
  const qc = useQueryClient();

  useEventSubscription(EVENTS.OTP_GENERATED, (payload) => {
    if (payload.meetupId === meetupId) {
      qc.invalidateQueries({ queryKey: queryKeys.otp.byMeetup(meetupId!) });
    }
  });
  useEventSubscription(EVENTS.OTP_VERIFIED, (payload) => {
    if (payload.meetupId === meetupId) {
      qc.invalidateQueries({ queryKey: queryKeys.otp.byMeetup(meetupId!) });
    }
  });

  return useQuery({
    queryKey: queryKeys.otp.byMeetup(meetupId ?? ''),
    queryFn: async () => {
      const res = await otpService.getByMeetup(meetupId!, revealCode);
      return res.data;
    },
    enabled: !!meetupId,
  });
}

// ─── Mutations ────────────────────────────────────────

/** Verify the OTP code (entered by the buyer at the meetup). */
export function useVerifyOtp() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ meetupId, code }: { meetupId: string; code: string }) => {
      const res = await otpService.verify(meetupId, code);
      return res.data;
    },
    onSuccess: () => {
      // OTP verify completes the order and marks listing as sold
      qc.invalidateQueries({ queryKey: queryKeys.orders.all });
      qc.invalidateQueries({ queryKey: queryKeys.listings.all });
      qc.invalidateQueries({ queryKey: queryKeys.listings.mine });
      qc.invalidateQueries({ queryKey: queryKeys.chat.conversations });
    },
  });
}
