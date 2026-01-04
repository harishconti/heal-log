import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { Card, Button, Input, Textarea, Spinner } from '../../components/ui';
import { patientsApi, type CreatePatientData } from '../../api/patients';
import { getErrorMessage } from '../../utils/errorUtils';

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
        console.error('Failed to load groups:', err);
        // Groups are optional, so we just log the error
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
          });
        })
        .catch((err) => {
          console.error('Failed to load patient:', err);
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
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to={isEditing ? `/patients/${id}` : '/patients'}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Patient' : 'Add New Patient'}
        </h1>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Patient Name *"
                placeholder="Full name"
                error={errors.name?.message}
                {...register('name')}
              />
            </div>

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

            <Input
              label="Address"
              placeholder="Street address"
              error={errors.address?.message}
              {...register('address')}
            />

            <Input
              label="Location/City"
              placeholder="City, State"
              error={errors.location?.message}
              {...register('location')}
            />

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group/Category
                {isLoadingGroups && (
                  <span className="ml-2 text-xs text-gray-400">(loading groups...)</span>
                )}
              </label>
              <input
                type="text"
                list="groups-list"
                placeholder={isLoadingGroups ? "Loading groups..." : "Select or type a new group"}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                {...register('group')}
              />
              <datalist id="groups-list">
                {groups.map((group) => (
                  <option key={group} value={group} />
                ))}
              </datalist>
            </div>

            <div className="sm:col-span-2">
              <Textarea
                label="Initial Complaint"
                placeholder="Describe the patient's initial complaint or symptoms..."
                rows={3}
                error={errors.initial_complaint?.message}
                {...register('initial_complaint')}
              />
            </div>

            <div className="sm:col-span-2">
              <Textarea
                label="Initial Diagnosis"
                placeholder="Initial diagnosis or assessment..."
                rows={3}
                error={errors.initial_diagnosis?.message}
                {...register('initial_diagnosis')}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  {...register('is_favorite')}
                />
                <span className="text-sm text-gray-700">Mark as favorite</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Link to={isEditing ? `/patients/${id}` : '/patients'}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" isLoading={isSubmitting}>
              {isEditing ? 'Save Changes' : 'Add Patient'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
