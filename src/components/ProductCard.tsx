/**
 * Reusable app component: P ro du ct Ca rd.
 */
import { useState, type MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MapPin, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AddToCartButton } from '@/components/AddToCartButton';
import type { Product } from '@/data/mockData';
import { useOrder } from '@/context/OrderContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCategories, useCurrentUser } from '@/state';

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact' | 'horizontal';
  showAddToCart?: boolean;
}

export default function ProductCard({ 
  product, 
  variant = 'default',
  showAddToCart = true 
}: ProductCardProps) {
  const [, setImageLoaded] = useState(false);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const navigate = useNavigate();
  const { isProductPending } = useOrder();
  const { data: categories = [] } = useCategories();
  const { data: currentUser } = useCurrentUser();

  const isWaitingForAcceptance = isProductPending(product.id);
  const isSellerView = !!currentUser && currentUser.id === product.seller.id;

  const handleWaitingClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    navigate('/orders');
  };

  const handleSeeMyListings = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    navigate('/listings');
  };

  const isFavorited = isInWishlist(product.id);
  const resolvedCategory = categories.find((cat) => cat.id === product.category || cat.name === product.category)?.name
    || product.category
    || 'Uncategorized';
  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleToggleWishlist = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const conditionColors = {
    'New': 'bg-green-500',
    'Good': 'bg-amber-500',
    'Fair': 'bg-gray-500',
  };
  const conditionLabels = {
    'New': 'NEW',
    'Good': 'GOOD',
    'Fair': 'FAIR',
  };
  // Helper to map any removed/unknown condition to 'Fair'
  const getConditionKey = (condition: string) => {
    if (condition === 'New' || condition === 'Good' || condition === 'Fair') return condition;
    return 'Fair';
  };
  if (variant === 'horizontal') {
    return (
      <Link to={`/product/${product.id}`}>
        <motion.div
          whileHover={{ y: -2 }}
          className="flex gap-4 bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow"
        >
          <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover"
              onLoad={() => setImageLoaded(true)}
            />
            <Badge className={`absolute top-1.5 left-1.5 ${conditionColors[getConditionKey(product.condition)]} text-white text-[10px] font-bold px-1.5 py-0.5`}>
              {conditionLabels[getConditionKey(product.condition)]}
            </Badge>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">{product.title}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{product.location}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
              {showAddToCart && (
                isSellerView ? (
                  <Button
                    type="button"
                    onClick={handleSeeMyListings}
                    size="sm"
                    className="text-xs px-3 py-1 text-gray-700 border border-gray-200 bg-gray-50 hover:bg-gray-100"
                  >
                    See My Listings
                  </Button>
                ) : isWaitingForAcceptance ? (
                  <Button
                    type="button"
                    onClick={handleWaitingClick}
                    size="sm"
                    className="text-xs px-3 py-1 text-gray-700 border border-gray-200 bg-gray-50 hover:bg-gray-100"
                  >
                    Waiting for acceptance
                  </Button>
                ) : (
                  <AddToCartButton
                    product={product}
                    size="sm"
                    className="bg-[#F5B800] hover:bg-[#E5A800] text-white"
                    aria-label="Add to Cart"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </AddToCartButton>
                )
              )}
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link to={`/product/${product.id}`}>
        <motion.div
          whileHover={{ y: -4 }}
          className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all"
        >
          <div className="relative aspect-square overflow-hidden bg-gray-100">
            <motion.img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onLoad={() => setImageLoaded(true)}
            />
            <Badge className={`absolute top-2 left-2 ${conditionColors[getConditionKey(product.condition)]} text-white text-xs font-bold px-2 py-1`}>
              {conditionLabels[getConditionKey(product.condition)]}
            </Badge>
            <button
              onClick={handleToggleWishlist}
              className="absolute top-2 right-2 p-0 bg-transparent hover:bg-transparent transition-colors"
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
            </button>
          </div>
          <div className="p-3">
            <h3 className="font-medium text-gray-900 line-clamp-2 text-sm mb-1">{product.title}</h3>
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {product.location.split(',')[0]}
              </span>
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  // Default variant
  return (
    <Link to={`/product/${product.id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all h-full flex flex-col"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <motion.img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onLoad={() => setImageLoaded(true)}
          />
          <Badge className={`absolute top-3 left-3 ${conditionColors[getConditionKey(product.condition)]} text-white text-xs font-bold px-2 py-1`}>
            {conditionLabels[getConditionKey(product.condition)]}
          </Badge>
          <button
            onClick={handleToggleWishlist}
            className="absolute top-3 right-3 p-0 bg-transparent hover:bg-transparent transition-colors"
          >
            <Heart className={`w-5 h-5 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
          </button>
        </div>
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-100">
              {resolvedCategory.toUpperCase()}
            </Badge>
          </div>
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 flex-1">{product.title}</h3>
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{product.location}</span>
          </div>
          <div className="flex items-center justify-between mt-auto">
            <div>
              <span className="text-xl font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
              {product.originalPrice && (
                <span className="text-sm text-gray-400 line-through ml-2">
                  ₹{product.originalPrice.toLocaleString()}
                </span>
              )}
              {discountPercent > 0 && (
                <Badge className="ml-2 bg-green-100 text-green-700 hover:bg-green-100 text-xs font-semibold">
                  {discountPercent}% OFF
                </Badge>
              )}
            </div>
          </div>
          {showAddToCart && (
            isSellerView ? (
              <Button
                type="button"
                onClick={handleSeeMyListings}
                className="w-full mt-3 bg-gray-200 text-gray-700 font-semibold py-3"
              >
                See My Listings
              </Button>
            ) : isWaitingForAcceptance ? (
              <Button
                type="button"
                onClick={handleWaitingClick}
                className="w-full mt-3 bg-gray-200 text-gray-700 font-semibold py-3"
              >
                Waiting for acceptance
              </Button>
            ) : (
              <AddToCartButton
                product={product}
                className="w-full mt-3 bg-[#F5B800] hover:bg-[#E5A800] text-white font-semibold"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </AddToCartButton>
            )
          )}
        </div>
      </motion.div>
    </Link>
  );
}

