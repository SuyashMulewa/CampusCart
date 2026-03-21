/**
 * Page component for the L is ti ng sP ag e route and related page-level interactions.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, 
  TrendingUp, 
  Gavel, 
  Edit, 
  Trash2, 
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UserSidebar from '@/components/UserSidebar';
import { useCategories, useCurrentUser, useDeleteListing, useMyListings } from '@/state';
import { styledToast } from '@/utils/styledToast';
import { isUserFullyVerified } from '@/utils/profileVerification';

const tabs = ['Pending', 'Sold'];
const INITIAL_VISIBLE = 6;

export default function ListingsPage() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const { data: categories = [] } = useCategories();
  const deleteListingMutation = useDeleteListing();
  const [activeTab, setActiveTab] = useState('Pending');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const { data: listings = [] } = useMyListings();

  const normalizedStatus = (status?: string) => (status || 'active').toLowerCase();
  const filteredListings = useMemo(() => {
    if (activeTab === 'Sold') {
      return listings.filter((listing) => normalizedStatus(listing.status) === 'sold');
    }
    return listings.filter((listing) => normalizedStatus(listing.status) !== 'sold');
  }, [activeTab, listings]);

  const visibleListings = filteredListings.slice(0, visibleCount);

  const stats = useMemo(() => {
    const soldListings = listings.filter((listing) => normalizedStatus(listing.status) === 'sold');
    const pendingListings = listings.filter((listing) => normalizedStatus(listing.status) !== 'sold');
    return {
      active: listings.length,
      earnings: soldListings.reduce((sum, listing) => sum + (listing.price || 0), 0),
      pendingBids: pendingListings.length,
    };
  }, [listings]);

  const resolveCategoryName = (categoryValue: string) => {
    const category = categories.find((cat) => cat.id === categoryValue || cat.name === categoryValue);
    return category?.name || categoryValue;
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this listing?');
    if (!confirmed) return;

    try {
      await deleteListingMutation.mutateAsync(id);
      styledToast.success('Listing deleted', 'Your listing has been removed.');
    } catch (error) {
      console.error('Failed to delete listing:', error);
      styledToast.error('Delete failed', 'Could not delete the listing. Please try again.');
    }
  };

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [activeTab]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => {
            if (prev >= filteredListings.length) return prev;
            return prev + INITIAL_VISIBLE;
          });
        }
      },
      { rootMargin: '120px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredListings.length]);

  const handleCreateListing = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (!isUserFullyVerified(user)) {
      styledToast.warning('Verification required', 'Complete profile verification to sell products.');
      navigate('/profile');
      return;
    }

    navigate('/create-listing');
  };

  const conditionColors = {
    'New': 'bg-green-500',
    'Good': 'bg-amber-500',
    'Fair': 'bg-gray-500',
  };
  // Helper to map any removed/unknown condition to 'Fair'
  const getConditionKey = (condition: string) => {
    if (condition === 'New' || condition === 'Good' || condition === 'Fair') return condition;
    return 'Fair';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          <UserSidebar activeItem="listings" />
          
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
                  <p className="text-gray-500">Manage and track your listed products.</p>
                </div>
                <Button onClick={handleCreateListing} className="bg-[#F5B800] hover:bg-[#E5A800]">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Listing
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {/* Active Listings */}
                <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <Package className="w-6 h-6 text-blue-600 bg-blue-100 rounded-lg p-1" />
                    <span className="text-sm font-medium text-gray-900">Total Listings</span>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-gray-900">{stats.active}</span>
                  </div>
                </div>
                {/* Total Earnings */}
                <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-6 h-6 text-green-600 bg-green-100 rounded-lg p-1" />
                    <span className="text-sm font-medium text-gray-900">Total Earnings</span>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-gray-900">₹{stats.earnings.toLocaleString()}</span>
                  </div>
                </div>
                {/* Pending Bids */}
                <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <Gavel className="w-6 h-6 text-amber-600 bg-amber-100 rounded-lg p-1" />
                    <span className="text-sm font-medium text-gray-900">Pending Bids</span>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-gray-900">{stats.pendingBids}</span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        activeTab === tab
                          ? 'bg-gray-900 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500">Showing {visibleListings.length} of {filteredListings.length} listings</p>
              </div>

              {/* Listings Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleListings.map((listing, index) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl border border-gray-100 overflow-hidden"
                  >
                    <Link to={`/product/${listing.id}`} className="block relative aspect-square">
                      <img
                        src={listing.image}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                      <Badge className={`absolute top-2 left-2 ${conditionColors[getConditionKey(listing.condition)]} text-white text-xs`}>
                        {getConditionKey(listing.condition).toUpperCase()}
                      </Badge>
                    </Link>
                    <div className="p-4">
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs mb-3">
                        {resolveCategoryName(listing.category).toUpperCase()}
                      </Badge>
                      <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">{listing.title}</h3>
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-bold text-xl text-gray-900">₹{listing.price.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/create-listing?edit=${listing.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Edit className="w-4 h-4 mr-0" />
                            Edit
                          </Button> 
                        </Link>
                        <Link to={`/listings/${listing.id}/bids`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full hover:bg-yellow-400 text-yellow-600 border-yellow-300">
                            <Gavel className="w-4 h-4 mr-0" />
                            View Bids
                          </Button>
                        </Link>
                        <div className="flex-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full hover:bg-red-600 text-red-500 border-red-300"
                            onClick={() => handleDelete(listing.id)}
                            disabled={deleteListingMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 mr-0" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredListings.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  {activeTab === 'Sold' ? 'No sold listings yet.' : 'No pending listings yet.'}
                </div>
              )}

              <div ref={sentinelRef} className="h-1" aria-hidden="true" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

