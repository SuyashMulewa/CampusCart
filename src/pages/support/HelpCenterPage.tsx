/**
 * Page component for the H el pC en te rP ag e route and related page-level interactions.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronDown, MessageCircle, Shield, BookOpen, Truck, CreditCard, User } from 'lucide-react';

const helpCategories = [
  {
    icon: BookOpen,
    title: 'Getting Started',
    articles: ['How to create an account', 'How to list an item', 'How to buy an item'],
  },
  {
    icon: Shield,
    title: 'Safety & Security',
    articles: ['Safe meetup guidelines', 'How to report a user', 'Account verification'],
  },
  {
    icon: Truck,
    title: 'Shipping & Delivery',
    articles: ['Campus meetup locations', 'Delivery options', 'Tracking your order'],
  },
  {
    icon: CreditCard,
    title: 'Payments',
    articles: ['Payment methods', 'Refund policy', 'Price negotiation'],
  },
  {
    icon: User,
    title: 'Account & Profile',
    articles: ['Edit your profile', 'Change password', 'Delete account'],
  },
  {
    icon: MessageCircle,
    title: 'Contact Support',
    articles: ['Submit a ticket', 'Live chat', 'Email support'],
  },
];

const faqs = [
  {
    question: 'How do I create a listing?',
    answer: 'To create a listing, click the "+ Sell" button in the navigation bar. Fill in the product details, upload photos, set your price, and publish. Your listing will be visible to other students on your campus.',
  },
  {
    question: 'Is CampusCart safe?',
    answer: 'Yes! CampusCart is designed exclusively for verified students. We recommend always meeting in public campus locations like the Student Union or Library. Never share personal financial information through the chat.',
  },
  {
    question: 'How does payment work?',
    answer: 'CampusCart supports peer-to-peer payments. You can pay via cash, UPI, or other methods when you meet the seller in person. We recommend inspecting the item before making payment.',
  },
  {
    question: 'Can I negotiate prices?',
    answer: 'Absolutely! Most sellers are open to negotiation. Use the chat feature to discuss prices with the seller and come to a mutually agreeable price.',
  },
  {
    question: 'What if an item is not as described?',
    answer: 'We recommend thoroughly inspecting items before payment. If there is a significant discrepancy, you can report the issue through our support system. CampusCart is not responsible for transactions but we help mediate disputes.',
  },
];

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-4">How can we help?</h1>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12"
        >
          {helpCategories.map((category, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -4 }}
              className="bg-white rounded-xl border border-gray-100 p-6 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 bg-[#F5B800]/10 rounded-xl flex items-center justify-center mb-4">
                <category.icon className="w-6 h-6 text-[#F5B800]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{category.title}</h3>
              <ul className="space-y-1">
                {category.articles.slice(0, 2).map((article, i) => (
                  <li key={i} className="text-sm text-gray-500 hover:text-[#F5B800] cursor-pointer">
                    {article}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedFaq === index && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    className="px-4 pb-4"
                  >
                    <p className="text-gray-600">{faq.answer}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-[#F5B800] rounded-2xl p-8 text-center"
        >
          <h2 className="text-xl font-bold text-white mb-2">Still need help?</h2>
          <p className="text-white/80 mb-6">Our support team is here to assist you</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button className="px-6 py-3 bg-white text-[#F5B800] font-semibold rounded-xl hover:bg-gray-100 transition-colors">
              Contact Support
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

