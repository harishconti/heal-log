import { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
  Crown,
  ChevronDown,
  Sparkles,
  Settings,
  Bell,
} from 'lucide-react';
import { useAuthStore } from '../store';
import { Badge } from '../components/ui';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Patients', href: '/patients', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, proOnly: true },
  { name: 'Profile', href: '/profile', icon: User },
];

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isPro = user?.plan === 'pro';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100">
      {/* Skip navigation link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          role="button"
          aria-label="Close sidebar"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Escape' && setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl shadow-gray-200/50 transform transition-transform duration-300 ease-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-shadow">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <span className="text-xl font-bold text-gray-900">HealLog</span>
          </Link>
          <button
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-6 space-y-1.5">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
            const isLocked = item.proOnly && !isPro;

            return (
              <Link
                key={item.name}
                to={isLocked ? '/upgrade' : item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                  transition-all duration-200 relative
                  ${isActive
                    ? 'bg-gradient-to-r from-primary-50 to-primary-100/50 text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                  ${isLocked ? 'opacity-60' : ''}
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full" />
                )}
                <item.icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                {item.name}
                {item.proOnly && !isPro && (
                  <Crown className="h-4 w-4 ml-auto text-amber-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Plan indicator */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">Current Plan</span>
              <Badge variant={isPro ? 'primary' : 'default'} className="font-semibold">
                {isPro ? 'Pro' : 'Basic'}
              </Badge>
            </div>
            {!isPro && (
              <Link
                to="/upgrade"
                className="
                  flex items-center justify-center gap-2 w-full
                  px-4 py-3 rounded-xl
                  bg-gradient-to-r from-primary-600 to-primary-500
                  text-white text-sm font-semibold
                  shadow-lg shadow-primary-500/30
                  hover:shadow-xl hover:shadow-primary-500/40
                  hover:from-primary-500 hover:to-primary-400
                  transition-all duration-200
                "
              >
                <Sparkles className="h-4 w-4" />
                Upgrade to Pro
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72 min-h-screen flex flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <button
              className="lg:hidden p-2.5 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="flex-1" />

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Notifications placeholder */}
              <button className="relative p-2.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary-500 rounded-full" />
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  aria-label="User menu"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-white font-semibold text-sm">
                      {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-gray-900">{user?.full_name}</p>
                    <p className="text-xs text-gray-500">{user?.medical_specialty || 'Doctor'}</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 py-2 z-50 animate-in fade-in-0 zoom-in-95">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user?.full_name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4 text-gray-400" />
                          Account Settings
                        </Link>
                      </div>
                      <div className="border-t border-gray-100 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 p-6 lg:p-12 bg-gray-50/50" tabIndex={-1}>
          <div className="max-w-[1600px] mx-auto space-y-8">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-100 bg-white/50 backdrop-blur-sm py-4 px-4 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-gray-400">
            <span>HealLog - HIPAA Compliant Patient Management</span>
            <span>Version 1.1</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
