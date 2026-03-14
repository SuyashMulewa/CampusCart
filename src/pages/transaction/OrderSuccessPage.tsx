/**
 * Page component for the O rd er Su cc es sP ag e route and related page-level interactions.
 */
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, MessageCircle, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OrderSuccessPage() {
  const { id } = useParams();
  useEffect(() => {
    // Scroll to top
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-12 h-12 text-green-500" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-gray-900 mb-3"
        >
          Order Confirmed!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mb-8"
        >
          Your order has been placed successfully. The seller will contact you to arrange the meetup.
        </motion.p>

        {/* Order Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl border border-gray-100 p-6 mb-8"
        >
          <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
            <Package className="w-5 h-5" />
            <span className="font-medium">Order #{id ? id : 'CC-89234'}</span>
          </div>
          
          <div className="space-y-3 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Meetup Location</span>
              <span className="text-gray-900 font-medium">Student Union</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Payment Method</span>
              <span className="text-gray-900 font-medium">Pay on Meetup</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Estimated Time</span>
              <span className="text-gray-900 font-medium">Within 2 days</span>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          <Link to="/orders">
            <Button className="w-full bg-[#F5B800] hover:bg-[#E5A800] text-white font-semibold py-6">
              <Package className="w-5 h-5 mr-2" />
              View My Orders
            </Button>
          </Link>
          
          <div className="grid grid-cols-2 gap-3">
            <Link to="/messages">
              <Button variant="outline" className="w-full py-5">
                <MessageCircle className="w-5 h-5 mr-2" />
                Messages
              </Button>
            </Link>
            <Link to="/home">
              <Button variant="outline" className="w-full py-5">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Eco Impact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 p-4 bg-green-50 rounded-xl"
        >
          <p className="text-sm text-green-700">
            <span className="font-semibold">Great job!</span> By buying used, you&apos;ve helped reduce waste and saved money.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

