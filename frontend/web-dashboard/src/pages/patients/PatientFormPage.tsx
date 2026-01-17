import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, User, Phone, FileText, CheckCircle2 } from 'lucide-react';
import { Card, Button, Input, Textarea, Spinner } from '../../components/ui';
import { patientsApi, type CreatePatientData } from '../../api/patients';
import { getErrorMessage } from '../../utils/errorUtils';

const currentYear = new Date().getFullYear();

const patientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  location: z.string().optional(),
  initial_complaint: z.string().optional(),
  initial_diagnosis: z.string().optional(),
  group: z.string().optional(),
  is_favorite: z.boolean().optional(),
  // New patient profile fields
  year_of_birth: z.number().min(1900).max(currentYear).optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  active_treatment_plan: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

export function PatientFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [isLoading, setIsLoading] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<string[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      is_favorite: false,
    },
  });

  useEffect(() => {
    patientsApi.getGroups()
      .then(setGroups)
      .catch((err) => {
        // Groups are optional, so we just log in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to load groups:', err);
        }
      })
      .finally(() => setIsLoadingGroups(false));

    if (isEditing && id) {
      patientsApi
        .getPatient(id)
        .then((patient) => {
          reset({
            name: patient.name,
            phone: patient.phone || '',
            email: patient.email || '',
            address: patient.address || '',
            location: patient.location || '',
            initial_complaint: patient.initial_complaint || '',
            initial_diagnosis: patient.initial_diagnosis || '',
            group: patient.group || '',
            is_favorite: patient.is_favorite,
            year_of_birth: patient.year_of_birth || null,
            gender: patient.gender || null,
            active_treatment_plan: patient.active_treatment_plan || '',
          });
        })
        .catch((err) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to load patient:', err);
          }
          setError('Failed to load patient. Please try again.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [id, isEditing, reset]);

  const onSubmit = async (data: PatientFormData) => {
    setError(null);
    try {
      const patientData: CreatePatientData = {
        name: data.name,
        phone: data.phone || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
        location: data.location || undefined,
        initial_complaint: data.initial_complaint || undefined,
        initial_diagnosis: data.initial_diagnosis || undefined,
        group: data.group || undefined,
        is_favorite: data.is_favorite,
        year_of_birth: data.year_of_birth || undefined,
        gender: data.gender || undefined,
        active_treatment_plan: data.active_treatment_plan || undefined,
      };

      if (isEditing && id) {
        await patientsApi.updatePatient(id, patientData);
        navigate(`/patients/${id}`);
      } else {
        const newPatient = await patientsApi.createPatient(patientData);
        navigate(`/patients/${newPatient.id}`);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to save patient'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full lg:max-w-5xl xl:max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link
          to={isEditing ? `/patients/${id}` : '/patients'}
          className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {isEditing ? 'Edit Patient' : 'Add New Patient'}
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            {isEditing ? 'Update patient details and medical info' : 'Create a new patient record'}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Personal Information Section */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-2">
            <User className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
          </div>

          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input
                  label="Full Name *"
                  placeholder="e.g. John Doe"
                  error={errors.name?.message}
                  {...register('name')}
                />
              </div>

              <Input
                label="Date of Birth (Year)"
                type="number"
                placeholder="YYYY"
                min={1900}
                max={currentYear}
                error={errors.year_of_birth?.message}
                {...register('year_of_birth', { valueAsNumber: true })}
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Gender
                </label>
                <div className="relative">
                  <select
                    className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm shadow-gray-100/50 focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all"
                    {...register('gender')}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Contact Information Section */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-2">
            <Phone className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-semibold text-gray-900">Contact Details</h2>
          </div>

          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+1 (555) 123-4567"
                error={errors.phone?.message}
                {...register('phone')}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="patient@example.com"
                error={errors.email?.message}
                {...register('email')}
              />

              <div className="md:col-span-2">
                <Input
                  label="Address"
                  placeholder="Street address, Apt, Suite"
                  error={errors.address?.message}
                  {...register('address')}
                />
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Location/City"
                  placeholder="City, State, Zip Code"
                  error={errors.location?.message}
                  {...register('location')}
                />
              </div>
            </div>
          </Card>
        </section>

        {/* Medical Information Section */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-2">
            <FileText className="h-5 w-5 text-violet-500" />
            <h2 className="text-lg font-semibold text-gray-900">Medical History</h2>
          </div>

          <Card>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Group/Category
                  {isLoadingGroups && (
                    <span className="ml-2 text-xs text-gray-400 font-normal">(loading groups...)</span>
                  )}
                </label>
                <input
                  type="text"
                  list="groups-list"
                  placeholder={isLoadingGroups ? "Loading..." : "Select or type a new group (e.g. Cardiology, Pediatrics)"}
                  className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm shadow-gray-100/50 focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all placeholder-gray-400"
                  {...register('group')}
                />
                <datalist id="groups-list">
                  {groups.map((group) => (
                    <option key={group} value={group} />
                  ))}
                </datalist>
              </div>

              <Textarea
                label="Initial Complaint"
                placeholder="Describe the patient's initial complaint, symptoms, or reason for visit..."
                rows={4}
                error={errors.initial_complaint?.message}
                {...register('initial_complaint')}
              />

              <Textarea
                label="Initial Diagnosis"
                placeholder="Initial diagnosis or clinical assessment..."
                rows={4}
                error={errors.initial_diagnosis?.message}
                {...register('initial_diagnosis')}
              />

              <Textarea
                label="Active Treatment Plan"
                placeholder="Current medications, therapies, or monitoring instructions..."
                rows={4}
                error={errors.active_treatment_plan?.message}
                {...register('active_treatment_plan')}
              />

              <div className="pt-4 border-t border-gray-100">
                <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-200 w-fit">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-primary-500 checked:bg-primary-500"
                      {...register('is_favorite')}
                    />
                    <CheckCircle2 className="pointer-events-none absolute h-3.5 w-3.5 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 select-none">Mark as favorite patient</span>
                </label>
              </div>
            </div>
          </Card>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 pb-12">
          <Link to={isEditing ? `/patients/${id}` : '/patients'}>
            <Button type="button" variant="ghost" size="lg">
              Cancel
            </Button>
          </Link>
          <Button type="submit" size="lg" loading={isSubmitting} className="w-full sm:w-auto sm:min-w-[160px] shadow-lg shadow-primary-500/20">
            {isEditing ? 'Save Changes' : 'Create Patient'}
          </Button>
        </div>
      </form>
    </div>
  );
}
