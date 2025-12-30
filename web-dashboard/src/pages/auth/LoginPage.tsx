import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api';
import { useAuthStore } from '../../store';
import { Button, Input } from '../../components/ui';

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

      // Check if user is Pro (for web dashboard access)
      if (response.user.plan !== 'pro') {
        setError('Web dashboard is only available for Pro users. Please upgrade your plan.');
        return;
      }

      login(response.user, response.access_token, response.refresh_token);
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string }; status?: number } };
      if (error.response?.status === 403 && error.response?.data?.detail?.includes('verify')) {
        setNeedsVerification(true);
        setVerificationEmail(data.email);
      } else {
        setError(error.response?.data?.detail || 'Invalid email or password');
      }
    }
  };

  if (needsVerification) {
    return (
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Verify Your Email</h2>
        <p className="text-sm text-gray-600 mb-4">
          Please verify your email address to continue. A verification code has been sent to{' '}
          <strong>{verificationEmail}</strong>.
        </p>
        <Link
          to={`/verify-otp?email=${encodeURIComponent(verificationEmail)}`}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Enter verification code
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Sign in to your account</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="doctor@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-end">
          <Link
            to="/forgot-password"
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
          Sign up
        </Link>
      </p>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs text-center text-gray-500">
          Web dashboard requires a Pro subscription.{' '}
          <a href="#" className="text-primary-600 hover:text-primary-700">
            Learn more
          </a>
        </p>
      </div>
    </div>
  );
}
