/**
 * Search results page.
 * Migrated to use TanStack Query hooks via @/state.
 */
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import { useListingsAsProducts, useCategories } from '@/state';

const conditions = ['New', 'Good', 'Fair'];
const priceRanges = [
  { label: 'Under ₹100', min: 0, max: 100 },
  { label: '₹100 - ₹300', min: 100, max: 300 },
  { label: '₹300 - ₹500', min: 300, max: 500 },
  { label: '₹500 - ₹1,000', min: 500, max: 1000 },
  { label: '₹1,000 - ₹5,000', min: 1000, max: 5000 },
  { label: '₹5,000+', min: 5000, max: Infinity },
];

export default function SearchResultsPage() {
    const navigate = useNavigate();
    const location = useLocation();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';

  const { data: products = [] } = useListingsAsProducts();
  const { data: categories = [] } = useCategories();
  
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters] = useState(false);

  const normalizeCategoryText = (value: string) => {
    const lower = value.toLowerCase().trim();
    const aliases: Record<string, string> = {
      textbook: 'textbook',
      textbooks: 'textbook',
      'study notes': 'study notes',
      'study note': 'study notes',
      stationary: 'stationary',
      stationery: 'stationary',
      'lab kits': 'lab kits',
      'lab kit': 'lab kits',
      electronics: 'electronics',
      'dorm furniture': 'dorm essentials',
      'dorm essentials': 'dorm essentials',
    };
    return aliases[lower] || lower;
  };

  useEffect(() => {
    let result = [...products];
    const categoryNameById = new Map(categories.map((cat) => [cat.id, normalizeCategoryText(cat.name)]));
    const resolveCategoryName = (value: string) => normalizeCategoryText(categoryNameById.get(value) || value);

    // Filter by search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(lowerQuery) ||
        resolveCategoryName(p.category).includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery)
      );
    }

    // Filter by category (fix: match by id or name)
    if (selectedCategory) {
      const selectedCategoryName = resolveCategoryName(selectedCategory);
      result = result.filter((p) => {
        const productCategoryName = resolveCategoryName(p.category);
        return p.category === selectedCategory || productCategoryName === selectedCategoryName;
      });
    }

    // Filter by condition (only allow New, Good, Fair)
    if (selectedConditions.length > 0) {
      result = result.filter(p => selectedConditions.includes(
        p.condition === 'New' || p.condition === 'Good' || p.condition === 'Fair'
          ? p.condition
          : 'Fair'
      ));
    }

    // Filter by price
    if (selectedPriceRange) {
      const range = priceRanges.find(r => r.label === selectedPriceRange);
      if (range) {
        result = result.filter(p => p.price >= range.min && p.price <= range.max);
      }
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
        break;
    }

    setFilteredProducts(result);
  }, [query, selectedCategory, selectedConditions, selectedPriceRange, sortBy, categories, products]);

  const toggleCondition = (condition: string) => {
    setSelectedConditions(prev => 
      prev.includes(condition) 
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const clearFilters = () => {
    setSelectedConditions([]);
    setSelectedPriceRange('');
    setSelectedCategory('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-8 bg-white rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              All Products for <span className="text-[#F5B800]">Your</span> Department
            </h1>
            <p className="text-gray-600 mb-2 max-w-lg">Find everything you need for the semester, from lab coats to advanced calculators.</p>
          </div>
          
        </div>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {query ? `Search results for "${query}"` : 'All Products'}
          </h2>
          <p className="text-gray-500">{filteredProducts.length} items found</p>
        </div>

        {/* Search & Sort Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F5B800]/30 outline-none"
            style={{ minWidth: 180 }}
          >
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          {(showFilters || window.innerWidth >= 1024) && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full lg:w-64 flex-shrink-0"
            >
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Filters</h3>
                  <button onClick={clearFilters} className="text-sm text-[#F5B800] hover:underline">
                    Clear All
                  </button>
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Category</h4>
                  <div className="space-y-2">
                    {categories.map(cat => (
                      <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          checked={selectedCategory === cat.id}
                          onChange={() => setSelectedCategory(cat.id === selectedCategory ? '' : cat.id)}
                          className="text-[#F5B800] focus:ring-[#F5B800]"
                        />
                        <span className="text-sm text-gray-600">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Condition Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Condition</h4>
                  <div className="space-y-2">
                    {conditions.map(condition => (
                      <label key={condition} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedConditions.includes(condition)}
                          onChange={() => toggleCondition(condition)}
                          className="text-[#F5B800] focus:ring-[#F5B800] rounded"
                        />
                        <span className="text-sm text-gray-600">{condition}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Filter */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Price Range</h4>
                  <div className="space-y-2">
                    {priceRanges.map(range => (
                      <label key={range.label} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="price"
                          checked={selectedPriceRange === range.label}
                          onChange={() => setSelectedPriceRange(range.label === selectedPriceRange ? '' : range.label)}
                          className="text-[#F5B800] focus:ring-[#F5B800]"
                        />
                        <span className="text-sm text-gray-600">{range.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ProductCard product={product} />
                    {location.state && location.state.fromAddProduct && (
                      <Button
                        className="mt-2 w-full bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => navigate('/communication/messages', { state: { selectedProduct: product } })}
                      >
                        Chat to Negotiate
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">Try adjusting your filters or search query</p>
                <Button onClick={clearFilters} className="mt-4 bg-[#F5B800] hover:bg-[#E5A800]">
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

