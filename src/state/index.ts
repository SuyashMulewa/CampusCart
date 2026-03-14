/**
 * Barrel export for all state management hooks.
 *
 * Usage: import { useCurrentUser, useListings, usePlaceBid, ... } from '@/state';
 */

// Core infrastructure
export { queryClient } from './queryClient';
export { queryKeys } from './queryKeys';
export { useEventSubscription } from './useEventSubscription';

// Auth
export { useCurrentUser, useUserProfile, useLogin, useSignup, useLogout, useUpdateProfile, useCurrentUserId } from './useAuth';

// Listings
export { useListings, useListing, useListingSearch, useListingsByCategory, useMyListings, useCategories, useCreateListing, useUpdateListing, useDeleteListing, useListingsAsProducts, useListingAsProduct } from './useListings';

// Bids
export { useBidsForListing, useMyBids, usePlaceBid, useAcceptBid, useRejectBid, useCancelBid } from './useBids';

// Orders
export { useBuyerOrders, useSellerOrders, useOrder, useCancelOrder } from './useOrders';

// Chat
export { useConversations, useMessages, useUnreadMessageCount, useSendMessage, useMarkAsRead, useGetOrCreateConversation } from './useChat';

// Meetups
export { useMeetup, useProposeMeetup, useConfirmMeetup, useMeetupCountdown } from './useMeetup';

// OTP
export { useOtp, useVerifyOtp } from './useOtp';

// Reviews
export { useReviewsForUser, useReviewsForOrder, useSubmitReview } from './useReviews';

// Notifications
export { useNotifications, useUnreadNotificationCount, useMarkNotificationAsRead, useMarkAllNotificationsAsRead, useDeleteNotification } from './useNotifications';
