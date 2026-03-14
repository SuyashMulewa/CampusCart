/**
 * Terms and Conditions Dialog for CampusCart.
 * Displays the full T&C content in a scrollable dialog.
 */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TermsAndConditionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept?: () => void;
}

export default function TermsAndConditionsDialog({
  open,
  onOpenChange,
  onAccept,
}: TermsAndConditionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-bold text-gray-900">
            Terms of Service & Privacy Policy
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Please read our terms carefully before creating your account.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[50vh] px-6">
          <div className="space-y-6 text-sm text-gray-700 pr-4 pb-4">
            {/* Section 1 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">
                1. Acceptance of Terms
              </h3>
              <p>
                By registering for and using CampusCart, you agree to be bound by these Terms of
                Service and our Privacy Policy. CampusCart is a peer-to-peer campus marketplace
                exclusively for verified university students to buy, sell, and trade items such as
                textbooks, electronics, and dorm essentials.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">
                2. Eligibility
              </h3>
              <p>
                You must be a currently enrolled student at a recognized Indian university or
                educational institution to use CampusCart. You must be at least 18 years of age.
                By registering, you confirm that all information provided is accurate and that you
                are authorized to use the email address associated with your account.
              </p>
            </section>

            {/* Section 3 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">
                3. Account Registration & Security
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                <li>You must not share your account or allow others to access it.</li>
                <li>You agree to immediately notify us of any unauthorized use of your account.</li>
                <li>CampusCart reserves the right to suspend or terminate accounts that violate these terms.</li>
                <li>One account per student — duplicate accounts may be removed.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">
                4. Listing & Transaction Rules
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>All listed items must be legal, safe, and appropriate for a campus marketplace.</li>
                <li>Prohibited items include: weapons, drugs, alcohol, counterfeit goods, stolen property, and any items that violate university policies.</li>
                <li>Sellers must provide accurate descriptions, pricing, and images for their listings.</li>
                <li>Prices must be in Indian Rupees (₹) and reflect fair market value.</li>
                <li>Bidding is binding — once a bid is placed, it cannot be retracted without seller approval.</li>
                <li>Sellers may accept, reject, or counter any bid at their discretion.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">
                5. Meetups & Safety
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>All transactions should be completed through in-person meetups at designated safe zones on campus.</li>
                <li>CampusCart provides an OTP verification system for meetups to ensure both parties confirm the exchange.</li>
                <li>Always meet in well-lit, public areas within your campus.</li>
                <li>CampusCart is not responsible for any incidents that occur during meetups.</li>
                <li>Report any suspicious activity or safety concerns immediately.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">
                6. Communication Guidelines
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Use the built-in chat feature for all transaction-related communication.</li>
                <li>Be respectful and professional in all interactions.</li>
                <li>Harassment, spam, or abusive language will result in immediate account suspension.</li>
                <li>Do not share personal contact information until you are comfortable doing so.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">
                7. Reviews & Ratings
              </h3>
              <p>
                After completing a transaction, both buyers and sellers can leave reviews. Reviews
                must be honest, fair, and based on actual transaction experience. Fake reviews,
                review manipulation, or retaliatory reviews are strictly prohibited and may result
                in account action.
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">
                8. Privacy Policy
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>We collect your name, email, university, and profile information to provide our services.</li>
                <li>Your data is stored securely and is never sold to third parties.</li>
                <li>Chat messages are stored to facilitate transaction records.</li>
                <li>You can request deletion of your account and associated data at any time.</li>
                <li>We use cookies and local storage for session management and application functionality.</li>
                <li>Your email is used solely for account verification and important platform notifications.</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">
                9. Intellectual Property
              </h3>
              <p>
                All content, logos, and branding on CampusCart are the property of CampusCart.
                Users retain ownership of their listing photos and descriptions but grant CampusCart
                a non-exclusive license to display them on the platform.
              </p>
            </section>

            {/* Section 10 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">
                10. Limitation of Liability
              </h3>
              <p>
                CampusCart serves as a platform connecting buyers and sellers. We do not guarantee
                the quality, safety, or legality of items listed. We are not a party to any
                transaction between users. All transactions are conducted at the users' own risk.
                CampusCart shall not be liable for any damages arising from the use of the platform.
              </p>
            </section>

            {/* Section 11 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">
                11. Modifications to Terms
              </h3>
              <p>
                CampusCart reserves the right to modify these terms at any time. Users will be
                notified of significant changes via email or platform notification. Continued use
                of the platform after changes constitutes acceptance of the revised terms.
              </p>
            </section>

            {/* Section 12 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">
                12. Contact Information
              </h3>
              <p>
                For questions, concerns, or support, please reach out through the Help Center
                available in the application, or contact our support team. We aim to respond to all
                inquiries within 24–48 hours.
              </p>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 pb-6 pt-2 border-t">
          <DialogClose asChild>
            <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors rounded-lg border border-gray-200 hover:bg-gray-50">
              Close
            </button>
          </DialogClose>
          {onAccept && (
            <button
              onClick={() => {
                onAccept();
                onOpenChange(false);
              }}
              className="px-6 py-2 text-sm font-semibold text-white bg-[#F5B800] hover:bg-[#E5A800] rounded-lg transition-colors"
            >
              I Accept
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
