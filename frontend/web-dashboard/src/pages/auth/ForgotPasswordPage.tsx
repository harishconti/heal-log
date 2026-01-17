import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, Send, ShieldCheck } from 'lucide-react';
import { authApi } from '../../api';
import { Button, Input } from '../../components/ui';
import { cn } from '@/utils';

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
      <div className="text-center py-4 space-y-6">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-100/50 ring-4 ring-emerald-50">
          <CheckCircle className="h-10 w-10 text-emerald-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
          <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">
            If an account exists with that email, we've sent password reset instructions.
          </p>
        </div>
        <Link
          to="/login"
          className={cn(
            'inline-flex items-center justify-center gap-2.5 w-full h-12',
            'bg-gray-100 text-gray-700 font-semibold rounded-xl',
            'hover:bg-gray-200 hover:shadow-md',
            'hover:-translate-y-0.5 transition-all duration-300',
            'active:translate-y-0 active:shadow-sm'
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="text-center space-y-5">
        <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary-100/50 ring-4 ring-primary-50">
          <Mail className="h-10 w-10 text-primary-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Reset your password</h2>
          <p className="text-gray-500">Enter your email and we'll send you reset instructions</p>
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
          <Send className="h-4 w-4" />
          Send reset link
        </Button>

        {/* Security indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Secure password reset</span>
        </div>
      </form>

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
