/**
 * Reusable app component: C at eg or ie sS ec ti on.
 */
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import CategoryCard from './CategoryCard';

const categories = [
  { id: 'textbooks', icon: 'BookOpen', name: 'Textbooks', listings: '100+' },
  { id: 'electronics', icon: 'Monitor', name: 'Electronics', listings: '50+' },
  { id: 'furniture', icon: 'BedDouble', name: 'Dorm Furniture', listings: '20+' },
  { id: 'lab-kits', icon: 'FlaskConical', name: 'Lab Kits', listings: '180+' },
  { id: 'stationery', icon: 'PenTool', name: 'Stationery', listings: '60+' },
];

export default function CategoriesSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-center justify-between mb-8"
        >
          <h2 className="text-2xl font-bold text-foreground">
            Browse Categories
          </h2>
          <motion.a
            href="#"
            whileHover={{ x: 4 }}
            className="flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </motion.a>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {categories.map((category, index) => (
            <CategoryCard
              key={category.id}
              id={category.id}
              icon={category.icon}
              name={category.name}
              listings={category.listings}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

