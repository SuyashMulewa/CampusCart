/**
 * Page component for the Profile Page route and related page-level interactions.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  ShieldCheck,
  Save,
  Edit,
  GraduationCap,
  User as UserIcon,
  Upload,
  AlertTriangle,
  FileText,
  Linkedin,
  Facebook,
  Instagram,
  Mail,
  Phone,
  ShieldAlert,
  InfoIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserSidebar from '@/components/UserSidebar';
import { useCurrentUser, useUpdateProfile } from '@/state';
import { styledToast } from '@/utils/styledToast';
import { getProfileVerificationCompletion, getVerificationDocumentTypeOptions } from '@/utils/profileVerification';
import { validateName } from '@/utils/validation';

const REQUEST_CHANGE_LINK = '#';

export default function ProfilePage() {
  const { data: user } = useCurrentUser();
  const updateProfileMutation = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatar: '',
    phone: '',
  });

  const [socialLinks, setSocialLinks] = useState({
    facebook: '',
    instagram: '',
    linkedin: '',
  });

  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [studentIdCardPhoto, setStudentIdCardPhoto] = useState<string>('');
  const [documentType, setDocumentType] = useState<'Fee Receipt'>('Fee Receipt');
  const [documentPhoto, setDocumentPhoto] = useState<string>('');
  const [profileErrors, setProfileErrors] = useState<{ name?: string; bio?: string; phone?: string }>({});
  const [verificationErrors, setVerificationErrors] = useState<{ enrollmentNumber?: string }>({});

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const studentIdInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    setFormData({
      name: user.name || '',
      bio: user.bio || '',
      avatar: user.avatar || '',
      phone: user.phone || '',
    });

    setEnrollmentNumber(user.enrollmentNumber || '');
    setStudentIdCardPhoto(user.studentIdCardPhoto || '');
    setDocumentType(user.documentType || 'Fee Receipt');
    setDocumentPhoto(user.documentPhoto || '');
  }, [user]);

  const draftUser = useMemo(() => {
    if (!user) return null;
    return {
      ...user,
      name: formData.name,
      bio: formData.bio,
      phone: formData.phone,
      enrollmentNumber,
      studentIdCardPhoto,
      documentType,
      documentPhoto,
      // Verification weight is counted only after successful verification.
      isVerified: user.isVerified,
    };
  }, [documentPhoto, documentType, enrollmentNumber, formData.bio, formData.name, studentIdCardPhoto, user]);

  const completion = getProfileVerificationCompletion(draftUser);
  const isFullyVerified = completion === 100;
  const isVerified = Boolean(user?.isVerified);

  const resetEditableFields = () => {
    setFormData({
      name: user?.name || '',
      bio: user?.bio || '',
      avatar: user?.avatar || '',
      phone: user?.phone || '',
    });
  };

  const handleCancel = () => {
    resetEditableFields();
    setIsEditing(false);
  };

  const validateProfileInputs = () => {
    const nextErrors: { name?: string; bio?: string; phone?: string } = {};

    const nameError = validateName(formData.name);
    if (nameError) {
      nextErrors.name = nameError;
    }

    const trimmedBio = formData.bio.trim();
    if (trimmedBio.length > 250) {
      nextErrors.bio = 'Bio must be 250 characters or less';
    }

    const trimmedPhone = formData.phone.trim();
    if (trimmedPhone) {
      const onlyDigits = trimmedPhone.replace(/\D/g, '');
      if (onlyDigits.length < 10 || onlyDigits.length > 15) {
        nextErrors.phone = 'Phone number must contain 10 to 15 digits';
      }
    }

    setProfileErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateProfileInputs()) {
      styledToast.error('Invalid profile details', 'Please fix the highlighted fields and try again.');
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        name: formData.name.trim(),
        bio: formData.bio.trim(),
        avatar: formData.avatar,
        phone: formData.phone.trim(),
      });
      setIsEditing(false);
      styledToast.success('Profile updated', 'Your profile changes were saved.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not save profile changes.';
      styledToast.error('Save failed', message);
    }
  };

  const convertFileToDataUrl = (file: File, onResult: (dataUrl: string) => void) => {
    if (file.size > 5 * 1024 * 1024) {
      styledToast.error('File too large', 'Please upload a file smaller than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => onResult(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    convertFileToDataUrl(file, (imageUrl) => {
      setFormData((prev) => ({ ...prev, avatar: imageUrl }));
    });
  };

  const handleStudentIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    convertFileToDataUrl(file, setStudentIdCardPhoto);
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    convertFileToDataUrl(file, setDocumentPhoto);
  };

  const handleVerificationSubmit = () => {
    const trimmedEnrollment = enrollmentNumber.trim();
    if (!trimmedEnrollment) {
      setVerificationErrors({ enrollmentNumber: 'Enrollment number is required' });
      styledToast.error('Enrollment number required', 'Please enter your enrollment number.');
      return;
    }

    if (!/^[A-Za-z0-9-]{6,24}$/.test(trimmedEnrollment)) {
      setVerificationErrors({ enrollmentNumber: 'Use 6-24 letters/numbers (hyphen allowed)' });
      styledToast.error('Invalid enrollment number', 'Please check enrollment number format.');
      return;
    }

    setVerificationErrors({});

    if (!studentIdCardPhoto) {
      styledToast.error('Student ID card required', 'Please upload your student ID card photo.');
      return;
    }
    if (!documentPhoto) {
      styledToast.error('Document photo required', 'Please upload your document photo.');
      return;
    }

    setIsSubmittingVerification(true);

    updateProfileMutation.mutate(
      {
        bio: formData.bio.trim(),
        phone: formData.phone.trim(),
        enrollmentNumber: trimmedEnrollment,
        studentIdCardPhoto,
        documentType,
        documentPhoto,
        verificationSubmittedAt: new Date().toISOString(),
        isVerified: true,
      },
      {
        onSuccess: () => {
          setIsSubmittingVerification(false);
          setShowVerificationForm(false);
          styledToast.success('Verification complete', 'Your profile is now verified.');
        },
        onError: () => {
          setIsSubmittingVerification(false);
          styledToast.error('Verification failed', 'Please try again in a moment.');
        },
      }
    );
  };

  const bannerToneClasses = isFullyVerified
    ? 'bg-[#71b55a]/10 border-[#71b55a]/40'
    : completion >= 35
      ? 'bg-[#ebb50b]/10 border-[#ebb50b]/40'
      : 'bg-red-50 border-red-200';

  const RequestChangeHint = ({ fieldName }: { fieldName: string }) => (
    <p className="mt-1 text-xs text-[#000000]/60">
      Need to update this field?{' '}
      <a href={REQUEST_CHANGE_LINK} className="text-[#ebb50b] hover:underline">
        Request to change {fieldName}
      </a>
    </p>
  );

  if (!user) {
    return null;
  }

  const quickStats = [
    {
      title: 'Profile Completion',
      value: `${completion}%`,
      tone: isFullyVerified ? 'text-[#71b55a]' : 'text-[#ebb50b]',
      icon: ShieldCheck,
    },
    {
      title: 'Verification',
      value: isVerified ? 'Verified' : 'Pending',
      tone: isVerified ? 'text-[#71b55a]' : 'text-red-600',
      icon: isVerified ? ShieldCheck : ShieldAlert,
    },
    {
      title: 'University',
      value: user.university ? 'Added' : 'Missing',
      tone: user.university ? 'text-[#000000]' : 'text-[#ebb50b]',
      icon: UserIcon,
    },
    {
      title: 'Contact',
      value: user.phone ? 'Available' : 'Add Phone',
      tone: user.phone ? 'text-[#000000]' : 'text-[#ebb50b]',
      icon: Phone,
    },
  ];

  return (
    <div className="min-h-screen bg-[#ffffff] py-6 text-[#000000]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-6">
          <UserSidebar activeItem="profile" />

          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-[#000000]">Profile Information</h1>
                  <p className="text-[#000000]/70">Manage your public presence and account information</p>
                </div>

                {isEditing ? (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={updateProfileMutation.isPending}
                      className="bg-[#71b55a] hover:opacity-90 text-[#ffffff]"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                ) : null}
              </div>

              {!isFullyVerified && (
                <div className={`border rounded-xl p-5 ${bannerToneClasses}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#ffffff] rounded-full flex items-center justify-center shadow-sm">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg text-[#000000]">Verification status:</p>
                        <p className="text-sm text-[#000000]/65">
                          Complete all required fields and verification to unlock buying and selling.
                        </p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-[#000000]">{completion}%</span>
                  </div>
                  <div className="mt-4 w-full h-2 rounded-full bg-[#ffffff] overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${isFullyVerified ? 'bg-[#71b55a]' : 'bg-[#ebb50b]'}`} style={{ width: `${completion}%` }} />
                  </div>
                </div>
              )}

              <div className="bg-[#ffffff] border border-[#000000]/10 rounded-xl p-8 sm:p-10 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center gap-8">
                  <div className="relative shrink-0">
                    <div className="w-40 h-40 sm:w-48 sm:h-48 bg-[#ffffff] rounded-full overflow-hidden flex items-center justify-center border-4 border-[#ebb50b]/80 ring-4 ring-[#ebb50b]/10">
                      {formData.avatar ? (
                        <img src={formData.avatar} alt={formData.name || 'Profile'} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-20 h-20 text-[#000000]/40" />
                      )}
                    </div>

                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />

                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute bottom-1 right-1 w-8 h-8 bg-[#ebb50b] rounded-full flex items-center justify-center shadow-lg"
                        aria-label="Upload profile image"
                      >
                        <Camera className="w-4 h-4 text-[#ffffff]" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs text-[#000000]/60 uppercase tracking-wider mb-2">Full Name</label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => {
                              setFormData((prev) => ({ ...prev, name: e.target.value }));
                              setProfileErrors((prev) => ({ ...prev, name: undefined }));
                            }}
                            className={`w-full px-4 py-2.5 bg-[#ffffff] border rounded-xl focus:ring-2 focus:ring-[#ebb50b]/30 outline-none ${
                              profileErrors.name ? 'border-red-300' : 'border-[#000000]/20'
                            }`}
                          />
                          {profileErrors.name && <p className="mt-1 text-xs text-red-500">{profileErrors.name}</p>}
                        </div>

                        <div>
                          <label className="block text-xs text-[#000000]/60 uppercase tracking-wider mb-2">University / Institute</label>
                          <p className="px-4 py-2.5 rounded-xl border border-[#000000]/20 bg-[#ffffff] font-lg text-[#000000]">{user.university || 'Not provided'}</p>
                          <RequestChangeHint fieldName="university" />
                        </div>

                        <div>
                          <label className="block text-xs text-[#000000]/60 uppercase tracking-wider mb-2">Bio</label>
                          <textarea
                            value={formData.bio}
                            onChange={(e) => {
                              setFormData((prev) => ({ ...prev, bio: e.target.value }));
                              setProfileErrors((prev) => ({ ...prev, bio: undefined }));
                            }}
                            placeholder="Briefly describe your items or study area..."
                            rows={3}
                            className={`w-full px-4 py-2.5 bg-[#ffffff] border rounded-xl focus:ring-2 focus:ring-[#ebb50b]/30 outline-none resize-none ${
                              profileErrors.bio ? 'border-red-300' : 'border-[#000000]/20'
                            }`}
                          />
                          {profileErrors.bio && <p className="mt-1 text-xs text-red-500">{profileErrors.bio}</p>}
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-4xl font-bold text-[#000000]">{user.name || 'User'}</h2>
                        <p className="pt-2 text-lg font-semibold text-[#000000] inline-flex items-center gap-2">
                          <GraduationCap className="w-7 h-7 text-[#ebb50b]" />
                          {user.university || 'University not added'}
                        </p>
                        
                        <p className="mt-1 text-[#000000]/70 text-lg max-w-2xl">Bio: {user.bio || 'No bio added yet.'}</p>
                        <Button
                          onClick={() => setIsEditing(true)}
                          className="mt-6 bg-[#ebb50b] hover:opacity-90 text-white font-semibold px-6"
                        >
                          <Edit className="w-4 h-4 mr-2 text-[#000000]" />
                          Edit Profile
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {!isVerified && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <ShieldAlert className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-red-900">Verification required</p>
                        <p className="text-sm text-red-700">Complete your verification details to unlock all features.</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={() => setShowVerificationForm((prev) => !prev)}
                      className="bg-red-600 hover:bg-red-700 text-[#ffffff]"
                    >
                      {showVerificationForm ? 'Hide Form' : 'Verify Yourself'}
                    </Button>
                  </div>

                  {showVerificationForm && (
                    <div className="bg-[#ffffff] border border-[#000000]/10 rounded-xl p-6 shadow-sm">
                      <div className="border border-[#000000]/20 rounded-xl p-5 space-y-5 bg-[#ffffff]">
                        <div>
                          <label className="block text-xs text-[#000000]/60 uppercase tracking-wider mb-2">Enrollment Number</label>
                          <input
                            type="text"
                            value={enrollmentNumber}
                            onChange={(e) => {
                              setEnrollmentNumber(e.target.value);
                              setVerificationErrors((prev) => ({ ...prev, enrollmentNumber: undefined }));
                            }}
                            placeholder="e.g. 2021CSB10XX"
                            className={`w-full px-4 py-2.5 bg-[#ffffff] border rounded-xl focus:ring-2 focus:ring-[#ebb50b]/30 outline-none ${
                              verificationErrors.enrollmentNumber ? 'border-red-300' : 'border-[#000000]/20'
                            }`}
                          />
                          {verificationErrors.enrollmentNumber && (
                            <p className="mt-1 text-xs text-red-500">{verificationErrors.enrollmentNumber}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs text-[#000000]/60 uppercase tracking-wider mb-2">Student ID Card Photo</label>
                          <input
                            ref={studentIdInputRef}
                            type="file"
                            accept="image/png,image/jpeg"
                            className="hidden"
                            onChange={handleStudentIdUpload}
                          />
                          <button
                            type="button"
                            onClick={() => studentIdInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-[#000000]/20 rounded-xl p-6 flex flex-col items-center justify-center bg-[#ffffff] hover:border-[#ebb50b] transition-colors"
                          >
                            {studentIdCardPhoto ? (
                              <img src={studentIdCardPhoto} alt="Student ID card" className="max-h-40 rounded-lg object-contain" />
                            ) : (
                              <>
                                <Upload className="w-5 h-5 text-[#000000]/60 mb-2" />
                                <span className="text-sm font-medium text-[#000000]/80">Upload student ID card photo</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div>
                          <label className="block text-xs text-[#000000]/60 uppercase tracking-wider mb-2">Document Type</label>
                          <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#000000]/60" />
                            <select
                              value={documentType}
                              onChange={(e) => setDocumentType(e.target.value as 'Fee Receipt')}
                              className="w-full pl-10 pr-4 py-2.5 bg-[#ffffff] border border-[#000000]/20 rounded-xl focus:ring-2 focus:ring-[#ebb50b]/30 outline-none"
                            >
                              {getVerificationDocumentTypeOptions().map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-[#000000]/60 uppercase tracking-wider mb-2">Document Photo</label>
                          <input
                            ref={documentInputRef}
                            type="file"
                            accept="image/png,image/jpeg"
                            className="hidden"
                            onChange={handleDocumentUpload}
                          />
                          <button
                            type="button"
                            onClick={() => documentInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-[#000000]/20 rounded-xl p-6 flex flex-col items-center justify-center bg-[#ffffff] hover:border-[#ebb50b] transition-colors"
                          >
                            {documentPhoto ? (
                              <img src={documentPhoto} alt="Document" className="max-h-40 rounded-lg object-contain" />
                            ) : (
                              <>
                                <Upload className="w-5 h-5 text-[#000000]/60 mb-2" />
                                <span className="text-sm font-medium text-[#000000]/80">Upload {documentType} photo</span>
                              </>
                            )}
                          </button>
                        </div>

                        <Button
                          type="button"
                          onClick={handleVerificationSubmit}
                          disabled={isSubmittingVerification}
                          className="w-full bg-[#ebb50b] hover:opacity-90 text-[#000000] font-semibold py-3 rounded-xl"
                        >
                          {isSubmittingVerification ? 'Verifying...' : 'Submit Verification'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#ffffff] p-6 rounded-xl border border-[#000000]/10 shadow-sm">
                  <h2 className="text-lg font-semibold text-[#000000] mb-4">Contact Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-[#000000]/60 uppercase tracking-wider mb-2">Student Email</label>
                      <div className="flex items-center gap-3 px-1 py-1">
                        <div className="w-10 h-10 rounded-full bg-[#ebb50b]/10 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-[#ebb50b]" />
                        </div>
                        <p className="text-[#000000] font-medium">{user.email || 'Not provided'}</p>
                      </div>
                      {isEditing && <RequestChangeHint fieldName="email" />}
                    </div>

                    <div>
                      <label className="block text-xs text-[#000000]/60 uppercase tracking-wider mb-2">Mobile Number</label>
                      {isEditing ? (
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#000000]/60" />
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => {
                              setFormData((prev) => ({ ...prev, phone: e.target.value }));
                              setProfileErrors((prev) => ({ ...prev, phone: undefined }));
                            }}
                            placeholder="+91 98765 43210"
                            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-[#ebb50b]/30 outline-none ${
                              profileErrors.phone ? 'border-red-300' : 'border-[#000000]/20'
                            }`}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 px-1 py-1">
                          <div className="w-10 h-10 rounded-full bg-[#ebb50b]/10 flex items-center justify-center">
                            <Phone className="w-4 h-4 text-[#ebb50b]" />
                          </div>
                          <p className="text-[#000000] font-medium">{user.phone || 'Not provided'}</p>
                        </div>
                      )}
                      {isEditing && profileErrors.phone && <p className="mt-1 text-xs text-red-500">{profileErrors.phone}</p>}
                    </div>
                  </div>
                </div>

                <div className="bg-[#ffffff] p-6 rounded-xl border border-[#000000]/10 shadow-sm">
                  <h2 className="text-lg font-semibold text-[#000000] mb-4">Social Presence</h2>
                  <div className="space-y-4">
                    <div>
                      {isEditing ? (
                        <div className="relative">
                          <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600lu" />
                          <input
                            type="text"
                            value={socialLinks.facebook}
                            onChange={(e) => setSocialLinks((prev) => ({ ...prev, facebook: e.target.value }))}
                            placeholder="facebook.com/username"
                            className="w-full pl-10 pr-4 py-2.5 bg-[#ffffff] border border-[#000000]/20 rounded-xl focus:ring-2 focus:ring-[#ebb50b]/30 outline-none text-sm"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 rounded-lg border border-[#000000]/10">
                          <div className="flex items-center gap-2">
                            <Facebook className="w-4 h-4 text-[#71b55a]" />
                            <span className="font-medium text-[#000000]">Facebook</span>
                          </div>
                          <span className="text-sm text-[#000000]/60">{socialLinks.facebook || 'Not added'}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      {isEditing ? (
                        <div className="relative">
                          <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
                          <input
                            type="text"
                            value={socialLinks.instagram}
                            onChange={(e) => setSocialLinks((prev) => ({ ...prev, instagram: e.target.value }))}
                            placeholder="instagram.com/username"
                            className="w-full pl-10 pr-4 py-2.5 bg-[#ffffff] border border-[#000000]/20 rounded-xl focus:ring-2 focus:ring-[#ebb50b]/30 outline-none text-sm"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 rounded-lg border border-[#000000]/10">
                          <div className="flex items-center gap-2">
                            <Instagram className="w-4 h-4 text-[#71b55a]" />
                            <span className="font-medium text-[#000000]">Instagram</span>
                          </div>
                          <span className="text-sm text-[#000000]/60">{socialLinks.instagram || 'Not added'}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      {isEditing ? (
                        <div className="relative">
                          <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-700" />
                          <input
                            type="text"
                            value={socialLinks.linkedin}
                            onChange={(e) => setSocialLinks((prev) => ({ ...prev, linkedin: e.target.value }))}
                            placeholder="linkedin.com/in/username"
                            className="w-full pl-10 pr-4 py-2.5 bg-[#ffffff] border border-[#000000]/20 rounded-xl focus:ring-2 focus:ring-[#ebb50b]/30 outline-none text-sm"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 rounded-lg border border-[#000000]/10">
                          <div className="flex items-center gap-2">
                            <Linkedin className="w-4 h-4 text-[#71b55a]" />
                            <span className="font-medium text-[#000000]">LinkedIn</span>
                          </div>
                          <span className="text-sm text-[#000000]/60">{socialLinks.linkedin || 'Not added'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.title} className="bg-[#ffffff] p-4 rounded-xl border border-[#000000]/10 shadow-sm text-center">
                      <div className="mx-auto mb-2 w-10 h-10 rounded-full bg-[#ebb50b]/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[#000000]" />
                      </div>
                      <p className="text-xs uppercase tracking-wider text-[#000000]/60">{stat.title}</p>
                      <p className={`mt-1 text-lg font-bold ${stat.tone}`}>{stat.value}</p>
                    </div>
                  );
                })}
              </div>

              {isVerified && (
                <div className="bg-[#ffffff] border border-[#000000]/10 rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-[#000000] mb-4">Verification</h2>
                  <div className="bg-[#71b55a]/10 border border-[#71b55a]/40 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#71b55a]/20 rounded-full flex items-center justify-center">
                          <ShieldCheck className="w-8 h-8 text-[#71b55a]" />
                        </div>
                        <div>
                          <p className="text-xl font-semibold text-[#71b55a]">ID/Documents Approved</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-[#71b55a]/20 text-[#71b55a] text-xl font-medium rounded-full">Verified</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
