import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { authApi } from '../../api';
import { useAuthStore } from '../../store';
import { Button, Input } from '../../components/ui';

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

// Email validation schema for URL parameter
const emailSchema = z.string().email().max(254);

type OtpFormData = z.infer<typeof otpSchema>;

/**
 * Sanitizes and validates email from URL parameter
 * Returns empty string if invalid to prevent XSS
 */
function sanitizeEmailParam(rawEmail: string | null): string {
  if (!rawEmail) return '';

  // Decode and trim
  const decoded = decodeURIComponent(rawEmail).trim().toLowerCase();

  // Validate email format
  const result = emailSchema.safeParse(decoded);
  if (!result.success) {
    console.warn('Invalid email parameter rejected:', rawEmail);
    return '';
  }

  return result.data;
}

export function VerifyOtpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Sanitize and validate email from URL parameter
  const email = useMemo(
    () => sanitizeEmailParam(searchParams.get('email')),
    [searchParams]
  );

  const { login } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  const onSubmit = async (data: OtpFormData) => {
    setError(null);
    try {
      const response = await authApi.verifyOtp(email, data.otp);
      login(response.user, response.access_token, response.refresh_token);
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Invalid verification code');
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError(null);
    setResendMessage(null);
    try {
      await authApi.resendOtp(email);
      setResendMessage('A new verification code has been sent to your email.');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Mail className="h-7 w-7 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Missing Email</h2>
        <p className="text-sm text-gray-500 mb-6">
          Please start the registration process again.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
        >
          Go to registration
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Mail className="h-7 w-7 text-primary-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Verify your email</h2>
        <p className="text-sm text-gray-500">
          We sent a code to <span className="font-medium text-gray-700">{email}</span>
        </p>
      </div>

      {error && (
        <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {resendMessage && (
        <div className="mb-5 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-600">
          {resendMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Verification code"
          type="text"
          inputMode="numeric"
          placeholder="Enter 6-digit code"
          maxLength={6}
          className="text-center text-lg tracking-widest"
          error={errors.otp?.message}
          {...register('otp')}
        />

        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          Verify email
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Didn't receive the code?{' '}
          <button
            onClick={handleResend}
            disabled={isResending}
            className="text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50 transition-colors"
          >
            {isResending ? 'Sending...' : 'Resend code'}
          </button>
        </p>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-100 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>
    </div>
  );
}
