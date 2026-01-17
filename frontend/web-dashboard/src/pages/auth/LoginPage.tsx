import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Eye, EyeOff, Lock } from 'lucide-react';
import { authApi } from '../../api';
import { useAuthStore } from '../../store';
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
        setError('Web dashboard is only available for Pro users.');
        return;
      }

      login(response.user, response.access_token, response.refresh_token);
      navigate('/dashboard');
    } catch (err: unknown) {
      const status = getErrorStatus(err);
      const message = getErrorMessage(err, 'Invalid email or password');

      if (status === 403 && isAxiosError(err) && err.response?.data?.detail?.includes('verify')) {
        setNeedsVerification(true);
        setVerificationEmail(data.email);
      } else {
        setError(message);
      }
    }
  };

  if (needsVerification) {
    return (
       <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 p-8 sm:p-10 border border-gray-100 text-center">
         <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 mx-auto mb-4">
             <Mail size={32} />
         </div>
         <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox</h2>
         <p className="text-gray-500 mb-6">Verification code sent to <span className="font-medium text-gray-900">{verificationEmail}</span></p>
         <Link to={`/verify-otp?email=${encodeURIComponent(verificationEmail)}`}>
            <button className="w-full py-3 px-4 rounded-xl shadow-sm text-sm font-semibold text-white bg-primary-700 hover:bg-primary-800 transition-colors">
              Enter Code
            </button>
         </Link>
       </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 p-8 sm:p-10 border border-gray-100">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">HealLog Professional Login</h2>
        <p className="text-gray-500 text-sm">
          New here? <Link to="/register" className="text-primary-600 font-medium hover:underline">Create an account</Link>
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
               <Mail size={18} />
            </div>
            <input
              type="email"
              placeholder="name@work-email.com"
              className={`block w-full pl-10 pr-3 py-2.5 bg-gray-50 border ${errors.email ? 'border-red-300' : 'border-gray-200'} rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm`}
              {...register('email')}
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Lock size={16} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className={`block w-full pl-10 pr-10 py-2.5 bg-gray-50 border ${errors.password ? 'border-red-300' : 'border-gray-200'} rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm`}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="flex justify-end mt-2">
            <Link to="/forgot-password" className="text-xs font-medium text-primary-600 hover:text-primary-700">
              Forgot password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-primary-700 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : 'Sign In to Dashboard'}
        </button>
      </form>

      {/* Social Login Section from Reference */}
      <div className="relative mt-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center px-4 py-2.5 border border-gray-200 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5 mr-2" />
          Google
        </button>
        <button className="flex items-center justify-center px-4 py-2.5 border border-gray-200 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <img src="https://www.svgrepo.com/show/452263/microsoft.svg" alt="Microsoft" className="h-5 w-5 mr-2" />
          Microsoft
        </button>
      </div>
    </div>
  );
}
