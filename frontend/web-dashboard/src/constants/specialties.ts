/**
 * Medical specialties for healthcare providers.
 * Shared across registration, profile, and other forms.
 */
export const MEDICAL_SPECIALTIES = [
  'General Practice',
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'Neurology',
  'Obstetrics & Gynecology',
  'Oncology',
  'Ophthalmology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Radiology',
  'Surgery',
  'Urology',
  'Other',
] as const;

export type MedicalSpecialty = (typeof MEDICAL_SPECIALTIES)[number];

/**
 * Specialties formatted for dropdown/select components.
 */
export const SPECIALTY_OPTIONS = [
  { value: '', label: 'Select specialty (optional)' },
  ...MEDICAL_SPECIALTIES.map((specialty) => ({
    value: specialty,
    label: specialty,
  })),
];
