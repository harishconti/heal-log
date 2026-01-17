import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Eye, EyeOff, Sparkles, ShieldCheck } from 'lucide-react';
import { authApi } from '../../api';
import { useAuthStore } from '../../store';
import { Button, Input } from '../../components/ui';
import { getErrorMessage, getErrorStatus, isAxiosError } from '../../utils/errorUtils';
import { cn } from '@/utils';

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
        setError(
          'Web dashboard is only available for Pro users. Please upgrade your plan in the mobile app.'
        );
        return;
      }

      login(response.user, response.access_token, response.refresh_token);
      navigate('/dashboard');
    } catch (err: unknown) {
      const status = getErrorStatus(err);
      const message = getErrorMessage(err, 'Invalid email or password');

      if (
        status === 403 &&
        isAxiosError(err) &&
        err.response?.data?.detail?.includes('verify')
      ) {
        setNeedsVerification(true);
        setVerificationEmail(data.email);
      } else {
        setError(message);
      }
    }
  };

  if (needsVerification) {
    return (
      <div className="text-center py-4">
        <div className="space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary-100">
            <Mail className="h-10 w-10 text-primary-600" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">Verify Your Email</h2>
            <p className="text-gray-500 leading-relaxed">
              We've sent a verification code to{' '}
              <span className="font-semibold text-gray-700 block mt-1">{verificationEmail}</span>
            </p>
          </div>
          <Link
            to={`/verify-otp?email=${encodeURIComponent(verificationEmail)}`}
            className={cn(
              'inline-flex items-center justify-center gap-2.5 w-full h-14',
              'bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl',
              'shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30',
              'hover:-translate-y-0.5 transition-all duration-300',
              'active:translate-y-0 active:shadow-md'
            )}
          >
            Enter verification code
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Header with Pro Badge */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Welcome back
            </h2>
            <p className="text-gray-500 text-sm">
              Sign in to access your dashboard
            </p>
          </div>
          {/* Pro Badge - Modern floating style */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full text-xs font-semibold text-amber-700 border border-amber-200/60 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            PRO
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-xl animate-slide-up flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-danger-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-danger-600 text-xs font-bold">!</span>
          </div>
          <p className="text-sm text-danger-700 font-medium leading-relaxed">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-4">
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="doctor@example.com"
            error={errors.email?.message}
            icon={<Mail className="w-5 h-5" />}
            required
            {...register('email')}
          />

          <div className="space-y-2">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              error={errors.password?.message}
              suffixIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-primary-600 transition-colors focus:outline-none p-1 rounded-md hover:bg-gray-50"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              }
              required
              {...register('password')}
            />
            {/* Forgot password link - right aligned under password field */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-primary-500"
              >
                Forgot password?
              </Link>
            </div>
          </div>
        </div>

        {/* Enhanced CTA Button */}
        <Button
          type="submit"
          size="lg"
          fullWidth
          className={cn(
            'h-12 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl',
            'shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30',
            'hover:-translate-y-0.5 transition-all duration-300',
            'active:translate-y-0 active:shadow-md'
          )}
          loading={isSubmitting}
        >
          Sign in
        </Button>

        {/* Security indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>256-bit SSL encrypted</span>
        </div>
      </form>

      {/* Divider */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 bg-white text-sm text-gray-400">
            New to HealLog?
          </span>
        </div>
      </div>

      {/* Register link */}
      <Button
        variant="outline"
        size="lg"
        fullWidth
        className="h-12 rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all duration-200"
        onClick={() => navigate('/register')}
      >
        Create an account
      </Button>
    </div>
  );
}
