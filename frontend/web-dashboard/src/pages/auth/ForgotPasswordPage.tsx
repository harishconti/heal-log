import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, Send } from 'lucide-react';
import { authApi } from '../../api';
import { Button, Input } from '../../components/ui';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null);
    try {
      await authApi.forgotPassword(data.email);
      setIsSubmitted(true);
    } catch (err) {
      // For security, we still show the same message to prevent email enumeration
      // But log the error for debugging purposes
      console.error('Forgot password error:', err);
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-100">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          If an account exists with that email, we've sent password reset instructions.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary-100">
          <Mail className="h-8 w-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset your password</h2>
        <p className="text-gray-500">Enter your email and we'll send you reset instructions</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-50/50 border border-red-100 rounded-xl">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="doctor@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold shadow-lg shadow-primary-500/25"
          isLoading={isSubmitting}
        >
          <Send className="h-4 w-4" />
          Send reset link
        </Button>
      </form>

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
