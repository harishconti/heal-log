import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex bg-gray-50">
      {/* Left Column: Brand & Marketing (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary-600 overflow-hidden">
        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 font-bold text-xl">
              H
            </div>
            <span className="text-xl font-bold tracking-tight">HealLog</span>
          </div>

          <div className="space-y-6 max-w-lg">
            <h1 className="text-4xl font-bold leading-tight">
              Modern care for <br /> modern practice.
            </h1>
            <p className="text-primary-100 text-lg leading-relaxed">
              Streamline your workflow with the dashboard built for high-performance medical teams.
            </p>

            {/* Trust Indicator */}
            <div className="flex items-center gap-3 py-4 px-5 bg-white/10 rounded-2xl backdrop-blur-md w-fit border border-white/20">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
              <div>
                <p className="font-semibold text-sm">HIPAA Compliant</p>
                <p className="text-xs text-primary-200">Enterprise-grade security</p>
              </div>
            </div>
          </div>

          <div className="text-sm text-primary-200">
            © {new Date().getFullYear()} HealLog Inc. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Column: Auth Forms */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[440px] space-y-8">
          {/* Mobile Logo (Visible only on small screens) */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              H
            </div>
          </div>

          {/* Render the Login/Register Page */}
          <Outlet />

          {/* Footer Links (Outside the card to break the block) */}
          <div className="flex justify-center gap-6 text-sm text-gray-500">
            <Link to="/privacy" className="hover:text-primary-600 hover:underline transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-primary-600 hover:underline transition-colors">Terms</Link>
            <Link to="/help" className="hover:text-primary-600 hover:underline transition-colors">Help</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
