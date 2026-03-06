/**
 * Page component for the L an di ng Pa ge route and related page-level interactions.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  { icon: CheckCircle, text: 'Verified student community' },
  { icon: CheckCircle, text: 'Safe campus meetups' },
  { icon: CheckCircle, text: 'No shipping hassles peer2peer Transaction' },
  { icon: CheckCircle, text: 'Save up to 50% on study resources' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [email] = useState('');

  const handleGetStarted = () => {
    if (email.trim()) {
      navigate('/signup', { state: { email } });
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/images/campus cart logo header.png"
                alt="CampusCart Logo"
                className="h-16 w-auto object-contain"
                style={{ maxWidth: '240px' }}
              />
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button className="bg-[#71b55a] hover:bg-[#E5A800] text-white font-semibold px-5 ">
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-[#F5B800] hover:bg-[#E5A800] text-white font-semibold px-5">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5B800]/10 rounded-full mb-6"
              >
                <span className="w-2 h-2 bg-[#F5B800] rounded-full animate-pulse" />
                <span className="text-sm font-medium text-[#F5B800]">Connecting Students Across Universities</span>
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Buy & Sell on Your {' '}
                <span className="text-[#F5B800]">Campus</span>
              </h1>

              <p className="text-lg text-gray-600 mb-8 max-w-lg">
                The trusted marketplace for students. Buy textbooks, electronics, and dorm essentials from fellow students at unbeatable prices.
              </p>

              {/* Features */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <feature.icon className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-gray-600">{feature.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGetStarted}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-[#F5B800] hover:bg-[#E5A800] text-white font-semibold rounded-xl transition-colors"
                >
                  Join Our Community and Start Your Learning Journey with CampusCart
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </div>

              <p className="text-sm text-gray-500 mt-4">
                Already have an account?{' '}
                <Link to="/login" className="text-[#F5B800] font-medium hover:underline">
                  Log in
                </Link>
              </p>
            </motion.div>

            {/* Right Content - Hero Image */}
            <div className="flex justify-center items-center w-full">
              <img
                src="/images/campus-cart-banner.png"
                alt="CampusCart Banner"
                className="w-full max-w-lg h-auto"
                style={{ minWidth: '260px', maxHeight: '420px' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600">Buy and sell in three simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'List Your Items', desc: 'Snap a photo, set a price, and publish in seconds' },
              { step: '02', title: 'Connect & Negotiate', desc: 'Chat with buyers and agree on a fair price' },
              { step: '03', title: 'Meet & Exchange', desc: 'Meet safely on campus and complete the deal' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-[#F5B800] rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-xl font-bold text-white">{item.step}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#F5B800]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to start buying and selling?
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Join thousands of students saving money and reducing waste by joining CampusCart.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button className="bg-white text-[#F5B800] hover:bg-gray-100 font-semibold px-8 py-6 text-lg rounded-xl">
                Create Free Account
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="border-2 border-white text-yellow-500 hover:bg-white/10 font-semibold px-8 py-6 text-lg rounded-xl">
                Browse Listings
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <Link to="/" className="flex items-center">
              <img
                src="/images/campus cart logo header.png"
                alt="CampusCart Logo"
                className="h-16 w-auto object-contain"
                style={{ maxWidth: '240px' }}
              />
            </Link>
            <p className="text-sm text-gray-500">
              © CampusCart Inc.
            </p>
            <div className="flex items-center">
              <Link to="/help" className="text-sm text-gray-500 hover:text-gray-900">Help Center</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

