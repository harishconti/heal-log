import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authApi } from '../../api';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitEmail, setSubmitEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await authApi.forgotPassword(data.email);
    } catch (err) {
      console.error(err);
    } finally {
        setSubmitEmail(data.email);
        setIsSubmitted(true);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 p-8 sm:p-10 border border-gray-100">
      {!isSubmitted ? (
        <>
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-primary-600 border border-blue-100">
              <Mail size={32} />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset your password</h2>
            <p className="text-gray-500 text-sm">Enter your email and we'll send you reset instructions</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                placeholder="doctor@example.com"
                className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
                {...register('email')}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Send reset link'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft size={16} className="mr-2" />
              Back to login
            </Link>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <div className="flex justify-center mb-6">
             <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 animate-bounce border border-green-100">
                <CheckCircle2 size={32} />
             </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            We sent a password reset link to <br/>
            <span className="font-medium text-gray-900">{submitEmail}</span>
          </p>

          <Link to="/login">
            <button className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
              Back to login
            </button>
          </Link>

          <p className="mt-6 text-xs text-gray-400">
            Didn't receive the email? <button onClick={() => setIsSubmitted(false)} className="text-primary-600 hover:underline font-medium">Click to resend</button>
          </p>
        </div>
      )}
    </div>
  );
}
