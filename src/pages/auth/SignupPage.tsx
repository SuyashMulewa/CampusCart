/**
 * Page component for the Signup route.
 * Features:
 * - Full name: alphabets & spaces only, minimum 3 characters
 * - Email: blocks disposable/temporary email addresses
 * - University: searchable combobox with Indian universities
 * - Password: strength indicator with real-time tips
 * - Terms & Conditions: dialog with project-specific T&C
 * - Routing: existing email → toast notification + redirect to login
 * - Auth: data persisted to IndexedDB via Dexie + session stored in sessionStorage
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Lock, ArrowRight } from 'lucide-react';
import { styledToast } from '@/utils/styledToast';
import { useSignup } from '@/state';
import { ApiError } from '@/models';
import { validateName, isNameCharValid, validateEmail, evaluatePasswordStrength } from '@/utils/validation';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';
import UniversityCombobox from '@/components/UniversityCombobox';
import TermsAndConditionsDialog from '@/components/TermsAndConditionsDialog';

export default function SignupPage() {
  const navigate = useNavigate();
  const signupMutation = useSignup();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    university: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ─── Handlers ─────────────────────────────────────────

  /** Handle name input — only allow alphabets and spaces */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Filter out invalid characters
    const filtered = val.split('').filter(isNameCharValid).join('');
    setFormData((prev) => ({ ...prev, name: filtered }));

    // Validate and show field error
    if (filtered.length > 0) {
      const nameError = validateName(filtered);
      setFieldErrors((prev) => ({ ...prev, name: nameError || '' }));
    } else {
      setFieldErrors((prev) => ({ ...prev, name: '' }));
    }
  };

  /** Handle email change with validation */
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, email: val }));

    if (val.length > 0) {
      const emailError = validateEmail(val);
      setFieldErrors((prev) => ({ ...prev, email: emailError || '' }));
    } else {
      setFieldErrors((prev) => ({ ...prev, email: '' }));
    }
  };

  /** Handle university selection */
  const handleUniversityChange = (value: string) => {
    setFormData((prev) => ({ ...prev, university: value }));
    setFieldErrors((prev) => ({ ...prev, university: '' }));
  };

  /** Handle password change */
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, password: val }));
  };

  /** Handle confirm password change */
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, confirmPassword: val }));

    if (val.length > 0 && formData.password !== val) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
    } else {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
    }
  };

  /** Handle Terms acceptance from dialog */
  const handleAcceptTerms = () => {
    setAgreedToTerms(true);
    setFieldErrors((prev) => ({ ...prev, terms: '' }));
  };

  /** Handle form submission */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const errors: Record<string, string> = {};

    // Validate name
    const nameError = validateName(formData.name);
    if (nameError) errors.name = nameError;

    // Validate email
    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;

    // Validate university
    if (!formData.university) {
      errors.university = 'Please select your university or institute';
    }

    // Validate password strength
    const strength = evaluatePasswordStrength(formData.password);
    if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (strength.score < 2) {
      errors.password = 'Password is too weak. Please follow the tips above.';
    }

    // Validate confirm password
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Validate terms
    if (!agreedToTerms) {
      errors.terms = 'Please agree to the Terms of Service and Privacy Policy';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError(Object.values(errors)[0]); // Show first error as banner
      return;
    }

    try {
      await signupMutation.mutateAsync({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        university: formData.university,
      });
      styledToast.success('Account Created!', 'Welcome to CampusCart — start exploring');
      navigate('/home');
    } catch (err: unknown) {
      if (err instanceof ApiError && err.code === 409) {
        // Email already registered — toast and redirect to login
        styledToast.error('Email Already Registered', 'An account with this email already exists. Redirecting to login…', 4000);
        setTimeout(() => {
          navigate('/login');
        }, 1500);
        return;
      }
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
    }
  };

  const isLoading = signupMutation.isPending;

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Image & Stats */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
      >
        <img
          src="https://images.unsplash.com/photo-1562774053-701939374585?w=800&h=1000&fit=crop"
          alt="University campus"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />

        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Join the community of{' '}
              <span className="text-[#F5B800]">CampusCart</span>
            </h2>
            <p className="text-white text-lg max-w-md mx-auto">
              Save money and reduce waste by trading textbooks, electronics, and dorm essentials
              with your peers.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-7 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="flex justify-center items-center mb-2">
            <img
              src="/images/campus cart logo header.png"
              alt="CampusCart Logo"
              className="h-16 w-auto object-contain object-top rounded"
              style={{ maxWidth: '240px', marginTop: '-8px', marginBottom: '-8px' }}
            />
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Create an account</h1>
            <p className="text-gray-500">Sign up with your credentials to get started.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="Rakesh Sharma"
                  className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#F5B800]/30 focus:border-[#F5B800] outline-none transition-all ${
                    fieldErrors.name ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-gray-200'
                  }`}
                  required
                  minLength={3}
                />
              </div>
              {fieldErrors.name && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">Only alphabets and spaces allowed, minimum 3 characters</p>
            </div>

            {/* University */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                University/Institute
              </label>
              <UniversityCombobox
                value={formData.university}
                onChange={handleUniversityChange}
              />
              {fieldErrors.university && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.university}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleEmailChange}
                  placeholder="student@example.com"
                  className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#F5B800]/30 focus:border-[#F5B800] outline-none transition-all ${
                    fieldErrors.email ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-gray-200'
                  }`}
                  required
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">Use your official email — temporary/disposable emails are not allowed</p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-12 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#F5B800]/30 focus:border-[#F5B800] outline-none transition-all ${
                    fieldErrors.password ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-gray-200'
                  }`}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>
              )}
              <PasswordStrengthIndicator password={formData.password} />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#F5B800]/30 focus:border-[#F5B800] outline-none transition-all ${
                    fieldErrors.confirmPassword ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-gray-200'
                  }`}
                  required
                />
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => {
                  setAgreedToTerms(e.target.checked);
                  if (e.target.checked) {
                    setFieldErrors((prev) => ({ ...prev, terms: '' }));
                  }
                }}
                className="w-4 h-4 mt-1 text-[#F5B800] border-gray-300 rounded focus:ring-[#F5B800]"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => setShowTermsDialog(true)}
                  className="text-[#F5B800] hover:underline font-medium"
                >
                  Terms of Service
                </button>
                {' '}and{' '}
                <button
                  type="button"
                  onClick={() => setShowTermsDialog(true)}
                  className="text-[#F5B800] hover:underline font-medium"
                >
                  Privacy Policy
                </button>
              </label>
            </div>
            {fieldErrors.terms && (
              <p className="text-xs text-red-500 -mt-2">{fieldErrors.terms}</p>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600"
              >
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-[#F5B800] hover:bg-[#E5A800] text-white font-semibold rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Login Link */}
          <p className="text-center mt-6 text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-[#F5B800] font-semibold hover:underline">
              Login
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Terms and Conditions Dialog */}
      <TermsAndConditionsDialog
        open={showTermsDialog}
        onOpenChange={setShowTermsDialog}
        onAccept={handleAcceptTerms}
      />
    </div>
  );
}

