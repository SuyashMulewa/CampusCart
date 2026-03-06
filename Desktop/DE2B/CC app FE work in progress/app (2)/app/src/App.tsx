/**
 * Root application component that wires providers, routing, layout, and global app behavior.
 */
import React from 'react';
// Simple error boundary to catch runtime errors and prevent blank screens
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return <div style={{ padding: 32, textAlign: 'center', color: 'red' }}>Something went wrong. Please refresh the page.</div>;
    }
    return this.props.children;
  }
}
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Context Providers
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { OrderProvider } from '@/context/OrderContext';

// Shared Components
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Auth Pages
import LandingPage from '@/pages/auth/LandingPage';
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';

// Marketplace Pages
import HomePage from '@/pages/marketplace/HomePage';
import SearchResultsPage from '@/pages/marketplace/SearchResultsPage';
import CategoryPage from '@/pages/marketplace/CategoryPage';
import ProductDetailPage from '@/pages/marketplace/ProductDetailPage';

// Transaction Pages
import CartPage from '@/pages/transaction/CartPage';
import CheckoutPage from '@/pages/transaction/CheckoutPage';
import OrderSuccessPage from '@/pages/transaction/OrderSuccessPage';

// User Pages
import ProfilePage from '@/pages/user/ProfilePage';
import OrdersPage from '@/pages/user/OrdersPage';
import ListingsPage from '@/pages/user/ListingsPage';
import WishlistPage from '@/pages/user/WishlistPage';
import SettingsPage from '@/pages/user/SettingsPage';
import CreateListingPage from '@/pages/marketplace/CreateListingPage';
import ViewBidsPage from '@/pages/user/ViewBids';

// Communication Pages
import MessagesPage from '@/pages/communication/MessagesPage';
import NotificationsPage from '@/pages/communication/NotificationsPage';

// Support Pages
import HelpCenterPage from '@/pages/support/HelpCenterPage';
import SellerProfilePage from '@/pages/support/SellerProfilePage';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // For demo purposes, we'll allow access. In production, check auth state
  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}

function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search, hash]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <OrderProvider>
            <NotificationProvider>
              <Router>
              <ScrollToTop />
              <AnimatePresence mode="wait">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />

                  {/* Marketplace Routes */}
                  <Route path="/home" element={
                    <AppLayout>
                      <HomePage />
                    </AppLayout>
                  } />
                  <Route path="/search" element={
                    <AppLayout>
                      <SearchResultsPage />
                    </AppLayout>
                  } />
                  <Route path="/searchresultspage" element={
                    <AppLayout>
                      <SearchResultsPage />
                    </AppLayout>
                  } />
                  <Route path="/categories" element={
                    <AppLayout>
                      <HomePage />
                    </AppLayout>
                  } />
                  <Route path="/category/:categoryId" element={
                    <AppLayout>
                      <CategoryPage />
                    </AppLayout>
                  } />
                  <Route path="/product/:productId" element={
                    <AppLayout>
                      <ProductDetailPage />
                    </AppLayout>
                  } />

                  {/* Transaction Routes */}
                  <Route path="/cart" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <CartPage />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/checkout" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <CheckoutPage />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/checkout/agreement" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <CheckoutPage />
                      </AppLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/order-success" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <OrderSuccessPage />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/ordersuccesspage" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <OrderSuccessPage />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/order-success/:id" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <OrderSuccessPage />
                      </AppLayout>
                    </ProtectedRoute>
                  } />

                  {/* User Routes */}
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ProfilePage />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/orders" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <OrdersPage />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/listings" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ListingsPage />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/wishlist" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <WishlistPage />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <SettingsPage />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/create-listing" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <CreateListingPage />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/listings/:listingId/bids" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ViewBidsPage />
                      </AppLayout>
                    </ProtectedRoute>
                  } />

                  {/* Communication Routes */}
                  <Route path="/messages" element={
                    <ProtectedRoute>
                      <AppLayout>
                            <MessagesPage />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/messagespage" element={
                    <ProtectedRoute>
                      <AppLayout>
                            <MessagesPage />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/messages/:conversationId" element={
                    <ProtectedRoute>
                      <AppLayout>
                            <MessagesPage />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/notifications" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <NotificationsPage />
                      </AppLayout>
                    </ProtectedRoute>
                  } />

                  {/* Support Routes */}
                  <Route path="/help" element={
                    <AppLayout>
                      <HelpCenterPage />
                    </AppLayout>
                  } />
                  <Route path="/help/:topic" element={
                    <AppLayout>
                      <HelpCenterPage />
                    </AppLayout>
                  } />
                  <Route path="/seller/:sellerId" element={
                    <AppLayout>
                      <SellerProfilePage />
                    </AppLayout>
                  } />

                  {/* Catch all - redirect to home */}
                  <Route path="*" element={<Navigate to="/home" replace />} />
                </Routes>
              </AnimatePresence>
            </Router>
            </NotificationProvider>
          </OrderProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
