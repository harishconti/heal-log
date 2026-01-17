import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import LoginScreen from './components/LoginScreen';
import ForgotPasswordScreen from './components/ForgotPasswordScreen';
import CreateAccountScreen from './components/CreateAccountScreen';
import DashboardLayout from './components/DashboardLayout';
import PatientCard from './components/PatientCard';
import { AuthState, ViewState, Patient } from './types';
import { MOCK_PATIENTS } from './constants';
import { 
    Users, 
    TrendingUp, 
    Activity, 
    MoreHorizontal,
    ArrowUpRight,
    Search
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// --- Dashboard Sub-Components ---

const StatCard = ({ label, value, trend, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={22} className="opacity-80" />
            </div>
            <span className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {trend > 0 ? '+' : ''}{trend}%
                <ArrowUpRight size={14} className="ml-1" />
            </span>
        </div>
        <h3 className="text-gray-500 text-sm font-medium mb-1">{label}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
);

const OverviewContent = () => {
    const data = [
        { name: 'Mon', patients: 12 },
        { name: 'Tue', patients: 19 },
        { name: 'Wed', patients: 15 },
        { name: 'Thu', patients: 22 },
        { name: 'Fri', patients: 18 },
        { name: 'Sat', patients: 8 },
        { name: 'Sun', patients: 5 },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    label="Patients Seen" 
                    value="124" 
                    trend={12.5} 
                    icon={Users} 
                    color="bg-blue-100 text-blue-600" 
                />
                <StatCard 
                    label="Recovery Rate" 
                    value="92%" 
                    trend={4.2} 
                    icon={TrendingUp} 
                    color="bg-emerald-100 text-emerald-600" 
                />
                <StatCard 
                    label="Critical Alerts" 
                    value="3" 
                    trend={-2.1} 
                    icon={Activity} 
                    color="bg-rose-100 text-rose-600" 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Weekly Visits</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                                <Tooltip 
                                    cursor={{fill: '#f3f4f6'}}
                                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                />
                                <Bar dataKey="patients" radius={[6, 6, 0, 0]}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 3 ? '#0ea5e9' : '#e0f2fe'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Upcoming Schedule</h3>
                    <div className="space-y-4 flex-1">
                         {[
                            { time: '09:00 AM', name: 'Eleanor Rigby', type: 'Check-up' },
                            { time: '10:30 AM', name: 'Jude Harrison', type: 'Consultation' },
                            { time: '02:00 PM', name: 'Desmond Jones', type: 'Follow-up' },
                         ].map((item, i) => (
                             <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                                 <div className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-3 rounded-lg w-16 text-center">
                                     {item.time.split(' ')[0]}
                                     <span className="block text-[10px] font-normal text-gray-400">{item.time.split(' ')[1]}</span>
                                 </div>
                                 <div>
                                     <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                                     <p className="text-xs text-gray-500">{item.type}</p>
                                 </div>
                             </div>
                         ))}
                    </div>
                    <button className="mt-4 w-full py-2 text-sm text-brand-600 font-medium hover:bg-brand-50 rounded-lg transition-colors">
                        View Full Schedule
                    </button>
                </div>
            </div>
        </div>
    );
}

const PatientsTable = ({ onSelectPatient }: { onSelectPatient: (p: Patient) => void }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Recent Patients</h3>
                <div className="flex gap-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-lg">
                        <Search size={18} />
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 font-medium">Name</th>
                            <th className="px-6 py-4 font-medium">Age/Gender</th>
                            <th className="px-6 py-4 font-medium">Condition</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium">Last Visit</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {MOCK_PATIENTS.map((patient) => (
                            <tr 
                                key={patient.id} 
                                className="bg-white border-b border-gray-50 hover:bg-gray-50/80 transition-colors cursor-pointer"
                                onClick={() => onSelectPatient(patient)}
                            >
                                <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xs">
                                        {patient.name.charAt(0)}
                                    </div>
                                    {patient.name}
                                </td>
                                <td className="px-6 py-4">{patient.age}, {patient.gender}</td>
                                <td className="px-6 py-4 text-gray-700">{patient.condition}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                                        ${patient.status === 'Critical' ? 'bg-red-50 text-red-600' : 
                                          patient.status === 'Stable' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                                        {patient.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{patient.lastVisit}</td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-gray-400 hover:text-brand-600">
                                        <MoreHorizontal size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Main App Component ---

type AuthView = 'LOGIN' | 'FORGOT_PASSWORD' | 'REGISTER';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({ isAuthenticated: false, user: null });
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  // Auth state management
  const [authView, setAuthView] = useState<AuthView>('LOGIN');

  const handleLogin = () => {
    setAuth({
      isAuthenticated: true,
      user: { name: 'Dr. John Doe', email: 'doctor@hospital.com', role: 'Doctor' }
    });
    setAuthView('LOGIN'); // Reset for next logout
  };

  const handleLogout = () => {
    setAuth({ isAuthenticated: false, user: null });
    setCurrentView(ViewState.DASHBOARD);
    setAuthView('LOGIN');
  };

  if (!auth.isAuthenticated) {
    switch (authView) {
      case 'REGISTER':
        return (
          <CreateAccountScreen 
            onNavigateToLogin={() => setAuthView('LOGIN')}
            onCreateAccount={handleLogin}
          />
        );
      case 'FORGOT_PASSWORD':
        return (
          <ForgotPasswordScreen 
            onBackToLogin={() => setAuthView('LOGIN')} 
          />
        );
      case 'LOGIN':
      default:
        return (
          <LoginScreen 
            onLogin={handleLogin} 
            onForgotPassword={() => setAuthView('FORGOT_PASSWORD')}
            onCreateAccount={() => setAuthView('REGISTER')}
          />
        );
    }
  }

  return (
    <DashboardLayout 
      currentView={currentView} 
      onChangeView={(view) => {
        setCurrentView(view);
        setSelectedPatient(null);
      }}
      onLogout={handleLogout}
    >
      {/* Dynamic Content */}
      {selectedPatient ? (
          <div className="h-[calc(100vh-140px)]">
             <button 
                onClick={() => setSelectedPatient(null)}
                className="mb-4 text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
             >
                ← Back to List
             </button>
             <PatientCard 
                patient={selectedPatient} 
                onClose={() => setSelectedPatient(null)} 
             />
          </div>
      ) : (
        <>
            {currentView === ViewState.DASHBOARD && <OverviewContent />}
            
            {currentView === ViewState.PATIENTS && (
                <PatientsTable onSelectPatient={setSelectedPatient} />
            )}

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