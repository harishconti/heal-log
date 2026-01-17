import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Stethoscope,
  Calendar,
  Crown,
  Shield,
  Sparkles,
  Check,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';
import { CardHeader, Button, Input, Badge, Modal, Card } from '../../components/ui';
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Profile Settings</h1>
        <p className="text-gray-500 mt-2 font-medium">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="text-center overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-primary-500 to-primary-600 opacity-90"></div>

            <div className="relative pt-8 px-4 pb-6">
              <div className="w-24 h-24 bg-white p-1 rounded-2xl mx-auto shadow-xl shadow-primary-900/10 mb-4">
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                   <span className="text-gray-600 font-bold text-4xl">
                    {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900">{user?.full_name}</h2>
              <p className="text-gray-500 text-sm mb-4">{user?.email}</p>

              <div className="flex justify-center mb-6">
                 <Badge variant={isPro ? 'primary' : 'default'} className="px-3 py-1 font-semibold">
                  {isPro ? 'Pro Plan' : 'Basic Plan'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Stethoscope className="w-4 h-4 text-violet-500" />
                    <span className="text-xs font-semibold text-gray-500 uppercase">Specialty</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.medical_specialty || '-'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-semibold text-gray-500 uppercase">Joined</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                     {user?.created_at ? format(new Date(user.created_at), 'MMM yyyy') : '-'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

           {/* Security Quick Link */}
           <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Shield className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                <h3 className="font-bold text-lg mb-2">Security</h3>
                <p className="text-gray-300 text-sm mb-6 max-w-[200px]">
                  Secure your account with a strong password.
                </p>
                <Button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-none"
                >
                  Change Password
                </Button>
              </div>
           </Card>
        </div>

        {/* Right Column: Edit Form & Subscription */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Profile Form */}
          <Card>
            <CardHeader title="Personal Information" />

            {profileSuccess && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700 flex items-center gap-3 animate-slide-up">
                <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="font-medium">Profile updated successfully!</span>
              </div>
            )}

            {profileError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 font-medium">
                {profileError}
              </div>
            )}

            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                   <Input
                    label="Full Name"
                    placeholder="Dr. John Smith"
                    error={profileErrors.full_name?.message}
                    {...registerProfile('full_name')}
                  />
                </div>

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
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-50">
                <Button type="submit" loading={isUpdatingProfile} size="lg" className="min-w-[140px]">
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>

          {/* Subscription Info */}
          <Card>
            <CardHeader title="Subscription Plan" />
            <div className="flex flex-col sm:flex-row gap-6 items-start">
               <div className={`
                 w-full sm:w-auto p-6 rounded-2xl flex-shrink-0 flex flex-col items-center justify-center min-w-[160px]
                 ${isPro ? 'bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-100' : 'bg-gray-50 border border-gray-100'}
               `}>
                  <div className={`p-3 rounded-xl mb-3 ${isPro ? 'bg-amber-100' : 'bg-gray-200'}`}>
                    <Crown className={`w-6 h-6 ${isPro ? 'text-amber-600' : 'text-gray-500'}`} />
                  </div>
                  <p className={`font-bold text-lg ${isPro ? 'text-amber-900' : 'text-gray-700'}`}>
                    {isPro ? 'Pro Plan' : 'Basic Plan'}
                  </p>
                  <p className={`text-xs font-medium mt-1 uppercase tracking-wide ${isPro ? 'text-amber-700' : 'text-gray-500'}`}>
                    {user?.subscription_status || 'Active'}
                  </p>
               </div>

               <div className="flex-1 space-y-4 py-2">
                 <div>
                    <h4 className="font-semibold text-gray-900">
                      {isPro ? 'You have full access' : 'Upgrade to unlock all features'}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      {isPro
                        ? 'Your Pro subscription gives you access to advanced analytics, unlimited patients, and priority support.'
                        : 'Get access to advanced analytics, web dashboard, and priority support with our Pro plan.'
                      }
                    </p>
                 </div>

                 {user?.subscription_end_date && (
                    <p className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {isPro ? 'Renews' : 'Trial ends'} on {format(new Date(user.subscription_end_date), 'MMMM d, yyyy')}
                    </p>
                  )}

                  {!isPro && (
                    <Link to="/upgrade">
                      <Button className="w-full sm:w-auto shadow-lg shadow-primary-500/20 mt-2">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Upgrade to Pro - $9.99/mo
                      </Button>
                    </Link>
                  )}
               </div>
            </div>
          </Card>
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
          <div className="mb-5 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700 flex items-center gap-3">
            <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
              <Check className="h-3 w-3 text-emerald-600" />
            </div>
            <span className="font-medium">Password changed successfully!</span>
          </div>
        )}

        {passwordError && (
          <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
              {passwordRequirements.map((req, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                    req.regex.test(newPassword) ? 'text-emerald-600' : 'text-gray-400'
                  }`}
                >
                  <CheckCircle2
                    className={`h-3.5 w-3.5 transition-colors ${
                      req.regex.test(newPassword) ? 'text-emerald-500' : 'text-gray-300'
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
            <Button type="submit" loading={isChangingPassword}>
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
