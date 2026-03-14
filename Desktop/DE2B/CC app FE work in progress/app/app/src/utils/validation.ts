/**
 * Form validation utilities for CampusCart.
 *
 * Includes name validation, email validation (blocking disposable domains),
 * and password strength evaluation.
 */

// ─── Name Validation ──────────────────────────────────────

/** Allow only alphabets and spaces, minimum 3 characters. */
export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 3) {
    return 'Name must be at least 3 characters long';
  }
  if (!/^[A-Za-z][A-Za-z ]*[A-Za-z]$/.test(trimmed) && trimmed.length >= 3) {
    return 'Name must contain only alphabets and spaces (no leading/trailing spaces)';
  }
  if (/^[A-Za-z]$/.test(trimmed)) {
    // single char but >= 3 already handled above
    return null;
  }
  return null;
}

/** Returns true if character is an alphabet or space */
export function isNameCharValid(char: string): boolean {
  return /^[A-Za-z ]$/.test(char);
}

// ─── Email Validation ─────────────────────────────────────

/**
 * List of known disposable/temporary email domains.
 * Blocks throwaway email services to ensure only official emails are used.
 */
const DISPOSABLE_DOMAINS: string[] = [
  'tempmail.com', 'throwaway.email', 'guerrillamail.com', 'guerrillamail.net',
  'mailinator.com', 'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com',
  'grr.la', 'dispostable.com', 'trashmail.com', 'trashmail.net', 'trashmail.me',
  'tempail.com', 'tempr.email', 'temp-mail.org', 'temp-mail.io',
  'fakeinbox.com', 'mailnesia.com', 'maildrop.cc', 'discard.email',
  'getnada.com', 'emailondeck.com', 'mohmal.com', 'burnermail.io',
  'tempmailo.com', 'tempinbox.com', 'minutemail.com', 'tempmailaddress.com',
  'getairmail.com', '10minutemail.com', '10minutemail.net', 'mailcatch.com',
  'mail-temporaire.fr', 'harakirimail.com', 'throwam.com', 'tmail.ws',
  'tmpmail.net', 'tmpmail.org', 'bupmail.com', 'mailtemp.info',
  'filzmail.com', 'spamgourmet.com', 'mytemp.email', 'inboxbear.com',
  'mailsac.com', 'anonbox.net', 'jetable.com', 'link2mail.net',
  'crazymailing.com', 'disposableemailaddresses.emailmiser.com',
  'mailfence.com', 'protonmail.com',
];

/**
 * Validate an email address.
 * - Basic format check
 * - Blocks disposable/temporary email domains
 */
export function validateEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();

  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return 'Please enter a valid email address';
  }

  // Extract domain
  const domain = trimmed.split('@')[1];

  // Check against disposable domains
  if (DISPOSABLE_DOMAINS.includes(domain)) {
    return 'Temporary or disposable email addresses are not allowed. Please use your official email.';
  }

  return null;
}

// ─── Password Strength ────────────────────────────────────

export interface PasswordStrength {
  score: number;         // 0–4 (weak to very strong)
  label: string;         // Human-readable label
  color: string;         // Tailwind color class
  tips: string[];        // Improvement suggestions
}

/**
 * Evaluate password strength and return score, label, color, and tips.
 */
export function evaluatePasswordStrength(password: string): PasswordStrength {
  const tips: string[] = [];
  let score = 0;

  if (password.length === 0) {
    return { score: 0, label: '', color: '', tips: [] };
  }

  // Length checks
  if (password.length >= 8) score++;
  else tips.push('Use at least 8 characters');

  if (password.length >= 12) score++;
  else if (password.length >= 8) tips.push('Use 12+ characters for extra security');

  // Character variety checks
  if (/[a-z]/.test(password)) score += 0.5;
  else tips.push('Add lowercase letters (a-z)');

  if (/[A-Z]/.test(password)) score += 0.5;
  else tips.push('Add uppercase letters (A-Z)');

  if (/[0-9]/.test(password)) score += 0.5;
  else tips.push('Add numbers (0-9)');

  if (/[^A-Za-z0-9]/.test(password)) score += 0.5;
  else tips.push('Add special characters (!@#$%^&*)');

  // Common patterns to avoid
  const commonPatterns = [
    /^123/, /^abc/i, /password/i, /qwerty/i, /^111/, /^aaa/i,
  ];
  const hasCommon = commonPatterns.some(p => p.test(password));
  if (hasCommon) {
    score = Math.max(0, score - 1);
    tips.push('Avoid common patterns like "123", "abc", "password"');
  }

  // Normalize to 0–4
  const normalized = Math.min(4, Math.floor(score));

  const labels: Record<number, string> = {
    0: 'Very Weak',
    1: 'Weak',
    2: 'Fair',
    3: 'Strong',
    4: 'Very Strong',
  };

  const colors: Record<number, string> = {
    0: 'bg-red-500',
    1: 'bg-orange-500',
    2: 'bg-yellow-500',
    3: 'bg-green-400',
    4: 'bg-green-600',
  };

  return {
    score: normalized,
    label: labels[normalized],
    color: colors[normalized],
    tips: tips.slice(0, 3), // Show max 3 tips
  };
}
