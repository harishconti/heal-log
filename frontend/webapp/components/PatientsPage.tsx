import React from 'react';
import { 
  Search, 
  Plus, 
  Users, 
  AlertCircle, 
  Calendar, 
  Clock, 
  Heart,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronNext,
  Hourglass
} from 'lucide-react';
import { Patient } from '../types';
import { MOCK_PATIENTS } from '../constants';

interface PatientsPageProps {
  onSelectPatient: (patient: Patient) => void;
  onAddNewPatient?: () => void;
}

const StatCard = ({ label, value, icon: Icon, colorClass, bgClass }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 transition-transform hover:-translate-y-1 duration-200 h-28">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${bgClass}`}>
      <Icon size={26} className={colorClass} />
    </div>
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
    </div>
  </div>
);

const PatientListItem = ({ patient, onClick }: { patient: Patient; onClick: () => void }) => {
  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CRITICAL': return { label: 'CRITICAL', className: 'bg-red-50 text-red-600 border-red-100' };
      case 'STABLE': return { label: 'STABLE', className: 'bg-green-50 text-emerald-600 border-emerald-100' };
      case 'RECOVERING': return { label: 'POST-OP', className: 'bg-blue-50 text-blue-600 border-blue-100' };
      default: return { label: 'FOLLOW-UP', className: 'bg-gray-100 text-gray-600 border-gray-200' };
    }
  };

  const statusConfig = getStatusConfig(patient.status);
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2);
  
  // Deterministic color based on name length for consistent demo UI
  const colors = [
    'bg-blue-100 text-blue-600', 
    'bg-purple-100 text-purple-600', 
    'bg-orange-100 text-orange-600', 
    'bg-emerald-100 text-emerald-600',
    'bg-indigo-100 text-indigo-600'
  ];
  const colorIndex = patient.name.length % colors.length;
  const avatarColor = colors[colorIndex];
  
  // Mock "Favorite" logic for demo visual matching
  const isFavorite = patient.name.includes('Jenkins') || patient.name.includes('Dao');

  return (
    <div 
      onClick={onClick}
      className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
    >
      <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-sm sm:text-lg font-bold shrink-0 ${avatarColor}`}>
          {getInitials(patient.name)}
        </div>
        
        <div>
           <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
                {patient.name}
              </h3>
              {isFavorite && <Heart size={16} className="fill-red-500 text-red-500" />}
           </div>
           <div className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm font-medium">
              <Clock size={14} />
              <span>Last Visit: {patient.lastVisit}</span>
           </div>
        </div>
      </div>

      <div className="flex items-center justify-between w-full sm:w-auto sm:gap-6 pl-[4.5rem] sm:pl-0">
         <span className={`px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold border uppercase tracking-wide ${statusConfig.className}`}>
            {statusConfig.label}
         </span>
         <div className="text-gray-300 group-hover:text-brand-400 transition-colors">
            <ChevronNext size={20} />
         </div>
      </div>
    </div>
  );
};

const PatientsPage: React.FC<PatientsPageProps> = ({ onSelectPatient, onAddNewPatient }) => {
  // Mock current date
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header Section */}
      <div className="flex flex-col gap-6">
        <div>
           <p className="text-gray-500 font-medium mb-1 text-sm">{today}</p>
           <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Good Morning, Dr. Smith</h1>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           {/* Stats Row */}
           <div className="w-full"></div> {/* Spacer for alignment if needed, or stats could go here */}
           
           <div className="flex w-full md:w-auto items-center gap-3">
              <div className="relative flex-1 md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search patients by name or ID..." 
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm"
                />
              </div>
              <button 
                onClick={onAddNewPatient}
                className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-brand-600/20 transition-all active:scale-95 whitespace-nowrap"
              >
                <Plus size={20} />
                New Patient
              </button>
           </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          label="Total Patients" 
          value="145" 
          icon={Users} 
          bgClass="bg-blue-50" 
          colorClass="text-brand-600" 
        />
        <StatCard 
          label="Critical" 
          value="12" 
          icon={AlertCircle} 
          bgClass="bg-red-50" 
          colorClass="text-red-500" 
        />
        <StatCard 
          label="Appointments" 
          value="24" 
          icon={Calendar} 
          bgClass="bg-green-50" 
          colorClass="text-emerald-600" 
        />
        <StatCard 
          label="Pending Reports" 
          value="8" 
          icon={Hourglass} 
          bgClass="bg-amber-50" 
          colorClass="text-amber-600" 
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-end border-b border-gray-200">
        <div className="flex w-full sm:w-auto overflow-x-auto no-scrollbar">
          {['All Patients', 'Favorites', 'Critical', 'Department'].map((tab, index) => (
            <button 
              key={tab}
              className={`pb-4 px-2 sm:px-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                index === 0 
                  ? 'border-brand-600 text-brand-600' 
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="hidden sm:block pb-4 text-sm font-medium text-gray-500">
          Total: <span className="text-gray-900 font-bold">145 Patients</span>
        </div>
      </div>

      {/* Patients List */}
      <div className="space-y-4">
        {MOCK_PATIENTS.map((patient) => (
          <PatientListItem 
            key={patient.id} 
            patient={patient} 
            onClick={() => onSelectPatient(patient)} 
          />
        ))}
         {/* Demo duplicates to match list length in image */}
         <PatientListItem 
            patient={{...MOCK_PATIENTS[0], id: 'P-1006', name: 'Sarah Jenkins', status: 'Critical', lastVisit: 'Today, 9:00 AM'}} 
            onClick={() => {}} 
        />
        <PatientListItem 
            patient={{...MOCK_PATIENTS[1], id: 'P-1007', name: 'Michael Ross', status: 'Stable', lastVisit: 'Oct 22, 2023'}} 
            onClick={() => {}} 
        />
        <PatientListItem 
            patient={{...MOCK_PATIENTS[3], id: 'P-1008', name: 'Emily Dao', status: 'Recovering', lastVisit: 'Oct 15, 2023'}} 
            onClick={() => {}} 
        />
         <PatientListItem 
            patient={{...MOCK_PATIENTS[2], id: 'P-1009', name: 'David Kim', status: 'Stable', lastVisit: 'Sep 28, 2023'}} 
            onClick={() => {}} 
        />
        <PatientListItem 
            patient={{...MOCK_PATIENTS[4], id: 'P-1010', name: 'Anita Lopez', status: 'Stable', lastVisit: 'Sep 20, 2023'}} 
            onClick={() => {}} 
        />
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-4">
        <p className="text-sm text-gray-500">
          Showing <span className="font-bold text-gray-900">10</span> of <span className="font-bold text-gray-900">145</span> patients
        </p>
        <div className="flex items-center gap-2">
          <button className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-600 disabled:opacity-50 bg-white shadow-sm transition-colors">
            <ChevronLeft size={18} />
          </button>
          <div className="hidden sm:flex items-center gap-1">
            <button className="w-10 h-10 bg-brand-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/30">1</button>
            <button className="w-10 h-10 border border-transparent text-gray-500 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors">2</button>
            <button className="w-10 h-10 border border-transparent text-gray-500 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors">3</button>
            <span className="text-gray-400 px-2 font-medium">...</span>
            <button className="w-10 h-10 border border-transparent text-gray-500 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors">29</button>
          </div>
          <button className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 bg-white shadow-sm transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientsPage;