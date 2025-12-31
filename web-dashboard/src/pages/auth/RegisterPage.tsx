import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api';
import { Button, Input, Select } from '../../components/ui';

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

const specialties = [
  { value: '', label: 'Select specialty (optional)' },
  { value: 'General Practice', label: 'General Practice' },
  { value: 'Cardiology', label: 'Cardiology' },
  { value: 'Dermatology', label: 'Dermatology' },
  { value: 'Neurology', label: 'Neurology' },
  { value: 'Orthopedics', label: 'Orthopedics' },
  { value: 'Pediatrics', label: 'Pediatrics' },
  { value: 'Psychiatry', label: 'Psychiatry' },
  { value: 'Surgery', label: 'Surgery' },
  { value: 'Other', label: 'Other' },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

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
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Registration failed. Please try again.');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Create your account</h2>
      <p className="text-sm text-gray-500 mb-6">Start managing your patients today</p>

      {error && (
        <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            options={specialties}
            error={errors.medical_specialty?.message}
            {...register('medical_specialty')}
          />
        </div>

        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a strong password"
          error={errors.password?.message}
          helperText="Min 12 chars with uppercase, lowercase, number & symbol"
          {...register('password')}
        />

        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Confirm your password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
