import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Eye, EyeOff, Lock } from 'lucide-react';
import { authApi } from '../../api';
import { useAuthStore } from '../../store';
import { Button, Input, Card } from '../../components/ui';
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
      <Card variant="elevated" padding="lg" className="text-center animate-fade-in border-0 shadow-xl shadow-gray-200/50 ring-1 ring-gray-100/50">
        <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="h-8 w-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox</h2>
        <p className="text-gray-500 mb-6">
          We sent a verification code to <span className="font-medium text-gray-900">{verificationEmail}</span>
        </p>
        <Link to={`/verify-otp?email=${encodeURIComponent(verificationEmail)}`}>
          <Button fullWidth>
            Enter Code <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <>
      {/* 1. Header Section - Clean and separated */}
      <div className="mb-10 text-center sm:text-left">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back</h2>
        <p className="mt-3 text-base text-gray-500">
          New here?{' '}
          <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-500 hover:underline">
            Create an account
          </Link>
        </p>
      </div>

      {/* 2. Main Card - Using Shadow-lg for depth, but white background for cleanliness */}
      <div className="bg-white px-8 py-10 shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100 ring-1 ring-gray-100/50">

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
             <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Input Group 1 */}
          <div className="space-y-2">
            <Input
              label="Email address"
              type="email"
              placeholder="name@work-email.com"
              error={errors.email?.message}
              className="h-12"
              icon={<Mail className="w-5 h-5 text-gray-400" />}
              {...register('email')}
            />
          </div>

          {/* Input Group 2 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-900">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  Forgot password?
                </Link>
            </div>
            <div className="relative">
                <input
                   type={showPassword ? 'text' : 'password'}
                   className="w-full h-12 px-4 pl-11 rounded-lg border-2 border-gray-200 focus:border-primary-600 focus:ring-4 focus:ring-primary-100 transition-all outline-none hover:border-gray-300"
                   placeholder="Enter your password"
                   {...register('password')}
                />
                <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600"
                >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
            </div>
            {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
          </div>

          {/* Action Button - Full width, prominent */}
          <Button
            type="submit"
            size="lg"
            fullWidth
            className="h-12 text-base font-semibold shadow-lg shadow-primary-500/30"
            loading={isSubmitting}
          >
            Sign in to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
          </Button>

        </form>
      </div>

      {/* 3. SSO / Alternative Options */}
      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-gray-50 text-gray-500">Or continue with</span></div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium text-sm text-gray-700">
               <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.55 0 2.95.53 4.05 1.58l3.03-3.03C17.46 2.05 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
               Google
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium text-sm text-gray-700">
               Microsoft
            </button>
        </div>
      </div>
    </>
  );
}
