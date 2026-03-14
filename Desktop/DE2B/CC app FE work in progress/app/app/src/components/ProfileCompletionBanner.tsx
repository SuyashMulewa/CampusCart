/**
 * ProfileCompletionBanner — red banner shown below the navbar when the
 * current user's profile is incomplete (not verified).
 * Clicking "Complete Now" navigates to the profile page.
 */
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useCurrentUser } from '@/state';
import { getProfileVerificationCompletion, isUserFullyVerified } from '@/utils/profileVerification';

export default function ProfileCompletionBanner() {
  const { data: user } = useCurrentUser();

  // Don't render if no user or profile is fully complete
  if (!user || isUserFullyVerified(user)) return null;

  const completeness = getProfileVerificationCompletion(user);

  return (
    <div className="bg-red-50 border-b border-red-100 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-red-600">
              Your profile is only <span className='text-lg'> {completeness}% </span> complete !
            </p>
            <p className="text-xs text-red-600">
              Complete profile verification to unlock all features.
            </p>
          </div>
        </div>
        <Link to="/profile">
          <button className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-6 py-2 rounded-lg transition-colors shadow-sm whitespace-nowrap">
            Complete Now
          </button>
        </Link>
      </div>
    </div>
  );
}
