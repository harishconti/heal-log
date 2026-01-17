import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, User, Mail, Phone, Lock, Sparkles } from 'lucide-react';
import { authApi } from '../../api';
import { SPECIALTY_OPTIONS } from '../../constants';
import { getErrorMessage } from '../../utils/errorUtils';

const registerSchema = z
  .object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    phone: z.string().optional(),
    medical_specialty: z.string().optional(),
    password: z
      .string()
      .min(12, 'Password must be at least 12 characters')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter')
      .regex(/[a-z]/, 'Password must contain a lowercase letter')
      .regex(/[0-9]/, 'Password must contain a number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain a special character'),
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// Password strength requirements
const passwordRequirements = [
  { regex: /.{12,}/, label: '12+ characters' },
  { regex: /[A-Z]/, label: 'Uppercase letter' },
  { regex: /[a-z]/, label: 'Lowercase letter' },
  { regex: /[0-9]/, label: 'Number' },
  { regex: /[^A-Za-z0-9]/, label: 'Special character' },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    try {
      await authApi.register({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        phone: data.phone,
        medical_specialty: data.medical_specialty,
      });
      navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Registration failed. Please try again.'));
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 p-8 sm:p-10 border border-gray-100">
      {/* Header with Pro Badge */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
          {/* Pro Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full text-xs font-semibold text-amber-700 border border-amber-200/60 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            PRO
          </div>
        </div>
        <p className="text-gray-500 text-sm">
          Already have an account? <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Name + Email row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User size={18} />
              </div>
              <input
                type="text"
                placeholder="Dr. John Smith"
                className={`block w-full pl-10 pr-3 py-2.5 bg-gray-50 border ${errors.full_name ? 'border-red-300' : 'border-gray-200'} rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm`}
                {...register('full_name')}
              />
            </div>
            {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                placeholder="doctor@example.com"
                className={`block w-full pl-10 pr-3 py-2.5 bg-gray-50 border ${errors.email ? 'border-red-300' : 'border-gray-200'} rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm`}
                {...register('email')}
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>
        </div>

        {/* Phone + Specialty row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Phone size={18} />
              </div>
              <input
                type="tel"
                placeholder="+1 (555) 123-4567"
                className={`block w-full pl-10 pr-3 py-2.5 bg-gray-50 border ${errors.phone ? 'border-red-300' : 'border-gray-200'} rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm`}
                {...register('phone')}
              />
            </div>
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Specialty</label>
            <select
              className={`block w-full px-3 py-2.5 bg-gray-50 border ${errors.medical_specialty ? 'border-red-300' : 'border-gray-200'} rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm`}
              {...register('medical_specialty')}
            >
              <option value="">Select specialty</option>
              {SPECIALTY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.medical_specialty && <p className="mt-1 text-xs text-red-500">{errors.medical_specialty.message}</p>}
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Lock size={16} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
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
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        {/* Password strength indicator */}
        {password && (
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs font-semibold text-gray-600 mb-3">Password requirements</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {passwordRequirements.map((req, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
                    req.regex.test(password) ? 'text-emerald-600' : 'text-gray-400'
                  }`}
                >
                  <CheckCircle2
                    className={`h-3.5 w-3.5 transition-colors duration-200 ${
                      req.regex.test(password) ? 'text-emerald-500' : 'text-gray-300'
                    }`}
                  />
                  {req.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-primary-700 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Create account
            </>
          )}
        </button>
      </form>

      {/* Social Login Section */}
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
