/**
 * Page component that shows bids received for a listing and lets sellers message, finalize, or reject bids.
 */
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useBidsForListing, useCancelOrder, useCurrentUser, useListingsAsProducts, useRejectBid } from '@/state';
import QuickChatDialog from '@/components/QuickChatDialog';
import type { ChatPeer } from '@/components/QuickChatDialog';
import { styledToast } from '@/utils/styledToast';
import { getOrCreateConversation } from '@/services/chat.service';

type SortOption = 'highest' | 'lowest' | 'newest';

type ListingBid = {
  id: string;
  bidderId: string;
  amount: number;
  status: string;
  orderId?: string;
  orderStatus?: string;
  createdAt: string;
  bidder: {
    id: string;
    name: string;
    avatar: string;
    university: string;
  } | null;
};

const conditionColors: Record<string, string> = {
  'New': 'bg-green-500',
  'Like New': 'bg-emerald-500',
  'Good': 'bg-amber-500',
  'Fair': 'bg-orange-500',
  'Used': 'bg-gray-500',
};

export default function ViewBidsPage() {
  const { listingId = '' } = useParams<{ listingId: string }>();
  const { data: allProducts = [] } = useListingsAsProducts();
  const { data: currentUser } = useCurrentUser();
  const { data: fetchedBids = [], isLoading: bidsLoading } = useBidsForListing(listingId);
  const rejectBidMutation = useRejectBid();
  const cancelOrderMutation = useCancelOrder();
  const listing = allProducts.find((item) => item.id === listingId);
  const allBids = (fetchedBids as ListingBid[]).filter((bid) => {
    const hasActiveOrder = bid.orderStatus === 'pending' || bid.orderStatus === 'confirmed';
    return bid.status === 'pending' || bid.status === 'accepted' || hasActiveOrder;
  });
  const [showChat, setShowChat] = useState(false);
  const [chatPeer, setChatPeer] = useState<ChatPeer | null>(null);
  const [chatOrderId, setChatOrderId] = useState<string | undefined>(undefined);
  const [chatConversationId, setChatConversationId] = useState<string | undefined>(undefined);
  const [chatBidId, setChatBidId] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<SortOption>('highest');
  const [processingBidId, setProcessingBidId] = useState<string | null>(null);

  const bids = useMemo(() => {
    switch (sortBy) {
      case 'highest':
        return [...allBids].sort((a, b) => b.amount - a.amount);
      case 'lowest':
        return [...allBids].sort((a, b) => a.amount - b.amount);
      case 'newest':
      default:
        return [...allBids].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [allBids, sortBy]);

  const handleReject = async (bid: ListingBid) => {
    try {
      setProcessingBidId(bid.id);

      if (bid.orderId && (bid.orderStatus === 'pending' || bid.orderStatus === 'confirmed')) {
        await cancelOrderMutation.mutateAsync(bid.orderId);
        styledToast.success('Order cancelled', 'The meetup workflow has been cancelled.');
      } else if (bid.status === 'pending') {
        await rejectBidMutation.mutateAsync(bid.id);
        styledToast.success('Bid rejected', 'The buyer has been notified.');
      } else if (bid.orderStatus === 'completed') {
        styledToast.warning('Order already completed', 'Completed orders cannot be rejected now.');
      } else {
        styledToast.warning('Action not available', 'This bid cannot be rejected right now.');
      }
    } catch {
      styledToast.error('Reject failed', 'Could not reject bid. Please try again.');
    } finally {
      setProcessingBidId(null);
    }
  };

  const openChatDialog = async (bid: ListingBid) => {
    if (!listing || !currentUser?.id) {
      styledToast.error('Finalize failed', 'Missing listing or seller details.');
      return;
    }

    try {
      setProcessingBidId(bid.id);
      const conversationResponse = await getOrCreateConversation(bid.bidderId, currentUser.id, listing.id);

      setChatPeer({
        id: bid.bidder?.id ?? bid.bidderId,
        name: bid.bidder?.name ?? 'Buyer',
        avatar: bid.bidder?.avatar ?? '',
        price: bid.amount,
      });
      setChatOrderId(bid.orderId);
      setChatConversationId(conversationResponse.data.id);
      setChatBidId(bid.orderId ? undefined : bid.id);
      setShowChat(true);
      styledToast.success('Finalize started', 'Send meetup details to proceed.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not finalize this bid.';
      styledToast.error('Finalize failed', message);
    } finally {
      setProcessingBidId(null);
    }
  };

  const closeChatDialog = () => {
    setShowChat(false);
  };

  if (!listing) {
    return (
      <div className="max-w-7xl mx-auto w-full p-6 md:p-8">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-black mb-2">Listing Not Found</h1>
          <p className="text-gray-500 mb-6">This listing is unavailable or no longer exists.</p>
          <Link to="/listings">
            <Button className="bg-[#F5B800] hover:bg-[#E5A800] text-black font-semibold">Back to My Listings</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className={`max-w-7xl mx-auto w-full p-6 md:p-8 ${showChat ? 'grayscale-[0.2] opacity-50 pointer-events-none' : ''}`}>
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link className="hover:text-black" to="/listings">
            My Listings
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-black font-medium">View Bids</span>
        </nav>

        <section className="mb-10">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6">
            <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
              <img alt={listing.title} className="w-full h-full object-cover" src={listing.image} />
              <span className={`absolute top-2 left-2 text-white text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${conditionColors[listing.condition] ?? 'bg-gray-500'}`}>
                {listing.condition}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-[#71B55A] text-white text-[8px] px-3 py-1 rounded-full uppercase tracking-wider">
                  {listing.category}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold text-black mb-1">{listing.title}</h1>
              <p className="text-xl font-bold text-black">Price: ₹{listing.price}</p>
            </div>
            <div className="md:pr-4 p-4 rounded-lg text-center bg-white">
              <p className="text-6xl font-extrabold text-black leading-none">
                {bids.length}
              </p>
              <p className="text-2xl font-bold text-black mt-2 uppercase tracking-wide">
                Bids
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-black">Interested Buyers</h2>
            <select
              className="text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#EBB50B] cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <option value="highest">Sort by: Highest Price</option>
              <option value="lowest">Sort by: Lowest Price</option>
              <option value="newest">Sort by: Newest First</option>
            </select>
          </div>

          <div className="space-y-4">
            {bidsLoading ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center text-gray-500">
                Loading bids...
              </div>
            ) : bids.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center text-gray-500">
                No bids received yet for this listing.
              </div>
            ) : (
              bids.map((bid) => {
                const canOpenChat =
                  bid.status === 'pending' ||
                  bid.status === 'accepted' ||
                  bid.orderStatus === 'pending' ||
                  bid.orderStatus === 'confirmed';
                const canReject = true;

                return (
                <div
                  className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 hover:border-[#EBB50B] transition-all"
                  key={bid.id}
                >
                  <div className="flex items-center gap-4 xl:w-1/4">
                    <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                      <img alt={bid.bidder?.name ?? 'Buyer'} className="w-full h-full object-cover" src={bid.bidder?.avatar || ''} />
                    </div>
                    <div>
                      <p className="font-bold text-black">{bid.bidder?.name ?? 'Unknown Buyer'}</p>
                      <p className="text-xs text-gray-400">{bid.bidder?.university ?? '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 xl:w-auto xl:justify-end">
                    <div className="text-right mr-2">
                      <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5 tracking-tight">Proposed Price</p>
                      <p className="text-xl font-bold text-[#71B55A]">₹{bid.amount.toLocaleString('en-IN')}</p>
                    </div>
                    <Button
                      className="bg-[#71B55A] hover:brightness-105 text-white font-semibold"
                      onClick={() => openChatDialog(bid)}
                      disabled={!canOpenChat || processingBidId === bid.id}
                    >
                      {bid.orderStatus === 'pending' || bid.orderStatus === 'confirmed' ? 'Open Chat' : 'Finalize Order'}
                    </Button>
                    <Button
                      className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-semibold"
                      variant="outline"
                      disabled={!canReject || processingBidId === bid.id}
                      onClick={() => handleReject(bid)}
                    >
                      Reject Bid
                    </Button>
                  </div>
                </div>
              )})
            )}
          </div>
        </section>
      </div>

      {/* ── Quick Chat Dialog (Seller POV) ── */}
      {chatPeer ? (
        <QuickChatDialog
          open={showChat}
          onClose={closeChatDialog}
          peer={chatPeer}
          perspective="seller"
          orderId={chatOrderId}
          conversationId={chatConversationId}
          finalizeBidId={chatBidId}
          productInfo={listing ? {
            image: listing.image,
            title: listing.title,
            price: chatPeer.price ?? listing.price,
            sellerName: listing.seller?.name ?? 'You',
          } : undefined}
        />
      ) : null}
    </div>
  );
}
