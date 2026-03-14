/**
 * Reusable app component: C at eg or yC ar d.
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { 
  BookOpen, 
  Monitor, 
  HousePlus,
  FlaskConical, 
  PenTool, 
  FileText
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  BookOpen,
  Monitor,
  HousePlus,
  BedDouble: HousePlus,
  FlaskConical,
  PenTool,
  FileText,
};

interface CategoryCardProps {
  id: string;
  name: string;
  icon: string;
  listings: string;
  delay?: number;
}

export default function CategoryCard({ id, name, icon, delay = 0 }: CategoryCardProps) {
  const IconComponent = iconMap[icon] || BookOpen;

  return (
    <Link to={`/category/${id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        whileHover={{ y: -4 }}
        className="group flex flex-col items-center p-6 bg-white border border-gray-100 rounded-xl hover:shadow-lg hover:border-[#F5B800]/20 transition-all cursor-pointer"
      >
        <motion.div 
          className="w-14 h-14 bg-[#F5B800]/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#F5B800]/20 transition-colors"
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          <IconComponent className="w-7 h-7 text-[#F5B800]" />
        </motion.div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">{name}</h3>
      </motion.div>
    </Link>
  );
}

