// frontend/lib/validation.ts
import * as z from 'zod';

// Phone number regex: 10 digits, starts with 6-9 (Indian mobile)
const phoneRegex = /^[6-9][0-9]{9}$/;

// Email regex: more permissive but requires @ and domain
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Name regex: letters, spaces, hyphens, apostrophes only
const nameRegex = /^[a-zA-Z\s\-']+$/;

// Password regex: min 12 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
// Special chars aligned with backend: !@#$%^&*(),.?":{}|<>
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{12,}$/;

// Patient ID regex: PTYYYYMM001 format (PT + 4-digit year + 2-digit month + 3-digit sequence)
export const patientIdRegex = /^PT\d{6}\d{3}$/;

// Date validation helper
const isValidDate = (dateString: string): boolean => {
  if (!dateString) return true;
  const date = new Date(dateString);
  const today = new Date();
  if (isNaN(date.getTime())) return false;
  if (date > today) return false;
  if (date.getFullYear() < today.getFullYear() - 150) return false;
  return true;
};

export const patientSchema = z.object({
  full_name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters")
    .refine(val => !val || nameRegex.test(val), {
      message: "Name can only contain letters, spaces, hyphens, and apostrophes"
    }),
  email: z.string()
    .refine(val => !val || emailRegex.test(val), {
      message: "Invalid email format (e.g., user@gmail.com)"
    })
    .optional()
    .or(z.literal('')),
  phone_number: z.string()
    .refine(val => !val || phoneRegex.test(val), {
      message: "Phone must be 10 digits starting with 6-9"
    })
    .optional()
    .or(z.literal('')),
  address: z.string().max(200, "Address too long (max 200 chars)").optional(),
  date_of_birth: z.string()
    .refine(val => !val || isValidDate(val), {
      message: "Invalid date or date in future"
    })
    .optional(),
  initial_complaint: z.string().optional(),
  initial_diagnosis: z.string().optional(),
  location: z.string().optional(),
  group: z.string().optional(),
  photo: z.string().optional(),
  is_favorite: z.boolean().optional(),
});

export type PatientFormData = z.infer<typeof patientSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  full_name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters")
    .refine(val => nameRegex.test(val), {
      message: "Name can only contain letters, spaces, hyphens, and apostrophes"
    }),
  email: z.string()
    .refine(val => emailRegex.test(val), {
      message: "Invalid email format (e.g., user@gmail.com)"
    }),
  phone: z.string()
    .refine(val => !val || phoneRegex.test(val), {
      message: "Phone must be 10 digits starting with 6-9"
    })
    .optional(),
  password: z.string()
    .min(12, "Password must be at least 12 characters")
    .refine(password => passwordRegex.test(password), {
      message: "Password must contain uppercase, lowercase, number, and special character (!@#$%^&*(),.?\":{}|<>)"
    }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const noteSchema = z.object({
  content: z.string().min(1, "Note content cannot be empty"),
  visit_type: z.string().min(1, "Visit type is required"),
  patient_id: z.string().min(1, "Patient ID is required"),
});

export type NoteFormData = z.infer<typeof noteSchema>;

// OTP validation
export const otpSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp_code: z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export type OTPFormData = z.infer<typeof otpSchema>;

// Password reset validation
export const passwordResetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  new_password: z.string()
    .min(12, "Password must be at least 12 characters")
    .refine(password => passwordRegex.test(password), {
      message: "Password must contain uppercase, lowercase, number, and special character (!@#$%^&*(),.?\":{}|<>)"
    }),
  confirmPassword: z.string(),
}).refine((data) => data.new_password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;

// Password strength checker
export const getPasswordStrength = (password: string): {
  score: number;
  label: string;
  color: string;
} => {
  let score = 0;

  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Weak', color: '#e74c3c' };
  if (score <= 4) return { score, label: 'Medium', color: '#f39c12' };
  return { score, label: 'Strong', color: '#2ecc71' };
};
