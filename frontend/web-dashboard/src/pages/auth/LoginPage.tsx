import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../../api';
import { useAuthStore } from '../../store';
import { Button, Input } from '../../components/ui';
import { getErrorMessage, getErrorStatus, isAxiosError } from '../../utils/errorUtils';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    try {
      const response = await authApi.login({
        username: data.email,
        password: data.password,
      });

      if (response.user.plan !== 'pro') {
        setError('Web dashboard is only available for Pro users. Please upgrade your plan in the mobile app.');
        return;
      }

      login(response.user, response.access_token, response.refresh_token);
      navigate('/dashboard');
    } catch (err: unknown) {
      const status = getErrorStatus(err);
      const message = getErrorMessage(err, 'Invalid email or password');

      if (status === 403 && isAxiosError(err) && err.response?.data?.detail?.includes('verify')) {
        setNeedsVerification(true);
        setVerificationEmail(data.email);
      } else {
        setError(message);
      }
    }
  };

  if (needsVerification) {
    return (
      <div className="text-center py-2">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary-100">
          <Mail className="h-8 w-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Please verify your email address to continue. A verification code has been sent to{' '}
          <span className="font-semibold text-gray-700">{verificationEmail}</span>
        </p>
        <Link
          to={`/verify-otp?email=${encodeURIComponent(verificationEmail)}`}
          className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-lg shadow-primary-500/25"
        >
          Enter verification code
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
        <p className="text-gray-500">Sign in to your account to continue</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-50/50 border border-red-100 rounded-xl">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-4">
          <div className="relative">
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="doctor@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[38px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold shadow-lg shadow-primary-500/25"
          isLoading={isSubmitting}
        >
          Sign in
        </Button>
      </form>

      {/* Register link */}
      <p className="mt-8 text-center text-gray-500">
        Don't have an account?{' '}
        <Link
          to="/register"
          className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
        >
          Create account
        </Link>
      </p>

      {/* Pro subscription notice */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <Lock className="h-3.5 w-3.5" />
          <span>Web dashboard requires a Pro subscription</span>
        </div>
      </div>
    </div>
  );
}
