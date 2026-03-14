/**
 * Password strength indicator component.
 * Shows a visual progress bar and tips for password improvement.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck, Info } from 'lucide-react';
import { evaluatePasswordStrength, type PasswordStrength } from '@/utils/validation';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength: PasswordStrength = evaluatePasswordStrength(password);

  if (password.length === 0) return null;

  const getIcon = () => {
    if (strength.score <= 1) return <ShieldAlert className="w-4 h-4" />;
    if (strength.score <= 2) return <Shield className="w-4 h-4" />;
    return <ShieldCheck className="w-4 h-4" />;
  };

  const getLabelColor = () => {
    if (strength.score <= 1) return 'text-red-500';
    if (strength.score === 2) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-2 space-y-2"
    >
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i < strength.score
                  ? strength.color
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <span className={`text-xs font-medium flex items-center gap-1 ${getLabelColor()}`}>
          {getIcon()}
          {strength.label}
        </span>
      </div>

      {/* Tips */}
      <AnimatePresence>
        {strength.tips.length > 0 && strength.score < 3 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-1"
          >
            {strength.tips.map((tip, index) => (
              <div key={index} className="flex items-start gap-1.5 text-xs text-gray-500">
                <Info className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-400" />
                <span>{tip}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
