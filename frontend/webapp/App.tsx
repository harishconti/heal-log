import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import LoginScreen from './components/LoginScreen';
import ForgotPasswordScreen from './components/ForgotPasswordScreen';
import CreateAccountScreen from './components/CreateAccountScreen';
import ResetPasswordScreen from './components/ResetPasswordScreen';
import VerifyEmailScreen from './components/VerifyEmailScreen';
import DashboardLayout from './components/DashboardLayout';
import PatientCard from './components/PatientCard';
import PatientsPage from './components/PatientsPage';
import RegisterPatientPage from './components/RegisterPatientPage';
import AnalyticsPage from './components/AnalyticsPage';
import ProfilePage from './components/ProfilePage';
import SettingsPage from './components/SettingsPage';
import { ViewState, Patient } from './types';
import { MOCK_PATIENTS } from './constants';
import { useAuthStore } from './store/authStore';
import { authApi } from './api/auth';
import { tokenManager } from './api/client';
import {
    Users,
    UserPlus,
    AlertTriangle,
    Clock,
    TrendingUp,
    MoreHorizontal,
    Search,
    Calendar,
    FileText,
    Pen,
    CheckCircle2,
    Bell
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// --- Dashboard Sub-Components ---

const StatCard = ({ label, value, trend, icon: Icon, colorClass, iconBgClass }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col justify-between h-40">
        <div className="flex justify-between items-start">
            <div className={`p-3.5 rounded-xl ${iconBgClass}`}>
                <Icon size={24} className={colorClass} />
            </div>
            <span className={`flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${trend.toString().includes('-') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {trend > 0 ? '+' : ''}{trend}%
            </span>
        </div>
        <div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">{label}</h3>
            <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
        </div>
    </div>
);

const ActivityItem = ({ icon: Icon, title, desc, time, colorClass, bgClass }: any) => (
    <div className="flex gap-4 relative">
        <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${bgClass}`}>
            <Icon size={18} className={colorClass} />
        </div>
        <div className="pb-8 border-l-2 border-gray-100 pl-6 ml-[-29px] pt-1">
            <h4 className="text-sm font-bold text-gray-900">{title}</h4>
            <p className="text-xs text-gray-500 mt-1 mb-2">{desc}</p>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{time}</span>
        </div>
    </div>
);

const AppointmentItem = ({ initials, name, type, time, status, color }: any) => (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors group cursor-pointer">
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${color}`}>
                {initials}
            </div>
            <div>
                <h4 className="text-sm font-bold text-gray-900">{name}</h4>
                <p className="text-xs text-gray-500">{type}</p>
            </div>
        </div>
        <div className="text-right">
            <p className="text-sm font-bold text-gray-900">{time}</p>
            <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                status === 'CONFIRMED' ? 'bg-blue-50 text-blue-600' :
                status === 'URGENT' ? 'bg-orange-50 text-orange-600' : 'bg-gray-100 text-gray-600'
            }`}>
                {status}
            </span>
        </div>
    </div>
);

const DashboardOverview = ({ userName }: { userName: string }) => {
    const chartData = [
        { name: 'MON', value: 92 },
        { name: 'TUE', value: 93 },
        { name: 'WED', value: 95 },
        { name: 'THU', value: 96 },
        { name: 'FRI', value: 98 },
        { name: 'SAT', value: 97 },
        { name: 'SUN', value: 98.2 },
    ];

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Main Dashboard Overview</h2>
                <p className="text-gray-500 mt-2">Welcome back, {userName}. You have 8 appointments scheduled for today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Patients"
                    value="1,284"
                    trend={12}
                    icon={Users}
                    colorClass="text-brand-600"
                    iconBgClass="bg-brand-50"
                />
                <StatCard
                    label="New This Week"
                    value="42"
                    trend={5.2}
                    icon={UserPlus}
                    colorClass="text-green-600"
                    iconBgClass="bg-green-50"
                />
                <StatCard
                    label="Urgent Alerts"
                    value="5"
                    trend={-2}
                    icon={AlertTriangle}
                    colorClass="text-orange-600"
                    iconBgClass="bg-orange-50"
                />
                <StatCard
                    label="Avg. Wait Time"
                    value="14m"
                    trend={0}
                    icon={Clock}
                    colorClass="text-purple-600"
                    iconBgClass="bg-purple-50"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Left Column (Charts & Appointments) */}
                <div className="xl:col-span-2 space-y-8">
                    {/* Vitals Chart */}
                    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Vitals Overview</h3>
                                <p className="text-sm text-gray-500">Average Patient Health Trends</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                     <span className="text-3xl font-bold text-gray-900">98.2%</span>
                                     <span className="text-sm font-bold text-green-600 ml-2">+1.2%</span>
                                </div>
                                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                                    <button className="px-3 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-md shadow-sm">Live</button>
                                    <button className="px-3 py-1.5 text-gray-500 text-xs font-bold hover:bg-white rounded-md transition-colors flex items-center gap-1">
                                        Last 7 Days <span className="opacity-50">v</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="h-[300px] w-full min-w-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}}
                                        dy={10}
                                    />
                                    <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                                    <Tooltip
                                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                                        itemStyle={{color: '#0f172a', fontWeight: 'bold'}}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#0ea5e9"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Upcoming Appointments */}
                    <div className="bg-white rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">Upcoming Appointments</h3>
                            <button className="text-sm font-bold text-brand-600 hover:text-brand-700">View All</button>
                        </div>
                        <div className="divide-y divide-gray-50">
                            <AppointmentItem
                                initials="JD"
                                name="Jane Doe"
                                type="Routine Checkup - Video Call"
                                time="09:30 AM"
                                status="CONFIRMED"
                                color="bg-blue-50 text-blue-600"
                            />
                            <AppointmentItem
                                initials="MS"
                                name="Marcus Sterling"
                                type="Emergency Consultation - Room 402"
                                time="10:45 AM"
                                status="URGENT"
                                color="bg-orange-50 text-orange-600"
                            />
                            <AppointmentItem
                                initials="EW"
                                name="Emily Watson"
                                type="Follow-up - Physical"
                                time="01:15 PM"
                                status="SCHEDULED"
                                color="bg-green-50 text-green-600"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column (Quick Actions & Activity) */}
                <div className="space-y-8">
                    {/* Quick Actions */}
                    <div className="bg-white p-6 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h3>
                        <div className="space-y-3">
                            <button className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-brand-500/20">
                                <UserPlus size={18} />
                                Add New Patient
                            </button>
                            <button className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl font-bold text-sm transition-colors">
                                <Calendar size={18} />
                                Schedule Appointment
                            </button>
                            <button className="w-full flex items-center justify-center gap-2 py-3.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-sm transition-colors">
                                <FileText size={18} />
                                Generate Report
                            </button>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white p-6 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 h-full max-h-[500px]">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Activity</h3>
                        <div className="pl-2">
                             <ActivityItem
                                icon={Pen}
                                title="Patient Record Updated"
                                desc="Jane Doe's blood pressure updated by Nurse Sarah."
                                time="2 MINS AGO"
                                bgClass="bg-blue-50"
                                colorClass="text-brand-600"
                             />
                             <ActivityItem
                                icon={CheckCircle2}
                                title="Lab Results Arrived"
                                desc="MRI results for Marcus Sterling are now available."
                                time="45 MINS AGO"
                                bgClass="bg-green-50"
                                colorClass="text-green-600"
                             />
                             <ActivityItem
                                icon={Bell}
                                title="Meeting Reminder"
                                desc="Staff daily briefing starting in 15 minutes."
                                time="1 HOUR AGO"
                                bgClass="bg-orange-50"
                                colorClass="text-orange-600"
                             />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Main App Component ---

type AuthView = 'LOGIN' | 'FORGOT_PASSWORD' | 'REGISTER' | 'RESET_PASSWORD' | 'VERIFY_EMAIL';

const App: React.FC = () => {
  const { user, isAuthenticated, logout, setIsLoading, isLoading, pendingVerificationEmail, setPendingVerificationEmail } = useAuthStore();

  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Auth state management
  const [authView, setAuthView] = useState<AuthView>('LOGIN');

  // Listen for forced logout events from API client
  useEffect(() => {
    const handleForcedLogout = () => {
      logout();
      setAuthView('LOGIN');
    };

    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, [logout]);

  // Check for existing valid token on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (tokenManager.hasValidToken()) {
        try {
          const currentUser = await authApi.getCurrentUser();
          useAuthStore.getState().setUser(currentUser);
        } catch {
          // Token is invalid, clear it
          tokenManager.clearTokens();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [setIsLoading]);

  const handleLoginSuccess = () => {
    setAuthView('LOGIN'); // Reset for next logout
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout API errors, still clear local state
    }
    logout();
    setCurrentView(ViewState.DASHBOARD);
    setAuthView('LOGIN');
  };

  const handleNeedVerification = (email: string) => {
    setPendingVerificationEmail(email);
    setAuthView('VERIFY_EMAIL');
  };

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    switch (authView) {
      case 'REGISTER':
        return (
          <CreateAccountScreen
            onNavigateToLogin={() => setAuthView('LOGIN')}
            onCreateAccount={() => setAuthView('VERIFY_EMAIL')}
          />
        );
      case 'VERIFY_EMAIL':
        return (
            <VerifyEmailScreen
                email={pendingVerificationEmail || ''}
                onVerify={handleLoginSuccess}
                onBack={() => setAuthView('REGISTER')}
            />
        );
      case 'FORGOT_PASSWORD':
        return (
          <ForgotPasswordScreen
            onBackToLogin={() => setAuthView('LOGIN')}
            onNavigateToReset={() => setAuthView('RESET_PASSWORD')}
          />
        );
      case 'RESET_PASSWORD':
        return (
          <ResetPasswordScreen
            onBackToLogin={() => setAuthView('LOGIN')}
            onSubmit={() => setAuthView('LOGIN')}
          />
        );
      case 'LOGIN':
      default:
        return (
          <LoginScreen
            onLogin={handleLoginSuccess}
            onForgotPassword={() => setAuthView('FORGOT_PASSWORD')}
            onCreateAccount={() => setAuthView('REGISTER')}
            onNeedVerification={handleNeedVerification}
          />
        );
    }
  }

  const displayName = user?.full_name || 'Doctor';

  return (
    <DashboardLayout
      currentView={currentView}
      onChangeView={(view) => {
        setCurrentView(view);
        setSelectedPatient(null);
      }}
      onLogout={handleLogout}
      user={user}
    >
      {/* Dynamic Content */}
      {selectedPatient ? (
          <div className="h-full">
             <button
                onClick={() => setSelectedPatient(null)}
                className="mb-4 text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 font-medium"
             >
                Back to List
             </button>
             <PatientCard
                patient={selectedPatient}
                onClose={() => setSelectedPatient(null)}
             />
          </div>
      ) : (
        <>
            {currentView === ViewState.DASHBOARD && <DashboardOverview userName={displayName} />}

            {currentView === ViewState.PATIENTS && (
                <PatientsPage
                  onSelectPatient={setSelectedPatient}
                  onAddNewPatient={() => setCurrentView(ViewState.REGISTER_PATIENT)}
                />
            )}

            {currentView === ViewState.REGISTER_PATIENT && (
                <RegisterPatientPage
                  onBack={() => setCurrentView(ViewState.PATIENTS)}
                  onSubmit={(data) => {
                    console.log('Registered new patient:', data);
                    setCurrentView(ViewState.PATIENTS);
                  }}
                />
            )}

            {currentView === ViewState.ANALYTICS && <AnalyticsPage />}

            {currentView === ViewState.PROFILE && <ProfilePage />}

            {currentView === ViewState.SETTINGS && <SettingsPage />}

            {currentView === ViewState.AI_SCRIBE && (
               <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                  <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                      <Users size={40} className="text-brand-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Patient Intelligence Center</h2>
                  <p className="text-gray-500 max-w-md">
                      Select a patient from the 'Patients' tab to generate AI-powered clinical summaries and risk assessments.
                  </p>
                  <button
                    onClick={() => setCurrentView(ViewState.PATIENTS)}
                    className="mt-8 px-6 py-3 bg-brand-600 text-white rounded-xl font-medium shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all"
                  >
                      Go to Patients
                  </button>
               </div>
            )}
        </>
      )}
    </DashboardLayout>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(
    <App />
);

export default App;
