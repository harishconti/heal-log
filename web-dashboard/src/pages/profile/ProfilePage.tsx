import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Mail, Phone, Stethoscope, Calendar, Crown, Shield } from 'lucide-react';
import { Card, CardHeader, Button, Input, Badge, Modal } from '../../components/ui';
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

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

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
    formState: { errors: passwordErrors, isSubmitting: isChangingPassword },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

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
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account settings</p>
      </div>

      {/* Profile Overview */}
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-700 font-bold text-2xl">
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">{user?.full_name}</h2>
              <Badge variant={isPro ? 'primary' : 'default'}>{isPro ? 'Pro' : 'Basic'}</Badge>
            </div>
            <p className="text-gray-600">{user?.email}</p>
            {user?.medical_specialty && (
              <p className="text-gray-500 text-sm">{user.medical_specialty}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-gray-900">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="text-gray-900">{user?.phone || 'Not set'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Stethoscope className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Specialty</p>
              <p className="text-gray-900">{user?.medical_specialty || 'Not set'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Member since</p>
              <p className="text-gray-900">
                {user?.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Subscription Info */}
      <Card>
        <CardHeader title="Subscription" />
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Crown className={`h-6 w-6 ${isPro ? 'text-yellow-500' : 'text-gray-400'}`} />
              <div>
                <p className="font-medium text-gray-900">
                  {isPro ? 'Pro Plan' : 'Basic Plan'}
                </p>
                <p className="text-sm text-gray-500">
                  {isPro
                    ? 'Full access to all features'
                    : '90-day trial with basic features'}
                </p>
              </div>
            </div>
            <Badge variant={user?.subscription_status === 'active' ? 'success' : 'warning'}>
              {user?.subscription_status || 'trialing'}
            </Badge>
          </div>

          {user?.subscription_end_date && (
            <p className="text-sm text-gray-600">
              {isPro ? 'Renews' : 'Trial ends'} on{' '}
              {format(new Date(user.subscription_end_date), 'MMMM d, yyyy')}
            </p>
          )}

          {!isPro && (
            <a
              href="/upgrade"
              className="block w-full text-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Upgrade to Pro - $9.99/month
            </a>
          )}
        </div>
      </Card>

      {/* Edit Profile Form */}
      <Card>
        <CardHeader title="Edit Profile" />

        {profileSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
            Profile updated successfully!
          </div>
        )}

        {profileError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
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
          <div className="flex justify-end">
            <Button type="submit" isLoading={isUpdatingProfile}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader title="Security" />
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">Password</p>
              <p className="text-sm text-gray-500">Last changed: Unknown</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
            Change Password
          </Button>
        </div>
      </Card>

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
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
            Password changed successfully!
          </div>
        )}

        {passwordError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {passwordError}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            error={passwordErrors.current_password?.message}
            {...registerPassword('current_password')}
          />
          <Input
            label="New Password"
            type="password"
            helperText="At least 12 characters with uppercase, lowercase, number, and special character"
            error={passwordErrors.new_password?.message}
            {...registerPassword('new_password')}
          />
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
