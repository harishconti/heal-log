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
  Heart,
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
    <div className="space-y-10">
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
        <div className="kpi-grid">
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
      <div className="content-split">
        {/* Left: Chart Skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
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

      {/* Tier 3: Recent Patients Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50/80 border-b border-gray-100 px-8 py-5">
          <div className="flex justify-between">
            <div className="h-6 w-36 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="px-8 py-6 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl">
              <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-56 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
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
      {/* ================================================================
          TIER 1 - HEADER SECTION (Top ~20% of viewport)
          - Welcome greeting
          - Quick Stats: 3 large KPI cards
          - Spacing: 32px top, 40px between cards
          ================================================================ */}
      <section className="dashboard-tier-1">
        {/* Header with greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-page-title">
              {getGreeting()}, {firstName}
            </h1>
            <p className="text-body flex items-center gap-2 mt-2">
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
            <Button size="lg" className="shadow-lg shadow-primary-500/25 px-6">
              <Plus className="h-5 w-5" />
              Add Patient
            </Button>
          </Link>
        </div>

        {/* Primary KPI Cards - 3 column grid */}
        <div className="kpi-grid">
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

      {/* ================================================================
          TIER 2 - MAIN CONTENT AREA (50-60% of viewport)
          - Left Column (65%): Large chart or primary content
          - Right Column (35%): Quick actions sidebar
          ================================================================ */}
      <section className="dashboard-tier-2">
        <div className="content-split">
          {/* Left: Patient Growth Chart OR Upgrade Promo */}
          <div>
            {isPro ? (
              <ChartCard
                title="Patient Growth"
                subtitle="Last 30 days"
                minHeight={320}
                action={
                  <Link
                    to="/analytics"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    View analytics
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                }
              >
                {growthData.length > 0 ? (
                  <LineChart
                    data={growthData}
                    height={280}
                    title="Patient Growth Chart"
                  />
                ) : (
                  <div className="h-[280px] flex flex-col items-center justify-center text-gray-400">
                    <Activity className="h-12 w-12 mb-3 text-gray-300" />
                    <p className="text-body">No growth data available yet</p>
                    <p className="text-label mt-1">Add patients to see trends</p>
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
                    <Button size="lg" className="shadow-lg shadow-primary-500/25 px-8">
                      <Sparkles className="h-5 w-5" />
                      Upgrade to Pro
                    </Button>
                  </Link>
                }
                className="h-full min-h-[380px]"
              />
            )}
          </div>

          {/* Right: Quick Actions Sidebar */}
          <div className="space-y-6">
            <ActionCard title="Quick Actions" accentColor="primary">
              <div className="space-y-2">
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
              </div>
            </ActionCard>

            {/* Secondary Info Card */}
            <ActionCard title="Today's Summary" accentColor="emerald">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-sm text-gray-600">Notes Today</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">-</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-4 w-4 text-amber-600" />
                    </div>
                    <span className="text-sm text-gray-600">Pending Follow-ups</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">-</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <Heart className="h-4 w-4 text-red-500" />
                    </div>
                    <span className="text-sm text-gray-600">Critical Patients</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">-</span>
                </div>
              </div>
            </ActionCard>
          </div>
        </div>
      </section>

      {/* ================================================================
          TIER 3 - SUPPORTING SECTION (Bottom 15-20%)
          - Recent Patients: Full-width table with proper row styling
          - 56-64px row height, alternating colors, hover states
          ================================================================ */}
      <section className="dashboard-tier-3">
        <DataCard
          title="Recent Patients"
          subtitle={recentPatients.length > 0 ? `${recentPatients.length} most recent` : undefined}
          action={
            recentPatients.length > 0 && (
              <Link
                to="/patients"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            )
          }
        >
          {recentPatients.length > 0 ? (
            <div className="stagger-animation -mx-2">
              {recentPatients.map((patient, index) => (
                <Link
                  key={patient.id}
                  to={`/patients/${patient.id}`}
                  className="block"
                >
                  <DataRow
                    className={`
                      group
                      ${index % 2 === 1 ? 'bg-gray-50/50' : ''}
                    `}
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all flex-shrink-0">
                      <span className="text-white font-semibold text-lg">
                        {patient.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Patient Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                        {patient.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate mt-0.5">
                        {patient.group || 'No group'} • ID: {patient.patient_id}
                      </p>
                    </div>

                    {/* Badges and Arrow */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {patient.is_favorite && (
                        <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                      )}
                      <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
                    </div>
                  </DataRow>
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
                onClick: () => navigate('/patients/new'),
                icon: Plus,
              }}
              size="sm"
            />
          )}
        </DataCard>
      </section>
    </div>
  );
}
