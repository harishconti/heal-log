import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Star, FolderOpen, FileText, TrendingUp, ArrowRight, Plus, User, Sparkles, AlertCircle } from 'lucide-react';
import { Card, CardHeader, Spinner, Button } from '../../components/ui';
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
  bgColor: string;
}

function StatCard({ title, value, icon: Icon, color, bgColor }: StatCardProps) {
  return (
    <Card hover>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${bgColor}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
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
  const [error, setError] = useState<string | null>(null);

  const isPro = user?.plan === 'pro';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null);
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
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [isPro]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-1">Failed to load dashboard</h2>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Doctor'}
          </h1>
          <p className="text-gray-500 mt-1">Here's an overview of your practice</p>
        </div>
        <Link to="/patients/new">
          <Button>
            <Plus className="h-4 w-4" />
            Add Patient
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Patients"
          value={stats?.total_patients || 0}
          icon={Users}
          color="text-primary-600"
          bgColor="bg-primary-50"
        />
        <StatCard
          title="Favorites"
          value={stats?.total_favorites || 0}
          icon={Star}
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
        <StatCard
          title="Groups"
          value={stats?.total_groups || 0}
          icon={FolderOpen}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <StatCard
          title="Notes Today"
          value="-"
          icon={FileText}
          color="text-violet-600"
          bgColor="bg-violet-50"
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
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
                >
                  View analytics <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />
            {growthData.length > 0 ? (
              <LineChart data={growthData} height={250} />
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </Card>
        ) : (
          <Card>
            <div className="flex flex-col items-center justify-center h-[320px] text-center px-6">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-5">
                <TrendingUp className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unlock Analytics</h3>
              <p className="text-gray-500 mb-6 max-w-xs">
                Upgrade to Pro to access detailed analytics and insights about your practice.
              </p>
              <Link to="/upgrade">
                <Button>
                  <Sparkles className="h-4 w-4" />
                  Upgrade to Pro
                </Button>
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
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          {recentPatients.length > 0 ? (
            <div className="space-y-2">
              {recentPatients.map((patient) => (
                <Link
                  key={patient.id}
                  to={`/patients/${patient.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors -mx-1"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-50 rounded-full flex items-center justify-center">
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
                  {patient.is_favorite && <Star className="h-4 w-4 text-amber-500 fill-current" />}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-7 w-7 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-3">No patients yet</p>
              <Link
                to="/patients/new"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
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
            className="flex flex-col items-center gap-3 p-5 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200"
          >
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
              <Plus className="h-5 w-5 text-primary-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Add Patient</span>
          </Link>
          <Link
            to="/patients"
            className="flex flex-col items-center gap-3 p-5 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">View Patients</span>
          </Link>
          {isPro && (
            <Link
              to="/analytics"
              className="flex flex-col items-center gap-3 p-5 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200"
            >
              <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-violet-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Analytics</span>
            </Link>
          )}
          <Link
            to="/profile"
            className="flex flex-col items-center gap-3 p-5 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200"
          >
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
              <User className="h-5 w-5 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Profile</span>
          </Link>
        </div>
      </Card>
    </div>
  );
}
