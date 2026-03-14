import type { User } from '@/models';

const REQUIRED_DOCUMENT_TYPE = 'Fee Receipt' as const;

export type VerificationDocumentType = typeof REQUIRED_DOCUMENT_TYPE;

export function getProfileVerificationCompletion(user: Partial<User> | null | undefined): number {
  if (!user) {
    return 0;
  }

  let progress = 0;

  if (user.name?.trim()) progress += 5;
  if (user.university?.trim()) progress += 5;
  if (user.bio?.trim()) progress += 5;
  if (user.email?.trim()) progress += 10;
  if (user.phone?.trim()) progress += 10;

  const hasVerificationBundle = Boolean(
    user.isVerified
      && user.enrollmentNumber?.trim()
      && user.studentIdCardPhoto?.trim()
      && user.documentPhoto?.trim()
      && user.documentType === REQUIRED_DOCUMENT_TYPE
  );

  if (hasVerificationBundle) {
    progress += 65;
  }

  return Math.min(progress, 100);
}

export function isUserFullyVerified(user: Partial<User> | null | undefined): boolean {
  return getProfileVerificationCompletion(user) === 100;
}

export function getVerificationDocumentTypeOptions(): VerificationDocumentType[] {
  return [REQUIRED_DOCUMENT_TYPE];
}
