/**
 * Page component for the O rd er sP ag e route and related page-level interactions.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, FileText, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UserSidebar from '@/components/UserSidebar';
import { useOrder } from '@/context/OrderContext';
import QuickChatDialog from '@/components/QuickChatDialog';
import type { ChatPeer, ProductInfo } from '@/components/QuickChatDialog';

const tabs = ['All Orders', 'Pending', 'Completed'];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('All Orders');
  const [showChat, setShowChat] = useState(false);
  const [chatPeer, setChatPeer] = useState<ChatPeer | null>(null);
  const [chatProductInfo, setChatProductInfo] = useState<ProductInfo | undefined>(undefined);

  const { orders, cancelOrder } = useOrder();
  // Defensive: ensure orders is an array
  const safeOrders = Array.isArray(orders) ? orders : [];
  let filteredOrders = safeOrders;
  if (activeTab === 'Pending') {
    filteredOrders = safeOrders.filter(order => order && order.status && ['pending', 'confirmed'].includes(order.status.toLowerCase()));
  } else if (activeTab === 'Completed') {
    filteredOrders = safeOrders.filter(order => order && order.status && order.status.toLowerCase() === 'completed');
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-700">Confirmed</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">Delivered</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">{status}</Badge>;
    }
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
          <UserSidebar activeItem="orders" />
          
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
                  <p className="text-gray-500">Track and manage your campus purchases</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                {tabs.map(tab => (
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

              {/* Orders List */}
              <div className="space-y-4">
                {filteredOrders.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    {activeTab === 'Pending' && 'No pending orders.'}
                    {activeTab === 'Completed' && 'No completed orders.'}
                    {activeTab === 'All Orders' && 'No orders found.'}
                  </div>
                )}
                {filteredOrders.map((order, index) => {
                  // Defensive: check nested data
                  if (!order || !order.product || !order.seller) return null;
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl border border-gray-100 p-4"
                    >
                      <div className="flex flex-col sm:flex-row gap-4">
                        <img
                          src={order.product.image || ''}
                          alt={order.product.title || 'Product'}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={`${conditionColors[getConditionKey(order.product.condition)]} text-white text-xs`}>
                                  {getConditionKey(order.product.condition).toUpperCase()}
                                </Badge>
                                <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs">
                                  {(order.product.category || '').toUpperCase()}
                                </Badge>
                              </div>
                              <h3 className="font-semibold text-gray-900">{order.product.title || 'Untitled'}</h3>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <div>
                                  <span className="text-gray-400">Meetup at:</span>
                                  <p className="text-gray-700">{order.meetupLocation || '-'}</p>
                                </div>
                                <div>
                                  <span className="text-gray-400">Seller:</span>
                                  <p className="text-gray-700">{order.seller.name || '-'}{order.seller.major ? ` (${order.seller.major})` : ''}</p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-gray-900">₹{order.agreedPrice ?? '-'}</p>
                              <p className="text-xs text-gray-400">Order #{order.id}</p>
                              {getStatusBadge(order.status)}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setChatPeer({
                                  id: order.seller.id || '',
                                  name: order.seller.name || 'Seller',
                                  avatar: order.seller.avatar || '',
                                  price: order.agreedPrice,
                                });
                                setShowChat(true);
                              }}
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Message Seller
                            </Button>
                            {order.status === 'pending' && (
                              <button
                                onClick={() => cancelOrder(order.id)}
                                className="px-3 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-full hover:bg-red-50 transition-colors"
                              >
                                Cancel Bid
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Load More */}
              <div className="text-center mt-8">
                <p className="text-sm text-gray-500 mb-4">Showing {filteredOrders.length} of {orders.length} orders</p>
                <Button variant="outline" className="gap-2">
                  Load More Orders
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Quick Chat Dialog (Buyer POV) */}
      {chatPeer ? (
        <QuickChatDialog
          open={showChat}
          onClose={() => { setShowChat(false); }}
          peer={chatPeer}
          perspective="buyer"
        />
      ) : null}
    </div>
  );
}

