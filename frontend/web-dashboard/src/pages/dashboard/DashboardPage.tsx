import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Star, FolderOpen, FileText, TrendingUp, ArrowRight, Plus, User, Sparkles, AlertCircle, Calendar, Activity } from 'lucide-react';
import { CardHeader, Button, SkeletonStats, SkeletonChart, SkeletonCard, EmptyState } from '../../components/ui';
import { LineChart } from '../../components/charts';
import { patientsApi } from '../../api/patients';
import { analyticsApi } from '../../api/analytics';
import { useAuthStore } from '../../store';
import { logger } from '../../utils';
import type { PatientStats, Patient } from '../../types';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  gradientFrom: string;
  gradientTo: string;
}

function StatCard({ title, value, icon: Icon, color, bgColor, gradientFrom, gradientTo }: StatCardProps) {
  return (
    <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:shadow-gray-200/50 hover:border-gray-200 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${bgColor} bg-gradient-to-br ${gradientFrom} ${gradientTo} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
      {/* Decorative gradient line at bottom */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl bg-gradient-to-r ${gradientFrom} ${gradientTo} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
    </div>
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

        // Check isPro inside the effect to avoid stale closure
        if (user?.plan === 'pro') {
          const growth = await analyticsApi.getPatientGrowth(30);
          setGrowthData(growth);
        }
      } catch (err) {
        logger.error('Dashboard data fetch error', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.plan]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-72 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-5 w-56 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-12 w-36 bg-gray-200 rounded-xl animate-pulse" />
        </div>
        {/* Stats Skeleton */}
        <SkeletonStats />
        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-6">
        <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center shadow-lg shadow-red-100">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to load dashboard</h2>
          <p className="text-gray-500 mb-6 max-w-md">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="shadow-sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {getGreeting()}, {user?.full_name?.split(' ')[0] || 'Doctor'}
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link to="/patients/new">
          <Button className="h-12 px-6 shadow-lg shadow-primary-500/25">
            <Plus className="h-5 w-5" />
            Add Patient
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Patients"
          value={stats?.total_patients || 0}
          icon={Users}
          color="text-primary-600"
          bgColor="bg-primary-50"
          gradientFrom="from-primary-50"
          gradientTo="to-primary-100"
        />
        <StatCard
          title="Favorites"
          value={stats?.total_favorites || 0}
          icon={Star}
          color="text-amber-600"
          bgColor="bg-amber-50"
          gradientFrom="from-amber-50"
          gradientTo="to-amber-100"
        />
        <StatCard
          title="Groups"
          value={stats?.total_groups || 0}
          icon={FolderOpen}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
          gradientFrom="from-emerald-50"
          gradientTo="to-emerald-100"
        />
        <StatCard
          title="Notes Today"
          value="-"
          icon={FileText}
          color="text-violet-600"
          bgColor="bg-violet-50"
          gradientFrom="from-violet-50"
          gradientTo="to-violet-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Growth Chart (Pro only) */}
        {isPro ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <CardHeader
              title="Patient Growth"
              subtitle="Last 30 days"
              action={
                <Link
                  to="/analytics"
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1.5 transition-colors"
                >
                  View analytics <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />
            <div className="p-6 pt-0">
              {growthData.length > 0 ? (
                <LineChart data={growthData} height={280} />
              ) : (
                <div className="h-[280px] flex flex-col items-center justify-center text-gray-400">
                  <Activity className="h-12 w-12 mb-3 text-gray-300" />
                  <p>No data available yet</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-white to-primary-50/30 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex flex-col items-center justify-center h-[380px] text-center px-8">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary-200/50">
                <TrendingUp className="h-10 w-10 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Unlock Analytics</h3>
              <p className="text-gray-500 mb-8 max-w-xs leading-relaxed">
                Upgrade to Pro to access detailed analytics and insights about your practice growth.
              </p>
              <Link to="/upgrade">
                <Button className="h-12 px-8 shadow-lg shadow-primary-500/25">
                  <Sparkles className="h-5 w-5" />
                  Upgrade to Pro
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Recent Patients */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <CardHeader
            title="Recent Patients"
            action={
              <Link
                to="/patients"
                className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1.5 transition-colors"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <div className="px-6 pb-6">
            {recentPatients.length > 0 ? (
              <div className="space-y-2">
                {recentPatients.map((patient, index) => (
                  <Link
                    key={patient.id}
                    to={`/patients/${patient.id}`}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
                      <span className="text-white font-semibold text-lg">
                        {patient.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                        {patient.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {patient.group || 'No group'} • {patient.patient_id}
                      </p>
                    </div>
                    {patient.is_favorite && (
                      <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title="No patients yet"
                description="Get started by adding your first patient to the system."
                action={{
                  label: 'Add Patient',
                  onClick: () => window.location.href = '/patients/new',
                  icon: Plus,
                }}
                size="sm"
              />
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <CardHeader title="Quick Actions" />
        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link
              to="/patients/new"
              className="group flex flex-col items-center gap-4 p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-100 hover:border-primary-200 hover:from-primary-50 hover:to-primary-100/50 transition-all duration-300"
            >
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
                <Plus className="h-6 w-6 text-primary-600" />
              </div>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-primary-700 transition-colors">Add Patient</span>
            </Link>
            <Link
              to="/patients"
              className="group flex flex-col items-center gap-4 p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-100 hover:border-emerald-200 hover:from-emerald-50 hover:to-emerald-100/50 transition-all duration-300"
            >
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
                <FileText className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-emerald-700 transition-colors">View Patients</span>
            </Link>
            {isPro && (
              <Link
                to="/analytics"
                className="group flex flex-col items-center gap-4 p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-100 hover:border-violet-200 hover:from-violet-50 hover:to-violet-100/50 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
                  <TrendingUp className="h-6 w-6 text-violet-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-violet-700 transition-colors">Analytics</span>
              </Link>
            )}
            <Link
              to="/profile"
              className="group flex flex-col items-center gap-4 p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-100 hover:border-amber-200 hover:from-amber-50 hover:to-amber-100/50 transition-all duration-300"
            >
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
                <User className="h-6 w-6 text-amber-600" />
              </div>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-amber-700 transition-colors">Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
