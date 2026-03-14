/**
 * Seller profile page.
 * Migrated to use TanStack Query hooks via @/state.
 */
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Star, 
  CheckCircle, 
  MapPin, 
  Calendar, 
  MessageCircle,
  Shield,
  ThumbsUp,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/ProductCard';
import { useUserProfile, useListingsAsProducts } from '@/state';
import type { Product } from '@/data/mockData';

const reviews = [
  {
    id: 1,
    reviewer: 'Alex Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    rating: 5,
    date: '2 weeks ago',
    content: 'Great seller! Item was exactly as described and the meetup was smooth. Would definitely buy from again.',
    item: 'Calculus Textbook',
  },
  {
    id: 2,
    reviewer: 'Sarah Miller',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    rating: 5,
    date: '1 month ago',
    content: 'Very responsive and friendly. The headphones work perfectly!',
    item: 'Bluetooth Headphones',
  },
  {
    id: 3,
    reviewer: 'Jordan Blake',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan',
    rating: 4,
    date: '2 months ago',
    content: 'Good experience overall. Minor delay in meeting but the item was in great condition.',
    item: 'Scientific Calculator',
  },
];

export default function SellerProfilePage() {
  const { sellerId } = useParams<{ sellerId: string }>();
  const { data: sellerUser } = useUserProfile(sellerId ?? '');
  const { data: allProducts = [] } = useListingsAsProducts();
  const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings');

  // Derive seller & their products from query data
  const seller = sellerUser ?? {
    id: sellerId ?? '',
    name: 'Unknown Seller',
    email: '',
    avatar: '',
    university: '',
    rating: 0,
    isVerified: false,
    joinedDate: '',
  };
  const sellerProducts = allProducts.filter((p: Product) => p.seller.id === sellerId).slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-100 p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={seller.avatar} />
              <AvatarFallback className="text-3xl">{seller.name[0]}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{seller.name}</h1>
                {seller.isVerified && (
                  <Badge className="bg-blue-100 text-blue-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              
              <p className="text-gray-600 mb-3">{seller.university}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-[#F5B800] fill-[#F5B800]" />
                  <span className="font-medium">{seller.rating}</span>
                  <span className="text-gray-400">({seller.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span>On Campus</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date(seller.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Link to={`/messages?seller=${seller.id}`}>
                <Button className="bg-[#F5B800] hover:bg-[#E5A800]">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">24</p>
              <p className="text-sm text-gray-500">Items Sold</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">12</p>
              <p className="text-sm text-gray-500">Active Listings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">&lt; 1hr</p>
              <p className="text-sm text-gray-500">Response Time</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('listings')}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'listings'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Listings
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'reviews'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Reviews ({reviews.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'listings' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {sellerProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl border border-gray-100 p-6"
              >
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={review.avatar} />
                    <AvatarFallback>{review.reviewer[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{review.reviewer}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'text-[#F5B800] fill-[#F5B800]'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-400">{review.date}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-gray-100">
                        <Package className="w-3 h-3 mr-1" />
                        {review.item}
                      </Badge>
                    </div>
                    <p className="text-gray-600">{review.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Trust Badges */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Verified Student</p>
            <p className="text-sm text-gray-500">Email confirmed</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <ThumbsUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Reliable Seller</p>
            <p className="text-sm text-gray-500">20+ sales</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <MessageCircle className="w-8 h-8 text-[#F5B800] mx-auto mb-2" />
            <p className="font-medium text-gray-900">Quick Responder</p>
            <p className="text-sm text-gray-500">Usually responds in 1 hour</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <Star className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Top Rated</p>
            <p className="text-sm text-gray-500">4.8+ rating</p>
          </div>
        </div>
      </div>
    </div>
  );
}

