import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Stethoscope, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  Menu,
  X
} from 'lucide-react';
import { ViewState } from '../types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onLogout: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  currentView, 
  onChangeView, 
  onLogout 
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => {
        onChangeView(view);
        setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        currentView === view 
          ? 'bg-brand-50 text-brand-700 font-semibold' 
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon size={20} className={currentView === view ? 'text-brand-600' : 'text-gray-400'} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-2 mb-10 px-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold">
              H
            </div>
            <span className="text-xl font-bold text-gray-900">HealLog</span>
            <button 
              className="ml-auto lg:hidden text-gray-500"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          <nav className="space-y-1 flex-1">
            <NavItem view={ViewState.DASHBOARD} icon={LayoutDashboard} label="Overview" />
            <NavItem view={ViewState.PATIENTS} icon={Users} label="Patients" />
            <NavItem view={ViewState.AI_SCRIBE} icon={Stethoscope} label="AI Insights" />
          </nav>

          <div className="pt-6 border-t border-gray-100 space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors">
              <Settings size={20} className="text-gray-400" />
              <span>Settings</span>
            </button>
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-gray-500 hover:text-gray-700"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-gray-800 hidden sm:block">
              {currentView === ViewState.DASHBOARD ? 'Dashboard Overview' : 
               currentView === ViewState.PATIENTS ? 'Patient Management' : 'AI Assistant'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 w-64"
              />
            </div>
            <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-8 h-8 bg-brand-100 rounded-full border border-brand-200 flex items-center justify-center text-brand-700 font-medium text-sm">
              DR
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <main className="flex-1 overflow-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
