import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Mail, Phone, Stethoscope, Calendar, Crown, Shield, Sparkles, Check, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { CardHeader, Button, Input, Badge, Modal } from '../../components/ui';
import { useAuthStore } from '../../store';
import { userApi } from '../../api/user';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  medical_specialty: z.string().optional(),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z
      .string()
      .min(12, 'Password must be at least 12 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/[0-9]/, 'Must contain a number')
      .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

// Password strength requirements
const passwordRequirements = [
  { regex: /.{12,}/, label: '12+ characters' },
  { regex: /[A-Z]/, label: 'Uppercase letter' },
  { regex: /[a-z]/, label: 'Lowercase letter' },
  { regex: /[0-9]/, label: 'Number' },
  { regex: /[^A-Za-z0-9]/, label: 'Special character' },
];

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isUpdatingProfile },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      medical_specialty: user?.medical_specialty || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    watch,
    formState: { errors: passwordErrors, isSubmitting: isChangingPassword },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const newPassword = watch('new_password', '');

  const onProfileSubmit = async (data: ProfileFormData) => {
    setProfileSuccess(false);
    setProfileError(null);
    try {
      const updated = await userApi.updateProfile({
        full_name: data.full_name,
        phone: data.phone || undefined,
        medical_specialty: data.medical_specialty || undefined,
      });
      updateUser(updated);
      setProfileSuccess(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setProfileError(error.response?.data?.detail || 'Failed to update profile');
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setPasswordSuccess(false);
    setPasswordError(null);
    try {
      await userApi.changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      });
      setPasswordSuccess(true);
      resetPassword();
      setTimeout(() => setShowPasswordModal(false), 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setPasswordError(error.response?.data?.detail || 'Failed to change password');
    }
  };

  const isPro = user?.plan === 'pro';

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-500 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Profile Overview */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/25">
              <span className="text-white font-bold text-3xl">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">{user?.full_name}</h2>
                <Badge variant={isPro ? 'primary' : 'default'} className="font-semibold">
                  {isPro ? 'Pro' : 'Basic'}
                </Badge>
              </div>
              <p className="text-gray-500">{user?.email}</p>
              {user?.medical_specialty && (
                <p className="text-primary-600 font-medium text-sm mt-0.5">{user.medical_specialty}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Mail className="h-5 w-5 text-primary-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Email</p>
                <p className="text-gray-900 font-semibold">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Phone className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Phone</p>
                <p className="text-gray-900 font-semibold">{user?.phone || 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Stethoscope className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Specialty</p>
                <p className="text-gray-900 font-semibold">{user?.medical_specialty || 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Calendar className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Member since</p>
                <p className="text-gray-900 font-semibold">
                  {user?.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <CardHeader title="Subscription" />
        <div className="px-6 pb-6 space-y-4">
          <div className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-sm ${isPro ? 'bg-gradient-to-br from-amber-100 to-amber-200' : 'bg-gray-100'}`}>
                <Crown className={`h-7 w-7 ${isPro ? 'text-amber-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">
                  {isPro ? 'Pro Plan' : 'Basic Plan'}
                </p>
                <p className="text-sm text-gray-500">
                  {isPro
                    ? 'Full access to all features'
                    : '90-day trial with basic features'}
                </p>
              </div>
            </div>
            <Badge variant={user?.subscription_status === 'active' ? 'success' : 'warning'} className="font-semibold">
              {user?.subscription_status || 'trialing'}
            </Badge>
          </div>

          {user?.subscription_end_date && (
            <p className="text-sm text-gray-500">
              {isPro ? 'Renews' : 'Trial ends'} on{' '}
              <span className="font-semibold text-gray-700">
                {format(new Date(user.subscription_end_date), 'MMMM d, yyyy')}
              </span>
            </p>
          )}

          {!isPro && (
            <Link to="/upgrade">
              <Button className="w-full h-12 shadow-lg shadow-primary-500/25">
                <Sparkles className="h-5 w-5" />
                Upgrade to Pro - $9.99/month
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <CardHeader title="Edit Profile" />

        <div className="px-6 pb-6">
          {profileSuccess && (
            <div className="mb-5 p-4 bg-gradient-to-r from-emerald-50 to-emerald-50/50 border border-emerald-100 rounded-xl text-sm text-emerald-600 flex items-center gap-2 font-medium">
              <Check className="h-4 w-4" />
              Profile updated successfully!
            </div>
          )}

          {profileError && (
            <div className="mb-5 p-4 bg-gradient-to-r from-red-50 to-red-50/50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
              {profileError}
            </div>
          )}

          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="Dr. John Smith"
              error={profileErrors.full_name?.message}
              {...registerProfile('full_name')}
            />
            <Input
              label="Phone Number"
              type="tel"
              placeholder="+1 (555) 123-4567"
              error={profileErrors.phone?.message}
              {...registerProfile('phone')}
            />
            <Input
              label="Medical Specialty"
              placeholder="e.g., Cardiology"
              error={profileErrors.medical_specialty?.message}
              {...registerProfile('medical_specialty')}
            />
            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={isUpdatingProfile} className="h-11 px-6">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <CardHeader title="Security" />
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Shield className="h-7 w-7 text-primary-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Password</p>
                <p className="text-sm text-gray-500">Secure your account with a strong password</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setShowPasswordModal(true)} className="h-11">
              Change Password
            </Button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordSuccess(false);
          setPasswordError(null);
          resetPassword();
        }}
        title="Change Password"
      >
        {passwordSuccess && (
          <div className="mb-5 p-4 bg-gradient-to-r from-emerald-50 to-emerald-50/50 border border-emerald-100 rounded-xl text-sm text-emerald-600 flex items-center gap-2 font-medium">
            <Check className="h-4 w-4" />
            Password changed successfully!
          </div>
        )}

        {passwordError && (
          <div className="mb-5 p-4 bg-gradient-to-r from-red-50 to-red-50/50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
            {passwordError}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
          <div className="relative">
            <Input
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              error={passwordErrors.current_password?.message}
              {...registerPassword('current_password')}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-4 top-[38px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              error={passwordErrors.new_password?.message}
              {...registerPassword('new_password')}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-4 top-[38px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          {/* Password strength indicator */}
          {newPassword && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {passwordRequirements.map((req, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-1.5 text-xs ${req.regex.test(newPassword) ? 'text-emerald-600' : 'text-gray-400'
                    }`}
                >
                  <CheckCircle2
                    className={`h-3.5 w-3.5 ${req.regex.test(newPassword) ? 'text-emerald-500' : 'text-gray-300'
                      }`}
                  />
                  {req.label}
                </div>
              ))}
            </div>
          )}

          <Input
            label="Confirm New Password"
            type="password"
            error={passwordErrors.confirm_password?.message}
            {...registerPassword('confirm_password')}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPasswordModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isChangingPassword}>
              Change Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
