/**
 * Page component for the M es sa ge sP ag e route and related page-level interactions.
 */

import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Search, Info, Send, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { conversations as initialConversations, currentUser } from '@/data/mockData';


import type { Conversation, Message } from '@/data/mockData';

type NegotiationType = {
  current: number;
  proposed: number;
};



function MessagesPage() {
  const location = useLocation();
  // Check for hideHeader param in URL
  const params = new URLSearchParams(location.search);
  const hideHeader = params.get('hideHeader') === '1';
  const { conversationId } = useParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>(() => initialConversations.map(conv => ({ ...conv })));
  const [selectedConversation, setSelectedConversation] = useState<string>(conversationId || initialConversations[0]?.id);
  // Removed addProductFlow, use navigation state only
  const [messageText, setMessageText] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [messagesByConv, setMessagesByConv] = useState<Record<string, Message[]>>(() => {
    const map: any = {};
    initialConversations.forEach(conv => {
      map[conv.id] = [
        {
          id: conv.lastMessage.id,
          senderId: conv.lastMessage.senderId,
          receiverId: conv.lastMessage.receiverId,
          content: conv.lastMessage.content,
          timestamp: conv.lastMessage.timestamp,
          isRead: conv.lastMessage.isRead,
          proposedPrice: conv.lastMessage.proposedPrice,
          productId: conv.lastMessage.productId
        }
      ];
    });
    return map;
  });
  const [negotiation, setNegotiation] = useState<NegotiationType>({
    current: 3500,
    proposed: 3000
  });

  const activeConversation = conversations.find(c => c.id === selectedConversation);

  // Handle product selection from search page
  useEffect(() => {
    if (location.state && location.state.selectedProduct && activeConversation) {
      setConversations(prev => prev.map(conv =>
        conv.id === activeConversation.id
          ? { ...conv, product: location.state.selectedProduct }
          : conv
      ));
      // Remove selectedProduct from navigation state after update
      navigate('.', { replace: true, state: {} });
    }
  }, [location.state, activeConversation, navigate]);
  const messages = activeConversation && messagesByConv[activeConversation.id] ? messagesByConv[activeConversation.id] : [];

  // Removed scrollIntoView effect: no automatic scrolling

  // Mark messages as read when opening a conversation
  useEffect(() => {
    if (!activeConversation) return;
    setConversations(prev => prev.map(conv =>
      conv.id === activeConversation.id ? { ...conv, unreadCount: 0 } : conv
    ));
    setMessagesByConv(prev => {
      const updated = { ...prev };
      updated[activeConversation.id] = (updated[activeConversation.id] || []).map(m => ({ ...m, isRead: true }));
      return updated;
    });
  }, [selectedConversation]);

  const handleSend = () => {
    if (!messageText.trim() || !activeConversation) return;
    const newMsg = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      receiverId: activeConversation.participant.id,
      content: messageText,
      timestamp: new Date().toISOString(),
      isRead: true
    };
    setMessagesByConv(prev => ({
      ...prev,
      [activeConversation.id]: [...(prev[activeConversation.id] || []), newMsg]
    }));
    setConversations(prev => prev.map(conv =>
      conv.id === activeConversation.id
        ? { ...conv, lastMessage: newMsg, unreadCount: 0 }
        : conv
    ));
    setMessageText('');
    // Simulate reply from other user after 1.5s
    setTimeout(() => {
      const reply = {
        id: (Date.now() + 1).toString(),
        senderId: activeConversation.participant.id,
        receiverId: currentUser.id,
        content: 'Thanks for your message! I will get back to you soon.',
        timestamp: new Date().toISOString(),
        isRead: false
      };
      setMessagesByConv(prev => ({
        ...prev,
        [activeConversation.id]: [...(prev[activeConversation.id] || []), reply]
      }));
      setConversations(prev => prev.map(conv =>
        conv.id === activeConversation.id
          ? { ...conv, lastMessage: reply, unreadCount: conv.unreadCount + 1 }
          : conv
      ));
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="flex h-full">
            {/* Conversations List (Left) */}
            <div className={`w-full md:w-80 border-r border-gray-100 ${selectedConversation ? 'hidden md:block' : ''}`}> 
              {!hideHeader && (
                <div className="p-4 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Messages</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search inbox..."
                      className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-xl text-sm focus:ring-2 focus:ring-[#F5B800]/30 outline-none"
                    />
                  </div>
                </div>
              )}
              
              <div className="overflow-y-auto" style={{ height: 'calc(100% - 100px)' }}>
                {conversations.map((conv) => {
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                        selectedConversation === conv.id ? 'bg-[#F5B800]/5 border-l-4 border-l-[#F5B800]' : ''
                      }`}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-400">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A9 9 0 1112 21a8.963 8.963 0 01-6.879-3.196z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center">
                          <p className="font-semibold text-gray-900">{conv.participant.name}</p>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-1">{conv.lastMessage.content}</p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="w-5 h-5 bg-[#F5B800] text-white text-xs font-medium rounded-full flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chat + Negotiation Layout (Mid + Right) */}
            {activeConversation && (
              <div className="flex flex-1 h-full">
                {/* Chat Area (Middle) */}
                <div className="flex-1 flex flex-col border-r border-gray-100">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedConversation('')}
                        className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-400">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A9 9 0 1112 21a8.963 8.963 0 01-6.879-3.196z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{activeConversation?.participant.name}</p>
                        <p className="text-xs text-green-600">Online</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        onClick={() => {
                          if (activeConversation?.participant?.id) {
                            navigate(`/seller/${activeConversation.participant.id}`);
                          } else {
                            navigate('/seller');
                          }
                        }}
                      >
                        <Info className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                        {/* Seller Profile Modal */}
                        {showProfile && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                            <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full relative">
                              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setShowProfile(false)}>
                                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                              <div className="flex flex-col items-center gap-4">
                                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                                  <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A9 9 0 1112 21a8.963 8.963 0 01-6.879-3.196z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                </div>
                                <h2 className="text-xl font-bold">Seller Profile</h2>
                                <p className="text-gray-600">This is a placeholder for the seller profile. Implement details as in product detail page seller info.</p>
                              </div>
                            </div>
                          </div>
                        )}
                  </div>

                  {/* Product Card */}
                  {activeConversation.product && (
                    <div className="p-4 bg-gray-50 border-b border-gray-100">
                      <div className="flex items-center gap-3 bg-white rounded-xl p-3">
                        <img
                          src={activeConversation.product.image}
                          alt=""
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <p className="text-medium text-gray-900">{activeConversation.product.title}</p>
                          <p className="text-green-600 font-semibold">₹{activeConversation.product.price}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => activeConversation.product?.id && navigate(`/product/${activeConversation.product.id}`)}
                        >
                          View Item
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(msg => {
                      const isMe = msg.senderId === currentUser.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                              isMe
                                ? 'bg-green-500 text-white rounded-br-md'
                                : 'bg-gray-100 text-gray-900 rounded-bl-md'
                            }`}
                          >
                            <p>{msg.content}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate('/search', { state: { fromAddProduct: true } })}
                        className="p-3 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-colors"
                        title="Add a product"
                      >
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-[#F5B800]/30 outline-none"
                      />
                      <button
                        onClick={handleSend}
                        className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Negotiation Panel (Right) */}
                <div className="hidden lg:flex flex-col w-[340px] bg-gray-50 h-full p-4">
                  <div className="bg-white rounded-xl p-4 mb-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Negotiate Price</p>
                    <div className="flex gap-4 mb-4">
                      <div className="flex-1">
                        <p className="text-xs text-gray-400 mb-1">Current Price</p>
                        <p className="text-lg font-bold text-gray-900">₹{negotiation.current}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-400 mb-1">Proposed</p>
                        <p className="text-lg font-bold text-[#F5B800]">₹{negotiation.proposed}</p>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="10000"
                      value={negotiation.proposed}
                      onChange={e => setNegotiation(n => ({ ...n, proposed: Number(e.target.value) }))}
                      className="w-full mb-4"
                    />
                    <div className="flex gap-2">
                      <Button className="flex-1 bg-[#F5B800] hover:bg-[#E5A800]" onClick={() => {
                        setNegotiation(n => ({ ...n, current: n.proposed }));
                        // Add negyellowion message
                        if (activeConversation) {
                          const newMsg = {
                            id: Date.now().toString(),
                            senderId: currentUser.id,
                            receiverId: activeConversation.participant.id,
                            content: `Proposed new price: ₹${negotiation.proposed}`,
                            timestamp: new Date().toISOString(),
                            isRead: true,
                            proposedPrice: negotiation.proposed
                          };
                          setMessagesByConv(prev => ({
                            ...prev,
                            [activeConversation.id]: [...(prev[activeConversation.id] || []), newMsg]
                          }));
                        }
                      }}>
                        Propose Offer
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={() => {
                        if (activeConversation) {
                          const newMsg = {
                            id: Date.now().toString(),
                            senderId: currentUser.id,
                            receiverId: activeConversation.participant.id,
                            content: 'Declined the offer.',
                            timestamp: new Date().toISOString(),
                            isRead: true
                          };
                          setMessagesByConv(prev => ({
                            ...prev,
                            [activeConversation.id]: [...(prev[activeConversation.id] || []), newMsg]
                          }));
                        }
                      }}>
                        Decline Offer
                      </Button>
                    </div>
                    <div className="mt-2">
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => navigate('/checkout/agreement')}
                      >
                        Go to Agreement
                      </Button>
                    </div>
                  </div>
                  {/* Safety Tip */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                    <p className="text-xs text-yellow-600 font-medium mb-1">Safety Tip</p>
                    <p className="text-xs text-yellow-600">
                      Meet in a public campus location and inspect the item before finalizing payment.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessagesPage;

