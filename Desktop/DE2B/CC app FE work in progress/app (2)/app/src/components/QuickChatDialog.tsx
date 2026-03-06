/**
 * Reusable Quick Chat dialog used for seller ↔ buyer meetup negotiation.
 *
 * • perspective="seller" → opened from ViewBids "Finalize Order" (seller POV)
 * • perspective="buyer"  → opened from MyOrders "Message Seller" (buyer POV)
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CalendarDays, ChevronRight, Lock, LockOpen, MapPin, Phone, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

/* ─── report-issue options ─── */
const REPORT_ISSUES = [
  { id: 'no-show', label: 'Seller / Buyer did not show up' },
  { id: 'wrong-item', label: 'Item does not match the listing' },
  { id: 'damaged', label: 'Item is damaged or defective' },
  { id: 'safety', label: 'I felt unsafe during the meetup' },
  { id: 'price-dispute', label: 'Price disagreement at meetup' },
  { id: 'fake-listing', label: 'Suspected fake or scam listing' },
  { id: 'harassment', label: 'Harassment or inappropriate behaviour' },
  { id: 'other', label: 'Other issue not listed above' },
];

/* ─── types ─── */
export interface ChatPeer {
  id?: string;   // used to navigate to the peer's profile
  name: string;
  avatar: string;
  price?: number; // agreed / proposed price shown in initial messages
}

export interface ProductInfo {
  image: string;
  title: string;
  price: number;
  sellerName: string;
}

export type ChatPerspective = 'seller' | 'buyer';

interface QuickChatDialogProps {
  open: boolean;
  onClose: () => void;
  peer: ChatPeer;
  perspective: ChatPerspective;
  productInfo?: ProductInfo;
}

interface ChatMessage {
  id: string;
  sender: 'me' | 'them';
  text: string;
  time: string;
  isMeetup?: boolean;
}

/* ─── helpers ─── */
const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const buildInitialMessages = (peer: ChatPeer, perspective: ChatPerspective): ChatMessage[] => {
  if (perspective === 'seller') {
    return [
      {
        id: 'init-1',
        sender: 'them',
        text: `Hi! I'm interested in buying this for ₹${peer.price ?? '–'}. When can we meet?`,
        time: '10:24 AM',
      },
      {
        id: 'init-2',
        sender: 'me',
        text: 'Sounds good! Let me set up a meetup.',
        time: '10:26 AM',
      },
    ];
  }
  // buyer POV
  return [
    {
      id: 'init-1',
      sender: 'me',
      text: `Hi! I'd like to buy this for ₹${peer.price ?? '–'}. When can we meet?`,
      time: '10:24 AM',
    },
    {
      id: 'init-2',
      sender: 'them',
      text: 'Sure thing! Let me propose a meetup. Wait until I send the details.',
      time: '10:26 AM',
    },
  ];
};

/* ─── component ─── */
export default function QuickChatDialog({ open, onClose, peer, perspective, productInfo }: QuickChatDialogProps) {
  const navigate = useNavigate();
  const [showMeetupForm, setShowMeetupForm] = useState(false);
  const [meetupLocation, setMeetupLocation] = useState('');
  const [meetupDate, setMeetupDate] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [meetupConfirmed, setMeetupConfirmed] = useState(false);

  /* ── Meetup Auth state ── */
  const [showMeetupAuth, setShowMeetupAuth] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpVerified, setOtpVerified] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ── Report Issue state ── */
  const [showReportIssue, setShowReportIssue] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  /* lock body scroll while open */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /* seed initial messages when dialog opens */
  useEffect(() => {
    if (open) {
      setChatMessages(buildInitialMessages(peer, perspective));
      setShowMeetupForm(false);
      setMeetupLocation('');
      setMeetupDate('');
      setMeetupConfirmed(false);
      setShowMeetupAuth(false);
      setOtpVerified(false);
      // Buyer gets a pre-filled random OTP; seller gets empty fields
      if (perspective === 'buyer') {
        const randomOtp = Array.from({ length: 6 }, () => String(Math.floor(Math.random() * 10)));
        setOtpDigits(randomOtp);
      } else {
        setOtpDigits(['', '', '', '', '', '']);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* Simulate seller-side OTP verification for buyer perspective (demo: auto-verify after 5s) */
  useEffect(() => {
    if (showMeetupAuth && perspective === 'buyer' && !otpVerified) {
      const timer = setTimeout(() => setOtpVerified(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [showMeetupAuth, perspective, otpVerified]);

  /* auto-scroll */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  /* actions */
  const handleSendMeetup = () => {
    if (!meetupLocation.trim() || !meetupDate) return;
    const formattedDate = new Date(meetupDate).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const meetupMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'me',
      text: `📍 Meetup Details\nDate & Time: ${formattedDate}\nLocation: ${meetupLocation}`,
      time: now(),
      isMeetup: true,
    };
    setChatMessages((prev) => {
      const updated = prev.map((m) => ({ ...m, isMeetup: false }));
      return [...updated, meetupMsg];
    });
    setShowMeetupForm(false);
    setMeetupLocation('');
    setMeetupDate('');
  };

  const handleConfirmMeetup = (msgId: string) => {
    const confirmedMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'me',
      text: '✅ Meetup confirmed! See you there.',
      time: now(),
    };
    setChatMessages((prev) => {
      const updated = prev.map((m) => (m.id === msgId ? { ...m, isMeetup: false } : m));
      return [...updated, confirmedMsg];
    });
    setMeetupConfirmed(true);
  };

  const handleChangeMeetup = () => {
    setShowMeetupForm(true);
  };

  /* ── OTP helpers ── */
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const updated = [...otpDigits];
    updated[index] = value.slice(-1); // single digit
    setOtpDigits(updated);
    // auto-advance
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = () => {
    const code = otpDigits.join('');
    if (code.length === 6) {
      // Mock verification – treat any 6-digit code as valid
      setOtpVerified(true);
    }
  };

  /* ── Report Issue handler ── */
  const handleReportIssue = (issueLabel: string) => {
    toast.success('Your issue has been recorded', {
      description: issueLabel,
      duration: 3000,
    });
    setShowReportIssue(false);
    setShowMeetupAuth(false);
    onClose();
    navigate('/home');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[650px]">
        {/* ── Header ── */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                alt={peer.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-[#EBB50B]"
                src={peer.avatar}
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">{peer.name}</h2>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full" /> Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-gray-500">
            
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ── Messages ── */}
        <main className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50 relative">
          {chatMessages.map((msg) => (
            <div key={msg.id}>
              <div className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`relative px-5 py-3 rounded-2xl max-w-md shadow-sm whitespace-pre-line ${
                    msg.sender === 'me' ? 'bg-[#71B55A] text-white' : 'bg-[#EBB50B] text-black'
                  }`}
                >
                  <p className="font-medium">{msg.text}</p>
                  <span
                    className={`text-[10px] mt-1 block text-right ${
                      msg.sender === 'me' ? 'opacity-80' : 'opacity-60'
                    }`}
                  >
                    {msg.time}
                  </span>
                </div>
              </div>
              {msg.isMeetup ? (
                <div className="flex justify-end mt-2 gap-2">
                  
                  <button
                    className="py-2 px-5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors uppercase tracking-wider"
                    onClick={handleChangeMeetup}
                  >
                    Change
                  </button>
                  <button
                    className="py-2 px-5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors uppercase tracking-wider"
                    onClick={() => handleConfirmMeetup(msg.id)}
                  >
                    Confirm
                  </button>
                </div>
              ) : null}
            </div>
          ))}
          <div ref={chatEndRef} />
        </main>

        {/* ── Footer ── */}
        <footer className="p-6 bg-white border-t border-gray-100">
          {meetupConfirmed ? (
            <button
              className="w-full py-4 bg-[#71B55A]/10 hover:bg-[#71B55A]/20 text-[#71B55A] font-bold rounded-xl text-center uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              onClick={() => setShowMeetupAuth(true)}
            >
              ✅ Your Meetup is Confirmed — Tap to Authenticate
            </button>
          ) : (
            <button
              className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-black font-bold rounded-xl transition-all active:scale-[0.99] uppercase tracking-widest text-sm"
              onClick={() => setShowMeetupForm(true)}
            >
              Set Meetup
            </button>
          )}
        </footer>
      </div>

      {/* ── Set Meetup Sub-Dialog ── */}
      {showMeetupForm ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/30 backdrop-blur-[1px]">
          <div className="bg-white w-full max-w-md rounded-2xl border border-gray-100 p-8 flex flex-col gap-6 shadow-2xl">
            <div className="flex justify-between items-start gap-4">
              <h2 className="text-xl font-bold text-black">Set Meetup Details</h2>
              <button
                className="text-gray-400 hover:text-black transition-colors"
                onClick={() => setShowMeetupForm(false)}
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-black" htmlFor="chat-meetup-location">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#71B55A] focus:bg-white text-sm transition-all outline-none"
                    id="chat-meetup-location"
                    onChange={(e) => setMeetupLocation(e.target.value)}
                    placeholder="e.g., Central Library, Coffee Lab"
                    type="text"
                    value={meetupLocation}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-black" htmlFor="chat-meetup-date">
                  Date &amp; Time
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#71B55A] focus:bg-white text-sm transition-all outline-none"
                    id="chat-meetup-date"
                    onChange={(e) => setMeetupDate(e.target.value)}
                    type="datetime-local"
                    value={meetupDate}
                  />
                </div>
              </div>
            </div>

            <Button
              className="w-full bg-[#71B55A] hover:brightness-105 text-white py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2"
              disabled={!meetupLocation.trim() || !meetupDate}
              onClick={handleSendMeetup}
            >
              <Send className="w-4 h-4" />
              Send
            </Button>
          </div>
        </div>
      ) : null}

      {/* ── Meetup Authentication Sub-Dialog ── */}
      {showMeetupAuth ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/30 backdrop-blur-[1px]">
          <div className="bg-white w-full max-w-md rounded-2xl border border-gray-100 p-8 flex flex-col gap-6 shadow-2xl">
            {/* Heading & close */}
            <div className="flex justify-between items-start gap-4">
              <h2 className="text-xl font-bold text-black">Meetup Authentication</h2>
              <button
                className={`p-2 rounded-full transition-colors ${
                  otpVerified
                    ? 'text-gray-400 hover:text-black hover:bg-gray-100'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
                disabled={!otpVerified}
                onClick={() => {
                  if (otpVerified) {
                    setShowMeetupAuth(false);
                    onClose();
                  }
                }}
                title={otpVerified ? 'Close' : 'Verify OTP to unlock'}
                type="button"
              >
                {otpVerified ? <LockOpen className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </button>
            </div>

            {/* OTP Section */}
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-gray-500 text-center">
                {perspective === 'seller'
                  ? 'Buyer will provide you the OTP'
                  : 'Show this OTP to the seller at meetup'}
              </p>
              <div className="flex gap-3">
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => perspective === 'seller' ? handleOtpChange(i, e.target.value) : undefined}
                    onKeyDown={(e) => perspective === 'seller' ? handleOtpKeyDown(i, e) : undefined}
                    readOnly={perspective === 'buyer'}
                    className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl outline-none transition-all ${
                      perspective === 'buyer'
                        ? 'border-[#EBB50B] bg-[#EBB50B]/10 text-black cursor-default'
                        : 'border-gray-200 bg-gray-50 focus:border-[#EBB50B] focus:ring-2 focus:ring-[#EBB50B]/30 focus:bg-white'
                    }`}
                  />
                ))}
              </div>
              {otpVerified && (
                <p className="text-sm font-semibold text-[#71B55A] flex items-center gap-1">
                  ✅ OTP Verified Successfully
                </p>
              )}
              {!otpVerified && perspective === 'seller' && (
                <Button
                  className="w-full bg-[#EBB50B] hover:bg-[#d9a50a] text-black font-bold py-3 rounded-xl transition-all"
                  disabled={otpDigits.some((d) => !d)}
                  onClick={handleOtpSubmit}
                >
                  Submit
                </Button>
              )}
              {!otpVerified && perspective === 'buyer' && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="w-4 h-4 border-2 border-gray-300 border-t-[#EBB50B] rounded-full animate-spin" />
                  Waiting for seller to verify…
                </div>
              )}
            </div>

            {/* Product Details + Call */}
            {productInfo ? (
              <div className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <img
                    src={productInfo.image}
                    alt={productInfo.title}
                    className="w-16 h-16 rounded-lg object-cover border border-gray-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-black text-sm truncate">{productInfo.title}</p>
                    <p className="text-lg font-bold text-[#71B55A]">₹{productInfo.price}</p>
                    <p className="text-xs text-gray-400 truncate">{productInfo.sellerName}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <button className="w-12 h-12 flex items-center justify-center rounded-full bg-[#71B55A] text-white hover:brightness-110 transition-all shadow-md">
                    <Phone className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : null}

            {/* Report Issue */}
            <button
              className="w-full py-3 text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              onClick={() => setShowReportIssue(true)}
            >
              <AlertTriangle className="w-4 h-4" />
              Report Issue
            </button>

            {/* Close Button (locked/unlocked) */}
            <Button
              className={`w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
                otpVerified
                  ? 'bg-[#71B55A] hover:brightness-105 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              disabled={!otpVerified}
              onClick={() => {
                if (perspective === 'buyer') {
                  // Buyer: navigate to /home with review data for the seller
                  navigate('/home', {
                    state: {
                      showReview: true,
                      reviewPeer: {
                        name: productInfo?.sellerName ?? 'Amitabh Bachchan',
                        avatar: 'https://ui-avatars.com/api/?name=Amitabh+Bachchan&background=EBB50B&color=fff&size=128',
                        price: peer.price ?? productInfo?.price,
                      },
                    },
                  });
                } else {
                  // Seller: just close, no review
                  navigate('/home');
                }
                setShowMeetupAuth(false);
                onClose();
              }}
            >
              {otpVerified ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {otpVerified ? 'Close — Order Complete' : 'Verify OTP to Close'}
            </Button>
          </div>
        </div>
      ) : null}

      {/* ── Report Issue Bottom Sheet ── */}
      {showReportIssue && (
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/30 backdrop-blur-[1px]"
          onClick={() => setShowReportIssue(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-t-2xl border-t border-gray-100 shadow-2xl animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag indicator */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 pt-2">
              <h2 className="text-lg font-bold text-black">State Your Problem</h2>
              <button
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-black"
                onClick={() => setShowReportIssue(false)}
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Issue tiles */}
            <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                {REPORT_ISSUES.map((issue) => (
                  <button
                    key={issue.id}
                    className="w-full flex items-center justify-between px-4 py-4 bg-gray-50 hover:bg-red-50 border border-gray-100 hover:border-red-200 rounded-xl transition-all text-left group"
                    onClick={() => handleReportIssue(issue.label)}
                  >
                    <span className="text-sm font-medium text-gray-800 group-hover:text-red-700 transition-colors">
                      {issue.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* slide-up keyframes */}
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(100%); }
              to   { transform: translateY(0); }
            }
            .animate-slideUp {
              animation: slideUp 0.3s ease-out forwards;
            }
          `}</style>
        </div>
      )}

    </div>
  );
}
