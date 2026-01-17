import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, ArrowLeft, ShieldCheck, RefreshCw } from 'lucide-react';
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
        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-gray-100">
          <Mail className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Missing Email</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Please start the registration process again.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-lg shadow-primary-500/25"
        >
          Go to registration
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary-100">
          <ShieldCheck className="h-8 w-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify your email</h2>
        <p className="text-gray-500">
          We sent a code to <span className="font-semibold text-gray-700">{email}</span>
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-50/50 border border-red-100 rounded-xl">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Success message */}
      {resendMessage && (
        <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-emerald-50/50 border border-emerald-100 rounded-xl">
          <p className="text-sm text-emerald-600 font-medium">{resendMessage}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Verification code"
          type="text"
          inputMode="numeric"
          placeholder="000000"
          maxLength={6}
          className="text-center text-2xl tracking-[0.5em] font-mono"
          error={errors.otp?.message}
          {...register('otp')}
        />

        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold shadow-lg shadow-primary-500/25"
          loading={isSubmitting}
        >
          Verify email
        </Button>
      </form>

      {/* Resend code */}
      <div className="mt-6 text-center">
        <p className="text-gray-500">
          Didn't receive the code?{' '}
          <button
            onClick={handleResend}
            disabled={isResending}
            className="inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-700 font-semibold disabled:opacity-50 transition-colors"
          >
            {isResending ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Sending...
              </>
            ) : (
              'Resend code'
            )}
          </button>
        </p>
      </div>

      {/* Back to login */}
      <div className="mt-8 pt-6 border-t border-gray-100 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>
    </div>
  );
}
