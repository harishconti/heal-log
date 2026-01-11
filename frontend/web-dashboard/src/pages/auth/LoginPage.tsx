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
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
          <Mail className="h-8 w-8 text-blue-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Verify Your Email</h2>
          <p className="text-gray-600">
            We've sent a code to <span className="font-semibold">{verificationEmail}</span>
          </p>
        </div>
        <Link
          to={`/verify-otp?email=${encodeURIComponent(verificationEmail)}`}
          className="inline-flex items-center justify-center gap-2 w-full h-12 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Enter verification code
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header - Simplified */}
      <div className="space-y-2">
        <h2 className="text-[20px] font-semibold text-[#1e3a8a] tracking-tight">Welcome back</h2>
        <p className="text-[14px] text-[#94a3b8]">Please enter your details to sign in.</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-5">
          <div>
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="doctor@example.com"
              error={errors.email?.message}
              required
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
              required
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

        <div className="flex items-center justify-between">
           {/* Pro Badge */}
           <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600 border border-gray-200">
              <Lock className="w-3 h-3" />
              PRO
           </div>

          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full h-[44px] text-[14px] font-semibold bg-[#2563eb] hover:bg-[#1d4ed8] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          isLoading={isSubmitting}
        >
          Sign in
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
        </div>
      </div>

      {/* Register link - Simplified */}
      <Link
        to="/register"
        className="flex items-center justify-center w-full h-[44px] px-6 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 hover:text-gray-900 transition-all text-[14px]"
      >
        Create an account
      </Link>
    </div>
  );
}
