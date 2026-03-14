/**
 * Page component for the O rd er sP ag e route and related page-level interactions.
 */
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UserSidebar from '@/components/UserSidebar';
import { useBuyerOrders, useCancelBid, useCancelOrder, useCurrentUser, useListingsAsProducts, useMeetup, useMyBids } from '@/state';
import QuickChatDialog from '@/components/QuickChatDialog';
import type { ChatPeer } from '@/components/QuickChatDialog';
import type { EnrichedOrder } from '@/services/order.service';
import { styledToast } from '@/utils/styledToast';

const tabs = ['Pending', 'Completed', 'All Orders'];
const INITIAL_VISIBLE_ORDERS = 6;

const conditionColors: Record<string, string> = {
  New: 'bg-green-500',
  Good: 'bg-amber-500',
  Fair: 'bg-gray-500',
};

const getConditionKey = (condition: string | undefined) => {
  if (condition === 'new') return 'New';
  if (condition === 'good') return 'Good';
  return 'Fair';
};

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

type OrderCardProps = {
  order: EnrichedOrder;
  index: number;
  isCancelling: boolean;
  onCancel: (orderId: string) => void;
  onMessageSeller: (order: EnrichedOrder) => void;
};

type PendingBidCardProps = {
  bidId: string;
  amount: number;
  listingTitle: string;
  listingImage: string;
  listingCategory: string;
  listingCondition: string;
  sellerName: string;
  sellerMajor?: string;
  onCancelBid: (bidId: string) => void;
  isCancellingBid: boolean;
};

function OrderCard({ order, index, isCancelling, onCancel, onMessageSeller }: OrderCardProps) {
  const { data: meetup } = useMeetup(order.id);

  if (!order || !order.listing || !order.seller) {
    return null;
  }

  const condition = getConditionKey(order.listing.condition);
  const canMessageSeller = Boolean(meetup && meetup.proposedBy === order.sellerId);
  const waitingMessage = 'Waiting for Seller to View';

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
          src={order.listing.image || ''}
          alt={order.listing.title || 'Product'}
          className="w-24 h-24 object-cover rounded-lg"
        />
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className={`${conditionColors[condition]} text-white text-xs`}>
                  {condition.toUpperCase()}
                </Badge>
                <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs">
                  {(order.listing.category || '').toUpperCase()}
                </Badge>
              </div>
              <h3 className="font-semibold text-gray-900">{order.listing.title || 'Untitled'}</h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <div>
                  <span className="text-gray-400">Order ID:</span>
                  <p className="text-gray-700">{order.id}</p>
                </div>
                <div>
                  <span className="text-gray-400">Seller:</span>
                  <p className="text-gray-700">{order.seller.name || '-'}{order.seller.major ? ` (${order.seller.major})` : ''}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-gray-900">₹{order.agreedPrice.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-400">Order #{order.id}</p>
              {getStatusBadge(order.status)}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {order.status !== 'cancelled' && (
              <div title={!canMessageSeller ? waitingMessage : undefined}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canMessageSeller}
                  onClick={() => onMessageSeller(order)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message Seller
                </Button>
              </div>
            )}
            {(order.status === 'pending' || order.status === 'confirmed') && (
              <button
                onClick={() => onCancel(order.id)}
                disabled={isCancelling}
                className="px-3 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-full hover:bg-red-50 transition-colors disabled:opacity-60"
              >
                Cancel Bid
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PendingBidCard({
  bidId,
  amount,
  listingTitle,
  listingImage,
  listingCategory,
  listingCondition,
  sellerName,
  sellerMajor,
  onCancelBid,
  isCancellingBid,
}: PendingBidCardProps) {
  const waitingMessage = 'Waiting for Seller to View';
  const condition = getConditionKey(listingCondition);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <img
          src={listingImage || ''}
          alt={listingTitle || 'Product'}
          className="w-24 h-24 object-cover rounded-lg"
        />
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className={`${conditionColors[condition]} text-white text-xs`}>
                  {condition.toUpperCase()}
                </Badge>
                <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs">
                  {(listingCategory || '').toUpperCase()}
                </Badge>
              </div>
              <h3 className="font-semibold text-gray-900">{listingTitle || 'Untitled'}</h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <div>
                  <span className="text-gray-400">Order ID:</span>
                  <p className="text-gray-700">Not generated yet</p>
                </div>
                <div>
                  <span className="text-gray-400">Seller:</span>
                  <p className="text-gray-700">{sellerName || '-'}{sellerMajor ? ` (${sellerMajor})` : ''}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-gray-900">₹{amount.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-400">Bid #{bidId}</p>
              <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <div title={waitingMessage}>
              <Button variant="outline" size="sm" disabled>
                <MessageCircle className="w-4 h-4 mr-2" />
                Message Seller
              </Button>
            </div>
            <button
              onClick={() => onCancelBid(bidId)}
              disabled={isCancellingBid}
              className="px-3 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-full hover:bg-red-50 transition-colors disabled:opacity-60"
            >
              Cancel Bid
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('Pending');
  const [showChat, setShowChat] = useState(false);
  const [chatPeer, setChatPeer] = useState<ChatPeer | null>(null);
  const [chatOrderId, setChatOrderId] = useState<string | undefined>(undefined);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_ORDERS);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const { data: user } = useCurrentUser();
  const { data: orders = [] } = useBuyerOrders();
  const { data: myBids = [] } = useMyBids();
  const { data: allProducts = [] } = useListingsAsProducts();
  const cancelOrderMutation = useCancelOrder();
  const cancelBidMutation = useCancelBid();
  const safeOrders = Array.isArray(orders) ? orders : [];
  let filteredOrders = safeOrders;
  if (activeTab === 'Pending') {
    filteredOrders = safeOrders.filter(order => order && order.status && ['pending', 'confirmed'].includes(order.status.toLowerCase()));
  } else if (activeTab === 'Completed') {
    filteredOrders = safeOrders.filter(order => order && order.status && order.status.toLowerCase() === 'completed');
  }

  const acceptedBidIds = new Set(safeOrders.map((order) => order.bidId));
  const pendingBidCards = myBids
    .filter((bid) => bid.status === 'pending' && !acceptedBidIds.has(bid.id))
    .map((bid) => {
      const product = allProducts.find((item) => item.id === bid.listingId);
      const sellerName = product?.seller?.name ?? 'Seller';
      const sellerMajor = product?.seller?.major;
      const isOwnListing = product?.seller?.id === user?.id;

      if (!product || isOwnListing) return null;

      return {
        bidId: bid.id,
        amount: bid.amount,
        listingTitle: product.title,
        listingImage: product.image,
        listingCategory: product.category,
        listingCondition: product.condition,
        sellerName,
        sellerMajor,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const visibleOrders = filteredOrders.slice(0, visibleCount);
  const shouldShowPendingBids = activeTab === 'All Orders' || activeTab === 'Pending';

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_ORDERS);
  }, [activeTab]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => {
            if (prev >= filteredOrders.length) return prev;
            return prev + INITIAL_VISIBLE_ORDERS;
          });
        }
      },
      { rootMargin: '120px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredOrders.length]);

  const openSellerChat = (order: EnrichedOrder) => {
    if (!order?.seller) return;

    setChatPeer({
      id: order.seller.id || '',
      name: order.seller.name || 'Seller',
      avatar: order.seller.avatar || '',
      price: order.agreedPrice,
    });
    setChatOrderId(order.id);
    setShowChat(true);
  };

  const cancelPendingBid = async (bidId: string) => {
    try {
      await cancelBidMutation.mutateAsync(bidId);
      styledToast.success('Bid cancelled', 'Your bid has been cancelled successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not cancel bid right now.';
      styledToast.error('Cancel failed', message);
    }
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
                {filteredOrders.length === 0 && (!shouldShowPendingBids || pendingBidCards.length === 0) && (
                  <div className="text-center text-gray-500 py-8">
                    {activeTab === 'Pending' && 'No pending orders.'}
                    {activeTab === 'Completed' && 'No completed orders.'}
                    {activeTab === 'All Orders' && 'No orders found.'}
                  </div>
                )}
                {visibleOrders.map((order, index) => {
                  return (
                    <OrderCard
                      key={order.id}
                      order={order}
                      index={index}
                      isCancelling={cancelOrderMutation.isPending}
                      onCancel={(orderId) => cancelOrderMutation.mutate(orderId)}
                      onMessageSeller={openSellerChat}
                    />
                  );
                })}

                {shouldShowPendingBids && pendingBidCards.map((pendingBid) => (
                  <PendingBidCard
                    key={pendingBid.bidId}
                    bidId={pendingBid.bidId}
                    amount={pendingBid.amount}
                    listingTitle={pendingBid.listingTitle}
                    listingImage={pendingBid.listingImage}
                    listingCategory={pendingBid.listingCategory}
                    listingCondition={pendingBid.listingCondition}
                    sellerName={pendingBid.sellerName}
                    sellerMajor={pendingBid.sellerMajor}
                    onCancelBid={cancelPendingBid}
                    isCancellingBid={cancelBidMutation.isPending}
                  />
                ))}
              </div>

              <div className="text-center mt-8">
                <p className="text-sm text-gray-500">Showing {visibleOrders.length + (shouldShowPendingBids ? pendingBidCards.length : 0)} of {filteredOrders.length + (shouldShowPendingBids ? pendingBidCards.length : 0)} entries</p>
              </div>

              <div ref={sentinelRef} className="h-1" aria-hidden="true" />
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
          orderId={chatOrderId}
        />
      ) : null}
    </div>
  );
}

