import React from 'react';
import {
  Bell,
  Menu,
  X,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { ViewState, User } from '../types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onLogout: () => void;
  user: User | null;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  currentView,
  onChangeView,
  onLogout,
  user
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const NavLink = ({ view, label }: { view?: ViewState; label: string }) => {
    const isActive = view === currentView;
    return (
      <button
        onClick={() => view && onChangeView(view)}
        className={`px-3 py-2 text-sm font-medium transition-colors rounded-lg ${
          isActive 
            ? 'text-brand-600 bg-brand-50' 
            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-brand-500/20 shadow-lg">
              H
            </div>
            <span className="text-2xl font-bold text-gray-900 tracking-tight">HealLog</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink view={ViewState.DASHBOARD} label="Dashboard" />
            <NavLink view={ViewState.PATIENTS} label="Patients" />
            <NavLink view={ViewState.ANALYTICS} label="Analytics" />
            <NavLink view={ViewState.PROFILE} label="Profile" />
            <NavLink view={ViewState.SETTINGS} label="Settings" />
          </nav>

          {/* Right Section */}
          <div className="hidden md:flex items-center gap-6">
            <button className="relative text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-50 rounded-full">
              <Bell size={22} />
              <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center gap-4 pl-6 border-l border-gray-100 h-10">
              <div className="text-right hidden lg:block leading-tight">
                <p className="text-sm font-bold text-gray-900">{user?.full_name || 'Doctor'}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{user?.medical_specialty || user?.role || 'Medical Professional'}</p>
              </div>
              <div className="relative">
                <div className="w-11 h-11 rounded-full border-[3px] border-white shadow-md bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-lg">
                  {user?.full_name?.charAt(0).toUpperCase() || 'D'}
                </div>
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-gray-500 p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white absolute w-full shadow-lg">
            <div className="p-4 space-y-2">
              <button onClick={() => onChangeView(ViewState.DASHBOARD)} className="block w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-600 font-medium">Dashboard</button>
              <button onClick={() => onChangeView(ViewState.PATIENTS)} className="block w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-600 font-medium">Patients</button>
              <button onClick={() => onChangeView(ViewState.ANALYTICS)} className="block w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-600 font-medium">Analytics</button>
              <button onClick={() => onChangeView(ViewState.PROFILE)} className="block w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-600 font-medium">Profile</button>
              <button onClick={() => onChangeView(ViewState.SETTINGS)} className="block w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-600 font-medium">Settings</button>
              <div className="border-t border-gray-100 pt-4 mt-2">
                 <button onClick={onLogout} className="text-red-600 font-medium px-4 py-2 w-full text-left">Sign Out</button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          {children}
        </div>
      </main>

       {/* Footer */}
       <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400 font-medium">
            <p>© 2024 HealLog Medical Systems. All healthcare data is encrypted.</p>
            <div className="flex gap-8">
                <a href="#" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-gray-600 transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-gray-600 transition-colors">Support Center</a>
            </div>
        </div>
       </footer>
    </div>
  );
};

export default DashboardLayout;