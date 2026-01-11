import { Outlet, Link } from 'react-router-dom';
import { Shield, Activity, Users } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtNi42MjcgNS4zNzMtMTIgMTItMTJzMTIgNS4zNzMgMTIgMTItNS4zNzMgMTItMTIgMTItMTItNS4zNzMtMTItMTJ6TTAgMTZjMC02LjYyNyA1LjM3My0xMiAxMi0xMnMxMiA1LjM3MyAxMiAxMi01LjM3MyAxMi0xMiAxMi0xMi01LjM3My0xMi0xMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        {/* Subtle glowing orb */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px]" />
      </div>

      {/* Main Container - Centered Two Column Layout */}
      <div className="relative w-full max-w-7xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">

        {/* Left Column: Hero & Trust Indicators */}
        <div className="text-white space-y-6 lg:space-y-10 lg:pr-8 lg:text-left text-center">

          {/* Brand Header */}
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 group-hover:scale-105 transition-transform duration-300">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">HealLog</span>
          </Link>

          {/* Hero Text */}
          <div className="space-y-4 lg:space-y-6">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Modern care for <br className="hidden lg:block" />
              <span className="text-blue-200">modern practice.</span>
            </h1>
            <p className="text-lg sm:text-xl text-indigo-100 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
              Streamline your workflow with the dashboard built for high-performance medical teams. Secure, fast, and HIPAA-compliant.
            </p>
          </div>

          {/* Stats Row - 3 Columns - Hidden on mobile to prioritize login */}
          <div className="hidden sm:grid grid-cols-3 gap-6 border-y border-white/10 py-8">
            <StatItem icon={Users} value="10K+" label="Active Users" />
            <StatItem icon={Activity} value="99.9%" label="Uptime" />
            <StatItem icon={Shield} value="HIPAA" label="Compliant" />
          </div>

          {/* Feature Pills - Hidden on mobile to prioritize login */}
          <div className="hidden sm:flex flex-wrap gap-3 justify-center lg:justify-start">
            <FeaturePill text="Enterprise Security" />
            <FeaturePill text="Real-time Analytics" />
            <FeaturePill text="Patient Management" />
            <FeaturePill text="Clinical Notes" />
          </div>
        </div>

        {/* Right Column: Login Card */}
        <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden relative border border-white/20">
             {/* Top accent line */}
             <div className="h-2 bg-gradient-to-r from-indigo-500 to-blue-500 w-full" />
             <div className="p-8 sm:p-10">
               <Outlet />
             </div>
          </div>
          {/* Footer Links below card */}
          <div className="mt-6 flex justify-center gap-6 text-sm text-indigo-200/60 font-medium">
             <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
             <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
             <Link to="/help" className="hover:text-white transition-colors">Help</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ icon: Icon, value, label }: { icon: any, value: string, label: string }) {
  return (
    <div className="text-center lg:text-left space-y-1">
      <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
         <Icon className="w-5 h-5 text-blue-300" />
      </div>
      <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{value}</div>
      <div className="text-xs font-semibold text-blue-200 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function FeaturePill({ text }: { text: string }) {
  return (
    <div className="px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm font-medium text-white hover:bg-white/20 transition-colors cursor-default select-none backdrop-blur-sm">
      {text}
    </div>
  );
}
