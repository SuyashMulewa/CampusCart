/**
 * Homepage — main marketplace landing.
 * Migrated to use TanStack Query hooks via @/state.
 */
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight, 
  TrendingUp, 
  Clock, 
  Star,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';
import { styledToast } from '@/utils/styledToast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/ProductCard';
import CategoryCard from '@/components/CategoryCard';
import ProfileCompletionBanner from '@/components/ProfileCompletionBanner';
import { useListingsAsProducts, useCategories, useCurrentUser } from '@/state';
import { isUserFullyVerified } from '@/utils/profileVerification';

export default function HomePage() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const { data: allProducts = [], isLoading: listingsLoading } = useListingsAsProducts();
  const { data: categoriesData = [] } = useCategories();
  const freshListings = allProducts.slice(0, 4);
  const location = useLocation();

  /* ── Review Panel state (arrives via location.state from QuickChatDialog) ── */
  const [showReview, setShowReview] = useState(false);
  const [reviewPeer, setReviewPeer] = useState<{ name: string; avatar: string; price?: number } | null>(null);
  const [reviewRating, setReviewRating] = useState(0);

  useEffect(() => {
    const state = location.state as { showReview?: boolean; reviewPeer?: { name: string; avatar: string; price?: number } } | null;
    if (state?.showReview && state.reviewPeer) {
      setReviewPeer(state.reviewPeer);
      setReviewRating(0);
      setShowReview(true);
      // Clear the state so it doesn't re-trigger on refresh / back-navigation
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const handleStartSelling = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (!isUserFullyVerified(user)) {
      styledToast.warning('Verification required', 'Complete profile verification to sell products.');
      navigate('/profile');
      return;
    }

    navigate('/create-listing');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Completion Banner — shown only when profile is incomplete */}
      <ProfileCompletionBanner />

      {/* Hero Section */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="bg-[#F5B800]/10 text-[#F5B800] hover:bg-[#F5B800]/20 mb-4">
                <Star className="w-3 h-3 mr-1" />
                Trusted by Many students
              </Badge>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
                Better for your{' '}
                <span className="text-[#F5B800]">GPA.</span>
                <br />
                Better for the{' '}
                <span className="text-[#71b55a]">Planet.</span>
              </h1>
              
              <p className="text-lg text-gray-600 mb-6 max-w-lg">
                Buy and sell textbooks, lab kits, and dorm essentials within your campus community.
              </p>

              {/* Quick Stats */}
              <div className="flex gap-6 mt-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-green-600" />
                  </div>
                  <span>Thousands of Items Sold</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <span>Get Instant Buyers</span>
                </div>
              </div>
            </motion.div>

            {/* Right Content - Hero Image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative rounded-2xl overflow-hidden">
                <img
                  src="images/heroimage.jpeg"
                  alt="Library"
                  className="w-full h-auto object-cover"
                />
              </div>

              {/* Floating Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Save up to 50%</p>
                    <p className="text-xs text-gray-500">on study resources</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Browse Categories</h2>
            <Link to="/searchresultspage" className="flex items-center gap-1 text-[#F5B800] font-medium hover:underline">
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categoriesData.map((category, index) => (
              <CategoryCard
                key={category.id}
                id={category.id}
                name={category.name}
                icon={category.icon}
                delay={index * 0.05} listings={category.listings ?? ''}              />
            ))}
          </div>
        </div>
      </section>

      {/* Fresh Listings */}
      <section className="py-12 pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Freshly Listed</h2>
              <p className="text-sm text-gray-500">New items from your campus</p>
            </div>
            <Link to="/search?sort=newest" className="flex items-center gap-1 text-[#F5B800] font-medium hover:underline">
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {freshListings.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}

            {!listingsLoading && freshListings.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-gray-300 bg-white py-10 text-center text-gray-500">
                No products yet listed
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 lg:p-12 overflow-hidden relative"
          >
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-center lg:text-left">
                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3">
                  Finished with your semester?
                </h2>
                <p className="text-gray-300 max-w-lg">
                  Don&apos;t let your valuable resources gather dust. Convert your used textbooks and electronics into cash.
                </p>
              </div>
              <Link to="/create-listing">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStartSelling}
                  className="flex items-center gap-2 px-8 py-4 bg-[#F5B800] hover:bg-[#E5A800] text-white font-semibold rounded-xl transition-colors whitespace-nowrap"
                >
                  Start Selling Now
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
            </div>

            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F5B800]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </section>

      {/* ── Review Panel Popup ── */}
      {showReview && reviewPeer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]">
          <div className="bg-white w-full max-w-md rounded-2xl border border-gray-100 shadow-2xl p-8 flex flex-col gap-6">
            {/* Header: Paid amount (left) + Skip (right) */}
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-black">
                Paid: ₹{reviewPeer.price ?? '–'}
              </p>
              <button
                className="text-sm font-semibold text-gray-500 hover:text-black transition-colors px-3 py-1 rounded-lg hover:bg-gray-100"
                onClick={() => setShowReview(false)}
              >
                Skip
              </button>
            </div>

            {/* Seller avatar + name */}
            <div className="flex flex-col items-center gap-3">
              <img
                src={reviewPeer.avatar}
                alt={reviewPeer.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-[#EBB50B] shadow-md"
              />
              <p className="text-base font-bold text-gray-900">{reviewPeer.name}</p>
            </div>

            {/* 5 Star Rating */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setReviewRating(s)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      s <= reviewRating
                        ? 'fill-[#EBB50B] text-[#EBB50B]'
                        : 'fill-none text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Submit */}
            <Button
              className="w-full bg-[#71B55A] hover:brightness-105 text-white py-4 rounded-xl font-bold text-base transition-all"
              disabled={reviewRating === 0}
              onClick={() => {
                styledToast.success('Review Submitted', 'Thank you for your feedback!', 3000);
                setShowReview(false);
              }}
            >
              Submit Review
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
