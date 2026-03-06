/**
 * Reusable app component: N av ba r.
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {  
  Search, 
  LayoutGrid, 
  MessageSquare, 
  Bell, 
  ShoppingCart,
  User,
  Plus,
  Menu,
  X,
  Heart,
  Package,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useNotifications } from '@/context/NotificationContext';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems: cartCount } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const { unreadCount: notificationCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  // Don't show navbar on auth pages
  if (location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/') {
    return null;
  }

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' 
            : 'bg-white border-b border-gray-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/homepage" className="flex items-center gap-2">
              <img 
                src="/images/campus cart logo header.png" 
                alt="CampusCart Logo" 
                className="h-16 w-auto object-contain" 
                style={{ maxWidth: '240px' }}
              />
            </Link>

            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search textbooks, ISBNs, or electronics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-full text-sm focus:ring-2 focus:ring-[#F5B800]/30 focus:bg-white transition-all"
                />
              </div>
            </form>

            {/* Right Section - Desktop */}
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <NavIcon icon={LayoutGrid} label="Categories" to="/searchresultspage" />
                  <NavIcon icon={MessageSquare} label="Messages" to="/messages" />
                  <NavIcon icon={Bell} label="Notifications" to="/notifications" badge={notificationCount} />
                  <NavIcon icon={ShoppingCart} label="Cart" to="/cart" badge={cartCount} />
                  
                  {/* Sell Button */}
                  <Link to="/create-listing">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-1.5 bg-[#F5B800] hover:bg-[#E5A800] text-white font-semibold px-4 py-2 rounded-full ml-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Sell
                    </motion.button>
                  </Link>

                  {/* User Dropdown */}
                  <div className="relative ml-2">
                    <Link to="/profile">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="relative cursor-pointer"
                      >
                        <User className="w-9 h-9 border-2 border-gray-100 hover:border-[#F5B800]/30 transition-colors rounded-full bg-white p-1" />
                        {user?.isVerified && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                        )}
                      </motion.div>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login">
                    <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button className="bg-[#F5B800] hover:bg-[#E5A800] text-white font-semibold px-5">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white pt-16 md:hidden"
          >
            <div className="p-4 space-y-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-100 border-0 rounded-xl"
                  />
                </div>
              </form>

              {isAuthenticated ? (
                <>
                  {/* User Info */}
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback><User className="w-6 h-6" /></AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-sm text-gray-500">{user?.university}</p>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="space-y-2">
                    <MobileMenuItem icon={LayoutGrid} label="Browse Categories" to="/searchresultspage" onClick={() => setIsMobileMenuOpen(false)} />
                    <MobileMenuItem icon={ShoppingCart} label="My Cart" to="/cart" badge={cartCount} onClick={() => setIsMobileMenuOpen(false)} />
                    <MobileMenuItem icon={Heart} label="Wishlist" to="/wishlist" badge={wishlistCount} onClick={() => setIsMobileMenuOpen(false)} />
                    <MobileMenuItem icon={Package} label="My Orders" to="/orders" onClick={() => setIsMobileMenuOpen(false)} />
                    <MobileMenuItem icon={MessageSquare} label="Messages" to="/messages" onClick={() => setIsMobileMenuOpen(false)} />
                    <MobileMenuItem icon={Bell} label="Notifications" to="/notifications" badge={notificationCount} onClick={() => setIsMobileMenuOpen(false)} />
                    <MobileMenuItem icon={User} label="My Profile" to="/profile" onClick={() => setIsMobileMenuOpen(false)} />
                  </div>

                  {/* Sell Button */}
                  <Link to="/create-listing" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full bg-[#F5B800] hover:bg-[#E5A800] text-white font-semibold py-3 rounded-xl">
                      <Plus className="w-5 h-5 mr-2" />
                      Sell an Item
                    </Button>
                  </Link>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-4 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full py-3 rounded-xl">Login</Button>
                  </Link>
                  <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full bg-[#F5B800] hover:bg-[#E5A800] text-white py-3 rounded-xl">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavIcon({ 
  icon: Icon, 
  label, 
  to,
  badge 
}: { 
  icon: React.ElementType; 
  label: string; 
  to: string;
  badge?: number;
}) {
  return (
    <Link to={to}>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="relative p-2.5 text-gray-500 hover:text-gray-900 transition-colors rounded-xl hover:bg-gray-100"
        aria-label={label}
      >
        <Icon className="w-5 h-5" />
        {badge ? (
          <Badge 
            variant="destructive" 
            className="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center bg-red-500"
          >
            {badge > 99 ? '99+' : badge}
          </Badge>
        ) : null}
      </motion.button>
    </Link>
  );
}

function MobileMenuItem({ 
  icon: Icon, 
  label, 
  to, 
  badge,
  onClick 
}: { 
  icon: React.ElementType; 
  label: string; 
  to: string;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <Link to={to} onClick={onClick}>
      <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">{label}</span>
        </div>
        {badge ? (
          <Badge className="bg-[#F5B800] text-white">{badge}</Badge>
        ) : null}
      </div>
    </Link>
  );
}

