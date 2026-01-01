import { Outlet, Link } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Logo and branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-3">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/25">
            <span className="text-white font-bold text-2xl">H</span>
          </div>
        </Link>
        <h1 className="mt-5 text-center text-2xl font-bold text-gray-900">
          HealLog
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          Patient Management for Healthcare Professionals
        </p>
      </div>

      {/* Auth card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-gray-200/50 rounded-2xl sm:px-10 border border-gray-100">
          <Outlet />
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-center text-xs text-gray-400">
        Secure, HIPAA-compliant patient management
      </p>
    </div>
  );
}
