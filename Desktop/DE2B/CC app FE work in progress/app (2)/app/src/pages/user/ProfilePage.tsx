/**
 * Page component for the P ro fi le Pa ge route and related page-level interactions.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, CheckCircle, Save, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import UserSidebar from '@/components/UserSidebar';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    university: user?.university || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleSave = () => {
    updateUser({
      name: formData.name,
      bio: formData.bio,
      university: formData.university,
      phone: formData.phone,
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          <UserSidebar activeItem="profile" />
          
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-100 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                  <p className="text-gray-500">Manage your public presence and account information</p>
                </div>
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)} variant="outline">
                    Edit Profile
                  </Button>
                )}
              </div>

              {/* Public Profile Section */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Public Profile</h2>
                
                <div className="flex items-start gap-6 mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserIcon className="w-16 h-16 text-gray-400" />
                    </div>
                    {isEditing && (
                      <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#F5B800] rounded-full flex items-center justify-center shadow-lg">
                        <Camera className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                          Display Name
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F5B800]/30 outline-none"
                          />
                        ) : (
                          <p className="font-medium text-gray-900 py-2.5">{user?.name}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                          University / Campus
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.university}
                            onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                            placeholder="Enter your university or institute name"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F5B800]/30 outline-none"
                          />
                        ) : (
                          <p className="font-medium text-gray-900 py-2.5">{user?.university}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                        Bio (Optional)
                      </label>
                      {isEditing ? (
                        <textarea
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          placeholder="Briefly describe your items or study area..."
                          rows={3}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F5B800]/30 outline-none resize-none"
                        />
                      ) : (
                        <p className="text-gray-600 py-2.5">{user?.bio || 'No bio added yet.'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                      Student Email
                    </label>
                    <p className="px-4 py-2.5 bg-gray-100 rounded-xl text-gray-600">{user?.email}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                      Phone Number (for meetups)
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F5B800]/30 outline-none"
                      />
                    ) : (
                      <p className="font-medium text-gray-900 py-2.5">{user?.phone || 'Not added'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Verification Status */}
              <div className="bg-gray-50 rounded-xl p-4 mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Verified Student</p>
                      <p className="text-sm text-gray-500">Your account is verified.</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                    Active Status
                  </span>
                </div>
              </div>

              {/* Save Button */}
              {isEditing && (
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="bg-green-500 hover:bg-green-600 text-white">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

