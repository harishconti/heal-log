import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, User, Mail, Phone, Stethoscope, Lock, Sparkles, ShieldCheck } from 'lucide-react';
import { authApi } from '../../api';
import { Button, Input, Select } from '../../components/ui';
import { SPECIALTY_OPTIONS } from '../../constants';
import { getErrorMessage } from '../../utils/errorUtils';
import { cn } from '@/utils';

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
    <div className="space-y-6">
      {/* Header with Pro Badge */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Create your account
            </h2>
            <p className="text-gray-500 text-sm">
              Start managing your patients today
            </p>
          </div>
          {/* Pro Badge - Modern floating style */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full text-xs font-semibold text-amber-700 border border-amber-200/60 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            PRO
          </div>
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
        {/* Desktop: Name + Email on one row. Mobile: Stacked */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Input
            label="Full name"
            type="text"
            autoComplete="name"
            placeholder="Dr. John Smith"
            error={errors.full_name?.message}
            icon={<User className="w-5 h-5" />}
            required
            {...register('full_name')}
          />

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
        </div>

        {/* Desktop: Phone + Specialty on one row. Mobile: Stacked */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Input
            label="Phone number"
            type="tel"
            autoComplete="tel"
            placeholder="+1 (555) 123-4567"
            error={errors.phone?.message}
            icon={<Phone className="w-5 h-5" />}
            required
            {...register('phone')}
          />

          <Select
            label="Specialty"
            options={SPECIALTY_OPTIONS}
            error={errors.medical_specialty?.message}
            {...register('medical_specialty')}
            /* Optional field */
          />
        </div>

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Create a strong password"
          error={errors.password?.message}
          icon={<Lock className="w-5 h-5" />}
          suffixIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-primary-600 transition-colors focus:outline-none p-1 rounded-md hover:bg-gray-50"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          }
          required
          {...register('password')}
        />

        {/* Password strength indicator */}
        {password && (
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs font-semibold text-gray-600 mb-3">Password requirements</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {passwordRequirements.map((req, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex items-center gap-1.5 text-xs transition-colors duration-200',
                    req.regex.test(password) ? 'text-emerald-600' : 'text-gray-400'
                  )}
                >
                  <CheckCircle2
                    className={cn(
                      'h-3.5 w-3.5 transition-colors duration-200',
                      req.regex.test(password) ? 'text-emerald-500' : 'text-gray-300'
                    )}
                  />
                  {req.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced CTA Button */}
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
          <CheckCircle2 className="w-4 h-4" />
          Create account
        </Button>

        {/* Security indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>256-bit SSL encrypted</span>
        </div>
      </form>

      {/* Divider */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 bg-white text-sm text-gray-400">
            Already have an account?
          </span>
        </div>
      </div>

      {/* Login link */}
      <Button
        variant="outline"
        size="lg"
        fullWidth
        className="h-12 rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all duration-200"
        onClick={() => navigate('/login')}
      >
        Sign in
      </Button>
    </div>
  );
}
