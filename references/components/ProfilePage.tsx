import React from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Award, 
  BookOpen, 
  Lock, 
  Bell, 
  Clock, 
  ChevronRight, 
  PenSquare, 
  FileText, 
  Activity, 
  CheckCircle2, 
  Eye, 
  Search,
  Users
} from 'lucide-react';

const ActivityItem = ({ type, patient, date, status, icon: Icon, iconColor, bgColor }: any) => {
    const getStatusStyles = (status: string) => {
        switch(status) {
            case 'Completed': return 'bg-green-50 text-green-600';
            case 'Pending Review': return 'bg-yellow-50 text-yellow-600';
            case 'Archived': return 'bg-gray-100 text-gray-500';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    return (
        <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors group cursor-pointer border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-4 w-1/3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bgColor}`}>
                    <Icon size={18} className={iconColor} />
                </div>
                <span className="text-sm font-bold text-gray-900">{type}</span>
            </div>
            
            <div className="flex items-center gap-3 w-1/4">
                {patient ? (
                    <>
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700">
                           {patient.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <span className="text-sm text-gray-600 font-medium">{patient}</span>
                    </>
                ) : (
                    <span className="text-sm text-gray-400 italic">Internal Staff</span>
                )}
            </div>

            <div className="text-sm text-gray-500 w-1/4">
                {date}
            </div>

            <div className="flex items-center justify-between w-1/6">
                 <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${getStatusStyles(status)}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${status === 'Completed' ? 'bg-green-500' : status === 'Pending Review' ? 'bg-yellow-500' : 'bg-gray-400'}`}></div>
                    {status}
                 </span>
                 <button className="text-gray-300 hover:text-brand-600 transition-colors">
                    <Eye size={18} />
                 </button>
            </div>
        </div>
    );
};

const ProfilePage = () => {
  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Profile</h1>
          <p className="text-gray-500 mt-1">Manage your account settings and professional details.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-600/20 transition-all active:scale-95">
          <PenSquare size={16} />
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                {/* Personal Information Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-brand-50 p-2 rounded-lg text-brand-600">
                             <User size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
                            <p className="text-base font-bold text-gray-900">Dr. Alexander James Smith</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Medical License ID</label>
                            <p className="text-base font-bold text-gray-900">MED-883421-NY</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Specialty</label>
                            <p className="text-base font-bold text-gray-900">Cardiology & Internal Medicine</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Role</label>
                            <p className="text-base font-bold text-gray-900">Chief Medical Officer</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address</label>
                            <div className="flex items-center gap-2 text-gray-900 font-medium">
                                <Mail size={16} className="text-gray-400" />
                                a.smith@heallog.com
                            </div>
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Phone Number</label>
                             <div className="flex items-center gap-2 text-gray-900 font-medium">
                                <Phone size={16} className="text-gray-400" />
                                +1 (555) 012-3456
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full h-px bg-gray-100 mb-8"></div>

                {/* Biography Section */}
                <div className="mb-8">
                     <div className="flex items-center gap-3 mb-4">
                         <div className="bg-brand-50 p-2 rounded-lg text-brand-600">
                             <BookOpen size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Professional Biography</h3>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        Dr. Alexander Smith is a board-certified Cardiologist with over 15 years of clinical experience in interventional cardiology. Currently serving as the Chief Medical Officer at HealLog Medical Systems, he oversees clinical strategy and patient care protocols. Dr. Smith graduated with honors from Harvard Medical School and completed his residency at Johns Hopkins Hospital. He is passionate about integrating technology into healthcare to improve patient outcomes and operational efficiency.
                    </p>
                </div>

                 <div className="w-full h-px bg-gray-100 mb-8"></div>

                 {/* Credentials Section */}
                 <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-brand-50 p-2 rounded-lg text-brand-600">
                             <Award size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Education & Credentials</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="mt-1.5 w-2 h-2 rounded-full bg-brand-400 shrink-0"></div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900">Doctor of Medicine (M.D.)</h4>
                                <p className="text-xs text-gray-500">Harvard Medical School • 2004 - 2008</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="mt-1.5 w-2 h-2 rounded-full bg-gray-300 shrink-0"></div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900">Internal Medicine Residency</h4>
                                <p className="text-xs text-gray-500">Johns Hopkins Hospital • 2008 - 2012</p>
                            </div>
                        </div>
                         <div className="flex gap-4">
                            <div className="mt-1.5 w-2 h-2 rounded-full bg-gray-300 shrink-0"></div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900">Fellowship in Cardiology</h4>
                                <p className="text-xs text-gray-500">Cleveland Clinic • 2012 - 2015</p>
                            </div>
                        </div>
                    </div>
                 </div>
            </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-8">
            {/* Profile Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
                <div className="relative inline-block mb-4">
                    <img 
                        src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300" 
                        alt="Profile" 
                        className="w-32 h-32 rounded-full border-4 border-gray-50 shadow-md object-cover"
                    />
                    <div className="absolute bottom-1 right-1 bg-green-500 text-white p-1.5 rounded-full border-4 border-white">
                        <CheckCircle2 size={16} />
                    </div>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Dr. Alexander Smith</h2>
                <p className="text-brand-600 font-medium text-sm mb-1">Chief Medical Officer</p>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wide">Cardiology Department</p>

                <div className="mt-8 space-y-2">
                    <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium text-gray-700 group">
                        <div className="flex items-center gap-3">
                            <Lock size={18} className="text-gray-400 group-hover:text-gray-600" />
                            Change Password
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium text-gray-700 group">
                        <div className="flex items-center gap-3">
                            <Bell size={18} className="text-gray-400 group-hover:text-gray-600" />
                            Notification Preferences
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium text-gray-700 group">
                        <div className="flex items-center gap-3">
                            <Clock size={18} className="text-gray-400 group-hover:text-gray-600" />
                            Availability Settings
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Profile Completeness */}
            <div className="bg-brand-50/50 rounded-3xl border border-brand-100 p-6">
                <div className="flex justify-between items-end mb-2">
                    <h3 className="text-sm font-bold text-brand-900">Profile Completeness</h3>
                    <span className="text-sm font-bold text-brand-600">85%</span>
                </div>
                <div className="w-full bg-white rounded-full h-2.5 mb-3 border border-brand-100">
                    <div className="bg-brand-500 h-2.5 rounded-full w-[85%] shadow-[0_0_10px_rgba(14,165,233,0.3)]"></div>
                </div>
                <p className="text-xs text-brand-600/80 font-medium text-center">Add your publications to reach 100%</p>
            </div>
        </div>
      </div>

      {/* Activity History */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <div>
                <h3 className="text-lg font-bold text-gray-900">Activity History</h3>
                <p className="text-sm text-gray-500">Recent actions and consultations performed.</p>
             </div>
             <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search activity..." 
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500/20 placeholder-gray-400"
                />
             </div>
        </div>
        
        <div>
            <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 flex text-xs font-bold text-gray-400 uppercase tracking-wider">
                <div className="w-1/3 pl-4">Activity Type</div>
                <div className="w-1/4">Related Patient</div>
                <div className="w-1/4">Date & Time</div>
                <div className="w-1/6">Status</div>
            </div>
            
            <ActivityItem 
                type="Consultation Report"
                patient="John Doe"
                date="Oct 24, 2024 • 10:30 AM"
                status="Completed"
                icon={FileText}
                bgColor="bg-blue-50"
                iconColor="text-blue-600"
            />
            <ActivityItem 
                type="Prescription Update"
                patient="Sarah Williams"
                date="Oct 23, 2024 • 04:15 PM"
                status="Pending Review"
                icon={Activity}
                bgColor="bg-orange-50"
                iconColor="text-orange-600"
            />
            <ActivityItem 
                type="Lab Results Analysis"
                patient="Michael Johnson"
                date="Oct 23, 2024 • 02:00 PM"
                status="Completed"
                icon={Activity}
                bgColor="bg-purple-50"
                iconColor="text-purple-600"
            />
             <ActivityItem 
                type="Department Meeting"
                patient={null}
                date="Oct 22, 2024 • 09:00 AM"
                status="Archived"
                icon={Users}
                bgColor="bg-blue-50"
                iconColor="text-blue-600"
            />
        </div>

        <div className="p-4 border-t border-gray-50 text-center">
            <button className="text-brand-600 text-sm font-bold hover:text-brand-700">View Full Activity Log</button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;