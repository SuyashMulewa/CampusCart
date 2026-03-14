/**
 * Reusable app component: H er oS ec ti on.
 */
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Tag } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-[500px] lg:min-h-[550px] overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: 'url(/images/hero-bg.jpg)',
        }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col justify-center h-full min-h-[500px] lg:min-h-[550px] py-16 max-w-2xl"
        >
          {/* Badge */}
          <motion.div variants={itemVariants}>
            <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full mb-6">
              TRUSTED BY 50,000+ STUDENTS
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1 
            variants={itemVariants}
            className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-white leading-[1.1] mb-6"
          >
            Better for your{' '}
            <span className="text-primary">GPA</span>.
            <br />
            Better for the{' '}
            <span className="text-primary">Planet</span>.
          </motion.h1>

          {/* Subtext */}
          <motion.p 
            variants={itemVariants}
            className="text-base sm:text-lg text-gray-200 mb-8 max-w-lg leading-relaxed"
          >
            Buy and sell pre-loved textbooks, lab kits, and dorm essentials within your campus community. Save money and reduce waste.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-wrap gap-4"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 h-auto rounded-lg shadow-lg hover:shadow-xl transition-shadow"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Start Shopping
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-foreground font-semibold px-6 py-3 h-auto rounded-lg bg-transparent transition-all"
              >
                <Tag className="w-5 h-5 mr-2" />
                Sell Items
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

