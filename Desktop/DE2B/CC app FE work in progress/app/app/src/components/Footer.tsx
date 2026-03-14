/**
 * Reusable app component: F oo te r.
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Facebook, Instagram, Twitter, Linkedin, Mail } from 'lucide-react';

const footerLinks = {
  marketplace: [
    { label: 'All Categories', href: '/categories' },
    { label: 'Textbooks', href: '/category/textbooks' },
    { label: 'Electronics', href: '/category/electronics' },
    { label: 'Dorm Gear', href: '/category/furniture' },
    { label: 'Lab Equipment', href: '/category/lab-kits' },
  ],
  support: [
    { label: 'Help Center', href: '/help' },
    { label: 'Safety Guide', href: '/help/safety' },
    { label: 'Seller Guide', href: '/help/seller' },
    { label: 'Contact Us', href: '/help/contact' },
    { label: 'Report Issue', href: '/help/report' },
  ],
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press Kit', href: '/press' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
  account: [
    { label: 'My Profile', href: '/profile' },
    { label: 'My Orders', href: '/orders' },
    { label: 'My Listings', href: '/listings' },
    { label: 'Wishlist', href: '/wishlist' },
    { label: 'Settings', href: '/settings' },
  ],
};

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
];

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      {/* Newsletter Section
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Get notified about campus deals
              </h3>
              <p className="text-gray-600">
                Subscribe to receive alerts for new listings in your campus area.
              </p>
            </div>
            <div className="flex w-full md:w-auto gap-3">
              <div className="relative flex-1 md:w-72">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F5B800]/30 focus:border-[#F5B800] outline-none transition-all"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-[#F5B800] hover:bg-[#E5A800] text-white font-semibold rounded-xl transition-colors"
              >
                Subscribe
              </motion.button>
            </div>
          </div>
        </div>
      </div> */}

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/home" className="flex items-center gap-2 mb-4">
              <img 
                src="/images/campus cart logo header.png" 
                alt="CampusCart Logo" 
                className="h-16 w-auto object-contain" 
                style={{ maxWidth: '240px' }}
              />
            </Link>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              The premier marketplace for students to buy, sell, and trade academic essentials within their campus community.
            </p>
            <div className="flex items-center gap-2">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-[#F5B800] hover:text-white transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Marketplace Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Marketplace</h4>
            <ul className="space-y-3">
              {footerLinks.marketplace.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-sm text-gray-600 hover:text-[#F5B800] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-sm text-gray-600 hover:text-[#F5B800] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Account Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Account</h4>
            <ul className="space-y-3">
              {footerLinks.account.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-sm text-gray-600 hover:text-[#F5B800] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

