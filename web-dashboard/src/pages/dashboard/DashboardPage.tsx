import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Star, FolderOpen, FileText, TrendingUp, ArrowRight } from 'lucide-react';
import { Card, CardHeader, Spinner } from '../../components/ui';
import { LineChart } from '../../components/charts';
import { patientsApi } from '../../api/patients';
import { analyticsApi } from '../../api/analytics';
import { useAuthStore } from '../../store';
import type { PatientStats, Patient } from '../../types';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [growthData, setGrowthData] = useState<{ date: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isPro = user?.plan === 'pro';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsData, patientsData] = await Promise.all([
          patientsApi.getStats(),
          patientsApi.getPatients({ page_size: 5, sort_by: 'created_at', sort_order: 'desc' }),
        ]);
        setStats(statsData);
        setRecentPatients(patientsData.items);

        if (isPro) {
          const growth = await analyticsApi.getPatientGrowth(30);
          setGrowthData(growth);
        }
      } catch {
        // Handle error silently
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [isPro]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.full_name?.split(' ')[0] || 'Doctor'}
        </h1>
        <p className="text-gray-600 mt-1">Here's an overview of your practice</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Patients"
          value={stats?.total_patients || 0}
          icon={Users}
          color="bg-primary-600"
        />
        <StatCard
          title="Favorites"
          value={stats?.total_favorites || 0}
          icon={Star}
          color="bg-yellow-500"
        />
        <StatCard
          title="Groups"
          value={stats?.total_groups || 0}
          icon={FolderOpen}
          color="bg-green-500"
        />
        <StatCard
          title="Notes Today"
          value="-"
          icon={FileText}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Growth Chart (Pro only) */}
        {isPro ? (
          <Card>
            <CardHeader
              title="Patient Growth"
              subtitle="Last 30 days"
              action={
                <Link
                  to="/analytics"
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  View analytics <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />
            {growthData.length > 0 ? (
              <LineChart data={growthData} height={250} />
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </Card>
        ) : (
          <Card>
            <div className="flex flex-col items-center justify-center h-[300px] text-center">
              <TrendingUp className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unlock Analytics</h3>
              <p className="text-gray-600 mb-4 max-w-sm">
                Upgrade to Pro to access detailed analytics and insights about your practice.
              </p>
              <Link
                to="/upgrade"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Upgrade to Pro
              </Link>
            </div>
          </Card>
        )}

        {/* Recent Patients */}
        <Card>
          <CardHeader
            title="Recent Patients"
            action={
              <Link
                to="/patients"
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          {recentPatients.length > 0 ? (
            <div className="space-y-3">
              {recentPatients.map((patient) => (
                <Link
                  key={patient.id}
                  to={`/patients/${patient.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 font-medium">
                      {patient.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{patient.name}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {patient.group || 'No group'} • {patient.patient_id}
                    </p>
                  </div>
                  {patient.is_favorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No patients yet</p>
              <Link
                to="/patients/new"
                className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block"
              >
                Add your first patient
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader title="Quick Actions" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            to="/patients/new"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <Users className="h-6 w-6 text-primary-600" />
            <span className="text-sm font-medium text-gray-700">Add Patient</span>
          </Link>
          <Link
            to="/patients"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <FileText className="h-6 w-6 text-primary-600" />
            <span className="text-sm font-medium text-gray-700">View Patients</span>
          </Link>
          {isPro && (
            <Link
              to="/analytics"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <TrendingUp className="h-6 w-6 text-primary-600" />
              <span className="text-sm font-medium text-gray-700">Analytics</span>
            </Link>
          )}
          <Link
            to="/profile"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <Users className="h-6 w-6 text-primary-600" />
            <span className="text-sm font-medium text-gray-700">Profile</span>
          </Link>
        </div>
      </Card>
    </div>
  );
}
