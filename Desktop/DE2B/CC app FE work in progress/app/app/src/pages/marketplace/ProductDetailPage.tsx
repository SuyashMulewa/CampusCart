/**
 * Page component for the P ro du ct De ta il Pa ge route and related page-level interactions.
 */
import { useState, type ChangeEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronRight, 
  MapPin, 
  Heart, 
  ShoppingCart, 
  CheckCircle,
  Shield,
  Star,
  ArrowLeft,
  Edit,
  Gavel,
  CreditCard,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ProductCard from '@/components/ProductCard';
import { AddToCartButton } from '@/components/AddToCartButton';
import type { Product } from '@/data/mockData';
import { useCurrentUser, useListingsAsProducts, useMyBids, usePlaceBid } from '@/state';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useOrder } from '@/context/OrderContext';
import { styledToast } from '@/utils/styledToast';
import { isUserFullyVerified } from '@/utils/profileVerification';

const CATEGORY_META: Record<string, { label: string; slug: string }> = {
  textbook: { label: 'Textbooks', slug: 'textbooks' },
  textbooks: { label: 'Textbooks', slug: 'textbooks' },
  electronics: { label: 'Electronics', slug: 'electronics' },
  essentials: { label: 'Dorm Essentials', slug: 'dorm-essentials' },
  dorm: { label: 'Dorm Essentials', slug: 'dorm-essentials' },
  'dorm furniture': { label: 'Dorm Essentials', slug: 'dorm-essentials' },
  'dorm essentials': { label: 'Dorm Essentials', slug: 'dorm-essentials' },
  'lab kit': { label: 'Lab Kits', slug: 'lab-kits' },
  'lab kits': { label: 'Lab Kits', slug: 'lab-kits' },
  stationery: { label: 'Stationery', slug: 'stationery' },
  stationary: { label: 'Stationery', slug: 'stationery' },
};

function normalizeCategoryKey(value: string): string {
  return value.toLowerCase().trim().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');
}

function getCategoryDisplayLabel(value: string): string {
  const normalized = normalizeCategoryKey(value);
  return CATEGORY_META[normalized]?.label || value;
}

function getCategoryHref(value: string): string {
  const normalized = normalizeCategoryKey(value);
  const slug = CATEGORY_META[normalized]?.slug || normalized.replace(/\s+/g, '-');
  return `/category/${slug}`;
}

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { removeFromCart } = useCart();
  const { data: user } = useCurrentUser();
  const { data: allProducts = [] } = useListingsAsProducts();
  const { data: myBids = [] } = useMyBids();
  const placeBidMutation = usePlaceBid();

  const product = allProducts.find((p: Product) => p.id === productId) ?? null;
  const similarProducts = product
    ? allProducts.filter((p: Product) => p.category === product.category && p.id !== product.id).slice(0, 4)
    : [];

  const [selectedImage, setSelectedImage] = useState(0);
  const [isAgreementOpen, setIsAgreementOpen] = useState(false);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const { addPendingOrder, isProductPending } = useOrder();
  const canBuySell = isUserFullyVerified(user);

  const hasPendingBid = product ? myBids.some((bid) => bid.listingId === product.id && bid.status === 'pending') : false;
  const isWaitingForAcceptance = product ? isProductPending(product.id) || hasPendingBid : false;
  const currentUserId = user?.id || localStorage.getItem('campuscart_current_user_id') || sessionStorage.getItem('campuscart_current_user_id');

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Product not found</h2>
          <Link to="/home">
            <Button className="bg-[#F5B800] hover:bg-[#E5A800]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isSellerView = currentUserId === product.seller.id;

  const handleSubmitBid = () => {
    if (!product) return;
    addPendingOrder(product);
    removeFromCart(product.id);
    setIsAgreementOpen(false);
  };

  const handleBidButtonClick = () => {
    if (!canBuySell) {
      styledToast.warning('Verification required', 'Complete profile verification to bid on products.');
      navigate('/profile');
      return;
    }

    if (isWaitingForAcceptance) {
      navigate('/orders');
      return;
    }
    setIsBidModalOpen(true);
  };

  const handleBidSubmit = async () => {
    if (!product) return;

    const parsedBidAmount = Number(bidAmount.replace(/,/g, '').trim());
    if (!Number.isFinite(parsedBidAmount)) {
      styledToast.error('Invalid amount', 'Please enter a valid bid amount.');
      return;
    }

    if (parsedBidAmount < minimumBidValue) {
      styledToast.error('Bid too low', `Minimum allowed bid is ₹${minimumBidLabel}.`);
      return;
    }

    if (parsedBidAmount > maximumBidValue) {
      styledToast.error('Bid too high', `Maximum allowed bid is ₹${maximumBidLabel}.`);
      return;
    }

    try {
      await placeBidMutation.mutateAsync({
        listingId: product.id,
        amount: parsedBidAmount,
        isBuyNow: false,
      });
      removeFromCart(product.id);
      setIsBidModalOpen(false);
      setBidAmount('');
      styledToast.success('Bid submitted', 'Your bid has been sent to the seller.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not submit bid. Please try again.';
      styledToast.error('Bid failed', message);
    }
  };

  const handleBidCancel = () => {
    setIsBidModalOpen(false);
    setBidAmount('');
  };

  const handleBidInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setBidAmount(event.target.value);
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

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  const minimumBidValue = product.negotiableMinPrice ?? product.price;
  const minimumBidLabel = minimumBidValue.toLocaleString('en-IN');
  const maximumBidValue = (product.mrp ?? product.originalPrice ?? product.price);
  const maximumBidLabel = maximumBidValue.toLocaleString('en-IN');
  const categoryDisplayLabel = getCategoryDisplayLabel(product.category);
  const breadcrumbCategoryHref = getCategoryHref(product.category);
  
  const formatItemAge = (rawValue: string): string | null => {
    if (!rawValue) return null;
    
    // Check if it's in DD-M-YYYY date format (e.g., "10-1-2026")
    const dateMatch = rawValue.match(/^\d{1,2}-\d{1,2}-\d{4}$/);
    if (dateMatch) {
      // Skip old date format - don't display
      return null;
    }
    
    // Format the age option (e.g., "3 months" -> "3 Months Old")
    return rawValue
      .split(' ')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ') + ' Old';
  };
  
  const rawPurchaseAge = (product.specifications?.['Date of Purchase'] ?? '') as string;
  const itemAgeLabel = formatItemAge(rawPurchaseAge);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/home" className="hover:text-[#F5B800]">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to={breadcrumbCategoryHref} className="hover:text-[#F5B800]">
            {categoryDisplayLabel}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium truncate max-w-xs">{product.title}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Left - Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="relative aspect-square bg-white rounded-2xl overflow-hidden border border-gray-100">
              <img
                src={product.images?.[selectedImage] || product.image}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              <Badge className={`absolute top-3 left-3 ${conditionColors[getConditionKey(product.condition)]} text-white`}>
                {getConditionKey(product.condition)}
              </Badge>
              <button
                onClick={() => toggleWishlist(product)}
                className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
              >
                <Heart className={`w-6 h-6 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
              </button>
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors ${
                      selectedImage === idx ? 'border-[#F5B800]' : 'border-gray-200'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Right - Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Title & Condition */}
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                  {categoryDisplayLabel}
                </Badge>
                {itemAgeLabel && (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                    {itemAgeLabel}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
              <div className="flex items-center gap-2 text-gray-500">
                <MapPin className="w-4 h-4" />
                <span>{product.location}</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
              {product.originalPrice && (
                <>
                  <span className="text-xl text-gray-400 line-through">₹{product.originalPrice.toLocaleString()}</span>
                  <Badge className="bg-green-100 text-green-700">{discount}% OFF</Badge>
                </>
              )}
            </div>

            {/* Actions */}
            {isSellerView ? (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Link to={`/create-listing?edit=${product.id}`} className="flex-1">
                    <Button className="w-full bg-green-500 text-white hover:bg-green-600 font-semibold py-6">
                      <Edit className="w-5 h-5 mr-2" />
                      Edit Details
                    </Button>
                  </Link>
                  <Link to={`/listings/${product.id}/bids`} className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full border-2 border-[#F5B800] text-[#F5B800] hover:bg-[#F5B800] hover:text-white font-semibold py-6"
                    >
                      <Gavel className="w-5 h-5 mr-2" />
                      View Bids
                    </Button>
                  </Link>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-2 border-[#F5B800] text-[#F5B800] hover:bg-[#F5B800] hover:text-white font-semibold py-5"
                  onClick={() => navigate('/listings')}
                >
                  See My Listings
                </Button>
              </div>
            ) : isWaitingForAcceptance ? (
              <Button
                onClick={() => navigate('/orders')}
                className="w-full bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold py-6"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Waiting for Acceptance
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleBidButtonClick}
                  className="flex-1 border-2 border-[#F5B800] text-[#F5B800] hover:bg-[#F5B800] hover:text-white font-semibold py-6"
                >
                  <Gavel className="w-5 h-5 mr-2" />
                  Bid
                </Button>
                <AddToCartButton
                  product={product}
                  variant="outline"
                  className="flex-1 border-2 border-[#F5B800] text-[#F5B800] hover:bg-[#F5B800] hover:text-white font-semibold py-6"
                />
              </div>
            )}

            {/* Seller Info */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm text-gray-500 mb-3">Seller Info</p>
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={product.seller.avatar} />
                  <AvatarFallback>{product.seller.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{product.seller.name}</span>
                    {product.seller.isVerified && (
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{product.seller.university}</p>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 text-[#F5B800] fill-[#F5B800]" />
                    <span className="font-medium">{product.seller.rating}</span>
                    <span className="text-gray-400">({product.seller.reviewCount} reviews)</span>
                  </div>
                </div>
                <Link to={`/seller/${product.seller.id}`}>
                  <Button variant="outline" size="sm">View Profile</Button>
                </Link>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>


            {/* Safety Tips */}
            <div className="bg-amber-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900">Safety Tip</p>
                  <p className="text-sm text-amber-700">
                    Meet in a public campus location and inspect the item before making payment.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Similar Items */}
        {similarProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Similar Items</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((p, index) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
      {isAgreementOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" aria-hidden="true" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-[480px] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl overflow-hidden">
              <button
                type="button"
                aria-label="Close agreement"
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                onClick={() => setIsAgreementOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
              <div className="p-8">
                <div className="flex flex-col gap-6">
                  <div className="space-y-2 pr-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                      You agree to the listed price
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      By proceeding, you are confirming a purchase for this item at the seller&apos;s requested price.
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-lg p-5 flex items-center justify-between border border-slate-100 dark:border-zinc-700">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Price
                      </span>
                      <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                        ₹{product.price.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <CreditCard className="text-primary" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 py-2 border-t border-slate-100 dark:border-zinc-800 pt-4">
                    <div className="h-10 w-10 rounded bg-slate-200 overflow-hidden">
                      <img
                        src={product.images?.[0] || product.image}
                        alt={product.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                        {product.title}
                      </span>
                      <span className="text-xs text-slate-400 truncate">
                        Listed by {product.seller.name} • {product.seller.university}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSubmitBid}
                      className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <Gavel className="text-xl" />
                      <span>Submit Bid</span>
                    </button>
                    <p className="text-center text-[11px] text-slate-400 mt-4 px-6 leading-relaxed">
                      Please wait till the seller accepts your bid.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {isBidModalOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 dark:bg-black/60"
            aria-hidden="true"
            onClick={handleBidCancel}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-[480px] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden border border-slate-100 dark:border-slate-800">
              <div className="px-8 pt-8 pb-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-poppins text-center">
                  Propose a Price
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm text-center mt-2">
                  Submit your bid for this product.
                </p>
              </div>
              <div className="px-8 py-6 space-y-6">
                <div className="space-y-2">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Current Price</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">₹{product.price.toLocaleString('en-IN')}</p>
                  </div>
                  <label
                    className="block text-lg font-semibold text-slate-700 dark:text-slate-300 ml-1"
                    htmlFor="bid-amount"
                  >
                    Your Bid Amount
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <span className="text-slate-900 dark:text-slate-100 font-semibold text-xl">₹</span>
                    </div>
                    <input
                      id="bid-amount"
                      name="bid-amount"
                      type="text"
                      value={bidAmount}
                      onChange={handleBidInputChange}
                      placeholder="0.00"
                      className="block w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-xl font-bold text-slate-900 dark:text-white focus:ring-primary focus:border-primary transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-3 px-1">
                    <span className="material-symbols-outlined text-red-500 text-xl">*</span>
                    <p className="text-lg font-medium text-red-500 dark:text-red-400">
                      Minimum price limit set by seller:
                      <span className="text-red-500 dark:text-red-600 text-lg font-medium"> ₹{minimumBidLabel}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <span className="material-symbols-outlined text-red-500 text-xl">*</span>
                    <p className="text-lg font-medium text-red-500 dark:text-red-400">
                      Maximum bid limit (MRP):
                      <span className="text-red-500 dark:text-red-600 text-lg font-medium"> ₹{maximumBidLabel}</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-8 pb-10 pt-2">
                <button
                  type="button"
                  onClick={handleBidSubmit}
                  disabled={placeBidMutation.isPending}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {placeBidMutation.isPending ? 'Submitting...' : 'Submit Bid'}
                </button>
                <button
                  type="button"
                  onClick={handleBidCancel}
                  className="w-full mt-4 bg-transparent text-slate-500 dark:text-slate-400 font-medium py-2 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

