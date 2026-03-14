/**
 * Page component for the Profile Page route and related page-level interactions.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  ShieldCheck,
  Save,
  User as UserIcon,
  Upload,
  AlertTriangle,
  FileText,
  Linkedin,
  Facebook,
  Instagram,
  Edit,
  Mail,
  Phone,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserSidebar from '@/components/UserSidebar';
import { useCurrentUser, useUpdateProfile } from '@/state';
import { styledToast } from '@/utils/styledToast';
import { getProfileVerificationCompletion, getVerificationDocumentTypeOptions } from '@/utils/profileVerification';

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

  const handleSave = () => {
    if (!formData.name.trim()) {
      styledToast.error('Display name required', 'Please add your display name before saving.');
      return;
    }

    updateProfileMutation.mutate(
      {
        name: formData.name.trim(),
        bio: formData.bio.trim(),
        avatar: formData.avatar,
        phone: formData.phone.trim(),
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          styledToast.success('Profile updated', 'Your profile changes were saved.');
        },
      }
    );
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
    if (!enrollmentNumber.trim()) {
      styledToast.error('Enrollment number required', 'Please enter your enrollment number.');
      return;
    }
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
        enrollmentNumber: enrollmentNumber.trim(),
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
    ? 'bg-green-50 border-green-200'
    : completion >= 35
      ? 'bg-amber-50 border-amber-200'
      : 'bg-red-50 border-red-200';

  const RequestChangeHint = ({ fieldName }: { fieldName: string }) => (
    <p className="mt-1 text-xs text-gray-500">
      Need to update this field?{' '}
      <a href={REQUEST_CHANGE_LINK} className="text-[#F5B800] hover:underline">
        Request to change {fieldName}
      </a>
    </p>
  );

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          <UserSidebar activeItem="profile" />

          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className=""
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                  <p className="text-gray-500">Manage your public presence and account information</p>
                </div>

                {isEditing ? (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={updateProfileMutation.isPending}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </Button>
                )}
              </div>

              {!isFullyVerified && (
                <div className={`border rounded-xl p-4 mb-8 ${bannerToneClasses}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Verification status: {completion}% complete</p>
                        <p className="text-sm text-gray-600">
                          Complete all required fields and verification to unlock buying and selling.
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{completion}%</span>
                  </div>
                  <div className="mt-4 w-full h-2 rounded-full bg-white/90 overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${isFullyVerified ? 'bg-green-500' : 'bg-[#F5B800]'}`} style={{ width: `${completion}%` }} />
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>

                <div className="flex items-start gap-6 mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
                      {formData.avatar ? (
                        <img src={formData.avatar} alt={formData.name || 'Profile'} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-16 h-16 text-gray-400" />
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
                        className="absolute bottom-0 right-0 w-8 h-8 bg-[#F5B800] rounded-full flex items-center justify-center shadow-lg"
                        aria-label="Upload profile image"
                      >
                        <Camera className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="grid md:grid-cols-5 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F5B800]/30 outline-none"
                          />
                        ) : (
                          <p className="px-4 py-2.5 font-medium rounded-xl border border-gray-200 text-gray-600 py-2.5">{user.name}</p>
                        )}
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">University / Institute</label>
                        <p className="px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 font-medium text-gray-600">{user.university || 'Not provided'}</p>
                        {isEditing && <RequestChangeHint fieldName="university" />}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Bio</label>
                      {isEditing ? (
                        <textarea
                          value={formData.bio}
                          onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                          placeholder="Briefly describe your items or study area..."
                          rows={3}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F5B800]/30 outline-none resize-none"
                        />
                      ) : (
                        <p className="px-4 py-2.5 text-gray-600 rounded-xl border border-gray-200 font-medium py-2.5">{user.bio || 'No bio added yet.'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Student Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <p className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-600">{user.email || 'Not provided'}</p>
                    </div>
                    {isEditing && <RequestChangeHint fieldName="email" />}
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Mobile Number</label>
                    {isEditing ? (
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="+91 98765 43210"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F5B800]/30 outline-none"
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <p className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-600">{user.phone || 'Not provided'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Links</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Facebook</label>
                    <div className="relative">
                      <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                      <input
                        type="text"
                        value={socialLinks.facebook}
                        onChange={(e) => setSocialLinks((prev) => ({ ...prev, facebook: e.target.value }))}
                        placeholder="facebook.com/username"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F5B800]/30 outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Instagram</label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
                      <input
                        type="text"
                        value={socialLinks.instagram}
                        onChange={(e) => setSocialLinks((prev) => ({ ...prev, instagram: e.target.value }))}
                        placeholder="instagram.com/username"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F5B800]/30 outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">LinkedIn</label>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-700" />
                      <input
                        type="text"
                        value={socialLinks.linkedin}
                        onChange={(e) => setSocialLinks((prev) => ({ ...prev, linkedin: e.target.value }))}
                        placeholder="linkedin.com/in/username"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F5B800]/30 outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Verification</h2>

                {isVerified ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <ShieldCheck className="w-8 h-8 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xl font-semibold text-green-600">ID/Documents Approved</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-200 text-green-600 text-xl font-medium rounded-full">Verified</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <ShieldAlert className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-red-900">Verification required</p>
                            <p className="text-sm text-red-700">Complete the form below to unlock all features.</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={() => setShowVerificationForm((prev) => !prev)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          {showVerificationForm ? 'Hide Form' : 'Verify Yourself'}
                        </Button>
                      </div>
                    </div>

                    {showVerificationForm && (
                      <div className="border border-gray-200 rounded-xl p-5 space-y-5 bg-white">
                        <div>
                          <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Enrollment Number</label>
                          <input
                            type="text"
                            value={enrollmentNumber}
                            onChange={(e) => setEnrollmentNumber(e.target.value)}
                            placeholder="e.g. 2021CSB10XX"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F5B800]/30 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Student ID Card Photo</label>
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
                            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:border-[#F5B800] transition-colors"
                          >
                            {studentIdCardPhoto ? (
                              <img src={studentIdCardPhoto} alt="Student ID card" className="max-h-40 rounded-lg object-contain" />
                            ) : (
                              <>
                                <Upload className="w-5 h-5 text-gray-500 mb-2" />
                                <span className="text-sm font-medium text-gray-700">Upload student ID card photo</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Document Type</label>
                          <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <select
                              value={documentType}
                              onChange={(e) => setDocumentType(e.target.value as 'Fee Receipt')}
                              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F5B800]/30 outline-none"
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
                          <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Document Photo</label>
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
                            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:border-[#F5B800] transition-colors"
                          >
                            {documentPhoto ? (
                              <img src={documentPhoto} alt="Document" className="max-h-40 rounded-lg object-contain" />
                            ) : (
                              <>
                                <Upload className="w-5 h-5 text-gray-500 mb-2" />
                                <span className="text-sm font-medium text-gray-700">Upload {documentType} photo</span>
                              </>
                            )}
                          </button>
                        </div>

                        <Button
                          type="button"
                          onClick={handleVerificationSubmit}
                          disabled={isSubmittingVerification}
                          className="w-full bg-[#F5B800] hover:bg-[#E5A800] text-white font-semibold py-3 rounded-xl"
                        >
                          {isSubmittingVerification ? 'Verifying...' : 'Submit Verification'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
