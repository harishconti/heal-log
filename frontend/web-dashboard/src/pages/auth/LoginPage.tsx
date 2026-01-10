import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Lock, Eye, EyeOff, LogIn, Sparkles } from 'lucide-react';
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
        <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-primary-200/50">
          <Mail className="h-10 w-10 text-primary-600" />
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-bold text-gray-900">Verify Your Email</h2>
          <p className="text-gray-600 leading-relaxed">
            We've sent a verification code to{' '}
            <span className="font-semibold text-gray-900">{verificationEmail}</span>
          </p>
        </div>
        <Link
          to={`/verify-otp?email=${encodeURIComponent(verificationEmail)}`}
          className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-2xl hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300 group"
        >
          Enter verification code
          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium mb-4">
          <LogIn className="w-4 h-4" />
          <span>Healthcare Professional Portal</span>
        </div>
        <h2 className="text-4xl font-bold text-gray-900 tracking-tight">Welcome back</h2>
        <p className="text-gray-600 text-lg">Sign in to manage your practice</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="relative overflow-hidden p-4 bg-gradient-to-r from-red-50 via-red-50/80 to-red-50/60 border-l-4 border-red-500 rounded-xl shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-full blur-3xl opacity-30" />
          <p className="relative text-sm text-red-700 font-medium">{error}</p>
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
              className="h-14 text-base"
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
              className="h-14 text-base pr-12"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[42px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full h-14 text-base font-semibold shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/40 transition-all duration-300 group"
          isLoading={isSubmitting}
        >
          {!isSubmitting && <Lock className="h-5 w-5 group-hover:scale-110 transition-transform" />}
          Sign in to Dashboard
        </Button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center gap-4 py-4">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        <span className="text-sm text-gray-400 font-medium">New to HealLog?</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </div>

      {/* Register link */}
      <Link
        to="/register"
        className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 font-semibold rounded-2xl border border-gray-200 hover:border-primary-300 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 hover:text-primary-700 transition-all duration-300 group"
      >
        <Sparkles className="h-4 w-4 group-hover:rotate-12 transition-transform" />
        Create your account
      </Link>

      {/* Pro subscription notice */}
      <div className="pt-6 border-t border-gray-100">
        <div className="flex items-center justify-center gap-2 text-sm">
          <Lock className="h-4 w-4 text-gray-400" />
          <span className="text-gray-500">
            Pro subscription required • <Link to="/pricing" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">View plans</Link>
          </span>
        </div>
      </div>
    </div>
  );
}
