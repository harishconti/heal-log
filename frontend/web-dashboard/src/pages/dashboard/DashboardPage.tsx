import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Star,
  FolderOpen,
  FileText,
  TrendingUp,
  ArrowRight,
  Plus,
  User,
  Sparkles,
  AlertCircle,
  Calendar,
  Activity,
  Clock,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import {
  Button,
  KPICard,
  DataCard,
  DataRow,
  ChartCard,
  ActionCard,
  ActionItem,
  PromoCard,
  EmptyState,
} from '../../components/ui';
import { LineChart } from '../../components/charts';
import { patientsApi } from '../../api/patients';
import { analyticsApi } from '../../api/analytics';
import { useAuthStore } from '../../store';
import { logger } from '../../utils';
import type { PatientStats, Patient } from '../../types';

// ============================================================================
// LOADING STATE - Skeleton matching new card variants
// ============================================================================

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Tier 1: Header Skeleton */}
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-9 w-80 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-5 w-64 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-12 w-40 bg-gray-200 rounded-xl animate-pulse" />
        </div>

        {/* KPI Cards Skeleton - 3 column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="relative bg-gray-100/50 rounded-2xl border border-gray-100 p-8 min-h-[140px] animate-pulse"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-2xl" />
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="h-12 w-20 bg-gray-200 rounded" />
                  <div className="h-5 w-32 bg-gray-200/60 rounded-full" />
                </div>
                <div className="w-14 h-14 bg-gray-200 rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier 2: Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Chart Skeleton */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-100 bg-gray-50/50">
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="h-8 w-28 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="p-8">
            <div className="h-[300px] bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Right: Sidebar Skeleton */}
        <div className="space-y-6">
          <div className="bg-primary-50/30 rounded-2xl border-l-4 border-l-primary-300 border border-gray-100 p-6">
            <div className="h-5 w-28 bg-gray-200 rounded mb-4 animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-11 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ERROR STATE
// ============================================================================

function DashboardError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-8">
      <div className="w-24 h-24 bg-gradient-to-br from-red-50 to-red-100 rounded-3xl flex items-center justify-center shadow-lg shadow-red-100">
        <AlertCircle className="h-12 w-12 text-red-500" />
      </div>
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Failed to load dashboard</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">{error}</p>
        <Button onClick={onRetry} variant="outline" size="lg" className="shadow-sm">
          Try Again
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN DASHBOARD PAGE
// ============================================================================

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [growthData, setGrowthData] = useState<{ date: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPro = user?.plan === 'pro';

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [statsData, patientsData] = await Promise.all([
        patientsApi.getStats(),
        patientsApi.getPatients({ page_size: 5, sort_by: 'created_at', sort_order: 'desc' }),
      ]);

      setStats(statsData);
      setRecentPatients(patientsData.items);

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

  useEffect(() => {
    fetchDashboardData();
  }, [user?.plan]);

  // Loading state
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Error state
  if (error) {
    return <DashboardError error={error} onRetry={fetchDashboardData} />;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.full_name?.split(' ')[0] || 'Doctor';

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              {getGreeting()}, {firstName}
            </h1>
            <p className="text-gray-500 flex items-center gap-2 mt-2 font-medium">
              <Calendar className="h-4 w-4 text-gray-400" />
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <Link to="/patients/new">
            <Button size="lg" className="shadow-lg shadow-primary-500/20" rounded="full">
              <Plus className="h-5 w-5" />
              Add Patient
            </Button>
          </Link>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <KPICard
            title="Total Patients"
            value={stats?.total_patients || 0}
            icon={Users}
            colorScheme="primary"
            trend={
              stats?.total_patients && stats.total_patients > 0
                ? { value: 12, direction: 'up', label: 'vs last month' }
                : undefined
            }
          />
          <KPICard
            title="Favorites"
            value={stats?.total_favorites || 0}
            icon={Star}
            colorScheme="amber"
            subtitle="Priority patients"
          />
          <KPICard
            title="Patient Groups"
            value={stats?.total_groups || 0}
            icon={FolderOpen}
            colorScheme="success"
            subtitle="Active categories"
          />
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column (Chart/Promo) */}
        <div className="lg:col-span-2">
          {isPro ? (
            <ChartCard
              title="Patient Growth"
              subtitle="New patients over the last 30 days"
              minHeight={320}
              className="h-full"
              action={
                <Link
                  to="/analytics"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  View analytics
                  <ArrowRight className="h-4 w-4" />
                </Link>
              }
            >
              {growthData.length > 0 ? (
                <LineChart
                  data={growthData}
                  height={300}
                  title="Patient Growth Chart"
                />
              ) : (
                <div className="h-[250px] sm:h-[300px] lg:h-[320px] flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <Activity className="h-10 w-10 mb-3 text-gray-300" />
                  <p className="font-medium">No growth data available yet</p>
                  <p className="text-sm mt-1">Add patients to see trends</p>
                </div>
              )}
            </ChartCard>
          ) : (
            <PromoCard
              icon={TrendingUp}
              title="Unlock Analytics"
              description="Upgrade to Pro to access detailed analytics and insights about your practice growth."
              action={
                <Link to="/upgrade">
                  <Button className="bg-white text-primary-700 hover:bg-primary-50 shadow-none border border-transparent hover:border-white/20">
                    <Sparkles className="h-4 w-4" />
                    Upgrade to Pro
                  </Button>
                </Link>
              }
              className="h-full min-h-[300px] sm:min-h-[350px] lg:min-h-[380px] flex flex-col justify-center"
            />
          )}
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          <ActionCard title="Quick Actions">
            <ActionItem
              icon={Plus}
              label="Add New Patient"
              iconColor="text-primary-600"
              onClick={() => navigate('/patients/new')}
            />
            <ActionItem
              icon={Users}
              label="View All Patients"
              iconColor="text-emerald-600"
              onClick={() => navigate('/patients')}
            />
            {isPro && (
              <ActionItem
                icon={BarChart3}
                label="View Analytics"
                iconColor="text-violet-600"
                onClick={() => navigate('/analytics')}
              />
            )}
            <ActionItem
              icon={User}
              label="Edit Profile"
              iconColor="text-amber-600"
              onClick={() => navigate('/profile')}
            />
          </ActionCard>

          {/* Summary Card */}
          <ActionCard title="Today's Overview" className="bg-gradient-to-br from-white to-gray-50/50">
            <div className="space-y-3 px-1">
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Notes</span>
                </div>
                <span className="text-lg font-bold text-gray-900">-</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Pending</span>
                </div>
                <span className="text-lg font-bold text-gray-900">-</span>
              </div>
            </div>
          </ActionCard>
        </div>
      </section>

      {/* Recent Patients Table */}
      <section>
        <DataCard
          title="Recent Patients"
          subtitle={recentPatients.length > 0 ? `${recentPatients.length} most recent records` : undefined}
          action={
            recentPatients.length > 0 && (
              <Link
                to="/patients"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            )
          }
        >
          {recentPatients.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {recentPatients.map((patient) => (
                <Link
                  key={patient.id}
                  to={`/patients/${patient.id}`}
                  className="block group"
                >
                  <DataRow className="group-hover:bg-gray-50/80 transition-all duration-200">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <span className="text-primary-700 font-bold text-sm">
                        {patient.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Patient Info */}
                    <div className="flex-1 min-w-0 ml-4">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                          {patient.name}
                        </p>
                        {patient.is_favorite && (
                          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate mt-0.5">
                        {patient.group ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 mr-2">
                            {patient.group}
                          </span>
                        ) : null}
                        ID: {patient.patient_id}
                      </p>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                  </DataRow>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12">
              <EmptyState
                icon={Users}
                title="No patients yet"
                description="Get started by adding your first patient to the system."
                action={{
                  label: 'Add Patient',
                  onClick: () => navigate('/patients/new'),
                  icon: Plus,
                }}
                size="sm"
              />
            </div>
          )}
        </DataCard>
      </section>
    </div>
  );
}
