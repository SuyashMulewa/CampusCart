/**
 * Page component for the C ar tP ag e route and related page-level interactions.
 */

import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  Trash2, 
  MapPin, 
  ArrowRight,
  Package,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { products } from '@/data/mockData';
import ProductCard from '@/components/ProductCard';
import { useState } from 'react';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeFromCart } = useCart();
  const { addToWishlist } = useWishlist();
  const frequentlyBought = products.slice(8, 12);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const selectedItem = items.find(item => item.product.id === selectedProductId);

  const handleSaveForLater = (product: typeof items[0]['product']) => {
    addToWishlist(product);
    removeFromCart(product.id);
    if (selectedProductId === product.id) setSelectedProductId(null);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Your Shopping Cart</h1>
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Looks like you haven&apos;t added anything yet.</p>
            <Link to="/home">
              <Button className="bg-[#F5B800] hover:bg-[#E5A800]">
                Start Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Shopping Cart</h1>
        <p className="text-gray-500 mb-6">{items.length} items</p>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <motion.div
                key={item.product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-xl border border-gray-100 p-4 ${selectedProductId === item.product.id ? 'border-green-500' : ''}`}
              >
                <div className="flex gap-4">
                  <input
                    type="radio"
                    name="selectedProduct"
                    checked={selectedProductId === item.product.id}
                    onChange={() => setSelectedProductId(item.product.id)}
                    className="accent-green-500 mt-2"
                  />
                  <Link to={`/product/${item.product.id}`}>
                    <img
                      src={item.product.image}
                      alt={item.product.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link to={`/product/${item.product.id}`}>
                          <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-[#F5B800] transition-colors">
                            {item.product.title}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            item.product.condition === 'New' || item.product.condition === 'Like New'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {item.product.condition}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{item.product.location}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          ₹{item.product.price.toLocaleString()}
                        </p>
                        {item.product.originalPrice && (
                          <p className="text-sm text-gray-400 line-through">
                            ₹{item.product.originalPrice.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveForLater(item.product)}
                          className="p-2 text-gray-500 hover:text-[#F5B800] hover:bg-[#F5B800]/10 rounded-lg transition-colors"
                        >
                          <Heart className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Frequently Bought Together */}
            <div className="mt-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Bought Together</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {frequentlyBought.map((product) => (
                  <ProductCard key={product.id} product={product} variant="compact" />
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
              {!selectedItem ? (
                <div className="text-center text-gray-500 py-12">Please select a product</div>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-gray-600">
                      <span>Price</span>
                      <span>₹{selectedItem.product.price.toLocaleString()}</span>
                    </div>
                    {selectedItem.product.originalPrice && (
                      <div className="flex justify-between text-green-600">
                        <span>Price Saved</span>
                        <span>-₹{(selectedItem.product.originalPrice - selectedItem.product.price).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-gray-100 pt-4 mb-6">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-gray-900">
                        ₹{selectedItem.product.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate(`/checkout?productId=${selectedItem.product.id}`)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-6"
                  >
                    Proceed to Checkout
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </>
              )}
              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
                <Package className="w-4 h-4" />
                <span>Peer-to-Peer Transaction</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

