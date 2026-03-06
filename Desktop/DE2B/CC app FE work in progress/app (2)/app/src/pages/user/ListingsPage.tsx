/**
 * Page component for the L is ti ng sP ag e route and related page-level interactions.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, 
  TrendingUp, 
  Gavel, 
  Edit, 
  Trash2, 
  ChevronRight,
  Grid3X3,
  List,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UserSidebar from '@/components/UserSidebar';
import { myListings } from '@/data/mockData';

export default function ListingsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [listings, setListings] = useState(myListings);

  const stats = {
    active: 24,
    earnings: 3200,
    pendingBids: 18,
  };

  const handleDelete = (id: string) => {
    setListings(prev => prev.filter(l => l.id !== id));
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
                  <p className="text-gray-500">Manage and track your listed campus items</p>
                </div>
                <Link to="/create-listing">
                  <Button className="bg-[#F5B800] hover:bg-[#E5A800]">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Listing
                  </Button>
                </Link>
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

              {/* View Toggle */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                  >
                    <Grid3X3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-500">Showing {listings.length} of 24 listings</p>
              </div>

              {/* Listings Grid */}
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                {listings.map((listing, index) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-white rounded-xl border border-gray-100 overflow-hidden ${
                      viewMode === 'list' ? 'flex gap-4 p-4' : ''
                    }`}
                  >
                    <div className={`relative ${viewMode === 'list' ? 'w-32 h-32' : 'aspect-square'}`}>
                      <img
                        src={listing.image}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                      <Badge className={`absolute top-2 left-2 ${conditionColors[getConditionKey(listing.condition)]} text-white text-xs`}>
                        {getConditionKey(listing.condition).toUpperCase()}
                      </Badge>
                    </div>
                    <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                      <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">{listing.title}</h3>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs mb-3">
                        {listing.category.toUpperCase()}
                      </Badge>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs text-gray-400">Negotiated Price</p>
                          <p className="font-bold text-gray-900">₹{listing.price}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Current Price</p>
                          <p className="font-bold text-gray-900">₹{listing.price}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/create-listing?edit=${listing.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Link to={`/listings/${listing.id}/bids`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Gavel className="w-4 h-4 mr-1" />
                            View Bids
                          </Button>
                        </Link>
                        <button
                          onClick={() => handleDelete(listing.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <Link to={`/product/${listing.id}`}>
                          <button className="p-2 bg-[#F5B800] text-white rounded-lg hover:bg-[#E5A800] transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Load More */}
              <div className="text-center mt-8">
                <Button variant="outline" className="gap-2">
                  Load More
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

