import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { authApi } from '../../api';
import { Button, Input, Select } from '../../components/ui';
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
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h2>
        <p className="text-gray-500">Start managing your patients today</p>
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
          label="Full name"
          type="text"
          autoComplete="name"
          placeholder="Dr. John Smith"
          error={errors.full_name?.message}
          {...register('full_name')}
        />

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="doctor@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Phone number"
            type="tel"
            autoComplete="tel"
            placeholder="+1 (555) 123-4567"
            error={errors.phone?.message}
            {...register('phone')}
          />

          <Select
            label="Specialty"
            options={SPECIALTY_OPTIONS}
            error={errors.medical_specialty?.message}
            {...register('medical_specialty')}
          />
        </div>

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Create a strong password"
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-[38px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        {/* Password strength indicator */}
        {password && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {passwordRequirements.map((req, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-1.5 text-xs ${
                  req.regex.test(password) ? 'text-emerald-600' : 'text-gray-400'
                }`}
              >
                <CheckCircle2
                  className={`h-3.5 w-3.5 ${
                    req.regex.test(password) ? 'text-emerald-500' : 'text-gray-300'
                  }`}
                />
                {req.label}
              </div>
            ))}
          </div>
        )}

        <div className="relative">
          <Input
            label="Confirm password"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Confirm your password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-[38px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold shadow-lg shadow-primary-500/25"
          isLoading={isSubmitting}
        >
          Create account
        </Button>
      </form>

      {/* Login link */}
      <p className="mt-8 text-center text-gray-500">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
