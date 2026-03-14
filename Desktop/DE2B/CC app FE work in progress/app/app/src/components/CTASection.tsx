/**
 * Reusable app component: C TA Se ct io n.
 */
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tag, HelpCircle } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/50"
        >
          <div className="grid lg:grid-cols-2 gap-0">
            {/* Text Content */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 leading-tight">
                Finished with your semester?
              </h2>
              <p className="text-base text-muted-foreground mb-8 leading-relaxed max-w-md">
                Don&apos;t let your valuable resources gather dust. Convert your used textbooks, electronics, and kits into cash while helping another student succeed. It&apos;s safe, local, and sustainable.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 h-auto rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <Tag className="w-5 h-5 mr-2" />
                    Start Selling Now
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    size="lg"
                    variant="outline"
                    className="border-2 border-gray-300 text-foreground hover:bg-gray-100 font-semibold px-6 py-3 h-auto rounded-lg transition-all"
                  >
                    <HelpCircle className="w-5 h-5 mr-2" />
                    How it works
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            {/* Image */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="relative h-64 lg:h-auto min-h-[400px]"
            >
              <img
                src="/images/cta-students.jpg"
                alt="Students exchanging books"
                className="absolute inset-0 w-full h-full object-cover lg:rounded-r-2xl"
              />
              {/* Subtle overlay for better text contrast if needed */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent lg:hidden" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

