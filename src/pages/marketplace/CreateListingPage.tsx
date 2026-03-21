/**
 * Page component for the C re at eL is ti ng Pa ge route and related page-level interactions.
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Upload, 
  X, 
  Camera, 
  Lightbulb,
  ArrowLeft,
  Heart,
  MapPin,
  ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCategories, useListing, useListingsAsProducts, useCreateListing, useCurrentUser, useUpdateListing } from '@/state';
import type { Product } from '@/data/mockData';
import type { ListingCondition } from '@/models';
import { styledToast } from '@/utils/styledToast';
import { isUserFullyVerified } from '@/utils/profileVerification';

const conditions = [
  { id: 'new', label: 'New', description: 'Like new, unused' },
  { id: 'good', label: 'Good', description: 'Minimal wear, functional' },
  { id: 'fair', label: 'Fair', description: 'Visible wear, still usable' },
];

const conditionBadgeColors: Record<string, string> = {
  new: 'bg-green-500 text-white',
  good: 'bg-amber-500 text-white',
  fair: 'bg-gray-500 text-white',
};

const conditionBadgeLabels: Record<string, string> = {
  new: 'NEW',
  good: 'GOOD',
  fair: 'FAIR',
};

const purchaseAgeOptions = [
  { id: '1 month',   label: '1 Month' },
  { id: '3 months',  label: '3 Months' },
  { id: '6 months',  label: '6 Months' },
  { id: '9 months',  label: '9 Months' },
  { id: '1 year',    label: '1 Year' },
  { id: '1.5 years', label: '1.5 Years' },
  { id: '2+ years',  label: '2+ Years' },
];

export default function CreateListingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: user } = useCurrentUser();
  const { data: categories = [] } = useCategories();
  const { data: allProducts = [] } = useListingsAsProducts();
  const createListingMutation = useCreateListing();
  const updateListingMutation = useUpdateListing();

  const params = new URLSearchParams(location.search);
  const editId = params.get('edit');
  const { data: listingDetails } = useListing(editId || undefined);

  const currentUserId = localStorage.getItem('campuscart_current_user_id') || sessionStorage.getItem('campuscart_current_user_id') || '';
  const myListings = allProducts.filter((p: Product) => p.seller.id === currentUserId);
  const editingListing = editId ? myListings.find(l => l.id === editId) : null;

  const [images, setImages] = useState<string[]>(
    editingListing && editingListing.images
      ? editingListing.images
      : editingListing && editingListing.image
        ? [editingListing.image]
        : []
  );
  const [formData, setFormData] = useState({
    title: editingListing?.title || '',
    category: editingListing?.category || '',
    condition: editingListing?.condition?.toLowerCase?.() || 'new',
    price: editingListing?.price?.toString() || '',
    mrp: editingListing?.originalPrice?.toString() || editingListing?.price?.toString() || '',
    purchaseAge: '',
    description: editingListing?.description || '',
    maxNegotiationLimit: editingListing?.price?.toString() || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const selectedCategoryName = useMemo(() => {
    const category = categories.find((cat) => cat.id === formData.category || cat.name === formData.category);
    return category?.name || formData.category || 'Category';
  }, [categories, formData.category]);

  const numericPrice = Number(formData.price) || 0;
  const numericMrp = Number(formData.mrp) || 0;
  const discountPercent =
    numericMrp > numericPrice && numericPrice > 0
      ? Math.round(((numericMrp - numericPrice) / numericMrp) * 100)
      : 0;

  useEffect(() => {
    if (listingDetails) {
      const storedPurchaseAge = listingDetails.specifications?.['Date of Purchase'] || '';
      setFormData({
        title: listingDetails.title || '',
        category: listingDetails.category || '',
        condition: listingDetails.condition?.toLowerCase?.() || 'new',
        price: listingDetails.price?.toString() || '',
        mrp: listingDetails.mrp?.toString() || listingDetails.price?.toString() || '',
        purchaseAge: storedPurchaseAge,
        description: listingDetails.description || '',
        maxNegotiationLimit: listingDetails.negotiableMinPrice?.toString() || listingDetails.price?.toString() || '',
      });
      setImages(listingDetails.images || (listingDetails.image ? [listingDetails.image] : []));
      return;
    }
    if (editingListing) {
      setFormData({
        title: editingListing.title || '',
        category: editingListing.category || '',
        condition: editingListing.condition?.toLowerCase?.() || 'new',
        price: editingListing.price?.toString() || '',
        mrp: editingListing.originalPrice?.toString() || editingListing.price?.toString() || '',
        purchaseAge: '',
        description: editingListing.description || '',
        maxNegotiationLimit: editingListing.price?.toString() || '',
      });
      setImages(editingListing.images || (editingListing.image ? [editingListing.image] : []));
    }
  }, [editingListing, listingDetails]);

  useEffect(() => {
    if (!user) return;
    if (!isUserFullyVerified(user)) {
      styledToast.warning('Verification required', 'Complete profile verification to sell products.');
      navigate('/profile');
    }
  }, [navigate, user]);

  useEffect(() => {
    if (!formData.maxNegotiationLimit) return;
    const maxPrice = Number(formData.price) || 0;
    const limit = Number(formData.maxNegotiationLimit) || 0;
    if (maxPrice > 0 && limit > maxPrice) {
      setFormData((prev) => ({ ...prev, maxNegotiationLimit: String(maxPrice) }));
    }
  }, [formData.maxNegotiationLimit, formData.price]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) {
          styledToast.error('Invalid file', 'Only image files are allowed.');
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          styledToast.error('File too large', 'Each image must be 5MB or less.');
          return;
        }
        if (images.length >= 8) {
          styledToast.error('Image limit reached', 'You can upload up to 8 images.');
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => {
            if (prev.length >= 8) return prev;
            return [...prev, reader.result as string];
          });
          setFieldErrors((prev) => ({ ...prev, images: '' }));
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

    const nextErrors: Record<string, string> = {};
    const trimmedTitle = formData.title.trim();
    const trimmedDescription = formData.description.trim();
    const price = Number(formData.price);
    const mrp = Number(formData.mrp);
    const negotiableLimit = Number(formData.maxNegotiationLimit);

    if (images.length === 0) {
      nextErrors.images = 'Upload at least 1 product image';
    }
    if (trimmedTitle.length < 5 || trimmedTitle.length > 120) {
      nextErrors.title = 'Title must be 5 to 120 characters';
    }
    if (!formData.category) {
      nextErrors.category = 'Please select a category';
    }
    if (trimmedDescription.length < 20 || trimmedDescription.length > 1000) {
      nextErrors.description = 'Description must be 20 to 1000 characters';
    }
    if (!Number.isFinite(price) || price <= 0) {
      nextErrors.price = 'Price must be greater than 0';
    }
    if (!Number.isFinite(mrp) || mrp <= 0) {
      nextErrors.mrp = 'MRP must be greater than 0';
    } else if (Number.isFinite(price) && mrp < price) {
      nextErrors.mrp = 'MRP must be greater than or equal to price';
    }
    if (!Number.isFinite(negotiableLimit) || negotiableLimit <= 0) {
      nextErrors.maxNegotiationLimit = 'Negotiable limit must be greater than 0';
    } else if (Number.isFinite(price) && negotiableLimit > price) {
      nextErrors.maxNegotiationLimit = 'Negotiable limit cannot exceed selling price';
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      styledToast.error('Invalid listing details', Object.values(nextErrors)[0]);
      return;
    }

    setIsSubmitting(true);
    const conditionMap: Record<string, ListingCondition> = {
      new: 'New',
      good: 'Good',
      fair: 'Fair',
    };
    try {
      const safePrice = Number(formData.price) || 0;
      const safeMrp = Number(formData.mrp) || safePrice;
      const parsedLimit = Number(formData.maxNegotiationLimit);
      const negotiableMinPrice = Number.isNaN(parsedLimit) ? safePrice : Math.min(parsedLimit, safePrice);
      const dateOfPurchase = formData.purchaseAge;
      const payload = {
        title: trimmedTitle,
        description: trimmedDescription,
        price: safePrice,
        mrp: safeMrp,
        negotiableMinPrice,
        category: formData.category,
        condition: conditionMap[formData.condition] || 'Good',
        location: editingListing?.location || user?.university || 'Campus',
        image: images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop',
        images: images.length > 0 ? images : undefined,
        isNegotiable: true,
        specifications: dateOfPurchase ? { 'Date of Purchase': dateOfPurchase } : undefined,
      };
      if (editId) {
        await updateListingMutation.mutateAsync({ id: editId, dto: payload });
        styledToast.success('Listing updated', 'Listing details were saved.');
      } else {
        await createListingMutation.mutateAsync(payload);
        styledToast.success('Listing published', 'Your item is now live.');
      }
      navigate('/listings');
    } catch (err) {
      console.error('Failed to save listing:', err);
      styledToast.error('Save failed', 'Failed to save listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
            <p className="text-gray-500">
              {editId
                ? 'Update your listing details below.'
                : 'Fill in the details below to reach thousands of students on campus.'}
            </p>
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
              {fieldErrors.images && <p className="mt-2 text-xs text-red-500">{fieldErrors.images}</p>}
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
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      setFieldErrors((prev) => ({ ...prev, title: '' }));
                    }}
                    placeholder="e.g. brand, product name, model ..."
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-[#F5B800]/30 focus:border-[#F5B800] outline-none ${
                      fieldErrors.title ? 'border-red-300' : 'border-gray-200'
                    }`}
                    required
                  />
                  {fieldErrors.title && <p className="mt-1 text-xs text-red-500">{fieldErrors.title}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      setFormData({ ...formData, category: e.target.value });
                      setFieldErrors((prev) => ({ ...prev, category: '' }));
                    }}
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-[#F5B800]/30 focus:border-[#F5B800] outline-none ${
                      fieldErrors.category ? 'border-red-300' : 'border-gray-200'
                    }`}
                    required
                  >
                    <option value="" disabled hidden>Select a Category for your product</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {fieldErrors.category && <p className="mt-1 text-xs text-red-500">{fieldErrors.category}</p>}
                </div>
                <div className="mb-4 col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    setFieldErrors((prev) => ({ ...prev, description: '' }));
                  }}
                  placeholder="Describe the item's condition, features, and any included accessories..."
                  rows={4}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-[#F5B800]/30 focus:border-[#F5B800] outline-none resize-none ${
                    fieldErrors.description ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                {fieldErrors.description && <p className="mt-1 text-xs text-red-500">{fieldErrors.description}</p>}
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

              {/* Item age */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">How old is the item?</label>
                <div className="flex flex-wrap gap-5">
                  {purchaseAgeOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, purchaseAge: formData.purchaseAge === opt.id ? '' : opt.id })
                      }
                      className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                        formData.purchaseAge === opt.id
                          ? 'border-[#F5B800] bg-[#F5B800]/10 text-gray-900'
                          : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                <div className="grid grid-cols-3 gap-3">
                  {conditions.map(cond => (
                    <button
                      key={cond.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, condition: cond.id })}
                      className={`p-4 border-2 rounded-xl text-center transition-all ${
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

              {/* Price / MRP / Negotiable Upto */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">(₹) PRICE (Your product price for sale)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => {
                        setFormData({ ...formData, price: e.target.value });
                        setFieldErrors((prev) => ({ ...prev, price: '' }));
                      }}
                      placeholder="0.00"
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-[#F5B800]/30 focus:border-[#F5B800] outline-none ${
                        fieldErrors.price ? 'border-red-300' : 'border-gray-200'
                      }`}
                      required
                    />
                  </div>
                  {fieldErrors.price && <p className="mt-1 text-xs text-red-500">{fieldErrors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">MRP / Original Price (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      value={formData.mrp}
                      onChange={(e) => {
                        setFormData({ ...formData, mrp: e.target.value });
                        setFieldErrors((prev) => ({ ...prev, mrp: '' }));
                      }}
                      placeholder="0.00"
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-[#F5B800]/30 focus:border-[#F5B800] outline-none ${
                        fieldErrors.mrp ? 'border-red-300' : 'border-gray-200'
                      }`}
                      required
                    />
                  </div>
                  {fieldErrors.mrp && <p className="mt-1 text-xs text-red-500">{fieldErrors.mrp}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PRICE Negotiable Upto (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      value={formData.maxNegotiationLimit}
                      max={formData.price || undefined}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        const maxPrice = Number(formData.price) || 0;
                        const numericValue = Number(inputValue);
                        const nextValue = Number.isNaN(numericValue)
                          ? ''
                          : String(maxPrice > 0 ? Math.min(numericValue, maxPrice) : numericValue);
                        setFormData({ ...formData, maxNegotiationLimit: inputValue === '' ? '' : nextValue });
                        setFieldErrors((prev) => ({ ...prev, maxNegotiationLimit: '' }));
                      }}
                      placeholder="0.00"
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-[#F5B800]/30 focus:border-[#F5B800] outline-none ${
                        fieldErrors.maxNegotiationLimit ? 'border-red-300' : 'border-gray-200'
                      }`}
                      required
                    />
                  </div>
                  {fieldErrors.maxNegotiationLimit && <p className="mt-1 text-xs text-red-500">{fieldErrors.maxNegotiationLimit}</p>}
                </div>
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
                  editId ? 'Save Details' : 'Publish Listing'
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
                <h3 className="font-medium text-black">Live Preview</h3>
              </div>
              <div className="group bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <div className="relative aspect-[4/3] bg-gray-100">
                  {images.length > 0 ? (
                    <img src={images[0]} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  <Badge className={`absolute top-3 left-3 ${conditionBadgeColors[formData.condition] || 'bg-gray-500 text-white'}`}>
                    {conditionBadgeLabels[formData.condition] || 'FAIR'}
                  </Badge>
                  <button
                    type="button"
                    className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                    aria-label="Add to wishlist preview"
                  >
                    <Heart className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <div className="p-4">
                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-100 mb-2">
                    {selectedCategoryName.toUpperCase()}
                  </Badge>
                  <h4 className="font-semibold text-gray-900 line-clamp-2 mb-2">
                    {formData.title || 'Product Title'}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{editingListing?.location || user?.university || 'Campus'}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-gray-900">
                        {formData.price ? `₹${Number(formData.price).toLocaleString()}` : '₹0'}
                      </span>
                      {numericMrp > 0 && (
                        <span className="text-sm text-gray-400 line-through">
                          ₹{numericMrp.toLocaleString()}
                        </span>
                      )}
                      {discountPercent > 0 && (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs font-semibold">
                          {discountPercent}% OFF
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-[#F5B800] hover:bg-[#E5A800] text-white text-sm">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-amber-50 rounded-xl p-4 border border-amber-100">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900 text-lg mb-5">Quick Tips</p>
                    <p className="text-sm text-amber-700 mt-1 mb-3">
                      Keep your title specific and add clear photos to improve buyer trust.
                    </p>
                    <p className="text-sm text-amber-700 mt-1 mb-3">
                      Set a realistic price and provide correct MRP.
                    </p>
                    <p className="text-sm text-amber-700 mt-1 mb-3">
                      Set a fair negotiation floor to attract more buyers and close deals faster.
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
