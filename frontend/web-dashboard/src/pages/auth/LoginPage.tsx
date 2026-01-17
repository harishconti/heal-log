import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
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
      <Card variant="elevated" padding="lg" className="text-center animate-fade-in border-0 shadow-xl shadow-primary-900/5 ring-1 ring-gray-200">
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
      {/* 1. Main Login Card */}
      <Card variant="elevated" padding="none" className="border-0 shadow-xl shadow-primary-900/5 ring-1 ring-gray-200">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold border border-amber-100">
                <Sparkles className="w-3 h-3" />
                PRO
              </div>
            </div>
            <p className="text-gray-500 text-sm">Enter your credentials to access the workspace.</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-danger-50 border border-danger-100 flex items-start gap-3">
              <div className="text-danger-600 mt-0.5">⚠️</div>
              <p className="text-sm text-danger-700 font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="doctor@heallog.com"
              error={errors.email?.message}
              icon={<Mail className="w-5 h-5" />}
              {...register('email')}
            />

            <div className="space-y-1">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.password?.message}
                suffixIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
                {...register('password')}
              />
              <div className="flex justify-end pt-1">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
              Sign in
            </Button>
          </form>
        </div>
      </Card>

      {/* 2. Registration Section - MOVED OUTSIDE THE CARD */}
      <div className="text-center space-y-4">
        <p className="text-sm text-gray-500">
          Don't have an account yet?
        </p>
        <Button
          variant="outline"
          size="lg"
          fullWidth
          onClick={() => navigate('/register')}
          className="bg-transparent border-gray-300 hover:bg-white hover:border-gray-400"
        >
          Create an account
        </Button>
      </div>
    </>
  );
}
