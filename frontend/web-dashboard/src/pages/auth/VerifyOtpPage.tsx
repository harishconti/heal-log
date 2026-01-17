import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, ArrowLeft, ShieldCheck, RefreshCw, CheckCircle } from 'lucide-react';
import { authApi } from '../../api';
import { useAuthStore } from '../../store';
import { Button, Input } from '../../components/ui';
import { cn } from '@/utils';

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
      <div className="text-center py-4 space-y-6">
        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-gray-100/50 ring-4 ring-gray-50">
          <Mail className="h-10 w-10 text-gray-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Missing Email</h2>
          <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">
            Please start the registration process again.
          </p>
        </div>
        <Link
          to="/register"
          className={cn(
            'inline-flex items-center justify-center gap-2.5 w-full h-12',
            'bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl',
            'shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30',
            'hover:-translate-y-0.5 transition-all duration-300',
            'active:translate-y-0 active:shadow-md'
          )}
        >
          Go to registration
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="text-center space-y-5">
        <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary-100/50 ring-4 ring-primary-50">
          <ShieldCheck className="h-10 w-10 text-primary-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Verify your email</h2>
          <p className="text-gray-500">
            We sent a code to <span className="font-semibold text-gray-700 block mt-1">{email}</span>
          </p>
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

      {/* Success message */}
      {resendMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl animate-slide-up flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-sm text-emerald-700 font-medium leading-relaxed">{resendMessage}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Verification code
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="000000"
            maxLength={6}
            className={cn(
              'w-full h-14 text-center text-2xl tracking-[0.5em] font-mono',
              'border-2 border-gray-200 rounded-xl',
              'focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500',
              'placeholder:text-gray-300 transition-all duration-200',
              errors.otp?.message && 'border-danger-500 bg-danger-50'
            )}
            {...register('otp')}
          />
          {errors.otp?.message && (
            <p className="text-sm text-danger-600 font-medium animate-slide-up">{errors.otp.message}</p>
          )}
        </div>

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
          <CheckCircle className="w-4 h-4" />
          Verify email
        </Button>

        {/* Security indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Secure verification</span>
        </div>
      </form>

      {/* Resend code */}
      <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
        <p className="text-gray-500 text-sm">
          Didn't receive the code?{' '}
          <button
            onClick={handleResend}
            disabled={isResending}
            className={cn(
              'inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-700 font-semibold',
              'disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200',
              'hover:underline underline-offset-2'
            )}
          >
            {isResending ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                Resend code
              </>
            )}
          </button>
        </p>
      </div>

      {/* Back to login */}
      <div className="pt-4 border-t border-gray-100 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-600 font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>
    </div>
  );
}
