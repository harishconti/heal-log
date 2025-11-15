// frontend/lib/validation.ts
import * as z from 'zod';

export const patientSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal('')),
  phone_number: z.string().min(8).max(20).optional().or(z.literal('')),
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
