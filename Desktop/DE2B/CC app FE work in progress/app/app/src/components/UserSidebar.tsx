/**
 * Reusable app component: U se rS id eb ar.
 */
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Package, 
  ClipboardList, 
  Heart, 
  Settings, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useLogout } from '@/state';

const menuItems = [
  { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
  { id: 'orders', label: 'My Orders', icon: Package, href: '/orders' },
  { id: 'listings', label: 'My Listings', icon: ClipboardList, href: '/listings' },
  { id: 'wishlist', label: 'Wishlist', icon: Heart, href: '/wishlist' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
];

interface UserSidebarProps {
  activeItem?: string;
}

export default function UserSidebar({ activeItem }: UserSidebarProps) {
  const location = useLocation();
  const logoutMutation = useLogout();
  const logout = () => logoutMutation.mutate();
  
  const currentActive = activeItem || menuItems.find(item => location.pathname.startsWith(item.href))?.id || 'profile';

  return (
    <div className="w-full md:w-64 flex-shrink-0">
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <nav className="p-2">
          {menuItems.map((item) => {
            const isActive = currentActive === item.id;
            return (
              <Link key={item.id} to={item.href}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-[#F5B800] text-white' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span className="font-medium flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4" />}
                </motion.div>
              </Link>
            );
          })}
        </nav>
        
        <div className="border-t border-gray-100 p-2">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}

