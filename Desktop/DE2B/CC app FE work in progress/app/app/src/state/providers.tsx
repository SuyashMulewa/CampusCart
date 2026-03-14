/**
 * AppProviders — single wrapper for all application-level providers.
 *
 * Wraps:
 * 1. QueryClientProvider (TanStack Query) — new server-state layer
 * 2. CartProvider — UI-only cart state (permanent React Context)
 * 3. Legacy providers — kept temporarily during incremental page migration
 *
 * Migration checklist — remove each legacy provider when all consumers are migrated:
 * - [ ] AuthProvider     → useCurrentUser, useLogin, useSignup, useLogout
 * - [ ] WishlistProvider → (TBD: may keep as localStorage Context or migrate to query)
 * - [ ] OrderProvider    → useBuyerOrders, useSellerOrders, useCancelOrder
 * - [ ] NotificationProvider → useNotifications, useUnreadNotificationCount
 */
import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';

// Permanent
import { CartProvider } from '@/context/CartContext';

// Legacy — remove as pages migrate to TanStack Query hooks
import { AuthProvider } from '@/context/AuthContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { OrderProvider } from '@/context/OrderContext';
import { NotificationProvider } from '@/context/NotificationContext';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <OrderProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </OrderProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
