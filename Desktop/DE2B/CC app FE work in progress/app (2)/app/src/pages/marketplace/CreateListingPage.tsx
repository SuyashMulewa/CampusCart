/**
 * Page component for the C re at eL is ti ng Pa ge route and related page-level interactions.
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Upload, 
  X, 
  Camera, 
  Lightbulb,
  MessageSquare,
  User,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { categories, myListings } from '@/data/mockData';

const conditions = [
  { id: 'new', label: 'New', description: 'Like new, unused' },
  { id: 'good', label: 'Good', description: 'Minimal wear, functional' },
  { id: 'fair', label: 'Fair', description: 'Visible wear, still usable' },
];

export default function CreateListingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for edit mode via query param
  const params = new URLSearchParams(location.search);
  const editId = params.get('edit');

  // Find listing if editing
  const editingListing = editId ? myListings.find(l => l.id === editId) : null;

  const [images, setImages] = useState<string[]>(editingListing && editingListing.images ? editingListing.images : (editingListing && editingListing.image ? [editingListing.image] : []));
  const [formData, setFormData] = useState({
    title: editingListing?.title || '',
    category: editingListing?.category || '',
    condition: (editingListing?.condition?.toLowerCase?.() || 'new'),
    price: editingListing?.price?.toString() || '',
    location: editingListing?.location || '',
    description: editingListing?.description || '',
    enableNegotiation: editingListing?.isNegotiable ?? true,
    showContactInfo: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If editId changes, update form
  useEffect(() => {
    if (editingListing) {
      setFormData({
        title: editingListing.title || '',
        category: editingListing.category || '',
        condition: (editingListing.condition?.toLowerCase?.() || 'new'),
        price: editingListing.price?.toString() || '',
        location: editingListing.location || '',
        description: editingListing.description || '',
        enableNegotiation: editingListing.isNegotiable ?? true,
        showContactInfo: false,
      });
      setImages(editingListing.images || (editingListing.image ? [editingListing.image] : []));
    }
  }, [editId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    window.alert('Your item is listed.');
    navigate('/listings');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{editId ? 'Edit Listing' : 'Create New Listing'}</h1>
            <p className="text-gray-500">{editId ? 'Update your listing details below.' : 'Fill in the details below to reach thousands of students on campus.'}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            {/* Images */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-100 p-6"
            >
              <h3 className="font-semibold text-gray-900 mb-4">Product Images</h3>
              <div className="grid grid-cols-4 gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-[#F5B800] hover:bg-[#F5B800]/5 transition-colors"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Upload</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-gray-500 mt-3">PNG, JPG, or WEBP up to 10MB each</p>
            </motion.div>

            {/* Item Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border border-gray-100 p-6"
            >
              <h3 className="font-semibold text-gray-900 mb-4">Item Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Campbell Biology 12th Edition"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F5B800]/30 focus:border-[#F5B800] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F5B800]/30 focus:border-[#F5B800] outline-none"
                    required
                  >
                    <option value="" disabled hidden>Select a Category for your product</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Condition & Price */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl border border-gray-100 p-6"
            >
              <h3 className="font-semibold text-gray-900 mb-4">Condition & Price</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                <div className="grid grid-cols-3 gap-3">
                  {conditions.map(cond => (
                    <button
                      key={cond.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, condition: cond.id })}
                      className={`p-4 border-2 rounded-xl text-left transition-all ${
                        formData.condition === cond.id
                          ? 'border-[#F5B800] bg-[#F5B800]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium text-gray-900">{cond.label}</p>
                      <p className="text-xs text-gray-500">{cond.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F5B800]/30 focus:border-[#F5B800] outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Public place, Area, City"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F5B800]/30 focus:border-[#F5B800] outline-none"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: Public place, Area, City</p>
                </div>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl border border-gray-100 p-6"
            >
              <h3 className="font-semibold text-gray-900 mb-4">Description & Seller Options</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the item's condition, features, and any included accessories..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F5B800]/30 focus:border-[#F5B800] outline-none resize-none"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Enable Price Negotiation Chat</p>
                      <p className="text-sm text-gray-500">Allow buyers to make offers and discuss the price via chat.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, enableNegotiation: !formData.enableNegotiation })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      formData.enableNegotiation ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      formData.enableNegotiation ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Show Contact Info</p>
                      <p className="text-sm text-gray-500">Make your phone number and email visible to interested buyers.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, showContactInfo: !formData.showContactInfo })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      formData.showContactInfo ? 'bg-[#F5B800]' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      formData.showContactInfo ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </label>
              </div>
            </motion.div>

            {/* Submit */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-6"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Publish Listing'
                )}
              </Button>
            </motion.div>
          </form>

          {/* Live Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Live Preview</h3>
                <span className="text-xs text-gray-400 uppercase tracking-wider">Desktop View</span>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="relative aspect-[4/3] bg-gray-100">
                  {images.length > 0 ? (
                    <img src={images[0]} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  <Badge className="absolute top-3 left-3 bg-gray-900 text-white">
                    {formData.condition ? formData.condition.toUpperCase() : 'NEW'}
                  </Badge>
                </div>
                <div className="p-4">
                  {/* Category Tag */}
                  <Badge className="font-semibold text-gray-900 line-clamp-2 mb-2">
                    {formData.title || 'Category'}
                  </Badge>
                  <h4 className="font-semibold text-gray-900 line-clamp-2 mb-2">
                    {formData.title || 'Product Title'}
                  </h4>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-bold text-gray-900">
                      {formData.price ? `₹${formData.price}` : '₹0'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <span className="truncate">{formData.location || 'Location'}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-[#F5B800] hover:bg-[#E5A800] text-white text-sm">
                      Add to Bag
                    </Button>
                    <button className="p-2 border border-gray-200 rounded-lg">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Tip */}
              <div className="mt-4 bg-amber-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900 text-sm">Quick Tip</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Listings with high-quality photos from multiple angles sell 3x faster than listings with a single stock image.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function Heart({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

