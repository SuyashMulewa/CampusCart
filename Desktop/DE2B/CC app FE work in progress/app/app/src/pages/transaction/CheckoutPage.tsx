/**
 * Page component for the C he ck ou tP ag e route and related page-level interactions.
 */
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  Calendar, 
  Shield, 
  Leaf,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { styledToast } from '@/utils/styledToast';

export default function CheckoutPage() {
  const location = useLocation();
  const getStepFromRoute = () => {
    if (location.pathname === '/checkout/agreement') return 1;

    const stepParam = new URLSearchParams(location.search).get('step');
    if (stepParam === 'agreement') return 1;
    if (stepParam === 'checkout') return 2;

    return 0;
  };

  const [step, setStep] = useState(getStepFromRoute); // 0: Negotiation, 1: Agreement, 2: Checkout
  const navigate = useNavigate();
  // ...existing hooks and logic for items, etc.

  useEffect(() => {
    setStep(getStepFromRoute());
  }, [location.pathname, location.search]);

  // Step titles
  const steps = ["Options", "Agreement", "Checkout"];

  // Stepper UI
  const renderProgressBar = () => (
    <div className="flex items-center justify-center mb-8 z-20 relative">
      <div className="flex items-center gap-4">
        {steps.map((label, idx) => (
          <>
            <div key={label} className="flex items-center gap-2 cursor-pointer" onClick={() => setStep(idx)}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= idx ? (idx === 2 ? 'bg-[#F5B800]' : 'bg-green-500') : 'bg-gray-200'}`}>
                {step > idx ? <CheckCircle className="w-5 h-5 text-white" /> : step === idx ? <span className="text-white font-bold">{idx + 1}</span> : <span className="text-gray-400 font-bold">{idx + 1}</span>}
              </div>
              <span className={`text-sm font-medium ${step >= idx ? (idx === 2 ? 'text-gray-900' : 'text-green-600') : 'text-gray-400'}`}>{label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`w-16 h-0.5 ${step > idx ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </>
        ))}
      </div>
    </div>
  );

  // Step content skeletons
  const renderStepContent = () => {
    if (step === 0) {
      // Clean centered layout with two large option cards
      return (
        <div className="min-h-screen flex justify-center bg-gray-50 px-2 py-8">
          <div className="w-full max-w-2xl mx-auto flex flex-col">
            {/* Header Section */}
            <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">How would you like to proceed?</h2>
            <p className="text-lg text-gray-500 mb-8 text-center">Choose the best path to secure your items.</p>
            {/* Decision Card 1 — Buy Now */}
            <div className="w-full bg-white rounded-2xl shadow-xl border-2 border-green-500/60 mb-6 p-6 flex flex-col md:flex-row items-center hover:shadow-2xl transition-shadow group" style={{ minHeight: 180 }}>
              <div className="flex-1 flex flex-col items-center justify-center">
                <span className="text-xs font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full mb-2">FASTEST PATH</span>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Buy Now</h3>
                <p className="text-gray-600 mb-4">Skip negotiation and secure this item immediately at the original price.</p>
                <Button className="bg-green-500 hover:bg-green-600 text-white font-semibold rounded-full px-6 py-3 text-lg flex items-center gap-2 shadow-md" onClick={() => setStep(2)}>
                  <span className="inline-flex items-center"><svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>Proceed to Checkout</span>
                </Button>
              </div>
            </div>
            {/* Decision Card 2 — Negotiate with Seller */}
            <div className="w-full bg-white rounded-2xl shadow-xl border-2 border-yellow-400/60 p-6 flex flex-col items-center hover:shadow-2xl transition-shadow group" style={{ minHeight: 180 }}>
              <span className="text-xs font-semibold bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full mb-2">SAVE MONEY</span>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Negotiate with Seller</h3>
              <p className="text-gray-600 mb-4 text-center">Propose your price via chat and reach an agreement with the seller before buying.</p>
              <Button className="bg-[#F5B800] hover:bg-yellow-400 text-gray-900 font-semibold rounded-full px-6 py-3 text-lg flex items-center gap-2 shadow-md" onClick={() => navigate('/messagespage')}>
                <span className="inline-flex items-center"><svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h12a2 2 0 012 2z" /></svg>Start Negotiation</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }
    if (step === 1) {
      // Agreement Confirmation Modal UI
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-50 min-h-screen px-2 z-10">
          {/* Progress Bar always visible on top */}
          <div className="w-full max-w-md mx-auto pt-8">
            {renderProgressBar()}
          </div>
          <div className="relative w-full max-w-md mx-auto rounded-3xl shadow-2xl bg-white flex flex-col items-center p-0">
            {/* Yellow accent bar */}
            <div className="absolute top-0 left-0 w-full h-2 rounded-t-3xl bg-[#F5B800]" />
            <div className="flex flex-col items-center w-full pt-8 pb-6 px-8">
              {/* Top Icon Section */}
              <div className="mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-yellow-50 border border-yellow-100 shadow-sm">
                  <Shield className="w-8 h-8 text-[#F5B800]" />
                </div>
              </div>
              {/* Heading Section */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Agreement Reached!</h2>
              <p className="text-base text-gray-500 mb-6 text-center">The seller has accepted your proposed price.</p>
              {/* Price Summary Panel */}
              <div className="w-full bg-gray-50 rounded-xl p-5 mb-8 flex flex-col items-center">
                <span className="text-xs font-semibold text-gray-500 tracking-widest mb-2">AGREED PRICE</span>
                <div className="text-3xl font-bold text-gray-900 mb-2">₹28,500</div>
                <div className="w-full border-t border-gray-200 my-3" />
                <div className="flex w-full justify-between text-sm">
                  <span className="text-gray-500">Original Price <span className="font-medium text-gray-700">₹33,500</span></span>
                  <span className="text-green-600 font-semibold">Your Savings ₹5,000</span>
                </div>
              </div>
              {/* Primary Action */}
              <Button className="w-full py-4 rounded-full bg-green-500 hover:bg-green-600 text-white text-lg font-bold mb-3 shadow-md" onClick={() => setStep(2)}>
                Confirm &amp; Proceed <span className="ml-2">→</span>
              </Button>
              {/* Go to MessagesPage Action */}
              <Button
                variant="secondary"
                className="w-full py-3 rounded-full border-yellow-600 bg-yellow-50 text-yellow-600 font-semibold mb-3"
                onClick={() => navigate('/messages')}
              >
                Go to Messages
              </Button>
              {/* Secondary Action */}
              <Button variant="outline" className="w-full py-3 rounded-full border-red-300 text-red-600 font-semibold mb-4" onClick={() => setStep(0)}>
                Cancel Agreement
              </Button>
              {/* Footer Note */}
              <p className="text-xs text-gray-400 text-center mt-2 mb-1">
                By clicking confirm, you agree to meet the seller at the specified campus location.
              </p>
            </div>
          </div>
        </div>
      );
    }
    if (step === 2) {
      // Dedicated Checkout Page — Two Column Marketplace Layout
      return (
        <div className="grid lg:grid-cols-3 gap-8 w-full">
          {/* Left Column — Transaction Context */}
          <div className="lg:col-span-2 space-y-8">
            {/* Product Information Card */}
            <div className="flex bg-white rounded-2xl shadow-xl border border-gray-100 p-6 gap-6 items-center">
              <div className="relative min-w-[140px] max-w-[180px] w-full">
                <img src="/images/product-keyboard.png" alt="Product" className="rounded-xl w-full h-40 object-cover" />
                <span className="absolute top-3 left-3 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">Like New</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-gray-500 mb-1 block">Electronics</span>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Sony WH-1000XM4 Wireless Keyboard</h3>
                <p className="text-gray-600 mb-3 line-clamp-2">Industry-leading Wireless keyboard technology. Up to 30-hour battery life. Mechanical Keys.</p>
                <div className="flex items-center gap-2 mb-2">
                  <img src="/images/seller-avatar.jpg" alt="Seller" className="w-7 h-7 rounded-full" />
                  <span className="text-sm text-gray-600">Priya Sharma</span>
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                </div>
                <Button variant="outline" className="mt-2" onClick={() => {}}>
                  View Agreement
                </Button>
              </div>
            </div>
            {/* Delivery Method Section */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Delivery & Payment Method</h4>
              <div className="flex items-center gap-4">
                <div className="flex-1 flex items-center gap-4 border-2 border-green-500 bg-green-50 rounded-xl p-4">
                  <Calendar className="w-6 h-6 text-green-600" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">Location</span>
                      <span className="text-green-600 font-medium">FREE P2P</span>
                    </div>
                    <p className="text-sm text-gray-500">SALITER, Main Hall Entrance</p>
                    <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                      <Calendar className="w-4 h-4" />
                      <span>Proposed: Tomorrow at 2:30 PM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Important Information Panel */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              {/* Yellow accent bar and info label */}
              <div className="bg-[#F5B800] px-6 py-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-white" />
                <span className="text-sm font-bold text-white tracking-wider">IMPORTANT INFORMATION</span>
              </div>
              <div className="p-6">
                {/* Eco-Impact Box */}
                <div className="bg-green-50 rounded-lg flex items-center gap-3 px-4 py-3 mb-5">
                  <Leaf className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-900">Your Eco-Impact:</span>
                  <span className="text-green-900">By purchasing this used item, you are extending its lifecycle and reducing waste.</span>
                </div>
                {/* Meetup Safety */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-[#F5B800]" />
                    <span className="font-bold text-gray-900">Meetup Safety</span>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside ml-2">
                    <li>Always meet in well-lit, public campus locations like the Student Union.</li>
                    <li>Bring a friend or let someone know where you are going.</li>
                    <li>Inspect the item thoroughly before making the final payment.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          {/* Right Column — Persistent Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24 shadow-xl">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Actual Price</span>
                  <span>₹33,500</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Agreed Price</span>
                  <span>₹28,500</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Price Saved</span>
                  <span>-₹5,000</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery P2P</span>
                  <span className="text-green-600">Free</span>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total Payable</span>
                  <span className="text-2xl font-bold text-gray-900">₹28,500</span>
                </div>
              </div>
              <Button 
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-6 rounded-xl text-lg shadow-md"
                onClick={() => {
                  styledToast.success('Order Confirmed!', 'Your order has been placed successfully');
                  navigate('/ordersuccesspage');
                }}
              >
                Confirm Order
              </Button>
              <p className="text-xs text-gray-500 text-center mt-4">This is a single-item peer-to-peer transaction.</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress bar always visible on top, except in agreement modal where it's rendered inside modal */}
        {step !== 1 && renderProgressBar()}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {renderStepContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

