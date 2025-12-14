// frontend/lib/validation.ts
import * as z from 'zod';

// Phone number regex: 10 digits, starts with digit
const phoneRegex = /^[0-9][0-9]{9}$/;

// Email regex: more permissive but requires @ and domain
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const patientSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  email: z.string()
    .refine(val => !val || emailRegex.test(val), {
      message: "Invalid email format (e.g. user@gmail.com)"
    })
    .optional()
    .or(z.literal('')),
  phone_number: z.string()
    .refine(val => !val || phoneRegex.test(val), {
      message: "Phone must be 10 digits and start with a number"
    })
    .optional()
    .or(z.literal('')),
  address: z.string().optional(),
  date_of_birth: z.string().optional(),
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
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string()
    .refine(val => emailRegex.test(val), {
      message: "Invalid email format (e.g. user@gmail.com)"
    }),
  phone: z.string()
    .refine(val => !val || phoneRegex.test(val), {
      message: "Phone must be 10 digits and start with a number"
    })
    .optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
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
