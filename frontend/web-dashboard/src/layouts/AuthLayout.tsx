import { Outlet, Link } from 'react-router-dom';
import { Shield, BarChart2, Users, FileText, Activity, ShieldCheck } from 'lucide-react';

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
      {/* md:grid-cols-2 for Tablet split (768px+) */}
      <div className="relative w-full max-w-7xl grid md:grid-cols-2 gap-8 lg:gap-16 items-center">

        {/* Left Column: Hero & Trust Indicators */}
        <div className="text-white space-y-8 lg:space-y-10 lg:pr-8 text-center md:text-left">

          {/* Brand Header */}
          <Link to="/" className="inline-flex items-center gap-3 group justify-center md:justify-start">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center font-bold text-lg text-white">
              H
            </div>
            <span className="text-base font-semibold tracking-wide">HealLog</span>
          </Link>

          {/* Hero Text */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold leading-[1.2]">
              Modern care for <br className="hidden lg:block" />
              modern practice.
            </h1>
            <p className="text-base text-white/85 max-w-lg mx-auto md:mx-0 leading-relaxed">
              Streamline your workflow with the dashboard built for high-performance medical teams. Secure, fast, and HIPAA-compliant.
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-5 md:gap-10">
            <StatItem icon={Users} value="10K+" label="Active Users" />
            <StatItem icon={Activity} value="99.9%" label="Uptime" />
            <StatItem icon={ShieldCheck} value="HIPAA" label="Compliant" />
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            <FeaturePill text="Enterprise Security" icon={Shield} />
            <FeaturePill text="Real-time Analytics" icon={BarChart2} />
            <FeaturePill text="Patient Management" icon={Users} />
            <FeaturePill text="Clinical Notes" icon={FileText} />
          </div>
        </div>

        {/* Right Column: Login Card */}
        <div className="w-full max-w-md mx-auto md:mx-0 md:ml-auto">
          <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden relative animate-slideIn p-8">
             <Outlet />

             {/* Footer Links inside the card */}
             <div className="mt-6 pt-4 border-t border-slate-100 flex justify-center gap-6 text-[12px] text-[#94a3b8] font-medium">
               <Link to="/privacy" className="hover:text-[#2563eb] transition-colors">Privacy</Link>
               <Link to="/terms" className="hover:text-[#2563eb] transition-colors">Terms</Link>
               <Link to="/help" className="hover:text-[#2563eb] transition-colors">Help</Link>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ icon: Icon, value, label }: { icon: any, value: string, label: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center mx-auto mb-3">
         <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="text-3xl font-bold text-white mb-1.5">{value}</div>
      <div className="text-[13px] font-medium text-white/75 uppercase tracking-wide">{label}</div>
    </div>
  );
}

function FeaturePill({ text, icon: Icon }: { text: string, icon: any }) {
  return (
    <div className="px-4 py-2 rounded-full bg-blue-400/20 border border-blue-400/40 text-[13px] font-medium text-white/90 hover:bg-blue-400/30 hover:border-blue-400/60 transition-all cursor-default select-none backdrop-blur-md flex items-center gap-2">
      <Icon className="w-3.5 h-3.5" />
      {text}
    </div>
  );
}
