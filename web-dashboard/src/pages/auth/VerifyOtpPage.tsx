import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api';
import { useAuthStore } from '../../store';
import { Button, Input } from '../../components/ui';

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

type OtpFormData = z.infer<typeof otpSchema>;

export function VerifyOtpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
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
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Missing Email</h2>
        <p className="text-sm text-gray-600 mb-4">
          Please start the registration process again.
        </p>
        <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
          Go to registration
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Verify your email</h2>
      <p className="text-sm text-gray-600 mb-6">
        We sent a verification code to <strong>{email}</strong>
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {resendMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
          {resendMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Verification code"
          type="text"
          inputMode="numeric"
          placeholder="Enter 6-digit code"
          maxLength={6}
          error={errors.otp?.message}
          {...register('otp')}
        />

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Verify email
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Didn't receive the code?{' '}
          <button
            onClick={handleResend}
            disabled={isResending}
            className="text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
          >
            {isResending ? 'Sending...' : 'Resend code'}
          </button>
        </p>
      </div>

      <p className="mt-4 text-center text-sm text-gray-600">
        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
          Back to login
        </Link>
      </p>
    </div>
  );
}
